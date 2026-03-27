/**
 * Tests for fontToJSON / fontFromJSON (src/json.js)
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	exportFont,
	fontFromJSON,
	fontToJSON,
	importFont,
} from '../src/main.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');

describe('fontToJSON', () => {
	it('should return a valid JSON string', () => {
		const data = { font: { familyName: 'Test' }, glyphs: [] };
		const json = fontToJSON(data);
		expect(typeof json).toBe('string');
		expect(() => JSON.parse(json)).not.toThrow();
	});

	it('should convert BigInt values to numbers', () => {
		const data = {
			tables: { head: { created: 3_600_000_000n, modified: 3_700_000_000n } },
		};
		const json = fontToJSON(data);
		const parsed = JSON.parse(json);
		expect(parsed.tables.head.created).toBe(3_600_000_000);
		expect(parsed.tables.head.modified).toBe(3_700_000_000);
		expect(typeof parsed.tables.head.created).toBe('number');
	});

	it('should strip transient top-level underscore-prefixed properties', () => {
		const data = {
			font: { familyName: 'Test' },
			_header: { sfVersion: 65536 },
			_dirty: true,
			_fileName: 'test.otf',
			_originalBuffer: new ArrayBuffer(10),
		};
		const json = fontToJSON(data);
		const parsed = JSON.parse(json);
		expect(parsed.font).toBeDefined();
		expect(parsed._header).toBeDefined();
		expect(parsed._dirty).toBeUndefined();
		expect(parsed._fileName).toBeUndefined();
		expect(parsed._originalBuffer).toBeUndefined();
	});

	it('should preserve table-level _raw and _checksum', () => {
		const data = {
			tables: {
				head: { unitsPerEm: 1000, _checksum: 0x12345678 },
				FFTM: { _raw: [1, 2, 3], _checksum: 0xabcdef01 },
			},
		};
		const json = fontToJSON(data);
		const parsed = JSON.parse(json);
		expect(parsed.tables.head.unitsPerEm).toBe(1000);
		expect(parsed.tables.head._checksum).toBe(0x12345678);
		expect(parsed.tables.FFTM._raw).toEqual([1, 2, 3]);
		expect(parsed.tables.FFTM._checksum).toBe(0xabcdef01);
	});

	it('should respect the indent parameter', () => {
		const data = { font: { familyName: 'Test' } };
		const compact = fontToJSON(data, 0);
		const indented = fontToJSON(data, 4);
		expect(compact).not.toContain('\n');
		expect(indented).toContain('    ');
	});
});

describe('fontFromJSON', () => {
	it('should parse a JSON string into an object', () => {
		const original = { font: { familyName: 'Test' }, glyphs: [] };
		const json = JSON.stringify(original);
		const result = fontFromJSON(json);
		expect(result).toEqual(original);
	});

	it('should round-trip through fontToJSON', () => {
		const data = {
			font: { familyName: 'MyFont', unitsPerEm: 1000 },
			glyphs: [{ name: '.notdef', advanceWidth: 500 }],
			tables: { head: { created: 3_600_000_000, modified: 3_700_000_000 } },
		};
		const json = fontToJSON(data);
		const restored = fontFromJSON(json);
		expect(restored.font.familyName).toBe('MyFont');
		expect(restored.glyphs).toHaveLength(1);
		expect(restored.tables.head.created).toBe(3_600_000_000);
	});
});

describe('fontToJSON / fontFromJSON with real fonts', () => {
	it('OTF: should serialize and deserialize without losing data', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const fontData = importFont(buffer);

		const json = fontToJSON(fontData);
		expect(typeof json).toBe('string');
		expect(json.length).toBeGreaterThan(100);

		// _header is preserved for lossless re-export; transient props should be gone
		expect(json).not.toContain('"_dirty"');
		expect(json).not.toContain('"_fileName"');
		expect(json).toContain('"_header"');

		const restored = fontFromJSON(json);
		expect(restored.font.familyName).toBeDefined();
		expect(restored.glyphs).toBeDefined();
		expect(restored.tables).toBeDefined();
	});

	it('TTF: should serialize and deserialize without losing data', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const fontData = importFont(buffer);

		const json = fontToJSON(fontData);
		const restored = fontFromJSON(json);
		expect(restored.font.familyName).toBeDefined();
		expect(restored.glyphs).toBeDefined();
		expect(restored.tables).toBeDefined();
	});

	it('OTF: fontFromJSON output should be exportable back to binary', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.otf'))).buffer;
		const fontData = importFont(buffer);

		const json = fontToJSON(fontData);
		const restored = fontFromJSON(json);

		// exportFont should not throw on deserialized data
		const binary = exportFont(restored);
		expect(binary).toBeInstanceOf(ArrayBuffer);
		expect(binary.byteLength).toBeGreaterThan(0);

		// Re-import should produce valid data
		const reimported = importFont(binary);
		expect(reimported.font.familyName).toBe(fontData.font.familyName);
		expect(reimported.glyphs).toHaveLength(fontData.glyphs.length);
	});

	it('TTF: fontFromJSON output should be exportable back to binary', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const fontData = importFont(buffer);

		const json = fontToJSON(fontData);
		const restored = fontFromJSON(json);

		const binary = exportFont(restored);
		expect(binary).toBeInstanceOf(ArrayBuffer);
		expect(binary.byteLength).toBeGreaterThan(0);

		const reimported = importFont(binary);
		expect(reimported.font.familyName).toBe(fontData.font.familyName);
		expect(reimported.glyphs).toHaveLength(fontData.glyphs.length);
	});
});
