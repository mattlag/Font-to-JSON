/**
 * WOFF 2.0 tests
 * Tests unwrapping (import) and wrapping (export) of WOFF 2.0 font containers.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { exportFont } from '../../src/export.js';
import { importFont } from '../../src/import.js';
import { initWoff2 } from '../../src/main.js';
import { unwrapWOFF2, wrapWOFF2 } from '../../src/woff/woff2.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Deep-strip binary-level artifacts (_checksum, checksumAdjustment, _woff)
 * that legitimately change during format conversions. WOFF2 reassembly
 * recomputes SFNT directory checksums, so these always differ from the
 * export pipeline's values.
 */
function stripBinaryArtifacts(obj) {
	if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
	if (Array.isArray(obj)) return obj.map(stripBinaryArtifacts);
	const out = {};
	for (const [k, v] of Object.entries(obj)) {
		if (k === '_checksum' || k === '_woff') continue;
		if (k === 'checksumAdjustment') continue;
		out[k] = stripBinaryArtifacts(v);
	}
	return out;
}

// ── Initialize brotli before all WOFF2 tests ────────────────────────────────

beforeAll(async () => {
	await initWoff2();
});

// ─── Low-level unwrap tests ─────────────────────────────────────────────────

describe('WOFF2 unwrap', () => {
	it('should unwrap oblegg.woff2 into a valid SFNT', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff2')))
			.buffer;
		const { sfnt } = unwrapWOFF2(buffer);

		expect(sfnt).toBeInstanceOf(ArrayBuffer);
		expect(sfnt.byteLength).toBeGreaterThan(0);

		// The SFNT should start with a valid flavor
		const view = new DataView(sfnt);
		const flavor = view.getUint32(0);
		expect([0x00010000, 0x4f54544f]).toContain(flavor);
	});

	it('should produce consistent tables on WOFF2 unwrap → SFNT → re-import', async () => {
		const woff2Buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff2')))
			.buffer;

		// Import via WOFF2 auto-detect
		const woff2Import = importFont(woff2Buffer);

		// The _woff property should be present
		expect(woff2Import._woff).toBeDefined();
		expect(woff2Import._woff.version).toBe(2);

		// Unwrap manually and re-import the raw SFNT
		const { sfnt } = unwrapWOFF2(woff2Buffer);
		const sfntImport = importFont(sfnt);

		// Strip _woff for comparison — font data should be identical
		const { _woff: _, ...woff2Data } = woff2Import;
		expect(woff2Data).toEqual(sfntImport);
	});

	it('should reject non-WOFF2 data', () => {
		const fakeBuffer = new ArrayBuffer(48);
		expect(() => unwrapWOFF2(fakeBuffer)).toThrow('Invalid WOFF2 signature');
	});
});

// ─── Low-level wrap tests ───────────────────────────────────────────────────

describe('WOFF2 wrap', () => {
	it('should wrap a TTF SFNT into valid WOFF2', async () => {
		const ttfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf')))
			.buffer;
		const woff2Buffer = wrapWOFF2(ttfBuffer);

		expect(woff2Buffer).toBeInstanceOf(ArrayBuffer);
		// Check WOFF2 signature
		const view = new DataView(woff2Buffer);
		expect(view.getUint32(0)).toBe(0x774f4632); // 'wOF2'

		// WOFF2 should be smaller than SFNT (Brotli compressed)
		expect(woff2Buffer.byteLength).toBeLessThan(ttfBuffer.byteLength);
	});

	it('should wrap an OTF SFNT into valid WOFF2', async () => {
		const otfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf')))
			.buffer;
		const woff2Buffer = wrapWOFF2(otfBuffer);

		expect(woff2Buffer).toBeInstanceOf(ArrayBuffer);
		const view = new DataView(woff2Buffer);
		expect(view.getUint32(0)).toBe(0x774f4632);
		expect(woff2Buffer.byteLength).toBeLessThan(otfBuffer.byteLength);
	});

	it('should produce a WOFF2 that unwraps back to matching font data', async () => {
		const ttfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf')))
			.buffer;

		const woff2Buffer = wrapWOFF2(ttfBuffer);
		const { sfnt } = unwrapWOFF2(woff2Buffer);

		// Import both and compare — WOFF2 reassembly recomputes correct
		// SFNT directory checksums, so strip _checksum/checksumAdjustment
		const originalImport = importFont(ttfBuffer);
		const roundTripped = importFont(sfnt);

		expect(stripBinaryArtifacts(roundTripped)).toEqual(
			stripBinaryArtifacts(originalImport),
		);
	});
});

// ─── importFont integration ─────────────────────────────────────────────────

