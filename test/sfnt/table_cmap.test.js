/**
 * Tests for cmap table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFontTables } from '../../src/main.js';
import { parseCmap, writeCmap } from '../../src/sfnt/table_cmap.js';
import { DataWriter } from '../../src/writer.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

describe('cmap table parsing', () => {
	it('should parse the cmap table from an OTF file', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cmap = font.tables['cmap'];

		expect(cmap.version).toBe(0);
		expect(cmap.encodingRecords.length).toBeGreaterThan(0);
		expect(cmap.subtables.length).toBeGreaterThan(0);
	});

	it('should have valid encoding records', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cmap = font.tables['cmap'];

		for (const record of cmap.encodingRecords) {
			expect(record.platformID).toBeTypeOf('number');
			expect(record.encodingID).toBeTypeOf('number');
			expect(record.subtableIndex).toBeTypeOf('number');
			expect(record.subtableIndex).toBeLessThan(cmap.subtables.length);
		}
	});

	it('should not have _raw on parsed cmap table', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cmap = font.tables['cmap'];

		// Parsed tables should not have _raw at the table level
		expect(cmap._raw).toBeUndefined();
		// But should still have _checksum
		expect(cmap._checksum).toBeTypeOf('number');
	});

	it('should parse subtable formats as structured data', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cmap = font.tables['cmap'];

		for (const subtable of cmap.subtables) {
			expect(subtable.format).toBeTypeOf('number');

			// Supported formats should have structured data, not _raw
			if ([0, 2, 4, 6, 8, 10, 12, 13, 14].includes(subtable.format)) {
				expect(subtable._raw).toBeUndefined();
			}
		}
	});
});

describe('cmap table round-trip', () => {
	it('should produce identical data after parse â†’ write â†’ re-parse (OTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...cmapData } = font.tables['cmap'];

		const writtenBytes = writeCmap(cmapData);
		const reparsed = parseCmap(writtenBytes);

		expect(reparsed).toEqual(cmapData);
	});

	it('should produce identical data after parse â†’ write â†’ re-parse (TTF)', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const { _checksum, ...cmapData } = font.tables['cmap'];

		const writtenBytes = writeCmap(cmapData);
		const reparsed = parseCmap(writtenBytes);

		expect(reparsed).toEqual(cmapData);
	});
});

describe('cmap Format 4 specifics', () => {
	it('should have the final segment ending at 0xFFFF', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFontTables(buffer);
		const cmap = font.tables['cmap'];

		const fmt4 = cmap.subtables.find((s) => s.format === 4);
		if (fmt4) {
			const lastSeg = fmt4.segments[fmt4.segments.length - 1];
			expect(lastSeg.endCode).toBe(0xffff);
			expect(lastSeg.startCode).toBe(0xffff);
		}
	});
});

// ==========================================================================
//  Synthetic tests for cmap formats 2, 8, 10
// ==========================================================================

/**
 * Build a minimal cmap table wrapping a single subtable's raw bytes.
 * Returns bytes for the full cmap table: header + 1 encoding record + subtable.
 */
function buildCmapTable(subtableBytes) {
	// cmap header: version(2) + numTables(2) = 4
	// 1 encoding record: platformID(2) + encodingID(2) + offset(4) = 8
	const headerSize = 12;
	const w = new DataWriter(headerSize + subtableBytes.length);
	w.uint16(0); // version
	w.uint16(1); // numTables
	w.uint16(1); // platformID (Macintosh)
	w.uint16(0); // encodingID
	w.uint32(headerSize); // subtableOffset
	w.rawBytes(subtableBytes);
	return w.toArray();
}

