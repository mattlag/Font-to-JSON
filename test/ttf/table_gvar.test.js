/**
 * Tests for the gvar (Glyph Variations) table parser / writer.
 */

import { describe, expect, it } from 'vitest';
import { parseGvar, writeGvar } from '../../src/ttf/table_gvar.js';

function normalizeGvar(gvar) {
	return {
		majorVersion: gvar.majorVersion,
		minorVersion: gvar.minorVersion,
		axisCount: gvar.axisCount,
		flags: gvar.flags,
		sharedTuples: gvar.sharedTuples,
		glyphVariationData: gvar.glyphVariationData,
	};
}

describe('gvar table', () => {
	it('should round-trip a gvar table with structured tuple variations', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			axisCount: 2,
			flags: 0,
			sharedTuples: [[1, -0.5]],
			glyphVariationData: [
				[
					{
						peakTuple: [1, -0.5],
						intermediateStartTuple: null,
						intermediateEndTuple: null,
						pointIndices: [0, 1],
						xDeltas: [10, -5],
						yDeltas: [20, -10],
					},
				],
				[], // empty glyph
			],
		};

		const bytes = writeGvar(original);
		const parsed = parseGvar(bytes);

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.axisCount).toBe(2);
		expect(parsed.glyphVariationData.length).toBe(2);

		// First glyph has one tuple variation
		const tv = parsed.glyphVariationData[0][0];
		expect(tv.peakTuple).toEqual([1, -0.5]);
		expect(tv.pointIndices).toEqual([0, 1]);
		expect(tv.xDeltas).toEqual([10, -5]);
		expect(tv.yDeltas).toEqual([20, -10]);

		// Second glyph is empty
		expect(parsed.glyphVariationData[1]).toEqual([]);
	});

	it('should round-trip all-points variations when tables are provided', () => {
		// Build a gvar with null pointIndices (meaning "all points")
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			axisCount: 1,
			flags: 0,
			sharedTuples: [[1]],
			glyphVariationData: [
				[
					{
						peakTuple: [1],
						intermediateStartTuple: null,
						intermediateEndTuple: null,
						pointIndices: null,
						xDeltas: [5, -3],
						yDeltas: [10, -7],
					},
				],
			],
		};

		const bytes = writeGvar(original);
		// Provide mock glyf so parser knows numPoints = 2 (contour with 2 points, but
		// actually glyf reports contour points; numPoints = sum(contour.length) + 4 phantoms).
		// We need 2 real deltas, which means numPoints = 2.
		// If glyf gives us numPoints = 2, the "all points" path reads 2*2=4 deltas total.
		// That means the glyf has contour points summing to -2 + 4 phantoms... let's use
		// a simple glyph with a 2-point contour (so contours = [[pt, pt]] → 2 + 4 = 6 points).
		// But we only wrote 2 deltas per axis, so numPoints should be 2.
		// A glyph with 0 contour points + 4 phantoms = 4 points, not 2.
		// We need 0 contour points → numPoints = 4, deltas would be 4x, 4y.
		// Let's fix the test data:
		const original2 = {
			majorVersion: 1,
			minorVersion: 0,
			axisCount: 1,
			flags: 0,
			sharedTuples: [[1]],
			glyphVariationData: [
				[
					{
						peakTuple: [1],
						intermediateStartTuple: null,
						intermediateEndTuple: null,
						pointIndices: null,
						xDeltas: [5, -3, 0, 1],
						yDeltas: [10, -7, 2, -1],
					},
				],
			],
		};

		const bytes2 = writeGvar(original2);
		// Mock glyf: 0 contour points + 4 phantoms = 4 numPoints
		const tables = {
			glyf: { glyphs: [{ type: 'simple', contours: [] }] },
		};
		const parsed = parseGvar(bytes2, tables);

		const tv = parsed.glyphVariationData[0][0];
		expect(tv.pointIndices).toBeNull();
		expect(tv.xDeltas).toEqual([5, -3, 0, 1]);
		expect(tv.yDeltas).toEqual([10, -7, 2, -1]);
	});

	it('should handle intermediate regions', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			axisCount: 1,
			flags: 0,
			sharedTuples: [[0.75]],
			glyphVariationData: [
				[
					{
						peakTuple: [0.75],
						intermediateStartTuple: [0.25],
						intermediateEndTuple: [1],
						pointIndices: [0],
						xDeltas: [15],
						yDeltas: [-8],
					},
				],
			],
		};

		const bytes = writeGvar(original);
		const parsed = parseGvar(bytes);

		const tv = parsed.glyphVariationData[0][0];
		expect(tv.peakTuple[0]).toBeCloseTo(0.75, 3);
		expect(tv.intermediateStartTuple[0]).toBeCloseTo(0.25, 3);
		expect(tv.intermediateEndTuple[0]).toBeCloseTo(1, 3);
		expect(tv.xDeltas).toEqual([15]);
		expect(tv.yDeltas).toEqual([-8]);
	});

	it('should be stable across parse -> write -> parse', () => {
		const source = {
			majorVersion: 1,
			minorVersion: 0,
			axisCount: 2,
			flags: 0,
			sharedTuples: [
				[1, 0],
				[0, 1],
			],
			glyphVariationData: [
				[
					{
						peakTuple: [1, 0],
						intermediateStartTuple: null,
						intermediateEndTuple: null,
						pointIndices: [0, 2, 5],
						xDeltas: [100, -50, 25],
						yDeltas: [-10, 30, 0],
					},
					{
						peakTuple: [0, 1],
						intermediateStartTuple: null,
						intermediateEndTuple: null,
						pointIndices: [0, 2, 5],
						xDeltas: [0, 0, 0],
						yDeltas: [15, -20, 5],
					},
				],
				[],
			],
		};

		const once = parseGvar(writeGvar(source));
		const twice = parseGvar(writeGvar(once));

		expect(normalizeGvar(twice)).toEqual(normalizeGvar(once));
	});
});