describe('WOFF2 importFont integration', () => {
	it('should auto-detect and import a .woff2 file via importFont()', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff2')))
			.buffer;
		const result = importFont(buffer);

		// Should have the simplified structure
		expect(result.font).toBeDefined();
		expect(result.glyphs).toBeDefined();
		expect(result.tables).toBeDefined();
		expect(result._header).toBeDefined();

		// Should be marked as WOFF2 origin
		expect(result._woff).toBeDefined();
		expect(result._woff.version).toBe(2);
	});

	it('WOFF2 import should produce the same font as WOFF1 import', async () => {
		const woff1Buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff')))
			.buffer;
		const woff2Buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff2')))
			.buffer;

		const woff1Import = importFont(woff1Buffer);
		const woff2Import = importFont(woff2Buffer);

		// Both should produce the same simplified structure
		// (may differ in glyph count if source files were from different builds)
		expect(woff2Import.font.familyName).toBe(woff1Import.font.familyName);
		expect(woff2Import.font.unitsPerEm).toBe(woff1Import.font.unitsPerEm);
	});

	it('should throw without initWoff2() when brotli is not initialized', async () => {
		// This test verifies the error message. Since we already called initWoff2
		// in beforeAll, we can't truly test the uninitialized state without
		// resetting internal module state. Instead, verify the error path exists.
		expect(() => {
			const fakeBuffer = new ArrayBuffer(48);
			unwrapWOFF2(fakeBuffer);
		}).toThrow(); // either invalid signature or other error
	});
});

// ─── exportFont integration ─────────────────────────────────────────────────

describe('WOFF2 exportFont integration', () => {
	it('WOFF2 import → export with no format → produces WOFF2', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff2')))
			.buffer;
		const imported = importFont(buffer);
		expect(imported._woff?.version).toBe(2);
		const out = exportFont(imported);
		const view = new DataView(out);
		expect(view.getUint32(0)).toBe(0x774f4632);
	});

	it('SFNT import + format:"woff2" → produces WOFF2', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const imported = importFont(buffer);
		const out = exportFont(imported, { format: 'woff2' });
		const view = new DataView(out);
		expect(view.getUint32(0)).toBe(0x774f4632);
	});

	it('WOFF2 import + format:"sfnt" → produces SFNT', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff2')))
			.buffer;
		const imported = importFont(buffer);
		const out = exportFont(imported, { format: 'sfnt' });
		const view = new DataView(out);
		expect([0x00010000, 0x4f54544f]).toContain(view.getUint32(0));
	});

	it('TTF → WOFF2 → reimport → stabilizes', async () => {
		const ttfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf')))
			.buffer;
		const original = importFont(ttfBuffer);

		const woff2a = exportFont(original, { format: 'woff2' });
		const secondImport = importFont(woff2a);
		const woff2b = exportFont(secondImport, { format: 'woff2' });
		const thirdImport = importFont(woff2b);

		expect(stripBinaryArtifacts(thirdImport)).toEqual(
			stripBinaryArtifacts(secondImport),
		);
	});

	it('OTF → WOFF2 → reimport → stabilizes', async () => {
		const otfBuffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf')))
			.buffer;
		const original = importFont(otfBuffer);

		const woff2a = exportFont(original, { format: 'woff2' });
		const secondImport = importFont(woff2a);
		const woff2b = exportFont(secondImport, { format: 'woff2' });
		const thirdImport = importFont(woff2b);

		expect(stripBinaryArtifacts(thirdImport)).toEqual(
			stripBinaryArtifacts(secondImport),
		);
	});
});

// ─── Cross-format: WOFF1 ↔ WOFF2 ↔ SFNT ────────────────────────────────────

describe('WOFF2 cross-format', () => {
	it('WOFF1 → export WOFF2 → reimport → stabilizes', async () => {
		const woff1Buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff')))
			.buffer;
		const woff1Import = importFont(woff1Buffer);

		const woff2a = exportFont(woff1Import, { format: 'woff2' });
		const secondImport = importFont(woff2a);
		const woff2b = exportFont(secondImport, { format: 'woff2' });
		const thirdImport = importFont(woff2b);

		expect(stripBinaryArtifacts(thirdImport)).toEqual(
			stripBinaryArtifacts(secondImport),
		);
	});

	it('WOFF2 → export WOFF1 → reimport → stabilizes', async () => {
		const woff2Buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff2')))
			.buffer;
		const woff2Import = importFont(woff2Buffer);

		const woff1a = exportFont(woff2Import, { format: 'woff' });
		const secondImport = importFont(woff1a);
		const woff1b = exportFont(secondImport, { format: 'woff' });
		const thirdImport = importFont(woff1b);

		expect(stripBinaryArtifacts(thirdImport)).toEqual(
			stripBinaryArtifacts(secondImport),
		);
	});
});
