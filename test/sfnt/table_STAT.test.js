/**
 * Tests for the STAT (Style Attributes) table parser / writer.
 */

import { describe, expect, it } from 'vitest';
import { parseSTAT, writeSTAT } from '../../src/sfnt/table_STAT.js';

function normalizeSTAT(stat) {
	return {
		majorVersion: stat.majorVersion,
		minorVersion: stat.minorVersion,
		designAxisSize: stat.designAxisSize,
		designAxes: stat.designAxes,
		axisValues: stat.axisValues,
		elidedFallbackNameID: stat.elidedFallbackNameID,
	};
}

describe('STAT table', () => {
	it('should round-trip a v1.2 table with axis value formats 1/2/3/4', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 2,
			designAxisSize: 8,
			elidedFallbackNameID: 2,
			designAxes: [
				{ axisTag: 'wght', axisNameID: 256, axisOrdering: 0 },
				{ axisTag: 'wdth', axisNameID: 257, axisOrdering: 1 },
			],
			axisValues: [
				{
					format: 1,
					axisIndex: 0,
					flags: 0x0002,
					valueNameID: 258,
					value: 400,
				},
				{
					format: 2,
					axisIndex: 0,
					flags: 0,
					valueNameID: 259,
					nominalValue: 700,
					rangeMinValue: 650,
					rangeMaxValue: 750,
				},
				{
					format: 3,
					axisIndex: 1,
					flags: 0,
					valueNameID: 260,
					value: 100,
					linkedValue: 125,
				},
				{
					format: 4,
					axisCount: 2,
					flags: 0,
					valueNameID: 261,
					axisValues: [
						{ axisIndex: 0, value: 700 },
						{ axisIndex: 1, value: 75 },
					],
				},
			],
		};

		const parsed = parseSTAT(writeSTAT(original));

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(2);
		expect(parsed.designAxes.length).toBe(2);
		expect(parsed.axisValues.length).toBe(4);
		expect(parsed.axisValues[0].format).toBe(1);
		expect(parsed.axisValues[1].format).toBe(2);
		expect(parsed.axisValues[2].format).toBe(3);
		expect(parsed.axisValues[3].format).toBe(4);
		expect(parsed.axisValues[3].axisValues[1].axisIndex).toBe(1);
		expect(parsed.axisValues[3].axisValues[1].value).toBe(75);
		expect(parsed.elidedFallbackNameID).toBe(2);
	});

	it('should support v1.0 header (without elidedFallbackNameID)', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			designAxes: [{ axisTag: 'wght', axisNameID: 256, axisOrdering: 0 }],
			axisValues: [
				{
					format: 1,
					axisIndex: 0,
					flags: 0,
					valueNameID: 258,
					value: 400,
				},
			],
		};

		const parsed = parseSTAT(writeSTAT(original));

		expect(parsed.minorVersion).toBe(0);
		expect(parsed.elidedFallbackNameID).toBeUndefined();
		expect(parsed.axisValues[0].format).toBe(1);
	});

	it('should preserve unknown axis value format as raw bytes', () => {
		const source = {
			majorVersion: 1,
			minorVersion: 2,
			elidedFallbackNameID: 2,
			designAxes: [{ axisTag: 'wght', axisNameID: 256, axisOrdering: 0 }],
			axisValues: [
				{
					format: 7,
					_raw: [0x00, 0x07, 0xaa, 0xbb, 0xcc, 0xdd],
				},
			],
		};

		const parsed = parseSTAT(writeSTAT(source));

		expect(parsed.axisValues.length).toBe(1);
		expect(parsed.axisValues[0].format).toBe(7);
		expect(parsed.axisValues[0]._raw).toEqual([
			0x00, 0x07, 0xaa, 0xbb, 0xcc, 0xdd,
		]);
	});

	it('should be stable across parse -> write -> parse', () => {
		const source = {
			majorVersion: 1,
			minorVersion: 1,
			elidedFallbackNameID: 2,
			designAxes: [
				{ axisTag: 'wght', axisNameID: 256, axisOrdering: 0 },
				{ axisTag: 'ital', axisNameID: 257, axisOrdering: 1 },
			],
			axisValues: [
				{
					format: 3,
					axisIndex: 0,
					flags: 0,
					valueNameID: 258,
					value: 400,
					linkedValue: 700,
				},
				{
					format: 1,
					axisIndex: 1,
					flags: 0x0002,
					valueNameID: 259,
					value: 0,
				},
			],
		};

		const once = parseSTAT(writeSTAT(source));
		const twice = parseSTAT(writeSTAT(once));

		expect(normalizeSTAT(twice)).toEqual(normalizeSTAT(once));
	});
});
