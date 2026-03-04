/**
 * Font-to-JSON : GDEF — Glyph Definition Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/gdef
 *
 * Provides glyph properties used in OpenType Layout processing:
 *   - Glyph class definition (base, ligature, mark, component)
 *   - Attachment point list
 *   - Ligature caret list
 *   - Mark attachment class definition
 *   - Mark glyph sets (v1.2+)
 *   - Item variation store offset (v1.3+ — stored as raw bytes)
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';
import {
	parseClassDef,
	parseCoverage,
	parseDevice,
	writeClassDef,
	writeCoverage,
	writeDevice,
} from './opentype_layout_common.js';

// ═══════════════════════════════════════════════════════════════════════════
//  PARSING  (binary → JSON)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse a GDEF table from raw bytes.
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseGDEF(rawBytes) {
	const reader = new DataReader(rawBytes);

	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const glyphClassDefOffset = reader.uint16();
	const attachListOffset = reader.uint16();
	const ligCaretListOffset = reader.uint16();
	const markAttachClassDefOffset = reader.uint16();

	let markGlyphSetsDefOffset = 0;
	if (minorVersion >= 2) {
		markGlyphSetsDefOffset = reader.uint16();
	}

	let itemVarStoreOffset = 0;
	if (minorVersion >= 3) {
		itemVarStoreOffset = reader.uint32();
	}

	const result = { majorVersion, minorVersion };

	// Glyph class definition
	if (glyphClassDefOffset !== 0) {
		result.glyphClassDef = parseClassDef(reader, glyphClassDefOffset);
	}

	// Attachment point list
	if (attachListOffset !== 0) {
		result.attachList = parseAttachList(reader, attachListOffset);
	}

	// Ligature caret list
	if (ligCaretListOffset !== 0) {
		result.ligCaretList = parseLigCaretList(reader, ligCaretListOffset);
	}

	// Mark attachment class definition
	if (markAttachClassDefOffset !== 0) {
		result.markAttachClassDef = parseClassDef(reader, markAttachClassDefOffset);
	}

	// Mark glyph sets (v1.2+)
	if (markGlyphSetsDefOffset !== 0) {
		result.markGlyphSetsDef = parseMarkGlyphSets(
			reader,
			markGlyphSetsDefOffset,
		);
	}

	// Item variation store (v1.3+ — stored as raw bytes for now)
	if (itemVarStoreOffset !== 0) {
		result.itemVarStoreOffset = itemVarStoreOffset;
		// We store raw bytes from the offset to the end of the table data.
		// This preserves the variation store without fully parsing it.
		result.itemVarStoreRaw = Array.from(
			new Uint8Array(
				new DataReader(rawBytes).view.buffer,
				new DataReader(rawBytes).view.byteOffset + itemVarStoreOffset,
				rawBytes.length - itemVarStoreOffset,
			),
		);
	}

	return result;
}

// ─── AttachList ─────────────────────────────────────────────────────────────

function parseAttachList(reader, offset) {
	reader.seek(offset);
	const coverageOffset = reader.uint16();
	const glyphCount = reader.uint16();
	const attachPointOffsets = reader.array('uint16', glyphCount);

	const coverage = parseCoverage(reader, offset + coverageOffset);
	const attachPoints = attachPointOffsets.map((apo) => {
		reader.seek(offset + apo);
		const pointCount = reader.uint16();
		return reader.array('uint16', pointCount);
	});

	return { coverage, attachPoints };
}

// ─── LigCaretList ───────────────────────────────────────────────────────────

function parseLigCaretList(reader, offset) {
	reader.seek(offset);
	const coverageOffset = reader.uint16();
	const ligGlyphCount = reader.uint16();
	const ligGlyphOffsets = reader.array('uint16', ligGlyphCount);

	const coverage = parseCoverage(reader, offset + coverageOffset);
	const ligGlyphs = ligGlyphOffsets.map((lgo) =>
		parseLigGlyph(reader, offset + lgo),
	);

	return { coverage, ligGlyphs };
}

function parseLigGlyph(reader, offset) {
	reader.seek(offset);
	const caretCount = reader.uint16();
	const caretValueOffsets = reader.array('uint16', caretCount);

	return caretValueOffsets.map((cvo) => {
		const cvOffset = offset + cvo;
		reader.seek(cvOffset);
		const format = reader.uint16();

		if (format === 1) {
			return { format, coordinate: reader.int16() };
		}
		if (format === 2) {
			return { format, caretValuePointIndex: reader.uint16() };
		}
		if (format === 3) {
			const coordinate = reader.int16();
			const deviceOffset = reader.uint16();
			const device =
				deviceOffset !== 0
					? parseDevice(reader, cvOffset + deviceOffset)
					: null;
			return { format, coordinate, device };
		}
		throw new Error(`Unknown CaretValue format: ${format}`);
	});
}

// ─── MarkGlyphSets ──────────────────────────────────────────────────────────

function parseMarkGlyphSets(reader, offset) {
	reader.seek(offset);
	const format = reader.uint16();
	const markGlyphSetCount = reader.uint16();
	// Note: these are Offset32, not Offset16
	const coverageOffsets = [];
	for (let i = 0; i < markGlyphSetCount; i++) {
		coverageOffsets.push(reader.uint32());
	}

	const coverages = coverageOffsets.map((co) =>
		parseCoverage(reader, offset + co),
	);
	return { format, coverages };
}

// ═══════════════════════════════════════════════════════════════════════════
//  WRITING  (JSON → binary)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Serialize a GDEF table to bytes.
 * @param {object} gdef
 * @returns {number[]}
 */
