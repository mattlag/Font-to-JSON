/**
 * Tests for the kerning pipeline: extraction from all formats,
 * building to all formats, and cross-format conversion.
 */

import { describe, expect, it } from 'vitest';
import { buildRawFromSimplified } from '../src/expand.js';
import { parseGPOS, writeGPOS } from '../src/sfnt/table_GPOS.js';
import { buildSimplified } from '../src/simplify.js';

// Helper: build a minimal raw font with glyphs and optional tables
function makeRawFont(tables, numGlyphs = 100) {
	const glyphs = [];
	for (let i = 0; i < numGlyphs; i++) {
		glyphs.push({ name: `glyph${i}`, advanceWidth: 500 });
	}

	const baseTables = {
		head: {
			unitsPerEm: 1000,
			created: 0n,
			modified: 0n,
			flags: 0,
			macStyle: 0,
			indexToLocFormat: 0,
		},
		maxp: { version: 0x00005000, numGlyphs: numGlyphs },
		name: { names: [] },
		'OS/2': {
			version: 4,
			usWeightClass: 400,
			usWidthClass: 5,
			fsType: 0,
			panose: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		},
		post: {
			format: 3,
			italicAngle: 0,
			underlinePosition: -100,
			underlineThickness: 50,
			isFixedPitch: 0,
		},
		hhea: {
			ascender: 800,
			descender: -200,
			lineGap: 0,
			advanceWidthMax: 1000,
			numberOfHMetrics: numGlyphs,
		},
		hmtx: {
			hMetrics: glyphs.map((g) => ({ advanceWidth: g.advanceWidth, lsb: 0 })),
			leftSideBearings: [],
		},
		cmap: {
			version: 0,
			subtables: [
				{
					platformID: 3,
					encodingID: 10,
					format: 12,
					language: 0,
					groups: glyphs.slice(1).map((g, i) => ({
						startCharCode: 65 + i,
						endCharCode: 65 + i,
						startGlyphID: i + 1,
					})),
				},
			],
		},
		...tables,
	};

	return {
		header: {
			sfVersion: 0x00010000,
			numTables: Object.keys(baseTables).length,
		},
		tables: baseTables,
	};
}

