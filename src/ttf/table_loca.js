/**
 * Font Flux JS : loca (Index to Location) table parser / writer.
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/loca
 *
 * Stores an array of offsets into the 'glyf' table for each glyph.
 * The number of entries is numGlyphs + 1 (the extra entry gives the length of
 * the last glyph).  Two formats exist:
 *
 *   Short format (head.indexToLocFormat === 0):
 *     Offset16  offsets[numGlyphs + 1]   — actual offset ÷ 2
 *
 *   Long format (head.indexToLocFormat === 1):
 *     Offset32  offsets[numGlyphs + 1]   — actual offset
 *
 * Cross-table dependencies:
 *   - head.indexToLocFormat — determines short (0) or long (1) format
 *   - maxp.numGlyphs       — number of glyphs (offsets array has numGlyphs + 1 entries)
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a loca table from raw bytes.
 *
 * @param {number[]} rawBytes
 * @param {object}   tables - Already-parsed tables (for cross-table deps)
 * @returns {object}  { offsets: number[] }
 */
export function parseLoca(rawBytes, tables) {
	const format = tables.head.indexToLocFormat;
	const numGlyphs = tables.maxp.numGlyphs;
	const count = numGlyphs + 1;

	const reader = new DataReader(rawBytes);
	const offsets = [];

	if (format === 0) {
		// Short format — stored as uint16, actual offset = value × 2
		for (let i = 0; i < count; i++) {
			offsets.push(reader.uint16() * 2);
		}
	} else {
		// Long format — stored as uint32, actual offset
		for (let i = 0; i < count; i++) {
			offsets.push(reader.uint32());
		}
	}

	return { offsets };
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a loca table from JSON back to raw bytes.
 *
 * The format (short vs long) is determined automatically:
 *   - If all offsets are even and fit in uint16 × 2 range, use short format.
 *   - Otherwise, use long format.
 *
 * NOTE: The caller (export.js) should ensure head.indexToLocFormat is updated
 * to match whichever format is used here.  For simplicity and round-trip
 * fidelity, we detect the format from the data and write accordingly.
 *
 * @param {object} loca - Parsed loca table data
 * @returns {number[]} Array of byte values
 */
export function writeLoca(loca) {
	const { offsets } = loca;
	const canUseShort = offsets.every((o) => o % 2 === 0 && o / 2 <= 0xffff);

	if (canUseShort) {
		const w = new DataWriter(offsets.length * 2);
		for (const o of offsets) {
			w.uint16(o / 2);
		}
		return w.toArray();
	}

	const w = new DataWriter(offsets.length * 4);
	for (const o of offsets) {
		w.uint32(o);
	}
	return w.toArray();
}
