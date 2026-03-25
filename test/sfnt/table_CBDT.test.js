/**
 * Tests for CBDT table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseCBDT, writeCBDT, writeCBDTComputeOffsets } from '../../src/sfnt/table_CBDT.js';
import { parseCBLC, writeCBLC } from '../../src/sfnt/table_CBLC.js';
import { DataWriter } from '../../src/writer.js';

describe('CBDT table', () => {
	it('should fall back to raw data blob when CBLC not available', () => {
		const original = { version: 0x00030000, data: [1, 2, 3, 4, 5] };
		const parsed = parseCBDT(writeCBDT(original));
		expect(parsed.version).toBe(0x00030000);
		expect(parsed.data).toEqual([1, 2, 3, 4, 5]);
	});

	it('should parse format 17 glyph records (small metrics + PNG)', () => {
		// Build CBLC with format 1 index subtable (2 glyphs: 0, 1)
		const cblcW = new DataWriter(256);
		cblcW.uint16(3); cblcW.uint16(0); cblcW.uint32(1);
		const listOffset = 8 + 48;
		cblcW.uint32(listOffset); cblcW.uint32(50); cblcW.uint32(1); cblcW.uint32(0);
		for (let i = 0; i < 24; i++) cblcW.int8(0);
		cblcW.uint16(0); cblcW.uint16(1);
		cblcW.uint8(128); cblcW.uint8(128); cblcW.uint8(32); cblcW.int8(1);
		cblcW.uint16(0); cblcW.uint16(1); cblcW.uint32(8);
		cblcW.uint16(1); cblcW.uint16(17); cblcW.uint32(4); // imageDataOffset = 4
		cblcW.uint32(0); cblcW.uint32(14); cblcW.uint32(28); // sbitOffsets

		// Build CBDT with two format 17 glyph records
		const cbdtW = new DataWriter(64);
		cbdtW.uint32(0x00030000); // version (offset 0-3)
		// Glyph 0 at offset 4: SmallGlyphMetrics(5) + dataLen(4) + data(5) = 14 bytes
		cbdtW.uint8(10); cbdtW.uint8(10); cbdtW.int8(0); cbdtW.int8(10); cbdtW.uint8(10);
		cbdtW.uint32(5);
		cbdtW.uint8(0x89); cbdtW.uint8(0x50); cbdtW.uint8(0x4E); cbdtW.uint8(0x47); cbdtW.uint8(0x0D);
		// Glyph 1 at offset 18: SmallGlyphMetrics(5) + dataLen(4) + data(5) = 14 bytes
		cbdtW.uint8(12); cbdtW.uint8(12); cbdtW.int8(1); cbdtW.int8(12); cbdtW.uint8(12);
		cbdtW.uint32(5);
		cbdtW.uint8(0x89); cbdtW.uint8(0x50); cbdtW.uint8(0x4E); cbdtW.uint8(0x47); cbdtW.uint8(0x0A);

		const cblc = parseCBLC(cblcW.toArray());
		const parsed = parseCBDT(cbdtW.toArray(), { CBLC: cblc });

		expect(parsed.version).toBe(0x00030000);
		expect(parsed.bitmapData.length).toBe(1);
		expect(parsed.bitmapData[0].length).toBe(1);
		expect(parsed.bitmapData[0][0].length).toBe(2);

		const g0 = parsed.bitmapData[0][0][0];
		expect(g0.smallMetrics.height).toBe(10);
		expect(g0.smallMetrics.width).toBe(10);
		expect(g0.imageData[0]).toBe(0x89); // PNG magic

		const g1 = parsed.bitmapData[0][0][1];
		expect(g1.smallMetrics.height).toBe(12);
		expect(g1.imageData.length).toBe(5);
	});

	it('should round-trip structured CBDT via coordinated write', () => {
		const cblc = {
			majorVersion: 3, minorVersion: 0,
			sizes: [{
				colorRef: 0,
				hori: { ascender: 10, descender: -2, widthMax: 8 },
				vert: {},
				startGlyphIndex: 0, endGlyphIndex: 1,
				ppemX: 128, ppemY: 128, bitDepth: 32, flags: 1,
				indexSubTables: [{
					firstGlyphIndex: 0, lastGlyphIndex: 1,
					indexFormat: 1, imageFormat: 17,
				}],
			}],
		};

		const cbdt = {
			version: 0x00030000,
			bitmapData: [[
				[
					{ smallMetrics: { height: 10, width: 10, bearingX: 0, bearingY: 10, advance: 10 },
					  imageData: [0x89, 0x50, 0x4E, 0x47] },
					{ smallMetrics: { height: 12, width: 12, bearingX: 1, bearingY: 12, advance: 12 },
					  imageData: [0x89, 0x50, 0x4E] },
				],
			]],
		};

		const { bytes: cbdtBytes, offsetInfo } = writeCBDTComputeOffsets(cbdt, cblc);
		const cblcBytes = writeCBLC(cblc, offsetInfo);

		// Re-parse
		const reparsedCBLC = parseCBLC(cblcBytes);
		const reparsedCBDT = parseCBDT(cbdtBytes, { CBLC: reparsedCBLC });

		expect(reparsedCBDT.version).toBe(0x00030000);
		expect(reparsedCBDT.bitmapData[0][0].length).toBe(2);
		expect(reparsedCBDT.bitmapData[0][0][0].smallMetrics.height).toBe(10);
		expect(reparsedCBDT.bitmapData[0][0][0].imageData).toEqual([0x89, 0x50, 0x4E, 0x47]);
		expect(reparsedCBDT.bitmapData[0][0][1].smallMetrics.height).toBe(12);
		expect(reparsedCBDT.bitmapData[0][0][1].imageData).toEqual([0x89, 0x50, 0x4E]);
	});

	it('should parse format 5 glyph records (metrics in CBLC)', () => {
		// Build CBLC with format 2 index subtable (constant metrics, 2 glyphs)
		const cblcW = new DataWriter(256);
		cblcW.uint16(2); cblcW.uint16(0); cblcW.uint32(1);
		const listOffset = 8 + 48;
		cblcW.uint32(listOffset); cblcW.uint32(50); cblcW.uint32(1); cblcW.uint32(0);
		for (let i = 0; i < 24; i++) cblcW.int8(0);
		cblcW.uint16(0); cblcW.uint16(1);
		cblcW.uint8(8); cblcW.uint8(8); cblcW.uint8(1); cblcW.int8(1);
		cblcW.uint16(0); cblcW.uint16(1); cblcW.uint32(8);
		// Format 2: header + imageSize + BigGlyphMetrics
		cblcW.uint16(2); cblcW.uint16(5); cblcW.uint32(4);
		cblcW.uint32(8); // imageSize = 8 bytes per glyph
		cblcW.uint8(8); cblcW.uint8(8); cblcW.int8(0); cblcW.int8(8);
		cblcW.uint8(8); cblcW.int8(-4); cblcW.int8(0); cblcW.uint8(8);

		// Build CBDT with format 5 data (imageData only, no metrics)
		const cbdtW = new DataWriter(32);
		cbdtW.uint32(0x00020000);
		for (let i = 0; i < 8; i++) cbdtW.uint8(0xAA); // glyph 0 data
		for (let i = 0; i < 8; i++) cbdtW.uint8(0xBB); // glyph 1 data

		const cblc = parseCBLC(cblcW.toArray());
		const parsed = parseCBDT(cbdtW.toArray(), { CBLC: cblc });

		expect(parsed.bitmapData[0][0].length).toBe(2);
		expect(parsed.bitmapData[0][0][0].imageData.length).toBe(8);
		expect(parsed.bitmapData[0][0][0].imageData[0]).toBe(0xAA);
		expect(parsed.bitmapData[0][0][1].imageData[0]).toBe(0xBB);
	});

	it('should handle null entries for glyphs with no data', () => {
		// Format 1 with zero-length glyph (offset[i] == offset[i+1])
		const cblcW = new DataWriter(256);
		cblcW.uint16(3); cblcW.uint16(0); cblcW.uint32(1);
		const listOffset = 8 + 48;
		cblcW.uint32(listOffset); cblcW.uint32(50); cblcW.uint32(1); cblcW.uint32(0);
		for (let i = 0; i < 24; i++) cblcW.int8(0);
		cblcW.uint16(0); cblcW.uint16(1);
		cblcW.uint8(16); cblcW.uint8(16); cblcW.uint8(32); cblcW.int8(1);
		cblcW.uint16(0); cblcW.uint16(1); cblcW.uint32(8);
		cblcW.uint16(1); cblcW.uint16(17); cblcW.uint32(4);
		cblcW.uint32(0); cblcW.uint32(0); cblcW.uint32(14); // glyph 0: 0 bytes, glyph 1: 14 bytes

		const cbdtW = new DataWriter(32);
		cbdtW.uint32(0x00030000);
		// Only glyph 1 has data
		cbdtW.uint8(6); cbdtW.uint8(6); cbdtW.int8(0); cbdtW.int8(6); cbdtW.uint8(6);
		cbdtW.uint32(5);
		cbdtW.uint8(1); cbdtW.uint8(2); cbdtW.uint8(3); cbdtW.uint8(4); cbdtW.uint8(5);

		const cblc = parseCBLC(cblcW.toArray());
		const parsed = parseCBDT(cbdtW.toArray(), { CBLC: cblc });

		expect(parsed.bitmapData[0][0][0]).toBeNull();
		expect(parsed.bitmapData[0][0][1].smallMetrics.height).toBe(6);
	});
});
