/**
 * Tests for JSTF table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseJSTF, writeJSTF } from '../../src/sfnt/table_JSTF.js';

describe('JSTF table', () => {
	it('should round-trip JSTF with two scripts', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			scripts: [
				{ tag: 'latn', table: { _raw: [0x01, 0x02, 0x03] } },
				{ tag: 'arab', table: { _raw: [0xaa, 0xbb] } },
			],
		};

		const parsed = parseJSTF(writeJSTF(original));

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.scripts.length).toBe(2);
		expect(parsed.scripts[0].tag).toBe('latn');
		expect(parsed.scripts[0].table._raw).toEqual([0x01, 0x02, 0x03]);
		expect(parsed.scripts[1].tag).toBe('arab');
		expect(parsed.scripts[1].table._raw).toEqual([0xaa, 0xbb]);
	});

	it('should preserve null script table when offset is zero', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			scripts: [{ tag: 'DFLT', table: null }],
		};

		const parsed = parseJSTF(writeJSTF(original));
		expect(parsed.scripts[0].tag).toBe('DFLT');
		expect(parsed.scripts[0].table).toBeNull();
	});
});
