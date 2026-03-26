/**
 * Font Flux JS : Type 2 CharString Interpreter
 *
 * Interprets CFF/CFF2 Type 2 CharString bytecode into human-readable
 * path data (contours with {x, y} cubic Bézier points).
 *
 * Reference: Adobe Technical Note #5177 — Type 2 Charstring Format
 *
 * The interpreter produces an array of contours, where each contour is
 * an array of path commands:
 *   { type: 'M', x, y }       — moveTo
 *   { type: 'L', x, y }       — lineTo
 *   { type: 'C', x1, y1, x2, y2, x, y } — cubic curveTo
 *
 * Subroutine calls (callsubr / callgsubr) are resolved inline.
 */

// ===========================================================================
//  NUMBER DECODING (Type 2 CharString encoding)
// ===========================================================================

/**
 * Decode one number from charstring bytes starting at `offset`.
 * Returns { value, bytesConsumed }.
 */
function decodeNumber(bytes, offset) {
	const b0 = bytes[offset];

	if (b0 >= 32 && b0 <= 246) {
		return { value: b0 - 139, bytesConsumed: 1 };
	}
	if (b0 >= 247 && b0 <= 250) {
		return {
			value: (b0 - 247) * 256 + bytes[offset + 1] + 108,
			bytesConsumed: 2,
		};
	}
	if (b0 >= 251 && b0 <= 254) {
		return {
			value: -(b0 - 251) * 256 - bytes[offset + 1] - 108,
			bytesConsumed: 2,
		};
	}
	if (b0 === 28) {
		const val = (bytes[offset + 1] << 8) | bytes[offset + 2];
		return { value: val > 0x7fff ? val - 0x10000 : val, bytesConsumed: 3 };
	}
	if (b0 === 255) {
		// Fixed-point 16.16
		const val =
			((bytes[offset + 1] << 24) |
				(bytes[offset + 2] << 16) |
				(bytes[offset + 3] << 8) |
				bytes[offset + 4]) >>>
			0;
		// Interpret as signed 32-bit, then divide by 65536
		const signed = val > 0x7fffffff ? val - 0x100000000 : val;
		return { value: signed / 65536, bytesConsumed: 5 };
	}

	return null; // Not a number — it's an operator
}

// ===========================================================================
//  SUBROUTINE BIAS
// ===========================================================================

/**
 * Calculate the subroutine bias per the Type 2 spec.
 */
function calcSubrBias(subrCount) {
	if (subrCount < 1240) return 107;
	if (subrCount < 33900) return 1131;
	return 32768;
}

// ===========================================================================
//  INTERPRETER
// ===========================================================================

/**
 * Interpret a Type 2 CharString into path contours.
 *
 * @param {number[]} charString - The charstring bytecode
 * @param {number[][]} globalSubrs - Global subroutines (array of byte arrays)
 * @param {number[][]} localSubrs - Local subroutines (array of byte arrays)
 * @returns {{ contours: Array, width: number|null }}
 *   contours: array of arrays of path commands { type, x, y, ... }
 *   width: explicit glyph width if specified in the charstring, else null
 */
