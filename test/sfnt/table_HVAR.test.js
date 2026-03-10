/**
 * Tests for the HVAR (Horizontal Metrics Variations) table parser / writer.
 */

import { describe, expect, it } from 'vitest';
import { parseHVAR, writeHVAR } from '../../src/sfnt/table_HVAR.js';

function normalizeHVAR(hvar) {
	return {
		majorVersion: hvar.majorVersion,
		minorVersion: hvar.minorVersion,
		itemVariationStoreRaw: hvar.itemVariationStore?._raw ?? null,
		advanceWidthMappingEntries: hvar.advanceWidthMapping?.entries ?? null,
		lsbMappingEntries: hvar.lsbMapping?.entries ?? null,
		rsbMappingEntries: hvar.rsbMapping?.entries ?? null,
	};
}

describe('HVAR table', () => {
	it('should round-trip synthetic HVAR with all mappings', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			itemVariationStore: { _raw: [0x00, 0x01, 0x00, 0x00] },
			advanceWidthMapping: {
				entries: [
					{ outerIndex: 0, innerIndex: 3 },
					{ outerIndex: 1, innerIndex: 2 },
					{ outerIndex: 4, innerIndex: 1 },
				],
			},
			lsbMapping: {
				entries: [
					{ outerIndex: 0, innerIndex: 0 },
					{ outerIndex: 0, innerIndex: 1 },
				],
			},
			rsbMapping: {
				entries: [{ outerIndex: 2, innerIndex: 5 }],
			},
		};

		const parsed = parseHVAR(writeHVAR(original));

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.advanceWidthMapping.entries).toEqual(
			original.advanceWidthMapping.entries,
		);
		expect(parsed.lsbMapping.entries).toEqual(original.lsbMapping.entries);
		expect(parsed.rsbMapping.entries).toEqual(original.rsbMapping.entries);
		expect(parsed.itemVariationStore._raw).toEqual([0x00, 0x01, 0x00, 0x00]);
	});

	it('should support null optional mappings', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			itemVariationStore: { _raw: [0x00, 0x01] },
			advanceWidthMapping: null,
			lsbMapping: null,
			rsbMapping: null,
		};

		const parsed = parseHVAR(writeHVAR(original));
		expect(parsed.advanceWidthMapping).toBeNull();
		expect(parsed.lsbMapping).toBeNull();
		expect(parsed.rsbMapping).toBeNull();
	});

	it('should be stable across parse -> write -> parse', () => {
		const source = {
			majorVersion: 1,
			minorVersion: 0,
			itemVariationStore: { _raw: [0xaa, 0xbb, 0xcc] },
			advanceWidthMapping: {
				entries: [
					{ outerIndex: 0, innerIndex: 0 },
					{ outerIndex: 3, innerIndex: 7 },
				],
			},
			lsbMapping: null,
			rsbMapping: null,
		};

		const once = parseHVAR(writeHVAR(source));
		const twice = parseHVAR(writeHVAR(once));

		expect(normalizeHVAR(twice)).toEqual(normalizeHVAR(once));
	});
});
