/**
 * Font Flux JS : SVG Path Conversion
 *
 * Converts between font glyph contour data and SVG path `d` attribute strings.
 * Supports both TrueType (quadratic) and CFF (cubic) contour formats.
 *
 * Coordinates are kept in font-space (Y-up). To render in SVG (Y-down),
 * apply transform="scale(1,-1)" on the <path> or parent element.
 */

// ===========================================================================
//  READ — contours → SVG path string
// ===========================================================================

/**
 * Convert glyph contours to an SVG path `d` string.
 * Auto-detects TrueType vs CFF contour format.
 *
 * @param {Array} contours - Array of contour arrays (TrueType points or CFF commands)
 * @returns {string} SVG path data string
 */
export function contoursToSVGPath(contours) {
	if (!contours || contours.length === 0) return '';

	const parts = [];

	for (const contour of contours) {
		if (!contour || contour.length === 0) continue;

		// Detect format: CFF commands have a `type` property
		if (contour[0].type) {
			parts.push(cffContourToSVG(contour));
		} else {
			parts.push(ttfContourToSVG(contour));
		}
	}

	return parts.join(' ');
}

/**
 * Convert a single CFF contour (commands) to SVG path fragment.
 */
function cffContourToSVG(contour) {
	const d = [];

	for (const cmd of contour) {
		switch (cmd.type) {
			case 'M':
				d.push(`M${n(cmd.x)} ${n(cmd.y)}`);
				break;
			case 'L':
				d.push(`L${n(cmd.x)} ${n(cmd.y)}`);
				break;
			case 'C':
				d.push(
					`C${n(cmd.x1)} ${n(cmd.y1)} ${n(cmd.x2)} ${n(cmd.y2)} ${n(cmd.x)} ${n(cmd.y)}`,
				);
				break;
		}
	}

	d.push('Z');
	return d.join(' ');
}

/**
 * Convert a single TrueType contour (points with onCurve) to SVG path fragment.
 * On-curve points become L; off-curve points between on-curves become Q.
 * Consecutive off-curve points use implied on-curve midpoints.
 */
function ttfContourToSVG(contour) {
	if (contour.length === 0) return '';

	const d = [];
	const len = contour.length;

	// Find the first on-curve point to start from
	let startIdx = 0;
	for (let i = 0; i < len; i++) {
		if (contour[i].onCurve) {
			startIdx = i;
			break;
		}
	}

	const first = contour[startIdx];
	d.push(`M${n(first.x)} ${n(first.y)}`);

	let i = 1;
	while (i < len) {
		const idx = (startIdx + i) % len;
		const pt = contour[idx];

		if (pt.onCurve) {
			d.push(`L${n(pt.x)} ${n(pt.y)}`);
			i++;
		} else {
			// Off-curve: look ahead for the next point
			const nextIdx = (startIdx + i + 1) % len;
			const next = contour[nextIdx];

			if (next.onCurve) {
				// Simple quadratic: off-curve control + on-curve end
				d.push(`Q${n(pt.x)} ${n(pt.y)} ${n(next.x)} ${n(next.y)}`);
				i += 2;
			} else {
				// Consecutive off-curve: implied on-curve midpoint
				const midX = (pt.x + next.x) / 2;
				const midY = (pt.y + next.y) / 2;
				d.push(`Q${n(pt.x)} ${n(pt.y)} ${n(midX)} ${n(midY)}`);
				i++;
			}
		}
	}

	// Close back to the start — handle final off-curve wrapping
	// If the last segment didn't land on the start point, we may need
	// to emit a final Q back to the start
	const lastProcessed = contour[(startIdx + len - 1) % len];
	if (!lastProcessed.onCurve) {
		// The loop above may have emitted a Q to a midpoint but not back to start
		// Check if we need to close with a Q to the first on-curve point
		d.push(
			`Q${n(lastProcessed.x)} ${n(lastProcessed.y)} ${n(first.x)} ${n(first.y)}`,
		);
	}

	d.push('Z');
	return d.join(' ');
}

