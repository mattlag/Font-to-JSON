/**
 * Tests for the gasp (Grid-fitting and Scan-conversion Procedure) table parser and writer.
 */

import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { exportFont } from '../../src/export.js';
import { importFontTables } from '../../src/import.js';
import { parseGasp, writeGasp } from '../../src/ttf/table_gasp.js';

const SAMPLES = 'test/sample fonts';

function loadFont(filename) {
	const buf = fs.readFileSync(path.join(SAMPLES, filename));
	return importFontTables(
		buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
	);
}

describe('gasp table', () => {
	it('should parse the gasp table from oblegg.ttf (version 0)', () => {
		const font = loadFont('oblegg.ttf');
		const gasp = font.tables.gasp;
		expect(gasp).toBeDefined();
		expect(gasp.version).toBe(0);
		expect(gasp.gaspRanges).toHaveLength(1);
		expect(gasp.gaspRanges[0].rangeMaxPPEM).toBe(0xffff);
		expect(gasp.gaspRanges[0].rangeGaspBehavior).toBe(0x0002); // GASP_DOGRAY
	});

	it('should parse the gasp table from fira.ttf (version 1)', () => {
		const font = loadFont('fira.ttf');
		const gasp = font.tables.gasp;
		expect(gasp).toBeDefined();
		expect(gasp.version).toBe(1);
		expect(gasp.gaspRanges).toHaveLength(1);
		expect(gasp.gaspRanges[0].rangeMaxPPEM).toBe(0xffff);
		expect(gasp.gaspRanges[0].rangeGaspBehavior).toBe(0x000f); // all flags set
	});

	it('should parse the gasp table from BungeeTint-Regular.ttf', () => {
		const font = loadFont('BungeeTint-Regular.ttf');
		const gasp = font.tables.gasp;
		expect(gasp).toBeDefined();
		expect(gasp.version).toBe(1);
		expect(gasp.gaspRanges).toHaveLength(1);
		expect(gasp.gaspRanges[0].rangeGaspBehavior).toBe(0x000f);
	});

	it('should not have _raw (fully parsed)', () => {
		const font = loadFont('oblegg.ttf');
		expect(font.tables.gasp._raw).toBeUndefined();
	});

	it('should round-trip gasp from oblegg.ttf', () => {
		const font1 = loadFont('oblegg.ttf');
		const exported = exportFont(font1);
		const font2 = importFontTables(exported);
		expect(font2.tables.gasp.version).toEqual(font1.tables.gasp.version);
		expect(font2.tables.gasp.gaspRanges).toEqual(font1.tables.gasp.gaspRanges);
	});

	it('should round-trip gasp from fira.ttf', () => {
		const font1 = loadFont('fira.ttf');
		const exported = exportFont(font1);
		const font2 = importFontTables(exported);
		expect(font2.tables.gasp.version).toEqual(font1.tables.gasp.version);
		expect(font2.tables.gasp.gaspRanges).toEqual(font1.tables.gasp.gaspRanges);
	});

	it('should round-trip gasp from noto.ttf', () => {
		const font1 = loadFont('noto.ttf');
		const exported = exportFont(font1);
		const font2 = importFontTables(exported);
		expect(font2.tables.gasp.version).toEqual(font1.tables.gasp.version);
		expect(font2.tables.gasp.gaspRanges).toEqual(font1.tables.gasp.gaspRanges);
	});

	it('should handle a multi-range synthetic gasp', () => {
		const data = {
			version: 1,
			gaspRanges: [
				{ rangeMaxPPEM: 8, rangeGaspBehavior: 0x000a },
				{ rangeMaxPPEM: 16, rangeGaspBehavior: 0x0005 },
				{ rangeMaxPPEM: 19, rangeGaspBehavior: 0x0007 },
				{ rangeMaxPPEM: 0xffff, rangeGaspBehavior: 0x000f },
			],
		};
		const bytes = writeGasp(data);
		// 4 header + 4 ranges Ãƒâ€” 4 bytes = 20
		expect(bytes).toHaveLength(20);
		const parsed = parseGasp(bytes);
		expect(parsed.version).toBe(1);
		expect(parsed.gaspRanges).toEqual(data.gaspRanges);
	});
});