describe('cmap Format 2 (High-byte mapping)', () => {
	/**
	 * Build a synthetic format 2 subtable:
	 * - subHeaderKeys: all 0 except index 0x81 → 8 (pointing to subHeader[1])
	 * - subHeader[0]: maps single-byte codes 0x41–0x43 (A,B,C) → glyphs 1,2,3
	 * - subHeader[1]: maps 2-byte codes 0x81xx where xx=0x30–0x32 → glyphs 10,11,12
	 */
	function buildFormat2Bytes() {
		// subHeaderKeys[256]: all 0, except [0x81] = 8
		const subHeaderKeys = new Array(256).fill(0);
		subHeaderKeys[0x81] = 8; // points to subHeader[1]

		// subHeader[0]: single-byte mapping for A,B,C
		//   firstCode=0x41, entryCount=3, idDelta=0, idRangeOffset=4
		//   idRangeOffset=4: 4 bytes past &idRangeOffset[0] → glyphIdArray[0]
		//   (2 subHeaders × 8 bytes = 16 bytes. idRangeOffset is at byte 6 of sh[0].
		//   Remaining in subHeaders: 2 bytes of sh[0].idRangeOffset + 8 bytes of sh[1] = 10.
		//   We need to skip to glyphIdArray[0]: offset = 10 * 1 → but formula uses byte offset)
		//   Actually idRangeOffset = bytes from &idRangeOffset to first glyph entry for this subheader.
		//   sh[0].idRangeOffset is at position 6 within sh[0]. After it: remaining of sh[1] (8 bytes),
		//   then glyphIdArray starts. So idRangeOffset = 2 + 8 = 10? No...
		//   The spec says: idRangeOffset is "number of bytes past the actual location of the
		//   idRangeOffset word where the glyphIdArray element corresponding to firstCode appears."
		//   sh[0] idRangeOffset is at byte offset (within SubHeaders): 6 bytes into sh[0].
		//   After sh[0] idRangeOffset (2 bytes): sh[1] (8 bytes), then glyphIdArray.
		//   So bytes from &sh[0].idRangeOffset to glyphIdArray[0] = 2 + 8 = 10.
		//   But we want element at firstCode offset, which is 0 (relative to start).
		//   So idRangeOffset = 10.

		// sh[1]: 2-byte mapping for high byte 0x81, low byte 0x30-0x32
		//   firstCode=0x30, entryCount=3, idDelta=0
		//   sh[1].idRangeOffset is at position 6 within sh[1]. After it: 2 bytes, then glyphIdArray.
		//   glyphIdArray[0..2] is for sh[0], glyphIdArray[3..5] is for sh[1].
		//   Bytes from &sh[1].idRangeOffset to glyphIdArray[3] = 2 + 3*2 = 8.
		//   So idRangeOffset = 8.

		const glyphIdArray = [1, 2, 3, 10, 11, 12];

		// Compute total length
		const numSubHeaders = 2;
		const totalLen = 6 + 512 + numSubHeaders * 8 + glyphIdArray.length * 2;

		const w = new DataWriter(totalLen);
		w.uint16(2); // format
		w.uint16(totalLen);
		w.uint16(0); // language

		for (const k of subHeaderKeys) w.uint16(k);

		// SubHeader 0
		w.uint16(0x41); // firstCode
		w.uint16(3); // entryCount
		w.int16(0); // idDelta
		w.uint16(10); // idRangeOffset

		// SubHeader 1
		w.uint16(0x30); // firstCode
		w.uint16(3); // entryCount
		w.int16(0); // idDelta
		w.uint16(8); // idRangeOffset

		for (const g of glyphIdArray) w.uint16(g);

		return w.toArray();
	}

	it('should parse format 2 subtable into structured data', () => {
		const cmapBytes = buildCmapTable(buildFormat2Bytes());
		const cmap = parseCmap(cmapBytes);

		expect(cmap.subtables.length).toBe(1);
		const st = cmap.subtables[0];
		expect(st.format).toBe(2);
		expect(st._raw).toBeUndefined();
		expect(st.language).toBe(0);
		expect(st.subHeaderKeys).toHaveLength(256);
		expect(st.subHeaderKeys[0x81]).toBe(8);
		expect(st.subHeaders).toHaveLength(2);
		expect(st.subHeaders[0].firstCode).toBe(0x41);
		expect(st.subHeaders[0].entryCount).toBe(3);
		expect(st.subHeaders[1].firstCode).toBe(0x30);
		expect(st.subHeaders[1].entryCount).toBe(3);
		expect(st.glyphIdArray).toEqual([1, 2, 3, 10, 11, 12]);
	});

	it('should round-trip format 2 subtable', () => {
		const cmapBytes = buildCmapTable(buildFormat2Bytes());
		const cmap = parseCmap(cmapBytes);
		const written = writeCmap(cmap);
		const reparsed = parseCmap(written);

		expect(reparsed).toEqual(cmap);
	});
});

