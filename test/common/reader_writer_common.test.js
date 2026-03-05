/**
 * Standalone common tests for DataReader/DataWriter primitives.
 */

import { describe, expect, it } from 'vitest';
import { DataReader } from '../../src/reader.js';
import { DataWriter } from '../../src/writer.js';

describe('DataReader/DataWriter common functionality', () => {
	it('should round-trip primitive numeric types and OpenType aliases', () => {
		const w = new DataWriter(1 + 2 + 3 + 4 + 1 + 2 + 4 + 4 + 2 + 4 + 2 + 8);
		w.uint8(0xab)
			.uint16(0xcdef)
			.uint24(0x123456)
			.uint32(0x89abcdef)
			.int8(-5)
			.int16(-1234)
			.int32(-12345678)
			.tag('TEST')
			.offset16(0x4321)
			.offset32(0x10203040)
			.f2dot14(1.5)
			.longDateTime(0x0000000100000002n);

		const r = new DataReader(w.toArray());
		expect(r.uint8()).toBe(0xab);
		expect(r.uint16()).toBe(0xcdef);
		expect(r.uint24()).toBe(0x123456);
		expect(r.uint32()).toBe(0x89abcdef);
		expect(r.int8()).toBe(-5);
		expect(r.int16()).toBe(-1234);
		expect(r.int32()).toBe(-12345678);
		expect(r.tag()).toBe('TEST');
		expect(r.offset16()).toBe(0x4321);
		expect(r.offset32()).toBe(0x10203040);
		expect(r.f2dot14()).toBeCloseTo(1.5, 6);
		expect(r.longDateTime()).toBe(0x0000000100000002n);
		expect(r.position).toBe(r.length);
	});

	it('should support seek/skip plus bulk array and raw bytes operations', () => {
		const w = new DataWriter(14);
		w.uint16(0x1111)
			.array('uint8', [1, 2, 3])
			.rawBytes([0xaa, 0xbb, 0xcc])
			.skip(2)
			.uint16(0x2222)
			.seek(8)
			.uint16(0x3333);

		const r = new DataReader(w.toArray());
		expect(r.uint16()).toBe(0x1111);
		expect(r.array('uint8', 3)).toEqual([1, 2, 3]);
		expect(r.bytes(3)).toEqual([0xaa, 0xbb, 0xcc]);
		expect(r.uint16()).toBe(0x3333);
		r.seek(10);
		expect(r.uint16()).toBe(0x2222);
	});

	it('should round-trip Fixed 16.16 values with expected precision', () => {
		const value = -12.375;
		const w = new DataWriter(4);
		w.fixed(value);

		const r = new DataReader(w.toArray());
		expect(r.fixed()).toBeCloseTo(value, 4);
	});
});
