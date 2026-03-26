/**
 * Font Flux JS : WOFF 2.0
 * Unwrap (decompress) and wrap (compress) WOFF 2.0 font containers.
 *
 * WOFF 2.0 uses Brotli compression for the entire font data stream (all
 * tables concatenated), and optionally applies content-aware transforms to
 * glyf, loca, and hmtx tables for better compression ratios.
 *
 * Spec: https://www.w3.org/TR/WOFF2/
 */

// ─── Brotli Lazy Initialization ─────────────────────────────────────────────

let _brotliCompress = null;
let _brotliDecompress = null;

/**
 * Initialize Brotli compression/decompression support. Must be called (and
 * awaited) once before any WOFF2 import or export operations.
 *
 * Uses Node.js built-in zlib when available (synchronous, no WASM needed).
 * Falls back to brotli-wasm in browser environments.
 */
export async function initBrotli() {
	if (_brotliDecompress) return;
	try {
		// Node.js built-in brotli (available since Node.js 10.16)
		const { brotliCompressSync, brotliDecompressSync } = await import('node:zlib');
		_brotliCompress = (data) => new Uint8Array(brotliCompressSync(data));
		_brotliDecompress = (data) => new Uint8Array(brotliDecompressSync(data));
	} catch {
		// Browser: use brotli-wasm
		const mod = await import('brotli-wasm');
		const brotli = await (mod.default || mod);
		_brotliCompress = brotli.compress;
		_brotliDecompress = brotli.decompress;
	}
}

function requireBrotli() {
	if (!_brotliDecompress) {
		throw new Error(
			'WOFF2 support requires initialization. Call `await initWoff2()` before importing or exporting WOFF2 files.',
		);
	}
}

// ─── Constants ──────────────────────────────────────────────────────────────

const WOFF2_SIGNATURE = 0x774f4632; // 'wOF2'
const WOFF2_HEADER_SIZE = 48;
const SFNT_HEADER_SIZE = 12;
const SFNT_TABLE_RECORD_SIZE = 16;

/**
 * Known table tags (spec §4.1). Index → 4-byte tag string.
 * Flag value 63 means "arbitrary tag follows" the flag byte.
 */
const KNOWN_TAGS = [
	'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', // 0-7
	'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', // 8-15
	'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', // 16-23
	'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH', // 24-31
	'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', // 32-39
	'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', // 40-47
	'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', // 48-55
	'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',        // 56-62
];

/** Reverse lookup: tag string → known tag index (0–62). */
const TAG_TO_INDEX = new Map();
for (let i = 0; i < KNOWN_TAGS.length; i++) TAG_TO_INDEX.set(KNOWN_TAGS[i], i);

// ─── Variable-Length Data Type Readers ──────────────────────────────────────

/**
 * Read a UIntBase128 value from a Uint8Array at the given position.
 * Returns { value, bytesRead }.
 */
function readUIntBase128(data, pos) {
	let accum = 0;
	for (let i = 0; i < 5; i++) {
		const byte = data[pos + i];
		if (i === 0 && byte === 0x80) {
			throw new Error('UIntBase128: leading zero');
		}
		if (accum & 0xfe000000) {
			throw new Error('UIntBase128: overflow');
		}
		accum = (accum << 7) | (byte & 0x7f);
		if (!(byte & 0x80)) {
			return { value: accum >>> 0, bytesRead: i + 1 };
		}
	}
	throw new Error('UIntBase128: exceeds 5 bytes');
}

/**
 * Write a UIntBase128 value, returning a byte array.
 */
function writeUIntBase128(value) {
	const bytes = [];
	let v = value >>> 0;
	// Determine number of bytes needed
	const parts = [];
	do {
		parts.push(v & 0x7f);
		v >>>= 7;
	} while (v > 0);
	parts.reverse();
	for (let i = 0; i < parts.length; i++) {
		bytes.push(i < parts.length - 1 ? parts[i] | 0x80 : parts[i]);
	}
	return bytes;
}

/**
 * Read a 255UInt16 value from a Uint8Array at the given position.
 * Returns { value, bytesRead }.
 */
function read255UInt16(data, pos) {
	const code = data[pos];
	if (code === 253) {
		// wordCode: next 2 bytes are uint16
		const value = (data[pos + 1] << 8) | data[pos + 2];
		return { value, bytesRead: 3 };
	}
	if (code === 255) {
		// oneMoreByteCode1
		return { value: data[pos + 1] + 253, bytesRead: 2 };
	}
	if (code === 254) {
		// oneMoreByteCode2
		return { value: data[pos + 1] + 253 * 2, bytesRead: 2 };
	}
	return { value: code, bytesRead: 1 };
}

/**
 * Write a 255UInt16 value, returning a byte array.
 */
function write255UInt16(value) {
	if (value < 253) return [value];
	if (value < 253 + 256) return [255, value - 253];
	if (value < 253 * 2 + 256) return [254, value - 253 * 2];
	return [253, (value >> 8) & 0xff, value & 0xff];
}

// ─── Triplet Encoding Lookup Table (spec §5.2) ─────────────────────────────

/**
 * Build the 128-entry triplet decoding table. Each entry specifies how to
 * decode the X and Y delta values from the glyph stream given a flag byte.
 *
 * Entry: { xBits, yBits, deltaX, deltaY, xSign, ySign }
 *   xSign/ySign: -1 or +1 (applied to decoded value + delta)
 *   xSign = 0 means x delta is always 0 (xBits = 0)
 *   ySign = 0 means y delta is always 0 (yBits = 0)
 */
const TRIPLETS = buildTripletTable();

