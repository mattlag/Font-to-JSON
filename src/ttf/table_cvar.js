/**
 * Font Flux JS : cvar table
 * CVT Variations Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/cvar
 *
 * This implementation parses/writes the cvar tuple-variation-store container
 * fields and preserves tuple-header and serialized variation bytes.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const CVAR_HEADER_SIZE = 8;
const SHARED_POINT_NUMBERS_FLAG = 0x8000;
const COUNT_MASK = 0x0fff;
const EMBEDDED_PEAK_TUPLE_FLAG = 0x8000;
const INTERMEDIATE_REGION_FLAG = 0x4000;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a cvar table from raw bytes.
 *
 * @param {number[]} rawBytes
 * @param {object} [tables] - Parsed tables map (for fvar axis count)
 * @returns {object}
 */
export function parseCvar(rawBytes, tables = {}) {
	const reader = new DataReader(rawBytes);

	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const tupleVariationCountPacked = reader.uint16();
	const dataOffset = reader.offset16();

	const tupleVariationCount = tupleVariationCountPacked & COUNT_MASK;
	const tupleVariationFlags = tupleVariationCountPacked & ~COUNT_MASK;
	const axisCount = tables.fvar?.axes?.length ?? 0;

	const tupleVariationHeadersRaw =
		dataOffset >= CVAR_HEADER_SIZE && dataOffset <= rawBytes.length
			? Array.from(rawBytes.slice(CVAR_HEADER_SIZE, dataOffset))
			: [];
	const serializedData =
		dataOffset <= rawBytes.length ? Array.from(rawBytes.slice(dataOffset)) : [];

	const tupleVariationHeaders = parseTupleVariationHeaders(
		rawBytes,
		axisCount,
		tupleVariationCount,
	);

	return {
		majorVersion,
		minorVersion,
		tupleVariationCountPacked,
		tupleVariationCount,
		tupleVariationFlags,
		dataOffset,
		tupleVariationHeaders,
		tupleVariationHeadersRaw,
		serializedData,
		usesSharedPointNumbers:
			(tupleVariationCountPacked & SHARED_POINT_NUMBERS_FLAG) !== 0,
	};
}

function parseTupleVariationHeaders(rawBytes, axisCount, tupleVariationCount) {
	const headers = [];
	if (tupleVariationCount === 0) {
		return headers;
	}

	const reader = new DataReader(rawBytes);
	let pos = CVAR_HEADER_SIZE;

	for (let i = 0; i < tupleVariationCount; i++) {
		if (pos + 4 > rawBytes.length) {
			break;
		}

		reader.seek(pos);
		const variationDataSize = reader.uint16();
		const tupleIndex = reader.uint16();
		const start = pos;

		const header = {
			variationDataSize,
			tupleIndex,
			flags: tupleIndex & 0xf000,
		};

		if (tupleIndex & EMBEDDED_PEAK_TUPLE_FLAG) {
			header.peakTuple = [];
			for (let a = 0; a < axisCount; a++) {
				header.peakTuple.push(reader.f2dot14());
			}
		}

		if (tupleIndex & INTERMEDIATE_REGION_FLAG) {
			header.intermediateStartTuple = [];
			header.intermediateEndTuple = [];
			for (let a = 0; a < axisCount; a++) {
				header.intermediateStartTuple.push(reader.f2dot14());
			}
			for (let a = 0; a < axisCount; a++) {
				header.intermediateEndTuple.push(reader.f2dot14());
			}
		}

		pos = reader.position;
		header._raw = Array.from(rawBytes.slice(start, pos));
		headers.push(header);
	}

	return headers;
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
	const majorVersion = cvar.majorVersion ?? 1;
	const minorVersion = cvar.minorVersion ?? 0;

	const tupleVariationHeadersRaw =
		cvar.tupleVariationHeadersRaw ??
		buildTupleVariationHeadersRaw(cvar.tupleVariationHeaders ?? []);
	const serializedData = cvar.serializedData ?? [];

	const tupleVariationCountPacked =
		cvar.tupleVariationCountPacked ??
		(cvar.tupleVariationFlags ?? 0) |
			((cvar.tupleVariationCount ?? cvar.tupleVariationHeaders?.length ?? 0) &
				COUNT_MASK);

	const dataOffset = CVAR_HEADER_SIZE + tupleVariationHeadersRaw.length;
	const totalSize = dataOffset + serializedData.length;

	const w = new DataWriter(totalSize);
	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint16(tupleVariationCountPacked);
	w.offset16(dataOffset);
	w.rawBytes(tupleVariationHeadersRaw);
	w.rawBytes(serializedData);
	return w.toArray();
}

function buildTupleVariationHeadersRaw(tupleVariationHeaders) {
	const bytes = [];
	for (const header of tupleVariationHeaders) {
		if (header._raw) {
			bytes.push(...header._raw);
			continue;
		}

		const axisCount = header.peakTuple?.length ?? 0;
		const hasPeak = (header.tupleIndex & EMBEDDED_PEAK_TUPLE_FLAG) !== 0;
		const hasIntermediate =
			(header.tupleIndex & INTERMEDIATE_REGION_FLAG) !== 0;

		const size =
			4 + (hasPeak ? axisCount * 2 : 0) + (hasIntermediate ? axisCount * 4 : 0);
		const w = new DataWriter(size);
		w.uint16(header.variationDataSize ?? 0);
		w.uint16(header.tupleIndex ?? EMBEDDED_PEAK_TUPLE_FLAG);

		if (hasPeak) {
			for (let i = 0; i < axisCount; i++) {
				w.f2dot14(header.peakTuple[i] ?? 0);
			}
		}

		if (hasIntermediate) {
			for (let i = 0; i < axisCount; i++) {
				w.f2dot14(header.intermediateStartTuple?.[i] ?? 0);
			}
			for (let i = 0; i < axisCount; i++) {
				w.f2dot14(header.intermediateEndTuple?.[i] ?? 0);
			}
		}

		bytes.push(...w.toArray());
	}
	return bytes;
}
