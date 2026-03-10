/**
 * Tests for the cvar (CVT Variations) table parser / writer.
 */

import { describe, expect, it } from 'vitest';
import { parseCvar, writeCvar } from '../../src/ttf/table_cvar.js';

function normalizeCvar(cvar) {
	return {
		majorVersion: cvar.majorVersion,
		minorVersion: cvar.minorVersion,
		tupleVariationCountPacked: cvar.tupleVariationCountPacked,
		tupleVariationHeadersRaw: cvar.tupleVariationHeadersRaw,
		serializedData: cvar.serializedData,
	};
}

describe('cvar table', () => {
	it('should round-trip synthetic cvar container bytes', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			tupleVariationCountPacked: 0x8001,
			tupleVariationHeadersRaw: [
				0x00, 0x03, 0xc0, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00,
				0x40, 0x00, 0x40, 0x00,
			],
			serializedData: [0x01, 0x02, 0x03],
		};

		const parsed = parseCvar(writeCvar(original), {
			fvar: { axes: [{}, {}] },
		});

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.tupleVariationCountPacked).toBe(0x8001);
		expect(parsed.tupleVariationCount).toBe(1);
		expect(parsed.usesSharedPointNumbers).toBe(true);
		expect(parsed.tupleVariationHeaders.length).toBe(1);
		expect(parsed.tupleVariationHeaders[0].peakTuple).toEqual([0, 1]);
		expect(parsed.serializedData).toEqual([0x01, 0x02, 0x03]);
	});

	it('should support zero tuple variation count', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			tupleVariationCountPacked: 0,
			tupleVariationHeadersRaw: [],
			serializedData: [],
		};

		const parsed = parseCvar(writeCvar(original));
		expect(parsed.tupleVariationCount).toBe(0);
		expect(parsed.tupleVariationHeaders).toEqual([]);
	});

	it('should be stable across parse -> write -> parse', () => {
		const source = {
			majorVersion: 1,
			minorVersion: 0,
			tupleVariationCountPacked: 0x0001,
			tupleVariationHeadersRaw: [0x00, 0x02, 0x80, 0x00],
			serializedData: [0xaa, 0xbb],
		};

		const once = parseCvar(writeCvar(source));
		const twice = parseCvar(writeCvar(once));

		expect(normalizeCvar(twice)).toEqual(normalizeCvar(once));
	});
});
