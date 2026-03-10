/**
 * Font Flux JS : CFF Common Utilities
 * Shared DICT, INDEX, and number encoding/decoding for CFF v1 and CFF2.
 *
 * CFF spec:  Adobe Technical Note #5176
 * CFF2 spec: https://learn.microsoft.com/en-us/typography/opentype/spec/cff2
 *
 * Both formats share the concept of DICT (stack-based key-value binary
 * dictionaries) and INDEX (arrays of variable-length data objects), along
 * with a common encoded-number scheme.
 */

// ===========================================================================
//  ENCODED NUMBERS — decoding
// ===========================================================================

/**
 * Decode one encoded number from `bytes` starting at `offset`.
 * Returns { value, bytesConsumed }.
 *
 * Encodings shared by DICT and CharString data:
 *   b0 32–246   -> value = b0 − 139                      (1 byte)
 *   b0 247–250  -> value = (b0−247)*256 + b1 + 108       (2 bytes)
 *   b0 251–254  -> value = −(b0−251)*256 − b1 − 108      (2 bytes)
 *   b0 = 28     -> value = int16(b1,b2)                   (3 bytes)
 *
 * DICT-only:
 *   b0 = 29     -> value = int32(b1..b4)                  (5 bytes)
 *   b0 = 30     -> BCD real number                        (variable)
 *
 * CharString-only:
 *   b0 = 255    -> value = Fixed 16.16                    (5 bytes)
 *
 * @param {number[]|Uint8Array} bytes
 * @param {number} offset
 * @param {boolean} [isDICT=true] - true for DICT context, false for CharString
 * @returns {{ value: number, bytesConsumed: number }}
 */
export function decodeNumber(bytes, offset, isDICT = true) {
	const b0 = bytes[offset];

	// 1-byte integer
	if (b0 >= 32 && b0 <= 246) {
		return { value: b0 - 139, bytesConsumed: 1 };
	}

	// 2-byte positive
	if (b0 >= 247 && b0 <= 250) {
		const b1 = bytes[offset + 1];
		return { value: (b0 - 247) * 256 + b1 + 108, bytesConsumed: 2 };
	}

	// 2-byte negative
	if (b0 >= 251 && b0 <= 254) {
		const b1 = bytes[offset + 1];
		return { value: -(b0 - 251) * 256 - b1 - 108, bytesConsumed: 2 };
	}

	// 3-byte int16
	if (b0 === 28) {
		const val = (bytes[offset + 1] << 8) | bytes[offset + 2];
		// Sign-extend int16
		return { value: val > 0x7fff ? val - 0x10000 : val, bytesConsumed: 3 };
	}

	// 5-byte int32 (DICT only)
	if (b0 === 29 && isDICT) {
		const val =
			(bytes[offset + 1] << 24) |
			(bytes[offset + 2] << 16) |
			(bytes[offset + 3] << 8) |
			bytes[offset + 4];
		return { value: val | 0, bytesConsumed: 5 }; // | 0 forces signed int32
	}

	// BCD real (DICT only)
	if (b0 === 30 && isDICT) {
		return decodeBCD(bytes, offset + 1);
	}

	// Fixed 16.16 (CharString only)
	if (b0 === 255 && !isDICT) {
		const raw =
			(bytes[offset + 1] << 24) |
			(bytes[offset + 2] << 16) |
			(bytes[offset + 3] << 8) |
			bytes[offset + 4];
		return { value: (raw | 0) / 65536, bytesConsumed: 5 };
	}

	// Not a number — caller should treat as operator
	return null;
}

/**
 * Decode a BCD (binary coded decimal) real number.
 * Called after the prefix byte (30) has been consumed.
 * @param {number[]|Uint8Array} bytes
 * @param {number} offset - byte after the 30 prefix
 * @returns {{ value: number, bytesConsumed: number }}
 */
