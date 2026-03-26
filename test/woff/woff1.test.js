/**
 * WOFF 1.0 tests
 * Tests unwrapping (import) and wrapping (export) of WOFF 1.0 font containers.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFont } from '../../src/main.js';
import { unwrapWOFF1, wrapWOFF1 } from '../../src/woff/woff1.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

// ─── Low-level unwrap tests ─────────────────────────────────────────────────

describe('WOFF1 unwrap', () => {
	it('should unwrap oblegg.woff into a valid SFNT', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff'))).buffer;
		const { sfnt } = unwrapWOFF1(buffer);

		expect(sfnt).toBeInstanceOf(ArrayBuffer);
		expect(sfnt.byteLength).toBeGreaterThan(0);

		// The SFNT should start with a valid flavor
		const view = new DataView(sfnt);
		const flavor = view.getUint32(0);
		// TrueType (0x00010000) or OTTO (0x4F54544F)
		expect([0x00010000, 0x4f54544f]).toContain(flavor);
	});

	it('should produce consistent tables on WOFF unwrap → SFNT → re-import', async () => {
		const woffBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff'))).buffer;

		// Import via WOFF auto-detect
		const woffImport = importFont(woffBuffer);

		// The _woff property should be present
		expect(woffImport._woff).toBeDefined();
		expect(woffImport._woff.version).toBe(1);

		// Unwrap manually and re-import the raw SFNT
		const { sfnt } = unwrapWOFF1(woffBuffer);
		const sfntImport = importFont(sfnt);

		// Strip _woff for comparison — font data should be identical
		const { _woff: _, ...woffData } = woffImport;
		expect(woffData).toEqual(sfntImport);
	});

	it('should reject non-WOFF data', () => {
		const fakeBuffer = new ArrayBuffer(44);
		expect(() => unwrapWOFF1(fakeBuffer)).toThrow('Invalid WOFF1 signature');
	});
});

// ─── Low-level wrap tests ───────────────────────────────────────────────────

describe('WOFF1 wrap', () => {
	it('should wrap an SFNT into valid WOFF', async () => {
		const ttfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const woffBuffer = wrapWOFF1(ttfBuffer);

		expect(woffBuffer).toBeInstanceOf(ArrayBuffer);
		// Check WOFF signature
		const view = new DataView(woffBuffer);
		expect(view.getUint32(0)).toBe(0x774f4646); // 'wOFF'

		// WOFF should be smaller than SFNT (compressed)
		expect(woffBuffer.byteLength).toBeLessThan(ttfBuffer.byteLength);
	});

	it('should produce a WOFF that unwraps back to the original SFNT tables', async () => {
		const ttfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;

		const woffBuffer = wrapWOFF1(ttfBuffer);
		const { sfnt } = unwrapWOFF1(woffBuffer);

		// Import both and compare — should have identical table data
		const originalImport = importFont(ttfBuffer);
		const roundTripped = importFont(sfnt);

		expect(roundTripped).toEqual(originalImport);
	});
});

// ─── importFont integration ─────────────────────────────────────────────────

describe('WOFF1 importFont integration', () => {
	it('should auto-detect and import a .woff file via importFont()', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff'))).buffer;
		const result = importFont(buffer);

		// Should have the simplified structure
		expect(result.font).toBeDefined();
		expect(result.glyphs).toBeDefined();
		expect(result.tables).toBeDefined();
		expect(result._header).toBeDefined();
	});
});

// ─── exportFont { format: 'woff' } integration ─────────────────────────────

describe('WOFF1 exportFont integration', () => {
	it('should export as WOFF when format option is set', async () => {
		const ttfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const imported = importFont(ttfBuffer);

		const woffBuffer = exportFont(imported, { format: 'woff' });

		expect(woffBuffer).toBeInstanceOf(ArrayBuffer);
		const view = new DataView(woffBuffer);
		expect(view.getUint32(0)).toBe(0x774f4646); // 'wOFF' signature
	});

	it('should default to SFNT when no format option is set', async () => {
		const ttfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const imported = importFont(ttfBuffer);

		const sfntBuffer = exportFont(imported);

		const view = new DataView(sfntBuffer);
		// Should be TTF (0x00010000) or OTTO
		expect([0x00010000, 0x4f54544f]).toContain(view.getUint32(0));
	});
});

// ─── Full round-trip: WOFF → JSON → WOFF → JSON ────────────────────────────

describe('WOFF1 round-trip', () => {
	it('WOFF → import → export WOFF → import should match', async () => {
		const woffBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff'))).buffer;

		const firstImport = importFont(woffBuffer);
		const reExported = exportFont(firstImport, { format: 'woff' });
		const secondImport = importFont(reExported);

		// Both should have _woff markers
		expect(firstImport._woff).toBeDefined();
		expect(secondImport._woff).toBeDefined();

		// Font data should be identical (strip _woff for clean comparison)
		const { _woff: _a, ...first } = firstImport;
		const { _woff: _b, ...second } = secondImport;
		expect(second).toEqual(first);
	});

	it('TTF → import → export WOFF → import should match original', async () => {
		const ttfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;

		const originalImport = importFont(ttfBuffer);
		const woffExport = exportFont(originalImport, { format: 'woff' });
		const woffReimport = importFont(woffExport);

		// Strip _woff for comparison
		const { _woff: _, ...reimported } = woffReimport;
		expect(reimported).toEqual(originalImport);
	});

	it('OTF → import → export WOFF → import should match original', async () => {
		const otfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;

		const originalImport = importFont(otfBuffer);
		const woffExport = exportFont(originalImport, { format: 'woff' });
		const woffReimport = importFont(woffExport);

		const { _woff: _, ...reimported } = woffReimport;
		expect(reimported).toEqual(originalImport);
	});
});
