/**
 * Tests for the fvar (Font Variations) table parser / writer.
 */

import { describe, expect, it } from 'vitest';
import { parseFvar, writeFvar } from '../../src/sfnt/table_fvar.js';

function normalizeFvar(fvar) {
	return {
		majorVersion: fvar.majorVersion,
		minorVersion: fvar.minorVersion,
		reserved: fvar.reserved,
		axisSize: fvar.axisSize,
		instanceSize: fvar.instanceSize,
		axes: fvar.axes,
		instances: fvar.instances,
	};
}

describe('fvar table', () => {
	it('should round-trip a synthetic fvar with two axes and two instances', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			reserved: 2,
			axes: [
				{
					axisTag: 'wght',
					minValue: 100,
					defaultValue: 400,
					maxValue: 900,
					flags: 0,
					axisNameID: 256,
				},
				{
					axisTag: 'wdth',
					minValue: 75,
					defaultValue: 100,
					maxValue: 125,
					flags: 0,
					axisNameID: 257,
				},
			],
			instances: [
				{
					subfamilyNameID: 258,
					flags: 0,
					coordinates: [400, 100],
				},
				{
					subfamilyNameID: 259,
					flags: 0,
					coordinates: [900, 100],
					postScriptNameID: 260,
				},
			],
		};

		const bytes = writeFvar(original);
		const parsed = parseFvar(bytes);

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.axes.length).toBe(2);
		expect(parsed.instances.length).toBe(2);
		expect(parsed.axes[0].axisTag).toBe('wght');
		expect(parsed.axes[1].axisTag).toBe('wdth');
		expect(parsed.instances[1].postScriptNameID).toBe(260);
	});

	it('should include postScriptNameID field for all instances when any instance has it', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			reserved: 2,
			axes: [
				{
					axisTag: 'wght',
					minValue: 100,
					defaultValue: 400,
					maxValue: 900,
					flags: 0,
					axisNameID: 256,
				},
			],
			instances: [
				{ subfamilyNameID: 258, flags: 0, coordinates: [400] },
				{
					subfamilyNameID: 259,
					flags: 0,
					coordinates: [700],
					postScriptNameID: 260,
				},
			],
		};

		const parsed = parseFvar(writeFvar(original));

		expect(parsed.instanceSize).toBe(10);
		expect(parsed.instances[0].postScriptNameID).toBe(0xffff);
		expect(parsed.instances[1].postScriptNameID).toBe(260);
	});

	it('should be stable across parse -> write -> parse', () => {
		const source = {
			majorVersion: 1,
			minorVersion: 0,
			reserved: 2,
			axes: [
				{
					axisTag: 'opsz',
					minValue: 8,
					defaultValue: 12,
					maxValue: 72,
					flags: 0,
					axisNameID: 300,
				},
			],
			instances: [{ subfamilyNameID: 301, flags: 0, coordinates: [12] }],
		};

		const once = parseFvar(writeFvar(source));
		const twice = parseFvar(writeFvar(once));

		expect(normalizeFvar(twice)).toEqual(normalizeFvar(once));
	});
});
