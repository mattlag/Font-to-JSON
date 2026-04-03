/**
 * Tests for CFF (Compact Font Format v1) table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFontTables } from '../../src/import.js';
import {
	decodeDICT,
	decodeNumber,
	encodeDICT,
	encodeNumber,
	parseINDEXv1,
	writeINDEXv1,
} from '../../src/otf/cff_common.js';
import { parseCFF, writeCFF } from '../../src/otf/table_CFF.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CFF common utilities
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

describe('CFF number encoding/decoding', () => {
	it('should round-trip 1-byte integers (âˆ’107 to 107)', () => {
		for (const val of [-107, -1, 0, 1, 107]) {
			const encoded = encodeNumber(val);
			const decoded = decodeNumber(encoded, 0);
			expect(decoded.value).toBe(val);
			expect(encoded.length).toBe(1);
		}
	});

	it('should round-trip 2-byte positive integers (108 to 1131)', () => {
		for (const val of [108, 500, 1131]) {
			const encoded = encodeNumber(val);
			const decoded = decodeNumber(encoded, 0);
			expect(decoded.value).toBe(val);
			expect(encoded.length).toBe(2);
		}
	});

	it('should round-trip 2-byte negative integers (âˆ’1131 to âˆ’108)', () => {
		for (const val of [-108, -500, -1131]) {
			const encoded = encodeNumber(val);
			const decoded = decodeNumber(encoded, 0);
			expect(decoded.value).toBe(val);
			expect(encoded.length).toBe(2);
		}
	});

	it('should round-trip 3-byte int16 (âˆ’32768 to 32767)', () => {
		for (const val of [-32768, -2000, 2000, 32767]) {
			const encoded = encodeNumber(val);
			const decoded = decodeNumber(encoded, 0);
			expect(decoded.value).toBe(val);
		}
	});

	it('should round-trip 5-byte int32', () => {
		for (const val of [-100000, 100000, 2147483647, -2147483648]) {
			const encoded = encodeNumber(val);
			const decoded = decodeNumber(encoded, 0);
			expect(decoded.value).toBe(val);
			expect(encoded[0]).toBe(29);
		}
	});

	it('should round-trip BCD real numbers', () => {
		for (const val of [0.5, -2.25, 3.14159, 100.001]) {
			const encoded = encodeNumber(val);
			expect(encoded[0]).toBe(30); // BCD prefix
			const decoded = decodeNumber(encoded, 0);
			// Float precision â€” check within a small epsilon
			expect(decoded.value).toBeCloseTo(val, 4);
		}
	});
});

describe('CFF INDEX v1 round-trip', () => {
	it('should round-trip an empty INDEX', () => {
		const bytes = writeINDEXv1([]);
		expect(bytes).toEqual([0, 0]); // uint16 count = 0
		const { items, totalBytes } = parseINDEXv1(bytes, 0);
		expect(items).toHaveLength(0);
		expect(totalBytes).toBe(2);
	});

	it('should round-trip a single-item INDEX', () => {
		const item = new Uint8Array([10, 20, 30]);
		const bytes = writeINDEXv1([item]);
		const { items } = parseINDEXv1(bytes, 0);
		expect(items).toHaveLength(1);
		expect(Array.from(items[0])).toEqual([10, 20, 30]);
	});

	it('should round-trip a multi-item INDEX', () => {
		const origItems = [
			new Uint8Array([1, 2, 3]),
			new Uint8Array([4, 5]),
			new Uint8Array([6, 7, 8, 9]),
		];
		const bytes = writeINDEXv1(origItems);
		const { items } = parseINDEXv1(bytes, 0);
		expect(items).toHaveLength(3);
		expect(Array.from(items[0])).toEqual([1, 2, 3]);
		expect(Array.from(items[1])).toEqual([4, 5]);
		expect(Array.from(items[2])).toEqual([6, 7, 8, 9]);
	});
});

describe('CFF DICT round-trip', () => {
	it('should round-trip DICT entries', () => {
		const entries = [
			{ operator: 5, operands: [0, -200, 1000, 800] }, // FontBBox
			{ operator: 17, operands: [42] }, // CharStrings offset
			{ operator: 0x0c02, operands: [-12] }, // ItalicAngle (two-byte op)
		];
		const encoded = encodeDICT(entries);
		const decoded = decodeDICT(encoded);
		expect(decoded).toEqual(entries);
	});
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CFF table parsing from a real font
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

describe('CFF table parsing', () => {
	it('should parse the CFF table from oblegg.otf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];

		expect(cff).toBeDefined();
		expect(cff.majorVersion).toBe(1);
		expect(cff.minorVersion).toBe(0);
	});

	it('should not have a _raw property (CFF is fully parsed)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];

		expect(cff._raw).toBeUndefined();
	});

	it('should have a non-empty names array', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];

		expect(cff.names).toBeInstanceOf(Array);
		expect(cff.names.length).toBeGreaterThan(0);
		expect(typeof cff.names[0]).toBe('string');
	});

	it('should have a strings array', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];

		expect(cff.strings).toBeInstanceOf(Array);
	});

	it('should have at least one font entry', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];

		expect(cff.fonts).toBeInstanceOf(Array);
		expect(cff.fonts.length).toBeGreaterThan(0);
	});

	it('should have a topDict object for each font', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];
		const f = cff.fonts[0];

		expect(f.topDict).toBeDefined();
		expect(typeof f.topDict).toBe('object');
	});

	it('should have charStrings as an array of byte arrays', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];
		const f = cff.fonts[0];

		expect(f.charStrings).toBeInstanceOf(Array);
		expect(f.charStrings.length).toBeGreaterThan(0);
		// Each charstring should be an array of numbers
		expect(f.charStrings[0]).toBeInstanceOf(Array);
	});

	it('should have a privateDict object', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];
		const f = cff.fonts[0];

		expect(f.privateDict).toBeDefined();
		expect(typeof f.privateDict).toBe('object');
	});

	it('should have a charset (array or predefined name)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];
		const f = cff.fonts[0];

		const validTypes = ['string', 'object']; // string for predefined, array for custom
		expect(validTypes).toContain(typeof f.charset);
	});

	it('should have an encoding (string or object)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];
		const f = cff.fonts[0];

		expect(f.encoding).toBeDefined();
	});
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  CFF write / round-trip
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

describe('CFF table writing', () => {
	it('should produce valid bytes from a parsed CFF table', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];

		const written = writeCFF(cff);
		expect(written).toBeInstanceOf(Array);
		expect(written.length).toBeGreaterThan(0);
	});

	it('should round-trip: parse â†’ write â†’ re-parse yields equivalent data', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];

		// Write then re-parse
		const written = writeCFF(cff);
		const reparsed = parseCFF(written);

		// Compare structure fields
		expect(reparsed.majorVersion).toBe(cff.majorVersion);
		expect(reparsed.minorVersion).toBe(cff.minorVersion);
		expect(reparsed.names).toEqual(cff.names);
		expect(reparsed.strings).toEqual(cff.strings);
		expect(reparsed.globalSubrs).toEqual(cff.globalSubrs);
		expect(reparsed.fonts.length).toBe(cff.fonts.length);

		// Compare first font's charStrings count
		expect(reparsed.fonts[0].charStrings.length).toBe(
			cff.fonts[0].charStrings.length,
		);

		// Compare charStrings content
		expect(reparsed.fonts[0].charStrings).toEqual(cff.fonts[0].charStrings);

		// Compare privateDict
		expect(reparsed.fonts[0].privateDict).toEqual(cff.fonts[0].privateDict);

		// Compare localSubrs
		expect(reparsed.fonts[0].localSubrs).toEqual(cff.fonts[0].localSubrs);

		// Compare charset
		expect(reparsed.fonts[0].charset).toEqual(cff.fonts[0].charset);
	});
});

describe('CFF table from EmojiOneColor.otf', () => {
	it('should parse the CFF table from EmojiOneColor.otf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'EmojiOneColor.otf')))
			.buffer;
		const font = importFontTables(buffer);
		const cff = font.tables['CFF '];

		// EmojiOneColor.otf is an OTF (OTTO) so should have a CFF table
		if (cff) {
			expect(cff.majorVersion).toBe(1);
			expect(cff.fonts.length).toBeGreaterThan(0);
		}
	});
});
