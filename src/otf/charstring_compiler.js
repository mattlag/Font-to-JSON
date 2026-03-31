/**
 * Font Flux JS : Type 2 CharString Compiler
 *
 * Compiles CFF contours (cubic Bézier path commands) into Type 2
 * CharString bytecode. This is the inverse of the charstring interpreter.
 *
 * Reference: Adobe Technical Note #5177 — Type 2 Charstring Format
 *
 * Input contours use the same format as interpretCharString() output:
 *   { type: 'M', x, y }                   — moveTo
 *   { type: 'L', x, y }                   — lineTo
 *   { type: 'C', x1, y1, x2, y2, x, y }  — cubic curveTo
 */

// ===========================================================================
//  NUMBER ENCODING (Type 2 CharString encoding)
// ===========================================================================

/**
 * Encode a number into Type 2 CharString bytes.
 * Uses the most compact encoding available.
 *
 * @param {number} value - The number to encode
 * @returns {number[]} Encoded bytes
 */
function encodeNumber(value) {
	// If it's not an integer or outside int range, use fixed-point 16.16
	if (!Number.isInteger(value) || value < -32768 || value > 32767) {
		return encodeFixed(value);
	}

	if (value >= -107 && value <= 107) {
		return [value + 139];
	}
	if (value >= 108 && value <= 1131) {
		const v = value - 108;
		return [((v >> 8) & 0xff) + 247, v & 0xff];
	}
	if (value >= -1131 && value <= -108) {
		const v = -value - 108;
		return [((v >> 8) & 0xff) + 251, v & 0xff];
	}
	// 2-byte signed integer (operator 28)
	const v = value < 0 ? value + 0x10000 : value;
	return [28, (v >> 8) & 0xff, v & 0xff];
}

/**
 * Encode a number as fixed-point 16.16.
 */
function encodeFixed(value) {
	const fixed = Math.round(value * 65536);
	const unsigned = fixed < 0 ? fixed + 0x100000000 : fixed;
	return [
		255,
		(unsigned >> 24) & 0xff,
		(unsigned >> 16) & 0xff,
		(unsigned >> 8) & 0xff,
		unsigned & 0xff,
	];
}

// ===========================================================================
//  OPERATOR BYTES
// ===========================================================================

const OP_RMOVETO = 21;
const OP_HMOVETO = 22;
const OP_VMOVETO = 4;
const OP_RLINETO = 5;
const OP_HLINETO = 6;
const OP_VLINETO = 7;
const OP_RRCURVETO = 8;
const OP_ENDCHAR = 14;

// ===========================================================================
//  COMPILER — contours → charstring bytes
// ===========================================================================

/**
 * Compile CFF contours into Type 2 CharString bytecode.
 *
 * Generates minimal valid charstrings using rmoveto/hmoveto/vmoveto,
 * rlineto/hlineto/vlineto, rrcurveto, and endchar. No hinting or
 * subroutine optimization is performed.
 *
 * @param {Array<Array<{type: string, x: number, y: number, x1?: number, y1?: number, x2?: number, y2?: number}>>} contours
 *   Array of contour arrays, each containing path commands with type 'M', 'L', or 'C'
 * @returns {number[]} Type 2 CharString bytecode
 */
export function compileCharString(contours) {
	if (!contours || contours.length === 0) {
		return [...encodeNumber(0), ...encodeNumber(0), OP_RMOVETO, OP_ENDCHAR];
	}

	const bytes = [];
	let curX = 0;
	let curY = 0;

	for (const contour of contours) {
		if (!contour || contour.length === 0) continue;

		for (const cmd of contour) {
			switch (cmd.type) {
				case 'M': {
					const dx = cmd.x - curX;
					const dy = cmd.y - curY;
					if (dx === 0 && dy !== 0) {
						bytes.push(...encodeNumber(dy), OP_VMOVETO);
					} else if (dy === 0 && dx !== 0) {
						bytes.push(...encodeNumber(dx), OP_HMOVETO);
					} else {
						bytes.push(...encodeNumber(dx), ...encodeNumber(dy), OP_RMOVETO);
					}
					curX = cmd.x;
					curY = cmd.y;
					break;
				}
				case 'L': {
					const dx = cmd.x - curX;
					const dy = cmd.y - curY;
					if (dx === 0 && dy !== 0) {
						bytes.push(...encodeNumber(dy), OP_VLINETO);
					} else if (dy === 0 && dx !== 0) {
						bytes.push(...encodeNumber(dx), OP_HLINETO);
					} else {
						bytes.push(...encodeNumber(dx), ...encodeNumber(dy), OP_RLINETO);
					}
					curX = cmd.x;
					curY = cmd.y;
					break;
				}
				case 'C': {
					const dx1 = cmd.x1 - curX;
					const dy1 = cmd.y1 - curY;
					const dx2 = cmd.x2 - cmd.x1;
					const dy2 = cmd.y2 - cmd.y1;
					const dx3 = cmd.x - cmd.x2;
					const dy3 = cmd.y - cmd.y2;
					bytes.push(
						...encodeNumber(dx1),
						...encodeNumber(dy1),
						...encodeNumber(dx2),
						...encodeNumber(dy2),
						...encodeNumber(dx3),
						...encodeNumber(dy3),
						OP_RRCURVETO,
					);
					curX = cmd.x;
					curY = cmd.y;
					break;
				}
			}
		}
	}

	bytes.push(OP_ENDCHAR);
	return bytes;
}

