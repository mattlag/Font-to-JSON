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
 *   Currently this module fully parses/writes v0 structures. For v1,
 *   the header fields are preserved and v1-specific raw subtable data
 *   is stored for round-trip fidelity.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

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
	// Read the v1 header offsets. The Paint table DAG is extremely complex
	// (32 paint formats). For round-trip fidelity, the raw v1 subtable bytes
	// are stored in _v1Data. Future versions may fully parse Paint tables.
	if (version >= 1) {
		// Position after the v0 header (14 bytes)
		reader.seek(14);
		const baseGlyphListOffset = reader.uint32();
		const layerListOffset = reader.uint32();
		const clipListOffset = reader.uint32();
		const varIndexMapOffset = reader.uint32();
		const itemVariationStoreOffset = reader.uint32();

		result.v1Header = {
			baseGlyphListOffset,
			layerListOffset,
			clipListOffset,
			varIndexMapOffset,
			itemVariationStoreOffset,
		};

		// Store raw v1 data: everything after the v1 header (34 bytes)
		// that isn't part of v0 BaseGlyph/Layer records.
		// This is a pragmatic approach for round-trip — the full v0 data
		// is already parsed above; this captures the v1 paint DAG.
		result._v1RawBytes = rawBytes.slice(0);
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
 * For v1: uses stored _v1RawBytes for the complete table (since v1 Paint
 *         data is preserved as raw bytes for round-trip fidelity).
 *
 * @param {object} colr - Parsed COLR table data
 * @returns {number[]} Array of byte values
 */
export function writeCOLR(colr) {
	// If we have raw v1 bytes, use them directly for round-trip
	if (colr.version >= 1 && colr._v1RawBytes) {
		return colr._v1RawBytes;
	}

	const { baseGlyphRecords, layerRecords } = colr;

	// -- Compute layout --------------------------------------------------
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
