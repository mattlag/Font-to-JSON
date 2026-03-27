/**
 * Common validator behavior tests.
 */

import { describe, expect, it } from 'vitest';
import { validateJSON } from '../../src/validate/index.js';

// Helper: minimal valid TrueType font with all required tables as raw bytes
function minimalTTF(overrides = {}) {
	return {
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
		...overrides,
	};
}

describe('validateJSON', () => {
	// --- Report shape ---------------------------------------------------

	it('report includes infos array and infoCount', () => {
		const report = validateJSON(minimalTTF({ header: undefined }));
		expect(report).toHaveProperty('infos');
		expect(report.summary).toHaveProperty('infoCount');
		expect(Array.isArray(report.infos)).toBe(true);
	});

	// --- Fatal input errors ---------------------------------------------

	it('returns error report for non-object input', () => {
		const report = validateJSON(null);
		expect(report.valid).toBe(false);
		expect(report.errors.some((e) => e.code === 'INPUT_INVALID')).toBe(true);
	});

	// --- Minimal valid fonts --------------------------------------------

	it('accepts a minimal raw TrueType-style font object', () => {
		const report = validateJSON(minimalTTF());
		expect(report.valid).toBe(true);
		expect(report.errors.length).toBe(0);
	});

	// --- Header auto-fix: missing header --------------------------------

	it('synthesizes header when missing and emits HEADER_SYNTHESIZED info', () => {
		const fontJson = minimalTTF();
		delete fontJson.header;

		const report = validateJSON(fontJson);
		expect(report.valid).toBe(true);
		expect(report.infos.some((i) => i.code === 'HEADER_SYNTHESIZED')).toBe(
			true,
		);
		// Header was actually created on the object
		expect(fontJson.header).toBeDefined();
		expect(fontJson.header.sfVersion).toBe(0x00010000);
		expect(fontJson.header.numTables).toBe(9);
	});

	it('synthesizes CFF header with OTTO sfVersion for CFF fonts', () => {
		const fontJson = {
			tables: {
				cmap: { _raw: [0] },
				head: { _raw: [0] },
				hhea: { _raw: [0] },
				hmtx: { _raw: [0] },
				maxp: { _raw: [0] },
				name: { _raw: [0] },
				post: { _raw: [0] },
				'CFF ': { _raw: [0] },
			},
		};
		const report = validateJSON(fontJson);
		expect(report.valid).toBe(true);
		expect(fontJson.header.sfVersion).toBe(0x4f54544f);
	});

	// --- Header auto-fix: _header promotion -----------------------------

	it('promotes _header to header and emits HEADER_PROMOTED info', () => {
		const fontJson = minimalTTF();
		fontJson._header = fontJson.header;
		delete fontJson.header;

		const report = validateJSON(fontJson);
		expect(report.valid).toBe(true);
		expect(report.infos.some((i) => i.code === 'HEADER_PROMOTED')).toBe(true);
		expect(fontJson.header).toBeDefined();
	});

	// --- Header auto-fix: sfVersion -------------------------------------

	it('infers sfVersion when missing and emits HEADER_SFVERSION_INFERRED', () => {
		const fontJson = minimalTTF();
		delete fontJson.header.sfVersion;

		const report = validateJSON(fontJson);
		expect(report.valid).toBe(true);
		expect(
			report.infos.some((i) => i.code === 'HEADER_SFVERSION_INFERRED'),
		).toBe(true);
		expect(fontJson.header.sfVersion).toBe(0x00010000);
	});

	// --- Header auto-fix: numTables -------------------------------------

	it('corrects numTables mismatch and emits HEADER_NUMTABLES_CORRECTED', () => {
		const fontJson = minimalTTF();
		fontJson.header.numTables = 999;

		const report = validateJSON(fontJson);
		expect(report.valid).toBe(true);
		expect(
			report.infos.some((i) => i.code === 'HEADER_NUMTABLES_CORRECTED'),
		).toBe(true);
		expect(fontJson.header.numTables).toBe(9);
	});

	// --- Header auto-fix: directory fields ------------------------------

	it('corrects wrong directory fields and emits HEADER_FIELDS_CORRECTED', () => {
		const fontJson = minimalTTF();
		fontJson.header.searchRange = 0;
		fontJson.header.entrySelector = 0;
		fontJson.header.rangeShift = 0;

		const report = validateJSON(fontJson);
		expect(report.valid).toBe(true);
		expect(report.infos.some((i) => i.code === 'HEADER_FIELDS_CORRECTED')).toBe(
			true,
		);
		expect(fontJson.header.searchRange).toBe(128);
		expect(fontJson.header.entrySelector).toBe(3);
		expect(fontJson.header.rangeShift).toBe(16);
	});

	// --- Table-level checks ---------------------------------------------

	it('reports unsupported parsed tables as error', () => {
		const fontJson = minimalTTF();
		fontJson.tables.ZZZZ = { foo: 1 };

		const report = validateJSON(fontJson);
		expect(report.valid).toBe(false);
		expect(
			report.errors.some((e) => e.code === 'TABLE_WRITER_UNSUPPORTED'),
		).toBe(true);
	});

	it('reports unrecognized raw tables as info', () => {
		const fontJson = minimalTTF();
		fontJson.tables.ZZZZ = { _raw: [0, 1, 2] };

		const report = validateJSON(fontJson);
		expect(report.valid).toBe(true);
		expect(report.infos.some((i) => i.code === 'TABLE_UNRECOGNIZED_RAW')).toBe(
			true,
		);
	});

	// --- Outline checks -------------------------------------------------

	it('reports incomplete TrueType outline', () => {
		const fontJson = minimalTTF();
		delete fontJson.tables.loca;

		const report = validateJSON(fontJson);
		expect(report.valid).toBe(false);
		expect(
			report.errors.some((e) => e.code === 'TRUETYPE_OUTLINE_INCOMPLETE'),
		).toBe(true);
	});

	// --- Collection checks ----------------------------------------------

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

	it('auto-corrects collection.numFonts mismatch', () => {
		const collectionData = {
			collection: {
				tag: 'ttcf',
				majorVersion: 2,
				minorVersion: 0,
				numFonts: 99,
			},
			fonts: [minimalTTF()],
		};

		const report = validateJSON(collectionData);
		expect(
			report.infos.some((i) => i.code === 'COLLECTION_NUMFONTS_CORRECTED'),
		).toBe(true);
		expect(collectionData.collection.numFonts).toBe(1);
	});
});
