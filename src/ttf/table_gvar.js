/**
 * Font Flux JS : gvar table
 * Glyph Variations Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/gvar
 *
 * This implementation parses/writes the gvar container structure:
 * header, shared tuples, glyph data offsets, and per-glyph variation data
 * blobs. Per-glyph variation tuple decoding is intentionally left raw.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const GVAR_HEADER_SIZE = 20;
const GVAR_LONG_OFFSETS_FLAG = 0x0001;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a gvar table from raw bytes.
 *
 * Header:
 *   uint16   majorVersion
 *   uint16   minorVersion
 *   uint16   axisCount
 *   uint16   sharedTupleCount
 *   Offset32 sharedTuplesOffset
 *   uint16   glyphCount
 *   uint16   flags
 *   Offset32 glyphVariationDataArrayOffset
 *
 * Followed by glyphVariationDataOffsets[glyphCount + 1], stored as:
 *   - uint16 values (actual offset = value * 2), if flags bit0 == 0
 *   - uint32 values, if flags bit0 == 1
 *
 * Shared tuple entries are arrays of axisCount F2DOT14 values.
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseGvar(rawBytes) {
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
		glyphVariationData.push(
			Array.from(rawBytes.slice(absoluteStart, absoluteStart + length)),
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
	const sharedTuples = gvar.sharedTuples ?? [];
	const glyphVariationData = gvar.glyphVariationData ?? [];
	const glyphCount = glyphVariationData.length;
	const sharedTupleCount = sharedTuples.length;

	const sharedTuplesSize = sharedTupleCount * axisCount * 2;

	const offsets = [0];
	let current = 0;
	for (const entry of glyphVariationData) {
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
	const adjustedGlyphDataStartOffset = adjustedGlyphVariationDataArrayOffset;
	const totalSize = adjustedGlyphDataStartOffset + current;

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

	for (const entry of glyphVariationData) {
		w.rawBytes(entry);
	}

	return w.toArray();
}
