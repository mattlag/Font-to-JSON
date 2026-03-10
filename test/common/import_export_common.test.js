/**
 * Standalone common tests for import/export contract behavior.
 */

import { describe, expect, it } from 'vitest';
import { exportFont } from '../../src/export.js';
import { importFont } from '../../src/import.js';

describe('import/export common functionality', () => {
	it('should reject invalid input types', () => {
		expect(() => importFont(new Uint8Array([1, 2, 3]))).toThrow(
			'importFont expects an ArrayBuffer',
		);
		expect(() => importFont({})).toThrow('importFont expects an ArrayBuffer');
		expect(() => exportFont(null)).toThrow(
			'exportFont expects a font data object',
		);
	});

	it('should export raw table data with 4-byte padding and valid directory entries', () => {
		const fontData = {
			header: {
				sfVersion: 0x00010000,
				numTables: 0,
				searchRange: 16,
				entrySelector: 0,
				rangeShift: 0,
			},
			tables: {
				TEST: {
					_raw: [0x01, 0x02, 0x03],
					_checksum: 0x12345678,
				},
			},
		};

		const buffer = exportFont(fontData);
		const view = new DataView(buffer);

		expect(view.getUint32(0)).toBe(0x00010000);
		expect(view.getUint16(4)).toBe(1);
		expect(
			String.fromCharCode(
				view.getUint8(12),
				view.getUint8(13),
				view.getUint8(14),
				view.getUint8(15),
			),
		).toBe('TEST');
		expect(view.getUint32(16)).toBe(0x12345678);
		expect(view.getUint32(24)).toBe(3);

		const tableOffset = view.getUint32(20);
		expect(Array.from(new Uint8Array(buffer, tableOffset, 4))).toEqual([
			0x01, 0x02, 0x03, 0x00,
		]);
	});

	it('should throw for parsed table without registered writer', () => {
		const fontData = {
			header: {
				sfVersion: 0x00010000,
				numTables: 0,
				searchRange: 16,
				entrySelector: 0,
				rangeShift: 0,
			},
			tables: {
				ZZZZ: {
					foo: 1,
					_checksum: 0,
				},
			},
		};

		expect(() => exportFont(fontData)).toThrow(
			'No writer registered for parsed table: ZZZZ',
		);
	});

	it('should preserve unknown table as raw bytes through export->import', () => {
		const input = {
			header: {
				sfVersion: 0x00010000,
				numTables: 0,
				searchRange: 16,
				entrySelector: 0,
				rangeShift: 0,
			},
			tables: {
				ABCD: {
					_raw: [9, 8, 7, 6, 5],
					_checksum: 0x01020304,
				},
			},
		};

		const reparsed = importFont(exportFont(input)).raw;
		expect(reparsed.tables.ABCD._raw).toEqual([9, 8, 7, 6, 5]);
		expect(reparsed.tables.ABCD._checksum).toBe(0x01020304);
	});
});
