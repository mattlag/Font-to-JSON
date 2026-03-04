/**
 * OTF import / export tests
 * Tests for the general OTF file structure: header and table directory.
 * Table-specific tests will live in sibling files (e.g. table_cmap.test.js).
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFont } from '../../src/main.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

describe('OTF header parsing', () => {
	it('should read the font header from an OTF file', async () => {
		const filePath = resolve(SAMPLES_DIR, 'oblegg.otf');
		const buffer = (await readFile(filePath)).buffer;

		const font = importFont(buffer);

		expect(font.header).toBeDefined();
		expect(font.header.numTables).toBeGreaterThan(0);
	});

	it('should have sfVersion 0x4F54544F (OTTO) for a CFF-based OTF', async () => {
		const filePath = resolve(SAMPLES_DIR, 'oblegg.otf');
		const buffer = (await readFile(filePath)).buffer;

		const font = importFont(buffer);

		// 'OTTO' = 0x4F54544F
		expect(font.header.sfVersion).toBe(0x4f54544f);
	});

	it('should have valid searchRange, entrySelector, and rangeShift', async () => {
		const filePath = resolve(SAMPLES_DIR, 'oblegg.otf');
		const buffer = (await readFile(filePath)).buffer;

		const font = importFont(buffer);
		const { numTables, searchRange, entrySelector, rangeShift } = font.header;

		// Verify computed values per the spec:
		// searchRange = (2**floor(log2(numTables))) * 16
		// entrySelector = floor(log2(numTables))
		// rangeShift = numTables * 16 - searchRange
		const expectedEntrySelector = Math.floor(Math.log2(numTables));
		const expectedSearchRange = Math.pow(2, expectedEntrySelector) * 16;
		const expectedRangeShift = numTables * 16 - expectedSearchRange;

		expect(searchRange).toBe(expectedSearchRange);
		expect(entrySelector).toBe(expectedEntrySelector);
		expect(rangeShift).toBe(expectedRangeShift);
	});
});

describe('OTF table directory', () => {
	it('should extract tables matching numTables count', async () => {
		const filePath = resolve(SAMPLES_DIR, 'oblegg.otf');
		const buffer = (await readFile(filePath)).buffer;

		const font = importFont(buffer);
		const tableCount = Object.keys(font.tables).length;

		expect(tableCount).toBe(font.header.numTables);
	});

	it('should include required OTF tables', async () => {
		const filePath = resolve(SAMPLES_DIR, 'oblegg.otf');
		const buffer = (await readFile(filePath)).buffer;

		const font = importFont(buffer);
		const tags = Object.keys(font.tables);

		// The 8 required tables per the OpenType spec
		const requiredTables = [
			'cmap',
			'head',
			'hhea',
			'hmtx',
			'maxp',
			'name',
			'OS/2',
			'post',
		];
		for (const tag of requiredTables) {
			expect(tags, `Missing required table: ${tag}`).toContain(tag);
		}
	});

	it('should store data and a checksum for each table', async () => {
		const filePath = resolve(SAMPLES_DIR, 'oblegg.otf');
		const buffer = (await readFile(filePath)).buffer;

		const font = importFont(buffer);

		for (const [tag, data] of Object.entries(font.tables)) {
			// Every table must have a checksum
			expect(typeof data._checksum, `${tag} should have _checksum`).toBe(
				'number',
			);

			// Unparsed tables have _raw; parsed tables have structured data instead
			if (data._raw !== undefined) {
				expect(data._raw, `${tag} _raw should be an Array`).toBeInstanceOf(
					Array,
				);
				expect(
					data._raw.length,
					`${tag} _raw should not be empty`,
				).toBeGreaterThan(0);
			}
		}
	});
});
