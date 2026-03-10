/**
 * Tests for BASE table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseBASE, writeBASE } from '../../src/sfnt/table_BASE.js';

function normalizeBASE(base) {
	return {
		majorVersion: base.majorVersion,
		minorVersion: base.minorVersion,
		horizAxis: base.horizAxis,
		vertAxis: base.vertAxis,
		itemVariationStore: base.itemVariationStore,
	};
}

describe('BASE table', () => {
	it('should round-trip BASE v1.0 with horiz and vert axes', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			horizAxis: { _raw: [0x00, 0x01, 0x02] },
			vertAxis: { _raw: [0x10, 0x11] },
			itemVariationStore: null,
		};

		const parsed = parseBASE(writeBASE(original));

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.horizAxis._raw).toEqual([0x00, 0x01, 0x02]);
		expect(parsed.vertAxis._raw).toEqual([0x10, 0x11]);
		expect(parsed.itemVariationStore).toBeNull();
	});

	it('should round-trip BASE v1.1 including item variation store', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 1,
			horizAxis: { _raw: [0x21, 0x22] },
			vertAxis: null,
			itemVariationStore: { _raw: [0xaa, 0xbb, 0xcc] },
		};

		const parsed = parseBASE(writeBASE(original));

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(1);
		expect(parsed.horizAxis._raw).toEqual([0x21, 0x22]);
		expect(parsed.vertAxis).toBeNull();
		expect(parsed.itemVariationStore._raw).toEqual([0xaa, 0xbb, 0xcc]);
	});

	it('should be stable across parse -> write -> parse', () => {
		const source = {
			majorVersion: 1,
			minorVersion: 1,
			horizAxis: { _raw: [1, 2, 3] },
			vertAxis: { _raw: [4, 5] },
			itemVariationStore: { _raw: [6, 7, 8, 9] },
		};

		const once = parseBASE(writeBASE(source));
		const twice = parseBASE(writeBASE(once));

		expect(normalizeBASE(twice)).toEqual(normalizeBASE(once));
	});
});
