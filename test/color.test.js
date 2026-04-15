/**
 * Tests for color font helpers, simplify/expand decomposition, and FontFlux API.
 */

import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
	bgraToHex,
	buildGlyphIdToNameMap,
	buildNameToGlyphIdMap,
	createColorGlyph,
	hexToBGRA,
	normalizePalette,
	resolvePaintGlyphIds,
	resolvePaintGlyphNames,
} from '../src/color.js';
import { FontFlux } from '../src/font_flux.js';

const SAMPLES = path.resolve('test/sample fonts');

// ============================================================================
//  HEX ↔ BGRA CONVERSION
// ============================================================================

describe('hexToBGRA', () => {
	it('should convert #RRGGBB to BGRA', () => {
		const c = hexToBGRA('#C90900');
		expect(c).toEqual({ red: 201, green: 9, blue: 0, alpha: 255 });
	});

	it('should convert #RRGGBBAA to BGRA', () => {
		const c = hexToBGRA('#FF000080');
		expect(c).toEqual({ red: 255, green: 0, blue: 0, alpha: 128 });
	});

	it('should convert short #RGB to BGRA', () => {
		const c = hexToBGRA('#F00');
		expect(c).toEqual({ red: 255, green: 0, blue: 0, alpha: 255 });
	});

	it('should convert short #RGBA to BGRA', () => {
		const c = hexToBGRA('#F008');
		expect(c).toEqual({ red: 255, green: 0, blue: 0, alpha: 136 });
	});

	it('should throw on invalid hex', () => {
		expect(() => hexToBGRA('red')).toThrow();
		expect(() => hexToBGRA('#XYZ')).toThrow();
		expect(() => hexToBGRA('#12345')).toThrow();
	});
});

describe('bgraToHex', () => {
	it('should convert BGRA to #RRGGBB when alpha is 255', () => {
		expect(bgraToHex({ red: 201, green: 9, blue: 0, alpha: 255 })).toBe(
			'#c90900',
		);
	});

	it('should convert BGRA to #RRGGBBAA when alpha is not 255', () => {
		expect(bgraToHex({ red: 255, green: 0, blue: 0, alpha: 128 })).toBe(
			'#ff000080',
		);
	});

	it('should omit alpha when undefined', () => {
		expect(bgraToHex({ red: 0, green: 255, blue: 0 })).toBe('#00ff00');
	});
});

describe('normalizePalette', () => {
	it('should normalize hex strings', () => {
		const result = normalizePalette(['#FF0000', '#00ff00', '#0000FF']);
		expect(result).toEqual(['#ff0000', '#00ff00', '#0000ff']);
	});

	it('should normalize BGRA objects', () => {
		const result = normalizePalette([
			{ red: 255, green: 0, blue: 0, alpha: 255 },
		]);
		expect(result).toEqual(['#ff0000']);
	});

	it('should throw on invalid input', () => {
		expect(() => normalizePalette([123])).toThrow();
		expect(() => normalizePalette('not an array')).toThrow();
	});
});

// ============================================================================
//  COLOR GLYPH CREATION
// ============================================================================

describe('createColorGlyph', () => {
	it('should create a v0 layer-based color glyph', () => {
		const cg = createColorGlyph({
			name: 'A',
			layers: [
				{ glyph: 'A.shadow', paletteIndex: 0 },
				{ glyph: 'A.fill', paletteIndex: 1 },
			],
		});
		expect(cg.name).toBe('A');
		expect(cg.layers).toHaveLength(2);
		expect(cg.layers[0]).toEqual({ glyph: 'A.shadow', paletteIndex: 0 });
	});

	it('should create a v1 paint-based color glyph', () => {
		const cg = createColorGlyph({
			name: 'B',
			paint: { format: 2, paletteIndex: 0, alpha: 1.0 },
		});
		expect(cg.name).toBe('B');
		expect(cg.paint.format).toBe(2);
	});

	it('should throw when name is missing', () => {
		expect(() => createColorGlyph({ layers: [] })).toThrow('name');
	});

	it('should throw when neither layers nor paint provided', () => {
		expect(() => createColorGlyph({ name: 'X' })).toThrow('layers');
	});

	it('should throw on invalid layer (missing glyph)', () => {
		expect(() =>
			createColorGlyph({ name: 'A', layers: [{ paletteIndex: 0 }] }),
		).toThrow('glyph');
	});

	it('should throw on invalid layer (missing paletteIndex)', () => {
		expect(() =>
			createColorGlyph({ name: 'A', layers: [{ glyph: 'A.l0' }] }),
		).toThrow('paletteIndex');
	});
});

