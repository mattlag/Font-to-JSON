/**
 * Font Flux JS : Tuple Variation Common
 * Shared parser/writer for the TupleVariation binary format used by
 * gvar (per-glyph variation data) and cvar (CVT variations).
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/otvarcommonformats#tuple-variation-store
 *
 * Handles:
 *  - TupleVariationHeader arrays
 *  - Packed point numbers (run-length encoded uint8/uint16)
 *  - Packed deltas (run-length encoded int8/int16/zero)
 *  - Shared vs private point number resolution
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

// --- TupleVariation flags ---------------------------------------------------
const SHARED_POINT_NUMBERS = 0x8000;
const COUNT_MASK = 0x0fff;
const EMBEDDED_PEAK_TUPLE = 0x8000;
const INTERMEDIATE_REGION = 0x4000;
const PRIVATE_POINT_NUMBERS = 0x2000;
const TUPLE_INDEX_MASK = 0x0fff;

// --- Packed point number flags ----------------------------------------------
const POINTS_ARE_WORDS = 0x80;
const POINT_RUN_COUNT_MASK = 0x7f;

// --- Packed delta flags -----------------------------------------------------
const DELTAS_ARE_ZERO = 0x80;
const DELTAS_ARE_WORDS = 0x40;
const DELTA_RUN_COUNT_MASK = 0x3f;

// ===========================================================================
//  PACKED POINT NUMBERS
// ===========================================================================

/**
 * Parse packed point numbers from the reader's current position.
 * Returns null for "all points" (count byte = 0), or an array of point indices.
 */
export function parsePackedPointNumbers(reader) {
	const firstByte = reader.uint8();
	let count;
	if (firstByte === 0) {
		return null; // all points
	} else if ((firstByte & 0x80) === 0) {
		count = firstByte;
	} else {
		const secondByte = reader.uint8();
		count = ((firstByte & 0x7f) << 8) | secondByte;
	}

	const points = [];
	let pointIndex = 0;

	while (points.length < count) {
		const control = reader.uint8();
		const runCount = (control & POINT_RUN_COUNT_MASK) + 1;
		const areWords = (control & POINTS_ARE_WORDS) !== 0;

		for (let i = 0; i < runCount && points.length < count; i++) {
			const delta = areWords ? reader.uint16() : reader.uint8();
			pointIndex += delta;
			points.push(pointIndex);
		}
	}

	return points;
}

/**
 * Write packed point numbers. Pass null for "all points".
 * Returns an array of bytes.
 */
export function writePackedPointNumbers(pointIndices) {
	if (pointIndices === null) {
		return [0]; // all points
	}

	const count = pointIndices.length;
	const bytes = [];

	// Write count
	if (count < 128) {
		bytes.push(count);
	} else {
		bytes.push(0x80 | (count >> 8));
		bytes.push(count & 0xff);
	}

	// Compute deltas (values are cumulative differences)
	const deltas = [];
	let prev = 0;
	for (const pt of pointIndices) {
		deltas.push(pt - prev);
		prev = pt;
	}

	// Encode as runs
	let i = 0;
	while (i < deltas.length) {
		// Determine if this run uses words (uint16) or bytes (uint8)
		const useWords = deltas[i] > 255;

		// Find run length (max 128 entries per run)
		let runLength = 1;
		const maxRun = Math.min(128, deltas.length - i);
		while (runLength < maxRun) {
			const needsWords = deltas[i + runLength] > 255;
			if (needsWords !== useWords) break;
			runLength++;
		}

		// Control byte
		const control = (useWords ? POINTS_ARE_WORDS : 0) | (runLength - 1);
		bytes.push(control);

		for (let j = 0; j < runLength; j++) {
			const val = deltas[i + j];
			if (useWords) {
				bytes.push((val >> 8) & 0xff, val & 0xff);
			} else {
				bytes.push(val & 0xff);
			}
		}

		i += runLength;
	}

	return bytes;
}

// ===========================================================================
//  PACKED DELTAS
// ===========================================================================

/**
 * Parse packed deltas from the reader's current position.
 * Reads exactly `count` delta values.
 */
