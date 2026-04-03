/**
 * Tests for hmtx table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFontTables } from '../../src/import.js';
import { parseHmtx, writeHmtx } from '../../src/sfnt/table_hmtx.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

describe('hmtx table parsing', () => {
	it('should parse the hmtx table from an OTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const hmtx = font.tables['hmtx'];

		expect(hmtx.hMetrics).toBeInstanceOf(Array);
		expect(hmtx.hMetrics.length).toBeGreaterThan(0);
		expect(hmtx.leftSideBearings).toBeInstanceOf(Array);
	});

	it('should have hMetrics count matching hhea.numberOfHMetrics', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);

		expect(font.tables['hmtx'].hMetrics.length).toBe(
			font.tables['hhea'].numberOfHMetrics,
		);
	});

	it('should have leftSideBearings count = numGlyphs - numberOfHMetrics', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const expected =
			font.tables['maxp'].numGlyphs - font.tables['hhea'].numberOfHMetrics;

		expect(font.tables['hmtx'].leftSideBearings.length).toBe(expected);
	});

	it('should have valid LongHorMetric records', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const hmtx = font.tables['hmtx'];

		for (const metric of hmtx.hMetrics) {
			expect(metric.advanceWidth).toBeTypeOf('number');
			expect(metric.advanceWidth).toBeGreaterThanOrEqual(0);
			expect(metric.lsb).toBeTypeOf('number');
		}
	});

	it('should not have _raw on parsed hmtx table', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const hmtx = font.tables['hmtx'];

		expect(hmtx._raw).toBeUndefined();
		expect(hmtx._checksum).toBeTypeOf('number');
	});
});

describe('hmtx table round-trip', () => {
	it('should produce identical data after parse â†’ write â†’ re-parse (OTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...hmtxData } = font.tables['hmtx'];

		const writtenBytes = writeHmtx(hmtxData);
		const reparsed = parseHmtx(writtenBytes, font.tables);

		expect(reparsed).toEqual(hmtxData);
	});

	it('should produce identical data after parse â†’ write â†’ re-parse (TTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...hmtxData } = font.tables['hmtx'];

		const writtenBytes = writeHmtx(hmtxData);
		const reparsed = parseHmtx(writtenBytes, font.tables);

		expect(reparsed).toEqual(hmtxData);
	});
});