// ============================================================================
//  GLYPH ID ↔ NAME MAPS
// ============================================================================

describe('glyph ID maps', () => {
	const glyphs = [
		{ name: '.notdef' },
		{ name: 'space' },
		{ name: 'A' },
		{ name: 'B' },
	];

	it('buildGlyphIdToNameMap should map index → name', () => {
		const map = buildGlyphIdToNameMap(glyphs);
		expect(map.get(0)).toBe('.notdef');
		expect(map.get(2)).toBe('A');
		expect(map.size).toBe(4);
	});

	it('buildNameToGlyphIdMap should map name → index', () => {
		const map = buildNameToGlyphIdMap(glyphs);
		expect(map.get('A')).toBe(2);
		expect(map.get('.notdef')).toBe(0);
	});
});

// ============================================================================
//  PAINT TREE GLYPH ID RESOLUTION
// ============================================================================

describe('paint tree glyph resolution', () => {
	it('should resolve numeric glyphIDs to names', () => {
		const paint = {
			format: 10,
			glyphID: 2,
			paint: { format: 2, paletteIndex: 0, alpha: 1.0 },
		};
		const idToName = new Map([
			[0, '.notdef'],
			[1, 'space'],
			[2, 'A'],
		]);
		resolvePaintGlyphIds(paint, idToName);
		expect(paint.glyphID).toBe('A');
	});

	it('should resolve names back to numeric IDs', () => {
		const paint = {
			format: 10,
			glyphID: 'A',
			paint: { format: 2, paletteIndex: 0, alpha: 1.0 },
		};
		const nameToId = new Map([
			['.notdef', 0],
			['space', 1],
			['A', 2],
		]);
		resolvePaintGlyphNames(paint, nameToId);
		expect(paint.glyphID).toBe(2);
	});

	it('should recurse into PaintComposite children', () => {
		const paint = {
			format: 32,
			compositeMode: 0,
			sourcePaint: {
				format: 10,
				glyphID: 2,
				paint: { format: 2, paletteIndex: 0, alpha: 1.0 },
			},
			backdropPaint: {
				format: 10,
				glyphID: 3,
				paint: { format: 2, paletteIndex: 1, alpha: 1.0 },
			},
		};
		const idToName = new Map([
			[2, 'A'],
			[3, 'B'],
		]);
		resolvePaintGlyphIds(paint, idToName);
		expect(paint.sourcePaint.glyphID).toBe('A');
		expect(paint.backdropPaint.glyphID).toBe('B');
	});
});

// ============================================================================
//  SIMPLIFY/EXPAND ROUND-TRIP — COLRv0 (BungeeTint)
// ============================================================================