function buildTripletTable() {
	const t = [];

	// Flags 0–9: 1 data byte, x=0, y=8-bit
	for (let i = 0; i < 10; i++) {
		t.push({
			xBits: 0, yBits: 8,
			deltaX: 0, deltaY: (i >> 1) * 256,
			xSign: 0, ySign: (i & 1) ? 1 : -1,
		});
	}

	// Flags 10–19: 1 data byte, x=8-bit, y=0
	for (let i = 0; i < 10; i++) {
		t.push({
			xBits: 8, yBits: 0,
			deltaX: (i >> 1) * 256, deltaY: 0,
			xSign: (i & 1) ? 1 : -1, ySign: 0,
		});
	}

	// Flags 20–83: 1 data byte (4-bit nibbles), x=4, y=4
	const deltas4 = [1, 17, 33, 49];
	const signs = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
	for (const dx of deltas4) {
		for (const dy of deltas4) {
			for (const [xs, ys] of signs) {
				t.push({ xBits: 4, yBits: 4, deltaX: dx, deltaY: dy, xSign: xs, ySign: ys });
			}
		}
	}

	// Flags 84–119: 2 data bytes, x=8, y=8
	const deltas8 = [1, 257, 513];
	for (const dx of deltas8) {
		for (const dy of deltas8) {
			for (const [xs, ys] of signs) {
				t.push({ xBits: 8, yBits: 8, deltaX: dx, deltaY: dy, xSign: xs, ySign: ys });
			}
		}
	}

	// Flags 120–123: 3 data bytes, x=12, y=12
	for (const [xs, ys] of signs) {
		t.push({ xBits: 12, yBits: 12, deltaX: 0, deltaY: 0, xSign: xs, ySign: ys });
	}

	// Flags 124–127: 4 data bytes, x=16, y=16
	for (const [xs, ys] of signs) {
		t.push({ xBits: 16, yBits: 16, deltaX: 0, deltaY: 0, xSign: xs, ySign: ys });
	}

	return t;
}

/**
 * Decode one coordinate triplet from the flag and glyph streams.
 * Returns { dx, dy, onCurve, bytesConsumed } where bytesConsumed is the
 * number of bytes read from the glyph stream.
 */
function decodeTriplet(flagByte, glyphStream, pos) {
	const idx = flagByte & 0x7f;
	// MSB = 0 → on-curve; MSB = 1 → off-curve
	const onCurve = !(flagByte & 0x80);
	const t = TRIPLETS[idx];

	let dx = 0;
	let dy = 0;
	let p = pos;

	if (t.xBits === 0 && t.yBits === 8) {
		dy = t.ySign * (glyphStream[p++] + t.deltaY);
	} else if (t.xBits === 8 && t.yBits === 0) {
		dx = t.xSign * (glyphStream[p++] + t.deltaX);
	} else if (t.xBits === 4 && t.yBits === 4) {
		const b = glyphStream[p++];
		dx = t.xSign * (((b >> 4) & 0x0f) + t.deltaX);
		dy = t.ySign * ((b & 0x0f) + t.deltaY);
	} else if (t.xBits === 8 && t.yBits === 8) {
		dx = t.xSign * (glyphStream[p++] + t.deltaX);
		dy = t.ySign * (glyphStream[p++] + t.deltaY);
	} else if (t.xBits === 12 && t.yBits === 12) {
		const b0 = glyphStream[p++];
		const b1 = glyphStream[p++];
		const b2 = glyphStream[p++];
		dx = t.xSign * (((b0 << 4) | (b1 >> 4)) + t.deltaX);
		dy = t.ySign * ((((b1 & 0x0f) << 8) | b2) + t.deltaY);
	} else if (t.xBits === 16 && t.yBits === 16) {
		dx = t.xSign * (((glyphStream[p++] << 8) | glyphStream[p++]) + t.deltaX);
		dy = t.ySign * (((glyphStream[p++] << 8) | glyphStream[p++]) + t.deltaY);
	}

	return { dx, dy, onCurve, bytesConsumed: p - pos };
}

// ─── TrueType Glyph Record Encoding ────────────────────────────────────────

/**
 * Build a TrueType simple glyph record from decoded point data.
 * @param {number} numberOfContours
 * @param {number[]} endPtsOfContours
 * @param {Array<{dx: number, dy: number, onCurve: boolean}>} points
 * @param {Uint8Array} instructions
 * @param {number} xMin - bounding box (may be explicit or computed)
 * @param {number} yMin
 * @param {number} xMax
 * @param {number} yMax
 * @param {boolean} overlapSimple - whether OVERLAP_SIMPLE flag should be set
 * @returns {number[]} byte array of the glyph record
 */
function buildSimpleGlyphRecord(
	numberOfContours, endPtsOfContours, points, instructions,
	xMin, yMin, xMax, yMax, overlapSimple,
) {
	const out = [];

	// Glyph header: numberOfContours, xMin, yMin, xMax, yMax (all int16)
	pushInt16(out, numberOfContours);
	pushInt16(out, xMin);
	pushInt16(out, yMin);
	pushInt16(out, xMax);
	pushInt16(out, yMax);

	// endPtsOfContours
	for (const ep of endPtsOfContours) pushUint16(out, ep);

	// instructions
	pushUint16(out, instructions.length);
	for (let i = 0; i < instructions.length; i++) out.push(instructions[i]);

	// Encode flags and coordinates
	const flagBytes = [];
	const xBytes = [];
	const yBytes = [];

	for (let i = 0; i < points.length; i++) {
		const { dx, dy, onCurve } = points[i];
		let flag = onCurve ? 0x01 : 0x00;

		// OVERLAP_SIMPLE on the first point
		if (i === 0 && overlapSimple) flag |= 0x40;

		// Encode X delta
		if (dx === 0) {
			flag |= 0x10; // X_IS_SAME (delta is 0, no bytes)
		} else if (dx >= -255 && dx <= 255) {
			flag |= 0x02; // X_SHORT_VECTOR
			if (dx > 0) {
				flag |= 0x10; // positive
				xBytes.push(dx);
			} else {
				xBytes.push(-dx);
			}
		} else {
			const v = dx & 0xffff;
			xBytes.push((v >> 8) & 0xff, v & 0xff);
		}

		// Encode Y delta
		if (dy === 0) {
			flag |= 0x20; // Y_IS_SAME
		} else if (dy >= -255 && dy <= 255) {
			flag |= 0x04; // Y_SHORT_VECTOR
			if (dy > 0) {
				flag |= 0x20; // positive
				yBytes.push(dy);
			} else {
				yBytes.push(-dy);
			}
		} else {
			const v = dy & 0xffff;
			yBytes.push((v >> 8) & 0xff, v & 0xff);
		}

		flagBytes.push(flag);
	}

	// Write flags with repeat optimization
	let fi = 0;
	while (fi < flagBytes.length) {
		const cur = flagBytes[fi];
		let repeat = 0;
		while (
			fi + repeat + 1 < flagBytes.length &&
			flagBytes[fi + repeat + 1] === cur &&
			repeat < 255
		) {
			repeat++;
		}
		if (repeat > 0) {
			out.push(cur | 0x08); // REPEAT_FLAG
			out.push(repeat);
			fi += repeat + 1;
		} else {
			out.push(cur);
			fi++;
		}
	}

	// Write coordinate bytes
	for (const b of xBytes) out.push(b);
	for (const b of yBytes) out.push(b);

	return out;
}