// ===========================================================================
//  ASSEMBLER — text → charstring bytes
// ===========================================================================

/**
 * Operator name → byte(s) lookup.
 * Inverse of the OP_NAMES / OP2_NAMES tables in the interpreter.
 */
const NAME_TO_OP = {
	hstem: [1],
	vstem: [3],
	vmoveto: [4],
	rlineto: [5],
	hlineto: [6],
	vlineto: [7],
	rrcurveto: [8],
	callsubr: [10],
	return: [11],
	endchar: [14],
	hstemhm: [18],
	hintmask: [19],
	cntrmask: [20],
	rmoveto: [21],
	hmoveto: [22],
	vstemhm: [23],
	rcurveline: [24],
	rlinecurve: [25],
	vvcurveto: [26],
	hhcurveto: [27],
	callgsubr: [29],
	vhcurveto: [30],
	hvcurveto: [31],
	// Two-byte operators (12 xx)
	dotsection: [12, 0],
	and: [12, 3],
	or: [12, 4],
	not: [12, 5],
	abs: [12, 9],
	add: [12, 10],
	sub: [12, 11],
	div: [12, 12],
	neg: [12, 14],
	eq: [12, 15],
	drop: [12, 18],
	put: [12, 20],
	get: [12, 21],
	ifelse: [12, 22],
	random: [12, 23],
	mul: [12, 24],
	sqrt: [12, 26],
	dup: [12, 27],
	exch: [12, 28],
	index: [12, 29],
	roll: [12, 30],
	hflex: [12, 34],
	flex: [12, 35],
	hflex1: [12, 36],
	flex1: [12, 37],
};

/**
 * Assemble a human-readable charstring text representation into bytecode.
 * This is the inverse of disassembleCharString().
 *
 * Each line should be: "operand operand ... operator"
 * For hintmask/cntrmask, the mask bits follow as a binary string:
 *   "hintmask 10110000"
 *
 * @param {string} text - The disassembly text (newline-separated lines)
 * @returns {number[]} CharString bytecode
 */
export function assembleCharString(text) {
	const bytes = [];
	const lines = text.split('\n').filter((l) => l.trim().length > 0);

	for (const line of lines) {
		const tokens = line.trim().split(/\s+/);
		if (tokens.length === 0) continue;

		// Find where the operator starts — scan from the end
		// Tokens are: [number...] operator [maskbits?]
		let opIndex = -1;
		let opName = null;

		for (let i = 0; i < tokens.length; i++) {
			const lower = tokens[i].toLowerCase();
			if (NAME_TO_OP[lower] || lower.startsWith('op')) {
				opIndex = i;
				opName = lower;
				break;
			}
		}

		if (opIndex === -1) {
			// No operator found — just operands (shouldn't happen in valid charstrings)
			for (const tok of tokens) {
				bytes.push(...encodeNumber(parseFloat(tok)));
			}
			continue;
		}

		// Encode operands before the operator
		for (let i = 0; i < opIndex; i++) {
			bytes.push(...encodeNumber(parseFloat(tokens[i])));
		}

		// Encode the operator
		if (opName.startsWith('op12.')) {
			const b1 = parseInt(opName.slice(5), 10);
			bytes.push(12, b1);
		} else if (opName.startsWith('op')) {
			bytes.push(parseInt(opName.slice(2), 10));
		} else {
			bytes.push(...NAME_TO_OP[opName]);
		}

		// Handle hintmask/cntrmask mask data
		if (opName === 'hintmask' || opName === 'cntrmask') {
			const maskStr = tokens.slice(opIndex + 1).join('');
			if (maskStr.length > 0) {
				// Convert binary string to bytes
				for (let i = 0; i < maskStr.length; i += 8) {
					const byteBits = maskStr.slice(i, i + 8).padEnd(8, '0');
					bytes.push(parseInt(byteBits, 2));
				}
			}
		}
	}

	return bytes;
}
