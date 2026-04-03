/**
 * FontFlux class tests.
 *
 * Tests the v2 public API: FontFlux.create(), FontFlux.open(), instance methods,
 * and the reconciliation behavior (edits to simplified fields are honoured on export).
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FontFlux } from '../src/font_flux.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');

// ============================================================================
//  FontFlux.create() — Scenario 2
// ============================================================================

describe('FontFlux.create()', () => {
	it('should create a minimal font with .notdef and space', () => {
		const font = FontFlux.create({ family: 'Test' });

		expect(font.info.familyName).toBe('Test');
		expect(font.info.styleName).toBe('Regular');
		expect(font.info.unitsPerEm).toBe(1000);
		expect(font.glyphCount).toBe(2);
		expect(font.glyphs[0].name).toBe('.notdef');
		expect(font.glyphs[1].name).toBe('space');
		expect(font.glyphs[1].unicode).toBe(32);
		expect(font.kerning).toEqual([]);
	});

	it('should accept custom metrics', () => {
		const font = FontFlux.create({
			family: 'Custom',
			style: 'Bold',
			unitsPerEm: 2048,
			ascender: 1800,
			descender: -500,
		});

		expect(font.info.familyName).toBe('Custom');
		expect(font.info.styleName).toBe('Bold');
		expect(font.info.unitsPerEm).toBe(2048);
		expect(font.info.ascender).toBe(1800);
		expect(font.info.descender).toBe(-500);
	});

	it('should produce a valid exportable font', () => {
		const font = FontFlux.create({ family: 'Exportable' });
		const buffer = font.export({ format: 'sfnt' });

		expect(buffer).toBeInstanceOf(ArrayBuffer);
		expect(buffer.byteLength).toBeGreaterThan(0);

		// Re-import should work
		const reimported = FontFlux.open(buffer);
		expect(reimported.info.familyName).toBe('Exportable');
		expect(reimported.glyphCount).toBe(2);
	});

	it('should use defaults when no options given', () => {
		const font = FontFlux.create();
		expect(font.info.familyName).toBe('Untitled');
		expect(font.info.unitsPerEm).toBe(1000);
	});
});

// ============================================================================
//  FontFlux.open() — Scenario 1
// ============================================================================

describe('FontFlux.open()', () => {
	it('should open a TTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = FontFlux.open(buffer);

		expect(font.info.familyName).toBe('Oblegg');
		expect(font.glyphCount).toBeGreaterThan(0);
		expect(font.format).toBe('truetype');
	});

	it('should open an OTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = FontFlux.open(buffer);

		expect(font.info.familyName).toBe('Oblegg');
		expect(font.format).toBe('cff');
	});

	it('should throw on collection files', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'cambria-test.ttc')))
			.buffer;
		expect(() => FontFlux.open(buffer)).toThrow(/collection/i);
	});
});

// ============================================================================
//  FontFlux.openAll()
// ============================================================================

describe('FontFlux.openAll()', () => {
	it('should return array of FontFlux instances for TTC', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'cambria-test.ttc')))
			.buffer;
		const fonts = FontFlux.openAll(buffer);

		expect(fonts.length).toBeGreaterThan(1);
		expect(fonts[0]).toBeInstanceOf(FontFlux);
		expect(fonts[0].info.familyName).toBeTruthy();
	});

	it('should return single-element array for single font files', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const fonts = FontFlux.openAll(buffer);

		expect(fonts.length).toBe(1);
		expect(fonts[0]).toBeInstanceOf(FontFlux);
	});
});

// ============================================================================
//  Font Info
// ============================================================================

describe('Font info', () => {
	it('getInfo() returns the font metadata', () => {
		const font = FontFlux.create({ family: 'Info Test' });
		const info = font.getInfo();
		expect(info.familyName).toBe('Info Test');
		expect(info).toBe(font.info); // same reference
	});

	it('setInfo() merges partial updates', () => {
		const font = FontFlux.create({ family: 'Before' });
		font.setInfo({ familyName: 'After', weightClass: 700 });

		expect(font.info.familyName).toBe('After');
		expect(font.info.weightClass).toBe(700);
		expect(font.info.styleName).toBe('Regular'); // unchanged
	});
});

// ============================================================================
//  Glyphs
// ============================================================================

describe('Glyph operations', () => {
	it('listGlyphs() returns summary', () => {
		const font = FontFlux.create({ family: 'Test' });
		const list = font.listGlyphs();
		expect(list).toEqual([
			{ name: '.notdef', unicode: null, index: 0 },
			{ name: 'space', unicode: 32, index: 1 },
		]);
	});

	it('getGlyph() by name', () => {
		const font = FontFlux.create({ family: 'Test' });
		const g = font.getGlyph('.notdef');
		expect(g).toBeDefined();
		expect(g.name).toBe('.notdef');
	});

	it('getGlyph() by unicode', () => {
		const font = FontFlux.create({ family: 'Test' });
		expect(font.getGlyph(32)?.name).toBe('space');
	});

	it('hasGlyph() checks existence', () => {
		const font = FontFlux.create({ family: 'Test' });
		expect(font.hasGlyph('space')).toBe(true);
		expect(font.hasGlyph('A')).toBe(false);
	});

	it('addGlyph() appends new glyphs', () => {
		const font = FontFlux.create({ family: 'Test' });
		font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 600 });

		expect(font.glyphCount).toBe(3);
		expect(font.getGlyph('A')?.advanceWidth).toBe(600);
	});

	it('addGlyph() replaces existing glyph by name', () => {
		const font = FontFlux.create({ family: 'Test' });
		font.addGlyph({ name: 'space', unicode: 32, advanceWidth: 999 });

		expect(font.glyphCount).toBe(2); // didn't add, replaced
		expect(font.getGlyph('space')?.advanceWidth).toBe(999);
	});

	it('removeGlyph() by name', () => {
		const font = FontFlux.create({ family: 'Test' });
		font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 600 });
		font.addKerning({ left: 'A', right: 'space', value: -10 });

		expect(font.removeGlyph('A')).toBe(true);
		expect(font.glyphCount).toBe(2);
		expect(font.hasGlyph('A')).toBe(false);
		// Kerning referencing 'A' should be cleaned up
		expect(font.kerning.length).toBe(0);
	});

	it('removeGlyph() by unicode', () => {
		const font = FontFlux.create({ family: 'Test' });
		font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 600 });

		expect(font.removeGlyph(65)).toBe(true);
		expect(font.hasGlyph('A')).toBe(false);
	});

	it('removeGlyph() returns false for non-existent glyph', () => {
		const font = FontFlux.create({ family: 'Test' });
		expect(font.removeGlyph('Z')).toBe(false);
	});
});

// ============================================================================
//  Kerning
// ============================================================================

describe('Kerning operations', () => {
	it('addKerning() with flat pair', () => {
		const font = FontFlux.create({ family: 'Test' });
		font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 600 });
		font.addGlyph({ name: 'V', unicode: 86, advanceWidth: 600 });
		font.addKerning({ left: 'A', right: 'V', value: -80 });

		expect(font.kerning.length).toBe(1);
		expect(font.getKerning('A', 'V')).toBe(-80);
	});

	it('addKerning() deduplicates (last-write-wins)', () => {
		const font = FontFlux.create({ family: 'Test' });
		font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 600 });
		font.addGlyph({ name: 'V', unicode: 86, advanceWidth: 600 });

		font.addKerning({ left: 'A', right: 'V', value: -80 });
		font.addKerning({ left: 'A', right: 'V', value: -100 });

		expect(font.kerning.length).toBe(1);
		expect(font.getKerning('A', 'V')).toBe(-100);
	});

	it('removeKerning() removes a pair', () => {
		const font = FontFlux.create({ family: 'Test' });
		font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 600 });
		font.addGlyph({ name: 'V', unicode: 86, advanceWidth: 600 });
		font.addKerning({ left: 'A', right: 'V', value: -80 });

		expect(font.removeKerning('A', 'V')).toBe(true);
		expect(font.kerning.length).toBe(0);
	});

	it('clearKerning() removes all pairs', () => {
		const font = FontFlux.create({ family: 'Test' });
		font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 600 });
		font.addGlyph({ name: 'V', unicode: 86, advanceWidth: 600 });
		font.addKerning({ left: 'A', right: 'V', value: -80 });

		font.clearKerning();
		expect(font.kerning.length).toBe(0);
	});
});

// ============================================================================
//  Critical: Reconciliation (edits honoured on export)
// ============================================================================

describe('Reconciliation: edits to imported fonts are honoured on export', () => {
	it('familyName change survives export', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = FontFlux.open(buffer);

		font.setInfo({ familyName: 'Renamed Font' });

		const exported = font.export({ format: 'sfnt' });
		const reimported = FontFlux.open(exported);

		expect(reimported.info.familyName).toBe('Renamed Font');
	});

	it('adding a glyph survives export', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = FontFlux.open(buffer);
		const originalCount = font.glyphCount;

		font.addGlyph({
			name: 'testglyph',
			unicode: 0xe000,
			advanceWidth: 500,
			contours: [
				[
					{ x: 0, y: 0, onCurve: true },
					{ x: 500, y: 0, onCurve: true },
					{ x: 500, y: 700, onCurve: true },
					{ x: 0, y: 700, onCurve: true },
				],
			],
		});

		const exported = font.export({ format: 'sfnt' });
		const reimported = FontFlux.open(exported);

		expect(reimported.glyphCount).toBe(originalCount + 1);
		expect(reimported.hasGlyph('testglyph')).toBe(true);
	});

	it('kerning edits survive export', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = FontFlux.open(buffer);

		font.addKerning({ left: 'A', right: 'V', value: -999 });

		const exported = font.export({ format: 'sfnt' });
		const reimported = FontFlux.open(exported);

		expect(reimported.getKerning('A', 'V')).toBe(-999);
	});

	it('no-edit export preserves non-decomposed tables', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = FontFlux.open(buffer);
		const originalTableTags = Object.keys(font.tables || {}).sort();

		const exported = font.export({ format: 'sfnt' });
		const reimported = FontFlux.open(exported);
		const newTableTags = Object.keys(reimported.tables || {}).sort();

		// Non-decomposed tables should still be present
		for (const tag of originalTableTags) {
			// Some tables may be rebuilt differently, but they should exist
			expect(newTableTags).toContain(tag);
		}
	});
});

// ============================================================================
//  JSON round-trip
// ============================================================================

describe('JSON serialization', () => {
	it('toJSON() and fromJSON() round-trip', () => {
		const font = FontFlux.create({ family: 'JSON Test' });
		font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 600 });

		const json = font.toJSON();
		const restored = FontFlux.fromJSON(json);

		expect(restored.info.familyName).toBe('JSON Test');
		expect(restored.glyphCount).toBe(3);
		expect(restored.getGlyph('A')?.advanceWidth).toBe(600);
	});
});

// ============================================================================
//  Detach
// ============================================================================

describe('detach()', () => {
	it('strips _header and tables from imported font', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = FontFlux.open(buffer);

		expect(font.tables).toBeDefined();

		font.detach();

		expect(font.tables).toBeUndefined();
		// Should still export (hand-authored path)
		const exported = font.export({ format: 'sfnt' });
		expect(exported.byteLength).toBeGreaterThan(0);
	});

	it('returns this for chaining', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = FontFlux.open(buffer);
		const result = font.detach();
		expect(result).toBe(font);
	});
});

// ============================================================================
//  Validate
// ============================================================================

describe('validate()', () => {
	it('validates a created font', () => {
		const font = FontFlux.create({ family: 'Valid' });
		const result = font.validate();
		expect(result).toHaveProperty('valid');
		expect(result).toHaveProperty('errors');
	});
});

// ============================================================================
//  Static utilities
// ============================================================================

describe('Static utilities', () => {
	it('svgToContours() converts SVG path', () => {
		const contours = FontFlux.svgToContours(
			'M0 0 L100 0 L100 100 Z',
			'truetype',
		);
		expect(contours.length).toBeGreaterThan(0);
	});

	it('contoursToSVG() converts contours to SVG', () => {
		const contours = [
			[
				{ x: 0, y: 0, onCurve: true },
				{ x: 100, y: 0, onCurve: true },
				{ x: 100, y: 100, onCurve: true },
			],
		];
		const svg = FontFlux.contoursToSVG(contours);
		expect(typeof svg).toBe('string');
		expect(svg.length).toBeGreaterThan(0);
	});
});

// ============================================================================
//  Export collection
// ============================================================================

describe('FontFlux.exportCollection()', () => {
	it('exports multiple fonts as TTC', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'cambria-test.ttc')))
			.buffer;
		const fonts = FontFlux.openAll(buffer);

		const ttcBuffer = FontFlux.exportCollection(fonts);
		expect(ttcBuffer).toBeInstanceOf(ArrayBuffer);
		expect(ttcBuffer.byteLength).toBeGreaterThan(0);

		// Re-import should yield same number of fonts
		const reimported = FontFlux.openAll(ttcBuffer);
		expect(reimported.length).toBe(fonts.length);
	});
});
