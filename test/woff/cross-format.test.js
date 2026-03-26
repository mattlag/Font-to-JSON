/**
 * Cross-format container tests
 * Verifies that any imported font can be exported to any supported container
 * format (SFNT, WOFF) and that smart defaults match the import format.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFont } from '../../src/main.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

// ─── Helper ─────────────────────────────────────────────────────────────────

const WOFF_SIG = 0x774f4646;
const TTF_SIG = 0x00010000;
const OTTO_SIG = 0x4f54544f;
const TTC_SIG = 0x74746366;
const SFNT_SIGS = [TTF_SIG, OTTO_SIG];

function sig(buf) {
	return new DataView(buf).getUint32(0);
}

function stripWoff(obj) {
	const { _woff: _, ...rest } = obj;
	return rest;
}

// ─── Smart default format ───────────────────────────────────────────────────

describe('Smart default format', () => {
	it('SFNT (TTF) import → export with no format → produces SFNT', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const imported = importFont(buf);
		const out = exportFont(imported);
		expect(SFNT_SIGS).toContain(sig(out));
	});

	it('SFNT (OTF) import → export with no format → produces SFNT', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const imported = importFont(buf);
		const out = exportFont(imported);
		expect(SFNT_SIGS).toContain(sig(out));
	});

	it('WOFF import → export with no format → produces WOFF', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff'))).buffer;
		const imported = importFont(buf);
		expect(imported._woff?.version).toBe(1);
		const out = exportFont(imported);
		expect(sig(out)).toBe(WOFF_SIG);
	});

	it('Hand-authored JSON → export with no format → produces SFNT', async () => {
		const handAuthored = {
			font: {
				familyName: 'Test',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500 },
				{
					name: 'A',
					unicode: 65,
					advanceWidth: 600,
					contours: [[
						{ x: 0, y: 0, onCurve: true },
						{ x: 300, y: 700, onCurve: true },
						{ x: 600, y: 0, onCurve: true },
					]],
				},
			],
		};
		const out = exportFont(handAuthored);
		expect(SFNT_SIGS).toContain(sig(out));
	});
});

// ─── Cross-container: single fonts ──────────────────────────────────────────

describe('Cross-container export', () => {
	it('TTF SFNT → export WOFF → reimport → matches original', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const original = importFont(buf);
		const woff = exportFont(original, { format: 'woff' });
		expect(sig(woff)).toBe(WOFF_SIG);
		const reimported = importFont(woff);
		expect(stripWoff(reimported)).toEqual(original);
	});

	it('OTF SFNT → export WOFF → reimport → matches original', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const original = importFont(buf);
		const woff = exportFont(original, { format: 'woff' });
		expect(sig(woff)).toBe(WOFF_SIG);
		const reimported = importFont(woff);
		expect(stripWoff(reimported)).toEqual(original);
	});

	it('WOFF (OTF-based) → export SFNT → reimport → matches', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff'))).buffer;
		const woffImport = importFont(buf);
		const sfnt = exportFont(woffImport, { format: 'sfnt' });
		expect(SFNT_SIGS).toContain(sig(sfnt));
		const sfntImport = importFont(sfnt);
		// SFNT reimport should not have _woff
		expect(sfntImport._woff).toBeUndefined();
		// Font data should match (aside from _woff on the WOFF side)
		expect(sfntImport).toEqual(stripWoff(woffImport));
	});

	it('Hand-authored JSON → export WOFF → reimport → valid font', async () => {
		const handAuthored = {
			font: {
				familyName: 'Test',
				unitsPerEm: 1000,
				ascender: 800,
				descender: -200,
			},
			glyphs: [
				{ name: '.notdef', unicode: null, advanceWidth: 500 },
				{
					name: 'space',
					unicode: 32,
					advanceWidth: 250,
				},
			],
		};
		const woff = exportFont(handAuthored, { format: 'woff' });
		expect(sig(woff)).toBe(WOFF_SIG);
		const reimported = importFont(woff);
		expect(reimported.font).toBeDefined();
		expect(reimported.glyphs).toBeDefined();
		expect(reimported._woff?.version).toBe(1);
	});
});

// ─── Format override ────────────────────────────────────────────────────────

describe('Format override', () => {
	it('WOFF import + format:"sfnt" → forces SFNT output', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'oblegg.woff'))).buffer;
		const imported = importFont(buf);
		const out = exportFont(imported, { format: 'sfnt' });
		expect(SFNT_SIGS).toContain(sig(out));
	});

	it('SFNT import + format:"woff" → forces WOFF output', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const imported = importFont(buf);
		const out = exportFont(imported, { format: 'woff' });
		expect(sig(out)).toBe(WOFF_SIG);
	});
});

// ─── Format validation ─────────────────────────────────────────────────────

describe('Format validation', () => {
	it('should throw on unknown format string', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const imported = importFont(buf);
		expect(() => exportFont(imported, { format: 'pdf' })).toThrow(
			'Unknown export format',
		);
	});

	it('should throw on WOFF2 format (not yet supported)', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const imported = importFont(buf);
		expect(() => exportFont(imported, { format: 'woff2' })).toThrow(
			'WOFF2 export is not yet supported',
		);
	});
});

// ─── Collection split ───────────────────────────────────────────────────────

describe('Collection split export', () => {
	it('TTC → export WOFF split → array of individual WOFFs', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'cambria-test.ttc'))).buffer;
		const imported = importFont(buf);
		expect(imported.collection).toBeDefined();
		expect(imported.fonts.length).toBeGreaterThan(1);

		const woffs = exportFont(imported, { format: 'woff', split: true });
		expect(Array.isArray(woffs)).toBe(true);
		expect(woffs.length).toBe(imported.fonts.length);
		for (const w of woffs) {
			expect(sig(w)).toBe(WOFF_SIG);
			// Each should be independently importable
			const face = importFont(w);
			expect(face.font).toBeDefined();
			expect(face.glyphs).toBeDefined();
		}
	});

	it('TTC → export SFNT split → array of individual SFNTs', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'cambria-test.ttc'))).buffer;
		const imported = importFont(buf);

		const sfnts = exportFont(imported, { format: 'sfnt', split: true });
		expect(Array.isArray(sfnts)).toBe(true);
		expect(sfnts.length).toBe(imported.fonts.length);
		for (const s of sfnts) {
			expect(SFNT_SIGS).toContain(sig(s));
			const face = importFont(s);
			expect(face.font).toBeDefined();
			expect(face.glyphs).toBeDefined();
		}
	});

	it('TTC → export WOFF (no split) → single file', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'cambria-test.ttc'))).buffer;
		const imported = importFont(buf);

		const out = exportFont(imported, { format: 'woff' });
		expect(out).toBeInstanceOf(ArrayBuffer);
		expect(Array.isArray(out)).toBe(false);
		expect(sig(out)).toBe(WOFF_SIG);
	});

	it('TTC → export (no options) → single TTC', async () => {
		const buf = (await readFile(resolve(SAMPLES_DIR, 'cambria-test.ttc'))).buffer;
		const imported = importFont(buf);

		const out = exportFont(imported);
		expect(out).toBeInstanceOf(ArrayBuffer);
		expect(sig(out)).toBe(TTC_SIG);
	});
});