export function interpretCharString(
	charString,
	globalSubrs = [],
	localSubrs = [],
) {
	const stack = [];
	const contours = [];
	let currentContour = null;
	let x = 0;
	let y = 0;
	let width = null;
	let hasWidth = false;
	let firstMove = true;

	const globalBias = calcSubrBias(globalSubrs.length);
	const localBias = calcSubrBias(localSubrs.length);

	function moveTo(dx, dy) {
		// Close previous contour if open
		if (currentContour && currentContour.length > 0) {
			contours.push(currentContour);
		}
		x += dx;
		y += dy;
		currentContour = [{ type: 'M', x, y }];
	}

	function lineTo(dx, dy) {
		x += dx;
		y += dy;
		if (currentContour) {
			currentContour.push({ type: 'L', x, y });
		}
	}

	function curveTo(dx1, dy1, dx2, dy2, dx3, dy3) {
		const x1 = x + dx1;
		const y1 = y + dy1;
		const x2 = x1 + dx2;
		const y2 = y1 + dy2;
		x = x2 + dx3;
		y = y2 + dy3;
		if (currentContour) {
			currentContour.push({ type: 'C', x1, y1, x2, y2, x, y });
		}
	}

	function checkWidth() {
		if (firstMove) {
			// If the stack has an odd number of arguments before the first
			// drawing operator, the first value is the glyph width.
			if (stack.length % 2 !== 0) {
				width = stack.shift();
			}
			firstMove = false;
			hasWidth = true;
		}
	}

	function execOneByteOp(op) {
		switch (op) {
			case 1: // hstem
			case 3: // vstem
			case 18: // hstemhm
			case 23: // vstemhm
				// Hint operators — consume all args (possibly with width)
				if (!hasWidth) {
					if (stack.length % 2 !== 0) {
						width = stack.shift();
					}
					hasWidth = true;
					firstMove = false;
				}
				stack.length = 0;
				break;

			case 4: // vmoveto
				if (firstMove) {
					if (stack.length > 1) width = stack.shift();
					firstMove = false;
					hasWidth = true;
				}
				moveTo(0, stack.pop());
				stack.length = 0;
				break;

			case 5: // rlineto
				for (let j = 0; j < stack.length; j += 2) {
					lineTo(stack[j], stack[j + 1]);
				}
				stack.length = 0;
				break;

			case 6: // hlineto
				for (let j = 0; j < stack.length; j++) {
					if (j % 2 === 0) {
						lineTo(stack[j], 0);
					} else {
						lineTo(0, stack[j]);
					}
				}
				stack.length = 0;
				break;

			case 7: // vlineto
				for (let j = 0; j < stack.length; j++) {
					if (j % 2 === 0) {
						lineTo(0, stack[j]);
					} else {
						lineTo(stack[j], 0);
					}
				}
				stack.length = 0;
				break;

			case 8: // rrcurveto
				for (let j = 0; j + 5 < stack.length; j += 6) {
					curveTo(
						stack[j],
						stack[j + 1],
						stack[j + 2],
						stack[j + 3],
						stack[j + 4],
						stack[j + 5],
					);
				}
				stack.length = 0;
				break;

			case 10: {
				// callsubr
				const subrIndex = stack.pop() + localBias;
				if (localSubrs[subrIndex]) {
					callStack.push(null); // marker for return
					execute(localSubrs[subrIndex]);
				}
				break;
			}

			case 11: // return
				return; // Return from subroutine

			case 14: // endchar
				if (!hasWidth && stack.length > 0) {
					width = stack.shift();
					hasWidth = true;
					firstMove = false;
				}
				// Close final contour
				if (currentContour && currentContour.length > 0) {
					contours.push(currentContour);
					currentContour = null;
				}
				stack.length = 0;
				break;

			case 19: // hintmask
			case 20: // cntrmask
				if (!hasWidth) {
					if (stack.length % 2 !== 0) {
						width = stack.shift();
					}
					hasWidth = true;
					firstMove = false;
				}
				// Mask bytes follow — we skip them in the caller
				stack.length = 0;
				break;

			case 21: // rmoveto
				checkWidth();
				{
					const dy = stack.pop();
					const dx = stack.pop();
					moveTo(dx, dy);
				}
				stack.length = 0;
				break;

			case 22: // hmoveto
				if (firstMove) {
					if (stack.length > 1) width = stack.shift();
					firstMove = false;
					hasWidth = true;
				}
				moveTo(stack.pop(), 0);
				stack.length = 0;
				break;

			case 24: // rcurveline
				// n/6 curves followed by 1 line
				{
					const lineArgs = 2;
					const curveArgs = stack.length - lineArgs;
					let j = 0;
					for (; j < curveArgs; j += 6) {
						curveTo(
							stack[j],
							stack[j + 1],
							stack[j + 2],
							stack[j + 3],
							stack[j + 4],
							stack[j + 5],
						);
					}
					lineTo(stack[j], stack[j + 1]);
				}
				stack.length = 0;
				break;

			case 25: // rlinecurve
				// n/2 lines followed by 1 curve
				{
					const curveArgs = 6;
					const lineArgs = stack.length - curveArgs;
					let j = 0;
					for (; j < lineArgs; j += 2) {
						lineTo(stack[j], stack[j + 1]);
					}
					curveTo(
						stack[j],
						stack[j + 1],
						stack[j + 2],
						stack[j + 3],
						stack[j + 4],
						stack[j + 5],
					);
				}
				stack.length = 0;
				break;

			case 26: // vvcurveto
				{
					let j = 0;
					let dx1 = 0;
					if (stack.length % 4 !== 0) {
						dx1 = stack[j++];
					}
					for (; j + 3 < stack.length; j += 4) {
						curveTo(dx1, stack[j], stack[j + 1], stack[j + 2], 0, stack[j + 3]);
						dx1 = 0;
					}
				}
				stack.length = 0;
				break;

			case 27: // hhcurveto
				{
					let j = 0;
					let dy1 = 0;
					if (stack.length % 4 !== 0) {
						dy1 = stack[j++];
					}
					for (; j + 3 < stack.length; j += 4) {
						curveTo(stack[j], dy1, stack[j + 1], stack[j + 2], stack[j + 3], 0);
						dy1 = 0;
					}
				}
				stack.length = 0;
				break;

			case 29: {
				// callgsubr
				const subrIndex = stack.pop() + globalBias;
				if (globalSubrs[subrIndex]) {
					callStack.push(null);
					execute(globalSubrs[subrIndex]);
				}
				break;
			}

			case 30: // vhcurveto
				{
					let j = 0;
					while (j < stack.length) {
						if (j + 3 < stack.length) {
							const extra = stack.length - j === 5 ? stack[j + 4] : 0;
							curveTo(
								0,
								stack[j],
								stack[j + 1],
								stack[j + 2],
								stack[j + 3],
								extra,
							);
							j += extra !== 0 ? 5 : 4;
						} else break;
						if (j + 3 < stack.length) {
							const extra = stack.length - j === 5 ? stack[j + 4] : 0;
							curveTo(
								stack[j],
								0,
								stack[j + 1],
								stack[j + 2],
								extra,
								stack[j + 3],
							);
							j += extra !== 0 ? 5 : 4;
						} else break;
					}
				}
				stack.length = 0;
				break;

			case 31: // hvcurveto
				{
					let j = 0;
					while (j < stack.length) {
						if (j + 3 < stack.length) {
							const extra = stack.length - j === 5 ? stack[j + 4] : 0;
							curveTo(
								stack[j],
								0,
								stack[j + 1],
								stack[j + 2],
								extra,
								stack[j + 3],
							);
							j += extra !== 0 ? 5 : 4;
						} else break;
						if (j + 3 < stack.length) {
							const extra = stack.length - j === 5 ? stack[j + 4] : 0;
							curveTo(
								0,
								stack[j],
								stack[j + 1],
								stack[j + 2],
								stack[j + 3],
								extra,
							);
							j += extra !== 0 ? 5 : 4;
						} else break;
					}
				}
				stack.length = 0;
				break;

			default:
				// Unknown operator — clear stack
				stack.length = 0;
				break;
		}
	}

	function execTwoByteOp(b1) {
		switch (b1) {
			case 34: // hflex
				{
					const dx1 = stack[0],
						dy1 = 0;
					const dx2 = stack[1],
						dy2 = stack[2];
					const dx3 = stack[3],
						dy3 = 0;
					const dx4 = stack[4],
						dy4 = 0;
					const dx5 = stack[5],
						dy5 = -dy2;
					const dx6 = stack[6],
						dy6 = 0;
					curveTo(dx1, dy1, dx2, dy2, dx3, dy3);
					curveTo(dx4, dy4, dx5, dy5, dx6, dy6);
				}
				stack.length = 0;
				break;

			case 35: // flex
				{
					curveTo(stack[0], stack[1], stack[2], stack[3], stack[4], stack[5]);
					curveTo(stack[6], stack[7], stack[8], stack[9], stack[10], stack[11]);
					// stack[12] is the flex depth (ignored for rendering)
				}
				stack.length = 0;
				break;

			case 36: // hflex1
				{
					const dx1 = stack[0],
						dy1 = stack[1];
					const dx2 = stack[2],
						dy2 = stack[3];
					const dx3 = stack[4],
						dy3 = 0;
					const dx4 = stack[5],
						dy4 = 0;
					const dx5 = stack[6],
						dy5 = stack[7];
					const dx6 = stack[8],
						dy6 = -(dy1 + dy2 + dy5);
					curveTo(dx1, dy1, dx2, dy2, dx3, dy3);
					curveTo(dx4, dy4, dx5, dy5, dx6, dy6);
				}
				stack.length = 0;
				break;

			case 37: // flex1
				{
					const dx1 = stack[0],
						dy1 = stack[1];
					const dx2 = stack[2],
						dy2 = stack[3];
					const dx3 = stack[4],
						dy3 = stack[5];
					const dx4 = stack[6],
						dy4 = stack[7];
					const dx5 = stack[8],
						dy5 = stack[9];
					const d = stack[10];
					// Determine whether the final segment is horizontal or vertical
					const sumDx = dx1 + dx2 + dx3 + dx4 + dx5;
					const sumDy = dy1 + dy2 + dy3 + dy4 + dy5;
					let dx6, dy6;
					if (Math.abs(sumDx) > Math.abs(sumDy)) {
						dx6 = d;
						dy6 = -sumDy;
					} else {
						dx6 = -sumDx;
						dy6 = d;
					}
					curveTo(dx1, dy1, dx2, dy2, dx3, dy3);
					curveTo(dx4, dy4, dx5, dy5, dx6, dy6);
				}
				stack.length = 0;
				break;

			default:
				// Unknown two-byte op — clear stack
				stack.length = 0;
				break;
		}
	}

	function executeReal(bytes, stemCountInit) {
		let stemCount = stemCountInit || 0;
		let i = 0;

		while (i < bytes.length) {
			const b0 = bytes[i];
			const num = decodeNumber(bytes, i);
			if (num !== null) {
				stack.push(num.value);
				i += num.bytesConsumed;
				continue;
			}

			if (b0 === 12) {
				i++;
				const b1 = bytes[i];
				i++;
				execTwoByteOp(b1);
			} else if (b0 === 19 || b0 === 20) {
				// hintmask / cntrmask
				if (!hasWidth) {
					if (stack.length % 2 !== 0) {
						width = stack.shift();
					}
					hasWidth = true;
					firstMove = false;
				}
				stemCount += stack.length >> 1;
				stack.length = 0;
				i++;
				// Skip mask data bytes
				const maskBytes = Math.ceil(stemCount / 8);
				i += maskBytes;
			} else if (b0 === 1 || b0 === 3 || b0 === 18 || b0 === 23) {
				// Stem operators
				if (!hasWidth) {
					if (stack.length % 2 !== 0) {
						width = stack.shift();
					}
					hasWidth = true;
					firstMove = false;
				}
				stemCount += stack.length >> 1;
				stack.length = 0;
				i++;
			} else if (b0 === 10) {
				// callsubr
				i++;
				const subrIndex = stack.pop() + localBias;
				if (localSubrs[subrIndex]) {
					executeReal(localSubrs[subrIndex], stemCount);
				}
			} else if (b0 === 29) {
				// callgsubr
				i++;
				const subrIndex = stack.pop() + globalBias;
				if (globalSubrs[subrIndex]) {
					executeReal(globalSubrs[subrIndex], stemCount);
				}
			} else if (b0 === 11) {
				// return
				return;
			} else {
				i++;
				execOneByteOp(b0);
			}
		}
	}

	// Run the interpreter
	executeReal(charString, 0);

	// Close final contour
	if (currentContour && currentContour.length > 0) {
		contours.push(currentContour);
	}

	return { contours, width };
}

