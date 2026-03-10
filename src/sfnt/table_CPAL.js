/**
 * Font Flux JS : CPAL table
 * Color Palette Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/cpal
 *
 * Defines one or more color palettes used by the COLR or SVG tables.
 * Each palette contains the same number of color entries (numPaletteEntries).
 * Colors are stored as BGRA (blue, green, red, alpha) uint8 values in sRGB.
 *
 * Version 0: basic palette data.
 * Version 1: adds paletteTypes, paletteLabels, paletteEntryLabels arrays.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a CPAL table from raw bytes.
 *
 * Header (v0 – 12 + 2×numPalettes bytes):
 *   uint16   version
 *   uint16   numPaletteEntries   — entries per palette
 *   uint16   numPalettes
 *   uint16   numColorRecords     — total ColorRecords across all palettes
 *   Offset32 colorRecordsArrayOffset — from start of CPAL table
 *   uint16   colorRecordIndices[numPalettes]
 *
 * Version 1 appends:
 *   Offset32 paletteTypesArrayOffset        — 0 if not provided
 *   Offset32 paletteLabelsArrayOffset       — 0 if not provided
 *   Offset32 paletteEntryLabelsArrayOffset  — 0 if not provided
 *
 * ColorRecord (4 bytes, BGRA):
 *   uint8 blue, uint8 green, uint8 red, uint8 alpha
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseCPAL(rawBytes) {
	const reader = new DataReader(rawBytes);

	const version = reader.uint16();
	const numPaletteEntries = reader.uint16();
	const numPalettes = reader.uint16();
	const numColorRecords = reader.uint16();
	const colorRecordsArrayOffset = reader.uint32();

	// colorRecordIndices — starting index for each palette within the color records array
	const colorRecordIndices = [];
	for (let i = 0; i < numPalettes; i++) {
		colorRecordIndices.push(reader.uint16());
	}

	// Version 1 extra offsets
	let paletteTypesArrayOffset = 0;
	let paletteLabelsArrayOffset = 0;
	let paletteEntryLabelsArrayOffset = 0;

	if (version >= 1) {
		paletteTypesArrayOffset = reader.uint32();
		paletteLabelsArrayOffset = reader.uint32();
		paletteEntryLabelsArrayOffset = reader.uint32();
	}

	// -- Read all ColorRecords -------------------------------------------
	reader.seek(colorRecordsArrayOffset);
	const allColorRecords = [];
	for (let i = 0; i < numColorRecords; i++) {
		allColorRecords.push({
			blue: reader.uint8(),
			green: reader.uint8(),
			red: reader.uint8(),
			alpha: reader.uint8(),
		});
	}

	// -- Build palettes — each palette is a slice of the color records ---
	const palettes = [];
	for (let p = 0; p < numPalettes; p++) {
		const startIndex = colorRecordIndices[p];
		const entries = [];
		for (let e = 0; e < numPaletteEntries; e++) {
			entries.push({ ...allColorRecords[startIndex + e] });
		}
		palettes.push(entries);
	}

	const result = {
		version,
		numPaletteEntries,
		palettes,
	};

	// -- Version 1: palette types ----------------------------------------
	if (version >= 1 && paletteTypesArrayOffset !== 0) {
		reader.seek(paletteTypesArrayOffset);
		result.paletteTypes = [];
		for (let i = 0; i < numPalettes; i++) {
			result.paletteTypes.push(reader.uint32());
		}
	}

	// -- Version 1: palette labels (name table IDs) ----------------------
	if (version >= 1 && paletteLabelsArrayOffset !== 0) {
		reader.seek(paletteLabelsArrayOffset);
		result.paletteLabels = [];
		for (let i = 0; i < numPalettes; i++) {
			result.paletteLabels.push(reader.uint16());
		}
	}

	// -- Version 1: palette entry labels (name table IDs) ----------------
	if (version >= 1 && paletteEntryLabelsArrayOffset !== 0) {
		reader.seek(paletteEntryLabelsArrayOffset);
		result.paletteEntryLabels = [];
		for (let i = 0; i < numPaletteEntries; i++) {
			result.paletteEntryLabels.push(reader.uint16());
		}
	}

	return result;
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a CPAL JSON object back to raw bytes.
 *
 * @param {object} cpal - Parsed CPAL table data
 * @returns {number[]} Array of byte values
 */
