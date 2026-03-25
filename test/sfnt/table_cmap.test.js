/**
 * Tests for cmap table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFontTables } from '../../src/main.js';
import { parseCmap, writeCmap } from '../../src/sfnt/table_cmap.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

describe('cmap table parsing', () => {
	it('should parse the cmap table from an OTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cmap = font.tables['cmap'];

		expect(cmap.version).toBe(0);
		expect(cmap.encodingRecords.length).toBeGreaterThan(0);
		expect(cmap.subtables.length).toBeGreaterThan(0);
	});

	it('should have valid encoding records', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cmap = font.tables['cmap'];

		for (const record of cmap.encodingRecords) {
			expect(record.platformID).toBeTypeOf('number');
			expect(record.encodingID).toBeTypeOf('number');
			expect(record.subtableIndex).toBeTypeOf('number');
			expect(record.subtableIndex).toBeLessThan(cmap.subtables.length);
		}
	});

	it('should not have _raw on parsed cmap table', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cmap = font.tables['cmap'];

		// Parsed tables should not have _raw at the table level
		expect(cmap._raw).toBeUndefined();
		// But should still have _checksum
		expect(cmap._checksum).toBeTypeOf('number');
	});

	it('should parse subtable formats as structured data', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cmap = font.tables['cmap'];

		for (const subtable of cmap.subtables) {
			expect(subtable.format).toBeTypeOf('number');

			// Supported formats should have structured data, not _raw
			if ([0, 4, 6, 12, 13, 14].includes(subtable.format)) {
				expect(subtable._raw).toBeUndefined();
			}
		}
	});
});

describe('cmap table round-trip', () => {
	it('should produce identical data after parse â†’ write â†’ re-parse (OTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...cmapData } = font.tables['cmap'];

		const writtenBytes = writeCmap(cmapData);
		const reparsed = parseCmap(writtenBytes);

		expect(reparsed).toEqual(cmapData);
	});

	it('should produce identical data after parse â†’ write â†’ re-parse (TTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...cmapData } = font.tables['cmap'];

		const writtenBytes = writeCmap(cmapData);
		const reparsed = parseCmap(writtenBytes);

		expect(reparsed).toEqual(cmapData);
	});
});

describe('cmap Format 4 specifics', () => {
	it('should have the final segment ending at 0xFFFF', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cmap = font.tables['cmap'];

		const fmt4 = cmap.subtables.find((s) => s.format === 4);
		if (fmt4) {
			const lastSeg = fmt4.segments[fmt4.segments.length - 1];
			expect(lastSeg.endCode).toBe(0xffff);
			expect(lastSeg.startCode).toBe(0xffff);
		}
	});
});
