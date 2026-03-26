/**
 * Round-trip test
 * Import a sample font -> JSON -> export back to binary -> re-import -> compare JSON.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFont } from '../src/main.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');

describe('Round-trip: OTF', () => {
	it('should produce identical JSON after import -> export -> re-import', async () => {
		const filePath = resolve(SAMPLES_DIR, 'oblegg.otf');
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);

		const exported = exportFont(firstImport);

		// Re-import the exported binary
		const secondImport = importFont(exported);

		expect(secondImport).toEqual(firstImport);
	});
});

describe('Round-trip: TTF', () => {
	it('should produce identical JSON after import -> export -> re-import', async () => {
		const filePath = resolve(SAMPLES_DIR, 'oblegg.ttf');
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);

		const exported = exportFont(firstImport);

		const secondImport = importFont(exported);

		expect(secondImport).toEqual(firstImport);
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
			const exported = exportFont(firstImport);
			const secondImport = importFont(exported);

			expect(secondImport, `TTC round-trip mismatch for ${sample}`).toEqual(
				firstImport,
			);
		}
	}, 60000);
});

describe('Collection: OTC (CFF outlines)', () => {
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

	it('should export and re-import OTC-style collections without errors', async () => {
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

		const exported = exportFont(firstImport);
		const secondImport = importFont(exported);

		expect(secondImport).toEqual(firstImport);
	}, 60000);
});