export function parsePackedDeltas(reader, count) {
	const deltas = [];

	while (deltas.length < count) {
		const control = reader.uint8();
		const runCount = (control & DELTA_RUN_COUNT_MASK) + 1;

		if (control & DELTAS_ARE_ZERO) {
			for (let i = 0; i < runCount && deltas.length < count; i++) {
				deltas.push(0);
			}
		} else if (control & DELTAS_ARE_WORDS) {
			for (let i = 0; i < runCount && deltas.length < count; i++) {
				deltas.push(reader.int16());
			}
		} else {
			for (let i = 0; i < runCount && deltas.length < count; i++) {
				deltas.push(reader.int8());
			}
		}
	}

	return deltas;
}

/**
 * Write packed deltas. Returns an array of bytes.
 */
export function writePackedDeltas(deltas) {
	const bytes = [];
	let i = 0;

	while (i < deltas.length) {
		// Determine run type: zero, word (int16), or byte (int8)
		if (deltas[i] === 0) {
			// Zero run
			let runLength = 1;
			const maxRun = Math.min(64, deltas.length - i);
			while (runLength < maxRun && deltas[i + runLength] === 0) {
				runLength++;
			}
			bytes.push(DELTAS_ARE_ZERO | (runLength - 1));
			i += runLength;
		} else if (deltas[i] < -128 || deltas[i] > 127) {
			// Word (int16) run
			let runLength = 1;
			const maxRun = Math.min(64, deltas.length - i);
			while (runLength < maxRun) {
				const val = deltas[i + runLength];
				if (val === 0 || (val >= -128 && val <= 127)) break;
				runLength++;
			}
			bytes.push(DELTAS_ARE_WORDS | (runLength - 1));
			for (let j = 0; j < runLength; j++) {
				const val = deltas[i + j] & 0xffff;
				bytes.push((val >> 8) & 0xff, val & 0xff);
			}
			i += runLength;
		} else {
			// Byte (int8) run
			let runLength = 1;
			const maxRun = Math.min(64, deltas.length - i);
			while (runLength < maxRun) {
				const val = deltas[i + runLength];
				if (val === 0 || val < -128 || val > 127) break;
				runLength++;
			}
			bytes.push(runLength - 1);
			for (let j = 0; j < runLength; j++) {
				bytes.push(deltas[i + j] & 0xff);
			}
			i += runLength;
		}
	}

	return bytes;
}

// ===========================================================================
//  GLYPH VARIATION DATA  (gvar per-glyph)
// ===========================================================================

/**
 * Parse a GlyphVariationData table (one glyph's variation data from gvar).
 *
 * @param {number[]} rawBytes - raw bytes of this glyph's variation data
 * @param {number} axisCount
 * @param {number[][]} sharedTuples - shared tuple records from gvar parent
 * @param {number} numPoints - total points for this glyph (contour points + 4 phantoms)
 * @returns {object[]} array of tuple variation objects
 */