/**
 * Build a TrueType composite glyph record from raw composite data + bbox.
 */
function buildCompositeGlyphRecord(compositeData, instructions, xMin, yMin, xMax, yMax) {
	const out = [];
	pushInt16(out, -1); // numberOfContours = -1 (composite)
	pushInt16(out, xMin);
	pushInt16(out, yMin);
	pushInt16(out, xMax);
	pushInt16(out, yMax);

	// Composite component data (already in TrueType format)
	for (let i = 0; i < compositeData.length; i++) out.push(compositeData[i]);

	// If instructions present, add instruction length + data
	if (instructions && instructions.length > 0) {
		pushUint16(out, instructions.length);
		for (let i = 0; i < instructions.length; i++) out.push(instructions[i]);
	}

	return out;
}

// ─── Reverse glyf Transform (spec §5.1) ────────────────────────────────────

/**
 * Reverse the glyf table transform, reconstructing standard TrueType glyf
 * and loca table data from the transformed streams.
 *
 * @param {Uint8Array} transformedData - The decompressed transformed glyf data
 * @param {number} origLocaLength - The origLength from the loca table entry
 * @returns {{ glyfBytes: Uint8Array, locaOffsets: number[] }}
 */
function reverseGlyfTransform(transformedData, origLocaLength) {
	const d = transformedData;
	let pos = 0;

	// ── Header ──────────────────────────────────────────────────────────
	const reserved = (d[pos] << 8) | d[pos + 1]; pos += 2;
	if (reserved !== 0) throw new Error('WOFF2 glyf transform: reserved != 0');

	const optionFlags = (d[pos] << 8) | d[pos + 1]; pos += 2;
	const numGlyphs = (d[pos] << 8) | d[pos + 1]; pos += 2;
	const indexFormat = (d[pos] << 8) | d[pos + 1]; pos += 2;

	const nContourStreamSize = readU32(d, pos); pos += 4;
	const nPointsStreamSize = readU32(d, pos); pos += 4;
	const flagStreamSize = readU32(d, pos); pos += 4;
	const glyphStreamSize = readU32(d, pos); pos += 4;
	const compositeStreamSize = readU32(d, pos); pos += 4;
	const bboxStreamSize = readU32(d, pos); pos += 4;
	const instructionStreamSize = readU32(d, pos); pos += 4;

	// ── Locate substreams ───────────────────────────────────────────────
	const nContourStart = pos;
	const nPointsStart = nContourStart + nContourStreamSize;
	const flagStart = nPointsStart + nPointsStreamSize;
	const glyphStart = flagStart + flagStreamSize;
	const compositeStart = glyphStart + glyphStreamSize;
	const bboxStart = compositeStart + compositeStreamSize;
	const instructionStart = bboxStart + bboxStreamSize;

	// ── Parse bboxBitmap ────────────────────────────────────────────────
	// The bboxStream contains a bitmap followed by Int16 bbox values.
	const bboxBitmapLen = 4 * Math.floor((numGlyphs + 31) / 32);
	const bboxBitmapStart = bboxStart;
	const bboxValuesStart = bboxBitmapStart + bboxBitmapLen;

	function hasBbox(glyphIndex) {
		const byteIdx = glyphIndex >> 3;
		const bitIdx = 7 - (glyphIndex & 7);
		return !!(d[bboxBitmapStart + byteIdx] & (1 << bitIdx));
	}

	// ── Parse overlapSimpleBitmap (optional) ────────────────────────────
	const hasOverlapBitmap = !!(optionFlags & 1);
	const overlapBitmapStart = instructionStart + instructionStreamSize;

	function hasOverlapSimple(glyphIndex) {
		if (!hasOverlapBitmap) return false;
		const byteIdx = glyphIndex >> 3;
		const bitIdx = 7 - (glyphIndex & 7);
		return !!(d[overlapBitmapStart + byteIdx] & (1 << bitIdx));
	}

	// ── Set up stream cursors ───────────────────────────────────────────
	let nContourPos = nContourStart;
	let nPointsPos = nPointsStart;
	let flagPos = flagStart;
	let glyphPos = glyphStart;
	let compositePos = compositeStart;
	let bboxValuesPos = bboxValuesStart;
	let instructionPos = instructionStart;

	// ── Reconstruct glyphs ──────────────────────────────────────────────
	const glyphRecords = [];
	const locaOffsets = [0];
	let currentOffset = 0;

	for (let g = 0; g < numGlyphs; g++) {
		// Read nContours from nContour stream (Int16)
		const nContours = readI16(d, nContourPos);
		nContourPos += 2;

		if (nContours === 0) {
			// ── Empty glyph ─────────────────────────────────────────
			glyphRecords.push(null);
			locaOffsets.push(currentOffset);
			continue;
		}

		if (nContours > 0) {
			// ── Simple glyph ────────────────────────────────────────

			// Read endPtsOfContours from nPoints stream
			const endPts = [];
			let totalPoints = 0;
			for (let c = 0; c < nContours; c++) {
				const { value: nPts, bytesRead } = read255UInt16(d, nPointsPos);
				nPointsPos += bytesRead;
				totalPoints += nPts;
				endPts.push(totalPoints - 1);
			}

			// Read flags and decode coordinates
			const points = [];
			for (let p = 0; p < totalPoints; p++) {
				const flagByte = d[flagPos++];
				const { dx, dy, onCurve, bytesConsumed } =
					decodeTriplet(flagByte, d, glyphPos);
				glyphPos += bytesConsumed;
				points.push({ dx, dy, onCurve });
			}

			// Read instructions
			const { value: instrLen, bytesRead: instrLenBytes } =
				read255UInt16(d, glyphPos);
			glyphPos += instrLenBytes;
			const instructions = d.subarray(instructionPos, instructionPos + instrLen);
			instructionPos += instrLen;

			// Compute or read bounding box
			let xMin, yMin, xMax, yMax;
			if (hasBbox(g)) {
				xMin = readI16(d, bboxValuesPos); bboxValuesPos += 2;
				yMin = readI16(d, bboxValuesPos); bboxValuesPos += 2;
				xMax = readI16(d, bboxValuesPos); bboxValuesPos += 2;
				yMax = readI16(d, bboxValuesPos); bboxValuesPos += 2;
			} else {
				// Compute from point coordinates
				let absX = 0, absY = 0;
				xMin = 0x7fff; yMin = 0x7fff; xMax = -0x8000; yMax = -0x8000;
				for (const pt of points) {
					absX += pt.dx;
					absY += pt.dy;
					if (absX < xMin) xMin = absX;
					if (absX > xMax) xMax = absX;
					if (absY < yMin) yMin = absY;
					if (absY > yMax) yMax = absY;
				}
			}

			const record = buildSimpleGlyphRecord(
				nContours, endPts, points, instructions,
				xMin, yMin, xMax, yMax, hasOverlapSimple(g),
			);
			glyphRecords.push(record);

			// Pad to 4-byte alignment if this affects the next offset
			// (Actually, for loca offset tracking we use unpadded glyph lengths,
			//  but the glyf table itself should be 2-byte aligned per glyph)
			const paddedLen = record.length + ((record.length % 2) ? 1 : 0);
			currentOffset += paddedLen;
			locaOffsets.push(currentOffset);
		} else {
			// ── Composite glyph (nContours == -1) ───────────────────

			// Read composite data from composite stream
			const compStart = compositePos;
			let hasInstructions = false;

			// Process component records
			/* eslint-disable no-constant-condition */
			while (true) {
				const flags = (d[compositePos] << 8) | d[compositePos + 1];
				compositePos += 2;

				// Skip glyph index (2 bytes)
				compositePos += 2;

				// Determine argument size
				if (flags & 0x0001) {
					// ARG_1_AND_2_ARE_WORDS
					compositePos += 4;
				} else {
					compositePos += 2;
				}

				// Optional transform
				if (flags & 0x0008) {
					// WE_HAVE_A_SCALE
					compositePos += 2;
				} else if (flags & 0x0040) {
					// WE_HAVE_AN_X_AND_Y_SCALE
					compositePos += 4;
				} else if (flags & 0x0080) {
					// WE_HAVE_A_TWO_BY_TWO
					compositePos += 8;
				}

				if (flags & 0x0100) hasInstructions = true;

				if (!(flags & 0x0020)) break; // no MORE_COMPONENTS
			}
			/* eslint-enable no-constant-condition */

			const compositeData = d.subarray(compStart, compositePos);

			// Read instructions if any component had WE_HAVE_INSTRUCTIONS
			let instructions = new Uint8Array(0);
			if (hasInstructions) {
				const { value: instrLen, bytesRead: instrLenBytes } =
					read255UInt16(d, glyphPos);
				glyphPos += instrLenBytes;
				instructions = d.subarray(instructionPos, instructionPos + instrLen);
				instructionPos += instrLen;
			}

			// Composite glyphs MUST have explicit bounding box
			const xMin = readI16(d, bboxValuesPos); bboxValuesPos += 2;
			const yMin = readI16(d, bboxValuesPos); bboxValuesPos += 2;
			const xMax = readI16(d, bboxValuesPos); bboxValuesPos += 2;
			const yMax = readI16(d, bboxValuesPos); bboxValuesPos += 2;

			const record = buildCompositeGlyphRecord(
				compositeData, instructions, xMin, yMin, xMax, yMax,
			);
			glyphRecords.push(record);

			const paddedLen = record.length + ((record.length % 2) ? 1 : 0);
			currentOffset += paddedLen;
			locaOffsets.push(currentOffset);
		}
	}

	// ── Build glyf table bytes ──────────────────────────────────────────
	const glyfBytes = new Uint8Array(currentOffset);
	let writePos = 0;
	for (const rec of glyphRecords) {
		if (rec === null) continue; // empty glyph
		for (let i = 0; i < rec.length; i++) {
			glyfBytes[writePos++] = rec[i];
		}
		// Pad to 2-byte alignment
		if (rec.length % 2) writePos++;
	}

	return { glyfBytes, locaOffsets, indexFormat };
}

