/**
 * Tests for the vhea (Vertical Header) table parser and writer.
 */

import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { exportFont } from '../../src/export.js';
import { importFontTables } from '../../src/import.js';
import { parseVhea, writeVhea } from '../../src/sfnt/table_vhea.js';

const SAMPLES = 'test/sample fonts';

function loadFont(filename) {
	const buf = fs.readFileSync(path.join(SAMPLES, filename));
	return importFontTables(
		buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
	);
}

describe('vhea table', () => {
	it('should parse the vhea table from BungeeTint-Regular.ttf', () => {
		const font = loadFont('BungeeTint-Regular.ttf');
		const vhea = font.tables.vhea;
		expect(vhea).toBeDefined();
		expect(vhea.version).toBe(0x00011000); // v1.1
		expect(vhea.vertTypoAscender).toBe(500);
		expect(vhea.vertTypoDescender).toBe(-500);
		expect(vhea.vertTypoLineGap).toBe(0);
		expect(vhea.advanceHeightMax).toBe(1435);
		expect(vhea.numOfLongVerMetrics).toBe(2106);
	});

	it('should parse the vhea table from noto.ttf', () => {
		const font = loadFont('noto.ttf');
		const vhea = font.tables.vhea;
		expect(vhea).toBeDefined();
		expect(vhea.version).toBe(0x00011000);
		expect(vhea.vertTypoAscender).toBe(500);
		expect(vhea.vertTypoDescender).toBe(-500);
		expect(vhea.vertTypoLineGap).toBe(1000);
		expect(vhea.advanceHeightMax).toBe(1699);
		expect(vhea.minTopSideBearing).toBe(0);
		expect(vhea.minBottomSideBearing).toBe(-1310);
		expect(vhea.yMaxExtent).toBe(1491);
		expect(vhea.numOfLongVerMetrics).toBe(2661);
	});

	it('should parse caret and reserved fields', () => {
		const font = loadFont('noto.ttf');
		const vhea = font.tables.vhea;
		// Vertical font: horizontal caret (rise=0, run=1)
		expect(vhea.caretSlopeRise).toBe(0);
		expect(vhea.caretSlopeRun).toBe(1);
		expect(vhea.caretOffset).toBe(0);
		expect(vhea.reserved1).toBe(0);
		expect(vhea.reserved2).toBe(0);
		expect(vhea.reserved3).toBe(0);
		expect(vhea.reserved4).toBe(0);
		expect(vhea.metricDataFormat).toBe(0);
	});

	it('should not have _raw (fully parsed)', () => {
		const font = loadFont('BungeeTint-Regular.ttf');
		expect(font.tables.vhea._raw).toBeUndefined();
	});

	it('should always produce 36 bytes', () => {
		const font = loadFont('noto.ttf');
		const bytes = writeVhea(font.tables.vhea);
		expect(bytes).toHaveLength(36);
	});

	it('should round-trip vhea from BungeeTint-Regular.ttf', () => {
		const font1 = loadFont('BungeeTint-Regular.ttf');
		const exported = exportFont(font1);
		const font2 = importFontTables(exported);
		const { _checksum: _a, ...vhea1 } = font1.tables.vhea;
		const { _checksum: _b, ...vhea2 } = font2.tables.vhea;
		expect(vhea2).toEqual(vhea1);
	});

	it('should round-trip vhea from noto.ttf', () => {
		const font1 = loadFont('noto.ttf');
		const exported = exportFont(font1);
		const font2 = importFontTables(exported);
		const { _checksum: _a, ...vhea1 } = font1.tables.vhea;
		const { _checksum: _b, ...vhea2 } = font2.tables.vhea;
		expect(vhea2).toEqual(vhea1);
	});

	it('should handle a synthetic vhea (v1.0)', () => {
		const data = {
			version: 0x00010000,
			vertTypoAscender: 1024,
			vertTypoDescender: -1024,
			vertTypoLineGap: 0,
			advanceHeightMax: 2048,
			minTopSideBearing: -100,
			minBottomSideBearing: -200,
			yMaxExtent: 1900,
			caretSlopeRise: 0,
			caretSlopeRun: 1,
			caretOffset: 0,
			reserved1: 0,
			reserved2: 0,
			reserved3: 0,
			reserved4: 0,
			metricDataFormat: 0,
			numOfLongVerMetrics: 500,
		};
		const bytes = writeVhea(data);
		expect(bytes).toHaveLength(36);
		const parsed = parseVhea(bytes);
		expect(parsed).toEqual(data);
	});
});
