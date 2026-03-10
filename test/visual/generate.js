#!/usr/bin/env node
/**
 * Visual Round-Trip Test — Font Generator
 *
 * Reads every OTF/TTF sample font, round-trips it through
 * importFont -> exportFont, and writes the result to test/visual/generated/.
 *
 * Usage:  node test/visual/generate.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exportFont, importFont } from '../../src/main.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES_DIR = path.resolve(__dirname, '../sample fonts');
const GENERATED_DIR = path.resolve(__dirname, 'generated');

// Only process formats the library can round-trip today
const SUPPORTED_EXTENSIONS = new Set(['.otf', '.ttf']);

// Ensure output directory exists
if (!fs.existsSync(GENERATED_DIR)) {
	fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

const files = fs.readdirSync(SAMPLES_DIR).filter((f) => {
	const ext = path.extname(f).toLowerCase();
	return SUPPORTED_EXTENSIONS.has(ext);
});

console.log(`\nVisual Round-Trip Generator`);
console.log(`==========================`);
console.log(`Source: ${SAMPLES_DIR}`);
console.log(`Output: ${GENERATED_DIR}`);
console.log(`Found ${files.length} font file(s) to process\n`);

let passed = 0;
let failed = 0;

for (const file of files) {
	const srcPath = path.join(SAMPLES_DIR, file);
	const outPath = path.join(GENERATED_DIR, file);

	try {
		// Read original font
		const buf = fs.readFileSync(srcPath);
		const ab = buf.buffer.slice(
			buf.byteOffset,
			buf.byteOffset + buf.byteLength,
		);

		// Round-trip: import -> export
		const fontData = importFont(ab);
		const exported = exportFont(fontData);

		// Write the round-tripped font
		fs.writeFileSync(outPath, Buffer.from(exported));

		// Write the intermediate JSON
		const jsonPath = path.join(GENERATED_DIR, file + '.json');
		fs.writeFileSync(
			jsonPath,
			JSON.stringify(
				fontData,
				(_k, v) => (typeof v === 'bigint' ? `BigInt:${v}` : v),
				2,
			),
		);

		const origSize = buf.length;
		const rtSize = exported.byteLength;
		const diff = rtSize - origSize;
		const sign = diff >= 0 ? '+' : '';
		console.log(
			`  ✓ ${file}  (${origSize.toLocaleString()} -> ${rtSize.toLocaleString()} bytes, ${sign}${diff})`,
		);
		passed++;
	} catch (err) {
		console.log(`  ✗ ${file}  ERROR: ${err.message}`);
		failed++;
	}
}

console.log(`\nDone: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
	process.exit(1);
}
