/**
 * Tests for GPOS table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFont } from '../../src/main.js';
import { parseGPOS, writeGPOS } from '../../src/sfnt/table_GPOS.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

// Fonts known to contain a GPOS table:
// oblegg.ttf, oblegg.otf, fira.ttf, noto.ttf, BungeeTint

describe('GPOS table parsing', () => {
	it('should parse GPOS from oblegg.ttf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFont(buffer);
		const gpos = font.tables['GPOS'];

		expect(gpos).toBeDefined();
		expect(gpos._raw).toBeUndefined();
		expect(gpos.majorVersion).toBe(1);
		expect(gpos.scriptList).toBeDefined();
		expect(gpos.featureList).toBeDefined();
		expect(gpos.lookupList).toBeDefined();
	});

	it('should parse GPOS from fira.ttf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'fira.ttf'))).buffer;
		const font = importFont(buffer);
		const gpos = font.tables['GPOS'];

		expect(gpos).toBeDefined();
		expect(gpos.majorVersion).toBe(1);
		expect(gpos.lookupList.lookups.length).toBeGreaterThan(0);
	});

	it('should parse GPOS from noto.ttf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'noto.ttf'))).buffer;
		const font = importFont(buffer);
		const gpos = font.tables['GPOS'];

		expect(gpos).toBeDefined();
		expect(gpos.majorVersion).toBe(1);
	});

	it('should have scriptList with script records', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'fira.ttf'))).buffer;
		const font = importFont(buffer);
		const gpos = font.tables['GPOS'];

		expect(Array.isArray(gpos.scriptList.scriptRecords)).toBe(true);
		expect(gpos.scriptList.scriptRecords.length).toBeGreaterThan(0);
		expect(gpos.scriptList.scriptRecords[0].scriptTag).toBeDefined();
	});

	it('should have featureList with tagged features', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'fira.ttf'))).buffer;
		const font = importFont(buffer);
		const gpos = font.tables['GPOS'];

		expect(Array.isArray(gpos.featureList.featureRecords)).toBe(true);
		expect(gpos.featureList.featureRecords.length).toBeGreaterThan(0);
		expect(gpos.featureList.featureRecords[0].featureTag).toBeDefined();
	});

	it('should not have _raw on parsed GPOS', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFont(buffer);
		const gpos = font.tables['GPOS'];

		expect(gpos._raw).toBeUndefined();
		expect(gpos._checksum).toBeTypeOf('number');
	});
});

describe('GPOS table round-trip', () => {
	for (const fontFile of ['oblegg.ttf', 'fira.ttf', 'noto.ttf']) {
		it(`should round-trip GPOS from ${fontFile}`, async () => {
			const buffer = (await readFile(resolve(SAMPLES_DIR, fontFile))).buffer;
			const font = importFont(buffer);
			const { _checksum, ...gposData } = font.tables['GPOS'];

			const writtenBytes = writeGPOS(gposData);
			const reparsed = parseGPOS(writtenBytes);

			expect(reparsed).toEqual(gposData);
		});
	}
});