function decodeBCD(bytes, offset) {
	const NIBBLE_CHARS = [
		'0',
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'.',
		'E',
		'E-',
		'',
		'-',
		'',
	];
	let str = '';
	let pos = offset;
	let done = false;

	while (!done) {
		const byte = bytes[pos++];
		const hi = (byte >> 4) & 0x0f;
		const lo = byte & 0x0f;

		if (hi === 0x0f) {
			done = true;
		} else {
			str += NIBBLE_CHARS[hi];
			if (lo === 0x0f) {
				done = true;
			} else {
				str += NIBBLE_CHARS[lo];
			}
		}
	}

	const value = str === '' || str === '.' ? 0 : parseFloat(str);
	// bytesConsumed includes the prefix byte (30)
	return { value, bytesConsumed: 1 + (pos - offset) };
}

// ===========================================================================
//  ENCODED NUMBERS — encoding
// ===========================================================================

/**
 * Encode a number into CFF DICT format.
 * Returns a number[] of bytes.
 *
 * @param {number} value
 * @returns {number[]}
 */
export function encodeNumber(value) {
	// Integer path
	if (Number.isInteger(value)) {
		return encodeInteger(value);
	}
	// Real / float -> BCD
	return encodeBCD(value);
}

/**
 * Encode an integer into the most compact CFF representation.
 * @param {number} value
 * @returns {number[]}
 */
function encodeInteger(value) {
	if (value >= -107 && value <= 107) {
		return [value + 139];
	}
	if (value >= 108 && value <= 1131) {
		const v = value - 108;
		return [247 + ((v >> 8) & 0x03), v & 0xff];
	}
	if (value >= -1131 && value <= -108) {
		const v = -value - 108;
		return [251 + ((v >> 8) & 0x03), v & 0xff];
	}
	if (value >= -32768 && value <= 32767) {
		return [28, (value >> 8) & 0xff, value & 0xff];
	}
	// int32
	return [
		29,
		(value >> 24) & 0xff,
		(value >> 16) & 0xff,
		(value >> 8) & 0xff,
		value & 0xff,
	];
}

/**
 * Encode a real number as CFF BCD (prefix byte 30 + nibble pairs).
 * @param {number} value
 * @returns {number[]}
 */
function encodeBCD(value) {
	const result = [30];
	// Convert to string, normalise
	let str = value.toString();

	// Handle scientific notation
	if (str.includes('e') || str.includes('E')) {
		// Use toPrecision to get a reasonable representation
		str = value.toPrecision(10);
		// Remove trailing zeros
		if (str.includes('.')) {
			str = str.replace(/0+$/, '').replace(/\.$/, '');
		}
	}

	const nibbles = [];
	for (const ch of str) {
		switch (ch) {
			case '0':
				nibbles.push(0);
				break;
			case '1':
				nibbles.push(1);
				break;
			case '2':
				nibbles.push(2);
				break;
			case '3':
				nibbles.push(3);
				break;
			case '4':
				nibbles.push(4);
				break;
			case '5':
				nibbles.push(5);
				break;
			case '6':
				nibbles.push(6);
				break;
			case '7':
				nibbles.push(7);
				break;
			case '8':
				nibbles.push(8);
				break;
			case '9':
				nibbles.push(9);
				break;
			case '.':
				nibbles.push(0x0a);
				break;
			case 'E':
			case 'e':
				nibbles.push(0x0b);
				break;
			case '-':
				nibbles.push(0x0e);
				break;
			default:
				break;
		}
	}
	// Handle E- (negative exponent) — replace E followed by - with 0xc
	for (let i = 0; i < nibbles.length - 1; i++) {
		if (nibbles[i] === 0x0b && nibbles[i + 1] === 0x0e) {
			nibbles.splice(i, 2, 0x0c);
		}
	}
	nibbles.push(0x0f); // end-of-number

	// Pack nibbles into bytes
	for (let i = 0; i < nibbles.length; i += 2) {
		const hi = nibbles[i];
		const lo = i + 1 < nibbles.length ? nibbles[i + 1] : 0x0f;
		result.push((hi << 4) | lo);
	}

	return result;
}

