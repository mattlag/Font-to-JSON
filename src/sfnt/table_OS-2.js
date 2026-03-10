/**
 * Font Flux JS : OTF OS/2 table
 * OS/2 and Windows Metrics Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/os2
 *
 * Variable-size table with six versions (0–5). Each version adds fields:
 *   v0  — 78 bytes  (shared fields through usWinDescent)
 *   v1  — 86 bytes  (adds ulCodePageRange1/2)
 *   v2  — 96 bytes  (adds sxHeight, sCapHeight, usDefaultChar, usBreakChar, usMaxContext)
 *   v3  — 96 bytes  (same layout as v2, spec revisions only)
 *   v4  — 96 bytes  (same layout as v2, spec revisions only)
 *   v5  — 100 bytes (adds usLowerOpticalPointSize, usUpperOpticalPointSize)
 *
 * NOTE: Some legacy v0 tables may be shorter (stopping at usLastCharIndex).
 * We handle this by checking the raw byte length.
 *
 * Registry key must be 'OS/2' (matching the binary tag), but filename is
 * table_OS-2.js because '/' is not valid in filenames.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

// Byte sizes for each version
const SIZE_V0 = 78;
const SIZE_V1 = 86;
const SIZE_V2 = 96; // also v3, v4
const SIZE_V5 = 100;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse an OS/2 table from raw bytes.
 *
 * Shared fields (all versions, 68 bytes through usLastCharIndex):
 *   uint16  version
 *   FWORD   xAvgCharWidth
 *   uint16  usWeightClass
 *   uint16  usWidthClass
 *   uint16  fsType
 *   FWORD   ySubscriptXSize
 *   FWORD   ySubscriptYSize
 *   FWORD   ySubscriptXOffset
 *   FWORD   ySubscriptYOffset
 *   FWORD   ySuperscriptXSize
 *   FWORD   ySuperscriptYSize
 *   FWORD   ySuperscriptXOffset
 *   FWORD   ySuperscriptYOffset
 *   FWORD   yStrikeoutSize
 *   FWORD   yStrikeoutPosition
 *   int16   sFamilyClass
 *   uint8   panose[10]
 *   uint32  ulUnicodeRange1
 *   uint32  ulUnicodeRange2
 *   uint32  ulUnicodeRange3
 *   uint32  ulUnicodeRange4
 *   Tag     achVendID
 *   uint16  fsSelection
 *   uint16  usFirstCharIndex
 *   uint16  usLastCharIndex
 *
 * v0 adds (10 bytes — some legacy v0 may omit these):
 *   FWORD   sTypoAscender
 *   FWORD   sTypoDescender
 *   FWORD   sTypoLineGap
 *   UFWORD  usWinAscent
 *   UFWORD  usWinDescent
 *
 * v1 adds (8 bytes):
 *   uint32  ulCodePageRange1
 *   uint32  ulCodePageRange2
 *
 * v2/v3/v4 add (10 bytes):
 *   FWORD   sxHeight
 *   FWORD   sCapHeight
 *   uint16  usDefaultChar
 *   uint16  usBreakChar
 *   uint16  usMaxContext
 *
 * v5 adds (4 bytes):
 *   uint16  usLowerOpticalPointSize
 *   uint16  usUpperOpticalPointSize
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseOS2(rawBytes) {
	const reader = new DataReader(rawBytes);
	const length = rawBytes.length;

	const result = {};

	// -- Shared fields (all versions) ------------------------------------
	result.version = reader.uint16();
	result.xAvgCharWidth = reader.fword();
	result.usWeightClass = reader.uint16();
	result.usWidthClass = reader.uint16();
	result.fsType = reader.uint16();
	result.ySubscriptXSize = reader.fword();
	result.ySubscriptYSize = reader.fword();
	result.ySubscriptXOffset = reader.fword();
	result.ySubscriptYOffset = reader.fword();
	result.ySuperscriptXSize = reader.fword();
	result.ySuperscriptYSize = reader.fword();
	result.ySuperscriptXOffset = reader.fword();
	result.ySuperscriptYOffset = reader.fword();
	result.yStrikeoutSize = reader.fword();
	result.yStrikeoutPosition = reader.fword();
	result.sFamilyClass = reader.int16();
	result.panose = reader.bytes(10);
	result.ulUnicodeRange1 = reader.uint32();
	result.ulUnicodeRange2 = reader.uint32();
	result.ulUnicodeRange3 = reader.uint32();
	result.ulUnicodeRange4 = reader.uint32();
	result.achVendID = reader.tag();
	result.fsSelection = reader.uint16();
	result.usFirstCharIndex = reader.uint16();
	result.usLastCharIndex = reader.uint16();

	// Position is now 68 bytes in.
	// Some legacy v0 tables stop here (no typo/win metrics).
	if (length < SIZE_V0) {
		return result;
	}

	// -- v0 additional fields --------------------------------------------
	result.sTypoAscender = reader.fword();
	result.sTypoDescender = reader.fword();
	result.sTypoLineGap = reader.fword();
	result.usWinAscent = reader.ufword();
	result.usWinDescent = reader.ufword();

	if (result.version < 1 || length < SIZE_V1) {
		return result;
	}

	// -- v1 additional fields --------------------------------------------
	result.ulCodePageRange1 = reader.uint32();
	result.ulCodePageRange2 = reader.uint32();

	if (result.version < 2 || length < SIZE_V2) {
		return result;
	}

	// -- v2/v3/v4 additional fields --------------------------------------
	result.sxHeight = reader.fword();
	result.sCapHeight = reader.fword();
	result.usDefaultChar = reader.uint16();
	result.usBreakChar = reader.uint16();
	result.usMaxContext = reader.uint16();

	if (result.version < 5 || length < SIZE_V5) {
		return result;
	}

	// -- v5 additional fields --------------------------------------------
	result.usLowerOpticalPointSize = reader.uint16();
	result.usUpperOpticalPointSize = reader.uint16();

	return result;
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write an OS/2 JSON object back to raw bytes.
 *
 * The output size is determined by the version field.
 *
 * @param {object} table - parsed OS/2 table
 * @returns {number[]}
 */
