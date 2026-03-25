/**
 * Tests for EBDT table parsing and writing — delegates to CBDT.
 */

import { describe, expect, it } from 'vitest';
import { parseEBDT, writeEBDT } from '../../src/sfnt/table_EBDT.js';

describe('EBDT table', () => {
	it('should fall back to raw data blob when EBLC not available', () => {
		const original = { version: 0x00020000, data: [9, 8, 7] };
		const parsed = parseEBDT(writeEBDT(original));
		expect(parsed.version).toBe(0x00020000);
		expect(parsed.data).toEqual([9, 8, 7]);
	});
});
