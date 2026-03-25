/**
 * Font Flux JS : COLR table
 * Color Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/colr
 *
 * Defines color presentations for glyphs as layered compositions.
 *
 * Version 0: Simple layered model.
 *   - BaseGlyphRecords map base glyph -> slice of LayerRecords
 *   - LayerRecords: each layer = glyph outline + CPAL palette index
 *
 * Version 1: Adds a Paint table DAG for complex gradients, transforms,
 *   compositing modes, etc. Version 1 also includes v0-compatible records
 *   for backwards compatibility.
 *
 *   Both v0 and v1 structures are fully parsed into structured JSON and
 *   reconstructed during writing.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';
import { parseV1Data, writeV1Data } from './colr_paint.js';

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a COLR table from raw bytes.
 *
 * COLR v0 header (14 bytes):
 *   uint16   version                — 0
 *   uint16   numBaseGlyphRecords
 *   Offset32 baseGlyphRecordsOffset — from start of COLR
 *   Offset32 layerRecordsOffset     — from start of COLR
 *   uint16   numLayerRecords
 *
 * BaseGlyphRecord (6 bytes):
 *   uint16 glyphID
 *   uint16 firstLayerIndex
 *   uint16 numLayers
 *
 * LayerRecord (4 bytes):
 *   uint16 glyphID
 *   uint16 paletteIndex
 *
 * COLR v1 header extends with (20 more bytes):
 *   Offset32 baseGlyphListOffset
 *   Offset32 layerListOffset
 *   Offset32 clipListOffset
 *   Offset32 varIndexMapOffset
 *   Offset32 itemVariationStoreOffset
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseCOLR(rawBytes) {
	const reader = new DataReader(rawBytes);

	const version = reader.uint16();
	const numBaseGlyphRecords = reader.uint16();
	const baseGlyphRecordsOffset = reader.uint32();
	const layerRecordsOffset = reader.uint32();
	const numLayerRecords = reader.uint16();

	// -- Read v0 BaseGlyph records ---------------------------------------
	const baseGlyphRecords = [];
	if (numBaseGlyphRecords > 0 && baseGlyphRecordsOffset > 0) {
		reader.seek(baseGlyphRecordsOffset);
		for (let i = 0; i < numBaseGlyphRecords; i++) {
			baseGlyphRecords.push({
				glyphID: reader.uint16(),
				firstLayerIndex: reader.uint16(),
				numLayers: reader.uint16(),
			});
		}
	}

	// -- Read v0 Layer records -------------------------------------------
	const layerRecords = [];
	if (numLayerRecords > 0 && layerRecordsOffset > 0) {
		reader.seek(layerRecordsOffset);
		for (let i = 0; i < numLayerRecords; i++) {
			layerRecords.push({
				glyphID: reader.uint16(),
				paletteIndex: reader.uint16(),
			});
		}
	}

	const result = {
		version,
		baseGlyphRecords,
		layerRecords,
	};

	// -- Version 1 extensions --------------------------------------------
	// Parse v1 structures: BaseGlyphList, LayerList, ClipList, Paint DAG,
	// optional DeltaSetIndexMap, optional ItemVariationStore.
	if (version >= 1) {
		// Position after the v0 header (14 bytes)
		reader.seek(14);
		const baseGlyphListOffset = reader.uint32();
		const layerListOffset = reader.uint32();
		const clipListOffset = reader.uint32();
		const varIndexMapOffset = reader.uint32();
		const itemVariationStoreOffset = reader.uint32();

		const v1Header = {
			baseGlyphListOffset,
			layerListOffset,
			clipListOffset,
			varIndexMapOffset,
			itemVariationStoreOffset,
		};

		const v1Data = parseV1Data(reader, v1Header);
		result.baseGlyphPaintRecords = v1Data.baseGlyphPaintRecords;
		result.layerPaints = v1Data.layerPaints;
		result.clipList = v1Data.clipList;
		result.varIndexMap = v1Data.varIndexMap;
		result.itemVariationStore = v1Data.itemVariationStore;
	}

	return result;
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a COLR JSON object back to raw bytes.
 *
 * For v0: fully reconstructs from parsed data.
 * For v1: reconstructs from parsed v1 structures (BaseGlyphList, LayerList,
 *         ClipList, Paint DAG, etc.) plus v0 compatibility records.
 *
 * @param {object} colr - Parsed COLR table data
 * @returns {number[]} Array of byte values
 */