// ===========================================================================
//  DICT — decoding
// ===========================================================================

/**
 * Byte ranges that represent operators (not numbers) in DICT data.
 * Single-byte operators: 0–11, 13–21 (12 is escape prefix)
 * Two-byte operators start with 12.
 */
function isOperatorByte(b) {
	return b <= 21 && b !== 28 && b !== 29 && b !== 30;
}

/**
 * Decode a DICT data block into an array of { operator, operands } entries.
 *
 * @param {number[]|Uint8Array} bytes - raw DICT bytes
 * @param {number} [start=0]
 * @param {number} [end=bytes.length]
 * @returns {Array<{ operator: number, operands: number[] }>}
 */
export function decodeDICT(bytes, start = 0, end = bytes.length) {
	const entries = [];
	const stack = [];
	let pos = start;

	while (pos < end) {
		const b0 = bytes[pos];

		if (isOperatorByte(b0)) {
			let op;
			if (b0 === 12) {
				// Two-byte operator: 12 followed by second byte
				op = 0x0c00 | bytes[pos + 1];
				pos += 2;
			} else {
				op = b0;
				pos += 1;
			}
			entries.push({ operator: op, operands: [...stack] });
			stack.length = 0;
		} else {
			const decoded = decodeNumber(bytes, pos, true);
			if (decoded === null) {
				// Unknown byte — skip
				pos += 1;
			} else {
				stack.push(decoded.value);
				pos += decoded.bytesConsumed;
			}
		}
	}

	return entries;
}

/**
 * Encode a DICT from an array of { operator, operands } entries.
 * Returns a number[] of bytes.
 *
 * @param {Array<{ operator: number, operands: number[] }>} entries
 * @returns {number[]}
 */
export function encodeDICT(entries) {
	const result = [];

	for (const { operator, operands } of entries) {
		// Encode operands
		for (const val of operands) {
			result.push(...encodeNumber(val));
		}
		// Encode operator
		if (operator >= 0x0c00) {
			result.push(12, operator & 0xff);
		} else {
			result.push(operator);
		}
	}

	return result;
}

// ===========================================================================
//  INDEX — parsing
// ===========================================================================

/**
 * Parse a CFF v1 INDEX structure (uint16 count).
 *
 * Format:
 *   uint16  count
 *   if count > 0:
 *     uint8   offSize
 *     Offset  offsets[count+1]  (each `offSize` bytes, 1-based)
 *     uint8   data[...]
 *
 * @param {number[]|Uint8Array} bytes
 * @param {number} offset - byte position of the INDEX within the data
 * @returns {{ items: Uint8Array[], totalBytes: number }}
 */
export function parseINDEXv1(bytes, offset) {
	const count = (bytes[offset] << 8) | bytes[offset + 1];

	if (count === 0) {
		return { items: [], totalBytes: 2 };
	}

	const offSize = bytes[offset + 2];
	const offArrayStart = offset + 3;

	// Read offsets (each is offSize bytes, big-endian, 1-based)
	const offsets = [];
	for (let i = 0; i <= count; i++) {
		let val = 0;
		const base = offArrayStart + i * offSize;
		for (let j = 0; j < offSize; j++) {
			val = (val << 8) | bytes[base + j];
		}
		offsets.push(val);
	}

	// Data starts after the offset array
	const dataStart = offArrayStart + (count + 1) * offSize;

	// Extract items — offsets are 1-based from the byte preceding data
	const items = [];
	for (let i = 0; i < count; i++) {
		const start = dataStart + offsets[i] - 1;
		const end = dataStart + offsets[i + 1] - 1;
		items.push(new Uint8Array(Array.prototype.slice.call(bytes, start, end)));
	}

	const totalBytes = dataStart + offsets[count] - 1 - offset;
	return { items, totalBytes };
}

/**
 * Parse a CFF2 INDEX structure (uint32 count).
 *
 * Format:
 *   uint32  count
 *   if count > 0:
 *     uint8   offSize
 *     Offset  offsets[count+1]
 *     uint8   data[...]
 *
 * @param {number[]|Uint8Array} bytes
 * @param {number} offset
 * @returns {{ items: Uint8Array[], totalBytes: number }}
 */
