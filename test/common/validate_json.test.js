/**
 * Common validator behavior tests.
 */

import { describe, expect, it } from 'vitest';
import { validateJSON } from '../../src/validate/index.js';

describe('validateJSON', () => {
	it('returns error report for non-object input', () => {
		const report = validateJSON(null);
		expect(report.valid).toBe(false);
		expect(report.errors.some((e) => e.code === 'INPUT_INVALID')).toBe(true);
	});

	it('accepts a minimal raw TrueType-style font object', () => {
		const fontJson = {
			header: {
				sfVersion: 0x00010000,
				numTables: 9,
				searchRange: 128,
				entrySelector: 3,
				rangeShift: 16,
			},
			tables: {
				cmap: { _raw: [0], _checksum: 0 },
				head: { _raw: [0], _checksum: 0 },
				hhea: { _raw: [0], _checksum: 0 },
				hmtx: { _raw: [0], _checksum: 0 },
				maxp: { _raw: [0], _checksum: 0 },
				name: { _raw: [0], _checksum: 0 },
				post: { _raw: [0], _checksum: 0 },
				glyf: { _raw: [0], _checksum: 0 },
				loca: { _raw: [0], _checksum: 0 },
			},
		};

		const report = validateJSON(fontJson);
		expect(report.valid).toBe(true);
		expect(report.errors.length).toBe(0);
	});

	it('reports unsupported parsed tables', () => {
		const fontJson = {
			header: { sfVersion: 0x00010000 },
			tables: {
				ZZZZ: { foo: 1 },
				cmap: { _raw: [0] },
				head: { _raw: [0] },
				hhea: { _raw: [0] },
				hmtx: { _raw: [0] },
				maxp: { _raw: [0] },
				name: { _raw: [0] },
				post: { _raw: [0] },
				glyf: { _raw: [0] },
				loca: { _raw: [0] },
			},
		};

		const report = validateJSON(fontJson);
		expect(report.valid).toBe(false);
		expect(
			report.errors.some((e) => e.code === 'TABLE_WRITER_UNSUPPORTED'),
		).toBe(true);
	});

	it('reports incomplete TrueType outline', () => {
		const fontJson = {
			header: { sfVersion: 0x00010000 },
			tables: {
				cmap: { _raw: [0] },
				head: { _raw: [0] },
				hhea: { _raw: [0] },
				hmtx: { _raw: [0] },
				maxp: { _raw: [0] },
				name: { _raw: [0] },
				post: { _raw: [0] },
				glyf: { _raw: [0] },
			},
		};

		const report = validateJSON(fontJson);
		expect(report.valid).toBe(false);
		expect(
			report.errors.some((e) => e.code === 'TRUETYPE_OUTLINE_INCOMPLETE'),
		).toBe(true);
	});

	it('validates TTC collections and reports nested errors', () => {
		const report = validateJSON({
			collection: {
				tag: 'ttcf',
				majorVersion: 2,
				minorVersion: 0,
				numFonts: 1,
			},
			fonts: [
				{
					header: { sfVersion: 0x00010000 },
					tables: {
						cmap: { _raw: [0] },
						head: { _raw: [0] },
						hhea: { _raw: [0] },
						hmtx: { _raw: [0] },
						maxp: { _raw: [0] },
						name: { _raw: [0] },
						post: { _raw: [0] },
						glyf: { _raw: [0] },
					},
				},
			],
		});

		expect(report.valid).toBe(false);
		expect(
			report.errors.some((e) => e.path.includes('$.fonts[0].tables')),
		).toBe(true);
	});
});