// ─── Reverse hmtx Transform (spec §5.4) ────────────────────────────────────

/**
 * Reverse the hmtx table transform, reconstructing lsb values from glyf
 * bounding box data.
 *
 * @param {Uint8Array} transformedData - The decompressed transformed hmtx data
 * @param {number} numOfHMetrics - From hhea table
 * @param {number} numGlyphs - From maxp table
 * @param {Uint8Array} glyfData - The reconstructed glyf table bytes
 * @param {number[]} locaOffsets - The reconstructed loca offsets
 * @returns {Uint8Array} Standard hmtx table bytes
 */
function reverseHmtxTransform(transformedData, numOfHMetrics, numGlyphs, glyfData, locaOffsets) {
	const d = transformedData;
	let pos = 0;

	const flags = d[pos++];
	const hasLsb = !(flags & 1); // bit 0 clear = lsb[] present
	const hasLeftSideBearing = !(flags & 2); // bit 1 clear = leftSideBearing[] present

	// Read advanceWidth array (numOfHMetrics UInt16 values)
	const advanceWidths = [];
	for (let i = 0; i < numOfHMetrics; i++) {
		advanceWidths.push((d[pos] << 8) | d[pos + 1]);
		pos += 2;
	}

	// Read or reconstruct lsb array
	const lsbValues = [];
	if (hasLsb) {
		for (let i = 0; i < numOfHMetrics; i++) {
			lsbValues.push(readI16(d, pos));
			pos += 2;
		}
	} else {
		// Reconstruct from glyf xMin values
		for (let i = 0; i < numOfHMetrics; i++) {
			lsbValues.push(getGlyphXMin(glyfData, locaOffsets, i));
		}
	}

	// Read or reconstruct leftSideBearing array (monospaced tail glyphs)
	const tailCount = numGlyphs - numOfHMetrics;
	const leftSideBearings = [];
	if (hasLeftSideBearing) {
		for (let i = 0; i < tailCount; i++) {
			leftSideBearings.push(readI16(d, pos));
			pos += 2;
		}
	} else {
		for (let i = 0; i < tailCount; i++) {
			leftSideBearings.push(getGlyphXMin(glyfData, locaOffsets, numOfHMetrics + i));
		}
	}

	// Build standard hmtx table
	const hmtxSize = numOfHMetrics * 4 + tailCount * 2;
	const hmtx = new Uint8Array(hmtxSize);
	let wp = 0;

	for (let i = 0; i < numOfHMetrics; i++) {
		hmtx[wp++] = (advanceWidths[i] >> 8) & 0xff;
		hmtx[wp++] = advanceWidths[i] & 0xff;
		const lsb = lsbValues[i] & 0xffff;
		hmtx[wp++] = (lsb >> 8) & 0xff;
		hmtx[wp++] = lsb & 0xff;
	}

	for (let i = 0; i < tailCount; i++) {
		const lsb = leftSideBearings[i] & 0xffff;
		hmtx[wp++] = (lsb >> 8) & 0xff;
		hmtx[wp++] = lsb & 0xff;
	}

	return hmtx;
}

