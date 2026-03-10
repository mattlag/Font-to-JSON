/**
 * Tests for the CPAL (Color Palette) table parser / writer.
 */
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFont } from '../../src/main.js';
import { parseCPAL, writeCPAL } from '../../src/sfnt/table_CPAL.js';

const SAMPLES = path.resolve('test/sample fonts');

/**
 * Helper: load a font and return the parsed CPAL table.
 */
function loadCPAL(filename) {
	const buf = fs.readFileSync(path.join(SAMPLES, filename));
	const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
	const font = importFont(ab).raw;
	return { font, cpal: font.tables.CPAL };
}

describe('CPAL table', () => {
	// == Parsing =========================================================

	it('should parse the CPAL table from BungeeTint-Regular.ttf', () => {
		const { cpal } = loadCPAL('BungeeTint-Regular.ttf');

		expect(cpal).toBeDefined();
		expect(cpal.version).toBe(0);
		expect(cpal.numPaletteEntries).toBe(2);
		expect(cpal.palettes.length).toBeGreaterThan(0);
	});

	it('should have valid BGRA color records', () => {
		const { cpal } = loadCPAL('BungeeTint-Regular.ttf');

		for (const palette of cpal.palettes) {
			expect(palette.length).toBe(cpal.numPaletteEntries);
			for (const color of palette) {
				expect(color).toHaveProperty('red');
				expect(color).toHaveProperty('green');
				expect(color).toHaveProperty('blue');
				expect(color).toHaveProperty('alpha');
				expect(color.red).toBeGreaterThanOrEqual(0);
				expect(color.red).toBeLessThanOrEqual(255);
				expect(color.alpha).toBeGreaterThanOrEqual(0);
				expect(color.alpha).toBeLessThanOrEqual(255);
			}
		}
	});

	it('should parse multiple palettes', () => {
		const { cpal } = loadCPAL('BungeeTint-Regular.ttf');

		// BungeeTint has multiple palettes
		expect(cpal.palettes.length).toBeGreaterThan(1);
	});

	it('should have known palette 0 colors', () => {
		const { cpal } = loadCPAL('BungeeTint-Regular.ttf');

		// Palette 0, entry 0: red=201, green=9, blue=0
		const c0 = cpal.palettes[0][0];
		expect(c0.red).toBe(201);
		expect(c0.green).toBe(9);
		expect(c0.blue).toBe(0);
		expect(c0.alpha).toBe(255);
	});

	it('should not have _raw (fully parsed)', () => {
		const { cpal } = loadCPAL('BungeeTint-Regular.ttf');
		expect(cpal._raw).toBeUndefined();
	});

	// == Round-trip ======================================================

	it('should round-trip CPAL from BungeeTint-Regular.ttf', () => {
		const buf = fs.readFileSync(path.join(SAMPLES, 'BungeeTint-Regular.ttf'));
		const ab = buf.buffer.slice(
			buf.byteOffset,
			buf.byteOffset + buf.byteLength,
		);
		const font = importFont(ab).raw;

		const exported = exportFont(font);
		const reimported = importFont(exported).raw;

		expect(reimported.tables.CPAL.version).toBe(font.tables.CPAL.version);
		expect(reimported.tables.CPAL.numPaletteEntries).toBe(
			font.tables.CPAL.numPaletteEntries,
		);
		expect(reimported.tables.CPAL.palettes).toEqual(font.tables.CPAL.palettes);
	});

	// == Synthetic =======================================================

	it('should handle a synthetic v0 CPAL with 1 palette, 3 entries', () => {
		const original = {
			version: 0,
			numPaletteEntries: 3,
			palettes: [
				[
					{ blue: 255, green: 0, red: 0, alpha: 255 },
					{ blue: 0, green: 255, red: 0, alpha: 128 },
					{ blue: 0, green: 0, red: 255, alpha: 64 },
				],
			],
		};

		const bytes = writeCPAL(original);
		const parsed = parseCPAL(bytes);

		expect(parsed.version).toBe(0);
		expect(parsed.numPaletteEntries).toBe(3);
		expect(parsed.palettes.length).toBe(1);
		expect(parsed.palettes[0]).toEqual(original.palettes[0]);
	});

	it('should handle a synthetic v1 CPAL with paletteTypes and labels', () => {
		const original = {
			version: 1,
			numPaletteEntries: 2,
			palettes: [
				[
					{ blue: 100, green: 50, red: 200, alpha: 255 },
					{ blue: 0, green: 0, red: 0, alpha: 255 },
				],
				[
					{ blue: 255, green: 255, red: 255, alpha: 255 },
					{ blue: 128, green: 128, red: 128, alpha: 200 },
				],
			],
			paletteTypes: [0x0001, 0x0002], // LIGHT, DARK
			paletteLabels: [256, 257],
			paletteEntryLabels: [258, 259],
		};

		const bytes = writeCPAL(original);
		const parsed = parseCPAL(bytes);

		expect(parsed.version).toBe(1);
		expect(parsed.numPaletteEntries).toBe(2);
		expect(parsed.palettes).toEqual(original.palettes);
		expect(parsed.paletteTypes).toEqual([0x0001, 0x0002]);
		expect(parsed.paletteLabels).toEqual([256, 257]);
		expect(parsed.paletteEntryLabels).toEqual([258, 259]);
	});
});