// ===========================================================================
//  BATCH INTERPRETER — for all glyphs in a CFF font
// ===========================================================================

/**
 * Interpret all charstrings in a CFF font's glyph set.
 *
 * @param {object} cffTable - Parsed CFF table (from table_CFF.js)
 * @param {number} [fontIndex=0] - Font index for CFF1 fonts[]
 * @returns {Array<{ contours: Array, width: number|null }>}
 */
export function interpretAllCharStrings(cffTable, fontIndex = 0) {
	let charStrings, globalSubrs, localSubrs;

	if (cffTable.majorVersion === 2) {
		// CFF2
		charStrings = cffTable.charStrings || [];
		globalSubrs = cffTable.globalSubrs || [];
		// CFF2 localSubrs are per-FD; for now use first FD's subrs
		localSubrs = cffTable.fontDicts?.[0]?.localSubrs || [];
	} else {
		// CFF1
		const font = cffTable.fonts[fontIndex];
		charStrings = font.charStrings || [];
		globalSubrs = cffTable.globalSubrs || [];
		localSubrs = font.localSubrs || [];
	}

	return charStrings.map((cs) =>
		interpretCharString(cs, globalSubrs, localSubrs),
	);
}

// ===========================================================================
//  DISASSEMBLER — human-readable text from bytecode
// ===========================================================================

