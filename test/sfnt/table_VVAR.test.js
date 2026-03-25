/**
 * Tests for the VVAR (Vertical Metrics Variations) table parser / writer.
 */

import { describe, expect, it } from 'vitest';
import { parseVVAR, writeVVAR } from '../../src/sfnt/table_VVAR.js';

/** Minimal valid IVS structure for testing. */
function minimalIVS() {
	return {
		format: 1,
		variationRegionList: {
			axisCount: 1,
			regions: [
				{ regionAxes: [{ startCoord: 0, peakCoord: 1, endCoord: 1 }] },
			],
		},
		itemVariationData: [
			{
				itemCount: 1,
				wordDeltaCount: 1,
				regionIndexes: [0],
				deltaSets: [[75]],
			},
		],
	};
}

function normalizeVVAR(vvar) {
	return {
		majorVersion: vvar.majorVersion,
		minorVersion: vvar.minorVersion,
		itemVariationStore: vvar.itemVariationStore,
		advanceHeightMappingEntries: vvar.advanceHeightMapping?.entries ?? null,
		tsbMappingEntries: vvar.tsbMapping?.entries ?? null,
		bsbMappingEntries: vvar.bsbMapping?.entries ?? null,
		vOrgMappingEntries: vvar.vOrgMapping?.entries ?? null,
	};
}

describe('VVAR table', () => {
	it('should round-trip synthetic VVAR with all mappings', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			itemVariationStore: minimalIVS(),
			advanceHeightMapping: {
				entries: [
					{ outerIndex: 0, innerIndex: 3 },
					{ outerIndex: 1, innerIndex: 2 },
				],
			},
			tsbMapping: { entries: [{ outerIndex: 2, innerIndex: 1 }] },
			bsbMapping: { entries: [{ outerIndex: 4, innerIndex: 0 }] },
			vOrgMapping: { entries: [{ outerIndex: 5, innerIndex: 7 }] },
		};

		const parsed = parseVVAR(writeVVAR(original));

		expect(parsed.majorVersion).toBe(1);
		expect(parsed.minorVersion).toBe(0);
		expect(parsed.advanceHeightMapping.entries).toEqual(
			original.advanceHeightMapping.entries,
		);
		expect(parsed.tsbMapping.entries).toEqual(original.tsbMapping.entries);
		expect(parsed.bsbMapping.entries).toEqual(original.bsbMapping.entries);
		expect(parsed.vOrgMapping.entries).toEqual(original.vOrgMapping.entries);
		expect(parsed.itemVariationStore.format).toBe(1);
	});

	it('should support null optional mappings', () => {
		const original = {
			majorVersion: 1,
			minorVersion: 0,
			itemVariationStore: minimalIVS(),
			advanceHeightMapping: null,
			tsbMapping: null,
			bsbMapping: null,
			vOrgMapping: null,
		};

		const parsed = parseVVAR(writeVVAR(original));
		expect(parsed.advanceHeightMapping).toBeNull();
		expect(parsed.tsbMapping).toBeNull();
		expect(parsed.bsbMapping).toBeNull();
		expect(parsed.vOrgMapping).toBeNull();
	});

	it('should be stable across parse -> write -> parse', () => {
		const source = {
			majorVersion: 1,
			minorVersion: 0,
			itemVariationStore: minimalIVS(),
			advanceHeightMapping: { entries: [{ outerIndex: 0, innerIndex: 1 }] },
			tsbMapping: null,
			bsbMapping: null,
			vOrgMapping: null,
		};

		const once = parseVVAR(writeVVAR(source));
		const twice = parseVVAR(writeVVAR(once));

		expect(normalizeVVAR(twice)).toEqual(normalizeVVAR(once));
	});
});
