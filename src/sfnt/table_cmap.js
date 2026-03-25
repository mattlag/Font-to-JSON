/**
 * Font Flux JS : OTF cmap table
 * Character to Glyph Index Mapping Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/cmap
 *
 * Supported subtable formats: 0, 2, 4, 6, 8, 10, 12, 13, 14
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a cmap table from raw bytes.
 *
 * cmap header (4 bytes):
 *   uint16  version         — must be 0
 *   uint16  numTables
 *
 * Followed by numTables EncodingRecords (8 bytes each):
 *   uint16  platformID
 *   uint16  encodingID
 *   Offset32 subtableOffset  — from beginning of cmap table
 *
 * Multiple encoding records may point to the same subtable offset;
 * we deduplicate them and use a subtableIndex reference.
 *
 * @param {number[]} rawBytes
 * @returns {{ version: number, encodingRecords: Array, subtables: Array }}
 */
export function parseCmap(rawBytes) {
	const reader = new DataReader(rawBytes);

	const version = reader.uint16();
	const numTables = reader.uint16();

	// Read encoding records and collect unique subtable offsets
	const records = [];
	const offsetSet = new Set();

	for (let i = 0; i < numTables; i++) {
		const platformID = reader.uint16();
		const encodingID = reader.uint16();
		const subtableOffset = reader.offset32();
		offsetSet.add(subtableOffset);
		records.push({ platformID, encodingID, subtableOffset });
	}

	// Parse each unique subtable once, keyed by offset
	const uniqueOffsets = [...offsetSet].sort((a, b) => a - b);
	const subtables = uniqueOffsets.map((off) => parseSubtable(reader, off));
	const offsetToIndex = new Map(uniqueOffsets.map((off, i) => [off, i]));

	// Build encoding records with subtable indices instead of raw offsets
	const encodingRecords = records.map((r) => ({
		platformID: r.platformID,
		encodingID: r.encodingID,
		subtableIndex: offsetToIndex.get(r.subtableOffset),
	}));

	return { version, encodingRecords, subtables };
}

// --- Subtable dispatch ------------------------------------------------------

function parseSubtable(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	switch (format) {
		case 0:
			return parseFormat0(reader);
		case 2:
			return parseFormat2(reader, offset);
		case 4:
			return parseFormat4(reader, offset);
		case 6:
			return parseFormat6(reader);
		case 8:
			return parseFormat8(reader);
		case 10:
			return parseFormat10(reader);
		case 12:
			return parseFormat12(reader);
		case 13:
			return parseFormat13(reader);
		case 14:
			return parseFormat14(reader, offset);
		default:
			return parseFormatRaw(reader, offset, format);
	}
}

// --- Format 0 : Byte encoding table ----------------------------------------

function parseFormat0(reader) {
	// format already read; length(2) + language(2) + glyphIdArray(256×1)
	reader.skip(2); // length
	const language = reader.uint16();
	const glyphIdArray = reader.array('uint8', 256);
	return { format: 0, language, glyphIdArray };
}

// --- Format 2 : High byte mapping through table ----------------------------

function parseFormat2(reader, subtableOffset) {
	// format already read
	const length = reader.uint16();
	const language = reader.uint16();
	const subHeaderKeys = reader.array('uint16', 256);

	// Determine number of SubHeaders: max(subHeaderKeys)/8 + 1
	let maxKey = 0;
	for (let i = 0; i < 256; i++) {
		if (subHeaderKeys[i] > maxKey) maxKey = subHeaderKeys[i];
	}
	const numSubHeaders = maxKey / 8 + 1;

	const subHeaders = [];
	for (let i = 0; i < numSubHeaders; i++) {
		subHeaders.push({
			firstCode: reader.uint16(),
			entryCount: reader.uint16(),
			idDelta: reader.int16(),
			idRangeOffset: reader.uint16(),
		});
	}

	// Remaining bytes are the glyphIdArray
	const glyphIdArrayStart = reader.position;
	const glyphIdArrayEnd = subtableOffset + length;
	const glyphIdCount = (glyphIdArrayEnd - glyphIdArrayStart) / 2;
	const glyphIdArray = reader.array('uint16', glyphIdCount);

	return { format: 2, language, subHeaderKeys, subHeaders, glyphIdArray };
}

