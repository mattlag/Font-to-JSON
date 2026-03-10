/**
 * Font Flux JS : avar table
 * Axis Variations Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/avar
 *
 * Maps normalized axis coordinates to adjusted coordinates.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const AVAR_HEADER_SIZE = 8;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse an avar table from raw bytes.
 *
 * Header:
 *   uint16 majorVersion
 *   uint16 minorVersion
 *   uint16 reserved
 *   uint16 axisCount
 *
 * Segment map per axis:
 *   uint16 positionMapCount
 *   AxisValueMap[positionMapCount]
 *
 * AxisValueMap:
 *   F2DOT14 fromCoordinate
 *   F2DOT14 toCoordinate
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseAvar(rawBytes) {
	const reader = new DataReader(rawBytes);

	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const reserved = reader.uint16();
	const axisCount = reader.uint16();

	const segmentMaps = [];
	for (let i = 0; i < axisCount; i++) {
		const positionMapCount = reader.uint16();
		const axisValueMaps = [];
		for (let j = 0; j < positionMapCount; j++) {
			axisValueMaps.push({
				fromCoordinate: reader.f2dot14(),
				toCoordinate: reader.f2dot14(),
			});
		}
		segmentMaps.push({ positionMapCount, axisValueMaps });
	}

	return {
		majorVersion,
		minorVersion,
		reserved,
		segmentMaps,
	};
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write an avar JSON object back to raw bytes.
 *
 * @param {object} avar - Parsed avar table data
 * @returns {number[]} Array of byte values
 */
export function writeAvar(avar) {
	const majorVersion = avar.majorVersion ?? 1;
	const minorVersion = avar.minorVersion ?? 0;
	const reserved = avar.reserved ?? 0;
	const segmentMaps = avar.segmentMaps ?? [];

	let totalSize = AVAR_HEADER_SIZE;
	for (const map of segmentMaps) {
		const count = map.axisValueMaps?.length ?? map.positionMapCount ?? 0;
		totalSize += 2 + count * 4;
	}

	const w = new DataWriter(totalSize);

	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint16(reserved);
	w.uint16(segmentMaps.length);

	for (const map of segmentMaps) {
		const axisValueMaps = map.axisValueMaps ?? [];
		w.uint16(axisValueMaps.length);
		for (const pair of axisValueMaps) {
			w.f2dot14(pair.fromCoordinate);
			w.f2dot14(pair.toCoordinate);
		}
	}

	return w.toArray();
}
