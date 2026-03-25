/**
 * Font Flux JS : CBDT table
 * Color Bitmap Data Table
 *
 * Parses glyph bitmap records using index info from the CBLC table.
 * Supports EBDT image formats 1/2/5/6/7/8/9 and CBDT formats 17/18/19.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';
import {
	parseSmallGlyphMetrics,
	parseBigGlyphMetrics,
	writeSmallGlyphMetrics,
	writeBigGlyphMetrics,
	SMALL_GLYPH_METRICS_SIZE,
	BIG_GLYPH_METRICS_SIZE,
} from './bitmap_common.js';

export function parseCBDT(rawBytes, tables) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint32();

	// Without CBLC, fall back to raw data blob
	const cblc = tables?.CBLC;
	if (!cblc?.sizes) {
		return { version, data: Array.from(rawBytes.slice(4)) };
	}

	// Reuse the same DataReader for all subtables/glyphs (avoid re-creating Uint8Array)
	const bitmapData = [];
	for (const size of cblc.sizes) {
		const sizeGlyphs = [];
		for (const sub of size.indexSubTables ?? []) {
			sizeGlyphs.push(
				parseSubtableGlyphs(rawBytes, reader, sub),
			);
		}
		bitmapData.push(sizeGlyphs);
	}

	return { version, bitmapData };
}

export function writeCBDT(cbdt) {
	const version = cbdt.version ?? 0x00030000;
	// Legacy path: raw data blob
	if (cbdt.data) {
		const data = cbdt.data;
		const w = new DataWriter(4 + data.length);
		w.uint32(version);
		w.rawBytes(data);
		return w.toArray();
	}
	// Structured data requires coordinated write via writeCBDTComputeOffsets
	// If no data and no bitmapData, produce header-only
	const w = new DataWriter(4);
	w.uint32(version);
	return w.toArray();
}

/**
 * Write CBDT from structured bitmapData and return bytes + offset info
 * needed by the CBLC writer.
 */
export function writeCBDTComputeOffsets(cbdt, cblc) {
	const version = cbdt.version ?? 0x00030000;
	const bitmapData = cbdt.bitmapData ?? [];
	const sizes = cblc.sizes ?? [];

	// Phase 1: serialize all glyph data, track offsets
	const chunks = [];
	const offsetInfo = [];
	let currentOffset = 4; // after version header

	for (let sizeIdx = 0; sizeIdx < sizes.length; sizeIdx++) {
		const subtables = sizes[sizeIdx].indexSubTables ?? [];
		const sizeData = bitmapData[sizeIdx] ?? [];
		const subOffsets = [];

		for (let subIdx = 0; subIdx < subtables.length; subIdx++) {
			const sub = subtables[subIdx];
			const glyphs = sizeData[subIdx] ?? [];
			const { bytes, info } = serializeSubtableGlyphs(
				glyphs,
				sub,
				currentOffset,
			);
			subOffsets.push(info);
			chunks.push(bytes);
			currentOffset += bytes.length;
		}

		offsetInfo.push(subOffsets);
	}

	// Phase 2: build final byte array
	const totalSize = currentOffset;
	const w = new DataWriter(totalSize);
	w.uint32(version);
	for (const chunk of chunks) {
		w.rawBytes(chunk);
	}

	return { bytes: w.toArray(), offsetInfo };
}

// ---------------------------------------------------------------------------
// Parse glyph bitmap records for one IndexSubTable
// ---------------------------------------------------------------------------