export function parseINDEXv2(bytes, offset) {
	const count =
		(bytes[offset] << 24) |
		(bytes[offset + 1] << 16) |
		(bytes[offset + 2] << 8) |
		bytes[offset + 3];

	// Treat as unsigned
	const uCount = count >>> 0;

	if (uCount === 0) {
		return { items: [], totalBytes: 4 };
	}

	const offSize = bytes[offset + 4];
	const offArrayStart = offset + 5;

	const offsets = [];
	for (let i = 0; i <= uCount; i++) {
		let val = 0;
		const base = offArrayStart + i * offSize;
		for (let j = 0; j < offSize; j++) {
			val = (val << 8) | bytes[base + j];
		}
		offsets.push(val >>> 0); // unsigned
	}

	const dataStart = offArrayStart + (uCount + 1) * offSize;

	const items = [];
	for (let i = 0; i < uCount; i++) {
		const start = dataStart + offsets[i] - 1;
		const end = dataStart + offsets[i + 1] - 1;
		items.push(new Uint8Array(Array.prototype.slice.call(bytes, start, end)));
	}

	const totalBytes = dataStart + offsets[uCount] - 1 - offset;
	return { items, totalBytes };
}

// ===========================================================================
//  INDEX — writing
// ===========================================================================

/**
 * Write a CFF v1 INDEX (uint16 count).
 * @param {Array<number[]|Uint8Array>} items
 * @returns {number[]}
 */
export function writeINDEXv1(items) {
	const count = items.length;

	if (count === 0) {
		return [0, 0]; // uint16 count = 0
	}

	// Compute offsets (1-based)
	const offsets = [1];
	for (const item of items) {
		offsets.push(offsets[offsets.length - 1] + item.length);
	}

	// Determine minimum offSize
	const maxOffset = offsets[offsets.length - 1];
	let offSize;
	if (maxOffset <= 0xff) offSize = 1;
	else if (maxOffset <= 0xffff) offSize = 2;
	else if (maxOffset <= 0xffffff) offSize = 3;
	else offSize = 4;

	const result = [];
	// count (uint16)
	result.push((count >> 8) & 0xff, count & 0xff);
	// offSize
	result.push(offSize);
	// offsets
	for (const off of offsets) {
		for (let j = offSize - 1; j >= 0; j--) {
			result.push((off >> (j * 8)) & 0xff);
		}
	}
	// data
	for (const item of items) {
		for (let i = 0; i < item.length; i++) {
			result.push(item[i]);
		}
	}

	return result;
}

/**
 * Write a CFF2 INDEX (uint32 count).
 * @param {Array<number[]|Uint8Array>} items
 * @returns {number[]}
 */
export function writeINDEXv2(items) {
	const count = items.length;

	if (count === 0) {
		return [0, 0, 0, 0]; // uint32 count = 0
	}

	const offsets = [1];
	for (const item of items) {
		offsets.push(offsets[offsets.length - 1] + item.length);
	}

	const maxOffset = offsets[offsets.length - 1];
	let offSize;
	if (maxOffset <= 0xff) offSize = 1;
	else if (maxOffset <= 0xffff) offSize = 2;
	else if (maxOffset <= 0xffffff) offSize = 3;
	else offSize = 4;

	const result = [];
	// count (uint32)
	result.push(
		(count >> 24) & 0xff,
		(count >> 16) & 0xff,
		(count >> 8) & 0xff,
		count & 0xff,
	);
	// offSize
	result.push(offSize);
	// offsets
	for (const off of offsets) {
		for (let j = offSize - 1; j >= 0; j--) {
			result.push((off >> (j * 8)) & 0xff);
		}
	}
	// data
	for (const item of items) {
		for (let i = 0; i < item.length; i++) {
			result.push(item[i]);
		}
	}

	return result;
}

