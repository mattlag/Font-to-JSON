/**
 * Tests for the vmtx (Vertical Metrics) table parser and writer.
 */

import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFont } from '../../src/main.js';

const SAMPLES = 'test/sample fonts';

function loadFont(filename) {
	const buf = fs.readFileSync(path.join(SAMPLES, filename));
	return importFont(
		buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
	).raw;
}

describe('vmtx table', () => {
	it('should parse the vmtx table from BungeeTint-Regular.ttf', () => {
		const font = loadFont('BungeeTint-Regular.ttf');
		const vmtx = font.tables.vmtx;
		expect(vmtx).toBeDefined();
		expect(vmtx.vMetrics).toBeInstanceOf(Array);
		expect(vmtx.vMetrics).toHaveLength(2106);
		expect(vmtx.topSideBearings).toHaveLength(0);
		// First metric
		expect(vmtx.vMetrics[0].advanceHeight).toBe(1000);
		expect(vmtx.vMetrics[0].topSideBearing).toBe(100);
	});

	it('should parse the vmtx table from noto.ttf', () => {
		const font = loadFont('noto.ttf');
		const vmtx = font.tables.vmtx;
		expect(vmtx).toBeDefined();
		expect(vmtx.vMetrics).toHaveLength(2661);
		expect(vmtx.topSideBearings).toHaveLength(315);
		// First metric
		expect(vmtx.vMetrics[0].advanceHeight).toBe(1699);
		expect(vmtx.vMetrics[0].topSideBearing).toBe(355);
		// Check a topSideBearing value
		expect(vmtx.topSideBearings[0]).toBe(355);
	});

	it('should have consistent counts with vhea/maxp', () => {
		const font = loadFont('noto.ttf');
		const numOfLongVerMetrics = font.tables.vhea.numOfLongVerMetrics;
		const numGlyphs = font.tables.maxp.numGlyphs;
		expect(font.tables.vmtx.vMetrics).toHaveLength(numOfLongVerMetrics);
		expect(font.tables.vmtx.topSideBearings).toHaveLength(
			numGlyphs - numOfLongVerMetrics,
		);
	});

	it('should not have _raw (fully parsed)', () => {
		const font = loadFont('BungeeTint-Regular.ttf');
		expect(font.tables.vmtx._raw).toBeUndefined();
	});

	it('should round-trip vmtx from BungeeTint-Regular.ttf', () => {
		const font1 = loadFont('BungeeTint-Regular.ttf');
		const exported = exportFont(font1);
		const font2 = importFont(exported).raw;
		expect(font2.tables.vmtx.vMetrics).toEqual(font1.tables.vmtx.vMetrics);
		expect(font2.tables.vmtx.topSideBearings).toEqual(
			font1.tables.vmtx.topSideBearings,
		);
	});

	it('should round-trip vmtx from noto.ttf', () => {
		const font1 = loadFont('noto.ttf');
		const exported = exportFont(font1);
		const font2 = importFont(exported).raw;
		expect(font2.tables.vmtx.vMetrics).toEqual(font1.tables.vmtx.vMetrics);
		expect(font2.tables.vmtx.topSideBearings).toEqual(
			font1.tables.vmtx.topSideBearings,
		);
	});

	it('should handle vmtx where all glyphs have full vMetric records', () => {
		const font = loadFont('BungeeTint-Regular.ttf');
		// numOfLongVerMetrics == numGlyphs Ã¢â€ â€™ no extra topSideBearings
		expect(font.tables.vhea.numOfLongVerMetrics).toBe(
			font.tables.maxp.numGlyphs,
		);
		expect(font.tables.vmtx.topSideBearings).toHaveLength(0);
	});
});