// --- Format 4 : Segment mapping to delta values ----------------------------

function parseFormat4(reader, subtableOffset) {
	// format already read
	const length = reader.uint16();
	const language = reader.uint16();
	const segCountX2 = reader.uint16();
	const segCount = segCountX2 / 2;
	reader.skip(6); // searchRange, entrySelector, rangeShift — derivable

	const endCodes = reader.array('uint16', segCount);
	reader.skip(2); // reservedPad
	const startCodes = reader.array('uint16', segCount);
	const idDeltas = reader.array('int16', segCount);
	const idRangeOffsets = reader.array('uint16', segCount);

	const glyphIdArrayBase = reader.position;
	const glyphIdCount = (length - (glyphIdArrayBase - subtableOffset)) / 2;
	const glyphIdArray = reader.array('uint16', glyphIdCount);

	const segments = [];
	for (let i = 0; i < segCount; i++) {
		segments.push({
			endCode: endCodes[i],
			startCode: startCodes[i],
			idDelta: idDeltas[i],
			idRangeOffset: idRangeOffsets[i],
		});
	}

	return { format: 4, language, segments, glyphIdArray };
}

// --- Format 6 : Trimmed table mapping --------------------------------------

function parseFormat6(reader) {
	// format already read
	reader.skip(2); // length
	const language = reader.uint16();
	const firstCode = reader.uint16();
	const entryCount = reader.uint16();
	const glyphIdArray = reader.array('uint16', entryCount);
	return { format: 6, language, firstCode, glyphIdArray };
}

// --- Format 12 : Segmented coverage ----------------------------------------

function parseFormat12(reader) {
	// format already read; reserved(2) + length(4) + language(4) + numGroups(4) = 14 bytes
	reader.skip(2); // reserved
	reader.skip(4); // length
	const language = reader.uint32();
	const numGroups = reader.uint32();
	const groups = [];
	for (let i = 0; i < numGroups; i++) {
		groups.push({
			startCharCode: reader.uint32(),
			endCharCode: reader.uint32(),
			startGlyphID: reader.uint32(),
		});
	}
	return { format: 12, language, groups };
}

// --- Format 13 : Many-to-one range mappings --------------------------------

function parseFormat13(reader) {
	// Same binary layout as format 12, different field semantics
	reader.skip(2); // reserved
	reader.skip(4); // length
	const language = reader.uint32();
	const numGroups = reader.uint32();
	const groups = [];
	for (let i = 0; i < numGroups; i++) {
		groups.push({
			startCharCode: reader.uint32(),
			endCharCode: reader.uint32(),
			glyphID: reader.uint32(),
		});
	}
	return { format: 13, language, groups };
}

// --- Format 14 : Unicode variation sequences --------------------------------

function parseFormat14(reader, subtableOffset) {
	// format already read; length(4) + numVarSelectorRecords(4)
	reader.skip(4); // length
	const numVarSelectorRecords = reader.uint32();

	const varSelectorRecords = [];
	for (let i = 0; i < numVarSelectorRecords; i++) {
		const varSelector = reader.uint24();
		const defaultUVSOffset = reader.offset32();
		const nonDefaultUVSOffset = reader.offset32();

		let defaultUVS = null;
		if (defaultUVSOffset !== 0) {
			const saved = reader.position;
			defaultUVS = parseDefaultUVS(reader, subtableOffset + defaultUVSOffset);
			reader.seek(saved);
		}

		let nonDefaultUVS = null;
		if (nonDefaultUVSOffset !== 0) {
			const saved = reader.position;
			nonDefaultUVS = parseNonDefaultUVS(
				reader,
				subtableOffset + nonDefaultUVSOffset,
			);
			reader.seek(saved);
		}

		varSelectorRecords.push({ varSelector, defaultUVS, nonDefaultUVS });
	}

	return { format: 14, varSelectorRecords };
}

function parseDefaultUVS(reader, offset) {
	reader.seek(offset);
	const numRanges = reader.uint32();
	const ranges = [];
	for (let i = 0; i < numRanges; i++) {
		ranges.push({
			startUnicodeValue: reader.uint24(),
			additionalCount: reader.uint8(),
		});
	}
	return ranges;
}

