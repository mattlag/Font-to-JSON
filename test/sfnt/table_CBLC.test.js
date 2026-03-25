/**
 * Tests for CBLC table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseCBLC, writeCBLC } from '../../src/sfnt/table_CBLC.js';
import { DataWriter } from '../../src/writer.js';

describe('CBLC table', () => {
	it('should parse index subtable format 1 (variable metrics, uint32 offsets)', () => {
		// Build a synthetic CBLC with one size record and one format 1 index subtable
		const w = new DataWriter(256);
		// Header
		w.uint16(3); // majorVersion
		w.uint16(0); // minorVersion
		w.uint32(1); // numSizes

		// BitmapSize record (48 bytes)
		const indexSubTableArrayOffset = 8 + 48; // right after header + 1 size record
		w.uint32(indexSubTableArrayOffset);
		w.uint32(100); // indexTablesSize (unused by parser)
		w.uint32(1); // numberOfIndexSubTables
		w.uint32(0); // colorRef
		// hori SbitLineMetrics (12 bytes)
		w.int8(10); // ascender
		w.int8(-3); // descender
		w.uint8(8); // widthMax
		for (let i = 0; i < 9; i++) w.int8(0);
		// vert SbitLineMetrics (12 bytes)
		for (let i = 0; i < 12; i++) w.int8(0);
		w.uint16(5); // startGlyphIndex
		w.uint16(7); // endGlyphIndex (3 glyphs: 5, 6, 7)
		w.uint8(20); // ppemX
		w.uint8(20); // ppemY
		w.uint8(32); // bitDepth
		w.int8(1); // flags

		// IndexSubtableRecord: firstGlyph(2) + lastGlyph(2) + offset(4)
		w.uint16(5); // firstGlyphIndex
		w.uint16(7); // lastGlyphIndex
		w.uint32(8); // indexSubtableOffset (relative to list start)

		// IndexSubtable format 1: header(8) + 4 offsets (3 glyphs + 1 sentinel)
		w.uint16(1); // indexFormat
		w.uint16(17); // imageFormat
		w.uint32(4); // imageDataOffset
		w.uint32(0); // sbitOffsets[0]
		w.uint32(100); // sbitOffsets[1]
		w.uint32(200); // sbitOffsets[2]
		w.uint32(310); // sbitOffsets[3] (sentinel)

		const parsed = parseCBLC(w.toArray());
		expect(parsed.majorVersion).toBe(3);
		expect(parsed.sizes.length).toBe(1);

		const size = parsed.sizes[0];
		expect(size.startGlyphIndex).toBe(5);
		expect(size.endGlyphIndex).toBe(7);
		expect(size.ppemX).toBe(20);
		expect(size.hori.ascender).toBe(10);
		expect(size.indexSubTables.length).toBe(1);

		const sub = size.indexSubTables[0];
		expect(sub.firstGlyphIndex).toBe(5);
		expect(sub.lastGlyphIndex).toBe(7);
		expect(sub.indexFormat).toBe(1);
		expect(sub.imageFormat).toBe(17);
		expect(sub.imageDataOffset).toBe(4);
		expect(sub.sbitOffsets).toEqual([0, 100, 200, 310]);
	});

	it('should parse index subtable format 2 (constant metrics)', () => {
		const w = new DataWriter(256);
		w.uint16(2); w.uint16(0); w.uint32(1);

		const indexListOffset = 8 + 48;
		w.uint32(indexListOffset); w.uint32(50); w.uint32(1); w.uint32(0);
		for (let i = 0; i < 24; i++) w.int8(0); // hori + vert
		w.uint16(10); w.uint16(12); // glyph range 10-12
		w.uint8(16); w.uint8(16); w.uint8(1); w.int8(1);

		// IndexSubtableRecord
		w.uint16(10); w.uint16(12); w.uint32(8);

		// IndexSubtable format 2: header(8) + imageSize(4) + BigGlyphMetrics(8)
		w.uint16(2); w.uint16(5); w.uint32(100); // header
		w.uint32(64); // imageSize
		// BigGlyphMetrics
		w.uint8(16); w.uint8(16); // height, width
		w.int8(0); w.int8(16); w.uint8(16); // horiBearingX/Y, horiAdvance
		w.int8(-8); w.int8(0); w.uint8(16); // vertBearingX/Y, vertAdvance

		const parsed = parseCBLC(w.toArray());
		const sub = parsed.sizes[0].indexSubTables[0];
		expect(sub.indexFormat).toBe(2);
		expect(sub.imageFormat).toBe(5);
		expect(sub.imageSize).toBe(64);
		expect(sub.bigMetrics.height).toBe(16);
		expect(sub.bigMetrics.width).toBe(16);
		expect(sub.bigMetrics.horiAdvance).toBe(16);
	});

	it('should parse index subtable format 3 (uint16 offsets)', () => {
		const w = new DataWriter(256);
		w.uint16(2); w.uint16(0); w.uint32(1);

		const indexListOffset = 8 + 48;
		w.uint32(indexListOffset); w.uint32(50); w.uint32(1); w.uint32(0);
		for (let i = 0; i < 24; i++) w.int8(0);
		w.uint16(0); w.uint16(1); // 2 glyphs
		w.uint8(12); w.uint8(12); w.uint8(8); w.int8(1);

		w.uint16(0); w.uint16(1); w.uint32(8);

		// Format 3: header(8) + 3 uint16 offsets (2 glyphs + sentinel)
		w.uint16(3); w.uint16(1); w.uint32(200);
		w.uint16(0); w.uint16(50); w.uint16(120);

		const parsed = parseCBLC(w.toArray());
		const sub = parsed.sizes[0].indexSubTables[0];
		expect(sub.indexFormat).toBe(3);
		expect(sub.sbitOffsets).toEqual([0, 50, 120]);
	});

	it('should round-trip structured CBLC via coordinated write', () => {
		// Build a CBLC with 1 size, 1 format-1 subtable
		const w = new DataWriter(256);
		w.uint16(3); w.uint16(0); w.uint32(1);
		const indexListOffset = 8 + 48;
		w.uint32(indexListOffset); w.uint32(50); w.uint32(1); w.uint32(0);
		w.int8(8); w.int8(-2); w.uint8(10); // hori: ascender, descender, widthMax
		for (let i = 0; i < 9; i++) w.int8(0);
		for (let i = 0; i < 12; i++) w.int8(0); // vert
		w.uint16(1); w.uint16(3); // glyph range
		w.uint8(16); w.uint8(16); w.uint8(32); w.int8(1);

		w.uint16(1); w.uint16(3); w.uint32(8);
		w.uint16(1); w.uint16(17); w.uint32(4);
		w.uint32(0); w.uint32(50); w.uint32(110); w.uint32(180);

		const parsed = parseCBLC(w.toArray());

		// Provide offsetInfo for the writer
		const offsetInfo = [[{
			imageDataOffset: 4,
			sbitOffsets: [0, 50, 110, 180],
		}]];

		const written = writeCBLC(parsed, offsetInfo);
		const reparsed = parseCBLC(written);

		expect(reparsed.majorVersion).toBe(3);
		expect(reparsed.sizes[0].hori.ascender).toBe(8);
		expect(reparsed.sizes[0].indexSubTables[0].indexFormat).toBe(1);
		expect(reparsed.sizes[0].indexSubTables[0].sbitOffsets).toEqual([0, 50, 110, 180]);
	});
});