/**
 * Get xMin of glyph from reconstructed glyf data. Returns 0 for empty glyphs.
 */
function getGlyphXMin(glyfData, locaOffsets, glyphIndex) {
	const offset = locaOffsets[glyphIndex];
	const nextOffset = locaOffsets[glyphIndex + 1];
	if (offset === nextOffset) return 0; // empty glyph
	// xMin is at offset+2 (after numberOfContours int16)
	return readI16(glyfData, offset + 2);
}

// ─── Build loca table bytes ─────────────────────────────────────────────────

function buildLocaTable(locaOffsets, indexFormat) {
	if (indexFormat === 0) {
		// Short format: uint16, offsets divided by 2
		const loca = new Uint8Array(locaOffsets.length * 2);
		for (let i = 0; i < locaOffsets.length; i++) {
			const v = locaOffsets[i] >> 1;
			loca[i * 2] = (v >> 8) & 0xff;
			loca[i * 2 + 1] = v & 0xff;
		}
		return loca;
	}
	// Long format: uint32
	const loca = new Uint8Array(locaOffsets.length * 4);
	for (let i = 0; i < locaOffsets.length; i++) {
		const v = locaOffsets[i];
		loca[i * 4] = (v >> 24) & 0xff;
		loca[i * 4 + 1] = (v >> 16) & 0xff;
		loca[i * 4 + 2] = (v >> 8) & 0xff;
		loca[i * 4 + 3] = v & 0xff;
	}
	return loca;
}

// ─── Unwrap (WOFF2 → SFNT) ─────────────────────────────────────────────────

/**
 * Unwrap a WOFF 2.0 file, decompressing and applying reverse transforms to
 * produce a valid SFNT (TTF/OTF) binary.
 *
 * @param {ArrayBuffer} buffer - Raw WOFF2 file bytes.
 * @returns {{ sfnt: ArrayBuffer, metadata: Uint8Array|null, privateData: Uint8Array|null }}
 */
