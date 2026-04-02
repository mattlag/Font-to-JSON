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
					format: 99,
					coverage: (99 << 8) | 1,
					_raw: [0xaa, 0xbb, 0xcc, 0xdd],
				},
			],
		};

		const parsed = parseKern(writeKern(original));

		expect(parsed.subtables[0].format).toBe(99);
		expect(parsed.subtables[0]._raw).toEqual([0xaa, 0xbb, 0xcc, 0xdd]);
	});

	it('should round-trip Apple kern structure preserving raw subtables', () => {
		const original = {
			formatVariant: 'apple',
			version: 0x00010000,
			subtables: [
				{
					coverage: 0x01,
					format: 99,
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

	// === OpenType Format 2 (class-based) ===

	it('should round-trip OpenType kern format 2 subtable', () => {
		const original = {
			formatVariant: 'opentype',
			version: 0,
			subtables: [
				{
					version: 0,
					format: 2,
					coverage: (2 << 8) | 1,
					rowWidth: 4, // 2 right classes × 2 bytes
					leftOffsetTable: 8,
					rightOffsetTable: 20,
					kerningArrayOffset: 32,
					leftClassTable: {
						firstGlyph: 10,
						nGlyphs: 3,
						offsets: [32, 32, 36], // class 0 and class 1
					},
					rightClassTable: {
						firstGlyph: 20,
						nGlyphs: 2,
						offsets: [0, 2], // class 0 and class 1
					},
					nLeftClasses: 2,
					nRightClasses: 2,
					values: [
						[0, -30],
						[-50, -20],
					],
				},
			],
		};

		const bytes = writeKern(original);
		const parsed = parseKern(bytes);

		expect(parsed.formatVariant).toBe('opentype');
		expect(parsed.subtables[0].format).toBe(2);
		expect(parsed.subtables[0].nLeftClasses).toBe(2);
		expect(parsed.subtables[0].nRightClasses).toBe(2);
		expect(parsed.subtables[0].values).toEqual([
			[0, -30],
			[-50, -20],
		]);
	});

	// === Apple Format 0 (ordered pair list) ===

	it('should round-trip Apple kern format 0 subtable', () => {
		const original = {
			formatVariant: 'apple',
			version: 0x00010000,
			subtables: [
				{
					coverage: 0x00,
					format: 0,
					tupleIndex: 0,
					pairs: [
						{ left: 5, right: 10, value: -40 },
						{ left: 15, right: 20, value: 30 },
					],
				},
			],
		};

		const bytes = writeKern(original);
		const parsed = parseKern(bytes);

		expect(parsed.formatVariant).toBe('apple');
		expect(parsed.subtables[0].format).toBe(0);
		expect(parsed.subtables[0].pairs).toEqual(original.subtables[0].pairs);
	});

	// === Apple Format 3 (compact class-based) ===

	it('should round-trip Apple kern format 3 subtable', () => {
		const original = {
			formatVariant: 'apple',
			version: 0x00010000,
			subtables: [
				{
					coverage: 0x00,
					format: 3,
					tupleIndex: 0,
					glyphCount: 5,
					kernValueCount: 3,
					leftClassCount: 2,
					rightClassCount: 2,
					flags: 0,
					kernValues: [0, -50, 30],
					leftClasses: [0, 0, 1, 1, 0],
					rightClasses: [0, 1, 0, 1, 0],
					kernIndices: [0, 1, 2, 0],
				},
			],
		};

		const bytes = writeKern(original);
		const parsed = parseKern(bytes);

		expect(parsed.formatVariant).toBe('apple');
		expect(parsed.subtables[0].format).toBe(3);
		expect(parsed.subtables[0].kernValues).toEqual([0, -50, 30]);
		expect(parsed.subtables[0].leftClasses).toEqual([0, 0, 1, 1, 0]);
		expect(parsed.subtables[0].rightClasses).toEqual([0, 1, 0, 1, 0]);
		expect(parsed.subtables[0].kernIndices).toEqual([0, 1, 2, 0]);
	});

	// === Apple Format 1 (state table) ===

	it('should round-trip Apple kern format 1 subtable structure', () => {
		// Build a minimal state table
		const original = {
			formatVariant: 'apple',
			version: 0x00010000,
			subtables: [
				{
					coverage: 0x01,
					format: 1,
					tupleIndex: 0,
					stateSize: 5,
					classTableOffset: 10,
					stateArrayOffset: 20,
					entryTableOffset: 30,
					valueTableOffset: 38,
					classTable: {
						firstGlyph: 3,
						nGlyphs: 4,
						classArray: [4, 4, 4, 4],
					},
					states: [
						[0, 0, 0, 0, 1],
						[0, 0, 0, 0, 1],
					],
					entryTable: [
						{ newStateOffset: 20, flags: 0x0000 },
						{ newStateOffset: 20, flags: 0x8026 },
					],
					valueTable: [100, 0x0001],
				},
			],
		};

		const bytes = writeKern(original);
		const parsed = parseKern(bytes);

		expect(parsed.formatVariant).toBe('apple');
		expect(parsed.subtables[0].format).toBe(1);
		expect(parsed.subtables[0].stateSize).toBe(5);
		expect(parsed.subtables[0].classTable.firstGlyph).toBe(3);
		expect(parsed.subtables[0].classTable.nGlyphs).toBe(4);
		expect(parsed.subtables[0].classTable.classArray).toEqual([4, 4, 4, 4]);
		expect(parsed.subtables[0].entryTable.length).toBe(2);
		expect(parsed.subtables[0].valueTable.length).toBeGreaterThanOrEqual(2);
	});
});
