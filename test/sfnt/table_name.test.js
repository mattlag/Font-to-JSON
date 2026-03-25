/**
 * Tests for name table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFontTables } from '../../src/main.js';
import { parseName, writeName } from '../../src/sfnt/table_name.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

describe('name table parsing', () => {
	it('should parse the name table from an OTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const name = font.tables['name'];

		expect(name.version).toBeTypeOf('number');
		expect(name.names).toBeInstanceOf(Array);
		expect(name.names.length).toBeGreaterThan(0);
	});

	it('should parse the name table from a TTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const name = font.tables['name'];

		expect(name.version).toBeTypeOf('number');
		expect(name.names).toBeInstanceOf(Array);
		expect(name.names.length).toBeGreaterThan(0);
	});

	it('should have valid name record fields', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const name = font.tables['name'];

		for (const rec of name.names) {
			expect(rec.platformID).toBeTypeOf('number');
			expect(rec.encodingID).toBeTypeOf('number');
			expect(rec.languageID).toBeTypeOf('number');
			expect(rec.nameID).toBeTypeOf('number');
			expect(rec.value).toBeTypeOf('string');
		}
	});

	it('should contain a font family name (nameID 1)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const name = font.tables['name'];

		const familyNames = name.names.filter((r) => r.nameID === 1);
		expect(familyNames.length).toBeGreaterThan(0);
		expect(familyNames[0].value.length).toBeGreaterThan(0);
	});

	it('should not have _raw on parsed name table', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const name = font.tables['name'];

		expect(name._raw).toBeUndefined();
		expect(name._checksum).toBeTypeOf('number');
	});
});

describe('name table round-trip', () => {
	it('should produce identical data after parse â†’ write â†’ re-parse (OTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...nameData } = font.tables['name'];

		const writtenBytes = writeName(nameData);
		const reparsed = parseName(writtenBytes);

		expect(reparsed).toEqual(nameData);
	});

	it('should produce identical data after parse â†’ write â†’ re-parse (TTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...nameData } = font.tables['name'];

		const writtenBytes = writeName(nameData);
		const reparsed = parseName(writtenBytes);

		expect(reparsed).toEqual(nameData);
	});
});

describe('name table synthetic', () => {
	it('should round-trip a minimal version 0 table', () => {
		const table = {
			version: 0,
			names: [
				{
					platformID: 3,
					encodingID: 1,
					languageID: 0x0409,
					nameID: 1,
					value: 'TestFont',
				},
				{
					platformID: 3,
					encodingID: 1,
					languageID: 0x0409,
					nameID: 2,
					value: 'Regular',
				},
			],
		};

		const bytes = writeName(table);
		const reparsed = parseName(bytes);

		expect(reparsed).toEqual(table);
	});

	it('should round-trip a version 1 table with language tags', () => {
		const table = {
			version: 1,
			names: [
				{
					platformID: 3,
					encodingID: 1,
					languageID: 0x0409,
					nameID: 1,
					value: 'TestFont',
				},
				{
					platformID: 3,
					encodingID: 1,
					languageID: 0x8000,
					nameID: 1,
					value: 'TestFont-FR',
				},
			],
			langTagRecords: [{ tag: 'fr' }],
		};

		const bytes = writeName(table);
		const reparsed = parseName(bytes);

		expect(reparsed).toEqual(table);
	});

	it('should handle MacRoman platform strings', () => {
		const table = {
			version: 0,
			names: [
				{
					platformID: 1,
					encodingID: 0,
					languageID: 0,
					nameID: 1,
					value: 'HÃ©llo',
				},
			],
		};

		const bytes = writeName(table);
		const reparsed = parseName(bytes);

		expect(reparsed).toEqual(table);
	});
});