export function unwrapWOFF2(buffer) {
	requireBrotli();

	const bytes = new Uint8Array(buffer);
	const view = new DataView(buffer);

	// ── Parse WOFF2 header (48 bytes) ────────────────────────────────────
	const signature = view.getUint32(0);
	if (signature !== WOFF2_SIGNATURE) {
		throw new Error('Invalid WOFF2 signature');
	}

	const flavor = view.getUint32(4);
	// const length = view.getUint32(8);
	const numTables = view.getUint16(12);
	// const reserved = view.getUint16(14);
	// const totalSfntSize = view.getUint32(16);
	const totalCompressedSize = view.getUint32(20);
	// const majorVersion = view.getUint16(24);
	// const minorVersion = view.getUint16(26);
	const metaOffset = view.getUint32(28);
	const metaLength = view.getUint32(32);
	// const metaOrigLength = view.getUint32(36);
	const privOffset = view.getUint32(40);
	const privLength = view.getUint32(44);

	// ── Parse table directory (variable-length entries) ──────────────────
	let dirPos = WOFF2_HEADER_SIZE;
	const tableEntries = [];

	for (let i = 0; i < numTables; i++) {
		const flags = bytes[dirPos++];
		const tagIndex = flags & 0x3f;
		const transformVersion = (flags >> 6) & 0x03;

		let tag;
		if (tagIndex === 63) {
			// Arbitrary tag follows
			tag = String.fromCharCode(bytes[dirPos], bytes[dirPos + 1], bytes[dirPos + 2], bytes[dirPos + 3]);
			dirPos += 4;
		} else {
			tag = KNOWN_TAGS[tagIndex];
		}

		const { value: origLength, bytesRead: olBytes } = readUIntBase128(bytes, dirPos);
		dirPos += olBytes;

		// transformLength is present only for non-null transforms
		let transformLength = origLength;
		const isGlyfOrLoca = (tag === 'glyf' || tag === 'loca');
		const isHmtx = (tag === 'hmtx');
		const hasTransformLength =
			(isGlyfOrLoca && transformVersion === 0) ||
			(isHmtx && transformVersion === 1) ||
			(!isGlyfOrLoca && !isHmtx && transformVersion !== 0);

		if (hasTransformLength) {
			const { value: tl, bytesRead: tlBytes } = readUIntBase128(bytes, dirPos);
			dirPos += tlBytes;
			transformLength = tl;
		}

		// For loca with transform version 0, transformLength must be 0
		if (tag === 'loca' && transformVersion === 0) {
			transformLength = 0;
		}

		tableEntries.push({
			tag,
			transformVersion,
			origLength,
			transformLength,
			isTransformed: isGlyfOrLoca
				? transformVersion === 0
				: isHmtx
					? transformVersion === 1
					: transformVersion !== 0,
		});
	}

	// ── Parse collection directory (if flavor is ttcf) ──────────────────
	let collectionDirectory = null;
	if (flavor === 0x74746366) {
		const ttcVersion = readU32(bytes, dirPos); dirPos += 4;
		const { value: numFonts, bytesRead: nfBytes } = read255UInt16(bytes, dirPos);
		dirPos += nfBytes;

		const fonts = [];
		for (let f = 0; f < numFonts; f++) {
			const { value: fontNumTables, bytesRead: ntBytes } = read255UInt16(bytes, dirPos);
			dirPos += ntBytes;
			const fontFlavor = readU32(bytes, dirPos); dirPos += 4;

			const indices = [];
			for (let t = 0; t < fontNumTables; t++) {
				const { value: idx, bytesRead: iBytes } = read255UInt16(bytes, dirPos);
				dirPos += iBytes;
				indices.push(idx);
			}
			fonts.push({ numTables: fontNumTables, flavor: fontFlavor, tableIndices: indices });
		}
		collectionDirectory = { version: ttcVersion, numFonts, fonts };
	}

	// ── Brotli-decompress the compressed font data ──────────────────────
	const compressedStart = dirPos;
	const compressedData = bytes.subarray(compressedStart, compressedStart + totalCompressedSize);
	const decompressed = _brotliDecompress(compressedData);

	// ── Split decompressed data into individual tables ──────────────────
	let tableDataPos = 0;
	const tableDataMap = new Map(); // tag → { data, entry }

	for (const entry of tableEntries) {
		const len = entry.isTransformed ? entry.transformLength : entry.origLength;
		const data = decompressed.subarray(tableDataPos, tableDataPos + len);
		tableDataPos += len;
		tableDataMap.set(entry.tag, { data, entry });
	}

	// ── Apply reverse transforms ────────────────────────────────────────
	const reconstructed = new Map(); // tag → Uint8Array

	// First pass: handle glyf/loca transform
	let glyfLocaResult = null;
	const glyfEntry = tableDataMap.get('glyf');
	const locaEntry = tableDataMap.get('loca');

	if (glyfEntry && glyfEntry.entry.isTransformed) {
		const origLocaLength = locaEntry ? locaEntry.entry.origLength : 0;
		glyfLocaResult = reverseGlyfTransform(glyfEntry.data, origLocaLength);
		reconstructed.set('glyf', glyfLocaResult.glyfBytes);
		reconstructed.set('loca', buildLocaTable(
			glyfLocaResult.locaOffsets, glyfLocaResult.indexFormat,
		));
	}

	// Second pass: handle hmtx transform
	const hmtxEntry = tableDataMap.get('hmtx');
	if (hmtxEntry && hmtxEntry.entry.isTransformed && glyfLocaResult) {
		// Need numOfHMetrics from hhea and numGlyphs from maxp
		const hheaData = tableDataMap.get('hhea');
		const maxpData = tableDataMap.get('maxp');
		let numOfHMetrics = 0;
		let numGlyphs = 0;

		if (hheaData) {
			// numberOfHMetrics is at offset 34 in hhea table
			numOfHMetrics = (hheaData.data[34] << 8) | hheaData.data[35];
		}
		if (maxpData) {
			// numGlyphs is at offset 4 in maxp table
			numGlyphs = (maxpData.data[4] << 8) | maxpData.data[5];
		}

		reconstructed.set('hmtx', reverseHmtxTransform(
			hmtxEntry.data, numOfHMetrics, numGlyphs,
			glyfLocaResult.glyfBytes, glyfLocaResult.locaOffsets,
		));
	}

	// Collect all final table data (reconstructed or original)
	const finalTables = [];
	for (const entry of tableEntries) {
		const tag = entry.tag;
		let data;
		if (reconstructed.has(tag)) {
			data = reconstructed.get(tag);
		} else {
			data = tableDataMap.get(tag).data;
		}
		finalTables.push({ tag, data, length: data.length });
	}

	// ── Reassemble SFNT ────────────────────────────────────────────────
	let sfnt;
	if (collectionDirectory) {
		sfnt = reassembleCollection(collectionDirectory, finalTables, tableEntries);
	} else {
		sfnt = reassembleSFNT(flavor, finalTables);
	}

	// ── Extract optional metadata and private data ──────────────────────
	let metadata = null;
	if (metaOffset && metaLength) {
		const metaCompressed = bytes.subarray(metaOffset, metaOffset + metaLength);
		metadata = _brotliDecompress(metaCompressed);
	}

	let privateData = null;
	if (privOffset && privLength) {
		privateData = bytes.slice(privOffset, privOffset + privLength);
	}

	return { sfnt: sfnt.buffer, metadata, privateData };
}

/**
 * Reassemble a single-font SFNT from final table data.
 */
function reassembleSFNT(flavor, tables) {
	const numTables = tables.length;
	const { searchRange, entrySelector, rangeShift } = computeBinarySearchParams(numTables);

	const dirEnd = SFNT_HEADER_SIZE + numTables * SFNT_TABLE_RECORD_SIZE;
	let dataOffset = dirEnd + ((4 - (dirEnd % 4)) % 4);

	// Sort tables alphabetically by tag for the SFNT directory
	const sorted = tables.map((t, i) => ({ ...t, index: i }))
		.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));

	// Calculate total size
	let totalSize = dataOffset;
	for (const t of sorted) {
		totalSize += t.length + ((4 - (t.length % 4)) % 4);
	}

	const sfnt = new Uint8Array(totalSize);
	const sfntView = new DataView(sfnt.buffer);

	// Write SFNT header
	sfntView.setUint32(0, flavor);
	sfntView.setUint16(4, numTables);
	sfntView.setUint16(6, searchRange);
	sfntView.setUint16(8, entrySelector);
	sfntView.setUint16(10, rangeShift);

	// Write table directory and data
	for (let i = 0; i < sorted.length; i++) {
		const t = sorted[i];
		const recPos = SFNT_HEADER_SIZE + i * SFNT_TABLE_RECORD_SIZE;

		// Tag
		for (let j = 0; j < 4; j++) {
			sfnt[recPos + j] = t.tag.charCodeAt(j);
		}

		// Checksum
		const checksum = computeChecksum(t.data);
		sfntView.setUint32(recPos + 4, checksum);

		// Offset and length
		sfntView.setUint32(recPos + 8, dataOffset);
		sfntView.setUint32(recPos + 12, t.length);

		// Copy table data
		sfnt.set(t.data instanceof Uint8Array ? t.data : new Uint8Array(t.data), dataOffset);
		dataOffset += t.length + ((4 - (t.length % 4)) % 4);
	}

	// Recalculate head checkSumAdjustment
	recalcHeadChecksum(sfnt, sorted);

	return sfnt;
}

