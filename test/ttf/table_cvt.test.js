/**
 * Tests for the cvt (Control Value Table) table parser and writer.
 */

import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFont } from '../../src/main.js';
import { parseCvt, writeCvt } from '../../src/ttf/table_cvt.js';

const SAMPLES = 'test/sample fonts';

function loadFont(filename) {
	const buf = fs.readFileSync(path.join(SAMPLES, filename));
	return importFont(
		buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
	).raw;
}

describe('cvt  table', () => {
	it('should parse the cvt table from fira.ttf', () => {
		const font = loadFont('fira.ttf');
		const cvt = font.tables['cvt '];
		expect(cvt).toBeDefined();
		expect(cvt.values).toBeInstanceOf(Array);
		expect(cvt.values).toHaveLength(152);
	});

	it('should parse the cvt table from noto.ttf', () => {
		const font = loadFont('noto.ttf');
		const cvt = font.tables['cvt '];
		expect(cvt).toBeDefined();
		expect(cvt.values).toHaveLength(26);
		// noto has some non-zero values
		expect(cvt.values[10]).toBe(91);
		expect(cvt.values[14]).toBe(714);
	});

	it('should parse the cvt table from mtextra.ttf', () => {
		const font = loadFont('mtextra.ttf');
		const cvt = font.tables['cvt '];
		expect(cvt).toBeDefined();
		expect(cvt.values).toHaveLength(53);
		// mtextra has non-zero values at the start
		expect(cvt.values[0]).toBe(6);
		expect(cvt.values[6]).toBe(-18);
	});

	it('should not have _raw (fully parsed)', () => {
		const font = loadFont('fira.ttf');
		expect(font.tables['cvt ']._raw).toBeUndefined();
	});

	it('should round-trip cvt from fira.ttf', () => {
		const font1 = loadFont('fira.ttf');
		const exported = exportFont(font1);
		const font2 = importFont(exported).raw;
		expect(font2.tables['cvt '].values).toEqual(font1.tables['cvt '].values);
	});

	it('should round-trip cvt from noto.ttf', () => {
		const font1 = loadFont('noto.ttf');
		const exported = exportFont(font1);
		const font2 = importFont(exported).raw;
		expect(font2.tables['cvt '].values).toEqual(font1.tables['cvt '].values);
	});

	it('should round-trip cvt from mtextra.ttf', () => {
		const font1 = loadFont('mtextra.ttf');
		const exported = exportFont(font1);
		const font2 = importFont(exported).raw;
		expect(font2.tables['cvt '].values).toEqual(font1.tables['cvt '].values);
	});

	it('should handle a synthetic cvt with negative FWORD values', () => {
		const data = { values: [0, 100, -100, 32767, -32768] };
		const bytes = writeCvt(data);
		expect(bytes).toHaveLength(10); // 5 values Ãƒâ€” 2 bytes
		const parsed = parseCvt(bytes);
		expect(parsed.values).toEqual(data.values);
	});
});