// ===========================================================================
//  DICT operator name mappings
// ===========================================================================

/**
 * CFF v1 Top DICT operator names.
 * Keys are numeric operator codes; values are human-readable names.
 */
export const CFF1_TOP_DICT_OPS = {
	0: 'version',
	1: 'Notice',
	2: 'FullName',
	3: 'FamilyName',
	4: 'Weight',
	5: 'FontBBox',
	13: 'UniqueID',
	14: 'XUID',
	15: 'charset',
	16: 'Encoding',
	17: 'CharStrings',
	18: 'Private',
	// Two-byte operators (12, x)
	0x0c00: 'Copyright',
	0x0c01: 'isFixedPitch',
	0x0c02: 'ItalicAngle',
	0x0c03: 'UnderlinePosition',
	0x0c04: 'UnderlineThickness',
	0x0c05: 'PaintType',
	0x0c06: 'CharstringType',
	0x0c07: 'FontMatrix',
	0x0c08: 'StrokeWidth',
	0x0c14: 'SyntheticBase',
	0x0c15: 'PostScript',
	0x0c16: 'BaseFontName',
	0x0c17: 'BaseFontBlend',
	// CIDFont operators
	0x0c1e: 'ROS',
	0x0c1f: 'CIDFontVersion',
	0x0c20: 'CIDFontRevision',
	0x0c21: 'CIDFontType',
	0x0c22: 'CIDCount',
	0x0c23: 'UIDBase',
	0x0c24: 'FDArray',
	0x0c25: 'FDSelect',
	0x0c26: 'FontName',
};

/**
 * Reverse lookup: name -> operator code for CFF1 Top DICT.
 */
export const CFF1_TOP_DICT_OPS_BY_NAME = Object.fromEntries(
	Object.entries(CFF1_TOP_DICT_OPS).map(([k, v]) => [v, Number(k)]),
);

/**
 * CFF v1 Private DICT operator names.
 */
export const CFF1_PRIVATE_DICT_OPS = {
	6: 'BlueValues',
	7: 'OtherBlues',
	8: 'FamilyBlues',
	9: 'FamilyOtherBlues',
	10: 'StdHW',
	11: 'StdVW',
	19: 'Subrs',
	20: 'defaultWidthX',
	21: 'nominalWidthX',
	0x0c09: 'BlueScale',
	0x0c0a: 'BlueShift',
	0x0c0b: 'BlueFuzz',
	0x0c0c: 'StemSnapH',
	0x0c0d: 'StemSnapV',
	0x0c0e: 'ForceBold',
	0x0c11: 'LanguageGroup',
	0x0c12: 'ExpansionFactor',
	0x0c13: 'initialRandomSeed',
};

/**
 * Reverse lookup for CFF1 Private DICT.
 */
export const CFF1_PRIVATE_DICT_OPS_BY_NAME = Object.fromEntries(
	Object.entries(CFF1_PRIVATE_DICT_OPS).map(([k, v]) => [v, Number(k)]),
);

/**
 * CFF2 Top DICT operator names.
 */
export const CFF2_TOP_DICT_OPS = {
	17: 'CharStrings',
	24: 'VariationStore',
	0x0c07: 'FontMatrix',
	0x0c24: 'FDArray',
	0x0c25: 'FDSelect',
};

/** Reverse lookup for CFF2 Top DICT. */
export const CFF2_TOP_DICT_OPS_BY_NAME = Object.fromEntries(
	Object.entries(CFF2_TOP_DICT_OPS).map(([k, v]) => [v, Number(k)]),
);

/**
 * CFF2 Font DICT operator names.
 */
export const CFF2_FONT_DICT_OPS = {
	18: 'Private',
};

/**
 * CFF2 Private DICT operator names.
 */