/**
 * Reassemble a font collection (TTC) from final table data and collection directory.
 */
function reassembleCollection(collDir, finalTables, tableEntries) {
	// Build separate SFNTs for simplicity, then assemble TTC
	// Each font in the collection references a subset of the final tables
	const fontSFNTs = [];

	for (const font of collDir.fonts) {
		const fontTables = font.tableIndices.map(idx => finalTables[idx]);
		const sfntBytes = reassembleSFNT(font.flavor, fontTables);
		fontSFNTs.push(sfntBytes);
	}

	// Build TTC container
	const numFonts = fontSFNTs.length;
	const ttcHeaderSize = 12 + numFonts * 4; // v1: tag(4) + version(4) + numFonts(4) + offsets[numFonts]
	let offset = ttcHeaderSize;

	// Align first font
	offset += (4 - (offset % 4)) % 4;

	const fontOffsets = [];
	let totalSize = offset;
	for (const sfnt of fontSFNTs) {
		fontOffsets.push(totalSize);
		totalSize += sfnt.length;
		totalSize += (4 - (totalSize % 4)) % 4;
	}

	const ttc = new Uint8Array(totalSize);
	const ttcView = new DataView(ttc.buffer);

	// TTC Header
	ttcView.setUint32(0, 0x74746366); // 'ttcf'
	ttcView.setUint32(4, collDir.version);
	ttcView.setUint32(8, numFonts);
	for (let i = 0; i < numFonts; i++) {
		ttcView.setUint32(12 + i * 4, fontOffsets[i]);
	}

	// Copy font data
	for (let i = 0; i < numFonts; i++) {
		ttc.set(fontSFNTs[i], fontOffsets[i]);
	}

	return ttc;
}

// ─── Wrap (SFNT → WOFF2) ───────────────────────────────────────────────────

/**
 * Wrap an SFNT (TTF/OTF) binary into a WOFF 2.0 file.
 *
 * This initial implementation uses null transforms for simplicity:
 * - glyf/loca: transform version 3 (null transform)
 * - hmtx and others: transform version 0 (null transform)
 * This produces valid WOFF2 but with less compression than full transforms.
 *
 * @param {ArrayBuffer} sfntBuffer - Raw SFNT font bytes.
 * @param {Uint8Array|null} [metadata] - Optional extended metadata (raw XML bytes).
 * @param {Uint8Array|null} [privateData] - Optional private data block.
 * @returns {ArrayBuffer} WOFF2 file bytes.
 */
