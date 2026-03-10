/**
 * Tests for CFF2 (Compact Font Format version 2) table parsing and writing.
 *
 * CFF2 tests are mostly synthetic since the sample font collection may not
 * contain a CFF2-based font.  We test the INDEX v2 round-trip, the CFF2
 * TopDICT encoding, and a minimal synthetic CFF2 table.
 */

import { describe, expect, it } from 'vitest';
import { parseINDEXv2, writeINDEXv2 } from '../../src/otf/cff_common.js';
import { parseCFF2, writeCFF2 } from '../../src/otf/table_CFF2.js';

// ============================================================================
//  INDEX v2 round-trip (uint32 count)
// ============================================================================

describe('CFF2 INDEX v2 round-trip', () => {
	it('should round-trip an empty INDEX', () => {
		const bytes = writeINDEXv2([]);
		expect(bytes).toEqual([0, 0, 0, 0]); // uint32 count = 0
		const { items, totalBytes } = parseINDEXv2(bytes, 0);
		expect(items).toHaveLength(0);
		expect(totalBytes).toBe(4);
	});

	it('should round-trip a single-item INDEX', () => {
		const item = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
		const bytes = writeINDEXv2([item]);
		const { items } = parseINDEXv2(bytes, 0);
		expect(items).toHaveLength(1);
		expect(Array.from(items[0])).toEqual([0xde, 0xad, 0xbe, 0xef]);
	});

	it('should round-trip a multi-item INDEX', () => {
		const origItems = [
			new Uint8Array([1]),
			new Uint8Array([2, 3]),
			new Uint8Array([4, 5, 6]),
		];
		const bytes = writeINDEXv2(origItems);
		const { items } = parseINDEXv2(bytes, 0);
		expect(items).toHaveLength(3);
		expect(Array.from(items[0])).toEqual([1]);
		expect(Array.from(items[1])).toEqual([2, 3]);
		expect(Array.from(items[2])).toEqual([4, 5, 6]);
	});
});

// ============================================================================
//  Synthetic CFF2 table round-trip
// ============================================================================

describe('CFF2 synthetic round-trip', () => {
	/**
	 * Build a minimal valid CFF2 JSON structure for testing.
	 */
	function buildMinimalCFF2() {
		return {
			majorVersion: 2,
			minorVersion: 0,
			topDict: {},
			globalSubrs: [],
			charStrings: [
				// Two minimal charstrings (.notdef and one glyph)
				[14], // endchar
				[100, 0, 21, 100, 6, 14], // rmoveto hlineto endchar
			],
			fontDicts: [
				{
					fontDict: {},
					privateDict: {
						BlueValues: [-10, 0, 486, 496],
					},
					localSubrs: [],
				},
			],
			fdSelect: null,
			variationStore: null,
		};
	}

	it('should write a synthetic CFF2 table', () => {
		const cff2 = buildMinimalCFF2();
		const written = writeCFF2(cff2);
		expect(written).toBeInstanceOf(Array);
		expect(written.length).toBeGreaterThan(0);
		// Header check: majorVersion = 2
		expect(written[0]).toBe(2);
	});

	it('should round-trip a synthetic CFF2: write -> parse -> write', () => {
		const original = buildMinimalCFF2();
		const written1 = writeCFF2(original);
		const parsed = parseCFF2(written1);
		const written2 = writeCFF2(parsed);

		// Binary output should be identical
		expect(written2).toEqual(written1);
	});

	it('should parse the header correctly', () => {
		const cff2 = buildMinimalCFF2();
		const written = writeCFF2(cff2);
		const parsed = parseCFF2(written);

		expect(parsed.majorVersion).toBe(2);
		expect(parsed.minorVersion).toBe(0);
	});

	it('should preserve charStrings count and content', () => {
		const original = buildMinimalCFF2();
		const written = writeCFF2(original);
		const parsed = parseCFF2(written);

		expect(parsed.charStrings.length).toBe(original.charStrings.length);
		expect(parsed.charStrings).toEqual(original.charStrings);
	});

	it('should preserve globalSubrs', () => {
		const cff2 = buildMinimalCFF2();
		cff2.globalSubrs = [
			[1, 2, 3],
			[4, 5],
		];
		const written = writeCFF2(cff2);
		const parsed = parseCFF2(written);

		expect(parsed.globalSubrs).toEqual(cff2.globalSubrs);
	});

	it('should preserve fontDicts Private DICT values', () => {
		const original = buildMinimalCFF2();
		const written = writeCFF2(original);
		const parsed = parseCFF2(written);

		expect(parsed.fontDicts.length).toBe(1);
		expect(parsed.fontDicts[0].privateDict.BlueValues).toEqual([
			-10, 0, 486, 496,
		]);
	});

	it('should handle local subroutines', () => {
		const cff2 = buildMinimalCFF2();
		cff2.fontDicts[0].localSubrs = [
			[10, 20, 30],
			[40, 50],
		];
		const written = writeCFF2(cff2);
		const parsed = parseCFF2(written);

		expect(parsed.fontDicts[0].localSubrs).toEqual(
			cff2.fontDicts[0].localSubrs,
		);
	});
});
