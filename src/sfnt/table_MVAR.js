/**
 * Font Flux JS : MVAR table
 * Metrics Variations Table
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/mvar
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';
import {
	parseItemVariationStore,
	writeItemVariationStore,
} from './item_variation_store.js';

const MVAR_HEADER_SIZE = 12;
const VALUE_RECORD_BASE_SIZE = 8;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse an MVAR table from raw bytes.
 *
 * @param {number[]} rawBytes
 * @returns {object}
 */
export function parseMVAR(rawBytes) {
	const reader = new DataReader(rawBytes);

	const majorVersion = reader.uint16();
	const minorVersion = reader.uint16();
	const reserved = reader.uint16();
	const valueRecordSize = reader.uint16();
	const valueRecordCount = reader.uint16();
	const itemVariationStoreOffset = reader.offset16();

	const valueRecords = [];
	for (let i = 0; i < valueRecordCount; i++) {
		const recordOffset = MVAR_HEADER_SIZE + i * valueRecordSize;
		if (recordOffset >= rawBytes.length) {
			valueRecords.push({
				valueTag: '    ',
				deltaSetOuterIndex: 0,
				deltaSetInnerIndex: 0,
				_extra: [],
			});
			continue;
		}

		reader.seek(recordOffset);
		const record = {
			valueTag: reader.tag(),
			deltaSetOuterIndex: reader.uint16(),
			deltaSetInnerIndex: reader.uint16(),
		};

		if (valueRecordSize > VALUE_RECORD_BASE_SIZE) {
			record._extra = reader.bytes(valueRecordSize - VALUE_RECORD_BASE_SIZE);
		}

		valueRecords.push(record);
	}

	const itemVariationStore =
		itemVariationStoreOffset > 0 && itemVariationStoreOffset < rawBytes.length
			? parseItemVariationStore(rawBytes.slice(itemVariationStoreOffset))
			: null;

	return {
		majorVersion,
		minorVersion,
		reserved,
		valueRecordSize,
		valueRecords,
		itemVariationStore,
	};
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write an MVAR JSON object back to raw bytes.
 *
 * @param {object} mvar - Parsed MVAR table data
 * @returns {number[]} Array of byte values
 */
export function writeMVAR(mvar) {
	const majorVersion = mvar.majorVersion ?? 1;
	const minorVersion = mvar.minorVersion ?? 0;
	const reserved = mvar.reserved ?? 0;
	const valueRecords = [...(mvar.valueRecords ?? [])].sort((a, b) =>
		compareTags(a.valueTag, b.valueTag),
	);

	const declaredValueRecordSize =
		mvar.valueRecordSize ?? VALUE_RECORD_BASE_SIZE;
	const requiredValueRecordSize = valueRecords.reduce((max, record) => {
		const extra = record._extra?.length ?? 0;
		return Math.max(max, VALUE_RECORD_BASE_SIZE + extra);
	}, VALUE_RECORD_BASE_SIZE);
	const valueRecordSize = Math.max(
		declaredValueRecordSize,
		requiredValueRecordSize,
	);
	const valueRecordCount = valueRecords.length;

	const itemVariationStoreBytes = mvar.itemVariationStore
		? writeItemVariationStore(mvar.itemVariationStore)
		: [];
	const itemVariationStoreOffset =
		itemVariationStoreBytes.length > 0 || valueRecordCount > 0
			? MVAR_HEADER_SIZE + valueRecordCount * valueRecordSize
			: 0;

	const totalSize =
		itemVariationStoreOffset > 0
			? itemVariationStoreOffset + itemVariationStoreBytes.length
			: MVAR_HEADER_SIZE;
	const w = new DataWriter(totalSize);

	w.uint16(majorVersion);
	w.uint16(minorVersion);
	w.uint16(reserved);
	w.uint16(valueRecordSize);
	w.uint16(valueRecordCount);
	w.offset16(itemVariationStoreOffset);

	for (const record of valueRecords) {
		w.tag(record.valueTag ?? '    ');
		w.uint16(record.deltaSetOuterIndex ?? 0);
		w.uint16(record.deltaSetInnerIndex ?? 0);
		const extra = record._extra ?? [];
		w.rawBytes(extra);
		const padding = valueRecordSize - VALUE_RECORD_BASE_SIZE - extra.length;
		if (padding > 0) {
			w.rawBytes(new Array(padding).fill(0));
		}
	}

	w.rawBytes(itemVariationStoreBytes);

	return w.toArray();
}

function compareTags(a, b) {
	const left = a ?? '    ';
	const right = b ?? '    ';
	for (let i = 0; i < 4; i++) {
		const diff = left.charCodeAt(i) - right.charCodeAt(i);
		if (diff !== 0) {
			return diff;
		}
	}
	return 0;
}