describe('cmap Format 8 (Mixed 16/32-bit coverage)', () => {
	function buildFormat8Bytes() {
		const numGroups = 2;
		// format(2) + reserved(2) + length(4) + language(4) + is32(8192) + numGroups(4) + groups(2*12)
		const totalLen = 8204 + 4 + numGroups * 12;
		const w = new DataWriter(totalLen);

		w.uint16(8); // format
		w.uint16(0); // reserved
		w.uint32(totalLen);
		w.uint32(0); // language

		// is32: 8192 bytes — mark U+10000 range (byte index 0x1000/8 = 512, bit 0)
		const is32 = new Uint8Array(8192);
		// Mark 0x10000 as 32-bit: byte 0x10000/8 = 8192 — that's out of range.
		// Actually is32 indexes by the high 16-bit value.
		// To indicate 0xD800 (high surrogate) is 32-bit start: byte 0xD800/8 = 6912, bit 7-(0xD800%8)=7-0=7
		// Let's just leave it all zeros for simplicity and only provide 16-bit groups.
		w.rawBytes(is32);

		w.uint32(numGroups);

		// Group 1: 16-bit chars 0x0041-0x0043 → glyphs 1-3
		w.uint32(0x0041);
		w.uint32(0x0043);
		w.uint32(1);

		// Group 2: 16-bit chars 0x0061-0x0063 → glyphs 10-12
		w.uint32(0x0061);
		w.uint32(0x0063);
		w.uint32(10);

		return w.toArray();
	}

	it('should parse format 8 subtable into structured data', () => {
		const cmapBytes = buildCmapTable(buildFormat8Bytes());
		const cmap = parseCmap(cmapBytes);

		expect(cmap.subtables.length).toBe(1);
		const st = cmap.subtables[0];
		expect(st.format).toBe(8);
		expect(st._raw).toBeUndefined();
		expect(st.language).toBe(0);
		expect(st.is32).toHaveLength(8192);
		expect(st.groups).toHaveLength(2);
		expect(st.groups[0]).toEqual({
			startCharCode: 0x0041,
			endCharCode: 0x0043,
			startGlyphID: 1,
		});
		expect(st.groups[1]).toEqual({
			startCharCode: 0x0061,
			endCharCode: 0x0063,
			startGlyphID: 10,
		});
	});

	it('should round-trip format 8 subtable', () => {
		const cmapBytes = buildCmapTable(buildFormat8Bytes());
		const cmap = parseCmap(cmapBytes);
		const written = writeCmap(cmap);
		const reparsed = parseCmap(written);

		expect(reparsed).toEqual(cmap);
	});
});

describe('cmap Format 10 (Trimmed array)', () => {
	function buildFormat10Bytes() {
		const glyphIds = [10, 11, 12, 13, 14];
		// format(2) + reserved(2) + length(4) + language(4) + startCharCode(4) + numChars(4) + glyphIdArray(5*2)
		const totalLen = 20 + glyphIds.length * 2;
		const w = new DataWriter(totalLen);

		w.uint16(10); // format
		w.uint16(0); // reserved
		w.uint32(totalLen);
		w.uint32(0); // language
		w.uint32(0x10000); // startCharCode (supplementary plane)
		w.uint32(glyphIds.length);
		for (const g of glyphIds) w.uint16(g);

		return w.toArray();
	}

	it('should parse format 10 subtable into structured data', () => {
		const cmapBytes = buildCmapTable(buildFormat10Bytes());
		const cmap = parseCmap(cmapBytes);

		expect(cmap.subtables.length).toBe(1);
		const st = cmap.subtables[0];
		expect(st.format).toBe(10);
		expect(st._raw).toBeUndefined();
		expect(st.language).toBe(0);
		expect(st.startCharCode).toBe(0x10000);
		expect(st.glyphIdArray).toEqual([10, 11, 12, 13, 14]);
	});

	it('should round-trip format 10 subtable', () => {
		const cmapBytes = buildCmapTable(buildFormat10Bytes());
		const cmap = parseCmap(cmapBytes);
		const written = writeCmap(cmap);
		const reparsed = parseCmap(written);

		expect(reparsed).toEqual(cmap);
	});
});