const OP_NAMES = {
	1: 'hstem',
	3: 'vstem',
	4: 'vmoveto',
	5: 'rlineto',
	6: 'hlineto',
	7: 'vlineto',
	8: 'rrcurveto',
	10: 'callsubr',
	11: 'return',
	14: 'endchar',
	18: 'hstemhm',
	19: 'hintmask',
	20: 'cntrmask',
	21: 'rmoveto',
	22: 'hmoveto',
	23: 'vstemhm',
	24: 'rcurveline',
	25: 'rlinecurve',
	26: 'vvcurveto',
	27: 'hhcurveto',
	29: 'callgsubr',
	30: 'vhcurveto',
	31: 'hvcurveto',
};

const OP2_NAMES = {
	0: 'dotsection',
	3: 'and',
	4: 'or',
	5: 'not',
	9: 'abs',
	10: 'add',
	11: 'sub',
	12: 'div',
	14: 'neg',
	15: 'eq',
	18: 'drop',
	20: 'put',
	21: 'get',
	22: 'ifelse',
	23: 'random',
	24: 'mul',
	26: 'sqrt',
	27: 'dup',
	28: 'exch',
	29: 'index',
	30: 'roll',
	34: 'hflex',
	35: 'flex',
	36: 'hflex1',
	37: 'flex1',
};

