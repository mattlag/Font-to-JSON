/**
 * Tests for GPOS table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFont, importFontTables } from '../../src/import.js';
import { parseGPOS, writeGPOS } from '../../src/sfnt/table_GPOS.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

// Fonts known to contain a GPOS table:
// oblegg.ttf, oblegg.otf, fira.ttf, noto.ttf, BungeeTint

describe('GPOS table parsing', () => {
	it('should parse GPOS from oblegg.ttf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
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
		const font = importFontTables(buffer);
		const gpos = font.tables['GPOS'];

		expect(gpos).toBeDefined();
		expect(gpos.majorVersion).toBe(1);
		expect(gpos.lookupList.lookups.length).toBeGreaterThan(0);
	});

	it('should parse GPOS from noto.ttf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'noto.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gpos = font.tables['GPOS'];

		expect(gpos).toBeDefined();
		expect(gpos.majorVersion).toBe(1);
	});

	it('should parse GPOS from SegUIVar-test.ttf (variation device offsets)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'SegUIVar-test.ttf')))
			.buffer;
		const font = importFontTables(buffer);
		const gpos = font.tables['GPOS'];

		expect(gpos).toBeDefined();
		expect(gpos.majorVersion).toBe(1);
		expect(gpos.lookupList.lookups.length).toBeGreaterThan(0);
	});

	it('should have scriptList with script records', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'fira.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gpos = font.tables['GPOS'];

		expect(Array.isArray(gpos.scriptList.scriptRecords)).toBe(true);
		expect(gpos.scriptList.scriptRecords.length).toBeGreaterThan(0);
		expect(gpos.scriptList.scriptRecords[0].scriptTag).toBeDefined();
	});

	it('should have featureList with tagged features', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'fira.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gpos = font.tables['GPOS'];

		expect(Array.isArray(gpos.featureList.featureRecords)).toBe(true);
		expect(gpos.featureList.featureRecords.length).toBeGreaterThan(0);
		expect(gpos.featureList.featureRecords[0].featureTag).toBeDefined();
	});

	it('should not have _raw on parsed GPOS', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gpos = font.tables['GPOS'];

		expect(gpos._raw).toBeUndefined();
		expect(gpos._checksum).toBeTypeOf('number');
	});
});

describe('GPOS table round-trip', () => {
	for (const fontFile of ['oblegg.ttf', 'fira.ttf', 'noto.ttf']) {
		it(`should round-trip GPOS from ${fontFile}`, async () => {
			const buffer = (await readFile(resolve(SAMPLES_DIR, fontFile))).buffer;
			const font = importFontTables(buffer);
			const { _checksum, ...gposData } = font.tables['GPOS'];

			const writtenBytes = writeGPOS(gposData);
			const reparsed = parseGPOS(writtenBytes);

			expect(reparsed).toEqual(gposData);
		});
	}

	it('should round-trip oversized PairPos format 1 from cambria-test.ttc face 0', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'cambria-test.ttc')))
			.buffer;
		const collection = importFont(buffer);
		const { _checksum, ...gposData } = collection.fonts[0].features.GPOS;

		const writtenBytes = writeGPOS(gposData);
		const reparsed = parseGPOS(writtenBytes);

		expect(reparsed.majorVersion).toBe(gposData.majorVersion);
		expect(reparsed.minorVersion).toBe(gposData.minorVersion);
		expect(reparsed.lookupList.lookups.length).toBe(
			gposData.lookupList.lookups.length,
		);

		const originalPairSetCount = gposData.lookupList.lookups
			.flatMap((lookup) => lookup.subtables)
			.filter((subtable) => subtable.format === 1 && subtable.pairSets)
			.reduce((sum, subtable) => sum + subtable.pairSets.length, 0);
		const reparsedPairSetCount = reparsed.lookupList.lookups
			.flatMap((lookup) => lookup.subtables)
			.filter((subtable) => subtable.format === 1 && subtable.pairSets)
			.reduce((sum, subtable) => sum + subtable.pairSets.length, 0);

		expect(reparsedPairSetCount).toBe(originalPairSetCount);
	}, 120000);
});