describe('GPOS kerning extraction', () => {
	it('should extract pairs from GPOS PairPos Format 1', () => {
		const raw = makeRawFont({
			GPOS: {
				majorVersion: 1,
				minorVersion: 0,
				scriptList: {
					scriptRecords: [
						{
							scriptTag: 'DFLT',
							script: {
								defaultLangSys: {
									lookupOrderOffset: 0,
									requiredFeatureIndex: 0xffff,
									featureIndices: [0],
								},
								langSysRecords: [],
							},
						},
					],
				},
				featureList: {
					featureRecords: [
						{
							featureTag: 'kern',
							feature: { featureParamsOffset: 0, lookupListIndices: [0] },
						},
					],
				},
				lookupList: {
					lookups: [
						{
							lookupType: 2,
							lookupFlag: 0,
							subtables: [
								{
									format: 1,
									coverage: { format: 1, glyphs: [1, 2] },
									valueFormat1: 0x0004,
									valueFormat2: 0,
									pairSets: [
										[
											{
												secondGlyph: 3,
												value1: { xAdvance: -50 },
												value2: null,
											},
										],
										[
											{
												secondGlyph: 4,
												value1: { xAdvance: -30 },
												value2: null,
											},
										],
									],
								},
							],
						},
					],
				},
			},
		});

		const simplified = buildSimplified(raw);

		expect(simplified.kerning).toBeDefined();
		expect(simplified.kerning.length).toBe(2);
		expect(simplified.kerning).toContainEqual({
			left: 'glyph1',
			right: 'glyph3',
			value: -50,
		});
		expect(simplified.kerning).toContainEqual({
			left: 'glyph2',
			right: 'glyph4',
			value: -30,
		});
	});

	it('should extract pairs from GPOS PairPos Format 2 (class-based)', () => {
		const raw = makeRawFont({
			GPOS: {
				majorVersion: 1,
				minorVersion: 0,
				scriptList: {
					scriptRecords: [
						{
							scriptTag: 'DFLT',
							script: {
								defaultLangSys: {
									lookupOrderOffset: 0,
									requiredFeatureIndex: 0xffff,
									featureIndices: [0],
								},
								langSysRecords: [],
							},
						},
					],
				},
				featureList: {
					featureRecords: [
						{
							featureTag: 'kern',
							feature: { featureParamsOffset: 0, lookupListIndices: [0] },
						},
					],
				},
				lookupList: {
					lookups: [
						{
							lookupType: 2,
							lookupFlag: 0,
							subtables: [
								{
									format: 2,
									coverage: { format: 1, glyphs: [1, 2] },
									valueFormat1: 0x0004,
									valueFormat2: 0,
									classDef1: {
										format: 1,
										startGlyphID: 1,
										classValues: [1, 1],
									},
									classDef2: {
										format: 1,
										startGlyphID: 3,
										classValues: [1, 1],
									},
									class1Count: 2,
									class2Count: 2,
									class1Records: [
										[
											{ value1: null, value2: null },
											{ value1: null, value2: null },
										],
										[
											{ value1: null, value2: null },
											{ value1: { xAdvance: -60 }, value2: null },
										],
									],
								},
							],
						},
					],
				},
			},
		});

		const simplified = buildSimplified(raw);

		expect(simplified.kerning).toBeDefined();
		// Glyphs 1, 2 (class 1) × glyphs 3, 4 (class 1) → 4 pairs all with -60
		expect(simplified.kerning.length).toBe(4);
		for (const p of simplified.kerning) {
			expect(p.value).toBe(-60);
		}
	});

	it('should merge kern + GPOS with GPOS winning on conflict', () => {
		const raw = makeRawFont({
			kern: {
				formatVariant: 'opentype',
				version: 0,
				nTables: 1,
				subtables: [
					{
						version: 0,
						format: 0,
						coverage: 1,
						nPairs: 2,
						searchRange: 6,
						entrySelector: 0,
						rangeShift: 6,
						pairs: [
							{ left: 1, right: 3, value: -100 }, // conflicts with GPOS
							{ left: 5, right: 6, value: -25 }, // unique to kern
						],
					},
				],
			},
			GPOS: {
				majorVersion: 1,
				minorVersion: 0,
				scriptList: {
					scriptRecords: [
						{
							scriptTag: 'DFLT',
							script: {
								defaultLangSys: {
									lookupOrderOffset: 0,
									requiredFeatureIndex: 0xffff,
									featureIndices: [0],
								},
								langSysRecords: [],
							},
						},
					],
				},
				featureList: {
					featureRecords: [
						{
							featureTag: 'kern',
							feature: { featureParamsOffset: 0, lookupListIndices: [0] },
						},
					],
				},
				lookupList: {
					lookups: [
						{
							lookupType: 2,
							lookupFlag: 0,
							subtables: [
								{
									format: 1,
									coverage: { format: 1, glyphs: [1] },
									valueFormat1: 0x0004,
									valueFormat2: 0,
									pairSets: [
										[
											{
												secondGlyph: 3,
												value1: { xAdvance: -50 },
												value2: null,
											},
										],
									],
								},
							],
						},
					],
				},
			},
		});

		const simplified = buildSimplified(raw);

		expect(simplified.kerning).toBeDefined();
		// GPOS wins: glyph1→glyph3 = -50 (not -100 from kern)
		const conflictPair = simplified.kerning.find(
			(p) => p.left === 'glyph1' && p.right === 'glyph3',
		);
		expect(conflictPair.value).toBe(-50);
		// kern-only pair preserved
		const kernOnly = simplified.kerning.find(
			(p) => p.left === 'glyph5' && p.right === 'glyph6',
		);
		expect(kernOnly.value).toBe(-25);
	});
});

describe('kern Format 2 extraction', () => {
	it('should extract pairs from kern Format 2 class-based subtable', () => {
		const raw = makeRawFont({
			kern: {
				formatVariant: 'opentype',
				version: 0,
				nTables: 1,
				subtables: [
					{
						version: 0,
						format: 2,
						coverage: (2 << 8) | 1,
						rowWidth: 4,
						leftOffsetTable: 8,
						rightOffsetTable: 20,
						kerningArrayOffset: 32,
						leftClassTable: {
							firstGlyph: 1,
							nGlyphs: 2,
							offsets: [32, 36], // class 0, class 1 (32 + 4 = 36)
						},
						rightClassTable: {
							firstGlyph: 3,
							nGlyphs: 2,
							offsets: [0, 2], // class 0, class 1
						},
						nLeftClasses: 2,
						nRightClasses: 2,
						values: [
							[0, -40],
							[-20, 0],
						],
					},
				],
			},
		});

		const simplified = buildSimplified(raw);

		expect(simplified.kerning).toBeDefined();
		expect(simplified.kerning.length).toBeGreaterThan(0);
		// glyph1 (class 0) × glyph4 (class 1) = -40
		const pair1 = simplified.kerning.find(
			(p) => p.left === 'glyph1' && p.right === 'glyph4',
		);
		expect(pair1?.value).toBe(-40);
	});
});