function parseSubtableGlyphs(rawBytes, reader, sub) {
	const { indexFormat, imageFormat, imageDataOffset } = sub;
	const glyphs = [];

	switch (indexFormat) {
		case 1:
		case 3: {
			const offsets = sub.sbitOffsets;
			for (let i = 0; i < offsets.length - 1; i++) {
				const start = imageDataOffset + offsets[i];
				const end = imageDataOffset + offsets[i + 1];
				const dataSize = end - start;
				if (dataSize <= 0) {
					glyphs.push(null);
				} else {
					glyphs.push(
						parseGlyphBitmapRecord(rawBytes, reader, start, imageFormat, dataSize),
					);
				}
			}
			break;
		}
		case 2: {
			const numGlyphs = sub.lastGlyphIndex - sub.firstGlyphIndex + 1;
			const { imageSize } = sub;
			for (let i = 0; i < numGlyphs; i++) {
				const start = imageDataOffset + i * imageSize;
				glyphs.push(
					parseGlyphBitmapRecord(rawBytes, reader, start, imageFormat, imageSize),
				);
			}
			break;
		}
		case 4: {
			const arr = sub.glyphArray;
			for (let i = 0; i < arr.length - 1; i++) {
				const start = imageDataOffset + arr[i].sbitOffset;
				const end = imageDataOffset + arr[i + 1].sbitOffset;
				const dataSize = end - start;
				if (dataSize <= 0) {
					glyphs.push(null);
				} else {
					glyphs.push(
						parseGlyphBitmapRecord(rawBytes, reader, start, imageFormat, dataSize),
					);
				}
			}
			break;
		}
		case 5: {
			const numGlyphs = sub.glyphIdArray.length;
			const { imageSize } = sub;
			for (let i = 0; i < numGlyphs; i++) {
				const start = imageDataOffset + i * imageSize;
				glyphs.push(
					parseGlyphBitmapRecord(rawBytes, reader, start, imageFormat, imageSize),
				);
			}
			break;
		}
	}

	return glyphs;
}

function parseGlyphBitmapRecord(rawBytes, reader, offset, imageFormat, dataSize) {
	if (dataSize <= 0) return null;
	reader.seek(offset);

	// Helper: slice raw bytes from current reader position (fast path for bulk data)
	const sliceFrom = (pos, len) => rawBytes.slice(pos, pos + len);

	switch (imageFormat) {
		case 1: {
			const smallMetrics = parseSmallGlyphMetrics(reader);
			const imageData = sliceFrom(reader.position, dataSize - SMALL_GLYPH_METRICS_SIZE);
			return { smallMetrics, imageData };
		}
		case 2: {
			const smallMetrics = parseSmallGlyphMetrics(reader);
			const imageData = sliceFrom(reader.position, dataSize - SMALL_GLYPH_METRICS_SIZE);
			return { smallMetrics, imageData };
		}
		case 5: {
			return { imageData: sliceFrom(offset, dataSize) };
		}
		case 6: {
			const bigMetrics = parseBigGlyphMetrics(reader);
			const imageData = sliceFrom(reader.position, dataSize - BIG_GLYPH_METRICS_SIZE);
			return { bigMetrics, imageData };
		}
		case 7: {
			const bigMetrics = parseBigGlyphMetrics(reader);
			const imageData = sliceFrom(reader.position, dataSize - BIG_GLYPH_METRICS_SIZE);
			return { bigMetrics, imageData };
		}
		case 8: {
			const smallMetrics = parseSmallGlyphMetrics(reader);
			reader.skip(1); // pad
			const numComponents = reader.uint16();
			const components = [];
			for (let i = 0; i < numComponents; i++) {
				components.push({
					glyphID: reader.uint16(),
					xOffset: reader.int8(),
					yOffset: reader.int8(),
				});
			}
			return { smallMetrics, components };
		}
		case 9: {
			const bigMetrics = parseBigGlyphMetrics(reader);
			const numComponents = reader.uint16();
			const components = [];
			for (let i = 0; i < numComponents; i++) {
				components.push({
					glyphID: reader.uint16(),
					xOffset: reader.int8(),
					yOffset: reader.int8(),
				});
			}
			return { bigMetrics, components };
		}
		case 17: {
			const smallMetrics = parseSmallGlyphMetrics(reader);
			const dataLen = reader.uint32();
			const imageData = sliceFrom(reader.position, dataLen);
			return { smallMetrics, imageData };
		}
		case 18: {
			const bigMetrics = parseBigGlyphMetrics(reader);
			const dataLen = reader.uint32();
			const imageData = sliceFrom(reader.position, dataLen);
			return { bigMetrics, imageData };
		}
		case 19: {
			const dataLen = reader.uint32();
			const imageData = sliceFrom(reader.position, dataLen);
			return { imageData };
		}
		default: {
			return { imageData: sliceFrom(offset, dataSize) };
		}
	}
}

// ---------------------------------------------------------------------------
// Serialize glyph bitmap records for one IndexSubTable
// ---------------------------------------------------------------------------

