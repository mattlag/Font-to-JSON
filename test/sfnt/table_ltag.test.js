/**
 * Tests for ltag table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseLtag, writeLtag } from '../../src/sfnt/table_ltag.js';

describe('ltag table', () => {
	it('should roundtrip a simple ltag table', () => {
		const original = {
			version: 1,
			flags: 0,
			tags: ['en', 'sp'],
		};
		const bytes = writeLtag(original);
		const parsed = parseLtag(bytes);
		expect(parsed).toEqual(original);
	});

	it('should roundtrip multiple BCP 47 tags', () => {
		const original = {
			version: 1,
			flags: 0,
			tags: ['en', 'es', 'sr', 'zh-Hant', 'ja'],
		};
		const bytes = writeLtag(original);
		const parsed = parseLtag(bytes);
		expect(parsed).toEqual(original);
	});

	it('should handle an empty tag list', () => {
		const original = {
			version: 1,
			flags: 0,
			tags: [],
		};
		const bytes = writeLtag(original);
		const parsed = parseLtag(bytes);
		expect(parsed).toEqual(original);
	});

	it('should parse a hand-built binary ltag', () => {
		// version=1, flags=0, numTags=2
		// Tag 0: offset=20, length=2 → "en"
		// Tag 1: offset=22, length=2 → "es"
		const buf = new ArrayBuffer(24);
		const view = new DataView(buf);
		view.setUint32(0, 1); // version
		view.setUint32(4, 0); // flags
		view.setUint32(8, 2); // numTags
		view.setUint16(12, 20); // offset 0
		view.setUint16(14, 2); // length 0
		view.setUint16(16, 22); // offset 1
		view.setUint16(18, 2); // length 1
		const bytes = new Uint8Array(buf);
		bytes[20] = 0x65; // 'e'
		bytes[21] = 0x6e; // 'n'
		bytes[22] = 0x65; // 'e'
		bytes[23] = 0x73; // 's'

		const parsed = parseLtag(Array.from(bytes));
		expect(parsed.version).toBe(1);
		expect(parsed.flags).toBe(0);
		expect(parsed.tags).toEqual(['en', 'es']);
	});
});