describe('Color font simplify/expand round-trip', () => {
	function loadFont(filename) {
		const buf = fs.readFileSync(path.join(SAMPLES, filename));
		return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
	}

	it('should simplify BungeeTint palettes to hex arrays', () => {
		const font = FontFlux.open(loadFont('BungeeTint-Regular.ttf'));

		expect(font._data.palettes).toBeDefined();
		expect(font._data.palettes.length).toBeGreaterThan(0);

		// Each palette should be an array of hex strings
		for (const palette of font._data.palettes) {
			for (const color of palette) {
				expect(color).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/);
			}
		}
	});

	it('should simplify BungeeTint COLR to color glyphs with layers', () => {
		const font = FontFlux.open(loadFont('BungeeTint-Regular.ttf'));

		expect(font._data.colorGlyphs).toBeDefined();
		expect(font._data.colorGlyphs.length).toBeGreaterThan(0);

		// Each color glyph should have name and layers
		for (const cg of font._data.colorGlyphs) {
			expect(cg.name).toBeDefined();
			expect(cg.layers).toBeDefined();
			expect(cg.layers.length).toBeGreaterThan(0);
			for (const layer of cg.layers) {
				expect(layer.glyph).toBeDefined();
				expect(typeof layer.paletteIndex).toBe('number');
			}
		}
	});

	it('should round-trip BungeeTint color data through export/reimport', () => {
		const buffer = loadFont('BungeeTint-Regular.ttf');
		const font = FontFlux.open(buffer);

		const originalPalettes = structuredClone(font._data.palettes);
		const originalColorGlyphCount = font._data.colorGlyphs.length;

		// Export and reimport
		const exported = font.export();
		const reimported = FontFlux.open(exported);

		// Palettes should match
		expect(reimported._data.palettes).toEqual(originalPalettes);

		// Color glyph count should match
		expect(reimported._data.colorGlyphs.length).toBe(originalColorGlyphCount);

		// Spot check: first color glyph layers should match
		const origFirst = font._data.colorGlyphs[0];
		const reimFirst = reimported._data.colorGlyphs[0];
		expect(reimFirst.name).toBe(origFirst.name);
		expect(reimFirst.layers.length).toBe(origFirst.layers.length);
	});
});

// ============================================================================
//  FONTFLUX COLOR API
// ============================================================================