function serializeSubtableGlyphs(glyphs, sub, baseOffset) {
	const { indexFormat, imageFormat } = sub;
	const info = { imageDataOffset: baseOffset };

	// Serialize each glyph record
	const glyphBlobs = glyphs.map((g) =>
		g ? serializeGlyphBitmapRecord(g, imageFormat) : [],
	);

	// Build offset info for CBLC
	switch (indexFormat) {
		case 1:
		case 3: {
			const sbitOffsets = [0];
			let off = 0;
			for (const blob of glyphBlobs) {
				off += blob.length;
				sbitOffsets.push(off);
			}
			info.sbitOffsets = sbitOffsets;
			break;
		}
		case 2:
		case 5: {
			info.imageSize = sub.imageSize ?? (glyphBlobs.length > 0 ? glyphBlobs[0].length : 0);
			break;
		}
		case 4: {
			const glyphIds = sub.glyphIdArray ?? [];
			const glyphArray = [];
			let off = 0;
			for (let i = 0; i < glyphBlobs.length; i++) {
				glyphArray.push({
					glyphID: glyphIds[i] ?? 0,
					sbitOffset: off,
				});
				off += glyphBlobs[i].length;
			}
			// Sentinel entry
			glyphArray.push({ glyphID: 0, sbitOffset: off });
			info.glyphArray = glyphArray;
			break;
		}
	}

	// Concatenate all glyph data
	const totalSize = glyphBlobs.reduce((sum, b) => sum + b.length, 0);
	const w = new DataWriter(totalSize);
	for (const blob of glyphBlobs) {
		w.rawBytes(blob);
	}

	return { bytes: w.toArray(), info };
}

function serializeGlyphBitmapRecord(glyph, imageFormat) {
	switch (imageFormat) {
		case 1:
		case 2: {
			const imageData = glyph.imageData ?? [];
			const w = new DataWriter(SMALL_GLYPH_METRICS_SIZE + imageData.length);
			writeSmallGlyphMetrics(w, glyph.smallMetrics ?? {});
			w.rawBytes(imageData);
			return w.toArray();
		}
		case 5: {
			const imageData = glyph.imageData ?? [];
			return Array.from(imageData);
		}
		case 6:
		case 7: {
			const imageData = glyph.imageData ?? [];
			const w = new DataWriter(BIG_GLYPH_METRICS_SIZE + imageData.length);
			writeBigGlyphMetrics(w, glyph.bigMetrics ?? {});
			w.rawBytes(imageData);
			return w.toArray();
		}
		case 8: {
			const components = glyph.components ?? [];
			const w = new DataWriter(
				SMALL_GLYPH_METRICS_SIZE + 1 + 2 + components.length * 4,
			);
			writeSmallGlyphMetrics(w, glyph.smallMetrics ?? {});
			w.uint8(0); // pad
			w.uint16(components.length);
			for (const c of components) {
				w.uint16(c.glyphID ?? 0);
				w.int8(c.xOffset ?? 0);
				w.int8(c.yOffset ?? 0);
			}
			return w.toArray();
		}
		case 9: {
			const components = glyph.components ?? [];
			const w = new DataWriter(
				BIG_GLYPH_METRICS_SIZE + 2 + components.length * 4,
			);
			writeBigGlyphMetrics(w, glyph.bigMetrics ?? {});
			w.uint16(components.length);
			for (const c of components) {
				w.uint16(c.glyphID ?? 0);
				w.int8(c.xOffset ?? 0);
				w.int8(c.yOffset ?? 0);
			}
			return w.toArray();
		}
		case 17: {
			const imageData = glyph.imageData ?? [];
			const w = new DataWriter(
				SMALL_GLYPH_METRICS_SIZE + 4 + imageData.length,
			);
			writeSmallGlyphMetrics(w, glyph.smallMetrics ?? {});
			w.uint32(imageData.length);
			w.rawBytes(imageData);
			return w.toArray();
		}
		case 18: {
			const imageData = glyph.imageData ?? [];
			const w = new DataWriter(
				BIG_GLYPH_METRICS_SIZE + 4 + imageData.length,
			);
			writeBigGlyphMetrics(w, glyph.bigMetrics ?? {});
			w.uint32(imageData.length);
			w.rawBytes(imageData);
			return w.toArray();
		}
		case 19: {
			const imageData = glyph.imageData ?? [];
			const w = new DataWriter(4 + imageData.length);
			w.uint32(imageData.length);
			w.rawBytes(imageData);
			return w.toArray();
		}
		default: {
			// Unknown format — write raw
			return Array.from(glyph.imageData ?? []);
		}
	}
}