export function writeOS2(table) {
	const version = table.version;

	// Determine output size based on version
	let size;
	if (version >= 5) {
		size = SIZE_V5;
	} else if (version >= 2) {
		size = SIZE_V2;
	} else if (version >= 1) {
		size = SIZE_V1;
	} else {
		// v0 — check if the typo/win fields are present; if not, short form
		size = table.sTypoAscender !== undefined ? SIZE_V0 : 68;
	}

	const writer = new DataWriter(size);

	// -- Shared fields ---------------------------------------------------
	writer
		.uint16(version)
		.fword(table.xAvgCharWidth)
		.uint16(table.usWeightClass)
		.uint16(table.usWidthClass)
		.uint16(table.fsType)
		.fword(table.ySubscriptXSize)
		.fword(table.ySubscriptYSize)
		.fword(table.ySubscriptXOffset)
		.fword(table.ySubscriptYOffset)
		.fword(table.ySuperscriptXSize)
		.fword(table.ySuperscriptYSize)
		.fword(table.ySuperscriptXOffset)
		.fword(table.ySuperscriptYOffset)
		.fword(table.yStrikeoutSize)
		.fword(table.yStrikeoutPosition)
		.int16(table.sFamilyClass)
		.rawBytes(table.panose)
		.uint32(table.ulUnicodeRange1)
		.uint32(table.ulUnicodeRange2)
		.uint32(table.ulUnicodeRange3)
		.uint32(table.ulUnicodeRange4)
		.tag(table.achVendID)
		.uint16(table.fsSelection)
		.uint16(table.usFirstCharIndex)
		.uint16(table.usLastCharIndex);

	if (size <= 68) return writer.toArray();

	// -- v0+ fields ------------------------------------------------------
	writer
		.fword(table.sTypoAscender)
		.fword(table.sTypoDescender)
		.fword(table.sTypoLineGap)
		.ufword(table.usWinAscent)
		.ufword(table.usWinDescent);

	if (version < 1) return writer.toArray();

	// -- v1+ fields ------------------------------------------------------
	writer.uint32(table.ulCodePageRange1).uint32(table.ulCodePageRange2);

	if (version < 2) return writer.toArray();

	// -- v2+ fields ------------------------------------------------------
	writer
		.fword(table.sxHeight)
		.fword(table.sCapHeight)
		.uint16(table.usDefaultChar)
		.uint16(table.usBreakChar)
		.uint16(table.usMaxContext);

	if (version < 5) return writer.toArray();

	// -- v5 fields -------------------------------------------------------
	writer
		.uint16(table.usLowerOpticalPointSize)
		.uint16(table.usUpperOpticalPointSize);

	return writer.toArray();
}
