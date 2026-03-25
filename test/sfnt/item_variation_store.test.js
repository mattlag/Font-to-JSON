/**
 * Tests for the shared ItemVariationStore parser / writer.
 */

import { describe, expect, it } from 'vitest';
import {
	parseItemVariationStore,
	writeItemVariationStore,
} from '../../src/sfnt/item_variation_store.js';

describe('ItemVariationStore', () => {
	it('should round-trip a minimal single-axis IVS', () => {
		const original = {
			format: 1,
			variationRegionList: {
				axisCount: 1,
				regions: [
					{ regionAxes: [{ startCoord: 0, peakCoord: 1, endCoord: 1 }] },
				],
			},
			itemVariationData: [
				{
					itemCount: 2,
					wordDeltaCount: 1,
					regionIndexes: [0],
					deltaSets: [[100], [-50]],
				},
			],
		};

		const bytes = writeItemVariationStore(original);
		const parsed = parseItemVariationStore(bytes);

		expect(parsed.format).toBe(1);
		expect(parsed.variationRegionList.axisCount).toBe(1);
		expect(parsed.variationRegionList.regions).toHaveLength(1);
		expect(parsed.variationRegionList.regions[0].regionAxes[0].peakCoord).toBeCloseTo(1, 3);
		expect(parsed.itemVariationData).toHaveLength(1);
		expect(parsed.itemVariationData[0].itemCount).toBe(2);
		expect(parsed.itemVariationData[0].deltaSets).toEqual([[100], [-50]]);
	});

	it('should round-trip a multi-axis IVS with multiple subtables', () => {
		const original = {
			format: 1,
			variationRegionList: {
				axisCount: 2,
				regions: [
					{
						regionAxes: [
							{ startCoord: 0, peakCoord: 1, endCoord: 1 },
							{ startCoord: 0, peakCoord: 0, endCoord: 0 },
						],
					},
					{
						regionAxes: [
							{ startCoord: 0, peakCoord: 0, endCoord: 0 },
							{ startCoord: -1, peakCoord: -1, endCoord: 0 },
						],
					},
				],
			},
			itemVariationData: [
				{
					itemCount: 3,
					wordDeltaCount: 1,
					regionIndexes: [0, 1],
					deltaSets: [
						[200, 5],
						[-100, 10],
						[0, -3],
					],
				},
				{
					itemCount: 1,
					wordDeltaCount: 0,
					regionIndexes: [0],
					deltaSets: [[42]],
				},
			],
		};

		const bytes = writeItemVariationStore(original);
		const parsed = parseItemVariationStore(bytes);

		expect(parsed.format).toBe(1);
		expect(parsed.variationRegionList.axisCount).toBe(2);
		expect(parsed.variationRegionList.regions).toHaveLength(2);
		expect(parsed.itemVariationData).toHaveLength(2);

		// First subtable: 1 word delta + 1 byte delta per row
		const sub0 = parsed.itemVariationData[0];
		expect(sub0.itemCount).toBe(3);
		expect(sub0.regionIndexes).toEqual([0, 1]);
		expect(sub0.deltaSets[0]).toEqual([200, 5]);
		expect(sub0.deltaSets[1]).toEqual([-100, 10]);
		expect(sub0.deltaSets[2]).toEqual([0, -3]);

		// Second subtable: 0 word deltas, 1 byte delta per row
		const sub1 = parsed.itemVariationData[1];
		expect(sub1.itemCount).toBe(1);
		expect(sub1.deltaSets[0]).toEqual([42]);
	});

	it('should handle null subtable offsets', () => {
		const original = {
			format: 1,
			variationRegionList: {
				axisCount: 1,
				regions: [
					{ regionAxes: [{ startCoord: 0, peakCoord: 1, endCoord: 1 }] },
				],
			},
			itemVariationData: [
				null,
				{
					itemCount: 1,
					wordDeltaCount: 1,
					regionIndexes: [0],
					deltaSets: [[10]],
				},
			],
		};

		const bytes = writeItemVariationStore(original);
		const parsed = parseItemVariationStore(bytes);

		expect(parsed.itemVariationData).toHaveLength(2);
		expect(parsed.itemVariationData[0]).toBeNull();
		expect(parsed.itemVariationData[1].deltaSets[0]).toEqual([10]);
	});

	it('should be stable across write -> parse -> write -> parse', () => {
		const original = {
			format: 1,
			variationRegionList: {
				axisCount: 1,
				regions: [
					{ regionAxes: [{ startCoord: -1, peakCoord: -1, endCoord: 0 }] },
					{ regionAxes: [{ startCoord: 0, peakCoord: 1, endCoord: 1 }] },
				],
			},
			itemVariationData: [
				{
					itemCount: 2,
					wordDeltaCount: 2,
					regionIndexes: [0, 1],
					deltaSets: [
						[300, -400],
						[0, 127],
					],
				},
			],
		};

		const bytes1 = writeItemVariationStore(original);
		const parsed1 = parseItemVariationStore(bytes1);
		const bytes2 = writeItemVariationStore(parsed1);
		const parsed2 = parseItemVariationStore(bytes2);

		expect(bytes2).toEqual(bytes1);
		expect(parsed2).toEqual(parsed1);
	});

	it('should handle wordDeltaCount with all int16 deltas (no int8)', () => {
		const original = {
			format: 1,
			variationRegionList: {
				axisCount: 1,
				regions: [
					{ regionAxes: [{ startCoord: 0, peakCoord: 1, endCoord: 1 }] },
					{ regionAxes: [{ startCoord: -1, peakCoord: -1, endCoord: 0 }] },
				],
			},
			itemVariationData: [
				{
					itemCount: 1,
					wordDeltaCount: 2, // all columns are "word" (int16)
					regionIndexes: [0, 1],
					deltaSets: [[1000, -2000]],
				},
			],
		};

		const bytes = writeItemVariationStore(original);
		const parsed = parseItemVariationStore(bytes);

		expect(parsed.itemVariationData[0].deltaSets[0]).toEqual([1000, -2000]);
	});

	it('should handle empty itemVariationData array', () => {
		const original = {
			format: 1,
			variationRegionList: {
				axisCount: 1,
				regions: [],
			},
			itemVariationData: [],
		};

		const bytes = writeItemVariationStore(original);
		const parsed = parseItemVariationStore(bytes);

		expect(parsed.format).toBe(1);
		expect(parsed.variationRegionList.regions).toEqual([]);
		expect(parsed.itemVariationData).toEqual([]);
	});
});
