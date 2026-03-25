/**
 * Tests for the fpgm (Font Program) table parser and writer.
 */

import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFontTables } from '../../src/main.js';
import { parseFpgm, writeFpgm } from '../../src/ttf/table_fpgm.js';

const SAMPLES = 'test/sample fonts';

function loadFont(filename) {
	const buf = fs.readFileSync(path.join(SAMPLES, filename));
	return importFontTables(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

describe('fpgm table', () => {
	it('should parse the fpgm table from fira.ttf', () => {
		const font = loadFont('fira.ttf');
		const fpgm = font.tables.fpgm;
		expect(fpgm).toBeDefined();
		expect(fpgm.instructions).toBeInstanceOf(Array);
		expect(fpgm.instructions).toHaveLength(3350);
	});

	it('should parse the fpgm table from noto.ttf', () => {
		const font = loadFont('noto.ttf');
		const fpgm = font.tables.fpgm;
		expect(fpgm).toBeDefined();
		expect(fpgm.instructions).toHaveLength(3596);
	});

	it('should parse the fpgm table from mtextra.ttf', () => {
		const font = loadFont('mtextra.ttf');
		const fpgm = font.tables.fpgm;
		expect(fpgm).toBeDefined();
		expect(fpgm.instructions).toHaveLength(374);
	});

	it('should not have _raw (fully parsed)', () => {
		const font = loadFont('fira.ttf');
		expect(font.tables.fpgm._raw).toBeUndefined();
	});

	it('should contain only uint8 values', () => {
		const font = loadFont('fira.ttf');
		for (const b of font.tables.fpgm.instructions) {
			expect(b).toBeGreaterThanOrEqual(0);
			expect(b).toBeLessThanOrEqual(255);
		}
	});

	it('should round-trip fpgm from fira.ttf', () => {
		const font1 = loadFont('fira.ttf');
		const exported = exportFont(font1);
		const font2 = importFontTables(exported);
		expect(font2.tables.fpgm.instructions).toEqual(
			font1.tables.fpgm.instructions,
		);
	});

	it('should round-trip fpgm from noto.ttf', () => {
		const font1 = loadFont('noto.ttf');
		const exported = exportFont(font1);
		const font2 = importFontTables(exported);
		expect(font2.tables.fpgm.instructions).toEqual(
			font1.tables.fpgm.instructions,
		);
	});

	it('should round-trip fpgm from mtextra.ttf', () => {
		const font1 = loadFont('mtextra.ttf');
		const exported = exportFont(font1);
		const font2 = importFontTables(exported);
		expect(font2.tables.fpgm.instructions).toEqual(
			font1.tables.fpgm.instructions,
		);
	});

	it('should handle a synthetic fpgm', () => {
		const data = { instructions: [0, 64, 128, 255] };
		const bytes = writeFpgm(data);
		expect(bytes).toEqual([0, 64, 128, 255]);
		const parsed = parseFpgm(bytes);
		expect(parsed.instructions).toEqual(data.instructions);
	});
});
