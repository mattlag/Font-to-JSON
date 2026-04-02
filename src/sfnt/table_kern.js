/**
 * Font Flux JS : kern table
 * Kerning Table (legacy)
 *
 * Supports OpenType 'kern' version 0 and Apple 'kern' version 1.0.
 *
 * OpenType subtable formats:
 *   Format 0 — Ordered list of kerning pairs (fully parsed)
 *   Format 2 — Class-based n×m kerning array (fully parsed)
 *
 * Apple subtable formats:
 *   Format 0 — Ordered list of kerning pairs (fully parsed)
 *   Format 1 — State table for contextual kerning (fully parsed)
 *   Format 2 — Class-based n×m kerning array (fully parsed)
 *   Format 3 — Compact class-based kerning (fully parsed)
 *
 * Unknown formats are preserved as raw bytes for lossless round-trip.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const OT_HEADER_SIZE = 4;
const OT_SUBTABLE_HEADER_SIZE = 6;
const APPLE_HEADER_SIZE = 8;
const APPLE_SUBTABLE_HEADER_SIZE = 8;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a kern table from raw bytes.
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseKern(rawBytes) {
	const reader = new DataReader(rawBytes);
	const maybeAppleVersion = rawBytes.length >= 4 ? reader.uint32() : 0;

	if (maybeAppleVersion === 0x00010000) {
		return parseAppleKern(rawBytes);
	}

	return parseOpenTypeKern(rawBytes);
}

function parseOpenTypeKern(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint16();
	const nTables = reader.uint16();

	const subtables = [];
	let pos = OT_HEADER_SIZE;

	for (let i = 0; i < nTables; i++) {
		if (pos + OT_SUBTABLE_HEADER_SIZE > rawBytes.length) {
			break;
		}

		reader.seek(pos);
		const subVersion = reader.uint16();
		const length = reader.uint16();
		const coverage = reader.uint16();
		const format = (coverage >> 8) & 0xff;

		const end = Math.min(
			rawBytes.length,
			pos + Math.max(length, OT_SUBTABLE_HEADER_SIZE),
		);
		const bodyStart = pos + OT_SUBTABLE_HEADER_SIZE;
		const bodyRaw = Array.from(rawBytes.slice(bodyStart, end));

		const subtable = {
			version: subVersion,
			coverage,
			format,
		};

		if (format === 0) {
			Object.assign(subtable, parseOpenTypeKernFormat0(bodyRaw));
		} else if (format === 2) {
			Object.assign(subtable, parseKernFormat2(bodyRaw));
		} else {
			subtable._raw = bodyRaw;
		}

		subtables.push(subtable);
		pos = end;
	}

	return {
		formatVariant: 'opentype',
		version,
		nTables,
		subtables,
	};
}

function parseOpenTypeKernFormat0(bodyRaw) {
	const reader = new DataReader(bodyRaw);
	if (bodyRaw.length < 8) {
		return {
			nPairs: 0,
			searchRange: 0,
			entrySelector: 0,
			rangeShift: 0,
			pairs: [],
		};
	}

	const nPairs = reader.uint16();
	reader.uint16();
	reader.uint16();
	reader.uint16();
	const pairs = [];

	for (let i = 0; i < nPairs; i++) {
		if (reader.position + 6 > bodyRaw.length) {
			break;
		}
		pairs.push({
			left: reader.uint16(),
			right: reader.uint16(),
			value: reader.int16(),
		});
	}

	const normalizedNPairs = pairs.length;
	const normalizedEntrySelector = Math.floor(
		Math.log2(Math.max(1, normalizedNPairs)),
	);
	const normalizedSearchRange = Math.pow(2, normalizedEntrySelector) * 6;
	const normalizedRangeShift = normalizedNPairs * 6 - normalizedSearchRange;

	return {
		nPairs: normalizedNPairs,
		searchRange: normalizedSearchRange,
		entrySelector: normalizedEntrySelector,
		rangeShift: normalizedRangeShift,
		pairs,
	};
}

// ---------------------------------------------------------------------------
//  Apple kern Format 0 — Ordered pair list (identical body to OT Format 0)
// ---------------------------------------------------------------------------

function parseAppleKernFormat0(bodyRaw) {
	return parseOpenTypeKernFormat0(bodyRaw);
}

// ---------------------------------------------------------------------------
//  kern Format 2 — Class-based n×m array (shared by OpenType and Apple)
// ---------------------------------------------------------------------------

function parseKernFormat2(bodyRaw) {
	const reader = new DataReader(bodyRaw);
	if (bodyRaw.length < 8) return { _raw: bodyRaw };

	const rowWidth = reader.uint16();
	const leftOffsetTable = reader.uint16();
	const rightOffsetTable = reader.uint16();
	const kerningArrayOffset = reader.uint16();

	const leftClassTable = parseKernClassTable(reader, bodyRaw, leftOffsetTable);
	const rightClassTable = parseKernClassTable(
		reader,
		bodyRaw,
		rightOffsetTable,
	);

	// Determine dimensions from class tables and rowWidth
	// rowWidth = nRightClasses * 2 (each kerning value is an int16)
	const nRightClasses = rowWidth > 0 ? rowWidth / 2 : 0;
	// Left class offsets are pre-multiplied by rowWidth (byte offsets into the
	// kerning array from the body start). The number of distinct rows =
	// (maxOffset - kerningArrayOffset) / rowWidth + 1.
	const nLeftClasses =
		rowWidth > 0 && leftClassTable.maxOffset >= kerningArrayOffset
			? Math.floor((leftClassTable.maxOffset - kerningArrayOffset) / rowWidth) +
				1
			: 1;

	// Read the kerning values array
	const values = [];
	for (let r = 0; r < nLeftClasses; r++) {
		const row = [];
		const rowStart = kerningArrayOffset + r * rowWidth;
		for (let c = 0; c < nRightClasses; c++) {
			const off = rowStart + c * 2;
			if (off + 2 <= bodyRaw.length) {
				reader.seek(off);
				row.push(reader.int16());
			} else {
				row.push(0);
			}
		}
		values.push(row);
	}

	return {
		rowWidth,
		leftOffsetTable,
		rightOffsetTable,
		kerningArrayOffset,
		leftClassTable,
		rightClassTable,
		nLeftClasses,
		nRightClasses,
		values,
	};
}

/**
 * Parse a kern Format 2 class table at the given byte offset within bodyRaw.
 * Returns { firstGlyph, nGlyphs, offsets, classMap, maxClass }.
 *
 * offsets[] are the raw pre-multiplied offsets stored in the font.
 * classMap is a Map<glyphIndex, classIndex> for easy lookup.
 */
