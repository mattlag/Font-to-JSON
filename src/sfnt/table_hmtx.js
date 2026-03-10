/**
 * Font Flux JS : OTF hmtx table
 * Horizontal Metrics Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/hmtx
 *
 * Variable-size table. Contains:
 *   - hMetrics[numberOfHMetrics]  — LongHorMetric records (advanceWidth + lsb)
 *   - leftSideBearings[numGlyphs - numberOfHMetrics] — additional lsb values
 *
 * Cross-table dependencies:
 *   - hhea.numberOfHMetrics — how many full LongHorMetric records
 *   - maxp.numGlyphs       — total glyph count (to derive leftSideBearings count)
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse an hmtx table from raw bytes.
 *
 * Layout:
 *   LongHorMetric  hMetrics[numberOfHMetrics]
 *     - UFWORD  advanceWidth
 *     - FWORD   lsb
 *   FWORD  leftSideBearings[numGlyphs - numberOfHMetrics]
 *
 * @param {number[]} rawBytes
 * @param {object}   tables - Already-parsed tables (for cross-table deps)
 * @returns {object}
 */
export function parseHmtx(rawBytes, tables) {
	const numberOfHMetrics = tables.hhea.numberOfHMetrics;
	const numGlyphs = tables.maxp.numGlyphs;

	const reader = new DataReader(rawBytes);

	// Read full LongHorMetric records
	const hMetrics = [];
	for (let i = 0; i < numberOfHMetrics; i++) {
		hMetrics.push({
			advanceWidth: reader.ufword(),
			lsb: reader.fword(),
		});
	}

	// Read additional left side bearings for remaining glyphs
	const leftSideBearingCount = numGlyphs - numberOfHMetrics;
	const leftSideBearings = reader.array('fword', leftSideBearingCount);

	return { hMetrics, leftSideBearings };
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write an hmtx JSON object back to raw bytes.
 *
 * @param {object} hmtx - Parsed hmtx table data
 * @returns {number[]} Array of byte values
 */
export function writeHmtx(hmtx) {
	const { hMetrics, leftSideBearings } = hmtx;
	const totalSize = hMetrics.length * 4 + leftSideBearings.length * 2;
	const w = new DataWriter(totalSize);

	for (const metric of hMetrics) {
		w.ufword(metric.advanceWidth);
		w.fword(metric.lsb);
	}

	w.array('fword', leftSideBearings);

	return w.toArray();
}