// ===========================================================================
//  WRITE — SVG path string → contours
// ===========================================================================

/**
 * Parse an SVG path `d` string and convert to font contours.
 *
 * @param {string} pathData - SVG path `d` attribute string
 * @param {'truetype'|'cff'} format - Target contour format
 * @returns {Array} Array of contours in the requested format
 */
export function svgPathToContours(pathData, format = 'cff') {
	const commands = parseSVGPath(pathData);
	if (commands.length === 0) return [];

	// Split commands into contours (each M starts a new contour)
	const rawContours = [];
	let current = null;

	for (const cmd of commands) {
		if (cmd.op === 'M') {
			if (current && current.length > 0) {
				rawContours.push(current);
			}
			current = [cmd];
		} else if (cmd.op === 'Z') {
			if (current && current.length > 0) {
				rawContours.push(current);
			}
			current = null;
		} else if (current) {
			current.push(cmd);
		}
	}
	// Flush if no Z at end
	if (current && current.length > 0) {
		rawContours.push(current);
	}

	if (format === 'truetype') {
		return rawContours.map((cmds) => svgCommandsToTTF(cmds));
	}
	return rawContours.map((cmds) => svgCommandsToCFF(cmds));
}

/**
 * Convert parsed SVG commands (one contour) to CFF format.
 * Q (quadratic) gets promoted to C (cubic) — lossless.
 */
function svgCommandsToCFF(cmds) {
	const contour = [];

	for (const cmd of cmds) {
		switch (cmd.op) {
			case 'M':
				contour.push({ type: 'M', x: cmd.x, y: cmd.y });
				break;
			case 'L':
				contour.push({ type: 'L', x: cmd.x, y: cmd.y });
				break;
			case 'C':
				contour.push({
					type: 'C',
					x1: cmd.x1,
					y1: cmd.y1,
					x2: cmd.x2,
					y2: cmd.y2,
					x: cmd.x,
					y: cmd.y,
				});
				break;
			case 'Q': {
				// Promote quadratic to cubic: degree elevation
				// Get the current point (previous command's endpoint)
				const prev = contour[contour.length - 1];
				const px = prev ? prev.x : 0;
				const py = prev ? prev.y : 0;
				// Cubic control points from quadratic: CP1 = P0 + 2/3*(QCP - P0), CP2 = P2 + 2/3*(QCP - P2)
				const cp1x = px + (2 / 3) * (cmd.x1 - px);
				const cp1y = py + (2 / 3) * (cmd.y1 - py);
				const cp2x = cmd.x + (2 / 3) * (cmd.x1 - cmd.x);
				const cp2y = cmd.y + (2 / 3) * (cmd.y1 - cmd.y);
				contour.push({
					type: 'C',
					x1: cp1x,
					y1: cp1y,
					x2: cp2x,
					y2: cp2y,
					x: cmd.x,
					y: cmd.y,
				});
				break;
			}
		}
	}

	return contour;
}

/**
 * Convert parsed SVG commands (one contour) to TrueType format.
 * C (cubic) gets approximated to Q (quadratic).
 * Q maps directly to off-curve + on-curve points.
 */
function svgCommandsToTTF(cmds) {
	const points = [];

	for (const cmd of cmds) {
		switch (cmd.op) {
			case 'M':
				points.push({ x: cmd.x, y: cmd.y, onCurve: true });
				break;
			case 'L':
				points.push({ x: cmd.x, y: cmd.y, onCurve: true });
				break;
			case 'Q':
				// Off-curve control point + on-curve endpoint
				points.push({ x: cmd.x1, y: cmd.y1, onCurve: false });
				points.push({ x: cmd.x, y: cmd.y, onCurve: true });
				break;
			case 'C': {
				// Approximate cubic with quadratic(s)
				const prev = points[points.length - 1];
				const px = prev ? prev.x : 0;
				const py = prev ? prev.y : 0;
				const quads = cubicToQuadratics(
					px,
					py,
					cmd.x1,
					cmd.y1,
					cmd.x2,
					cmd.y2,
					cmd.x,
					cmd.y,
				);
				for (const q of quads) {
					points.push({ x: q.cx, y: q.cy, onCurve: false });
					points.push({ x: q.x, y: q.y, onCurve: true });
				}
				break;
			}
		}
	}

	return points;
}

