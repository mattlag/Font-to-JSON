/**
 * Tests for the prep (Control Value Program) table parser and writer.
 */

import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFontTables } from '../../src/main.js';
import { parsePrep, writePrep } from '../../src/ttf/table_prep.js';

const SAMPLES = 'test/sample fonts';

function loadFont(filename) {
	const buf = fs.readFileSync(path.join(SAMPLES, filename));
	return importFontTables(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

describe('prep table', () => {
	it('should parse the prep table from fira.ttf', () => {
		const font = loadFont('fira.ttf');
		const prep = font.tables.prep;
		expect(prep).toBeDefined();
		expect(prep.instructions).toBeInstanceOf(Array);
		expect(prep.instructions).toHaveLength(213);
	});

	it('should parse the prep table from noto.ttf', () => {
		const font = loadFont('noto.ttf');
		const prep = font.tables.prep;
		expect(prep).toBeDefined();
		expect(prep.instructions).toHaveLength(167);
	});

	it('should parse the prep table from mtextra.ttf', () => {
		const font = loadFont('mtextra.ttf');
		const prep = font.tables.prep;
		expect(prep).toBeDefined();
		expect(prep.instructions).toHaveLength(63);
	});

	it('should not have _raw (fully parsed)', () => {
		const font = loadFont('fira.ttf');
		expect(font.tables.prep._raw).toBeUndefined();
	});

	it('should contain only uint8 values', () => {
		const font = loadFont('noto.ttf');
		for (const b of font.tables.prep.instructions) {
			expect(b).toBeGreaterThanOrEqual(0);
			expect(b).toBeLessThanOrEqual(255);
		}
	});

	it('should round-trip prep from fira.ttf', () => {
		const font1 = loadFont('fira.ttf');
		const exported = exportFont(font1);
		const font2 = importFontTables(exported);
		expect(font2.tables.prep.instructions).toEqual(
			font1.tables.prep.instructions,
		);
	});

	it('should round-trip prep from noto.ttf', () => {
		const font1 = loadFont('noto.ttf');
		const exported = exportFont(font1);
		const font2 = importFontTables(exported);
		expect(font2.tables.prep.instructions).toEqual(
			font1.tables.prep.instructions,
		);
	});

	it('should round-trip prep from mtextra.ttf', () => {
		const font1 = loadFont('mtextra.ttf');
		const exported = exportFont(font1);
		const font2 = importFontTables(exported);
		expect(font2.tables.prep.instructions).toEqual(
			font1.tables.prep.instructions,
		);
	});

	it('should handle a synthetic prep', () => {
		const data = { instructions: [176, 0, 44] };
		const bytes = writePrep(data);
		expect(bytes).toEqual([176, 0, 44]);
		const parsed = parsePrep(bytes);
		expect(parsed.instructions).toEqual(data.instructions);
	});
});
