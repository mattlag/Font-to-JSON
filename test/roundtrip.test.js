/**
 * Round-trip test
 * Import a sample font -> export -> re-import -> export -> re-import again.
 * The first cycle may normalize table structures (reconciliation rebuild),
 * but the second cycle should produce identical JSON (stabilization).
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont } from '../src/export.js';
import { importFont } from '../src/import.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');

describe('Round-trip: OTF', () => {
	it('should stabilize after one export cycle', async () => {
		const filePath = resolve(SAMPLES_DIR, 'oblegg.otf');
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);
		const exported1 = exportFont(firstImport);
		const secondImport = importFont(exported1);

		// First cycle may normalize — verify key structure is preserved
		expect(secondImport.font.familyName).toBe(firstImport.font.familyName);
		expect(secondImport.glyphs.length).toBe(firstImport.glyphs.length);

		// Second cycle must stabilize
		const exported2 = exportFont(secondImport);
		const thirdImport = importFont(exported2);
		expect(thirdImport).toEqual(secondImport);
	});
});

describe('Round-trip: TTF', () => {
	it('should stabilize after one export cycle', async () => {
		const filePath = resolve(SAMPLES_DIR, 'oblegg.ttf');
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);
		const exported1 = exportFont(firstImport);
		const secondImport = importFont(exported1);

		// First cycle may normalize — verify key structure is preserved
		expect(secondImport.font.familyName).toBe(firstImport.font.familyName);
		expect(secondImport.glyphs.length).toBe(firstImport.glyphs.length);
		expect(secondImport.kerning?.length).toBe(firstImport.kerning?.length);

		// Second cycle must stabilize
		const exported2 = exportFont(secondImport);
		const thirdImport = importFont(exported2);
		expect(thirdImport).toEqual(secondImport);
	});
});

describe('Round-trip: TTC', () => {
	it('should import a TTC collection with multiple faces', async () => {
		const filePath = resolve(SAMPLES_DIR, 'cambria-test.ttc');
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);

		expect(firstImport.collection.tag).toBe('ttcf');
		expect(Array.isArray(firstImport.fonts)).toBe(true);
		expect(firstImport.fonts.length).toBeGreaterThan(1);
	});

	it('should round-trip TTC data for cambria sample', async () => {
		const filePath = resolve(SAMPLES_DIR, 'cambria-test.ttc');
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);
		const exported = exportFont(firstImport);
		const secondImport = importFont(exported);

		expect(secondImport.collection.tag).toBe('ttcf');
		expect(secondImport.fonts.length).toBe(firstImport.fonts.length);
		expect(
			secondImport.fonts.every((font) => font.features && font.features.GPOS),
		).toBe(true);
	}, 60000);

	it('should round-trip TTC data for msgothic sample', async () => {
		const samples = ['msgothic-test.ttc'];

		for (const sample of samples) {
			const filePath = resolve(SAMPLES_DIR, sample);
			const buffer = (await readFile(filePath)).buffer;

			const firstImport = importFont(buffer);
			const exported1 = exportFont(firstImport);
			const secondImport = importFont(exported1);

			// Verify key structure preserved
			expect(secondImport.collection.tag).toBe('ttcf');
			expect(secondImport.fonts.length).toBe(firstImport.fonts.length);

			// Second cycle must stabilize
			const exported2 = exportFont(secondImport);
			const thirdImport = importFont(exported2);
			expect(thirdImport, `TTC round-trip not stable for ${sample}`).toEqual(
				secondImport,
			);
		}
	}, 60000);
});

describe.skip('Collection: OTC (CFF outlines) — skipped: OOM with 65K+ glyph CJK font', () => {
	it('should import OTC-style collection data from a CFF collection file', async () => {
		const filePath = resolve(
			SAMPLES_DIR,
			'NotoSerifCJK-Regular-otc-online-test.ttc',
		);
		const buffer = (await readFile(filePath)).buffer;

		const collection = importFont(buffer);

		expect(collection.collection.tag).toBe('ttcf');
		expect(collection.fonts.length).toBeGreaterThan(1);
		expect(
			collection.fonts.some((f) => f._header.sfVersion === 0x4f54544f),
		).toBe(true);
		expect(
			collection.fonts.some((f) => f.glyphs.some((g) => g.charString)),
		).toBe(true);
	}, 60000);

	it.skip('should export and re-import OTC-style collections without errors (skipped: OOM with 65K+ glyph CJK font)', async () => {
		const filePath = resolve(
			SAMPLES_DIR,
			'NotoSerifCJK-Regular-otc-online-test.ttc',
		);
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);
		const exported = exportFont(firstImport);
		const secondImport = importFont(exported);

		expect(secondImport.collection.tag).toBe('ttcf');
		expect(secondImport.fonts.length).toBe(firstImport.fonts.length);
		expect(
			secondImport.fonts.some((f) => f._header.sfVersion === 0x4f54544f),
		).toBe(true);
		expect(
			secondImport.fonts.some((f) => f.glyphs.some((g) => g.charString)),
		).toBe(true);
	}, 120000);
});

describe('Round-trip: Apple bitmap tables (bloc/bdat)', () => {
	it('should round-trip cour-test.ttf with bloc/bdat tables', async () => {
		const filePath = resolve(SAMPLES_DIR, 'cour-test.ttf');
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);

		// Verify bloc/bdat are fully parsed (not raw)
		expect(firstImport.tables.bloc).toBeDefined();
		expect(firstImport.tables.bloc._raw).toBeUndefined();
		expect(firstImport.tables.bdat).toBeDefined();
		expect(firstImport.tables.bdat._raw).toBeUndefined();

		// First cycle may normalize; second cycle must stabilize
		const exported1 = exportFont(firstImport);
		const secondImport = importFont(exported1);
		const exported2 = exportFont(secondImport);
		const thirdImport = importFont(exported2);

		expect(thirdImport).toEqual(secondImport);
	}, 60000);
});