export const CFF2_PRIVATE_DICT_OPS = {
	6: 'BlueValues',
	7: 'OtherBlues',
	8: 'FamilyBlues',
	9: 'FamilyOtherBlues',
	10: 'StdHW',
	11: 'StdVW',
	19: 'Subrs',
	22: 'vsindex',
	23: 'blend',
	0x0c09: 'BlueScale',
	0x0c0a: 'BlueShift',
	0x0c0b: 'BlueFuzz',
	0x0c0c: 'StemSnapH',
	0x0c0d: 'StemSnapV',
	0x0c11: 'LanguageGroup',
	0x0c12: 'ExpansionFactor',
};

/**
 * Convert an array of decoded DICT entries into a named key-value object.
 *
 * @param {Array<{ operator: number, operands: number[] }>} entries
 * @param {object} opNames - operator -> name mapping
 * @returns {object}
 */
export function dictEntriesToObject(entries, opNames) {
	const result = {};
	for (const { operator, operands } of entries) {
		const name = opNames[operator] || `op_${operator}`;
		// Single operand -> scalar; multiple -> array
		result[name] = operands.length === 1 ? operands[0] : operands;
	}
	return result;
}

/**
 * Convert a named key-value object back to DICT entries.
 *
 * @param {object} obj
 * @param {object} opsByName - name -> operator code mapping
 * @returns {Array<{ operator: number, operands: number[] }>}
 */
export function objectToDictEntries(obj, opsByName) {
	const entries = [];
	for (const [name, value] of Object.entries(obj)) {
		const op = opsByName[name];
		if (op === undefined) continue; // skip unknown keys
		const operands = Array.isArray(value) ? value : [value];
		entries.push({ operator: op, operands });
	}
	return entries;
}

// ===========================================================================
//  FDSelect — parsing and writing
// ===========================================================================

/**
 * Parse an FDSelect structure.
 * Returns an array where index = glyph ID, value = FD index.
 *
 * @param {number[]|Uint8Array} bytes
 * @param {number} offset
 * @param {number} numGlyphs
 * @returns {number[]}
 */
export function parseFDSelect(bytes, offset, numGlyphs) {
	const format = bytes[offset];

	if (format === 0) {
		// Format 0: one byte per glyph
		const result = [];
		for (let i = 0; i < numGlyphs; i++) {
			result.push(bytes[offset + 1 + i]);
		}
		return result;
	}

	if (format === 3) {
		// Format 3: ranges with uint16 fields
		const numRanges = (bytes[offset + 1] << 8) | bytes[offset + 2];
		const result = new Array(numGlyphs);
		let pos = offset + 3;

		for (let r = 0; r < numRanges; r++) {
			const first = (bytes[pos] << 8) | bytes[pos + 1];
			const fd = bytes[pos + 2];
			pos += 3;
			const next =
				r < numRanges - 1 ? (bytes[pos] << 8) | bytes[pos + 1] : numGlyphs;
			for (let g = first; g < next; g++) {
				result[g] = fd;
			}
		}
		return result;
	}

	if (format === 4) {
		// Format 4: ranges with uint32 fields (CFF2)
		const numRanges =
			((bytes[offset + 1] << 24) |
				(bytes[offset + 2] << 16) |
				(bytes[offset + 3] << 8) |
				bytes[offset + 4]) >>>
			0;
		const result = new Array(numGlyphs);
		let pos = offset + 5;

		for (let r = 0; r < numRanges; r++) {
			const first =
				((bytes[pos] << 24) |
					(bytes[pos + 1] << 16) |
					(bytes[pos + 2] << 8) |
					bytes[pos + 3]) >>>
				0;
			const fd = (bytes[pos + 4] << 8) | bytes[pos + 5];
			pos += 6;
			const next =
				r < numRanges - 1
					? ((bytes[pos] << 24) |
							(bytes[pos + 1] << 16) |
							(bytes[pos + 2] << 8) |
							bytes[pos + 3]) >>>
						0
					: numGlyphs;
			for (let g = first; g < next; g++) {
				result[g] = fd;
			}
		}
		return result;
	}

	throw new Error(`Unsupported FDSelect format: ${format}`);
}

/**
 * Write an FDSelect as format 0 (simple, always correct).
 * @param {number[]} fdSelectArray - glyph ID -> FD index
 * @returns {number[]}
 */