describe('kern Format 3 extraction', () => {
	it('should extract pairs from Apple kern Format 3 subtable', () => {
		const raw = makeRawFont({
			kern: {
				formatVariant: 'apple',
				version: 0x00010000,
				nTables: 1,
				subtables: [
					{
						coverage: 0x00,
						format: 3,
						tupleIndex: 0,
						glyphCount: 10,
						kernValueCount: 2,
						leftClassCount: 2,
						rightClassCount: 2,
						flags: 0,
						kernValues: [0, -50],
						leftClasses: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
						rightClasses: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
						kernIndices: [0, 0, 0, 1], // class1[1] × class2[1] → kernValues[1] = -50
					},
				],
			},
		});

		const simplified = buildSimplified(raw);

		expect(simplified.kerning).toBeDefined();
		expect(simplified.kerning.length).toBe(1);
		expect(simplified.kerning[0]).toEqual({
			left: 'glyph1',
			right: 'glyph2',
			value: -50,
		});
	});
});

describe('GPOS kerning building', () => {
	it('should build GPOS from kerning (default format)', () => {
		const simplified = {
			font: {
				family: 'Test',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [
				{ name: '.notdef', advanceWidth: 500, codePoint: null },
				{ name: 'A', advanceWidth: 600, codePoint: 65 },
				{ name: 'V', advanceWidth: 600, codePoint: 86 },
				{ name: 'T', advanceWidth: 550, codePoint: 84 },
			],
			kerning: [
				{ left: 'A', right: 'V', value: -80 },
				{ left: 'A', right: 'T', value: -50 },
			],
		};

		const result = buildRawFromSimplified(simplified);

		expect(result.tables.GPOS).toBeDefined();
		expect(result.tables.kern).toBeUndefined();

		const gpos = result.tables.GPOS;
		expect(gpos.majorVersion).toBe(1);
		expect(gpos.featureList.featureRecords[0].featureTag).toBe('kern');
		expect(gpos.lookupList.lookups[0].lookupType).toBe(2);
		expect(gpos.lookupList.lookups[0].subtables[0].format).toBe(1);

		const st = gpos.lookupList.lookups[0].subtables[0];
		expect(st.coverage.glyphs).toContain(1); // 'A' is glyph index 1

		// Find the pairSet for glyph A (index 1)
		const aIdx = st.coverage.glyphs.indexOf(1);
		const pairSet = st.pairSets[aIdx];
		expect(pairSet.length).toBe(2);
		expect(pairSet.find((p) => p.secondGlyph === 2)?.value1?.xAdvance).toBe(
			-80,
		);
		expect(pairSet.find((p) => p.secondGlyph === 3)?.value1?.xAdvance).toBe(
			-50,
		);
	});

	it('should build GPOS from kerning and write valid binary', () => {
		const simplified = {
			font: {
				family: 'Test',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [
				{ name: '.notdef', advanceWidth: 500, codePoint: null },
				{ name: 'A', advanceWidth: 600, codePoint: 65 },
				{ name: 'V', advanceWidth: 600, codePoint: 86 },
			],
			kerning: [{ left: 'A', right: 'V', value: -80 }],
		};

		const result = buildRawFromSimplified(simplified);
		const gpos = result.tables.GPOS;

		// Write to binary and parse back
		const bytes = writeGPOS(gpos);
		const parsed = parseGPOS(bytes);

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.featureList.featureRecords[0].featureTag).toBe('kern');
		expect(parsed.lookupList.lookups[0].lookupType).toBe(2);
	});

	it('should build kern-ot-f0 when format specified', () => {
		const simplified = {
			font: {
				family: 'Test',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [
				{ name: '.notdef', advanceWidth: 500, codePoint: null },
				{ name: 'A', advanceWidth: 600, codePoint: 65 },
				{ name: 'V', advanceWidth: 600, codePoint: 86 },
			],
			kerning: [{ left: 'A', right: 'V', value: -80 }],
			_options: { kerningFormat: 'kern-ot-f0' },
		};

		const result = buildRawFromSimplified(simplified);

		expect(result.tables.kern).toBeDefined();
		expect(result.tables.kern.formatVariant).toBe('opentype');
		expect(result.tables.kern.subtables[0].format).toBe(0);
		// No GPOS kerning built (might have passthrough GPOS from features)
	});

	it('should build gpos+kern when format specified', () => {
		const simplified = {
			font: {
				family: 'Test',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [
				{ name: '.notdef', advanceWidth: 500, codePoint: null },
				{ name: 'A', advanceWidth: 600, codePoint: 65 },
				{ name: 'V', advanceWidth: 600, codePoint: 86 },
			],
			kerning: [{ left: 'A', right: 'V', value: -80 }],
			_options: { kerningFormat: 'gpos+kern' },
		};

		const result = buildRawFromSimplified(simplified);

		expect(result.tables.GPOS).toBeDefined();
		expect(result.tables.kern).toBeDefined();
	});

	it('should merge kerning into existing GPOS preserving non-kern features', () => {
		const simplified = {
			font: {
				family: 'Test',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [
				{ name: '.notdef', advanceWidth: 500, codePoint: null },
				{ name: 'A', advanceWidth: 600, codePoint: 65 },
				{ name: 'V', advanceWidth: 600, codePoint: 86 },
			],
			kerning: [{ left: 'A', right: 'V', value: -80 }],
			features: {
				GPOS: {
					majorVersion: 1,
					minorVersion: 0,
					scriptList: {
						scriptRecords: [
							{
								scriptTag: 'DFLT',
								script: {
									defaultLangSys: {
										lookupOrderOffset: 0,
										requiredFeatureIndex: 0xffff,
										featureIndices: [0],
									},
									langSysRecords: [],
								},
							},
						],
					},
					featureList: {
						featureRecords: [
							{
								featureTag: 'mark',
								feature: { featureParamsOffset: 0, lookupListIndices: [0] },
							},
						],
					},
					lookupList: {
						lookups: [
							{
								lookupType: 4, // MarkBase
								lookupFlag: 0,
								subtables: [],
							},
						],
					},
				},
			},
		};

		const result = buildRawFromSimplified(simplified);

		const gpos = result.tables.GPOS;
		expect(gpos).toBeDefined();

		// Original 'mark' feature preserved
		const markFeature = gpos.featureList.featureRecords.find(
			(r) => r.featureTag === 'mark',
		);
		expect(markFeature).toBeDefined();
		expect(markFeature.feature.lookupListIndices).toEqual([0]);

		// New 'kern' feature added
		const kernFeature = gpos.featureList.featureRecords.find(
			(r) => r.featureTag === 'kern',
		);
		expect(kernFeature).toBeDefined();

		// Original lookup preserved
		expect(gpos.lookupList.lookups[0].lookupType).toBe(4);
		// New PairPos lookup appended
		const kernLookupIdx = kernFeature.feature.lookupListIndices[0];
		expect(gpos.lookupList.lookups[kernLookupIdx].lookupType).toBe(2);
	});

	it('should build Apple kern Format 3', () => {
		const simplified = {
			font: {
				family: 'Test',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [
				{ name: '.notdef', advanceWidth: 500, codePoint: null },
				{ name: 'A', advanceWidth: 600, codePoint: 65 },
				{ name: 'V', advanceWidth: 600, codePoint: 86 },
			],
			kerning: [{ left: 'A', right: 'V', value: -80 }],
			_options: { kerningFormat: 'kern-apple-f3' },
		};

		const result = buildRawFromSimplified(simplified);

		expect(result.tables.kern).toBeDefined();
		expect(result.tables.kern.formatVariant).toBe('apple');
		expect(result.tables.kern.subtables[0].format).toBe(3);
	});

	it('should build OT kern Format 2 (class-based)', () => {
		const simplified = {
			font: {
				family: 'Test',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [
				{ name: '.notdef', advanceWidth: 500, codePoint: null },
				{ name: 'A', advanceWidth: 600, codePoint: 65 },
				{ name: 'V', advanceWidth: 600, codePoint: 86 },
				{ name: 'T', advanceWidth: 550, codePoint: 84 },
			],
			kerning: [
				{ left: 'A', right: 'V', value: -80 },
				{ left: 'A', right: 'T', value: -50 },
			],
			_options: { kerningFormat: 'kern-ot-f2' },
		};

		const result = buildRawFromSimplified(simplified);

		expect(result.tables.kern).toBeDefined();
		expect(result.tables.kern.formatVariant).toBe('opentype');
		expect(result.tables.kern.subtables[0].format).toBe(2);
		expect(result.tables.kern.subtables[0].values).toBeDefined();
	});
});

describe('cross-format kerning conversion', () => {
	it('should round-trip: GPOS → kerning[] → GPOS', () => {
		// Start with a GPOS font
		const raw = makeRawFont({
			GPOS: {
				majorVersion: 1,
				minorVersion: 0,
				scriptList: {
					scriptRecords: [
						{
							scriptTag: 'DFLT',
							script: {
								defaultLangSys: {
									lookupOrderOffset: 0,
									requiredFeatureIndex: 0xffff,
									featureIndices: [0],
								},
								langSysRecords: [],
							},
						},
					],
				},
				featureList: {
					featureRecords: [
						{
							featureTag: 'kern',
							feature: { featureParamsOffset: 0, lookupListIndices: [0] },
						},
					],
				},
				lookupList: {
					lookups: [
						{
							lookupType: 2,
							lookupFlag: 0,
							subtables: [
								{
									format: 1,
									coverage: { format: 1, glyphs: [1] },
									valueFormat1: 0x0004,
									valueFormat2: 0,
									pairSets: [
										[
											{
												secondGlyph: 2,
												value1: { xAdvance: -80 },
												value2: null,
											},
											{
												secondGlyph: 3,
												value1: { xAdvance: -50 },
												value2: null,
											},
										],
									],
								},
							],
						},
					],
				},
			},
		});

		// Import → simplify
		const simplified = buildSimplified(raw);
		expect(simplified.kerning.length).toBe(2);

		// Build as a new hand-authored font with the extracted kerning
		const handAuthored = {
			font: {
				family: 'Test',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: raw.tables.cmap
				? Array.from({ length: 100 }, (_, i) => ({
						name: `glyph${i}`,
						advanceWidth: 500,
						codePoint: i > 0 ? 64 + i : null,
					}))
				: [],
			kerning: simplified.kerning,
		};

		// Expand → verify GPOS is built
		const result = buildRawFromSimplified(handAuthored);
		expect(result.tables.GPOS).toBeDefined();
		expect(result.tables.kern).toBeUndefined();

		const st = result.tables.GPOS.lookupList.lookups[0].subtables[0];
		const aIdx = st.coverage.glyphs.indexOf(1);
		const pairSet = st.pairSets[aIdx];
		expect(pairSet.find((p) => p.secondGlyph === 2)?.value1?.xAdvance).toBe(
			-80,
		);
		expect(pairSet.find((p) => p.secondGlyph === 3)?.value1?.xAdvance).toBe(
			-50,
		);
	});

	it('should convert: kern F0 → kerning[] → GPOS', () => {
		const raw = makeRawFont({
			kern: {
				formatVariant: 'opentype',
				version: 0,
				nTables: 1,
				subtables: [
					{
						version: 0,
						format: 0,
						coverage: 1,
						nPairs: 1,
						searchRange: 6,
						entrySelector: 0,
						rangeShift: 0,
						pairs: [{ left: 1, right: 2, value: -80 }],
					},
				],
			},
		});

		const simplified = buildSimplified(raw);
		expect(simplified.kerning.length).toBe(1);
		expect(simplified.kerning[0].value).toBe(-80);

		const handAuthored = {
			font: {
				family: 'Test',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: Array.from({ length: 10 }, (_, i) => ({
				name: `glyph${i}`,
				advanceWidth: 500,
				codePoint: i > 0 ? 64 + i : null,
			})),
			kerning: simplified.kerning,
		};

		const result = buildRawFromSimplified(handAuthored);
		expect(result.tables.GPOS).toBeDefined();
		expect(result.tables.kern).toBeUndefined();
	});
});
