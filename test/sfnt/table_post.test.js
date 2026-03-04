/**
 * Tests for post table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFont } from '../../src/main.js';
import { parsePost, writePost } from '../../src/sfnt/table_post.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

describe('post table parsing', () => {
	it('should parse the post table from an OTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const post = font.tables['post'];

		expect(post.version).toBeTypeOf('number');
		expect(post.italicAngle).toBeTypeOf('number');
		expect(post.underlinePosition).toBeTypeOf('number');
		expect(post.underlineThickness).toBeTypeOf('number');
		expect(post.isFixedPitch).toBeTypeOf('number');
	});

	it('should parse the post table from a TTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFont(buffer);
		const post = font.tables['post'];

		expect(post.version).toBeTypeOf('number');
		expect(post.italicAngle).toBeTypeOf('number');
	});

	it('should have valid version values', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const post = font.tables['post'];

		const validVersions = [0x00010000, 0x00020000, 0x00025000, 0x00030000];
		expect(validVersions).toContain(post.version);
	});

	it('should include memory hint fields', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const post = font.tables['post'];

		expect(post.minMemType42).toBeTypeOf('number');
		expect(post.maxMemType42).toBeTypeOf('number');
		expect(post.minMemType1).toBeTypeOf('number');
		expect(post.maxMemType1).toBeTypeOf('number');
	});

	it('should have glyphNames for version 2.0 fonts', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFont(buffer);
		const post = font.tables['post'];

		if (post.version === 0x00020000) {
			expect(post.glyphNames).toBeInstanceOf(Array);
			expect(post.glyphNames.length).toBeGreaterThan(0);
			// First glyph should be .notdef
			expect(post.glyphNames[0]).toBe('.notdef');
		}
	});

	it('should not have _raw on parsed post table', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const post = font.tables['post'];

		expect(post._raw).toBeUndefined();
		expect(post._checksum).toBeTypeOf('number');
	});
});

describe('post table round-trip', () => {
	it('should produce identical data after parse → write → re-parse (OTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const { _checksum, ...postData } = font.tables['post'];

		const writtenBytes = writePost(postData);
		const reparsed = parsePost(writtenBytes);

		expect(reparsed).toEqual(postData);
	});

	it('should produce identical data after parse → write → re-parse (TTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFont(buffer);
		const { _checksum, ...postData } = font.tables['post'];

		const writtenBytes = writePost(postData);
		const reparsed = parsePost(writtenBytes);

		expect(reparsed).toEqual(postData);
	});
});

describe('post table synthetic', () => {
	it('should round-trip a version 1.0 table (header only)', () => {
		const table = {
			version: 0x00010000,
			italicAngle: 0,
			underlinePosition: -100,
			underlineThickness: 50,
			isFixedPitch: 0,
			minMemType42: 0,
			maxMemType42: 0,
			minMemType1: 0,
			maxMemType1: 0,
		};

		const bytes = writePost(table);
		expect(bytes.length).toBe(32);

		const reparsed = parsePost(bytes);
		expect(reparsed).toEqual(table);
	});

	it('should round-trip a version 3.0 table (header only)', () => {
		const table = {
			version: 0x00030000,
			italicAngle: -12,
			underlinePosition: -75,
			underlineThickness: 50,
			isFixedPitch: 1,
			minMemType42: 42000,
			maxMemType42: 84000,
			minMemType1: 0,
			maxMemType1: 0,
		};

		const bytes = writePost(table);
		expect(bytes.length).toBe(32);

		const reparsed = parsePost(bytes);
		expect(reparsed).toEqual(table);
	});

	it('should round-trip a version 2.0 table with standard + custom names', () => {
		const table = {
			version: 0x00020000,
			italicAngle: 0,
			underlinePosition: -100,
			underlineThickness: 50,
			isFixedPitch: 0,
			minMemType42: 0,
			maxMemType42: 0,
			minMemType1: 0,
			maxMemType1: 0,
			glyphNames: [
				'.notdef',
				'space',
				'A',
				'B',
				'myCustomGlyph',
				'anotherGlyph',
			],
		};

		const bytes = writePost(table);
		const reparsed = parsePost(bytes);

		expect(reparsed).toEqual(table);
	});

	it('should deduplicate custom glyph names in version 2.0', () => {
		const table = {
			version: 0x00020000,
			italicAngle: 0,
			underlinePosition: -100,
			underlineThickness: 50,
			isFixedPitch: 0,
			minMemType42: 0,
			maxMemType42: 0,
			minMemType1: 0,
			maxMemType1: 0,
			glyphNames: ['.notdef', 'custom1', 'custom1', 'A'],
		};

		const bytes = writePost(table);
		const reparsed = parsePost(bytes);
		expect(reparsed).toEqual(table);

		// Verify dedup: "custom1" should appear only once in the Pascal strings.
		// Header (32) + numGlyphs (2) + 4 indices (8) + 1 Pascal string (1+7) = 50
		expect(bytes.length).toBe(50);
	});
});