export function wrapWOFF2(sfntBuffer, metadata = null, privateData = null) {
	requireBrotli();

	const sfntView = new DataView(sfntBuffer);
	const sfntBytes = new Uint8Array(sfntBuffer);

	// ── Read SFNT header ─────────────────────────────────────────────────
	const flavor = sfntView.getUint32(0);
	const numTables = sfntView.getUint16(4);

	// ── Read SFNT table directory ────────────────────────────────────────
	const sfntTables = [];
	for (let i = 0; i < numTables; i++) {
		const pos = SFNT_HEADER_SIZE + i * SFNT_TABLE_RECORD_SIZE;
		const tag = String.fromCharCode(
			sfntView.getUint8(pos), sfntView.getUint8(pos + 1),
			sfntView.getUint8(pos + 2), sfntView.getUint8(pos + 3),
		);
		sfntTables.push({
			tag,
			checksum: sfntView.getUint32(pos + 4),
			offset: sfntView.getUint32(pos + 8),
			length: sfntView.getUint32(pos + 12),
		});
	}

	// Remove DSIG table per spec requirement
	const filteredTables = sfntTables.filter(t => t.tag !== 'DSIG');

	// ── Build table directory entries and concatenate table data ─────────
	const dirParts = [];
	const tableDataParts = [];
	let totalOrigSfntSize = SFNT_HEADER_SIZE + filteredTables.length * SFNT_TABLE_RECORD_SIZE;

	for (const entry of filteredTables) {
		const raw = sfntBytes.subarray(entry.offset, entry.offset + entry.length);

		// Determine flags
		const knownIdx = TAG_TO_INDEX.get(entry.tag);
		const isGlyfOrLoca = (entry.tag === 'glyf' || entry.tag === 'loca');

		// Use null transform for glyf/loca (version 3), null for others (version 0)
		const transformVersion = isGlyfOrLoca ? 3 : 0;
		const flagByte = (knownIdx !== undefined ? knownIdx : 63) | (transformVersion << 6);

		const dirEntry = [flagByte];
		// If unknown tag, write 4-byte tag
		if (knownIdx === undefined) {
			for (let j = 0; j < 4; j++) dirEntry.push(entry.tag.charCodeAt(j));
		}

		// origLength
		dirEntry.push(...writeUIntBase128(entry.length));

		// No transformLength for null transforms (version 0 for non-glyf/loca, version 3 for glyf/loca)

		dirParts.push(dirEntry);
		tableDataParts.push(raw);

		totalOrigSfntSize += entry.length + ((4 - (entry.length % 4)) % 4);
	}

	// ── Concatenate all table data and Brotli-compress ───────────────────
	let totalTableDataSize = 0;
	for (const part of tableDataParts) totalTableDataSize += part.length;

	const concatenated = new Uint8Array(totalTableDataSize);
	let copyPos = 0;
	for (const part of tableDataParts) {
		concatenated.set(part, copyPos);
		copyPos += part.length;
	}

	const compressed = _brotliCompress(concatenated);

	// ── Compress metadata if present ─────────────────────────────────────
	let metaCompressed = null;
	let metaOrigLength = 0;
	if (metadata && metadata.length > 0) {
		metaOrigLength = metadata.length;
		metaCompressed = _brotliCompress(metadata);
	}

	// ── Compute layout ──────────────────────────────────────────────────
	let dirBytes = [];
	for (const part of dirParts) dirBytes.push(...part);

	const headerAndDirSize = WOFF2_HEADER_SIZE + dirBytes.length;
	let woffDataOffset = headerAndDirSize;

	// Compressed font data immediately follows
	const compressedOffset = woffDataOffset;
	woffDataOffset += compressed.length;

	// Metadata block (4-byte aligned)
	let metaOff = 0;
	let metaLen = 0;
	if (metaCompressed) {
		woffDataOffset += (4 - (woffDataOffset % 4)) % 4;
		metaOff = woffDataOffset;
		metaLen = metaCompressed.length;
		woffDataOffset += metaLen;
	}

	// Private data block (4-byte aligned)
	let privOff = 0;
	let privLen = 0;
	if (privateData && privateData.length > 0) {
		woffDataOffset += (4 - (woffDataOffset % 4)) % 4;
		privOff = woffDataOffset;
		privLen = privateData.length;
		woffDataOffset += privLen;
	}

	const totalWoffLength = woffDataOffset;

	// ── Write WOFF2 file ────────────────────────────────────────────────
	const woffBuffer = new ArrayBuffer(totalWoffLength);
	const woffView = new DataView(woffBuffer);
	const woffBytes = new Uint8Array(woffBuffer);

	// Header (48 bytes)
	woffView.setUint32(0, WOFF2_SIGNATURE);
	woffView.setUint32(4, flavor);
	woffView.setUint32(8, totalWoffLength);
	woffView.setUint16(12, filteredTables.length);
	woffView.setUint16(14, 0); // reserved
	woffView.setUint32(16, totalOrigSfntSize);
	woffView.setUint32(20, compressed.length);
	woffView.setUint16(24, 0); // majorVersion
	woffView.setUint16(26, 0); // minorVersion
	woffView.setUint32(28, metaOff);
	woffView.setUint32(32, metaLen);
	woffView.setUint32(36, metaOrigLength);
	woffView.setUint32(40, privOff);
	woffView.setUint32(44, privLen);

	// Table directory
	for (let i = 0; i < dirBytes.length; i++) {
		woffBytes[WOFF2_HEADER_SIZE + i] = dirBytes[i];
	}

	// Compressed font data
	woffBytes.set(compressed instanceof Uint8Array ? compressed : new Uint8Array(compressed), compressedOffset);

	// Metadata
	if (metaCompressed) {
		woffBytes.set(
			metaCompressed instanceof Uint8Array ? metaCompressed : new Uint8Array(metaCompressed),
			metaOff,
		);
	}

	// Private data
	if (privateData && privateData.length > 0) {
		woffBytes.set(privateData, privOff);
	}

	return woffBuffer;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function readU32(data, pos) {
	return ((data[pos] << 24) | (data[pos + 1] << 16) |
		(data[pos + 2] << 8) | data[pos + 3]) >>> 0;
}

function readI16(data, pos) {
	const v = (data[pos] << 8) | data[pos + 1];
	return v > 0x7fff ? v - 0x10000 : v;
}

function pushInt16(arr, val) {
	const v = val & 0xffff;
	arr.push((v >> 8) & 0xff, v & 0xff);
}

function pushUint16(arr, val) {
	arr.push((val >> 8) & 0xff, val & 0xff);
}

function computeBinarySearchParams(numTables) {
	let searchRange = 1;
	let entrySelector = 0;
	while (searchRange * 2 <= numTables) {
		searchRange *= 2;
		entrySelector++;
	}
	searchRange *= 16;
	const rangeShift = numTables * 16 - searchRange;
	return { searchRange, entrySelector, rangeShift };
}

/**
 * Compute checksum for a block of table data.
 */
function computeChecksum(data) {
	let sum = 0;
	const len = data.length;
	const padded = len + ((4 - (len % 4)) % 4);
	for (let i = 0; i < padded; i += 4) {
		sum = (sum + (
			((data[i] || 0) << 24) |
			((data[i + 1] || 0) << 16) |
			((data[i + 2] || 0) << 8) |
			(data[i + 3] || 0)
		)) >>> 0;
	}
	return sum;
}

/**
 * Recalculate head table checksumAdjustment after SFNT assembly.
 */
function recalcHeadChecksum(sfntBytes, sortedTables) {
	// Find head table offset
	let headOffset = -1;
	for (const t of sortedTables) {
		if (t.tag === 'head') {
			// Look up from the SFNT directory
			const numTables = (sfntBytes[4] << 8) | sfntBytes[5];
			for (let i = 0; i < numTables; i++) {
				const recPos = SFNT_HEADER_SIZE + i * SFNT_TABLE_RECORD_SIZE;
				const tag = String.fromCharCode(
					sfntBytes[recPos], sfntBytes[recPos + 1],
					sfntBytes[recPos + 2], sfntBytes[recPos + 3],
				);
				if (tag === 'head') {
					headOffset = (sfntBytes[recPos + 8] << 24) |
						(sfntBytes[recPos + 9] << 16) |
						(sfntBytes[recPos + 10] << 8) |
						sfntBytes[recPos + 11];
					break;
				}
			}
			break;
		}
	}

	if (headOffset < 0) return; // no head table

	// Zero out checksumAdjustment before computing whole-file checksum
	sfntBytes[headOffset + 8] = 0;
	sfntBytes[headOffset + 9] = 0;
	sfntBytes[headOffset + 10] = 0;
	sfntBytes[headOffset + 11] = 0;

	// Compute whole-file checksum
	const fileChecksum = computeChecksum(sfntBytes);
	const adjustment = (0xb1b0afba - fileChecksum) >>> 0;

	// Write checksumAdjustment
	sfntBytes[headOffset + 8] = (adjustment >> 24) & 0xff;
	sfntBytes[headOffset + 9] = (adjustment >> 16) & 0xff;
	sfntBytes[headOffset + 10] = (adjustment >> 8) & 0xff;
	sfntBytes[headOffset + 11] = adjustment & 0xff;
}
