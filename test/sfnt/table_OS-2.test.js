/**
 * Tests for OS/2 table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFontTables } from '../../src/import.js';
import { parseOS2, writeOS2 } from '../../src/sfnt/table_OS-2.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

describe('OS/2 table parsing', () => {
	it('should parse the OS/2 table from an OTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const os2 = font.tables['OS/2'];

		expect(os2.version).toBeTypeOf('number');
		expect(os2.usWeightClass).toBeTypeOf('number');
		expect(os2.panose).toBeInstanceOf(Array);
		expect(os2.panose).toHaveLength(10);
	});

	it('should parse the OS/2 table from a TTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const os2 = font.tables['OS/2'];

		expect(os2.version).toBeTypeOf('number');
		expect(os2.usWeightClass).toBeTypeOf('number');
		expect(os2.panose).toBeInstanceOf(Array);
		expect(os2.panose).toHaveLength(10);
	});

	it('should have a 4-character vendor ID', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const os2 = font.tables['OS/2'];

		expect(os2.achVendID).toBeTypeOf('string');
		expect(os2.achVendID).toHaveLength(4);
	});

	it('should have valid weight and width classes', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const os2 = font.tables['OS/2'];

		expect(os2.usWeightClass).toBeGreaterThanOrEqual(1);
		expect(os2.usWeightClass).toBeLessThanOrEqual(1000);
		expect(os2.usWidthClass).toBeGreaterThanOrEqual(1);
		expect(os2.usWidthClass).toBeLessThanOrEqual(9);
	});

	it('should include version-appropriate fields', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const os2 = font.tables['OS/2'];

		// All versions should have these base fields
		expect(os2.sTypoAscender).toBeTypeOf('number');
		expect(os2.sTypoDescender).toBeTypeOf('number');
		expect(os2.usWinAscent).toBeTypeOf('number');
		expect(os2.usWinDescent).toBeTypeOf('number');

		// v1+ should have code page ranges
		if (os2.version >= 1) {
			expect(os2.ulCodePageRange1).toBeTypeOf('number');
			expect(os2.ulCodePageRange2).toBeTypeOf('number');
		}

		// v2+ should have additional metrics
		if (os2.version >= 2) {
			expect(os2.sxHeight).toBeTypeOf('number');
			expect(os2.sCapHeight).toBeTypeOf('number');
			expect(os2.usDefaultChar).toBeTypeOf('number');
			expect(os2.usBreakChar).toBeTypeOf('number');
			expect(os2.usMaxContext).toBeTypeOf('number');
		}

		// v5 should have optical size fields
		if (os2.version >= 5) {
			expect(os2.usLowerOpticalPointSize).toBeTypeOf('number');
			expect(os2.usUpperOpticalPointSize).toBeTypeOf('number');
		}
	});

	it('should not have _raw on parsed OS/2 table', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const os2 = font.tables['OS/2'];

		expect(os2._raw).toBeUndefined();
		expect(os2._checksum).toBeTypeOf('number');
	});
});

describe('OS/2 table round-trip', () => {
	it('should produce identical data after parse â†’ write â†’ re-parse (OTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...os2Data } = font.tables['OS/2'];

		const writtenBytes = writeOS2(os2Data);
		const reparsed = parseOS2(writtenBytes);

		expect(reparsed).toEqual(os2Data);
	});

	it('should produce identical data after parse â†’ write â†’ re-parse (TTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...os2Data } = font.tables['OS/2'];

		const writtenBytes = writeOS2(os2Data);
		const reparsed = parseOS2(writtenBytes);

		expect(reparsed).toEqual(os2Data);
	});
});

describe('OS/2 table synthetic', () => {
	it('should round-trip a minimal version 0 table', () => {
		const table = {
			version: 0,
			xAvgCharWidth: 500,
			usWeightClass: 400,
			usWidthClass: 5,
			fsType: 0,
			ySubscriptXSize: 650,
			ySubscriptYSize: 600,
			ySubscriptXOffset: 0,
			ySubscriptYOffset: 75,
			ySuperscriptXSize: 650,
			ySuperscriptYSize: 600,
			ySuperscriptXOffset: 0,
			ySuperscriptYOffset: 350,
			yStrikeoutSize: 50,
			yStrikeoutPosition: 300,
			sFamilyClass: 0,
			panose: [2, 0, 5, 3, 0, 0, 0, 0, 0, 0],
			ulUnicodeRange1: 0xe0000aff,
			ulUnicodeRange2: 0x40000042,
			ulUnicodeRange3: 0x00000000,
			ulUnicodeRange4: 0x00000000,
			achVendID: 'XXXX',
			fsSelection: 0x0040,
			usFirstCharIndex: 0x0020,
			usLastCharIndex: 0xfffd,
			sTypoAscender: 800,
			sTypoDescender: -200,
			sTypoLineGap: 0,
			usWinAscent: 1000,
			usWinDescent: 200,
		};

		const bytes = writeOS2(table);
		expect(bytes.length).toBe(78);

		const reparsed = parseOS2(bytes);
		expect(reparsed).toEqual(table);
	});

	it('should round-trip a version 4 table with v2+ fields', () => {
		const table = {
			version: 4,
			xAvgCharWidth: 500,
			usWeightClass: 400,
			usWidthClass: 5,
			fsType: 0x0008,
			ySubscriptXSize: 650,
			ySubscriptYSize: 600,
			ySubscriptXOffset: 0,
			ySubscriptYOffset: 75,
			ySuperscriptXSize: 650,
			ySuperscriptYSize: 600,
			ySuperscriptXOffset: 0,
			ySuperscriptYOffset: 350,
			yStrikeoutSize: 50,
			yStrikeoutPosition: 300,
			sFamilyClass: 0,
			panose: [2, 0, 5, 3, 0, 0, 0, 0, 0, 0],
			ulUnicodeRange1: 0xe0000aff,
			ulUnicodeRange2: 0x40000042,
			ulUnicodeRange3: 0x00000000,
			ulUnicodeRange4: 0x00000000,
			achVendID: 'TEST',
			fsSelection: 0x00c0,
			usFirstCharIndex: 0x0020,
			usLastCharIndex: 0xfffd,
			sTypoAscender: 800,
			sTypoDescender: -200,
			sTypoLineGap: 0,
			usWinAscent: 1000,
			usWinDescent: 200,
			ulCodePageRange1: 0x20000001,
			ulCodePageRange2: 0x00000000,
			sxHeight: 500,
			sCapHeight: 700,
			usDefaultChar: 0,
			usBreakChar: 0x0020,
			usMaxContext: 2,
		};

		const bytes = writeOS2(table);
		expect(bytes.length).toBe(96);

		const reparsed = parseOS2(bytes);
		expect(reparsed).toEqual(table);
	});
});
