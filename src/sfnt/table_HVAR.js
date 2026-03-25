/**
 * Font Flux JS : HVAR table
 * Horizontal Metrics Variations Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/hvar
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';
import {
	parseItemVariationStore,
	writeItemVariationStore,
} from './item_variation_store.js';

const HVAR_HEADER_SIZE = 20;

const INNER_INDEX_BIT_COUNT_MASK = 0x0f;
const MAP_ENTRY_SIZE_MASK = 0x30;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse an HVAR table from raw bytes.
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseHVAR(rawBytes) {
	const reader = new DataReader(rawBytes);

	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const itemVariationStoreOffset = reader.offset32();
	const advanceWidthMappingOffset = reader.offset32();
	const lsbMappingOffset = reader.offset32();
	const rsbMappingOffset = reader.offset32();

	return {
		majorVersion,
		minorVersion,
		itemVariationStore: itemVariationStoreOffset
			? parseItemVariationStore(
					rawBytes.slice(
						itemVariationStoreOffset,
						findSubtableEnd(rawBytes.length, itemVariationStoreOffset, [
							advanceWidthMappingOffset,
							lsbMappingOffset,
							rsbMappingOffset,
						]),
					),
				)
			: null,
		advanceWidthMapping: parseOptionalDeltaSetIndexMap(
			rawBytes,
			advanceWidthMappingOffset,
			[itemVariationStoreOffset, lsbMappingOffset, rsbMappingOffset],
		),
		lsbMapping: parseOptionalDeltaSetIndexMap(rawBytes, lsbMappingOffset, [
			itemVariationStoreOffset,
			advanceWidthMappingOffset,
			rsbMappingOffset,
		]),
		rsbMapping: parseOptionalDeltaSetIndexMap(rawBytes, rsbMappingOffset, [
			itemVariationStoreOffset,
			advanceWidthMappingOffset,
			lsbMappingOffset,
		]),
	};
}

function parseOptionalDeltaSetIndexMap(rawBytes, offset, siblingOffsets) {
	if (!offset) {
		return null;
	}

	const end = findSubtableEnd(rawBytes.length, offset, siblingOffsets);
	if (end <= offset || offset >= rawBytes.length) {
		return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
	}

	const subRaw = Array.from(rawBytes.slice(offset, end));
	const parsed = parseDeltaSetIndexMap(subRaw);
	return {
		...parsed,
		_raw: subRaw,
	};
}

function findSubtableEnd(totalLength, startOffset, offsets) {
	const next = offsets.filter((o) => o > startOffset).sort((a, b) => a - b)[0];
	return next ?? totalLength;
}

function parseDeltaSetIndexMap(rawBytes) {
	const reader = new DataReader(rawBytes);
	const format = reader.uint8();
	const entryFormat = reader.uint8();
	const mapCount = format === 1 ? reader.uint32() : reader.uint16();
	const innerBitCount = (entryFormat & INNER_INDEX_BIT_COUNT_MASK) + 1;
	const entrySize = ((entryFormat & MAP_ENTRY_SIZE_MASK) >> 4) + 1;
	const entries = [];

	for (let i = 0; i < mapCount; i++) {
		const packed = readUIntN(reader, entrySize);
		entries.push(unpackDeltaSetIndex(packed, innerBitCount));
	}

	return {
		format,
		entryFormat,
		mapCount,
		entries,
	};
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write an HVAR JSON object back to raw bytes.
 *
 * @param {object} hvar - Parsed HVAR table data
 * @returns {number[]} Array of byte values
 */
