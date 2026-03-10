/**
 * Tests for the SVG (Scalable Vector Graphics) table parser / writer.
 */
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { exportFont, importFont } from '../../src/main.js';
import { parseSVG, writeSVG } from '../../src/sfnt/table_SVG.js';

const SAMPLES = path.resolve('test/sample fonts');

/**
 * Helper: load a font and return the parsed SVG table.
 */
function loadSVG(filename) {
	const buf = fs.readFileSync(path.join(SAMPLES, filename));
	const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
	const font = importFont(ab).raw;
	return { font, svg: font.tables['SVG '] };
}

describe('SVG table', () => {
	// == Parsing: plain text SVG fonts ====================================

	it('should parse the SVG table from Reinebow-SVGinOT.ttf', () => {
		const { svg } = loadSVG('Reinebow-SVGinOT.ttf');

		expect(svg).toBeDefined();
		expect(svg.version).toBe(0);
		expect(svg.documents.length).toBeGreaterThan(0);
		expect(svg.entries.length).toBeGreaterThan(0);
	});

	it('should contain plain-text SVG documents in Reinebow', () => {
		const { svg } = loadSVG('Reinebow-SVGinOT.ttf');

		// All documents in Reinebow are plain text
		for (const doc of svg.documents) {
			expect(doc.compressed).toBe(false);
			expect(typeof doc.text).toBe('string');
			expect(doc.text).toContain('<svg');
		}
	});

	it('should parse the SVG table from Multicoloure-SVGinOT.ttf', () => {
		const { svg } = loadSVG('Multicoloure-SVGinOT.ttf');

		expect(svg.version).toBe(0);
		expect(svg.documents.length).toBe(161);
		expect(svg.entries.length).toBe(161);
		expect(svg.documents[0].compressed).toBe(false);
		expect(svg.documents[0].text).toContain(
			'xmlns="http://www.w3.org/2000/svg"',
		);
	});

	// == Parsing: gzip-compressed SVG ====================================

	it('should parse gzip-compressed SVG documents from EmojiOneColor.otf', () => {
		const { svg } = loadSVG('EmojiOneColor.otf');

		expect(svg.version).toBe(0);
		expect(svg.documents.length).toBeGreaterThan(0);

		// EmojiOneColor uses gzip-compressed SVG
		expect(svg.documents[0].compressed).toBe(true);
		expect(Array.isArray(svg.documents[0].data)).toBe(true);
		expect(svg.documents[0].data[0]).toBe(0x1f); // gzip magic
		expect(svg.documents[0].data[1]).toBe(0x8b);
	});

	it('should map entries to document indices correctly', () => {
		const { svg } = loadSVG('Reinebow-SVGinOT.ttf');

		for (const entry of svg.entries) {
			expect(entry.startGlyphID).toBeLessThanOrEqual(entry.endGlyphID);
			expect(entry.documentIndex).toBeGreaterThanOrEqual(0);
			expect(entry.documentIndex).toBeLessThan(svg.documents.length);
		}
	});

	it('should not have _raw (fully parsed)', () => {
		const { svg } = loadSVG('Reinebow-SVGinOT.ttf');
		expect(svg._raw).toBeUndefined();
	});

	// == Round-trip ======================================================

	it('should round-trip SVG from Reinebow-SVGinOT.ttf', () => {
		const buf = fs.readFileSync(path.join(SAMPLES, 'Reinebow-SVGinOT.ttf'));
		const ab = buf.buffer.slice(
			buf.byteOffset,
			buf.byteOffset + buf.byteLength,
		);
		const font = importFont(ab).raw;

		const exported = exportFont(font);
		const reimported = importFont(exported).raw;
		const orig = font.tables['SVG '];
		const rt = reimported.tables['SVG '];

		expect(rt.version).toBe(orig.version);
		expect(rt.documents.length).toBe(orig.documents.length);
		expect(rt.entries.length).toBe(orig.entries.length);

		// Verify all document text matches
		for (let i = 0; i < orig.documents.length; i++) {
			expect(rt.documents[i].compressed).toBe(orig.documents[i].compressed);
			if (!orig.documents[i].compressed) {
				expect(rt.documents[i].text).toBe(orig.documents[i].text);
			}
		}
	});

	it('should round-trip SVG from Multicoloure-SVGinOT.ttf', () => {
		const buf = fs.readFileSync(path.join(SAMPLES, 'Multicoloure-SVGinOT.ttf'));
		const ab = buf.buffer.slice(
			buf.byteOffset,
			buf.byteOffset + buf.byteLength,
		);
		const font = importFont(ab).raw;

		const exported = exportFont(font);
		const reimported = importFont(exported).raw;
		const orig = font.tables['SVG '];
		const rt = reimported.tables['SVG '];

		expect(rt.entries.length).toBe(orig.entries.length);
		for (let i = 0; i < orig.documents.length; i++) {
			expect(rt.documents[i].text).toBe(orig.documents[i].text);
		}
	});

	it('should round-trip gzip SVG from EmojiOneColor.otf', () => {
		const buf = fs.readFileSync(path.join(SAMPLES, 'EmojiOneColor.otf'));
		const ab = buf.buffer.slice(
			buf.byteOffset,
			buf.byteOffset + buf.byteLength,
		);
		const font = importFont(ab).raw;

		const exported = exportFont(font);
		const reimported = importFont(exported).raw;
		const orig = font.tables['SVG '];
		const rt = reimported.tables['SVG '];

		expect(rt.documents.length).toBe(orig.documents.length);
		for (let i = 0; i < orig.documents.length; i++) {
			expect(rt.documents[i].compressed).toBe(orig.documents[i].compressed);
			if (orig.documents[i].compressed) {
				expect(rt.documents[i].data).toEqual(orig.documents[i].data);
			}
		}
	});

	// == Synthetic =======================================================

	it('should handle a synthetic SVG table with two documents', () => {
		const original = {
			version: 0,
			documents: [
				{
					compressed: false,
					text: '<svg xmlns="http://www.w3.org/2000/svg" id="glyph1"><rect width="100" height="100"/></svg>',
				},
				{
					compressed: false,
					text: '<svg xmlns="http://www.w3.org/2000/svg" id="glyph5"><circle r="50"/></svg>',
				},
			],
			entries: [
				{ startGlyphID: 1, endGlyphID: 1, documentIndex: 0 },
				{ startGlyphID: 5, endGlyphID: 5, documentIndex: 1 },
			],
		};

		const bytes = writeSVG(original);
		const parsed = parseSVG(bytes);

		expect(parsed.version).toBe(0);
		expect(parsed.documents.length).toBe(2);
		expect(parsed.entries.length).toBe(2);
		expect(parsed.documents[0].text).toBe(original.documents[0].text);
		expect(parsed.documents[1].text).toBe(original.documents[1].text);
		expect(parsed.entries[0].startGlyphID).toBe(1);
		expect(parsed.entries[1].startGlyphID).toBe(5);
	});
});
