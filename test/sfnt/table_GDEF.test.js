/**
 * Tests for GDEF table parsing and writing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFontTables } from '../../src/main.js';
import { parseGDEF, writeGDEF } from '../../src/sfnt/table_GDEF.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

// Fonts known to contain a GDEF table:
// oblegg.ttf, fira.ttf, noto.ttf, BungeeTint, Multicoloure, Reinebow

describe('GDEF table parsing', () => {
	it('should parse GDEF from oblegg.ttf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gdef = font.tables['GDEF'];

		expect(gdef).toBeDefined();
		expect(gdef._raw).toBeUndefined();
		expect(gdef.majorVersion).toBe(1);
	});

	it('should parse GDEF from fira.ttf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'fira.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gdef = font.tables['GDEF'];

		expect(gdef).toBeDefined();
		expect(gdef.majorVersion).toBe(1);
	});

	it('should parse GDEF from noto.ttf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'noto.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gdef = font.tables['GDEF'];

		expect(gdef).toBeDefined();
		expect(gdef.majorVersion).toBe(1);
	});

	it('should have a glyphClassDef when present', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'fira.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gdef = font.tables['GDEF'];

		if (gdef.glyphClassDef) {
			expect(gdef.glyphClassDef.format).toBeGreaterThanOrEqual(1);
			expect(gdef.glyphClassDef.format).toBeLessThanOrEqual(2);
		}
	});

	it('should not have _raw on parsed GDEF', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFontTables(buffer);
		const gdef = font.tables['GDEF'];

		expect(gdef._raw).toBeUndefined();
		expect(gdef._checksum).toBeTypeOf('number');
	});
});

describe('GDEF table round-trip', () => {
	for (const fontFile of ['oblegg.ttf', 'fira.ttf', 'noto.ttf']) {
		it(`should round-trip GDEF from ${fontFile}`, async () => {
			const buffer = (await readFile(resolve(SAMPLES_DIR, fontFile))).buffer;
			const font = importFontTables(buffer);
			const { _checksum, ...gdefData } = font.tables['GDEF'];

			const writtenBytes = writeGDEF(gdefData);
			const reparsed = parseGDEF(writtenBytes);

			expect(reparsed).toEqual(gdefData);
		});
	}
});
