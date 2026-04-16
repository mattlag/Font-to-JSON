/**
 * Tests for simplified variable font metrics:
 * - axisMapping (avar)
 * - axisStyles (STAT)
 * - metricVariations (MVAR)
 *
 * Tests both from-scratch authoring and import→export round-trip.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont } from '../src/export.js';
import { importFont } from '../src/import.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');

// ===========================================================================
//  AXIS MAPPING (avar)
// ===========================================================================

describe('axisMapping (avar)', () => {
	it('should round-trip simplified axisMapping through export → import', () => {
		const simplified = {
			font: { familyName: 'Test', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
			],
			axes: [
				{ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 },
				{ tag: 'wdth', name: 'Width', min: 75, default: 100, max: 125 },
			],
			instances: [],
			axisMapping: {
				wght: [
					{ from: -1, to: -1 },
					{ from: -0.5, to: -0.7 },
					{ from: 0, to: 0 },
					{ from: 0.5, to: 0.3 },
					{ from: 1, to: 1 },
				],
			},
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		expect(reimported.axisMapping).toBeDefined();
		expect(reimported.axisMapping.wght).toBeDefined();
		expect(reimported.axisMapping.wght.length).toBe(5);
		// F2DOT14 has limited precision, so check within tolerance
		expect(reimported.axisMapping.wght[1].from).toBeCloseTo(-0.5, 2);
		expect(reimported.axisMapping.wght[1].to).toBeCloseTo(-0.7, 2);
		// wdth should not appear since it was not specified (identity)
		expect(reimported.axisMapping.wdth).toBeUndefined();
	});

	it('should omit axisMapping when all axes use identity mappings', () => {
		const simplified = {
			font: { familyName: 'Test', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
			],
			axes: [{ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 }],
			instances: [],
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		// No axisMapping if there's no avar table
		expect(reimported.axisMapping).toBeUndefined();
	});

	it('should generate identity avar segments for unmapped axes', () => {
		const simplified = {
			font: { familyName: 'Test', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
			],
			axes: [
				{ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 },
				{ tag: 'wdth', name: 'Width', min: 75, default: 100, max: 125 },
			],
			instances: [],
			axisMapping: {
				wght: [
					{ from: -1, to: -1 },
					{ from: 0, to: 0 },
					{ from: 0.5, to: 0.8 },
					{ from: 1, to: 1 },
				],
			},
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		// wght should have the non-identity mapping
		expect(reimported.axisMapping.wght).toBeDefined();
		expect(reimported.axisMapping.wght.length).toBe(4);
		// wdth should not appear (identity mapping is stripped)
		expect(reimported.axisMapping.wdth).toBeUndefined();
	});
});

// ===========================================================================
//  AXIS STYLES (STAT)
// ===========================================================================

describe('axisStyles (STAT)', () => {
	it('should round-trip format 1 (single value) axis styles', () => {
		const simplified = {
			font: { familyName: 'Test', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
			],
			axes: [{ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 }],
			instances: [],
			axisStyles: {
				elidedFallbackName: 'Regular',
				values: [
					{ name: 'Regular', axis: 'wght', value: 400, flags: 2 },
					{ name: 'Bold', axis: 'wght', value: 700, flags: 0 },
				],
			},
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		expect(reimported.axisStyles).toBeDefined();
		expect(reimported.axisStyles.elidedFallbackName).toBe('Regular');
		expect(reimported.axisStyles.values.length).toBe(2);

		const regular = reimported.axisStyles.values.find(
			(v) => v.name === 'Regular',
		);
		expect(regular).toBeDefined();
		expect(regular.axis).toBe('wght');
		expect(regular.value).toBe(400);
		expect(regular.flags).toBe(2);

		const bold = reimported.axisStyles.values.find((v) => v.name === 'Bold');
		expect(bold).toBeDefined();
		expect(bold.axis).toBe('wght');
		expect(bold.value).toBe(700);
		expect(bold.flags).toBe(0);
	});

	it('should round-trip format 2 (range) axis styles', () => {
		const simplified = {
			font: { familyName: 'Test', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
			],
			axes: [{ tag: 'wdth', name: 'Width', min: 75, default: 100, max: 125 }],
			instances: [],
			axisStyles: {
				values: [
					{
						name: 'Normal',
						axis: 'wdth',
						range: [87.5, 100, 112.5],
						flags: 2,
					},
				],
			},
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		const val = reimported.axisStyles.values[0];
		expect(val.name).toBe('Normal');
		expect(val.axis).toBe('wdth');
		expect(val.range).toEqual([87.5, 100, 112.5]);
	});

	it('should round-trip format 3 (linked value) axis styles', () => {
		const simplified = {
			font: { familyName: 'Test', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
			],
			axes: [{ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 }],
			instances: [],
			axisStyles: {
				values: [
					{
						name: 'Regular',
						axis: 'wght',
						value: 400,
						linkedValue: 700,
						flags: 2,
					},
				],
			},
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		const val = reimported.axisStyles.values[0];
		expect(val.value).toBe(400);
		expect(val.linkedValue).toBe(700);
	});

	it('should round-trip format 4 (multi-axis) axis styles', () => {
		const simplified = {
			font: { familyName: 'Test', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
			],
			axes: [
				{ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 },
				{ tag: 'wdth', name: 'Width', min: 75, default: 100, max: 125 },
			],
			instances: [],
			axisStyles: {
				values: [
					{
						name: 'Bold Condensed',
						values: { wght: 700, wdth: 75 },
						flags: 0,
					},
				],
			},
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		const val = reimported.axisStyles.values[0];
		expect(val.name).toBe('Bold Condensed');
		expect(val.values).toEqual({ wght: 700, wdth: 75 });
	});

	it('should auto-generate STAT when no axisStyles provided', () => {
		const simplified = {
			font: { familyName: 'Test', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
			],
			axes: [{ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 }],
			instances: [],
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		// Should still produce axisStyles from auto-generated STAT
		expect(reimported.axisStyles).toBeDefined();
		expect(reimported.axisStyles.values.length).toBeGreaterThan(0);
	});
});

// ===========================================================================
//  METRIC VARIATIONS (MVAR)
// ===========================================================================

describe('metricVariations (MVAR)', () => {
	it('should round-trip simplified metric variations', () => {
		const simplified = {
			font: { familyName: 'Test', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
			],
			axes: [{ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 }],
			instances: [],
			metricVariations: {
				regions: [{ axes: { wght: [0, 1, 1] } }],
				metrics: {
					ascender: [{ region: 0, delta: 50 }],
					descender: [{ region: 0, delta: -20 }],
				},
			},
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		expect(reimported.metricVariations).toBeDefined();
		expect(reimported.metricVariations.regions.length).toBe(1);
		expect(reimported.metricVariations.regions[0].axes.wght).toEqual([0, 1, 1]);
		expect(reimported.metricVariations.metrics.ascender).toBeDefined();
		expect(reimported.metricVariations.metrics.descender).toBeDefined();

		const ascDelta = reimported.metricVariations.metrics.ascender.find(
			(d) => d.region === 0,
		);
		expect(ascDelta.delta).toBe(50);
		const dscDelta = reimported.metricVariations.metrics.descender.find(
			(d) => d.region === 0,
		);
		expect(dscDelta.delta).toBe(-20);
	});

	it('should round-trip multi-region metric variations', () => {
		const simplified = {
			font: { familyName: 'Test', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
			],
			axes: [
				{ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 },
				{ tag: 'wdth', name: 'Width', min: 75, default: 100, max: 125 },
			],
			instances: [],
			metricVariations: {
				regions: [
					{ axes: { wght: [0, 1, 1] } },
					{ axes: { wdth: [-1, -1, 0] } },
					{ axes: { wght: [0, 1, 1], wdth: [-1, -1, 0] } },
				],
				metrics: {
					ascender: [
						{ region: 0, delta: 50 },
						{ region: 1, delta: -10 },
					],
					xHeight: [{ region: 2, delta: 15 }],
				},
			},
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		expect(reimported.metricVariations.regions.length).toBe(3);
		expect(reimported.metricVariations.metrics.ascender.length).toBe(2);
		expect(reimported.metricVariations.metrics.xHeight.length).toBe(1);
		expect(reimported.metricVariations.metrics.xHeight[0].delta).toBe(15);
	});

	it('should use human-readable metric names', () => {
		const simplified = {
			font: { familyName: 'Test', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
			],
			axes: [{ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 }],
			instances: [],
			metricVariations: {
				regions: [{ axes: { wght: [0, 1, 1] } }],
				metrics: {
					capHeight: [{ region: 0, delta: 20 }],
					strikeoutSize: [{ region: 0, delta: 3 }],
					underlineOffset: [{ region: 0, delta: -5 }],
				},
			},
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		// Should preserve human-readable names
		expect(reimported.metricVariations.metrics.capHeight).toBeDefined();
		expect(reimported.metricVariations.metrics.strikeoutSize).toBeDefined();
		expect(reimported.metricVariations.metrics.underlineOffset).toBeDefined();
	});

	it('should omit metricVariations when not present', () => {
		const simplified = {
			font: { familyName: 'Test', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
			],
			axes: [{ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 }],
			instances: [],
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		expect(reimported.metricVariations).toBeUndefined();
	});
});

// ===========================================================================
//  REAL-FONT ROUND-TRIP (SegUIVar)
// ===========================================================================

describe('variable font round-trip with real fonts', () => {
	it('should extract and preserve variable metrics from SegUIVar', async () => {
		const filePath = resolve(SAMPLES_DIR, 'SegUIVar-test.ttf');
		let buffer;
		try {
			buffer = (await readFile(filePath)).buffer;
		} catch {
			// Skip if sample font is not available
			return;
		}

		const first = importFont(buffer);

		// Should have axes
		expect(first.axes).toBeDefined();
		expect(first.axes.length).toBeGreaterThan(0);

		// Double round-trip should stabilize
		const exported = exportFont(first);
		const second = importFont(exported);
		const exported2 = exportFont(second);
		const third = importFont(exported2);

		// Axes should survive
		expect(second.axes).toEqual(first.axes);
		expect(third.axes).toEqual(second.axes);

		// Instances should survive
		expect(second.instances).toEqual(first.instances);
		expect(third.instances).toEqual(second.instances);

		// axisStyles should survive if present
		if (first.axisStyles) {
			expect(third.axisStyles).toEqual(second.axisStyles);
		}

		// metricVariations should survive if present
		if (first.metricVariations) {
			expect(third.metricVariations).toEqual(second.metricVariations);
		}

		// axisMapping should survive if present
		if (first.axisMapping) {
			expect(third.axisMapping).toEqual(second.axisMapping);
		}
	});

	it('should double round-trip AdobeVFPrototype', async () => {
		const filePath = resolve(SAMPLES_DIR, 'AdobeVFPrototype-online-test.otf');
		let buffer;
		try {
			buffer = (await readFile(filePath)).buffer;
		} catch {
			return;
		}

		const first = importFont(buffer);
		const exported = exportFont(first);
		const second = importFont(exported);
		const exported2 = exportFont(second);
		const third = importFont(exported2);

		expect(third.axes).toEqual(second.axes);
		expect(third.instances).toEqual(second.instances);

		if (first.axisStyles) {
			expect(third.axisStyles).toEqual(second.axisStyles);
		}
		if (first.metricVariations) {
			expect(third.metricVariations).toEqual(second.metricVariations);
		}
	});
});

// ===========================================================================
//  COMBINED: all variable metrics together
// ===========================================================================

describe('combined variable metrics authoring', () => {
	it('should export a font with all variable metric fields', () => {
		const simplified = {
			font: { familyName: 'VarTest', styleName: 'Regular', unitsPerEm: 1000 },
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500, contours: [] },
				{
					name: 'A',
					unicode: 65,
					advanceWidth: 600,
					contours: [
						[
							[100, 0, 1],
							[300, 700, 1],
							[500, 0, 1],
						],
					],
				},
			],
			axes: [
				{ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 },
				{ tag: 'wdth', name: 'Width', min: 75, default: 100, max: 125 },
			],
			instances: [
				{ name: 'Regular', coordinates: { wght: 400, wdth: 100 } },
				{ name: 'Bold', coordinates: { wght: 700, wdth: 100 } },
			],
			axisMapping: {
				wght: [
					{ from: -1, to: -1 },
					{ from: 0, to: 0 },
					{ from: 1, to: 1 },
				],
			},
			axisStyles: {
				elidedFallbackName: 'Regular',
				values: [
					{
						name: 'Regular',
						axis: 'wght',
						value: 400,
						linkedValue: 700,
						flags: 2,
					},
					{ name: 'Bold', axis: 'wght', value: 700, flags: 0 },
					{
						name: 'Normal',
						axis: 'wdth',
						range: [87.5, 100, 112.5],
						flags: 2,
					},
				],
			},
			metricVariations: {
				regions: [{ axes: { wght: [0, 1, 1] } }],
				metrics: {
					ascender: [{ region: 0, delta: 30 }],
				},
			},
		};

		const exported = exportFont(simplified);
		const reimported = importFont(exported);

		expect(reimported.axes.length).toBe(2);
		expect(reimported.instances.length).toBe(2);
		// axisMapping has only identity for wght, should be stripped
		expect(reimported.axisMapping).toBeUndefined();
		expect(reimported.axisStyles).toBeDefined();
		expect(reimported.axisStyles.values.length).toBe(3);
		expect(reimported.metricVariations).toBeDefined();
		expect(reimported.metricVariations.metrics.ascender[0].delta).toBe(30);
	});
});