describe('FontFlux color API', () => {
	it('should add and retrieve palettes', () => {
		const font = FontFlux.create({ family: 'Color Test' });

		const idx = font.addPalette(['#FF0000', '#00FF00', '#0000FF']);
		expect(idx).toBe(0);
		expect(font.palettes).toHaveLength(1);
		expect(font.getPalette(0)).toEqual(['#ff0000', '#00ff00', '#0000ff']);
	});

	it('should remove palettes', () => {
		const font = FontFlux.create({ family: 'Color Test' });
		font.addPalette(['#FF0000']);
		font.addPalette(['#00FF00']);

		expect(font.removePalette(0)).toBe(true);
		expect(font.palettes).toHaveLength(1);
		expect(font.getPalette(0)).toEqual(['#00ff00']);
	});

	it('should update a single palette color', () => {
		const font = FontFlux.create({ family: 'Color Test' });
		font.addPalette(['#FF0000', '#00FF00']);

		font.setPaletteColor(0, 1, '#0000FF');
		expect(font.getPalette(0)[1]).toBe('#0000ff');
	});

	it('should throw on invalid palette color update', () => {
		const font = FontFlux.create({ family: 'Color Test' });
		font.addPalette(['#FF0000']);

		expect(() => font.setPaletteColor(5, 0, '#000')).toThrow('does not exist');
		expect(() => font.setPaletteColor(0, 5, '#000')).toThrow('out of range');
	});

	it('should add and retrieve color glyphs (v0 layers)', () => {
		const font = FontFlux.create({ family: 'Color Test' });

		// Add layer glyphs
		font.addGlyph({
			name: 'A',
			unicode: 65,
			advanceWidth: 600,
			contours: [
				[
					{ x: 0, y: 0, onCurve: true },
					{ x: 300, y: 700, onCurve: true },
					{ x: 600, y: 0, onCurve: true },
				],
			],
		});
		font.addGlyph({
			name: 'A.shadow',
			advanceWidth: 600,
			contours: [
				[
					{ x: 10, y: -10, onCurve: true },
					{ x: 310, y: 690, onCurve: true },
					{ x: 610, y: -10, onCurve: true },
				],
			],
		});
		font.addGlyph({
			name: 'A.fill',
			advanceWidth: 600,
			contours: [
				[
					{ x: 0, y: 0, onCurve: true },
					{ x: 300, y: 700, onCurve: true },
					{ x: 600, y: 0, onCurve: true },
				],
			],
		});

		font.addPalette(['#000000', '#FF0000']);

		font.addColorGlyph({
			name: 'A',
			layers: [
				{ glyph: 'A.shadow', paletteIndex: 0 },
				{ glyph: 'A.fill', paletteIndex: 1 },
			],
		});

		expect(font.colorGlyphs).toHaveLength(1);
		expect(font.getColorGlyph('A')).toBeDefined();
		expect(font.getColorGlyph('A').layers).toHaveLength(2);
		expect(font.listColorGlyphs()).toEqual([{ name: 'A', type: 'layers' }]);
	});

	it('should replace existing color glyph on re-add', () => {
		const font = FontFlux.create({ family: 'Color Test' });
		font.addGlyph({
			name: 'A',
			unicode: 65,
			advanceWidth: 600,
			contours: [[{ x: 0, y: 0, onCurve: true }]],
		});
		font.addGlyph({
			name: 'A.l0',
			advanceWidth: 600,
			contours: [[{ x: 0, y: 0, onCurve: true }]],
		});
		font.addGlyph({
			name: 'A.l1',
			advanceWidth: 600,
			contours: [[{ x: 0, y: 0, onCurve: true }]],
		});

		font.addColorGlyph({
			name: 'A',
			layers: [{ glyph: 'A.l0', paletteIndex: 0 }],
		});
		font.addColorGlyph({
			name: 'A',
			layers: [{ glyph: 'A.l1', paletteIndex: 1 }],
		});

		expect(font.colorGlyphs).toHaveLength(1);
		expect(font.colorGlyphs[0].layers[0].glyph).toBe('A.l1');
	});

	it('should remove color glyphs', () => {
		const font = FontFlux.create({ family: 'Color Test' });
		font.addGlyph({
			name: 'A',
			unicode: 65,
			advanceWidth: 600,
			contours: [[{ x: 0, y: 0, onCurve: true }]],
		});
		font.addGlyph({
			name: 'A.l0',
			advanceWidth: 600,
			contours: [[{ x: 0, y: 0, onCurve: true }]],
		});

		font.addColorGlyph({
			name: 'A',
			layers: [{ glyph: 'A.l0', paletteIndex: 0 }],
		});
		expect(font.removeColorGlyph('A')).toBe(true);
		expect(font.colorGlyphs).toHaveLength(0);
	});

	it('should round-trip from-scratch color font through export/reimport', () => {
		const font = FontFlux.create({ family: 'Color Round Trip' });

		// Base glyph + layer glyphs
		font.addGlyph({
			name: 'A',
			unicode: 65,
			advanceWidth: 600,
			contours: [
				[
					{ x: 0, y: 0, onCurve: true },
					{ x: 300, y: 700, onCurve: true },
					{ x: 600, y: 0, onCurve: true },
				],
			],
		});
		font.addGlyph({
			name: 'A.shadow',
			advanceWidth: 600,
			contours: [
				[
					{ x: 10, y: -10, onCurve: true },
					{ x: 310, y: 690, onCurve: true },
					{ x: 610, y: -10, onCurve: true },
				],
			],
		});
		font.addGlyph({
			name: 'A.fill',
			advanceWidth: 600,
			contours: [
				[
					{ x: 0, y: 0, onCurve: true },
					{ x: 300, y: 700, onCurve: true },
					{ x: 600, y: 0, onCurve: true },
				],
			],
		});

		// Palette
		font.addPalette(['#333333', '#ff0000']);

		// Color glyph
		font.addColorGlyph({
			name: 'A',
			layers: [
				{ glyph: 'A.shadow', paletteIndex: 0 },
				{ glyph: 'A.fill', paletteIndex: 1 },
			],
		});

		// Export → reimport
		const buffer = font.export();
		const reimported = FontFlux.open(buffer);

		// Verify palette round-tripped
		expect(reimported._data.palettes).toBeDefined();
		expect(reimported._data.palettes[0]).toEqual(['#333333', '#ff0000']);

		// Verify color glyph round-tripped
		expect(reimported._data.colorGlyphs).toBeDefined();
		expect(reimported._data.colorGlyphs.length).toBe(1);
		const cg = reimported._data.colorGlyphs[0];
		expect(cg.name).toBe('A');
		expect(cg.layers).toHaveLength(2);
		expect(cg.layers[0].glyph).toBe('A.shadow');
		expect(cg.layers[0].paletteIndex).toBe(0);
		expect(cg.layers[1].glyph).toBe('A.fill');
		expect(cg.layers[1].paletteIndex).toBe(1);
	});
});
