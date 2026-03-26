/**
 * Tests for bdat table parsing and writing — delegates to CBDT.
 */

import { describe, expect, it } from 'vitest';
import { parseBdat } from '../../src/sfnt/table_bdat.js';
import { parseCBLC } from '../../src/sfnt/table_CBLC.js';
import { DataWriter } from '../../src/writer.js';

describe('bdat table', () => {
	it('should parse bitmap data using bloc as index (format 1 glyphs)', () => {
		// Build a minimal bloc (CBLC-format) for one size, one subtable, format 1
		const blocW = new DataWriter(256);
		blocW.uint16(2);
		blocW.uint16(0);
		blocW.uint32(1);
		const listOffset = 8 + 48;
		blocW.uint32(listOffset);
		blocW.uint32(50);
		blocW.uint32(1);
		blocW.uint32(0);
		for (let i = 0; i < 24; i++) blocW.int8(0);
		blocW.uint16(0);
		blocW.uint16(0); // single glyph
		blocW.uint8(8);
		blocW.uint8(8);
		blocW.uint8(1);
		blocW.int8(0);
		// IndexSubtableRecord: firstGlyph=0, lastGlyph=0, offset=8
		blocW.uint16(0);
		blocW.uint16(0);
		blocW.uint32(8);
		// Format 1 index subtable: indexFormat=1, imageFormat=1, imageDataOffset=4
		blocW.uint16(1);
		blocW.uint16(1); // imageFormat 1 = smallGlyphMetrics + byte-aligned
		blocW.uint32(4);
		// 2 offsets (1 glyph + 1 sentinel): glyph data at offsets 0 and 13
		blocW.uint32(0);
		blocW.uint32(13); // 5 metrics + 8 bytes image data

		const blocParsed = parseCBLC(blocW.toArray());

		// Build bdat with version + glyph bitmap at offset 4
		const bdatW = new DataWriter(64);
		bdatW.uint16(2);
		bdatW.uint16(0); // version 2.0 (0x00020000)
		// Glyph bitmap data at offset 4 (imageDataOffset)
		// Format 1: smallGlyphMetrics (5 bytes) + imageData (8 bytes = 8x8 at 1bpp)
		bdatW.uint8(8); // height
		bdatW.uint8(8); // width
		bdatW.int8(0); // bearingX
		bdatW.int8(8); // bearingY
		bdatW.uint8(8); // advance
		// 8 bytes of image data (8x8 bitmap, 1 byte per row)
		for (let i = 0; i < 8; i++) bdatW.uint8(0xff);

		const bdatParsed = parseBdat(bdatW.toArray(), { bloc: blocParsed });
		expect(bdatParsed.version).toBe(0x00020000);
		expect(bdatParsed.bitmapData).toBeDefined();
		expect(Object.keys(bdatParsed.bitmapData).length).toBeGreaterThan(0);
	});
});
