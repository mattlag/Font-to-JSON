/**
 * Tests for head table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFont } from '../../src/main.js';
import { parseHead, writeHead } from '../../src/sfnt/table_head.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

describe('head table parsing', () => {
	it('should parse the head table from an OTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const head = font.tables['head'];

		expect(head.majorVersion).toBe(1);
		expect(head.minorVersion).toBe(0);
		expect(head.magicNumber).toBe(0x5f0f3cf5);
	});

	it('should have a valid unitsPerEm value', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const head = font.tables['head'];

		expect(head.unitsPerEm).toBeGreaterThanOrEqual(16);
		expect(head.unitsPerEm).toBeLessThanOrEqual(16384);
	});

	it('should have LONGDATETIME fields as BigInt', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const head = font.tables['head'];

		expect(typeof head.created).toBe('bigint');
		expect(typeof head.modified).toBe('bigint');
	});

	it('should have a bounding box with xMin <= xMax and yMin <= yMax', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const head = font.tables['head'];

		expect(head.xMin).toBeLessThanOrEqual(head.xMax);
		expect(head.yMin).toBeLessThanOrEqual(head.yMax);
	});

	it('should have indexToLocFormat of 0 or 1', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const head = font.tables['head'];

		expect([0, 1]).toContain(head.indexToLocFormat);
	});

	it('should not have _raw on parsed head table', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const head = font.tables['head'];

		expect(head._raw).toBeUndefined();
		expect(head._checksum).toBeTypeOf('number');
	});
});

describe('head table round-trip', () => {
	it('should produce identical data after parse → write → re-parse (OTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const { _checksum, ...headData } = font.tables['head'];

		const writtenBytes = writeHead(headData);
		const reparsed = parseHead(writtenBytes);

		expect(reparsed).toEqual(headData);
	});

	it('should produce identical data after parse → write → re-parse (TTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFont(buffer);
		const { _checksum, ...headData } = font.tables['head'];

		const writtenBytes = writeHead(headData);
		const reparsed = parseHead(writtenBytes);

		expect(reparsed).toEqual(headData);
	});

	it('should write exactly 54 bytes', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer);
		const { _checksum, ...headData } = font.tables['head'];

		const writtenBytes = writeHead(headData);
		expect(writtenBytes.length).toBe(54);
	});
});
