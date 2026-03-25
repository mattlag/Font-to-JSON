/**
 * Tests for BASE table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseBASE, writeBASE } from '../../src/sfnt/table_BASE.js';

/** Minimal valid IVS structure for testing. */
function minimalIVS() {
	return {
		format: 1,
		variationRegionList: {
			axisCount: 1,
			regions: [{ regionAxes: [{ startCoord: 0, peakCoord: 1, endCoord: 1 }] }],
		},
		itemVariationData: [
			{
				itemCount: 1,
				wordDeltaCount: 1,
				regionIndexes: [0],
				deltaSets: [[25]],
			},
		],
	};
}

function normalizeBASE(base) {
	return {
		majorVersion: base.majorVersion,
		minorVersion: base.minorVersion,
		horizAxis: base.horizAxis,
		vertAxis: base.vertAxis,
		itemVariationStore: base.itemVariationStore,
	};
}

describe('BASE table', () => {
	it('should round-trip BASE v1.0 with structured axis subtables', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			horizAxis: {
				baseTagList: ['ideo', 'romn'],
				baseScriptList: [
					{
						tag: 'cyrl',
						baseValues: {
							defaultBaselineIndex: 1,
							baseCoords: [
								{ format: 1, coordinate: -288 },
								{ format: 1, coordinate: 0 },
							],
						},
						defaultMinMax: null,
						langSystems: [],
					},
				],
			},
			vertAxis: null,
			itemVariationStore: null,
		};

		const parsed = parseBASE(writeBASE(original));

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.horizAxis.baseTagList).toEqual(['ideo', 'romn']);
		expect(parsed.horizAxis.baseScriptList.length).toBe(1);
		const script = parsed.horizAxis.baseScriptList[0];
		expect(script.tag).toBe('cyrl');
		expect(script.baseValues.defaultBaselineIndex).toBe(1);
		expect(script.baseValues.baseCoords).toEqual([
			{ format: 1, coordinate: -288 },
			{ format: 1, coordinate: 0 },
		]);
		expect(script.defaultMinMax).toBeNull();
		expect(parsed.vertAxis).toBeNull();
		expect(parsed.itemVariationStore).toBeNull();
	});

	it('should round-trip MinMax with featMinMax records', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			horizAxis: {
				baseTagList: ['romn'],
				baseScriptList: [
					{
						tag: 'latn',
						baseValues: {
							defaultBaselineIndex: 0,
							baseCoords: [{ format: 1, coordinate: 0 }],
						},
						defaultMinMax: {
							minCoord: { format: 1, coordinate: -200 },
							maxCoord: { format: 1, coordinate: 1652 },
							featMinMax: [
								{
									tag: 'titl',
									minCoord: { format: 1, coordinate: -296 },
									maxCoord: { format: 1, coordinate: 1752 },
								},
							],
						},
						langSystems: [
							{
								tag: 'RUS ',
								minMax: {
									minCoord: { format: 1, coordinate: -248 },
									maxCoord: { format: 1, coordinate: 1700 },
									featMinMax: [],
								},
							},
						],
					},
				],
			},
			vertAxis: null,
			itemVariationStore: null,
		};

		const parsed = parseBASE(writeBASE(original));

		const script = parsed.horizAxis.baseScriptList[0];
		expect(script.defaultMinMax.minCoord.coordinate).toBe(-200);
		expect(script.defaultMinMax.maxCoord.coordinate).toBe(1652);
		expect(script.defaultMinMax.featMinMax.length).toBe(1);
		expect(script.defaultMinMax.featMinMax[0].tag).toBe('titl');
		expect(script.defaultMinMax.featMinMax[0].minCoord.coordinate).toBe(-296);

		expect(script.langSystems.length).toBe(1);
		expect(script.langSystems[0].tag).toBe('RUS ');
		expect(script.langSystems[0].minMax.minCoord.coordinate).toBe(-248);
	});

	it('should round-trip BaseCoord format 2 (contour point)', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			horizAxis: {
				baseTagList: ['romn'],
				baseScriptList: [
					{
						tag: 'math',
						baseValues: {
							defaultBaselineIndex: 0,
							baseCoords: [
								{
									format: 2,
									coordinate: -280,
									referenceGlyph: 296,
									baseCoordPoint: 67,
								},
							],
						},
						defaultMinMax: null,
						langSystems: [],
					},
				],
			},
			vertAxis: null,
			itemVariationStore: null,
		};

		const parsed = parseBASE(writeBASE(original));
		const bc = parsed.horizAxis.baseScriptList[0].baseValues.baseCoords[0];
		expect(bc.format).toBe(2);
		expect(bc.coordinate).toBe(-280);
		expect(bc.referenceGlyph).toBe(296);
		expect(bc.baseCoordPoint).toBe(67);
	});

	it('should round-trip BaseCoord format 3 with VariationIndex', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 1,
			horizAxis: {
				baseTagList: ['romn'],
				baseScriptList: [
					{
						tag: 'latn',
						baseValues: {
							defaultBaselineIndex: 0,
							baseCoords: [
								{
									format: 3,
									coordinate: 0,
									device: {
										format: 0x8000,
										deltaSetOuterIndex: 0,
										deltaSetInnerIndex: 3,
									},
								},
							],
						},
						defaultMinMax: null,
						langSystems: [],
					},
				],
			},
			vertAxis: null,
			itemVariationStore: minimalIVS(),
		};

		const parsed = parseBASE(writeBASE(original));
		const bc = parsed.horizAxis.baseScriptList[0].baseValues.baseCoords[0];
		expect(bc.format).toBe(3);
		expect(bc.coordinate).toBe(0);
		expect(bc.device.format).toBe(0x8000);
		expect(bc.device.deltaSetOuterIndex).toBe(0);
		expect(bc.device.deltaSetInnerIndex).toBe(3);
	});

	it('should round-trip BASE v1.1 including item variation store', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 1,
			horizAxis: {
				baseTagList: ['romn'],
				baseScriptList: [
					{
						tag: 'latn',
						baseValues: {
							defaultBaselineIndex: 0,
							baseCoords: [{ format: 1, coordinate: 0 }],
						},
						defaultMinMax: null,
						langSystems: [],
					},
				],
			},
			vertAxis: null,
			itemVariationStore: minimalIVS(),
		};

		const parsed = parseBASE(writeBASE(original));

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(1);
		expect(parsed.horizAxis.baseTagList).toEqual(['romn']);
		expect(parsed.itemVariationStore.format).toBe(1);
		expect(parsed.itemVariationStore.itemVariationData[0].deltaSets[0]).toEqual(
			[25],
		);
	});

	it('should round-trip both horiz and vert axes', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			horizAxis: {
				baseTagList: ['hang', 'ideo', 'romn'],
				baseScriptList: [
					{
						tag: 'hani',
						baseValues: {
							defaultBaselineIndex: 1,
							baseCoords: [
								{ format: 1, coordinate: 1500 },
								{ format: 1, coordinate: -288 },
								{ format: 1, coordinate: 0 },
							],
						},
						defaultMinMax: null,
						langSystems: [],
					},
				],
			},
			vertAxis: {
				baseTagList: ['vcen'],
				baseScriptList: [
					{
						tag: 'hani',
						baseValues: {
							defaultBaselineIndex: 0,
							baseCoords: [{ format: 1, coordinate: 500 }],
						},
						defaultMinMax: null,
						langSystems: [],
					},
				],
			},
			itemVariationStore: null,
		};

		const parsed = parseBASE(writeBASE(original));

		expect(parsed.horizAxis.baseTagList).toEqual(['hang', 'ideo', 'romn']);
		expect(parsed.horizAxis.baseScriptList[0].tag).toBe('hani');
		expect(parsed.vertAxis.baseTagList).toEqual(['vcen']);
		expect(
			parsed.vertAxis.baseScriptList[0].baseValues.baseCoords[0].coordinate,
		).toBe(500);
	});

	it('should still support _raw backward compatibility', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			horizAxis: { _raw: [0x00, 0x01, 0x02] },
			vertAxis: null,
			itemVariationStore: null,
		};

		const bytes = writeBASE(original);
		expect(bytes.length).toBeGreaterThan(0);
		// Re-parsing raw bytes that don't form valid subtables won't crash;
		// just verify round-trip of the raw blob through the writer.
		expect(bytes[8]).toBe(0x00);
		expect(bytes[9]).toBe(0x01);
		expect(bytes[10]).toBe(0x02);
	});

	it('should be stable across parse -> write -> parse', () => {
		const source = {
			majorVersion: 1,
			minorVersion: 1,
			horizAxis: {
				baseTagList: ['ideo', 'romn'],
				baseScriptList: [
					{
						tag: 'cyrl',
						baseValues: {
							defaultBaselineIndex: 1,
							baseCoords: [
								{ format: 1, coordinate: -288 },
								{ format: 1, coordinate: 0 },
							],
						},
						defaultMinMax: {
							minCoord: { format: 1, coordinate: -200 },
							maxCoord: { format: 1, coordinate: 800 },
							featMinMax: [],
						},
						langSystems: [],
					},
				],
			},
			vertAxis: null,
			itemVariationStore: minimalIVS(),
		};

		const once = parseBASE(writeBASE(source));
		const twice = parseBASE(writeBASE(once));

		expect(normalizeBASE(twice)).toEqual(normalizeBASE(once));
	});
});
