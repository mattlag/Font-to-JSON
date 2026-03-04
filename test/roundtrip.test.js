/**
 * Round-trip test
 * Import a sample font → JSON → export back to binary → re-import → compare JSON.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFont } from '../src/main.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');

describe('Round-trip: OTF', () => {
	it('should produce identical JSON after import → export → re-import', async () => {
		const filePath = resolve(SAMPLES_DIR, 'oblegg.otf');
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);

		const exported = exportFont(firstImport);

		// Re-import the exported binary
		const secondImport = importFont(exported);

		expect(secondImport).toEqual(firstImport);
	});
});

describe('Round-trip: TTF', () => {
	it('should produce identical JSON after import → export → re-import', async () => {
		const filePath = resolve(SAMPLES_DIR, 'oblegg.ttf');
		const buffer = (await readFile(filePath)).buffer;

		const firstImport = importFont(buffer);

		const exported = exportFont(firstImport);

		const secondImport = importFont(exported);

		expect(secondImport).toEqual(firstImport);
	});
});
