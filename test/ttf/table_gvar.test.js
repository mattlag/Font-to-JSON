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
	it('should round-trip a synthetic gvar table with short offsets', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			axisCount: 2,
			flags: 0,
			sharedTuples: [
				[0, 0],
				[1, -1],
			],
			glyphVariationData: [[0x01, 0x02, 0x03, 0x04], [], [0xaa, 0xbb]],
		};

		const parsed = parseGvar(writeGvar(original));

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.axisCount).toBe(2);
		expect(parsed.sharedTuples).toEqual([
			[0, 0],
			[1, -1],
		]);
		expect(parsed.glyphVariationData).toEqual(original.glyphVariationData);
		expect(parsed.flags & 0x0001).toBe(0);
	});

	it('should use long offsets when glyph data offsets are odd', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			axisCount: 1,
			flags: 0,
			sharedTuples: [[0]],
			glyphVariationData: [[0x01], [0x02, 0x03]],
		};

		const parsed = parseGvar(writeGvar(original));

		expect(parsed.flags & 0x0001).toBe(0x0001);
		expect(parsed.glyphVariationData).toEqual(original.glyphVariationData);
	});

	it('should be stable across parse -> write -> parse', () => {
		const source = {
			majorVersion: 1,
			minorVersion: 0,
			axisCount: 3,
			flags: 0,
			sharedTuples: [[-1, 0, 1]],
			glyphVariationData: [[0x10, 0x20], [], [0x30, 0x40, 0x50, 0x60]],
		};

		const once = parseGvar(writeGvar(source));
		const twice = parseGvar(writeGvar(once));

		expect(normalizeGvar(twice)).toEqual(normalizeGvar(once));
	});
});
