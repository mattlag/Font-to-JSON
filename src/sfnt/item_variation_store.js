/**
 * Font Flux JS : ItemVariationStore
 * Shared parser/writer for the ItemVariationStore binary format used by
 * HVAR, MVAR, VVAR, BASE (v1.1), COLR (v1), GDEF, GPOS, and JSTF.
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/otvarcommonformats#item-variation-store
 *
 * Parsed JSON shape:
 * {
 *   format: 1,
 *   variationRegionList: {
 *     axisCount: N,
 *     regions: [
 *       { regionAxes: [{ startCoord, peakCoord, endCoord }, ...] },
 *       ...
 *     ]
 *   },
 *   itemVariationData: [
 *     {
 *       itemCount: N,
 *       wordDeltaCount: N,    // raw packed value (includes LONG_WORDS flag)
 *       regionIndexes: [idx, ...],
 *       deltaSets: [[delta, ...], ...]
 *     },
 *     ...
 *   ]
 * }
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

const LONG_WORDS = 0x8000;
const WORD_DELTA_COUNT_MASK = 0x7fff;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse an ItemVariationStore from raw bytes.
 *
 * @param {number[]} rawBytes - bytes of the IVS subtable
 * @returns {object} parsed IVS structure
 */
export function parseItemVariationStore(rawBytes) {
	const reader = new DataReader(rawBytes);

	const format = reader.uint16();
	const variationRegionListOffset = reader.offset32();
	const itemVariationDataCount = reader.uint16();
	const itemVariationDataOffsets = reader.array(
		'offset32',
		itemVariationDataCount,
	);

	// --- Parse VariationRegionList ---
	const variationRegionList = parseVariationRegionList(
		reader,
		variationRegionListOffset,
	);

	// --- Parse each ItemVariationData subtable ---
	const itemVariationData = [];
	for (let i = 0; i < itemVariationDataCount; i++) {
		const offset = itemVariationDataOffsets[i];
		if (offset === 0) {
			itemVariationData.push(null);
		} else {
			itemVariationData.push(parseItemVariationData(reader, offset));
		}
	}

	return {
		format,
		variationRegionList,
		itemVariationData,
	};
}

function parseVariationRegionList(reader, offset) {
	reader.seek(offset);
	const axisCount = reader.uint16();
	const regionCount = reader.uint16();

	const regions = [];
	for (let r = 0; r < regionCount; r++) {
		const regionAxes = [];
		for (let a = 0; a < axisCount; a++) {
			regionAxes.push({
				startCoord: reader.f2dot14(),
				peakCoord: reader.f2dot14(),
				endCoord: reader.f2dot14(),
			});
		}
		regions.push({ regionAxes });
	}

	return { axisCount, regions };
}

function parseItemVariationData(reader, offset) {
	reader.seek(offset);

	const itemCount = reader.uint16();
	const wordDeltaCount = reader.uint16();
	const regionIndexCount = reader.uint16();
	const regionIndexes = reader.array('uint16', regionIndexCount);

	const longWords = (wordDeltaCount & LONG_WORDS) !== 0;
	const wordCount = wordDeltaCount & WORD_DELTA_COUNT_MASK;

	const deltaSets = [];
	for (let i = 0; i < itemCount; i++) {
		const row = [];
		// "Word" deltas first (int16 or int32)
		for (let w = 0; w < wordCount; w++) {
			row.push(longWords ? reader.int32() : reader.int16());
		}
		// "Short" deltas (int8 or int16)
		for (let s = wordCount; s < regionIndexCount; s++) {
			row.push(longWords ? reader.int16() : reader.int8());
		}
		deltaSets.push(row);
	}

	return {
		itemCount,
		wordDeltaCount,
		regionIndexes,
		deltaSets,
	};
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write a parsed ItemVariationStore back to raw bytes.
 *
 * @param {object} ivs - parsed IVS structure
 * @returns {number[]} array of byte values
 */
export function writeItemVariationStore(ivs) {
	const regionList = ivs.variationRegionList;
	const dataSubtables = ivs.itemVariationData ?? [];
	const dataCount = dataSubtables.length;

	// --- Calculate sizes ---
	// IVS header: format(2) + regionListOffset(4) + dataCount(2) + offsets(4 * dataCount)
	const headerSize = 2 + 4 + 2 + 4 * dataCount;

	// VariationRegionList: axisCount(2) + regionCount(2) + regions(regionCount * axisCount * 6)
	const axisCount = regionList.axisCount;
	const regionCount = regionList.regions.length;
	const regionListSize = 4 + regionCount * axisCount * 6;

	// Place region list right after header
	const regionListOffset = headerSize;

	// Place ItemVariationData subtables after region list
	let runningOffset = regionListOffset + regionListSize;
	const dataOffsets = [];
	const dataSizes = [];

	for (let i = 0; i < dataCount; i++) {
		const sub = dataSubtables[i];
		if (!sub) {
			dataOffsets.push(0);
			dataSizes.push(0);
			continue;
		}
		dataOffsets.push(runningOffset);

		const regionIndexCount = sub.regionIndexes.length;
		const longWords = (sub.wordDeltaCount & LONG_WORDS) !== 0;
		const wordCount = sub.wordDeltaCount & WORD_DELTA_COUNT_MASK;

		// ItemVariationData header: itemCount(2) + wordDeltaCount(2) + regionIndexCount(2)
		// + regionIndexes(2*regionIndexCount)
		const subHeaderSize = 6 + 2 * regionIndexCount;

		// DeltaSets: per row: wordCount * wordSize + (regionIndexCount - wordCount) * shortSize
		const wordSize = longWords ? 4 : 2;
		const shortSize = longWords ? 2 : 1;
		const rowSize =
			wordCount * wordSize + (regionIndexCount - wordCount) * shortSize;
		const subSize = subHeaderSize + sub.itemCount * rowSize;

		dataSizes.push(subSize);
		runningOffset += subSize;
	}

	const totalSize = runningOffset;
	const w = new DataWriter(totalSize);

	// --- Write IVS header ---
	w.uint16(ivs.format ?? 1);
	w.offset32(regionListOffset);
	w.uint16(dataCount);
	for (let i = 0; i < dataCount; i++) {
		w.offset32(dataOffsets[i]);
	}

	// --- Write VariationRegionList ---
	w.uint16(axisCount);
	w.uint16(regionCount);
	for (const region of regionList.regions) {
		for (const axis of region.regionAxes) {
			w.f2dot14(axis.startCoord);
			w.f2dot14(axis.peakCoord);
			w.f2dot14(axis.endCoord);
		}
	}

	// --- Write each ItemVariationData subtable ---
	for (let i = 0; i < dataCount; i++) {
		const sub = dataSubtables[i];
		if (!sub) continue;

		const regionIndexCount = sub.regionIndexes.length;
		const longWords = (sub.wordDeltaCount & LONG_WORDS) !== 0;
		const wordCount = sub.wordDeltaCount & WORD_DELTA_COUNT_MASK;

		w.uint16(sub.itemCount);
		w.uint16(sub.wordDeltaCount);
		w.uint16(regionIndexCount);
		w.array('uint16', sub.regionIndexes);

		for (const row of sub.deltaSets) {
			for (let c = 0; c < wordCount; c++) {
				if (longWords) w.int32(row[c] ?? 0);
				else w.int16(row[c] ?? 0);
			}
			for (let c = wordCount; c < regionIndexCount; c++) {
				if (longWords) w.int16(row[c] ?? 0);
				else w.int8(row[c] ?? 0);
			}
		}
	}

	return w.toArray();
}
