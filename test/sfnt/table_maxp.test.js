/**
 * Tests for maxp table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFont } from '../../src/main.js';
import { parseMaxp, writeMaxp } from '../../src/sfnt/table_maxp.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

describe('maxp table parsing', () => {
	it('should parse the maxp table from an OTF file (version 0.5)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const maxp = font.tables['maxp'];

		// CFF-based OTF uses version 0.5
		expect(maxp.version).toBe(0x00005000);
		expect(maxp.numGlyphs).toBeGreaterThan(0);
	});

	it('should parse the maxp table from a TTF file (version 1.0)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFont(buffer);
		const maxp = font.tables['maxp'];

		// TrueType-based TTF uses version 1.0
		expect(maxp.version).toBe(0x00010000);
		expect(maxp.numGlyphs).toBeGreaterThan(0);
		expect(maxp.maxPoints).toBeTypeOf('number');
		expect(maxp.maxContours).toBeTypeOf('number');
		expect(maxp.maxZones).toBeGreaterThanOrEqual(1);
		expect(maxp.maxZones).toBeLessThanOrEqual(2);
	});

	it('should not have _raw on parsed maxp table', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const maxp = font.tables['maxp'];

		expect(maxp._raw).toBeUndefined();
		expect(maxp._checksum).toBeTypeOf('number');
	});
});

describe('maxp table round-trip', () => {
	it('should produce identical data after parse → write → re-parse (OTF v0.5)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const { _checksum, ...maxpData } = font.tables['maxp'];

		const writtenBytes = writeMaxp(maxpData);
		const reparsed = parseMaxp(writtenBytes);

		expect(reparsed).toEqual(maxpData);
	});

	it('should produce identical data after parse → write → re-parse (TTF v1.0)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFont(buffer);
		const { _checksum, ...maxpData } = font.tables['maxp'];

		const writtenBytes = writeMaxp(maxpData);
		const reparsed = parseMaxp(writtenBytes);

		expect(reparsed).toEqual(maxpData);
	});

	it('should write 6 bytes for v0.5 and 32 bytes for v1.0', async () => {
		const otfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf')))
			.buffer;
		const otfFont = importFont(otfBuffer);
		const { _checksum: _c1, ...otfMaxp } = otfFont.tables['maxp'];
		expect(writeMaxp(otfMaxp).length).toBe(6);

		const ttfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf')))
			.buffer;
		const ttfFont = importFont(ttfBuffer);
		const { _checksum: _c2, ...ttfMaxp } = ttfFont.tables['maxp'];
		expect(writeMaxp(ttfMaxp).length).toBe(32);
	});
});
