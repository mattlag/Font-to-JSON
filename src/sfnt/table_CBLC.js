/**
 * Font Flux JS : CBLC table
 * Color Bitmap Location Table
 *
 * Structurally identical to EBLC at top level.
 * Parses IndexSubTable structures from the binary data into structured JSON.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';
import {
	BIG_GLYPH_METRICS_SIZE,
	parseBigGlyphMetrics,
	writeBigGlyphMetrics,
} from './bitmap_common.js';

const BITMAP_SIZE_TABLE_SIZE = 48;

export function parseCBLC(rawBytes) {
	return parseBitmapLocationTable(rawBytes);
}

export function writeCBLC(cblc, offsetInfo) {
	if (offsetInfo) {
		return writeBitmapLocationTableStructured(cblc, offsetInfo);
	}
	return writeBitmapLocationTableLegacy(cblc);
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

function parseBitmapLocationTable(rawBytes) {
	const reader = new DataReader(rawBytes);
	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const numSizes = reader.uint32();

	const sizes = [];
	const sizeRecordMeta = [];

	for (let i = 0; i < numSizes; i++) {
		const indexSubTableArrayOffset = reader.uint32();
		const indexTablesSize = reader.uint32();
		const numberOfIndexSubTables = reader.uint32();
		const colorRef = reader.uint32();
		const hori = parseSbitLineMetrics(reader);
		const vert = parseSbitLineMetrics(reader);
		const startGlyphIndex = reader.uint16();
		const endGlyphIndex = reader.uint16();
		const ppemX = reader.uint8();
		const ppemY = reader.uint8();
		const bitDepth = reader.uint8();
		const flags = reader.int8();

		sizes.push({
			colorRef,
			hori,
			vert,
			startGlyphIndex,
			endGlyphIndex,
			ppemX,
			ppemY,
			bitDepth,
			flags,
			indexSubTables: [],
		});

		sizeRecordMeta.push({
			indexSubTableArrayOffset,
			numberOfIndexSubTables,
		});
	}

	// Parse index subtables for each size record
	for (let i = 0; i < numSizes; i++) {
		const { indexSubTableArrayOffset, numberOfIndexSubTables } =
			sizeRecordMeta[i];
		if (numberOfIndexSubTables === 0) continue;
		sizes[i].indexSubTables = parseIndexSubTableList(
			reader,
			indexSubTableArrayOffset,
			numberOfIndexSubTables,
		);
	}

	return { majorVersion, minorVersion, sizes };
}

function parseIndexSubTableList(reader, listOffset, count) {
	reader.seek(listOffset);

	// Read IndexSubtableRecord array
	const records = [];
	for (let i = 0; i < count; i++) {
		records.push({
			firstGlyphIndex: reader.uint16(),
			lastGlyphIndex: reader.uint16(),
			indexSubtableOffset: reader.uint32(),
		});
	}

	const subtables = [];
	for (const rec of records) {
		const subOffset = listOffset + rec.indexSubtableOffset;
		reader.seek(subOffset);

		const indexFormat = reader.uint16();
		const imageFormat = reader.uint16();
		const imageDataOffset = reader.uint32();

		const sub = {
			firstGlyphIndex: rec.firstGlyphIndex,
			lastGlyphIndex: rec.lastGlyphIndex,
			indexFormat,
			imageFormat,
			imageDataOffset,
		};

		const numGlyphs = rec.lastGlyphIndex - rec.firstGlyphIndex + 1;

		switch (indexFormat) {
			case 1: {
				sub.sbitOffsets = reader.array('uint32', numGlyphs + 1);
				break;
			}
			case 2: {
				sub.imageSize = reader.uint32();
				sub.bigMetrics = parseBigGlyphMetrics(reader);
				break;
			}
			case 3: {
				sub.sbitOffsets = reader.array('uint16', numGlyphs + 1);
				break;
			}
			case 4: {
				const numGlyphsField = reader.uint32();
				sub.glyphArray = [];
				for (let j = 0; j <= numGlyphsField; j++) {
					sub.glyphArray.push({
						glyphID: reader.uint16(),
						sbitOffset: reader.uint16(),
					});
				}
				break;
			}
			case 5: {
				sub.imageSize = reader.uint32();
				sub.bigMetrics = parseBigGlyphMetrics(reader);
				const numGlyphsField = reader.uint32();
				sub.glyphIdArray = reader.array('uint16', numGlyphsField);
				break;
			}
		}

		subtables.push(sub);
	}

	return subtables;
}

// ---------------------------------------------------------------------------
// Write — structured mode (with offsetInfo from coordinated CBDT write)
// ---------------------------------------------------------------------------

function writeBitmapLocationTableStructured(table, offsetInfo) {
	const majorVersion = table.majorVersion ?? 2;
	const minorVersion = table.minorVersion ?? 0;
	const sizes = table.sizes ?? [];

	// Phase 1: Serialize IndexSubTableList blobs for each size
	const indexBlobs = sizes.map((size, i) =>
		serializeIndexSubTableList(size.indexSubTables ?? [], offsetInfo[i] ?? []),
	);

	// Phase 2: Compute offsets
	const headerSize = 8 + sizes.length * BITMAP_SIZE_TABLE_SIZE;
	let currentOffset = headerSize;
	const sizeOffsets = [];
	for (const blob of indexBlobs) {
		sizeOffsets.push(currentOffset);
		currentOffset += blob.length;
	}

	// Phase 3: Write
	const w = new DataWriter(currentOffset);
	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint32(sizes.length);

	for (let i = 0; i < sizes.length; i++) {
		const size = sizes[i];
		const subtables = size.indexSubTables ?? [];
		w.uint32(sizeOffsets[i]);
		w.uint32(indexBlobs[i].length);
		w.uint32(subtables.length);
		w.uint32(size.colorRef ?? 0);
		writeSbitLineMetrics(w, size.hori ?? {});
		writeSbitLineMetrics(w, size.vert ?? {});
		w.uint16(size.startGlyphIndex ?? 0);
		w.uint16(size.endGlyphIndex ?? 0);
		w.uint8(size.ppemX ?? 0);
		w.uint8(size.ppemY ?? 0);
		w.uint8(size.bitDepth ?? 0);
		w.int8(size.flags ?? 0);
	}

	for (const blob of indexBlobs) {
		w.rawBytes(blob);
	}

	return w.toArray();
}

function serializeIndexSubTableList(subtables, subtableOffsets) {
	// Build each IndexSubTable body
	const subBodies = subtables.map((sub, j) =>
		serializeIndexSubTable(sub, subtableOffsets[j] ?? {}),
	);

	// IndexSubtableRecord array: 8 bytes each
	const recordArraySize = subtables.length * 8;
	let subOffset = recordArraySize;
	const bodyOffsets = [];
	for (const body of subBodies) {
		bodyOffsets.push(subOffset);
		subOffset += body.length;
	}

	const w = new DataWriter(subOffset);

	// Write records
	for (let j = 0; j < subtables.length; j++) {
		w.uint16(subtables[j].firstGlyphIndex);
		w.uint16(subtables[j].lastGlyphIndex);
		w.uint32(bodyOffsets[j]);
	}

	// Write bodies
	for (const body of subBodies) {
		w.rawBytes(body);
	}

	return w.toArray();
}

function serializeIndexSubTable(sub, info) {
	const indexFormat = sub.indexFormat;
	const imageFormat = sub.imageFormat;
	const imageDataOffset = info.imageDataOffset ?? 0;
	const headerSize = 8; // indexFormat(2) + imageFormat(2) + imageDataOffset(4)

	switch (indexFormat) {
		case 1: {
			const offsets = info.sbitOffsets ?? [];
			const w = new DataWriter(headerSize + offsets.length * 4);
			w.uint16(indexFormat);
			w.uint16(imageFormat);
			w.uint32(imageDataOffset);
			for (const off of offsets) w.uint32(off);
			return w.toArray();
		}
		case 2: {
			const w = new DataWriter(headerSize + 4 + BIG_GLYPH_METRICS_SIZE);
			w.uint16(indexFormat);
			w.uint16(imageFormat);
			w.uint32(imageDataOffset);
			w.uint32(sub.imageSize ?? info.imageSize ?? 0);
			writeBigGlyphMetrics(w, sub.bigMetrics ?? {});
			return w.toArray();
		}
		case 3: {
			const offsets = info.sbitOffsets ?? [];
			let size = headerSize + offsets.length * 2;
			if (offsets.length % 2 !== 0) size += 2; // pad to 4-byte alignment
			const w = new DataWriter(size);
			w.uint16(indexFormat);
			w.uint16(imageFormat);
			w.uint32(imageDataOffset);
			for (const off of offsets) w.uint16(off);
			return w.toArray();
		}
		case 4: {
			const glyphArray = info.glyphArray ?? [];
			const numGlyphs = glyphArray.length > 0 ? glyphArray.length - 1 : 0;
			const w = new DataWriter(headerSize + 4 + glyphArray.length * 4);
			w.uint16(indexFormat);
			w.uint16(imageFormat);
			w.uint32(imageDataOffset);
			w.uint32(numGlyphs);
			for (const entry of glyphArray) {
				w.uint16(entry.glyphID);
				w.uint16(entry.sbitOffset);
			}
			return w.toArray();
		}
		case 5: {
			const glyphIds = sub.glyphIdArray ?? [];
			let size =
				headerSize + 4 + BIG_GLYPH_METRICS_SIZE + 4 + glyphIds.length * 2;
			if (glyphIds.length % 2 !== 0) size += 2; // pad to 4-byte alignment
			const w = new DataWriter(size);
			w.uint16(indexFormat);
			w.uint16(imageFormat);
			w.uint32(imageDataOffset);
			w.uint32(sub.imageSize ?? info.imageSize ?? 0);
			writeBigGlyphMetrics(w, sub.bigMetrics ?? {});
			w.uint32(glyphIds.length);
			for (const id of glyphIds) w.uint16(id);
			return w.toArray();
		}
		default:
			throw new Error(`Unsupported index format: ${indexFormat}`);
	}
}

// ---------------------------------------------------------------------------
// Write — legacy mode (data blob, for backward compat)
// ---------------------------------------------------------------------------

function writeBitmapLocationTableLegacy(table) {
	const majorVersion = table.majorVersion ?? 2;
	const minorVersion = table.minorVersion ?? 0;
	const sizes = table.sizes ?? [];
	const body = table.data ?? [];
	const totalSize = 8 + sizes.length * BITMAP_SIZE_TABLE_SIZE + body.length;

	const w = new DataWriter(totalSize);
	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint32(sizes.length);

	for (const size of sizes) {
		w.uint32(size.indexSubTableArrayOffset ?? 0);
		w.uint32(size.indexTablesSize ?? 0);
		w.uint32(size.numberOfIndexSubTables ?? 0);
		w.uint32(size.colorRef ?? 0);
		writeSbitLineMetrics(w, size.hori ?? {});
		writeSbitLineMetrics(w, size.vert ?? {});
		w.uint16(size.startGlyphIndex ?? 0);
		w.uint16(size.endGlyphIndex ?? 0);
		w.uint8(size.ppemX ?? 0);
		w.uint8(size.ppemY ?? 0);
		w.uint8(size.bitDepth ?? 0);
		w.int8(size.flags ?? 0);
	}

	w.rawBytes(body);
	return w.toArray();
}

// ---------------------------------------------------------------------------
// SbitLineMetrics helpers
// ---------------------------------------------------------------------------

function parseSbitLineMetrics(reader) {
	return {
		ascender: reader.int8(),
		descender: reader.int8(),
		widthMax: reader.uint8(),
		caretSlopeNumerator: reader.int8(),
		caretSlopeDenominator: reader.int8(),
		caretOffset: reader.int8(),
		minOriginSB: reader.int8(),
		minAdvanceSB: reader.int8(),
		maxBeforeBL: reader.int8(),
		minAfterBL: reader.int8(),
		pad1: reader.int8(),
		pad2: reader.int8(),
	};
}

function writeSbitLineMetrics(writer, m) {
	writer.int8(m.ascender ?? 0);
	writer.int8(m.descender ?? 0);
	writer.uint8(m.widthMax ?? 0);
	writer.int8(m.caretSlopeNumerator ?? 0);
	writer.int8(m.caretSlopeDenominator ?? 0);
	writer.int8(m.caretOffset ?? 0);
	writer.int8(m.minOriginSB ?? 0);
	writer.int8(m.minAdvanceSB ?? 0);
	writer.int8(m.maxBeforeBL ?? 0);
	writer.int8(m.minAfterBL ?? 0);
	writer.int8(m.pad1 ?? 0);
	writer.int8(m.pad2 ?? 0);
}