export function writeCOLR(colr) {
	const { baseGlyphRecords, layerRecords } = colr;

	// -- For v1: build using structured data ---
	if (colr.version >= 1 && colr.baseGlyphPaintRecords) {
		// Compute v0 portion
		const v0HeaderSize = 14;
		const v0BaseGlyphSize = baseGlyphRecords.length * 6;
		const v0LayerSize = layerRecords.length * 4;
		const v1HeaderSize = 20; // 5 × Offset32
		const fullHeaderSize = v0HeaderSize + v1HeaderSize;
		const v0BodyStart = fullHeaderSize;
		const v0BodySize = v0BaseGlyphSize + v0LayerSize;
		const v1BodyStart = v0BodyStart + v0BodySize;

		// Write v1 body
		const v1Result = writeV1Data({
			baseGlyphPaintRecords: colr.baseGlyphPaintRecords,
			layerPaints: colr.layerPaints,
			clipList: colr.clipList,
			varIndexMap: colr.varIndexMap,
			itemVariationStore: colr.itemVariationStore,
		});

		const v1Body = v1Result.bodyBytes;

		// Compute absolute offsets from COLR table start
		const baseGlyphListOffset = v1BodyStart + v1Result.bglBodyOffset;
		const layerListOffset = v1Result.llBodyOffset
			? v1BodyStart + v1Result.llBodyOffset
			: 0;
		const clipListOffset = v1Result.clipBodyOffset
			? v1BodyStart + v1Result.clipBodyOffset
			: 0;
		const varIndexMapOffset = v1Result.dimBodyOffset
			? v1BodyStart + v1Result.dimBodyOffset
			: 0;
		const itemVariationStoreOffset = v1Result.ivsBodyOffset
			? v1BodyStart + v1Result.ivsBodyOffset
			: 0;

		const totalSize = v1BodyStart + v1Body.length;
		const w = new DataWriter(totalSize);

		// v0 header
		w.uint16(colr.version);
		w.uint16(baseGlyphRecords.length);
		w.uint32(baseGlyphRecords.length > 0 ? v0BodyStart : 0);
		w.uint32(layerRecords.length > 0 ? v0BodyStart + v0BaseGlyphSize : 0);
		w.uint16(layerRecords.length);

		// v1 header offsets
		w.uint32(baseGlyphListOffset);
		w.uint32(layerListOffset);
		w.uint32(clipListOffset);
		w.uint32(varIndexMapOffset);
		w.uint32(itemVariationStoreOffset);

		// v0 BaseGlyph records
		for (const rec of baseGlyphRecords) {
			w.uint16(rec.glyphID);
			w.uint16(rec.firstLayerIndex);
			w.uint16(rec.numLayers);
		}
		// v0 Layer records
		for (const rec of layerRecords) {
			w.uint16(rec.glyphID);
			w.uint16(rec.paletteIndex);
		}

		// v1 body
		w.rawBytes(v1Body);

		return w.toArray();
	}

	// -- For v0: reconstruct from parsed data ---
	const headerSize = 14;
	const baseGlyphRecordsOffset = baseGlyphRecords.length > 0 ? headerSize : 0;
	const baseGlyphRecordsSize = baseGlyphRecords.length * 6;
	const layerRecordsOffset =
		layerRecords.length > 0 ? headerSize + baseGlyphRecordsSize : 0;
	const layerRecordsSize = layerRecords.length * 4;

	const totalSize = headerSize + baseGlyphRecordsSize + layerRecordsSize;
	const w = new DataWriter(totalSize);

	// -- Write header ----------------------------------------------------
	w.uint16(colr.version);
	w.uint16(baseGlyphRecords.length);
	w.uint32(baseGlyphRecordsOffset);
	w.uint32(layerRecordsOffset);
	w.uint16(layerRecords.length);

	// -- Write BaseGlyph records -----------------------------------------
	for (const rec of baseGlyphRecords) {
		w.uint16(rec.glyphID);
		w.uint16(rec.firstLayerIndex);
		w.uint16(rec.numLayers);
	}

	// -- Write Layer records ---------------------------------------------
	for (const rec of layerRecords) {
		w.uint16(rec.glyphID);
		w.uint16(rec.paletteIndex);
	}

	return w.toArray();
}
