/**
 * Tests for hhea table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFontTables } from '../../src/import.js';
import { parseHhea, writeHhea } from '../../src/sfnt/table_hhea.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

describe('hhea table parsing', () => {
	it('should parse the hhea table from an OTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const hhea = font.tables['hhea'];

		expect(hhea.majorVersion).toBe(1);
		expect(hhea.minorVersion).toBe(0);
	});

	it('should have valid metric fields', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const hhea = font.tables['hhea'];

		expect(hhea.ascender).toBeTypeOf('number');
		expect(hhea.descender).toBeTypeOf('number');
		expect(hhea.lineGap).toBeTypeOf('number');
		expect(hhea.advanceWidthMax).toBeGreaterThanOrEqual(0);
	});

	it('should have numberOfHMetrics > 0', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const hhea = font.tables['hhea'];

		expect(hhea.numberOfHMetrics).toBeGreaterThan(0);
	});

	it('should have reserved fields set to 0', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const hhea = font.tables['hhea'];

		expect(hhea.reserved1).toBe(0);
		expect(hhea.reserved2).toBe(0);
		expect(hhea.reserved3).toBe(0);
		expect(hhea.reserved4).toBe(0);
	});

	it('should have metricDataFormat of 0', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const hhea = font.tables['hhea'];

		expect(hhea.metricDataFormat).toBe(0);
	});

	it('should not have _raw on parsed hhea table', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const hhea = font.tables['hhea'];

		expect(hhea._raw).toBeUndefined();
		expect(hhea._checksum).toBeTypeOf('number');
	});
});

describe('hhea table round-trip', () => {
	it('should produce identical data after parse â†’ write â†’ re-parse (OTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...hheaData } = font.tables['hhea'];

		const writtenBytes = writeHhea(hheaData);
		const reparsed = parseHhea(writtenBytes);

		expect(reparsed).toEqual(hheaData);
	});

	it('should produce identical data after parse â†’ write â†’ re-parse (TTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...hheaData } = font.tables['hhea'];

		const writtenBytes = writeHhea(hheaData);
		const reparsed = parseHhea(writtenBytes);

		expect(reparsed).toEqual(hheaData);
	});

	it('should write exactly 36 bytes', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...hheaData } = font.tables['hhea'];

		const writtenBytes = writeHhea(hheaData);
		expect(writtenBytes.length).toBe(36);
	});
});