function parseKernClassTable(reader, bodyRaw, tableOffset) {
	if (tableOffset + 4 > bodyRaw.length) {
		return {
			firstGlyph: 0,
			nGlyphs: 0,
			offsets: [],
			maxOffset: 0,
		};
	}
	reader.seek(tableOffset);
	const firstGlyph = reader.uint16();
	const nGlyphs = reader.uint16();

	const offsets = [];
	let maxOffset = 0;
	for (let i = 0; i < nGlyphs; i++) {
		if (reader.position + 2 <= bodyRaw.length) {
			const off = reader.uint16();
			offsets.push(off);
			if (off > maxOffset) maxOffset = off;
		} else {
			offsets.push(0);
		}
	}

	// maxClass is derived from the maximum offset.
	// Left class offsets are pre-multiplied by rowWidth (byte offsets into the
	// kerning array relative to its start). Right class offsets are plain byte
	// offsets (column index × 2). We don't know rowWidth here, so we report
	// the raw max and let the caller normalise.
	return { firstGlyph, nGlyphs, offsets, maxOffset };
}

// ---------------------------------------------------------------------------
//  Apple kern Format 3 — Compact class-based kerning (uint8 classes/indices)
// ---------------------------------------------------------------------------

function parseAppleKernFormat3(bodyRaw) {
	const reader = new DataReader(bodyRaw);
	if (bodyRaw.length < 8) return { _raw: bodyRaw };

	const glyphCount = reader.uint16();
	const kernValueCount = reader.uint8();
	const leftClassCount = reader.uint8();
	const rightClassCount = reader.uint8();
	const flags = reader.uint8();

	// kernValues: array of FWord (int16)
	const kernValues = [];
	for (let i = 0; i < kernValueCount; i++) {
		if (reader.position + 2 <= bodyRaw.length) {
			kernValues.push(reader.int16());
		} else {
			kernValues.push(0);
		}
	}

	// leftClass: uint8 per glyph
	const leftClasses = [];
	for (let i = 0; i < glyphCount; i++) {
		if (reader.position < bodyRaw.length) {
			leftClasses.push(reader.uint8());
		} else {
			leftClasses.push(0);
		}
	}

	// rightClass: uint8 per glyph
	const rightClasses = [];
	for (let i = 0; i < glyphCount; i++) {
		if (reader.position < bodyRaw.length) {
			rightClasses.push(reader.uint8());
		} else {
			rightClasses.push(0);
		}
	}

	// kernIndex: uint8 array of leftClassCount * rightClassCount
	const kernIndices = [];
	const indexCount = leftClassCount * rightClassCount;
	for (let i = 0; i < indexCount; i++) {
		if (reader.position < bodyRaw.length) {
			kernIndices.push(reader.uint8());
		} else {
			kernIndices.push(0);
		}
	}

	return {
		glyphCount,
		kernValueCount,
		leftClassCount,
		rightClassCount,
		flags,
		kernValues,
		leftClasses,
		rightClasses,
		kernIndices,
	};
}

