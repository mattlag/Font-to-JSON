/**
 * Tests for GSUB table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFontTables } from '../../src/import.js';
import { parseGSUB, writeGSUB } from '../../src/sfnt/table_GSUB.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

// Fonts known to contain a GSUB table:
// oblegg.ttf, oblegg.otf, fira.ttf, noto.ttf, BungeeTint, EmojiOneColor

describe('GSUB table parsing', () => {
	it('should parse GSUB from oblegg.ttf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gsub = font.tables['GSUB'];

		expect(gsub).toBeDefined();
		expect(gsub._raw).toBeUndefined();
		expect(gsub.majorVersion).toBe(1);
		expect(gsub.scriptList).toBeDefined();
		expect(gsub.featureList).toBeDefined();
		expect(gsub.lookupList).toBeDefined();
	});

	it('should parse GSUB from fira.ttf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'fira.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gsub = font.tables['GSUB'];

		expect(gsub).toBeDefined();
		expect(gsub.majorVersion).toBe(1);
		expect(gsub.lookupList.lookups.length).toBeGreaterThan(0);
	});

	it('should parse GSUB from noto.ttf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'noto.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gsub = font.tables['GSUB'];

		expect(gsub).toBeDefined();
		expect(gsub.majorVersion).toBe(1);
	});

	it('should have scriptList with script records', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'fira.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gsub = font.tables['GSUB'];

		expect(Array.isArray(gsub.scriptList.scriptRecords)).toBe(true);
		expect(gsub.scriptList.scriptRecords.length).toBeGreaterThan(0);
		expect(gsub.scriptList.scriptRecords[0].scriptTag).toBeDefined();
	});

	it('should have featureList with tagged features', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'fira.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gsub = font.tables['GSUB'];

		expect(Array.isArray(gsub.featureList.featureRecords)).toBe(true);
		expect(gsub.featureList.featureRecords.length).toBeGreaterThan(0);
		expect(gsub.featureList.featureRecords[0].featureTag).toBeDefined();
	});

	it('should not have _raw on parsed GSUB', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gsub = font.tables['GSUB'];

		expect(gsub._raw).toBeUndefined();
		expect(gsub._checksum).toBeTypeOf('number');
	});
});

describe('GSUB table round-trip', () => {
	for (const fontFile of ['oblegg.ttf', 'fira.ttf', 'noto.ttf']) {
		it(`should round-trip GSUB from ${fontFile}`, async () => {
			const buffer = (await readFile(resolve(SAMPLES_DIR, fontFile))).buffer;
			const font = importFontTables(buffer);
			const { _checksum, ...gsubData } = font.tables['GSUB'];

			const writtenBytes = writeGSUB(gsubData);
			const reparsed = parseGSUB(writtenBytes);

			expect(reparsed).toEqual(gsubData);
		});
	}
});
