/**
 * Tests for the MVAR (Metrics Variations) table parser / writer.
 */

import { describe, expect, it } from 'vitest';
import { parseMVAR, writeMVAR } from '../../src/sfnt/table_MVAR.js';

/** Minimal valid IVS structure for testing. */
function minimalIVS() {
	return {
		format: 1,
		variationRegionList: {
			axisCount: 1,
			regions: [
				{ regionAxes: [{ startCoord: 0, peakCoord: 1, endCoord: 1 }] },
			],
		},
		itemVariationData: [
			{
				itemCount: 1,
				wordDeltaCount: 1,
				regionIndexes: [0],
				deltaSets: [[50]],
			},
		],
	};
}

function normalizeMVAR(mvar) {
	return {
		majorVersion: mvar.majorVersion,
		minorVersion: mvar.minorVersion,
		reserved: mvar.reserved,
		valueRecordSize: mvar.valueRecordSize,
		valueRecords: mvar.valueRecords,
		itemVariationStore: mvar.itemVariationStore,
	};
}

describe('MVAR table', () => {
	it('should round-trip synthetic MVAR value records', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			reserved: 0,
			valueRecords: [
				{
					valueTag: 'vlgp',
					deltaSetOuterIndex: 3,
					deltaSetInnerIndex: 9,
				},
				{
					valueTag: 'hasc',
					deltaSetOuterIndex: 0,
					deltaSetInnerIndex: 1,
					_extra: [0xde, 0xad],
				},
			],
			itemVariationStore: minimalIVS(),
		};

		const parsed = parseMVAR(writeMVAR(original));

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.valueRecords.length).toBe(2);
		// Writer sorts by valueTag binary order.
		expect(parsed.valueRecords[0].valueTag).toBe('hasc');
		expect(parsed.valueRecords[1].valueTag).toBe('vlgp');
		expect(parsed.itemVariationStore.format).toBe(1);
		expect(parsed.itemVariationStore.itemVariationData[0].deltaSets[0]).toEqual([50]);
	});

	it('should support empty value record array', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			reserved: 0,
			valueRecords: [],
			itemVariationStore: null,
		};

		const parsed = parseMVAR(writeMVAR(original));
		expect(parsed.valueRecords).toEqual([]);
		expect(parsed.itemVariationStore).toBeNull();
	});

	it('should be stable across parse -> write -> parse', () => {
		const source = {
			majorVersion: 1,
			minorVersion: 0,
			reserved: 0,
			valueRecords: [
				{
					valueTag: 'hdsc',
					deltaSetOuterIndex: 1,
					deltaSetInnerIndex: 2,
				},
			],
			itemVariationStore: minimalIVS(),
		};

		const once = parseMVAR(writeMVAR(source));
		const twice = parseMVAR(writeMVAR(once));

		expect(normalizeMVAR(twice)).toEqual(normalizeMVAR(once));
	});
});
