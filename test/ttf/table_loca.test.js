/**
 * Tests for loca (Index to Location) table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFontTables } from '../../src/main.js';
import { DataReader } from '../../src/reader.js';
import { parseLoca, writeLoca } from '../../src/ttf/table_loca.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

/**
 * Manually extract raw table bytes and the table directory from a font file.
 * This lets us call parseLoca directly (bypassing the import pipeline which
 * strips loca.offsets from the JSON output).
 */
function extractRawTable(buffer, tag) {
	const reader = new DataReader(new Uint8Array(buffer));

	// Font header â€” skip sfVersion, read numTables
	reader.skip(4);
	const numTables = reader.uint16();
	reader.skip(6); // searchRange, entrySelector, rangeShift

	for (let i = 0; i < numTables; i++) {
		const t = reader.tag();
		const checksum = reader.uint32();
		const offset = reader.uint32();
		const length = reader.uint32();
		if (t === tag) {
			return Array.from(new Uint8Array(buffer, offset, length));
		}
	}
	return null;
}

describe('loca table parsing', () => {
	it('should parse loca offsets from a TTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);

		// Extract raw loca bytes and parse directly
		const rawBytes = extractRawTable(buffer, 'loca');
		const tables = {
			head: font.tables['head'],
			maxp: font.tables['maxp'],
		};
		const loca = parseLoca(rawBytes, tables);

		expect(loca.offsets).toBeInstanceOf(Array);
		expect(loca.offsets.length).toBe(font.tables['maxp'].numGlyphs + 1);
	});

	it('should have ascending (non-decreasing) offsets', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);

		const rawBytes = extractRawTable(buffer, 'loca');
		const loca = parseLoca(rawBytes, {
			head: font.tables['head'],
			maxp: font.tables['maxp'],
		});

		for (let i = 1; i < loca.offsets.length; i++) {
			expect(loca.offsets[i]).toBeGreaterThanOrEqual(loca.offsets[i - 1]);
		}
	});

	it('should start at offset 0', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);

		const rawBytes = extractRawTable(buffer, 'loca');
		const loca = parseLoca(rawBytes, {
			head: font.tables['head'],
			maxp: font.tables['maxp'],
		});

		expect(loca.offsets[0]).toBe(0);
	});

	it('should strip loca offsets from JSON output (binary-layout artifact)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);

		// importFont should have removed the offsets
		expect(font.tables['loca'].offsets).toBeUndefined();
		// But _checksum should still be present
		expect(font.tables['loca']._checksum).toBeTypeOf('number');
	});

	it('should not have _raw on parsed loca table', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const loca = font.tables['loca'];

		expect(loca._raw).toBeUndefined();
	});
});

describe('loca table writing', () => {
	it('should write valid short-format loca from even offsets', () => {
		const offsets = [0, 40, 80, 120, 200];
		const bytes = writeLoca({ offsets });

		// Short format: 5 entries Ã— 2 bytes = 10 bytes
		expect(bytes.length).toBe(10);
	});

	it('should write valid long-format loca when offsets require it', () => {
		// Offset exceeding short format range (0xFFFE * 2 = 131068)
		const offsets = [0, 200000, 400000];
		const bytes = writeLoca({ offsets });

		// Long format: 3 entries Ã— 4 bytes = 12 bytes
		expect(bytes.length).toBe(12);
	});

	it('should use long format for odd offsets', () => {
		const offsets = [0, 41, 83]; // Odd offsets can't be stored short
		const bytes = writeLoca({ offsets });

		// Long format: 3 entries Ã— 4 bytes = 12 bytes
		expect(bytes.length).toBe(12);
	});
});

describe('loca table round-trip', () => {
	it('should round-trip via parse â†’ write â†’ re-parse (TTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);

		const rawBytes = extractRawTable(buffer, 'loca');
		const tables = {
			head: font.tables['head'],
			maxp: font.tables['maxp'],
		};
		const original = parseLoca(rawBytes, tables);

		// Write â†’ re-parse
		const writtenBytes = writeLoca(original);

		// Detect the format writeLoca chose
		const canUseShort = original.offsets.every(
			(o) => o % 2 === 0 && o / 2 <= 0xffff,
		);
		const reparsedTables = {
			head: { indexToLocFormat: canUseShort ? 0 : 1 },
			maxp: { numGlyphs: font.tables['maxp'].numGlyphs },
		};
		const reparsed = parseLoca(writtenBytes, reparsedTables);

		expect(reparsed.offsets).toEqual(original.offsets);
	});
});
