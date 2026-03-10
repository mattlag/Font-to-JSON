/**
 * Font Flux JS : vmtx table
 * Vertical Metrics Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/vmtx
 *
 * Variable-size table. Contains:
 *   - vMetrics[numOfLongVerMetrics]  — LongVerMetric records (advanceHeight + tsb)
 *   - topSideBearings[numGlyphs - numOfLongVerMetrics] — additional tsb values
 *
 * Cross-table dependencies:
 *   - vhea.numOfLongVerMetrics — how many full LongVerMetric records
 *   - maxp.numGlyphs          — total glyph count (to derive topSideBearings count)
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a vmtx table from raw bytes.
 *
 * Layout:
 *   LongVerMetric  vMetrics[numOfLongVerMetrics]
 *     - UFWORD  advanceHeight
 *     - FWORD   topSideBearing
 *   FWORD  topSideBearings[numGlyphs - numOfLongVerMetrics]
 *
 * @param {number[]} rawBytes
 * @param {object}   tables - Already-parsed tables (for cross-table deps)
 * @returns {object}
 */
export function parseVmtx(rawBytes, tables) {
	const numOfLongVerMetrics = tables.vhea.numOfLongVerMetrics;
	const numGlyphs = tables.maxp.numGlyphs;

	const reader = new DataReader(rawBytes);

	// Read full LongVerMetric records
	const vMetrics = [];
	for (let i = 0; i < numOfLongVerMetrics; i++) {
		vMetrics.push({
			advanceHeight: reader.ufword(),
			topSideBearing: reader.fword(),
		});
	}

	// Read additional top side bearings for remaining glyphs
	const topSideBearingCount = numGlyphs - numOfLongVerMetrics;
	const topSideBearings = reader.array('fword', topSideBearingCount);

	return { vMetrics, topSideBearings };
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a vmtx JSON object back to raw bytes.
 *
 * @param {object} vmtx - Parsed vmtx table data
 * @returns {number[]} Array of byte values
 */
export function writeVmtx(vmtx) {
	const { vMetrics, topSideBearings } = vmtx;
	const totalSize = vMetrics.length * 4 + topSideBearings.length * 2;
	const w = new DataWriter(totalSize);

	for (const metric of vMetrics) {
		w.ufword(metric.advanceHeight);
		w.fword(metric.topSideBearing);
	}

	w.array('fword', topSideBearings);

	return w.toArray();
}