export function parseGlyphVariationData(
	rawBytes,
	axisCount,
	sharedTuples,
	numPoints,
) {
	if (!rawBytes || rawBytes.length === 0) return [];

	const reader = new DataReader(rawBytes);
	const tupleVariationCountPacked = reader.uint16();
	const dataOffset = reader.offset16();
	const count = tupleVariationCountPacked & COUNT_MASK;
	const hasSharedPoints =
		(tupleVariationCountPacked & SHARED_POINT_NUMBERS) !== 0;

	if (count === 0) return [];

	// Parse TupleVariationHeaders
	const headers = [];
	for (let i = 0; i < count; i++) {
		const variationDataSize = reader.uint16();
		const tupleIndex = reader.uint16();

		let peakTuple;
		if (tupleIndex & EMBEDDED_PEAK_TUPLE) {
			peakTuple = reader.array('f2dot14', axisCount);
		} else {
			const sharedIdx = tupleIndex & TUPLE_INDEX_MASK;
			peakTuple = sharedTuples[sharedIdx] ?? new Array(axisCount).fill(0);
		}

		let intermediateStartTuple = null;
		let intermediateEndTuple = null;
		if (tupleIndex & INTERMEDIATE_REGION) {
			intermediateStartTuple = reader.array('f2dot14', axisCount);
			intermediateEndTuple = reader.array('f2dot14', axisCount);
		}

		headers.push({
			variationDataSize,
			tupleIndex,
			peakTuple,
			intermediateStartTuple,
			intermediateEndTuple,
			hasPrivatePoints: (tupleIndex & PRIVATE_POINT_NUMBERS) !== 0,
		});
	}

	// Parse serialized data
	reader.seek(dataOffset);

	let sharedPointIndices = null;
	if (hasSharedPoints) {
		sharedPointIndices = parsePackedPointNumbers(reader);
	}

	const tupleVariations = [];
	for (const header of headers) {
		const tupleDataStart = reader.position;
		const tupleDataEnd = tupleDataStart + header.variationDataSize;

		let pointIndices;
		if (header.hasPrivatePoints) {
			pointIndices = parsePackedPointNumbers(reader);
		} else {
			pointIndices = sharedPointIndices;
		}

		const pointCount = pointIndices === null ? numPoints : pointIndices.length;
		const totalDeltaCount = pointCount * 2; // X + Y for gvar
		const deltas = parsePackedDeltas(reader, totalDeltaCount);

		tupleVariations.push({
			peakTuple: header.peakTuple,
			intermediateStartTuple: header.intermediateStartTuple,
			intermediateEndTuple: header.intermediateEndTuple,
			pointIndices,
			xDeltas: deltas.slice(0, pointCount),
			yDeltas: deltas.slice(pointCount),
		});

		reader.seek(tupleDataEnd);
	}

	return tupleVariations;
}

/**
 * Write a glyph's tuple variations to GlyphVariationData bytes.
 *
 * @param {object[]} tupleVariations - array of tuple variation objects
 * @param {number} axisCount
 * @returns {number[]} raw bytes
 */
export function writeGlyphVariationData(tupleVariations, axisCount) {
	if (!tupleVariations || tupleVariations.length === 0) return [];

	const count = tupleVariations.length;

	// Determine shared vs private point numbers
	const allPointsSame = tupleVariations.every(
		(tv) =>
			JSON.stringify(tv.pointIndices) ===
			JSON.stringify(tupleVariations[0].pointIndices),
	);
	const useSharedPoints = allPointsSame && count > 1;

	// Build serialized data (shared points + per-tuple data)
	const serializedParts = [];
	let sharedPointBytes = [];
	if (useSharedPoints) {
		sharedPointBytes = writePackedPointNumbers(tupleVariations[0].pointIndices);
		serializedParts.push(sharedPointBytes);
	}

	const perTupleSizes = [];
	for (const tv of tupleVariations) {
		const partBytes = [];

		// Private point numbers (if not shared)
		if (!useSharedPoints) {
			partBytes.push(...writePackedPointNumbers(tv.pointIndices));
		}

		// Packed deltas: X then Y
		const allDeltas = [...(tv.xDeltas ?? []), ...(tv.yDeltas ?? [])];
		partBytes.push(...writePackedDeltas(allDeltas));

		perTupleSizes.push(partBytes.length);
		serializedParts.push(partBytes);
	}

	// Flatten serialized data
	const serializedData = [];
	for (const part of serializedParts) {
		serializedData.push(...part);
	}

	// Build tuple variation headers
	const headerParts = [];
	for (let i = 0; i < count; i++) {
		const tv = tupleVariations[i];
		let tupleIndex = EMBEDDED_PEAK_TUPLE;
		if (!useSharedPoints) {
			tupleIndex |= PRIVATE_POINT_NUMBERS;
		}
		if (tv.intermediateStartTuple) {
			tupleIndex |= INTERMEDIATE_REGION;
		}

		const headerBytes = [];
		// variationDataSize (uint16)
		headerBytes.push((perTupleSizes[i] >> 8) & 0xff);
		headerBytes.push(perTupleSizes[i] & 0xff);
		// tupleIndex (uint16)
		headerBytes.push((tupleIndex >> 8) & 0xff);
		headerBytes.push(tupleIndex & 0xff);

		// Embedded peak tuple
		for (let a = 0; a < axisCount; a++) {
			const val = Math.round((tv.peakTuple[a] ?? 0) * 16384) & 0xffff;
			headerBytes.push((val >> 8) & 0xff, val & 0xff);
		}

		// Intermediate tuples
		if (tv.intermediateStartTuple) {
			for (let a = 0; a < axisCount; a++) {
				const val =
					Math.round((tv.intermediateStartTuple[a] ?? 0) * 16384) & 0xffff;
				headerBytes.push((val >> 8) & 0xff, val & 0xff);
			}
			for (let a = 0; a < axisCount; a++) {
				const val =
					Math.round((tv.intermediateEndTuple[a] ?? 0) * 16384) & 0xffff;
				headerBytes.push((val >> 8) & 0xff, val & 0xff);
			}
		}

		headerParts.push(headerBytes);
	}

	const headersFlat = [];
	for (const part of headerParts) {
		headersFlat.push(...part);
	}

	// Build the GlyphVariationData table
	// Header: tupleVariationCount (2) + dataOffset (2)
	const tupleVariationCountPacked =
		(useSharedPoints ? SHARED_POINT_NUMBERS : 0) | (count & COUNT_MASK);
	const dataOffset = 4 + headersFlat.length;

	const result = [];
	result.push((tupleVariationCountPacked >> 8) & 0xff);
	result.push(tupleVariationCountPacked & 0xff);
	result.push((dataOffset >> 8) & 0xff);
	result.push(dataOffset & 0xff);
	result.push(...headersFlat);
	result.push(...serializedData);

	return result;
}

