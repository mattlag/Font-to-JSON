/**
 * Font Flux JS : vhea table
 * Vertical Header Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/vhea
 *
 * Fixed-size table (36 bytes). Contains vertical layout metrics such as
 * ascender/descender (v1.0) or vertTypoAscender/vertTypoDescender (v1.1),
 * line gap, caret slope, and the number of vMetric entries used by vmtx.
 *
 * Two spec versions exist (1.0 = 0x00010000, 1.1 = 0x00011000) — the binary
 * layout is identical; only certain field names/definitions differ.
 * We store the version as a raw uint32 and use version-neutral field names
 * that match the v1.1 spec (vertTypoAscender, vertTypoDescender,
 * vertTypoLineGap), since the field offsets are the same.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

/**
 * vhea table size is always 36 bytes.
 */
const VHEA_TABLE_SIZE = 36;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a vhea table from raw bytes.
 *
 * Layout (36 bytes):
 *   Version16Dot16  version              — 0x00010000 (1.0) or 0x00011000 (1.1)
 *   FWORD           vertTypoAscender     — (v1.0: "ascent")
 *   FWORD           vertTypoDescender    — (v1.0: "descent")
 *   FWORD           vertTypoLineGap      — (v1.0: "lineGap")
 *   UFWORD          advanceHeightMax
 *   FWORD           minTopSideBearing
 *   FWORD           minBottomSideBearing
 *   FWORD           yMaxExtent
 *   int16           caretSlopeRise
 *   int16           caretSlopeRun
 *   int16           caretOffset
 *   int16           (reserved) ×4
 *   int16           metricDataFormat     — 0 for current format
 *   uint16          numOfLongVerMetrics
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseVhea(rawBytes) {
	const reader = new DataReader(rawBytes);

	return {
		version: reader.uint32(),
		vertTypoAscender: reader.fword(),
		vertTypoDescender: reader.fword(),
		vertTypoLineGap: reader.fword(),
		advanceHeightMax: reader.ufword(),
		minTopSideBearing: reader.fword(),
		minBottomSideBearing: reader.fword(),
		yMaxExtent: reader.fword(),
		caretSlopeRise: reader.int16(),
		caretSlopeRun: reader.int16(),
		caretOffset: reader.int16(),
		reserved1: reader.int16(),
		reserved2: reader.int16(),
		reserved3: reader.int16(),
		reserved4: reader.int16(),
		metricDataFormat: reader.int16(),
		numOfLongVerMetrics: reader.uint16(),
	};
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a vhea JSON object back to raw bytes.
 *
 * @param {object} vhea - Parsed vhea table data
 * @returns {number[]} Array of byte values (36 bytes)
 */
export function writeVhea(vhea) {
	const w = new DataWriter(VHEA_TABLE_SIZE);

	w.uint32(vhea.version);
	w.fword(vhea.vertTypoAscender);
	w.fword(vhea.vertTypoDescender);
	w.fword(vhea.vertTypoLineGap);
	w.ufword(vhea.advanceHeightMax);
	w.fword(vhea.minTopSideBearing);
	w.fword(vhea.minBottomSideBearing);
	w.fword(vhea.yMaxExtent);
	w.int16(vhea.caretSlopeRise);
	w.int16(vhea.caretSlopeRun);
	w.int16(vhea.caretOffset);
	w.int16(vhea.reserved1);
	w.int16(vhea.reserved2);
	w.int16(vhea.reserved3);
	w.int16(vhea.reserved4);
	w.int16(vhea.metricDataFormat);
	w.uint16(vhea.numOfLongVerMetrics);

	return w.toArray();
}