// ===========================================================================
//  SVG PATH PARSER
// ===========================================================================

/**
 * Parse an SVG path `d` string into an array of absolute commands.
 * Supports: M, L, H, V, C, S, Q, T, Z (and lowercase relative variants).
 *
 * Returns: Array of { op, x, y, x1?, y1?, x2?, y2? }
 */
function parseSVGPath(d) {
	const commands = [];
	// Tokenize: split into command letters and numbers
	const tokens = d.match(
		/[MmLlHhVvCcSsQqTtZz]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g,
	);
	if (!tokens) return commands;

	let cx = 0,
		cy = 0; // current point
	let startX = 0,
		startY = 0; // subpath start
	let prevCmd = '';
	let prevCp2x = 0,
		prevCp2y = 0; // for S/T smooth reflection

	let i = 0;

	function num() {
		return parseFloat(tokens[i++]);
	}

	while (i < tokens.length) {
		let cmd = tokens[i];

		// If it's not a command letter, repeat the previous command
		if (!/[A-Za-z]/.test(cmd)) {
			cmd = prevCmd;
		} else {
			i++;
		}

		const isRel = cmd === cmd.toLowerCase();
		const op = cmd.toUpperCase();

		switch (op) {
			case 'M': {
				let x = num(),
					y = num();
				if (isRel) {
					x += cx;
					y += cy;
				}
				commands.push({ op: 'M', x, y });
				cx = startX = x;
				cy = startY = y;
				prevCmd = isRel ? 'l' : 'L'; // subsequent coords are lineto
				break;
			}
			case 'L': {
				let x = num(),
					y = num();
				if (isRel) {
					x += cx;
					y += cy;
				}
				commands.push({ op: 'L', x, y });
				cx = x;
				cy = y;
				prevCmd = cmd;
				break;
			}
			case 'H': {
				let x = num();
				if (isRel) x += cx;
				commands.push({ op: 'L', x, y: cy });
				cx = x;
				prevCmd = cmd;
				break;
			}
			case 'V': {
				let y = num();
				if (isRel) y += cy;
				commands.push({ op: 'L', x: cx, y });
				cy = y;
				prevCmd = cmd;
				break;
			}
			case 'C': {
				let x1 = num(),
					y1 = num(),
					x2 = num(),
					y2 = num(),
					x = num(),
					y = num();
				if (isRel) {
					x1 += cx;
					y1 += cy;
					x2 += cx;
					y2 += cy;
					x += cx;
					y += cy;
				}
				commands.push({ op: 'C', x1, y1, x2, y2, x, y });
				prevCp2x = x2;
				prevCp2y = y2;
				cx = x;
				cy = y;
				prevCmd = cmd;
				break;
			}
			case 'S': {
				// Smooth cubic: reflect previous CP2
				let x1 = 2 * cx - prevCp2x;
				let y1 = 2 * cy - prevCp2y;
				if (prevCmd.toUpperCase() !== 'C' && prevCmd.toUpperCase() !== 'S') {
					x1 = cx;
					y1 = cy;
				}
				let x2 = num(),
					y2 = num(),
					x = num(),
					y = num();
				if (isRel) {
					x2 += cx;
					y2 += cy;
					x += cx;
					y += cy;
				}
				commands.push({ op: 'C', x1, y1, x2, y2, x, y });
				prevCp2x = x2;
				prevCp2y = y2;
				cx = x;
				cy = y;
				prevCmd = cmd;
				break;
			}
			case 'Q': {
				let x1 = num(),
					y1 = num(),
					x = num(),
					y = num();
				if (isRel) {
					x1 += cx;
					y1 += cy;
					x += cx;
					y += cy;
				}
				commands.push({ op: 'Q', x1, y1, x, y });
				prevCp2x = x1;
				prevCp2y = y1;
				cx = x;
				cy = y;
				prevCmd = cmd;
				break;
			}
			case 'T': {
				// Smooth quadratic: reflect previous QCP
				let x1 = 2 * cx - prevCp2x;
				let y1 = 2 * cy - prevCp2y;
				if (prevCmd.toUpperCase() !== 'Q' && prevCmd.toUpperCase() !== 'T') {
					x1 = cx;
					y1 = cy;
				}
				let x = num(),
					y = num();
				if (isRel) {
					x += cx;
					y += cy;
				}
				commands.push({ op: 'Q', x1, y1, x, y });
				prevCp2x = x1;
				prevCp2y = y1;
				cx = x;
				cy = y;
				prevCmd = cmd;
				break;
			}
			case 'Z': {
				commands.push({ op: 'Z' });
				cx = startX;
				cy = startY;
				prevCmd = cmd;
				break;
			}
			default:
				// Skip unknown
				prevCmd = cmd;
				break;
		}
	}

	return commands;
}

