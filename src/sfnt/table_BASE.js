/**
 * Font Flux JS : BASE table
 * Baseline Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/base
 *
 * This implementation parses/writes BASE container-level fields.
 * horizAxis and vertAxis subtables are preserved as raw bytes.
 * ItemVariationStore (v1.1) is fully parsed.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';
import {
	parseItemVariationStore,
	writeItemVariationStore,
} from './item_variation_store.js';

const BASE_HEADER_V10_SIZE = 8;
const BASE_HEADER_V11_SIZE = 12;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse a BASE table from raw bytes.
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseBASE(rawBytes) {
	const reader = new DataReader(rawBytes);
	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const horizAxisOffset = reader.offset16();
	const vertAxisOffset = reader.offset16();
	const itemVarStoreOffset =
		majorVersion > 1 || (majorVersion === 1 && minorVersion >= 1)
			? reader.offset32()
			: 0;

	const offsets = [horizAxisOffset, vertAxisOffset, itemVarStoreOffset].filter(
		(o) => o > 0,
	);

	return {
		majorVersion,
		minorVersion,
		horizAxis: extractSubtable(rawBytes, horizAxisOffset, offsets),
		vertAxis: extractSubtable(rawBytes, vertAxisOffset, offsets),
		itemVariationStore: itemVarStoreOffset
			? parseItemVariationStore(
					rawBytes.slice(
						itemVarStoreOffset,
						findSubtableEnd(rawBytes.length, itemVarStoreOffset, offsets),
					),
				)
			: null,
	};
}

function findSubtableEnd(totalLength, startOffset, allOffsets) {
	const next = allOffsets
		.filter((o) => o > startOffset)
		.sort((a, b) => a - b)[0];
	return next ?? totalLength;
}

function extractSubtable(rawBytes, offset, allOffsets) {
	if (!offset) {
		return null;
	}
	const next = allOffsets.filter((o) => o > offset).sort((a, b) => a - b)[0];
	const end = next ?? rawBytes.length;
	if (end <= offset || offset >= rawBytes.length) {
		return { _raw: [] };
	}
	return { _raw: Array.from(rawBytes.slice(offset, end)) };
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a BASE JSON object back to raw bytes.
 *
 * @param {object} base - Parsed BASE table data
 * @returns {number[]} Array of byte values
 */
export function writeBASE(base) {
	const majorVersion = base.majorVersion ?? 1;
	const minorVersion = base.minorVersion ?? 0;
	const includeItemVariationStore =
		majorVersion > 1 || (majorVersion === 1 && minorVersion >= 1);

	const horizBytes = extractRaw(base.horizAxis);
	const vertBytes = extractRaw(base.vertAxis);
	const itemVarStoreBytes =
		includeItemVariationStore && base.itemVariationStore
			? writeItemVariationStore(base.itemVariationStore)
			: [];

	const headerSize = includeItemVariationStore
		? BASE_HEADER_V11_SIZE
		: BASE_HEADER_V10_SIZE;
	let currentOffset = headerSize;

	const horizAxisOffset = horizBytes.length ? currentOffset : 0;
	currentOffset += horizBytes.length;

	const vertAxisOffset = vertBytes.length ? currentOffset : 0;
	currentOffset += vertBytes.length;

	const itemVarStoreOffset = itemVarStoreBytes.length ? currentOffset : 0;
	currentOffset += itemVarStoreBytes.length;

	const w = new DataWriter(currentOffset);
	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.offset16(horizAxisOffset);
	w.offset16(vertAxisOffset);
	if (includeItemVariationStore) {
		w.offset32(itemVarStoreOffset);
	}
	w.rawBytes(horizBytes);
	w.rawBytes(vertBytes);
	w.rawBytes(itemVarStoreBytes);
	return w.toArray();
}

function extractRaw(value) {
	if (!value) {
		return [];
	}
	if (Array.isArray(value)) {
		return value;
	}
	return value._raw ?? [];
}
