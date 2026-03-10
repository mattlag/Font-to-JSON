/**
 * Standalone common tests for SFNT container-level behavior.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFont } from '../../src/main.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

function readDirectoryEntries(buffer) {
	const view = new DataView(buffer);
	const numTables = view.getUint16(4);
	const entries = [];
	for (let i = 0; i < numTables; i++) {
		const pos = 12 + i * 16;
		const tag = String.fromCharCode(
			view.getUint8(pos),
			view.getUint8(pos + 1),
			view.getUint8(pos + 2),
			view.getUint8(pos + 3),
		);
		entries.push({
			tag,
			checksum: view.getUint32(pos + 4),
			offset: view.getUint32(pos + 8),
			length: view.getUint32(pos + 12),
		});
	}
	return entries;
}

describe('SFNT container common functionality', () => {
	it('should parse header search values consistent with numTables', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const font = importFont(buffer).raw;
		const { numTables, searchRange, entrySelector, rangeShift } = font.header;

		const expectedEntrySelector = Math.floor(Math.log2(numTables));
		const expectedSearchRange = Math.pow(2, expectedEntrySelector) * 16;
		const expectedRangeShift = numTables * 16 - expectedSearchRange;

		expect(entrySelector).toBe(expectedEntrySelector);
		expect(searchRange).toBe(expectedSearchRange);
		expect(rangeShift).toBe(expectedRangeShift);
	});

	it('should write directory entries with 4-byte aligned table offsets', () => {
		const fontData = {
			header: {
				sfVersion: 0x00010000,
				numTables: 0,
				searchRange: 32,
				entrySelector: 1,
				rangeShift: 0,
			},
			tables: {
				ABCD: { _raw: [1, 2, 3], _checksum: 0x01010101 },
				WXYZ: { _raw: [4, 5, 6, 7, 8], _checksum: 0x02020202 },
			},
		};

		const buffer = exportFont(fontData);
		const entries = readDirectoryEntries(buffer);

		expect(entries.length).toBe(2);
		for (const entry of entries) {
			expect(entry.offset % 4).toBe(0);
		}
		expect(entries[1].offset).toBe(entries[0].offset + 4);
	});

	it('should preserve checksum and raw length in table directory', () => {
		const fontData = {
			header: {
				sfVersion: 0x00010000,
				numTables: 0,
				searchRange: 16,
				entrySelector: 0,
				rangeShift: 0,
			},
			tables: {
				TEST: { _raw: [9, 8, 7, 6, 5], _checksum: 0x11223344 },
			},
		};

		const buffer = exportFont(fontData);
		const [entry] = readDirectoryEntries(buffer);

		expect(entry.tag).toBe('TEST');
		expect(entry.checksum).toBe(0x11223344);
		expect(entry.length).toBe(5);
	});
});
