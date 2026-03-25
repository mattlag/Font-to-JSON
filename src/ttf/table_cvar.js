/**
 * Font Flux JS : cvar table
 * CVT Variations Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/cvar
 *
 * Tuple variations are fully parsed into structured objects with resolved
 * peak tuples, point indices, and CVT deltas.
 */

import {
	parseCvarTupleVariations,
	writeCvarTable,
} from '../sfnt/tuple_variation_common.js';

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a cvar table from raw bytes.
 *
 * @param {number[]} rawBytes
 * @param {object} [tables] - Parsed tables map (for fvar axis count, cvt count)
 * @returns {object}
 */
export function parseCvar(rawBytes, tables = {}) {
	const axisCount = tables.fvar?.axes?.length ?? 0;
	const cvtCount = tables['cvt ']?.values?.length ?? 0;
	return parseCvarTupleVariations(rawBytes, axisCount, cvtCount);
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a cvar JSON object back to raw bytes.
 *
 * @param {object} cvar - Parsed cvar table data
 * @returns {number[]} Array of byte values
 */
export function writeCvar(cvar) {
	const axisCount = cvar.tupleVariations?.[0]?.peakTuple?.length ?? 0;
	return writeCvarTable(cvar, axisCount);
}