export function writeCPAL(cpal) {
	const { version, numPaletteEntries, palettes } = cpal;
	const numPalettes = palettes.length;

	// -- Build deduplicated color record array ----------------------------
	// We write palettes contiguously — each palette gets its own block.
	// Multiple palettes may share identical records in the spec, but for
	// simplicity (and correct round-trip), we write each palette as its own
	// contiguous sequence.
	const colorRecordIndices = [];
	const allColorRecords = [];

	for (let p = 0; p < numPalettes; p++) {
		colorRecordIndices.push(allColorRecords.length);
		for (let e = 0; e < numPaletteEntries; e++) {
			allColorRecords.push(palettes[p][e]);
		}
	}

	const numColorRecords = allColorRecords.length;

	// -- Calculate layout sizes ------------------------------------------
	// Header: 8 bytes (4 uint16s) + 4 bytes (Offset32) + 2×numPalettes (indices)
	const headerSize = 8 + 4 + numPalettes * 2;

	// Version 1 adds 3 Offset32 fields
	const v1HeaderExtra = version >= 1 ? 12 : 0;

	const colorRecordsArrayOffset = headerSize + v1HeaderExtra;
	const colorRecordsSize = numColorRecords * 4;

	// v1 optional arrays follow color records
	let currentOffset = colorRecordsArrayOffset + colorRecordsSize;

	let paletteTypesArrayOffset = 0;
	let paletteLabelsArrayOffset = 0;
	let paletteEntryLabelsArrayOffset = 0;

	if (version >= 1 && cpal.paletteTypes) {
		paletteTypesArrayOffset = currentOffset;
		currentOffset += numPalettes * 4;
	}
	if (version >= 1 && cpal.paletteLabels) {
		paletteLabelsArrayOffset = currentOffset;
		currentOffset += numPalettes * 2;
	}
	if (version >= 1 && cpal.paletteEntryLabels) {
		paletteEntryLabelsArrayOffset = currentOffset;
		currentOffset += numPaletteEntries * 2;
	}

	const totalSize = currentOffset;
	const w = new DataWriter(totalSize);

	// -- Write header ----------------------------------------------------
	w.uint16(version);
	w.uint16(numPaletteEntries);
	w.uint16(numPalettes);
	w.uint16(numColorRecords);
	w.uint32(colorRecordsArrayOffset);

	for (let i = 0; i < numPalettes; i++) {
		w.uint16(colorRecordIndices[i]);
	}

	if (version >= 1) {
		w.uint32(paletteTypesArrayOffset);
		w.uint32(paletteLabelsArrayOffset);
		w.uint32(paletteEntryLabelsArrayOffset);
	}

	// -- Write color records ---------------------------------------------
	for (const rec of allColorRecords) {
		w.uint8(rec.blue);
		w.uint8(rec.green);
		w.uint8(rec.red);
		w.uint8(rec.alpha);
	}

	// -- Write v1 optional arrays ----------------------------------------
	if (version >= 1 && cpal.paletteTypes) {
		for (const type of cpal.paletteTypes) {
			w.uint32(type);
		}
	}
	if (version >= 1 && cpal.paletteLabels) {
		for (const label of cpal.paletteLabels) {
			w.uint16(label);
		}
	}
	if (version >= 1 && cpal.paletteEntryLabels) {
		for (const label of cpal.paletteEntryLabels) {
			w.uint16(label);
		}
	}

	return w.toArray();
}
