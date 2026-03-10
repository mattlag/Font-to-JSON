/**
 * Font Flux JS : kern table
 * Kerning Table (legacy)
 *
 * Supports OpenType 'kern' version 0 and Apple 'kern' version 1.0.
 * OpenType format 0 subtables are parsed structurally; unknown formats are
 * preserved as raw bytes.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const OT_HEADER_SIZE = 4;
const OT_SUBTABLE_HEADER_SIZE = 6;
const APPLE_HEADER_SIZE = 8;
const APPLE_SUBTABLE_HEADER_SIZE = 8;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a kern table from raw bytes.
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseKern(rawBytes) {
	const reader = new DataReader(rawBytes);
	const maybeAppleVersion = rawBytes.length >= 4 ? reader.uint32() : 0;

	if (maybeAppleVersion === 0x00010000) {
		return parseAppleKern(rawBytes);
	}

	return parseOpenTypeKern(rawBytes);
}

function parseOpenTypeKern(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint16();
	const nTables = reader.uint16();

	const subtables = [];
	let pos = OT_HEADER_SIZE;

	for (let i = 0; i < nTables; i++) {
		if (pos + OT_SUBTABLE_HEADER_SIZE > rawBytes.length) {
			break;
		}

		reader.seek(pos);
		const subVersion = reader.uint16();
		const length = reader.uint16();
		const coverage = reader.uint16();
		const format = (coverage >> 8) & 0xff;

		const end = Math.min(
			rawBytes.length,
			pos + Math.max(length, OT_SUBTABLE_HEADER_SIZE),
		);
		const bodyStart = pos + OT_SUBTABLE_HEADER_SIZE;
		const bodyRaw = Array.from(rawBytes.slice(bodyStart, end));

		const subtable = {
			version: subVersion,
			coverage,
			format,
		};

		if (format === 0) {
			Object.assign(subtable, parseOpenTypeKernFormat0(bodyRaw));
		} else {
			subtable._raw = bodyRaw;
		}

		subtables.push(subtable);
		pos = end;
	}

	return {
		formatVariant: 'opentype',
		version,
		nTables,
		subtables,
	};
}

function parseOpenTypeKernFormat0(bodyRaw) {
	const reader = new DataReader(bodyRaw);
	if (bodyRaw.length < 8) {
		return {
			nPairs: 0,
			searchRange: 0,
			entrySelector: 0,
			rangeShift: 0,
			pairs: [],
		};
	}

	const nPairs = reader.uint16();
	reader.uint16();
	reader.uint16();
	reader.uint16();
	const pairs = [];

	for (let i = 0; i < nPairs; i++) {
		if (reader.position + 6 > bodyRaw.length) {
			break;
		}
		pairs.push({
			left: reader.uint16(),
			right: reader.uint16(),
			value: reader.int16(),
		});
	}

	const normalizedNPairs = pairs.length;
	const normalizedEntrySelector = Math.floor(
		Math.log2(Math.max(1, normalizedNPairs)),
	);
	const normalizedSearchRange = Math.pow(2, normalizedEntrySelector) * 6;
	const normalizedRangeShift = normalizedNPairs * 6 - normalizedSearchRange;

	return {
		nPairs: normalizedNPairs,
		searchRange: normalizedSearchRange,
		entrySelector: normalizedEntrySelector,
		rangeShift: normalizedRangeShift,
		pairs,
	};
}

function parseAppleKern(rawBytes) {
	const reader = new DataReader(rawBytes);
	const version = reader.uint32();
	const nTables = reader.uint32();

	const subtables = [];
	let pos = APPLE_HEADER_SIZE;

	for (let i = 0; i < nTables; i++) {
		if (pos + APPLE_SUBTABLE_HEADER_SIZE > rawBytes.length) {
			break;
		}

		reader.seek(pos);
		const length = reader.uint32();
		const coverage = reader.uint8();
		const format = reader.uint8();
		const tupleIndex = reader.uint16();

		const end = Math.min(
			rawBytes.length,
			pos + Math.max(length, APPLE_SUBTABLE_HEADER_SIZE),
		);
		const bodyRaw = Array.from(
			rawBytes.slice(pos + APPLE_SUBTABLE_HEADER_SIZE, end),
		);

		subtables.push({
			coverage,
			format,
			tupleIndex,
			_raw: bodyRaw,
		});

		pos = end;
	}

	return {
		formatVariant: 'apple',
		version,
		nTables,
		subtables,
	};
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a kern JSON object back to raw bytes.
 *
 * @param {object} kern - Parsed kern table data
 * @returns {number[]} Array of byte values
 */
export function writeKern(kern) {
	if (kern.formatVariant === 'apple') {
		return writeAppleKern(kern);
	}
	return writeOpenTypeKern(kern);
}

function writeOpenTypeKern(kern) {
	const version = kern.version ?? 0;
	const subtables = kern.subtables ?? [];
	const subtableBytes = subtables.map((subtable) =>
		writeOpenTypeSubtable(subtable),
	);
	const nTables = subtables.length;
	const totalSize =
		OT_HEADER_SIZE +
		subtableBytes.reduce((sum, bytes) => sum + bytes.length, 0);
	const w = new DataWriter(totalSize);

	w.uint16(version);
	w.uint16(nTables);
	for (const bytes of subtableBytes) {
		w.rawBytes(bytes);
	}
	return w.toArray();
}

function writeOpenTypeSubtable(subtable) {
	const body = subtable._raw
		? subtable._raw
		: subtable.format === 0
			? writeOpenTypeKernFormat0Body(subtable)
			: [];
	const length = OT_SUBTABLE_HEADER_SIZE + body.length;
	const coverage = subtable.coverage ?? (subtable.format ?? 0) << 8;
	const w = new DataWriter(length);
	w.uint16(subtable.version ?? 0);
	w.uint16(length);
	w.uint16(coverage);
	w.rawBytes(body);
	return w.toArray();
}

function writeOpenTypeKernFormat0Body(subtable) {
	const pairs = subtable.pairs ?? [];
	const nPairs = pairs.length;
	const entrySelector = Math.floor(Math.log2(Math.max(1, nPairs)));
	const searchRange = Math.pow(2, entrySelector) * 6;
	const rangeShift = nPairs * 6 - searchRange;
	const w = new DataWriter(8 + nPairs * 6);
	w.uint16(nPairs);
	w.uint16(subtable.searchRange ?? searchRange);
	w.uint16(subtable.entrySelector ?? entrySelector);
	w.uint16(subtable.rangeShift ?? rangeShift);
	for (const pair of pairs) {
		w.uint16(pair.left);
		w.uint16(pair.right);
		w.int16(pair.value);
	}
	return w.toArray();
}

function writeAppleKern(kern) {
	const version = kern.version ?? 0x00010000;
	const subtables = kern.subtables ?? [];
	const subtableBytes = subtables.map((subtable) => {
		const body = subtable._raw ?? [];
		const length = APPLE_SUBTABLE_HEADER_SIZE + body.length;
		const w = new DataWriter(length);
		w.uint32(length);
		w.uint8(subtable.coverage ?? 0);
		w.uint8(subtable.format ?? 0);
		w.uint16(subtable.tupleIndex ?? 0);
		w.rawBytes(body);
		return w.toArray();
	});

	const nTables = subtables.length;
	const totalSize =
		APPLE_HEADER_SIZE +
		subtableBytes.reduce((sum, bytes) => sum + bytes.length, 0);
	const w = new DataWriter(totalSize);
	w.uint32(version);
	w.uint32(nTables);
	for (const bytes of subtableBytes) {
		w.rawBytes(bytes);
	}
	return w.toArray();
}