// ---------------------------------------------------------------------------
//  Apple kern Format 1 — State table for contextual kerning
// ---------------------------------------------------------------------------

function parseAppleKernFormat1(bodyRaw) {
	const reader = new DataReader(bodyRaw);
	// State table header (6 uint16s starting at offset 0 of the body)
	if (bodyRaw.length < 12) return { _raw: bodyRaw };

	const stateSize = reader.uint16(); // number of classes
	const classTableOffset = reader.uint16();
	const stateArrayOffset = reader.uint16();
	const entryTableOffset = reader.uint16();
	const valueTableOffset = reader.uint16(); // format 1 specific

	// -- Parse class table --
	let classFirstGlyph = 0;
	let classNGlyphs = 0;
	let classArray = [];
	if (classTableOffset + 4 <= bodyRaw.length) {
		reader.seek(classTableOffset);
		classFirstGlyph = reader.uint16();
		classNGlyphs = reader.uint16();
		classArray = [];
		for (let i = 0; i < classNGlyphs; i++) {
			if (reader.position < bodyRaw.length) {
				classArray.push(reader.uint8());
			} else {
				classArray.push(1); // default: out-of-bounds class
			}
		}
	}

	// -- Parse state array --
	// Each state is stateSize bytes (one byte per class → entry index)
	// States run from stateArrayOffset to entryTableOffset
	const stateArrayEnd = Math.min(entryTableOffset, bodyRaw.length);
	const nStates =
		stateSize > 0
			? Math.floor((stateArrayEnd - stateArrayOffset) / stateSize)
			: 0;
	const states = [];
	for (let s = 0; s < nStates; s++) {
		const stateStart = stateArrayOffset + s * stateSize;
		reader.seek(stateStart);
		const entries = [];
		for (let c = 0; c < stateSize; c++) {
			if (reader.position < bodyRaw.length) {
				entries.push(reader.uint8());
			} else {
				entries.push(0);
			}
		}
		states.push(entries);
	}

	// -- Parse entry table --
	// Each entry is 4 bytes: uint16 newStateOffset, uint16 flags
	// Entries run from entryTableOffset to valueTableOffset (or end of body)
	const entryTableEnd = Math.min(
		valueTableOffset > entryTableOffset ? valueTableOffset : bodyRaw.length,
		bodyRaw.length,
	);
	const nEntries = Math.floor((entryTableEnd - entryTableOffset) / 4);
	const entryTable = [];
	reader.seek(entryTableOffset);
	for (let e = 0; e < nEntries; e++) {
		if (reader.position + 4 <= bodyRaw.length) {
			const newStateOffset = reader.uint16();
			const flags = reader.uint16();
			entryTable.push({ newStateOffset, flags });
		}
	}

	// -- Parse value table --
	// FWord (int16) values from valueTableOffset to end of body
	const valueTable = [];
	if (valueTableOffset < bodyRaw.length) {
		reader.seek(valueTableOffset);
		while (reader.position + 2 <= bodyRaw.length) {
			valueTable.push(reader.int16());
		}
	}

	return {
		stateSize,
		classTableOffset,
		stateArrayOffset,
		entryTableOffset,
		valueTableOffset,
		classTable: {
			firstGlyph: classFirstGlyph,
			nGlyphs: classNGlyphs,
			classArray,
		},
		states,
		entryTable,
		valueTable,
	};
}