export function writeGDEF(gdef) {
	const { majorVersion, minorVersion } = gdef;

	// Build child byte arrays
	const glyphClassDefBytes = gdef.glyphClassDef
		? writeClassDef(gdef.glyphClassDef)
		: null;
	const attachListBytes = gdef.attachList
		? writeAttachList(gdef.attachList)
		: null;
	const ligCaretListBytes = gdef.ligCaretList
		? writeLigCaretList(gdef.ligCaretList)
		: null;
	const markAttachClassDefBytes = gdef.markAttachClassDef
		? writeClassDef(gdef.markAttachClassDef)
		: null;
	const markGlyphSetsDefBytes =
		minorVersion >= 2 && gdef.markGlyphSetsDef
			? writeMarkGlyphSets(gdef.markGlyphSetsDef)
			: null;
	const itemVarStoreBytes =
		minorVersion >= 3 && gdef.itemVarStoreRaw ? gdef.itemVarStoreRaw : null;

	// Header size: 4(version) + 4*2(offsets) = 12 for v1.0
	// v1.2: +2 for markGlyphSetsDefOffset = 14
	// v1.3: +4 for itemVarStoreOffset = 18
	let headerSize = 12;
	if (minorVersion >= 2) headerSize += 2;
	if (minorVersion >= 3) headerSize += 4;

	// Compute offsets
	let cursor = headerSize;
	const glyphClassDefOff = glyphClassDefBytes ? cursor : 0;
	if (glyphClassDefBytes) cursor += glyphClassDefBytes.length;

	const attachListOff = attachListBytes ? cursor : 0;
	if (attachListBytes) cursor += attachListBytes.length;

	const ligCaretListOff = ligCaretListBytes ? cursor : 0;
	if (ligCaretListBytes) cursor += ligCaretListBytes.length;

	const markAttachClassDefOff = markAttachClassDefBytes ? cursor : 0;
	if (markAttachClassDefBytes) cursor += markAttachClassDefBytes.length;

	const markGlyphSetsDefOff = markGlyphSetsDefBytes ? cursor : 0;
	if (markGlyphSetsDefBytes) cursor += markGlyphSetsDefBytes.length;

	const itemVarStoreOff = itemVarStoreBytes ? cursor : 0;
	if (itemVarStoreBytes) cursor += itemVarStoreBytes.length;

	const w = new DataWriter(cursor);

	// Write header
	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint16(glyphClassDefOff);
	w.uint16(attachListOff);
	w.uint16(ligCaretListOff);
	w.uint16(markAttachClassDefOff);
	if (minorVersion >= 2) w.uint16(markGlyphSetsDefOff);
	if (minorVersion >= 3) w.uint32(itemVarStoreOff);

	// Write sub-tables
	if (glyphClassDefBytes) {
		w.seek(glyphClassDefOff);
		w.rawBytes(glyphClassDefBytes);
	}
	if (attachListBytes) {
		w.seek(attachListOff);
		w.rawBytes(attachListBytes);
	}
	if (ligCaretListBytes) {
		w.seek(ligCaretListOff);
		w.rawBytes(ligCaretListBytes);
	}
	if (markAttachClassDefBytes) {
		w.seek(markAttachClassDefOff);
		w.rawBytes(markAttachClassDefBytes);
	}
	if (markGlyphSetsDefBytes) {
		w.seek(markGlyphSetsDefOff);
		w.rawBytes(markGlyphSetsDefBytes);
	}
	if (itemVarStoreBytes) {
		w.seek(itemVarStoreOff);
		w.rawBytes(itemVarStoreBytes);
	}

	return w.toArray();
}

