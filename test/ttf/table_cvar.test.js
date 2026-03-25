/**
 * Tests for the cvar (CVT Variations) table parser / writer.
 */

import { describe, expect, it } from 'vitest';
import { parseCvar, writeCvar } from '../../src/ttf/table_cvar.js';

function normalizeCvar(cvar) {
	return {
		majorVersion: cvar.majorVersion,
		minorVersion: cvar.minorVersion,
		tupleVariations: cvar.tupleVariations,
	};
}

describe('cvar table', () => {
	it('should round-trip structured cvar tuple variations', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			tupleVariations: [
				{
					peakTuple: [1, -0.5],
					intermediateStartTuple: null,
					intermediateEndTuple: null,
					pointIndices: [0, 2],
					deltas: [10, -5],
				},
			],
		};

		const bytes = writeCvar(original);
		const parsed = parseCvar(bytes, {
			fvar: { axes: [{}, {}] },
			'cvt ': { values: [0, 0, 0] },
		});

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.tupleVariations.length).toBe(1);

		const tv = parsed.tupleVariations[0];
		expect(tv.peakTuple).toEqual([1, -0.5]);
		expect(tv.pointIndices).toEqual([0, 2]);
		expect(tv.deltas).toEqual([10, -5]);
	});

	it('should round-trip all-points cvar variations', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			tupleVariations: [
				{
					peakTuple: [1],
					intermediateStartTuple: null,
					intermediateEndTuple: null,
					pointIndices: null,
					deltas: [3, -2, 0],
				},
			],
		};

		const bytes = writeCvar(original);
		const parsed = parseCvar(bytes, {
			fvar: { axes: [{}] },
			'cvt ': { values: [0, 0, 0] },
		});

		const tv = parsed.tupleVariations[0];
		expect(tv.pointIndices).toBeNull();
		expect(tv.deltas).toEqual([3, -2, 0]);
	});

	it('should support zero tuple variation count', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			tupleVariations: [],
		};

		const bytes = writeCvar(original);
		const parsed = parseCvar(bytes);
		expect(parsed.tupleVariations).toEqual([]);
	});

	it('should handle intermediate regions', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			tupleVariations: [
				{
					peakTuple: [0.75],
					intermediateStartTuple: [0.25],
					intermediateEndTuple: [1],
					pointIndices: [1],
					deltas: [42],
				},
			],
		};

		const bytes = writeCvar(original);
		const parsed = parseCvar(bytes, {
			fvar: { axes: [{}] },
			'cvt ': { values: [0, 0] },
		});

		const tv = parsed.tupleVariations[0];
		expect(tv.peakTuple[0]).toBeCloseTo(0.75, 3);
		expect(tv.intermediateStartTuple[0]).toBeCloseTo(0.25, 3);
		expect(tv.intermediateEndTuple[0]).toBeCloseTo(1, 3);
		expect(tv.deltas).toEqual([42]);
	});

	it('should be stable across parse -> write -> parse', () => {
		const source = {
			majorVersion: 1,
			minorVersion: 0,
			tupleVariations: [
				{
					peakTuple: [1, 0],
					intermediateStartTuple: null,
					intermediateEndTuple: null,
					pointIndices: [0, 1, 3],
					deltas: [100, -50, 25],
				},
				{
					peakTuple: [0, 1],
					intermediateStartTuple: null,
					intermediateEndTuple: null,
					pointIndices: [0, 1, 3],
					deltas: [15, -20, 5],
				},
			],
		};

		const bytes = writeCvar(source);
		const tables = {
			fvar: { axes: [{}, {}] },
			'cvt ': { values: [0, 0, 0, 0] },
		};

		const once = parseCvar(bytes, tables);
		const twice = parseCvar(writeCvar(once), tables);

		expect(normalizeCvar(twice)).toEqual(normalizeCvar(once));
	});
});