// ===========================================================================
//  CUBIC → QUADRATIC APPROXIMATION
// ===========================================================================

/**
 * Approximate a cubic Bézier with one or more quadratic Béziers.
 * Uses mid-point approximation with recursive subdivision when error is too high.
 *
 * @returns {Array<{cx, cy, x, y}>} Quadratic segments (control point + endpoint)
 */
function cubicToQuadratics(x0, y0, x1, y1, x2, y2, x3, y3, depth = 0) {
	// Try single quadratic approximation:
	// QCP = average of the two cubic control points (weighted intersection)
	const qcx = (3 * (x1 + x2) - x0 - x3) / 4;
	const qcy = (3 * (y1 + y2) - y0 - y3) / 4;

	// Measure error: max deviation of cubic CPs from the quadratic curve
	// Use the distance between C1 and the quadratic's 1/3 point,
	// and C2 and the 2/3 point
	const q1x = x0 + (2 / 3) * (qcx - x0);
	const q1y = y0 + (2 / 3) * (qcy - y0);
	const q2x = x3 + (2 / 3) * (qcx - x3);
	const q2y = y3 + (2 / 3) * (qcy - y3);

	const err1 = Math.hypot(x1 - q1x, y1 - q1y);
	const err2 = Math.hypot(x2 - q2x, y2 - q2y);
	const maxErr = Math.max(err1, err2);

	// Threshold: 0.5 units is sub-pixel for most font sizes
	if (maxErr <= 0.5 || depth >= 8) {
		return [{ cx: qcx, cy: qcy, x: x3, y: y3 }];
	}

	// Subdivide at t=0.5 using de Casteljau
	const mx01 = (x0 + x1) / 2,
		my01 = (y0 + y1) / 2;
	const mx12 = (x1 + x2) / 2,
		my12 = (y1 + y2) / 2;
	const mx23 = (x2 + x3) / 2,
		my23 = (y2 + y3) / 2;
	const mx012 = (mx01 + mx12) / 2,
		my012 = (my01 + my12) / 2;
	const mx123 = (mx12 + mx23) / 2,
		my123 = (my12 + my23) / 2;
	const mx0123 = (mx012 + mx123) / 2,
		my0123 = (my012 + my123) / 2;

	const left = cubicToQuadratics(
		x0,
		y0,
		mx01,
		my01,
		mx012,
		my012,
		mx0123,
		my0123,
		depth + 1,
	);
	const right = cubicToQuadratics(
		mx0123,
		my0123,
		mx123,
		my123,
		mx23,
		my23,
		x3,
		y3,
		depth + 1,
	);
	return left.concat(right);
}

// ===========================================================================
//  HELPERS
// ===========================================================================

/**
 * Format a number for SVG output — strip trailing zeros, limit precision.
 */
function n(val) {
	// Round to 2 decimal places to keep paths clean
	const rounded = Math.round(val * 100) / 100;
	return rounded === Math.floor(rounded)
		? String(rounded)
		: rounded.toFixed(2).replace(/0+$/, '');
}
