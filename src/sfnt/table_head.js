/**
 * Font Flux JS : OTF head table
 * Font Header Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/head
 *
 * Fixed-size table (54 bytes). Contains global font information such as
 * version, units-per-em, bounding box, creation/modification dates, and
 * various flags.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

/**
 * head table size is always 54 bytes.
 */
const HEAD_TABLE_SIZE = 54;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a head table from raw bytes.
 *
 * Layout (54 bytes):
 *   uint16        majorVersion         — must be 1
 *   uint16        minorVersion         — must be 0
 *   Fixed         fontRevision         — 16.16 fixed-point
 *   uint32        checksumAdjustment   — global font checksum adjustment
 *   uint32        magicNumber          — must be 0x5F0F3CF5
 *   uint16        flags
 *   uint16        unitsPerEm           — 16–16384
 *   LONGDATETIME  created              — seconds since 1904-01-01 00:00 UTC
 *   LONGDATETIME  modified             — seconds since 1904-01-01 00:00 UTC
 *   int16         xMin
 *   int16         yMin
 *   int16         xMax
 *   int16         yMax
 *   uint16        macStyle
 *   uint16        lowestRecPPEM
 *   int16         fontDirectionHint    — deprecated, set to 2
 *   int16         indexToLocFormat      — 0 = short offsets, 1 = long
 *   int16         glyphDataFormat      — 0 for current format
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseHead(rawBytes) {
	const reader = new DataReader(rawBytes);

	return {
		majorVersion: reader.uint16(),
		minorVersion: reader.uint16(),
		fontRevision: reader.fixed(),
		checksumAdjustment: reader.uint32(),
		magicNumber: reader.uint32(),
		flags: reader.uint16(),
		unitsPerEm: reader.uint16(),
		created: reader.longDateTime(),
		modified: reader.longDateTime(),
		xMin: reader.int16(),
		yMin: reader.int16(),
		xMax: reader.int16(),
		yMax: reader.int16(),
		macStyle: reader.uint16(),
		lowestRecPPEM: reader.uint16(),
		fontDirectionHint: reader.int16(),
		indexToLocFormat: reader.int16(),
		glyphDataFormat: reader.int16(),
	};
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a head JSON object back to raw bytes.
 *
 * @param {object} head - Parsed head table data
 * @returns {number[]} Array of byte values (54 bytes)
 */
export function writeHead(head) {
	const w = new DataWriter(HEAD_TABLE_SIZE);

	w.uint16(head.majorVersion);
	w.uint16(head.minorVersion);
	w.fixed(head.fontRevision);
	w.uint32(head.checksumAdjustment);
	w.uint32(head.magicNumber);
	w.uint16(head.flags);
	w.uint16(head.unitsPerEm);
	w.longDateTime(head.created);
	w.longDateTime(head.modified);
	w.int16(head.xMin);
	w.int16(head.yMin);
	w.int16(head.xMax);
	w.int16(head.yMax);
	w.uint16(head.macStyle);
	w.uint16(head.lowestRecPPEM);
	w.int16(head.fontDirectionHint);
	w.int16(head.indexToLocFormat);
	w.int16(head.glyphDataFormat);

	return w.toArray();
}