export function writeHVAR(hvar) {
	const majorVersion = hvar.majorVersion ?? 1;
	const minorVersion = hvar.minorVersion ?? 0;

	const itemVariationStoreBytes = hvar.itemVariationStore
		? writeItemVariationStore(hvar.itemVariationStore)
		: [];
	const advanceWidthMappingBytes = encodeOptionalDeltaSetIndexMap(
		hvar.advanceWidthMapping,
	);
	const lsbMappingBytes = encodeOptionalDeltaSetIndexMap(hvar.lsbMapping);
	const rsbMappingBytes = encodeOptionalDeltaSetIndexMap(hvar.rsbMapping);

	let currentOffset = HVAR_HEADER_SIZE;
	const itemVariationStoreOffset = itemVariationStoreBytes.length
		? currentOffset
		: 0;
	currentOffset += itemVariationStoreBytes.length;

	const advanceWidthMappingOffset = advanceWidthMappingBytes.length
		? currentOffset
		: 0;
	currentOffset += advanceWidthMappingBytes.length;

	const lsbMappingOffset = lsbMappingBytes.length ? currentOffset : 0;
	currentOffset += lsbMappingBytes.length;

	const rsbMappingOffset = rsbMappingBytes.length ? currentOffset : 0;
	currentOffset += rsbMappingBytes.length;

	const w = new DataWriter(currentOffset);

	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.offset32(itemVariationStoreOffset);
	w.offset32(advanceWidthMappingOffset);
	w.offset32(lsbMappingOffset);
	w.offset32(rsbMappingOffset);

	w.rawBytes(itemVariationStoreBytes);
	w.rawBytes(advanceWidthMappingBytes);
	w.rawBytes(lsbMappingBytes);
	w.rawBytes(rsbMappingBytes);

	return w.toArray();
}

function encodeOptionalDeltaSetIndexMap(mapping) {
	if (!mapping) {
		return [];
	}

	if (mapping._raw) {
		return mapping._raw;
	}

	return writeDeltaSetIndexMap(mapping);
}

function writeDeltaSetIndexMap(mapping) {
	const entries = mapping.entries ?? [];
	const mapCount = mapping.mapCount ?? entries.length;

	const computed = computeDeltaSetIndexPacking(entries);
	const format = mapping.format ?? (mapCount > 0xffff ? 1 : 0);
	const entryFormat = mapping.entryFormat ?? computed.entryFormat;
	const innerBitCount = (entryFormat & INNER_INDEX_BIT_COUNT_MASK) + 1;
	const entrySize = ((entryFormat & MAP_ENTRY_SIZE_MASK) >> 4) + 1;
	const headerSize = format === 1 ? 6 : 4;

	const w = new DataWriter(headerSize + mapCount * entrySize);
	w.uint8(format);
	w.uint8(entryFormat);
	if (format === 1) {
		w.uint32(mapCount);
	} else {
		w.uint16(mapCount);
	}

	for (let i = 0; i < mapCount; i++) {
		const entry = entries[i] ?? { outerIndex: 0, innerIndex: 0 };
		const packed = packDeltaSetIndex(entry, innerBitCount);
		writeUIntN(w, packed, entrySize);
	}

	return w.toArray();
}

function packDeltaSetIndex(entry, innerBitCount) {
	const innerMask = (1 << innerBitCount) - 1;
	return (
		((entry.outerIndex ?? 0) << innerBitCount) |
		((entry.innerIndex ?? 0) & innerMask)
	);
}

function unpackDeltaSetIndex(packed, innerBitCount) {
	const innerMask = (1 << innerBitCount) - 1;
	return {
		outerIndex: packed >> innerBitCount,
		innerIndex: packed & innerMask,
	};
}

function computeDeltaSetIndexPacking(entries) {
	let maxInnerIndex = 0;
	let maxOuterIndex = 0;

	for (const entry of entries) {
		maxInnerIndex = Math.max(maxInnerIndex, entry.innerIndex ?? 0);
		maxOuterIndex = Math.max(maxOuterIndex, entry.outerIndex ?? 0);
	}

	let innerBitCount = 1;
	while ((1 << innerBitCount) - 1 < maxInnerIndex && innerBitCount < 16) {
		innerBitCount++;
	}

	const packedMax = (maxOuterIndex << innerBitCount) | maxInnerIndex;
	let entrySize = 1;
	while (entrySize < 4 && packedMax > maxValueForByteSize(entrySize)) {
		entrySize++;
	}

	const entryFormat = ((entrySize - 1) << 4) | (innerBitCount - 1);
	return { entryFormat };
}

function maxValueForByteSize(size) {
	if (size === 1) return 0xff;
	if (size === 2) return 0xffff;
	if (size === 3) return 0xffffff;
	return 0xffffffff;
}

function readUIntN(reader, size) {
	if (size === 1) return reader.uint8();
	if (size === 2) return reader.uint16();
	if (size === 3) return reader.uint24();
	return reader.uint32();
}

function writeUIntN(writer, value, size) {
	if (size === 1) writer.uint8(value);
	else if (size === 2) writer.uint16(value);
	else if (size === 3) writer.uint24(value);
	else writer.uint32(value >>> 0);
}