function parseNonDefaultUVS(reader, offset) {
	reader.seek(offset);
	const numMappings = reader.uint32();
	const mappings = [];
	for (let i = 0; i < numMappings; i++) {
		mappings.push({
			unicodeValue: reader.uint24(),
			glyphID: reader.uint16(),
		});
	}
	return mappings;
}

// --- Format 8 : Mixed 16-bit and 32-bit coverage ---------------------------

function parseFormat8(reader) {
	// format already read
	reader.skip(2); // reserved
	reader.skip(4); // length
	const language = reader.uint32();
	const is32 = reader.bytes(8192);
	const numGroups = reader.uint32();
	const groups = [];
	for (let i = 0; i < numGroups; i++) {
		groups.push({
			startCharCode: reader.uint32(),
			endCharCode: reader.uint32(),
			startGlyphID: reader.uint32(),
		});
	}
	return { format: 8, language, is32, groups };
}

// --- Format 10 : Trimmed array ----------------------------------------------

function parseFormat10(reader) {
	// format already read
	reader.skip(2); // reserved
	reader.skip(4); // length
	const language = reader.uint32();
	const startCharCode = reader.uint32();
	const numChars = reader.uint32();
	const glyphIdArray = reader.array('uint16', numChars);
	return { format: 10, language, startCharCode, glyphIdArray };
}

// --- Raw fallback for unsupported formats -----------------------------------