/**
 * Disassemble a charstring into human-readable text.
 * Each line is: "operand operand ... operator"
 *
 * @param {number[]} charString - The charstring bytecode
 * @returns {string} Multi-line disassembly text
 */
export function disassembleCharString(charString) {
	const lines = [];
	const operands = [];
	let stemCount = 0;
	let i = 0;

	while (i < charString.length) {
		const b0 = charString[i];
		const num = decodeNumber(charString, i);
		if (num !== null) {
			operands.push(num.value);
			i += num.bytesConsumed;
			continue;
		}

		if (b0 === 12) {
			i++;
			const b1 = charString[i];
			i++;
			const name = OP2_NAMES[b1] || `op12.${b1}`;
			lines.push(operands.length ? `${operands.join(' ')} ${name}` : name);
			operands.length = 0;
		} else if (b0 === 19 || b0 === 20) {
			const name = b0 === 19 ? 'hintmask' : 'cntrmask';
			stemCount += operands.length >> 1;
			i++;
			const maskLen = Math.ceil(stemCount / 8);
			const maskBits = [];
			for (let m = 0; m < maskLen && i < charString.length; m++, i++) {
				maskBits.push(charString[i].toString(2).padStart(8, '0'));
			}
			const prefix = operands.length ? `${operands.join(' ')} ` : '';
			lines.push(`${prefix}${name} ${maskBits.join('')}`);
			operands.length = 0;
		} else if (b0 === 1 || b0 === 3 || b0 === 18 || b0 === 23) {
			stemCount += operands.length >> 1;
			const name = OP_NAMES[b0];
			lines.push(operands.length ? `${operands.join(' ')} ${name}` : name);
			operands.length = 0;
			i++;
		} else {
			const name = OP_NAMES[b0] || `op${b0}`;
			lines.push(operands.length ? `${operands.join(' ')} ${name}` : name);
			operands.length = 0;
			i++;
		}
	}

	// Flush any trailing operands (shouldn't happen in valid charstrings)
	if (operands.length) {
		lines.push(operands.join(' '));
	}

	return lines.join('\n');
}