export function writeFDSelect(fdSelectArray) {
	// Use format 3 (range-based) if possible for compactness,
	// but format 0 is always safe and simpler.
	const result = [0]; // format 0
	for (const fd of fdSelectArray) {
		result.push(fd);
	}
	return result;
}

// ===========================================================================
//  CFF1 Charset — parsing
// ===========================================================================

/**
 * Parse a CFF1 charset.  Returns an array of SIDs (one per glyph, starting
 * from glyph 1 — glyph 0 is always .notdef).
 *
 * Predefined charsets (offset 0, 1, 2) are returned as a string identifier.
 *
 * @param {number[]|Uint8Array} bytes
 * @param {number} offset - absolute offset within the CFF data
 * @param {number} numGlyphs
 * @returns {number[]|string}
 */
export function parseCharset(bytes, offset, numGlyphs) {
	if (offset === 0) return 'ISOAdobe';
	if (offset === 1) return 'Expert';
	if (offset === 2) return 'ExpertSubset';

	const format = bytes[offset];
	const sids = [];

	if (format === 0) {
		for (let g = 1; g < numGlyphs; g++) {
			const sid =
				(bytes[offset + 1 + (g - 1) * 2] << 8) |
				bytes[offset + 2 + (g - 1) * 2];
			sids.push(sid);
		}
	} else if (format === 1) {
		let pos = offset + 1;
		while (sids.length < numGlyphs - 1) {
			const first = (bytes[pos] << 8) | bytes[pos + 1];
			const nLeft = bytes[pos + 2];
			pos += 3;
			for (let i = 0; i <= nLeft && sids.length < numGlyphs - 1; i++) {
				sids.push(first + i);
			}
		}
	} else if (format === 2) {
		let pos = offset + 1;
		while (sids.length < numGlyphs - 1) {
			const first = (bytes[pos] << 8) | bytes[pos + 1];
			const nLeft = (bytes[pos + 2] << 8) | bytes[pos + 3];
			pos += 4;
			for (let i = 0; i <= nLeft && sids.length < numGlyphs - 1; i++) {
				sids.push(first + i);
			}
		}
	}

	return sids;
}

/**
 * Write a CFF1 charset in format 0 (simplest).
 * @param {number[]} sids — SID array (one per glyph excluding .notdef)
 * @returns {number[]}
 */
export function writeCharset(sids) {
	if (typeof sids === 'string') {
		// Predefined charset — the offset is written in the Top DICT,
		// not stored inline. Return empty.
		return [];
	}
	const result = [0]; // format 0
	for (const sid of sids) {
		result.push((sid >> 8) & 0xff, sid & 0xff);
	}
	return result;
}

// ===========================================================================
//  CFF1 Encoding — parsing
// ===========================================================================

/**
 * Parse a CFF1 Encoding.  Returns an array mapping code -> glyph index,
 * or a predefined name.
 *
 * @param {number[]|Uint8Array} bytes
 * @param {number} offset
 * @returns {number[]|string}
 */
export function parseEncoding(bytes, offset) {
	if (offset === 0) return 'Standard';
	if (offset === 1) return 'Expert';

	const format = bytes[offset] & 0x7f;
	const hasSupplement = (bytes[offset] & 0x80) !== 0;
	const codes = [];

	if (format === 0) {
		const nCodes = bytes[offset + 1];
		for (let i = 0; i < nCodes; i++) {
			codes.push(bytes[offset + 2 + i]);
		}
	} else if (format === 1) {
		const nRanges = bytes[offset + 1];
		let pos = offset + 2;
		for (let r = 0; r < nRanges; r++) {
			const first = bytes[pos];
			const nLeft = bytes[pos + 1];
			pos += 2;
			for (let i = 0; i <= nLeft; i++) {
				codes.push(first + i);
			}
		}
	}

	// We store the supplement flag but don't parse supplement entries here
	return { format, codes, hasSupplement };
}
