/**
 * Tests for CFF import/export.
 *
 * Strategy: extract the raw CFF table bytes from a known OTF font,
 * then import them as CFF and verify the result matches
 * the original OTF import.  Also test CFF round-trip.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont } from '../src/export.js';
import { importFont } from '../src/import.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');

/**
 * Extract the raw CFF table bytes from an OTF buffer by reading the
 * sfnt table directory.
 */
function extractCFFTable(buffer) {
	const view = new DataView(buffer);
	const numTables = view.getUint16(4);
	for (let i = 0; i < numTables; i++) {
		const offset = 12 + i * 16;
		const tag =
			String.fromCharCode(view.getUint8(offset)) +
			String.fromCharCode(view.getUint8(offset + 1)) +
			String.fromCharCode(view.getUint8(offset + 2)) +
			String.fromCharCode(view.getUint8(offset + 3));
		if (tag === 'CFF ') {
			const tableOffset = view.getUint32(offset + 8);
			const tableLength = view.getUint32(offset + 12);
			return buffer.slice(tableOffset, tableOffset + tableLength);
		}
	}
	throw new Error('No CFF table found in OTF');
}

describe('CFF', () => {
	it('imports CFF bytes and produces valid font data', async () => {
		const otfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf')))
			.buffer;
		const cffBuffer = extractCFFTable(otfBuffer);

		const result = importFont(cffBuffer);

		expect(result).toBeDefined();
		expect(result._standalone).toBe('cff');
		expect(result.font).toBeDefined();
		expect(result.glyphs).toBeDefined();
		expect(result.glyphs.length).toBeGreaterThan(0);
	});

	it('glyph count matches the original OTF import', async () => {
		const otfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf')))
			.buffer;
		const cffBuffer = extractCFFTable(otfBuffer);

		const otfImport = importFont(otfBuffer);
		const cffImport = importFont(cffBuffer);

		expect(cffImport.glyphs.length).toBe(otfImport.glyphs.length);
	});

	it('glyph contours match the original OTF import', async () => {
		const otfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf')))
			.buffer;
		const cffBuffer = extractCFFTable(otfBuffer);

		const otfImport = importFont(otfBuffer);
		const cffImport = importFont(cffBuffer);

		// Check the first few non-.notdef glyphs have matching contours
		for (let i = 1; i < Math.min(10, cffImport.glyphs.length); i++) {
			expect(cffImport.glyphs[i].contours).toEqual(
				otfImport.glyphs[i].contours,
			);
		}
	});

	it('exports CFF back to binary', async () => {
		const otfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf')))
			.buffer;
		const cffBuffer = extractCFFTable(otfBuffer);

		const imported = importFont(cffBuffer);
		const exported = exportFont(imported, { format: 'cff' });

		expect(exported).toBeInstanceOf(ArrayBuffer);
		expect(exported.byteLength).toBeGreaterThan(0);

		// Verify the exported CFF can be re-imported
		const reimported = importFont(exported);
		expect(reimported._standalone).toBe('cff');
		expect(reimported.glyphs.length).toBe(imported.glyphs.length);
	});

	it('CFF round-trip preserves glyph contours', async () => {
		const otfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf')))
			.buffer;
		const cffBuffer = extractCFFTable(otfBuffer);

		const imported = importFont(cffBuffer);
		const exported = exportFont(imported, { format: 'cff' });
		const reimported = importFont(exported);

		for (let i = 0; i < imported.glyphs.length; i++) {
			expect(reimported.glyphs[i].contours).toEqual(
				imported.glyphs[i].contours,
			);
		}
	});

	it('defaults to CFF format when exporting a CFF import', async () => {
		const otfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf')))
			.buffer;
		const cffBuffer = extractCFFTable(otfBuffer);

		const imported = importFont(cffBuffer);
		// Export without specifying format — should default to 'cff'
		const exported = exportFont(imported);

		expect(exported).toBeInstanceOf(ArrayBuffer);
		// Re-import to verify it's valid CFF (not an OTF)
		const bytes = new Uint8Array(exported);
		expect(bytes[0]).toBe(1); // CFF major version
		expect(bytes[1]).toBe(0); // CFF minor version
	});

	it('rejects CFF export for TrueType fonts', async () => {
		const ttfPath = resolve(SAMPLES_DIR, 'oblegg.ttf');
		const buffer = (await readFile(ttfPath)).buffer;
		const imported = importFont(buffer);

		expect(() => exportFont(imported, { format: 'cff' })).toThrow(
			/CFF export requires CFF glyph data/,
		);
	});

	it('rejects CFF export for font collections', async () => {
		// Create a minimal fake collection
		const fakeCollection = {
			collection: { tag: 'ttcf' },
			fonts: [],
		};

		expect(() => exportFont(fakeCollection, { format: 'cff' })).toThrow(
			/CFF export does not support font collections/,
		);
	});
});
