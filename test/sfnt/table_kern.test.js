/**
 * Tests for kern table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseKern, writeKern } from '../../src/sfnt/table_kern.js';

function normalizeKern(kern) {
	return {
		formatVariant: kern.formatVariant,
		version: kern.version,
		subtables: kern.subtables,
	};
}

describe('kern table', () => {
	it('should round-trip OpenType kern v0 format 0 subtable', () => {
		const original = {
			formatVariant: 'opentype',
			version: 0,
			subtables: [
				{
					version: 0,
					format: 0,
					coverage: 0x0001,
					pairs: [
						{ left: 12, right: 34, value: -50 },
						{ left: 56, right: 78, value: 20 },
					],
				},
			],
		};

		const parsed = parseKern(writeKern(original));

		expect(parsed.formatVariant).toBe('opentype');
		expect(parsed.version).toBe(0);
		expect(parsed.subtables.length).toBe(1);
		expect(parsed.subtables[0].format).toBe(0);
		expect(parsed.subtables[0].pairs).toEqual(original.subtables[0].pairs);
	});

	it('should preserve unknown OpenType subtable as raw', () => {
		const original = {
			formatVariant: 'opentype',
			version: 0,
			subtables: [
				{
					version: 0,
					format: 2,
					coverage: 0x0201,
					_raw: [0xaa, 0xbb, 0xcc, 0xdd],
				},
			],
		};

		const parsed = parseKern(writeKern(original));

		expect(parsed.subtables[0].format).toBe(2);
		expect(parsed.subtables[0]._raw).toEqual([0xaa, 0xbb, 0xcc, 0xdd]);
	});

	it('should round-trip Apple kern structure preserving raw subtables', () => {
		const original = {
			formatVariant: 'apple',
			version: 0x00010000,
			subtables: [
				{
					coverage: 0x01,
					format: 0,
					tupleIndex: 0,
					_raw: [0x01, 0x02, 0x03],
				},
			],
		};

		const parsed = parseKern(writeKern(original));

		expect(parsed.formatVariant).toBe('apple');
		expect(parsed.version).toBe(0x00010000);
		expect(parsed.subtables[0]._raw).toEqual([0x01, 0x02, 0x03]);
	});

	it('should be stable across parse -> write -> parse', () => {
		const source = {
			formatVariant: 'opentype',
			version: 0,
			subtables: [
				{
					version: 0,
					format: 0,
					coverage: 0x0001,
					pairs: [{ left: 1, right: 2, value: -10 }],
				},
			],
		};

		const once = parseKern(writeKern(source));
		const twice = parseKern(writeKern(once));

		expect(normalizeKern(twice)).toEqual(normalizeKern(once));
	});
});