// ===========================================================================
//  CVAR TUPLE VARIATIONS
// ===========================================================================

/**
 * Parse the full cvar table into structured tuple variations.
 *
 * @param {number[]} rawBytes - entire cvar table bytes
 * @param {number} axisCount - from fvar
 * @param {number} cvtCount - number of CVT entries
 * @returns {object} parsed cvar structure
 */
export function parseCvarTupleVariations(rawBytes, axisCount, cvtCount) {
	if (!rawBytes || rawBytes.length < 8) {
		return { majorVersion: 1, minorVersion: 0, tupleVariations: [] };
	}

	const reader = new DataReader(rawBytes);
	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const tupleVariationCountPacked = reader.uint16();
	const dataOffset = reader.offset16();
	const count = tupleVariationCountPacked & COUNT_MASK;
	const hasSharedPoints =
		(tupleVariationCountPacked & SHARED_POINT_NUMBERS) !== 0;

	if (count === 0) {
		return { majorVersion, minorVersion, tupleVariations: [] };
	}

	// Parse TupleVariationHeaders (cvar always uses EMBEDDED_PEAK_TUPLE)
	const headers = [];
	for (let i = 0; i < count; i++) {
		const variationDataSize = reader.uint16();
		const tupleIndex = reader.uint16();

		let peakTuple = null;
		if (tupleIndex & EMBEDDED_PEAK_TUPLE) {
			peakTuple = reader.array('f2dot14', axisCount);
		}

		let intermediateStartTuple = null;
		let intermediateEndTuple = null;
		if (tupleIndex & INTERMEDIATE_REGION) {
			intermediateStartTuple = reader.array('f2dot14', axisCount);
			intermediateEndTuple = reader.array('f2dot14', axisCount);
		}

		headers.push({
			variationDataSize,
			tupleIndex,
			peakTuple,
			intermediateStartTuple,
			intermediateEndTuple,
			hasPrivatePoints: (tupleIndex & PRIVATE_POINT_NUMBERS) !== 0,
		});
	}

	// Parse serialized data
	reader.seek(dataOffset);

	let sharedPointIndices = null;
	if (hasSharedPoints) {
		sharedPointIndices = parsePackedPointNumbers(reader);
	}

	const tupleVariations = [];
	for (const header of headers) {
		const tupleDataStart = reader.position;
		const tupleDataEnd = tupleDataStart + header.variationDataSize;

		let pointIndices;
		if (header.hasPrivatePoints) {
			pointIndices = parsePackedPointNumbers(reader);
		} else {
			pointIndices = sharedPointIndices;
		}

		const pointCount = pointIndices === null ? cvtCount : pointIndices.length;
		const deltas = parsePackedDeltas(reader, pointCount);

		tupleVariations.push({
			peakTuple: header.peakTuple,
			intermediateStartTuple: header.intermediateStartTuple,
			intermediateEndTuple: header.intermediateEndTuple,
			pointIndices,
			deltas,
		});

		reader.seek(tupleDataEnd);
	}

	return { majorVersion, minorVersion, tupleVariations };
}