// ─── AttachList writer ──────────────────────────────────────────────────────

function writeAttachList(al) {
	const covBytes = writeCoverage(al.coverage);
	const attachPointBytes = al.attachPoints.map(writeAttachPoint);

	// Header: coverageOffset(2) + glyphCount(2) + offsets(2 each)
	const headerSize = 4 + al.attachPoints.length * 2;
	let cursor = headerSize;
	const covOff = cursor;
	cursor += covBytes.length;
	const apOffsets = attachPointBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(covOff);
	w.uint16(al.attachPoints.length);
	w.array('uint16', apOffsets);
	w.seek(covOff);
	w.rawBytes(covBytes);
	for (let i = 0; i < attachPointBytes.length; i++) {
		w.seek(apOffsets[i]);
		w.rawBytes(attachPointBytes[i]);
	}
	return w.toArray();
}

function writeAttachPoint(points) {
	const size = 2 + points.length * 2;
	const w = new DataWriter(size);
	w.uint16(points.length);
	w.array('uint16', points);
	return w.toArray();
}

// ─── LigCaretList writer ────────────────────────────────────────────────────

function writeLigCaretList(lcl) {
	const covBytes = writeCoverage(lcl.coverage);
	const ligGlyphBytes = lcl.ligGlyphs.map(writeLigGlyph);

	const headerSize = 4 + lcl.ligGlyphs.length * 2;
	let cursor = headerSize;
	const covOff = cursor;
	cursor += covBytes.length;
	const lgOffsets = ligGlyphBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(covOff);
	w.uint16(lcl.ligGlyphs.length);
	w.array('uint16', lgOffsets);
	w.seek(covOff);
	w.rawBytes(covBytes);
	for (let i = 0; i < ligGlyphBytes.length; i++) {
		w.seek(lgOffsets[i]);
		w.rawBytes(ligGlyphBytes[i]);
	}
	return w.toArray();
}

function writeLigGlyph(caretValues) {
	const caretBytes = caretValues.map(writeCaretValue);

	const headerSize = 2 + caretValues.length * 2;
	let cursor = headerSize;
	const offsets = caretBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(caretValues.length);
	w.array('uint16', offsets);
	for (let i = 0; i < caretBytes.length; i++) {
		w.seek(offsets[i]);
		w.rawBytes(caretBytes[i]);
	}
	return w.toArray();
}

function writeCaretValue(cv) {
	if (cv.format === 1) {
		const w = new DataWriter(4);
		w.uint16(1);
		w.int16(cv.coordinate);
		return w.toArray();
	}
	if (cv.format === 2) {
		const w = new DataWriter(4);
		w.uint16(2);
		w.uint16(cv.caretValuePointIndex);
		return w.toArray();
	}
	if (cv.format === 3) {
		const devBytes = cv.device ? writeDevice(cv.device) : null;
		const size = 6 + (devBytes ? devBytes.length : 0);
		const w = new DataWriter(size);
		w.uint16(3);
		w.int16(cv.coordinate);
		w.uint16(devBytes ? 6 : 0); // deviceOffset: 6 = right after the 6-byte header
		if (devBytes) w.rawBytes(devBytes);
		return w.toArray();
	}
	throw new Error(`Unknown CaretValue format: ${cv.format}`);
}

// ─── MarkGlyphSets writer ───────────────────────────────────────────────────

function writeMarkGlyphSets(mgs) {
	const covBytes = mgs.coverages.map(writeCoverage);

	// Header: format(2) + count(2) + offsets(4 each — Offset32)
	const headerSize = 4 + mgs.coverages.length * 4;
	let cursor = headerSize;
	const offsets = covBytes.map((ba) => {
		const off = cursor;
		cursor += ba.length;
		return off;
	});

	const w = new DataWriter(cursor);
	w.uint16(mgs.format);
	w.uint16(mgs.coverages.length);
	for (const off of offsets) w.uint32(off);
	for (let i = 0; i < covBytes.length; i++) {
		w.seek(offsets[i]);
		w.rawBytes(covBytes[i]);
	}
	return w.toArray();
}
