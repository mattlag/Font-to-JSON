/**
 * Tests for the COLR (Color) table parser / writer.
 */
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFontTables } from '../../src/main.js';
import { parseCOLR, writeCOLR } from '../../src/sfnt/table_COLR.js';

const SAMPLES = path.resolve('test/sample fonts');

/**
 * Helper: load a font and return the parsed COLR table.
 */
function loadCOLR(filename) {
	const buf = fs.readFileSync(path.join(SAMPLES, filename));
	const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
	const font = importFontTables(ab);
	return { font, colr: font.tables['COLR'] };
}

describe('COLR table', () => {
	// == Parsing ========================================================

	it('should parse the COLR table from BungeeTint-Regular.ttf', () => {
		const { colr } = loadCOLR('BungeeTint-Regular.ttf');

		expect(colr).toBeDefined();
		expect(colr.version).toBe(0);
		expect(colr.baseGlyphRecords.length).toBe(1049);
		expect(colr.layerRecords.length).toBe(2098);
	});

	it('should have correct base glyph record structure', () => {
		const { colr } = loadCOLR('BungeeTint-Regular.ttf');

		const first = colr.baseGlyphRecords[0];
		expect(first).toHaveProperty('glyphID');
		expect(first).toHaveProperty('firstLayerIndex');
		expect(first).toHaveProperty('numLayers');
		expect(typeof first.glyphID).toBe('number');

		// BungeeTint uses two layers per base glyph
		for (const rec of colr.baseGlyphRecords) {
			expect(rec.numLayers).toBe(2);
		}
	});

	it('should have correct layer record structure', () => {
		const { colr } = loadCOLR('BungeeTint-Regular.ttf');

		const first = colr.layerRecords[0];
		expect(first).toHaveProperty('glyphID');
		expect(first).toHaveProperty('paletteIndex');
		expect(typeof first.glyphID).toBe('number');
		expect(typeof first.paletteIndex).toBe('number');
	});

	it('should have correct values for the first base glyph', () => {
		const { colr } = loadCOLR('BungeeTint-Regular.ttf');

		const first = colr.baseGlyphRecords[0];
		expect(first.glyphID).toBe(0);
		expect(first.firstLayerIndex).toBe(0);
		expect(first.numLayers).toBe(2);

		// First two layer records belong to base glyph 0
		expect(colr.layerRecords[0].paletteIndex).toBe(0);
		expect(colr.layerRecords[1].paletteIndex).toBe(1);
	});

	it('should not have v1Header for a v0 font', () => {
		const { colr } = loadCOLR('BungeeTint-Regular.ttf');

		expect(colr.v1Header).toBeUndefined();
		expect(colr._v1RawBytes).toBeUndefined();
	});

	it('should not have _raw (fully parsed)', () => {
		const { colr } = loadCOLR('BungeeTint-Regular.ttf');
		expect(colr._raw).toBeUndefined();
	});

	// == Round-trip ======================================================

	it('should round-trip COLR from BungeeTint-Regular.ttf', () => {
		const buf = fs.readFileSync(path.join(SAMPLES, 'BungeeTint-Regular.ttf'));
		const ab = buf.buffer.slice(
			buf.byteOffset,
			buf.byteOffset + buf.byteLength,
		);
		const font = importFontTables(ab);

		const exported = exportFont(font);
		const reimported = importFontTables(exported);
		const orig = font.tables['COLR'];
		const rt = reimported.tables['COLR'];

		expect(rt.version).toBe(orig.version);
		expect(rt.baseGlyphRecords.length).toBe(orig.baseGlyphRecords.length);
		expect(rt.layerRecords.length).toBe(orig.layerRecords.length);

		// Spot-check a few records
		for (let i = 0; i < Math.min(orig.baseGlyphRecords.length, 10); i++) {
			expect(rt.baseGlyphRecords[i]).toEqual(orig.baseGlyphRecords[i]);
		}
		for (let i = 0; i < Math.min(orig.layerRecords.length, 10); i++) {
			expect(rt.layerRecords[i]).toEqual(orig.layerRecords[i]);
		}
	});

	// == Synthetic =======================================================

	it('should handle a synthetic v0 COLR table', () => {
		const original = {
			version: 0,
			baseGlyphRecords: [
				{ glyphID: 5, firstLayerIndex: 0, numLayers: 2 },
				{ glyphID: 10, firstLayerIndex: 2, numLayers: 3 },
			],
			layerRecords: [
				{ glyphID: 5, paletteIndex: 0 },
				{ glyphID: 6, paletteIndex: 1 },
				{ glyphID: 10, paletteIndex: 0 },
				{ glyphID: 11, paletteIndex: 2 },
				{ glyphID: 12, paletteIndex: 1 },
			],
		};

		const bytes = writeCOLR(original);
		const parsed = parseCOLR(bytes);

		expect(parsed.version).toBe(0);
		expect(parsed.baseGlyphRecords.length).toBe(2);
		expect(parsed.layerRecords.length).toBe(5);
		expect(parsed.baseGlyphRecords[0]).toEqual(original.baseGlyphRecords[0]);
		expect(parsed.baseGlyphRecords[1]).toEqual(original.baseGlyphRecords[1]);
		expect(parsed.layerRecords[2]).toEqual(original.layerRecords[2]);
	});
});