/**
 * Write a cvar structure back to raw bytes.
 *
 * @param {object} cvar - parsed cvar with tupleVariations
 * @param {number} axisCount
 * @returns {number[]} raw bytes
 */
export function writeCvarTable(cvar, axisCount) {
	const majorVersion = cvar.majorVersion ?? 1;
	const minorVersion = cvar.minorVersion ?? 0;
	const tupleVariations = cvar.tupleVariations ?? [];
	const count = tupleVariations.length;

	if (count === 0) {
		const w = new DataWriter(8);
		w.uint16(majorVersion);
		w.uint16(minorVersion);
		w.uint16(0); // tupleVariationCount
		w.offset16(8); // dataOffset (points to end)
		return w.toArray();
	}

	// Determine shared vs private point numbers
	const allPointsSame = tupleVariations.every(
		(tv) =>
			JSON.stringify(tv.pointIndices) ===
			JSON.stringify(tupleVariations[0].pointIndices),
	);
	const useSharedPoints = allPointsSame && count > 1;

	// Build serialized data
	const serializedParts = [];
	if (useSharedPoints) {
		serializedParts.push(
			writePackedPointNumbers(tupleVariations[0].pointIndices),
		);
	}

	const perTupleSizes = [];
	for (const tv of tupleVariations) {
		const partBytes = [];
		if (!useSharedPoints) {
			partBytes.push(...writePackedPointNumbers(tv.pointIndices));
		}
		partBytes.push(...writePackedDeltas(tv.deltas ?? []));
		perTupleSizes.push(partBytes.length);
		serializedParts.push(partBytes);
	}

	const serializedData = [];
	for (const part of serializedParts) {
		serializedData.push(...part);
	}

	// Build tuple variation headers
	const headersFlat = [];
	for (let i = 0; i < count; i++) {
		const tv = tupleVariations[i];
		let tupleIndex = EMBEDDED_PEAK_TUPLE;
		if (!useSharedPoints) {
			tupleIndex |= PRIVATE_POINT_NUMBERS;
		}
		if (tv.intermediateStartTuple) {
			tupleIndex |= INTERMEDIATE_REGION;
		}

		// variationDataSize
		headersFlat.push((perTupleSizes[i] >> 8) & 0xff);
		headersFlat.push(perTupleSizes[i] & 0xff);
		// tupleIndex
		headersFlat.push((tupleIndex >> 8) & 0xff);
		headersFlat.push(tupleIndex & 0xff);

		// peakTuple (always embedded for cvar)
		for (let a = 0; a < axisCount; a++) {
			const val = Math.round((tv.peakTuple[a] ?? 0) * 16384) & 0xffff;
			headersFlat.push((val >> 8) & 0xff, val & 0xff);
		}

		if (tv.intermediateStartTuple) {
			for (let a = 0; a < axisCount; a++) {
				const val =
					Math.round((tv.intermediateStartTuple[a] ?? 0) * 16384) & 0xffff;
				headersFlat.push((val >> 8) & 0xff, val & 0xff);
			}
			for (let a = 0; a < axisCount; a++) {
				const val =
					Math.round((tv.intermediateEndTuple[a] ?? 0) * 16384) & 0xffff;
				headersFlat.push((val >> 8) & 0xff, val & 0xff);
			}
		}
	}

	// Assemble the table
	const tupleVariationCountPacked =
		(useSharedPoints ? SHARED_POINT_NUMBERS : 0) | (count & COUNT_MASK);
	const dataOffset = 8 + headersFlat.length; // 8 = cvar header size
	const totalSize = dataOffset + serializedData.length;

	const w = new DataWriter(totalSize);
	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint16(tupleVariationCountPacked);
	w.offset16(dataOffset);
	w.rawBytes(headersFlat);
	w.rawBytes(serializedData);

	return w.toArray();
}
