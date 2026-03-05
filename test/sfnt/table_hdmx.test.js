/**
 * Tests for hdmx table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseHdmx, writeHdmx } from '../../src/sfnt/table_hdmx.js';

describe('hdmx table', () => {
	it('should round-trip hdmx with inferred record size', () => {
		const original = {
			version: 0,
			records: [
				{
					pixelSize: 12,
					maxWidth: 14,
					widths: [5, 6, 7],
				},
			],
		};

		const parsed = parseHdmx(writeHdmx(original), { maxp: { numGlyphs: 3 } });

		expect(parsed.version).toBe(0);
		expect(parsed.records.length).toBe(1);
		expect(parsed.records[0].pixelSize).toBe(12);
		expect(parsed.records[0].maxWidth).toBe(14);
		expect(parsed.records[0].widths).toEqual([5, 6, 7]);
	});

	it('should preserve explicit sizeDeviceRecord and padding', () => {
		const original = {
			version: 0,
			sizeDeviceRecord: 8,
			records: [
				{
					pixelSize: 16,
					maxWidth: 18,
					widths: [1, 2, 3],
					padding: [0xaa, 0xbb, 0xcc],
				},
			],
		};

		const parsed = parseHdmx(writeHdmx(original), { maxp: { numGlyphs: 3 } });
		expect(parsed.sizeDeviceRecord).toBe(8);
		expect(parsed.records[0].widths).toEqual([1, 2, 3]);
		expect(parsed.records[0].padding.length).toBe(3);
	});
});
