/**
 * Tests for MATH table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseMATH, writeMATH } from '../../src/sfnt/table_MATH.js';

describe('MATH table', () => {
	it('should round-trip MATH with all subtables', () => {
		const original = {
			version: 0x00010000,
			mathConstants: { _raw: [0x10, 0x11] },
			mathGlyphInfo: { _raw: [0x20, 0x21, 0x22] },
			mathVariants: { _raw: [0x30] },
		};

		const parsed = parseMATH(writeMATH(original));

		expect(parsed.version).toBe(0x00010000);
		expect(parsed.mathConstants._raw).toEqual([0x10, 0x11]);
		expect(parsed.mathGlyphInfo._raw).toEqual([0x20, 0x21, 0x22]);
		expect(parsed.mathVariants._raw).toEqual([0x30]);
	});

	it('should round-trip with missing subtables as null', () => {
		const original = {
			version: 0x00010000,
			mathConstants: null,
			mathGlyphInfo: { _raw: [0xab, 0xcd] },
			mathVariants: null,
		};

		const parsed = parseMATH(writeMATH(original));

		expect(parsed.mathConstants).toBeNull();
		expect(parsed.mathGlyphInfo._raw).toEqual([0xab, 0xcd]);
		expect(parsed.mathVariants).toBeNull();
	});
});
