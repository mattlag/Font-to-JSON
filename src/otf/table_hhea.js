/**
 * Font-to-JSON : OTF hhea table
 * Horizontal Header Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/hhea
 *
 * Fixed-size table (36 bytes). Contains horizontal layout metrics such as
 * ascender, descender, line gap, caret slope, and the number of hMetric
 * entries used by the hmtx table.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

/**
 * hhea table size is always 36 bytes.
 */
const HHEA_TABLE_SIZE = 36;

// ═══════════════════════════════════════════════════════════════════════════
//  PARSING  (binary → JSON)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse an hhea table from raw bytes.
 *
 * Layout (36 bytes):
 *   uint16  majorVersion         — must be 1
 *   uint16  minorVersion         — must be 0
 *   FWORD   ascender
 *   FWORD   descender
 *   FWORD   lineGap
 *   UFWORD  advanceWidthMax
 *   FWORD   minLeftSideBearing
 *   FWORD   minRightSideBearing
 *   FWORD   xMaxExtent
 *   int16   caretSlopeRise
 *   int16   caretSlopeRun
 *   int16   caretOffset
 *   int16   (reserved) ×4
 *   int16   metricDataFormat     — 0 for current format
 *   uint16  numberOfHMetrics
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseHhea(rawBytes) {
	const reader = new DataReader(rawBytes);

	return {
		majorVersion: reader.uint16(),
		minorVersion: reader.uint16(),
		ascender: reader.fword(),
		descender: reader.fword(),
		lineGap: reader.fword(),
		advanceWidthMax: reader.ufword(),
		minLeftSideBearing: reader.fword(),
		minRightSideBearing: reader.fword(),
		xMaxExtent: reader.fword(),
		caretSlopeRise: reader.int16(),
		caretSlopeRun: reader.int16(),
		caretOffset: reader.int16(),
		reserved1: reader.int16(),
		reserved2: reader.int16(),
		reserved3: reader.int16(),
		reserved4: reader.int16(),
		metricDataFormat: reader.int16(),
		numberOfHMetrics: reader.uint16(),
	};
}

// ═══════════════════════════════════════════════════════════════════════════
//  WRITING  (JSON → binary)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Write an hhea JSON object back to raw bytes.
 *
 * @param {object} hhea - Parsed hhea table data
 * @returns {number[]} Array of byte values (36 bytes)
 */
export function writeHhea(hhea) {
	const w = new DataWriter(HHEA_TABLE_SIZE);

	w.uint16(hhea.majorVersion);
	w.uint16(hhea.minorVersion);
	w.fword(hhea.ascender);
	w.fword(hhea.descender);
	w.fword(hhea.lineGap);
	w.ufword(hhea.advanceWidthMax);
	w.fword(hhea.minLeftSideBearing);
	w.fword(hhea.minRightSideBearing);
	w.fword(hhea.xMaxExtent);
	w.int16(hhea.caretSlopeRise);
	w.int16(hhea.caretSlopeRun);
	w.int16(hhea.caretOffset);
	w.int16(hhea.reserved1);
	w.int16(hhea.reserved2);
	w.int16(hhea.reserved3);
	w.int16(hhea.reserved4);
	w.int16(hhea.metricDataFormat);
	w.uint16(hhea.numberOfHMetrics);

	return w.toArray();
}
