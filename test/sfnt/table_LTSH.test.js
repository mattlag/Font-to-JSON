/**
 * Tests for LTSH table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseLTSH, writeLTSH } from '../../src/sfnt/table_LTSH.js';

describe('LTSH table', () => {
	it('should round-trip LTSH with explicit numGlyphs', () => {
		const original = {
			version: 0,
			numGlyphs: 4,
			yPels: [9, 10, 11, 12],
		};

		const parsed = parseLTSH(writeLTSH(original));

		expect(parsed.version).toBe(0);
		expect(parsed.numGlyphs).toBe(4);
		expect(parsed.yPels).toEqual([9, 10, 11, 12]);
	});

	it('should infer numGlyphs from yPels length when omitted', () => {
		const original = {
			version: 0,
			yPels: [3, 4, 5],
		};

		const parsed = parseLTSH(writeLTSH(original));
		expect(parsed.numGlyphs).toBe(3);
		expect(parsed.yPels).toEqual([3, 4, 5]);
	});
});
