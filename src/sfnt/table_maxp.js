/**
 * Font Flux JS : OTF maxp table
 * Maximum Profile Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/maxp
 *
 * Two versions:
 *   - Version 0.5 (CFF/CFF2 outlines): 6 bytes  — version + numGlyphs only
 *   - Version 1.0 (TrueType outlines): 32 bytes — version + numGlyphs + 13 fields
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

/** Size of version 0.5 maxp table. */
const MAXP_V05_SIZE = 6;

/** Size of version 1.0 maxp table. */
const MAXP_V10_SIZE = 32;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a maxp table from raw bytes.
 *
 * Version 0.5 layout (6 bytes):
 *   Version16Dot16  version      — 0x00005000
 *   uint16          numGlyphs
 *
 * Version 1.0 layout (32 bytes):
 *   Version16Dot16  version      — 0x00010000
 *   uint16          numGlyphs
 *   uint16          maxPoints
 *   uint16          maxContours
 *   uint16          maxCompositePoints
 *   uint16          maxCompositeContours
 *   uint16          maxZones
 *   uint16          maxTwilightPoints
 *   uint16          maxStorage
 *   uint16          maxFunctionDefs
 *   uint16          maxInstructionDefs
 *   uint16          maxStackElements
 *   uint16          maxSizeOfInstructions
 *   uint16          maxComponentElements
 *   uint16          maxComponentDepth
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseMaxp(rawBytes) {
	const reader = new DataReader(rawBytes);

	const version = reader.uint32();
	const numGlyphs = reader.uint16();

	const result = { version, numGlyphs };

	// Version 1.0 has additional TrueType-specific fields
	if (version === 0x00010000) {
		result.maxPoints = reader.uint16();
		result.maxContours = reader.uint16();
		result.maxCompositePoints = reader.uint16();
		result.maxCompositeContours = reader.uint16();
		result.maxZones = reader.uint16();
		result.maxTwilightPoints = reader.uint16();
		result.maxStorage = reader.uint16();
		result.maxFunctionDefs = reader.uint16();
		result.maxInstructionDefs = reader.uint16();
		result.maxStackElements = reader.uint16();
		result.maxSizeOfInstructions = reader.uint16();
		result.maxComponentElements = reader.uint16();
		result.maxComponentDepth = reader.uint16();
	}

	return result;
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a maxp JSON object back to raw bytes.
 *
 * @param {object} maxp - Parsed maxp table data
 * @returns {number[]} Array of byte values (6 or 32 bytes depending on version)
 */
export function writeMaxp(maxp) {
	const isV1 = maxp.version === 0x00010000;
	const size = isV1 ? MAXP_V10_SIZE : MAXP_V05_SIZE;
	const w = new DataWriter(size);

	w.uint32(maxp.version);
	w.uint16(maxp.numGlyphs);

	if (isV1) {
		w.uint16(maxp.maxPoints);
		w.uint16(maxp.maxContours);
		w.uint16(maxp.maxCompositePoints);
		w.uint16(maxp.maxCompositeContours);
		w.uint16(maxp.maxZones);
		w.uint16(maxp.maxTwilightPoints);
		w.uint16(maxp.maxStorage);
		w.uint16(maxp.maxFunctionDefs);
		w.uint16(maxp.maxInstructionDefs);
		w.uint16(maxp.maxStackElements);
		w.uint16(maxp.maxSizeOfInstructions);
		w.uint16(maxp.maxComponentElements);
		w.uint16(maxp.maxComponentDepth);
	}

	return w.toArray();
}
