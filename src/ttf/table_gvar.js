/**
 * Font Flux JS : gvar table
 * Glyph Variations Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/gvar
 *
 * Per-glyph variation data is fully parsed into structured tuple variation
 * objects with resolved peak tuples, point indices, and X/Y deltas.
 */

import { DataReader } from '../reader.js';
import {
	parseGlyphVariationData,
	writeGlyphVariationData,
} from '../sfnt/tuple_variation_common.js';
import { DataWriter } from '../writer.js';

const GVAR_HEADER_SIZE = 20;
const GVAR_LONG_OFFSETS_FLAG = 0x0001;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a gvar table from raw bytes.
 *
 * @param {number[]} rawBytes
 * @param {object} [tables] - Parsed tables map (for glyf point counts)
 * @returns {object}
 */
export function parseGvar(rawBytes, tables = {}) {
	const reader = new DataReader(rawBytes);

	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const axisCount = reader.uint16();
	const sharedTupleCount = reader.uint16();
	const sharedTuplesOffset = reader.offset32();
	const glyphCount = reader.uint16();
	const flags = reader.uint16();
	const glyphVariationDataArrayOffset = reader.offset32();

	const longOffsets = (flags & GVAR_LONG_OFFSETS_FLAG) !== 0;
	const offsetCount = glyphCount + 1;
	const glyphVariationDataOffsets = [];

	for (let i = 0; i < offsetCount; i++) {
		if (longOffsets) {
			glyphVariationDataOffsets.push(reader.uint32());
		} else {
			glyphVariationDataOffsets.push(reader.uint16() * 2);
		}
	}

	const sharedTuples = [];
	if (sharedTupleCount > 0 && sharedTuplesOffset > 0) {
		reader.seek(sharedTuplesOffset);
		for (let i = 0; i < sharedTupleCount; i++) {
			const tuple = [];
			for (let a = 0; a < axisCount; a++) {
				tuple.push(reader.f2dot14());
			}
			sharedTuples.push(tuple);
		}
	}

	const glyphVariationData = [];
	for (let g = 0; g < glyphCount; g++) {
		const start = glyphVariationDataOffsets[g];
		const end = glyphVariationDataOffsets[g + 1];
		const length = Math.max(0, end - start);

		if (length === 0) {
			glyphVariationData.push([]);
			continue;
		}

		const absoluteStart = glyphVariationDataArrayOffset + start;
		const glyphBytes = rawBytes.slice(absoluteStart, absoluteStart + length);
		const numPoints = getGlyphPointCount(tables, g);
		glyphVariationData.push(
			parseGlyphVariationData(glyphBytes, axisCount, sharedTuples, numPoints),
		);
	}

	return {
		majorVersion,
		minorVersion,
		axisCount,
		flags,
		sharedTuples,
		glyphVariationData,
	};
}

/**
 * Get the total point count (contour points + 4 phantoms) for a glyph.
 * Falls back to 0 if glyf data is unavailable.
 */
function getGlyphPointCount(tables, glyphIndex) {
	const glyph = tables.glyf?.glyphs?.[glyphIndex];
	if (!glyph) return 0;

	if (glyph.type === 'simple' && glyph.contours) {
		let count = 0;
		for (const contour of glyph.contours) {
			count += contour.length;
		}
		return count + 4; // + 4 phantom points
	}

	if (glyph.type === 'composite' && glyph.components) {
		return glyph.components.length + 4;
	}

	return 0;
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a gvar JSON object back to raw bytes.
 *
 * @param {object} gvar - Parsed gvar table data
 * @returns {number[]} Array of byte values
 */
export function writeGvar(gvar) {
	const majorVersion = gvar.majorVersion ?? 1;
	const minorVersion = gvar.minorVersion ?? 0;
	const axisCount = gvar.axisCount ?? 0;
	const glyphVariationData = gvar.glyphVariationData ?? [];
	const glyphCount = glyphVariationData.length;

	// Encode each glyph's variation data to bytes
	const encodedGlyphs = glyphVariationData.map((entry) => {
		// Already raw bytes (backward compat)
		if (
			Array.isArray(entry) &&
			(entry.length === 0 || typeof entry[0] === 'number')
		) {
			return entry;
		}
		// Structured tuple variations array
		if (Array.isArray(entry)) {
			return writeGlyphVariationData(entry, axisCount);
		}
		return [];
	});

	// Collect unique shared tuples from parsed data
	const sharedTuples =
		gvar.sharedTuples ?? collectSharedTuples(glyphVariationData, axisCount);
	const sharedTupleCount = sharedTuples.length;
	const sharedTuplesSize = sharedTupleCount * axisCount * 2;

	const offsets = [0];
	let current = 0;
	for (const entry of encodedGlyphs) {
		current += entry.length;
		offsets.push(current);
	}

	const canUseShortOffsets = offsets.every(
		(offset) => offset % 2 === 0 && offset / 2 <= 0xffff,
	);
	const offsetEntrySize = canUseShortOffsets ? 2 : 4;
	const glyphVariationDataOffsetsSize = (glyphCount + 1) * offsetEntrySize;
	const adjustedSharedTuplesOffset =
		GVAR_HEADER_SIZE + glyphVariationDataOffsetsSize;
	const adjustedGlyphVariationDataArrayOffset =
		adjustedSharedTuplesOffset + sharedTuplesSize;
	const totalSize = adjustedGlyphVariationDataArrayOffset + current;

	const existingFlags = gvar.flags ?? 0;
	const flags = canUseShortOffsets
		? existingFlags & ~GVAR_LONG_OFFSETS_FLAG
		: existingFlags | GVAR_LONG_OFFSETS_FLAG;

	const w = new DataWriter(totalSize);

	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint16(axisCount);
	w.uint16(sharedTupleCount);
	w.offset32(adjustedSharedTuplesOffset);
	w.uint16(glyphCount);
	w.uint16(flags);
	w.offset32(adjustedGlyphVariationDataArrayOffset);

	for (const offset of offsets) {
		if (canUseShortOffsets) {
			w.uint16(offset / 2);
		} else {
			w.uint32(offset);
		}
	}

	for (const tuple of sharedTuples) {
		for (let i = 0; i < axisCount; i++) {
			w.f2dot14(tuple[i] ?? 0);
		}
	}

	for (const entry of encodedGlyphs) {
		w.rawBytes(entry);
	}

	return w.toArray();
}

/**
 * Collect unique peak tuples across all glyphs for the shared tuples array.
 * Only used when sharedTuples aren't already provided.
 */
function collectSharedTuples(glyphVariationData, axisCount) {
	if (axisCount === 0) return [];

	const seen = new Set();
	const tuples = [];

	for (const entry of glyphVariationData) {
		if (!Array.isArray(entry)) continue;
		for (const tv of entry) {
			if (!tv || !tv.peakTuple) continue;
			const key = tv.peakTuple
				.map((v) => Math.round((v ?? 0) * 16384))
				.join(',');
			if (!seen.has(key)) {
				seen.add(key);
				tuples.push(tv.peakTuple);
			}
		}
	}

	return tuples;
}