function parseFormatRaw(reader, subtableOffset, format) {
	let length;
	if (format >= 8) {
		// 32-bit formats: uint16 reserved + uint32 length
		reader.skip(2);
		length = reader.uint32();
	} else {
		// 16-bit formats: uint16 length
		length = reader.uint16();
	}

	reader.seek(subtableOffset);
	const _raw = reader.bytes(length);
	return { format, _raw };
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a cmap JSON object back to raw bytes.
 *
 * @param {object} cmapData - { version, encodingRecords, subtables }
 * @returns {number[]} Array of byte values
 */
export function writeCmap(cmapData) {
	const { version, encodingRecords, subtables } = cmapData;

	// Serialize each unique subtable to bytes
	const subtableByteArrays = subtables.map(writeSubtable);

	// cmap header: version(2) + numTables(2) = 4 bytes
	// Encoding records: 8 bytes each
	const headerSize = 4 + encodingRecords.length * 8;

	// Compute offsets for each subtable (placed contiguously after header)
	const subtableOffsets = [];
	let currentOffset = headerSize;
	for (const bytes of subtableByteArrays) {
		subtableOffsets.push(currentOffset);
		currentOffset += bytes.length;
	}

	const totalSize = currentOffset;
	const w = new DataWriter(totalSize);

	// Write header
	w.uint16(version);
	w.uint16(encodingRecords.length);

	// Write encoding records
	for (const rec of encodingRecords) {
		w.uint16(rec.platformID);
		w.uint16(rec.encodingID);
		w.offset32(subtableOffsets[rec.subtableIndex]);
	}

	// Write subtable data
	for (let i = 0; i < subtableByteArrays.length; i++) {
		w.seek(subtableOffsets[i]);
		w.rawBytes(subtableByteArrays[i]);
	}

	return w.toArray();
}

// --- Subtable dispatch ------------------------------------------------------

function writeSubtable(subtable) {
	switch (subtable.format) {
		case 0:
			return writeFormat0(subtable);
		case 2:
			return writeFormat2(subtable);
		case 4:
			return writeFormat4(subtable);
		case 6:
			return writeFormat6(subtable);
		case 8:
			return writeFormat8(subtable);
		case 10:
			return writeFormat10(subtable);
		case 12:
			return writeFormat12(subtable);
		case 13:
			return writeFormat13(subtable);
		case 14:
			return writeFormat14(subtable);
		default:
			// Unsupported format — _raw was preserved during parsing
			return subtable._raw;
	}
}

// --- Format 0 ---------------------------------------------------------------

function writeFormat0(subtable) {
	const totalLen = 262; // format(2) + length(2) + language(2) + glyphIdArray(256)
	const w = new DataWriter(totalLen);
	w.uint16(0); // format
	w.uint16(totalLen);
	w.uint16(subtable.language);
	w.array('uint8', subtable.glyphIdArray);
	return w.toArray();
}

// --- Format 2 ---------------------------------------------------------------

function writeFormat2(subtable) {
	const { language, subHeaderKeys, subHeaders, glyphIdArray } = subtable;
	// format(2) + length(2) + language(2) + subHeaderKeys(512) + subHeaders(n*8) + glyphIdArray(n*2)
	const totalLen = 6 + 512 + subHeaders.length * 8 + glyphIdArray.length * 2;
	const w = new DataWriter(totalLen);

	w.uint16(2); // format
	w.uint16(totalLen);
	w.uint16(language);
	w.array('uint16', subHeaderKeys);

	for (const sh of subHeaders) {
		w.uint16(sh.firstCode);
		w.uint16(sh.entryCount);
		w.int16(sh.idDelta);
		w.uint16(sh.idRangeOffset);
	}

	w.array('uint16', glyphIdArray);
	return w.toArray();
}

// --- Format 4 ---------------------------------------------------------------

function writeFormat4(subtable) {
	const { language, segments, glyphIdArray } = subtable;
	const segCount = segments.length;
	const segCountX2 = segCount * 2;

	// Recompute binary-search parameters from segCount
	const entrySelector = Math.floor(Math.log2(segCount));
	const searchRange = Math.pow(2, entrySelector) * 2;
	const rangeShift = segCountX2 - searchRange;

	const totalLen = 14 + segCount * 8 + 2 + glyphIdArray.length * 2;
	const w = new DataWriter(totalLen);

	w.uint16(4); // format
	w.uint16(totalLen);
	w.uint16(language);
	w.uint16(segCountX2);
	w.uint16(searchRange);
	w.uint16(entrySelector);
	w.uint16(rangeShift);

	// endCode[]
	for (const seg of segments) w.uint16(seg.endCode);
	w.uint16(0); // reservedPad
	// startCode[]
	for (const seg of segments) w.uint16(seg.startCode);
	// idDelta[]
	for (const seg of segments) w.int16(seg.idDelta);
	// idRangeOffset[]
	for (const seg of segments) w.uint16(seg.idRangeOffset);
	// glyphIdArray[]
	w.array('uint16', glyphIdArray);

	return w.toArray();
}

// --- Format 6 ---------------------------------------------------------------

function writeFormat6(subtable) {
	const { language, firstCode, glyphIdArray } = subtable;
	const entryCount = glyphIdArray.length;
	const totalLen = 10 + entryCount * 2;
	const w = new DataWriter(totalLen);

	w.uint16(6);
	w.uint16(totalLen);
	w.uint16(language);
	w.uint16(firstCode);
	w.uint16(entryCount);
	w.array('uint16', glyphIdArray);

	return w.toArray();
}

// --- Format 8 ---------------------------------------------------------------

function writeFormat8(subtable) {
	const { language, is32, groups } = subtable;
	// format(2) + reserved(2) + length(4) + language(4) + is32(8192) + numGroups(4) + groups(n*12)
	const totalLen = 8204 + 4 + groups.length * 12;
	const w = new DataWriter(totalLen);

	w.uint16(8); // format
	w.uint16(0); // reserved
	w.uint32(totalLen);
	w.uint32(language);
	w.rawBytes(is32);
	w.uint32(groups.length);

	for (const g of groups) {
		w.uint32(g.startCharCode);
		w.uint32(g.endCharCode);
		w.uint32(g.startGlyphID);
	}

	return w.toArray();
}

// --- Format 10 --------------------------------------------------------------

function writeFormat10(subtable) {
	const { language, startCharCode, glyphIdArray } = subtable;
	// format(2) + reserved(2) + length(4) + language(4) + startCharCode(4) + numChars(4) + glyphIdArray(n*2)
	const totalLen = 20 + glyphIdArray.length * 2;
	const w = new DataWriter(totalLen);

	w.uint16(10); // format
	w.uint16(0);  // reserved
	w.uint32(totalLen);
	w.uint32(language);
	w.uint32(startCharCode);
	w.uint32(glyphIdArray.length);
	w.array('uint16', glyphIdArray);

	return w.toArray();
}

// --- Format 12 --------------------------------------------------------------

function writeFormat12(subtable) {
	const numGroups = subtable.groups.length;
	const totalLen = 16 + numGroups * 12;
	const w = new DataWriter(totalLen);

	w.uint16(12); // format
	w.uint16(0); // reserved
	w.uint32(totalLen);
	w.uint32(subtable.language);
	w.uint32(numGroups);

	for (const g of subtable.groups) {
		w.uint32(g.startCharCode);
		w.uint32(g.endCharCode);
		w.uint32(g.startGlyphID);
	}

	return w.toArray();
}

// --- Format 13 --------------------------------------------------------------

function writeFormat13(subtable) {
	const numGroups = subtable.groups.length;
	const totalLen = 16 + numGroups * 12;
	const w = new DataWriter(totalLen);

	w.uint16(13);
	w.uint16(0); // reserved
	w.uint32(totalLen);
	w.uint32(subtable.language);
	w.uint32(numGroups);

	for (const g of subtable.groups) {
		w.uint32(g.startCharCode);
		w.uint32(g.endCharCode);
		w.uint32(g.glyphID);
	}

	return w.toArray();
}

// --- Format 14 --------------------------------------------------------------

function writeFormat14(subtable) {
	const { varSelectorRecords } = subtable;

	// Serialize all DefaultUVS and NonDefaultUVS tables first
	const serialized = varSelectorRecords.map((rec) => ({
		defaultUVSBytes: rec.defaultUVS ? writeDefaultUVS(rec.defaultUVS) : null,
		nonDefaultUVSBytes: rec.nonDefaultUVS
			? writeNonDefaultUVS(rec.nonDefaultUVS)
			: null,
	}));

	// Header: format(2) + length(4) + numVarSelectorRecords(4) = 10 bytes
	// Each VariationSelector record: 11 bytes
	const headerSize = 10 + varSelectorRecords.length * 11;

	// Compute offsets for UVS data blocks
	let dataOffset = headerSize;
	const offsets = serialized.map((s) => {
		let defaultUVSOffset = 0;
		if (s.defaultUVSBytes) {
			defaultUVSOffset = dataOffset;
			dataOffset += s.defaultUVSBytes.length;
		}
		let nonDefaultUVSOffset = 0;
		if (s.nonDefaultUVSBytes) {
			nonDefaultUVSOffset = dataOffset;
			dataOffset += s.nonDefaultUVSBytes.length;
		}
		return { defaultUVSOffset, nonDefaultUVSOffset };
	});

	const totalLen = dataOffset;
	const w = new DataWriter(totalLen);

	// Header
	w.uint16(14); // format
	w.uint32(totalLen); // length
	w.uint32(varSelectorRecords.length);

	// VariationSelector records
	for (let i = 0; i < varSelectorRecords.length; i++) {
		w.uint24(varSelectorRecords[i].varSelector);
		w.uint32(offsets[i].defaultUVSOffset);
		w.uint32(offsets[i].nonDefaultUVSOffset);
	}

	// UVS data
	for (let i = 0; i < serialized.length; i++) {
		if (serialized[i].defaultUVSBytes) {
			w.rawBytes(serialized[i].defaultUVSBytes);
		}
		if (serialized[i].nonDefaultUVSBytes) {
			w.rawBytes(serialized[i].nonDefaultUVSBytes);
		}
	}

	return w.toArray();
}

function writeDefaultUVS(ranges) {
	const totalLen = 4 + ranges.length * 4;
	const w = new DataWriter(totalLen);

	w.uint32(ranges.length);
	for (const r of ranges) {
		w.uint24(r.startUnicodeValue);
		w.uint8(r.additionalCount);
	}
	return w.toArray();
}

function writeNonDefaultUVS(mappings) {
	const totalLen = 4 + mappings.length * 5;
	const w = new DataWriter(totalLen);

	w.uint32(mappings.length);
	for (const m of mappings) {
		w.uint24(m.unicodeValue);
		w.uint16(m.glyphID);
	}
	return w.toArray();
}
