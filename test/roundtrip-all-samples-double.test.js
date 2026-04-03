/**
 * Double round-trip test across all sample SFNT fonts.
 *
 * For each .ttf/.otf/.ttc in test/sample fonts:
 *   import -> export -> import -> export -> import
 * and verify stabilization after the first round-trip.
 */

import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont } from '../src/export.js';
import { importFont } from '../src/import.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');
const SUPPORTED_EXT_RE = /\.(ttf|otf|ttc)$/i;
// Skip fonts that are too large for the double round-trip heap budget
const SKIP_FONTS = new Set(['NotoSerifCJK-Regular-otc-online-test.ttc']);

describe('double round-trip on all sample fonts', () => {
	it('should be stable across two export/import cycles for every sample SFNT font', async () => {
		const names = await readdir(SAMPLES_DIR);
		const sampleFonts = names
			.filter((name) => SUPPORTED_EXT_RE.test(name) && !SKIP_FONTS.has(name))
			.sort((a, b) => a.localeCompare(b));
		const failures = [];

		expect(sampleFonts.length).toBeGreaterThan(0);

		for (const fileName of sampleFonts) {
			try {
				const filePath = resolve(SAMPLES_DIR, fileName);
				const originalBuffer = (await readFile(filePath)).buffer;

				const firstImport = importFont(originalBuffer);
				const firstExport = exportFont(firstImport);
				const secondImport = importFont(firstExport);
				const secondExport = exportFont(secondImport);
				const thirdImport = importFont(secondExport);

				expect(
					thirdImport,
					`Double round-trip did not stabilize for ${fileName}`,
				).toEqual(secondImport);
			} catch (error) {
				failures.push({
					fileName,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		expect(
			failures,
			`Double round-trip failures: ${JSON.stringify(failures)}`,
		).toEqual([]);
	}, 300000);
});
