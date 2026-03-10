#!/usr/bin/env node
/**
 * Visual Round-Trip Test — Development Server
 *
 * 1. Generates round-tripped fonts (same as generate.js)
 * 2. Starts a local HTTP server that serves:
 *    - /                        -> index.html
 *    - /api/fonts               -> JSON manifest of available fonts
 *    - /fonts/original/<name>   -> original sample font
 *    - /fonts/roundtrip/<name>  -> round-tripped font
 *
 * Usage:  node test/visual/server.js [--port=3000]
 */

import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { exportFont, importFont } from '../../src/main.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES_DIR = path.resolve(__dirname, '../sample fonts');
const GENERATED_DIR = path.resolve(__dirname, 'generated');
const HTML_FILE = path.resolve(__dirname, 'index.html');

// Parse port from CLI args
const portArg = process.argv.find((a) => a.startsWith('--port='));
const PORT = portArg ? parseInt(portArg.split('=')[1]) : 3000;

const SUPPORTED_EXTENSIONS = new Set(['.otf', '.ttf']);

const MIME_TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'application/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.otf': 'font/otf',
	'.ttf': 'font/ttf',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
};

// --- Step 1: Generate round-tripped fonts -----------------------------

if (!fs.existsSync(GENERATED_DIR)) {
	fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

const fontFiles = fs.readdirSync(SAMPLES_DIR).filter((f) => {
	const ext = path.extname(f).toLowerCase();
	return SUPPORTED_EXTENSIONS.has(ext);
});

console.log(`\n  Visual Round-Trip Server`);
console.log(`  =======================\n`);
console.log(`  Generating round-tripped fonts…\n`);

const manifest = [];

/** JSON replacer that handles BigInt values */
function jsonReplacer(_key, value) {
	if (typeof value === 'bigint') return `BigInt:${value.toString()}`;
	return value;
}

for (const file of fontFiles) {
	const srcPath = path.join(SAMPLES_DIR, file);
	const outPath = path.join(GENERATED_DIR, file);
	const jsonPath = path.join(GENERATED_DIR, file + '.json');

	try {
		const buf = fs.readFileSync(srcPath);
		const ab = buf.buffer.slice(
			buf.byteOffset,
			buf.byteOffset + buf.byteLength,
		);
		const fontData = importFont(ab);
		const exported = exportFont(fontData);
		fs.writeFileSync(outPath, Buffer.from(exported));

		// Save the intermediate JSON representation
		fs.writeFileSync(jsonPath, JSON.stringify(fontData, jsonReplacer, 2));

		manifest.push({
			name: file,
			originalSize: buf.length,
			roundtripSize: exported.byteLength,
			jsonSize: fs.statSync(jsonPath).size,
		});

		const diff = exported.byteLength - buf.length;
		const sign = diff >= 0 ? '+' : '';
		console.log(
			`    ✓ ${file}  (${buf.length.toLocaleString()} -> ${exported.byteLength.toLocaleString()}, ${sign}${diff})`,
		);
	} catch (err) {
		console.log(`    ✗ ${file}  ERROR: ${err.message}`);
	}
}

console.log(`\n  ${manifest.length}/${fontFiles.length} fonts generated\n`);

// --- Step 2: Start HTTP server ----------------------------------------

const server = http.createServer((req, res) => {
	const url = new URL(req.url, `http://localhost:${PORT}`);
	const pathname = url.pathname;

	// API: font manifest
	if (pathname === '/api/fonts') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(manifest));
		return;
	}

	// Serve original fonts
	if (pathname.startsWith('/fonts/original/')) {
		const name = decodeURIComponent(pathname.slice('/fonts/original/'.length));
		return serveFile(path.join(SAMPLES_DIR, name), res);
	}

	// Serve round-tripped fonts
	if (pathname.startsWith('/fonts/roundtrip/')) {
		const name = decodeURIComponent(pathname.slice('/fonts/roundtrip/'.length));
		return serveFile(path.join(GENERATED_DIR, name), res);
	}

	// Serve intermediate JSON
	if (pathname.startsWith('/api/json/')) {
		const name = decodeURIComponent(pathname.slice('/api/json/'.length));
		return serveFile(path.join(GENERATED_DIR, name + '.json'), res);
	}

	// Serve index.html for root
	if (pathname === '/' || pathname === '/index.html') {
		return serveFile(HTML_FILE, res);
	}

	// 404
	res.writeHead(404, { 'Content-Type': 'text/plain' });
	res.end('Not Found');
});

function serveFile(filePath, res) {
	if (!fs.existsSync(filePath)) {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('Not Found');
		return;
	}

	const ext = path.extname(filePath).toLowerCase();
	const mime = MIME_TYPES[ext] || 'application/octet-stream';

	try {
		const data = fs.readFileSync(filePath);
		res.writeHead(200, {
			'Content-Type': mime,
			'Cache-Control': 'no-cache',
			'Access-Control-Allow-Origin': '*',
		});
		res.end(data);
	} catch (err) {
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end(`Server Error: ${err.message}`);
	}
}

server.listen(PORT, () => {
	console.log(`  Server running at  http://localhost:${PORT}`);
	console.log(`  Press Ctrl+C to stop\n`);
});