function parseAppleKern(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint32();
	const nTables = reader.uint32();

	const subtables = [];
	let pos = APPLE_HEADER_SIZE;

	for (let i = 0; i < nTables; i++) {
		if (pos + APPLE_SUBTABLE_HEADER_SIZE > rawBytes.length) {
			break;
		}

		reader.seek(pos);
		const length = reader.uint32();
		const coverage = reader.uint8();
		const format = reader.uint8();
		const tupleIndex = reader.uint16();

		const end = Math.min(
			rawBytes.length,
			pos + Math.max(length, APPLE_SUBTABLE_HEADER_SIZE),
		);
		const bodyRaw = Array.from(
			rawBytes.slice(pos + APPLE_SUBTABLE_HEADER_SIZE, end),
		);

		const subtable = {
			coverage,
			format,
			tupleIndex,
		};

		if (format === 0) {
			Object.assign(subtable, parseAppleKernFormat0(bodyRaw));
		} else if (format === 1) {
			Object.assign(subtable, parseAppleKernFormat1(bodyRaw));
		} else if (format === 2) {
			Object.assign(subtable, parseKernFormat2(bodyRaw));
		} else if (format === 3) {
			Object.assign(subtable, parseAppleKernFormat3(bodyRaw));
		} else {
			subtable._raw = bodyRaw;
		}

		subtables.push(subtable);

		pos = end;
	}

	return {
		formatVariant: 'apple',
		version,
		nTables,
		subtables,
	};
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a kern JSON object back to raw bytes.
 *
 * @param {object} kern - Parsed kern table data
 * @returns {number[]} Array of byte values
 */
export function writeKern(kern) {
	if (kern.formatVariant === 'apple') {
		return writeAppleKern(kern);
	}
	return writeOpenTypeKern(kern);
}

function writeOpenTypeKern(kern) {
	const version = kern.version ?? 0;
	const subtables = kern.subtables ?? [];
	const subtableBytes = subtables.map((subtable) =>
		writeOpenTypeSubtable(subtable),
	);
	const nTables = subtables.length;
	const totalSize =
		OT_HEADER_SIZE +
		subtableBytes.reduce((sum, bytes) => sum + bytes.length, 0);
	const w = new DataWriter(totalSize);

	w.uint16(version);
	w.uint16(nTables);
	for (const bytes of subtableBytes) {
		w.rawBytes(bytes);
	}
	return w.toArray();
}

function writeOpenTypeSubtable(subtable) {
	const body = subtable._raw
		? subtable._raw
		: subtable.format === 0
			? writeOpenTypeKernFormat0Body(subtable)
			: subtable.format === 2
				? writeKernFormat2Body(subtable)
				: [];
	const length = OT_SUBTABLE_HEADER_SIZE + body.length;
	const coverage = subtable.coverage ?? (subtable.format ?? 0) << 8;
	const w = new DataWriter(length);
	w.uint16(subtable.version ?? 0);
	w.uint16(length);
	w.uint16(coverage);
	w.rawBytes(body);
	return w.toArray();
}

function writeOpenTypeKernFormat0Body(subtable) {
	const pairs = subtable.pairs ?? [];
	const nPairs = pairs.length;
	const entrySelector = Math.floor(Math.log2(Math.max(1, nPairs)));
	const searchRange = Math.pow(2, entrySelector) * 6;
	const rangeShift = nPairs * 6 - searchRange;
	const w = new DataWriter(8 + nPairs * 6);
	w.uint16(nPairs);
	w.uint16(subtable.searchRange ?? searchRange);
	w.uint16(subtable.entrySelector ?? entrySelector);
	w.uint16(subtable.rangeShift ?? rangeShift);
	for (const pair of pairs) {
		w.uint16(pair.left);
		w.uint16(pair.right);
		w.int16(pair.value);
	}
	return w.toArray();
}

function writeAppleKern(kern) {
	const version = kern.version ?? 0x00010000;
	const subtables = kern.subtables ?? [];
	const subtableBytes = subtables.map((subtable) => {
		const body = writeAppleSubtableBody(subtable);
		const length = APPLE_SUBTABLE_HEADER_SIZE + body.length;
		const w = new DataWriter(length);
		w.uint32(length);
		w.uint8(subtable.coverage ?? 0);
		w.uint8(subtable.format ?? 0);
		w.uint16(subtable.tupleIndex ?? 0);
		w.rawBytes(body);
		return w.toArray();
	});

	const nTables = subtables.length;
	const totalSize =
		APPLE_HEADER_SIZE +
		subtableBytes.reduce((sum, bytes) => sum + bytes.length, 0);
	const w = new DataWriter(totalSize);
	w.uint32(version);
	w.uint32(nTables);
	for (const bytes of subtableBytes) {
		w.rawBytes(bytes);
	}
	return w.toArray();
}

// ===========================================================================
//  FORMAT-SPECIFIC BODY WRITERS
// ===========================================================================

/**
 * Dispatch Apple subtable body writing by format.
 */
function writeAppleSubtableBody(subtable) {
	if (subtable._raw) return subtable._raw;
	switch (subtable.format) {
		case 0:
			return writeOpenTypeKernFormat0Body(subtable);
		case 1:
			return writeAppleKernFormat1Body(subtable);
		case 2:
			return writeKernFormat2Body(subtable);
		case 3:
			return writeAppleKernFormat3Body(subtable);
		default:
			return [];
	}
}

/**
 * Write kern Format 2 body (class-based n×m array — shared by OT and Apple).
 */
function writeKernFormat2Body(subtable) {
	const {
		rowWidth,
		leftOffsetTable,
		rightOffsetTable,
		kerningArrayOffset,
		leftClassTable,
		rightClassTable,
		nLeftClasses,
		nRightClasses,
		values,
	} = subtable;

	// Reconstruct left/right class table bytes
	const leftClassBytes = writeKernClassTable(leftClassTable);
	const rightClassBytes = writeKernClassTable(rightClassTable);

	// Kerning array: nLeftClasses × nRightClasses × 2 bytes
	const arraySize = nLeftClasses * nRightClasses * 2;

	const totalSize = Math.max(
		kerningArrayOffset + arraySize,
		leftOffsetTable + leftClassBytes.length,
		rightOffsetTable + rightClassBytes.length,
		8, // header
	);

	const w = new DataWriter(totalSize);
	w.uint16(rowWidth);
	w.uint16(leftOffsetTable);
	w.uint16(rightOffsetTable);
	w.uint16(kerningArrayOffset);

	w.seek(leftOffsetTable);
	w.rawBytes(leftClassBytes);

	w.seek(rightOffsetTable);
	w.rawBytes(rightClassBytes);

	w.seek(kerningArrayOffset);
	for (let r = 0; r < nLeftClasses; r++) {
		const row = values[r] || [];
		for (let c = 0; c < nRightClasses; c++) {
			w.int16(row[c] || 0);
		}
	}

	return w.toArray();
}

/**
 * Write a kern Format 2 class table.
 */
function writeKernClassTable(classTable) {
	const { firstGlyph, nGlyphs, offsets } = classTable;
	const w = new DataWriter(4 + nGlyphs * 2);
	w.uint16(firstGlyph);
	w.uint16(nGlyphs);
	for (let i = 0; i < nGlyphs; i++) {
		w.uint16(offsets[i] || 0);
	}
	return w.toArray();
}

/**
 * Write Apple kern Format 3 body (compact class-based).
 */
function writeAppleKernFormat3Body(subtable) {
	const {
		glyphCount,
		kernValueCount,
		leftClassCount,
		rightClassCount,
		flags,
		kernValues,
		leftClasses,
		rightClasses,
		kernIndices,
	} = subtable;

	const indexCount = leftClassCount * rightClassCount;
	const totalSize =
		6 + // header: uint16 + 4×uint8
		kernValueCount * 2 + // int16 values
		glyphCount + // left class uint8
		glyphCount + // right class uint8
		indexCount; // indices uint8

	const w = new DataWriter(totalSize);
	w.uint16(glyphCount);
	w.uint8(kernValueCount);
	w.uint8(leftClassCount);
	w.uint8(rightClassCount);
	w.uint8(flags ?? 0);

	for (let i = 0; i < kernValueCount; i++) {
		w.int16(kernValues[i] || 0);
	}
	for (let i = 0; i < glyphCount; i++) {
		w.uint8(leftClasses[i] || 0);
	}
	for (let i = 0; i < glyphCount; i++) {
		w.uint8(rightClasses[i] || 0);
	}
	for (let i = 0; i < indexCount; i++) {
		w.uint8(kernIndices[i] || 0);
	}

	return w.toArray();
}

/**
 * Write Apple kern Format 1 body (state table for contextual kerning).
 */
function writeAppleKernFormat1Body(subtable) {
	const {
		stateSize,
		classTableOffset,
		stateArrayOffset,
		entryTableOffset,
		valueTableOffset,
		classTable,
		states,
		entryTable,
		valueTable,
	} = subtable;

	// Class table: 4 bytes header + nGlyphs × 1 byte
	const classTableSize = 4 + (classTable?.nGlyphs || 0);
	// State array: nStates × stateSize bytes
	const stateArraySize = (states?.length || 0) * stateSize;
	// Entry table: nEntries × 4 bytes
	const entryTableSize = (entryTable?.length || 0) * 4;
	// Value table: nValues × 2 bytes
	const valueTableSize = (valueTable?.length || 0) * 2;

	const totalSize = Math.max(
		10, // header: 5 × uint16
		classTableOffset + classTableSize,
		stateArrayOffset + stateArraySize,
		entryTableOffset + entryTableSize,
		valueTableOffset + valueTableSize,
	);

	const w = new DataWriter(totalSize);

	// Header
	w.uint16(stateSize);
	w.uint16(classTableOffset);
	w.uint16(stateArrayOffset);
	w.uint16(entryTableOffset);
	w.uint16(valueTableOffset);

	// Class table
	w.seek(classTableOffset);
	w.uint16(classTable?.firstGlyph || 0);
	w.uint16(classTable?.nGlyphs || 0);
	if (classTable?.classArray) {
		for (const c of classTable.classArray) {
			w.uint8(c);
		}
	}

	// State array
	w.seek(stateArrayOffset);
	if (states) {
		for (const state of states) {
			for (const entry of state) {
				w.uint8(entry);
			}
		}
	}

	// Entry table
	w.seek(entryTableOffset);
	if (entryTable) {
		for (const entry of entryTable) {
			w.uint16(entry.newStateOffset);
			w.uint16(entry.flags);
		}
	}

	// Value table
	w.seek(valueTableOffset);
	if (valueTable) {
		for (const val of valueTable) {
			w.int16(val);
		}
	}

	return w.toArray();
}
