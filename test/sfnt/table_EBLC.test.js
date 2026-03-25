/**
 * Tests for EBLC table parsing and writing — delegates to CBLC.
 */

import { describe, expect, it } from 'vitest';
import { parseEBLC } from '../../src/sfnt/table_EBLC.js';
import { DataWriter } from '../../src/writer.js';

describe('EBLC table', () => {
	it('should parse structured index subtables (delegates to CBLC)', () => {
		const w = new DataWriter(256);
		w.uint16(2);
		w.uint16(0);
		w.uint32(1);
		const listOffset = 8 + 48;
		w.uint32(listOffset);
		w.uint32(50);
		w.uint32(1);
		w.uint32(0);
		for (let i = 0; i < 24; i++) w.int8(0);
		w.uint16(0);
		w.uint16(2); // 3 glyphs
		w.uint8(12);
		w.uint8(12);
		w.uint8(1);
		w.int8(0);
		// IndexSubtableRecord
		w.uint16(0);
		w.uint16(2);
		w.uint32(8);
		// Format 1: header + 4 offsets
		w.uint16(1);
		w.uint16(1);
		w.uint32(4);
		w.uint32(0);
		w.uint32(20);
		w.uint32(40);
		w.uint32(60);

		const parsed = parseEBLC(w.toArray());
		expect(parsed.majorVersion).toBe(2);
		expect(parsed.sizes[0].indexSubTables.length).toBe(1);
		expect(parsed.sizes[0].indexSubTables[0].indexFormat).toBe(1);
		expect(parsed.sizes[0].indexSubTables[0].sbitOffsets).toEqual([
			0, 20, 40, 60,
		]);
	});
});
