/**
 * diagnoseFont tests.
 *
 * Tests the binary font diagnostic feature that catches and reports problems
 * in corrupted or malformed font files, rather than just throwing.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FontFlux } from '../src/font_flux.js';
import { diagnoseFont } from '../src/validate/diagnoseFont.js';

const SAMPLES_DIR = resolve(import.meta.dirname, 'sample fonts');

// ============================================================================
//  Helper: load sample font
// ============================================================================

async function loadSample(name) {
	const buf = await readFile(resolve(SAMPLES_DIR, name));
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

// ============================================================================
//  Valid fonts — should report no errors
// ============================================================================

describe('diagnoseFont — valid fonts', () => {
	it('should report a valid TTF font as valid', async () => {
		const buffer = await loadSample('oblegg.ttf');
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(true);
		expect(report.summary.errorCount).toBe(0);
	});

	it('should report a valid OTF font as valid', async () => {
		const buffer = await loadSample('oblegg.otf');
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(true);
		expect(report.summary.errorCount).toBe(0);
	});

	it('should report a valid WOFF font as valid', async () => {
		const buffer = await loadSample('oblegg.woff');
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(true);
		expect(report.summary.errorCount).toBe(0);
		expect(report.issues.some((i) => i.code === 'FORMAT_WOFF1')).toBe(true);
	});

	it('should report a valid TTC collection', async () => {
		const buffer = await loadSample('cambria-test.ttc');
		const report = diagnoseFont(buffer);
		expect(report.issues.some((i) => i.code === 'FORMAT_COLLECTION')).toBe(
			true,
		);
	});
});

// ============================================================================
//  Static method on FontFlux
// ============================================================================

describe('FontFlux.diagnose()', () => {
	it('should be accessible as a static method', async () => {
		const buffer = await loadSample('oblegg.ttf');
		const report = FontFlux.diagnose(buffer);
		expect(report.valid).toBe(true);
		expect(report.summary).toBeDefined();
	});
});

// ============================================================================
//  Corrupted / malformed inputs
// ============================================================================

describe('diagnoseFont — corrupted inputs', () => {
	it('should report non-ArrayBuffer input', () => {
		const report = diagnoseFont('not a buffer');
		expect(report.valid).toBe(false);
		expect(report.errors[0].code).toBe('NOT_ARRAYBUFFER');
	});

	it('should report a file too short for a font header', () => {
		const buffer = new ArrayBuffer(8);
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(report.errors[0].code).toBe('TOO_SHORT');
	});

	it('should report an unrecognized signature', () => {
		const buffer = new ArrayBuffer(64);
		const view = new DataView(buffer);
		view.setUint32(0, 0xdeadbeef); // garbage signature
		view.setUint16(4, 2); // numTables
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(report.errors.some((e) => e.code === 'BAD_SF_VERSION')).toBe(true);
	});

	it('should report a truncated table directory', () => {
		const buffer = new ArrayBuffer(16); // header fits, but no room for directory
		const view = new DataView(buffer);
		view.setUint32(0, 0x00010000); // TrueType
		view.setUint16(4, 10); // numTables = 10 → needs 12 + 160 bytes
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(report.errors.some((e) => e.code === 'DIRECTORY_TRUNCATED')).toBe(
			true,
		);
	});

	it('should report numTables = 0', () => {
		const buffer = new ArrayBuffer(12);
		const view = new DataView(buffer);
		view.setUint32(0, 0x00010000);
		view.setUint16(4, 0); // numTables = 0
		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(report.errors.some((e) => e.code === 'NO_TABLES')).toBe(true);
	});

	it('should report tables extending beyond file bounds', async () => {
		// Create a minimal font with 1 table entry pointing beyond the file
		const buffer = new ArrayBuffer(28); // 12-byte header + 16-byte record
		const view = new DataView(buffer);
		view.setUint32(0, 0x00010000); // TrueType
		view.setUint16(4, 1); // numTables = 1
		view.setUint16(6, 16); // searchRange
		view.setUint16(8, 0); // entrySelector
		view.setUint16(10, 0); // rangeShift

		// Table record: head table at offset 100, length 100
		const enc = new TextEncoder();
		const tag = enc.encode('head');
		new Uint8Array(buffer, 12, 4).set(tag);
		view.setUint32(16, 0); // checksum
		view.setUint32(20, 100); // offset — beyond file
		view.setUint32(24, 100); // length

		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(report.errors.some((e) => e.code === 'TABLE_OUT_OF_BOUNDS')).toBe(
			true,
		);
	});

	it('should report missing required tables', async () => {
		// Minimal valid font structure but with an unknown table tag
		const tableData = new Uint8Array(32); // 32 bytes of dummy table data
		const bufSize = 12 + 16 + tableData.length; // header + 1 record + data
		const buffer = new ArrayBuffer(bufSize);
		const view = new DataView(buffer);
		view.setUint32(0, 0x00010000);
		view.setUint16(4, 1);
		view.setUint16(6, 16);
		view.setUint16(8, 0);
		view.setUint16(10, 0);

		// Table record: unknown table 'XXXX'
		const tag = new TextEncoder().encode('XXXX');
		new Uint8Array(buffer, 12, 4).set(tag);
		view.setUint32(16, 0); // checksum
		view.setUint32(20, 28); // offset = right after directory
		view.setUint32(24, tableData.length);

		const report = diagnoseFont(buffer);
		expect(report.valid).toBe(false);
		expect(report.errors.some((e) => e.code === 'MISSING_REQUIRED_TABLE')).toBe(
			true,
		);
		expect(report.errors.some((e) => e.code === 'NO_OUTLINES')).toBe(true);
	});

	it('should catch per-table parse failures', async () => {
		// Create a font with a head table containing garbage data
		const garbageTable = new Uint8Array(54); // head is 54 bytes but all zeroes = invalid magic
		const bufSize = 12 + 16 + 56; // header + 1 record + padded table
		const buffer = new ArrayBuffer(bufSize);
		const view = new DataView(buffer);
		view.setUint32(0, 0x00010000);
		view.setUint16(4, 1);
		view.setUint16(6, 16);
		view.setUint16(8, 0);
		view.setUint16(10, 0);

		const tag = new TextEncoder().encode('head');
		new Uint8Array(buffer, 12, 4).set(tag);
		view.setUint32(16, 0);
		view.setUint32(20, 28);
		view.setUint32(24, 54);
		new Uint8Array(buffer, 28, 54).set(garbageTable);

		const report = diagnoseFont(buffer);
		// head should parse (all zeroes is technically parseable) but magic number should fail
		expect(report.errors.some((e) => e.code === 'BAD_MAGIC_NUMBER')).toBe(true);
	});
});

// ============================================================================
//  Report format consistency
// ============================================================================

describe('diagnoseFont — report format', () => {
	it('should have the same shape as validateJSON reports', async () => {
		const buffer = await loadSample('oblegg.ttf');
		const report = diagnoseFont(buffer);

		expect(report).toHaveProperty('valid');
		expect(report).toHaveProperty('errors');
		expect(report).toHaveProperty('warnings');
		expect(report).toHaveProperty('infos');
		expect(report).toHaveProperty('issues');
		expect(report).toHaveProperty('summary');
		expect(report.summary).toHaveProperty('errorCount');
		expect(report.summary).toHaveProperty('warningCount');
		expect(report.summary).toHaveProperty('infoCount');
		expect(report.summary).toHaveProperty('issueCount');

		expect(Array.isArray(report.errors)).toBe(true);
		expect(Array.isArray(report.warnings)).toBe(true);
		expect(Array.isArray(report.infos)).toBe(true);
		expect(Array.isArray(report.issues)).toBe(true);
	});

	it('issues should have severity, code, and message fields', async () => {
		const buffer = await loadSample('oblegg.otf');
		const report = diagnoseFont(buffer);

		for (const issue of report.issues) {
			expect(issue).toHaveProperty('severity');
			expect(issue).toHaveProperty('code');
			expect(issue).toHaveProperty('message');
			expect(['error', 'warning', 'info']).toContain(issue.severity);
		}
	});
});

// ============================================================================
//  Standalone export
// ============================================================================

describe('diagnoseFont — standalone export', () => {
	it('should be importable from the main entry point', async () => {
		const { diagnoseFont: df } = await import('../src/main.js');
		expect(typeof df).toBe('function');
	});
});

// ============================================================================
//  Round-trip fix: invalid-example.otf
// ============================================================================

describe('diagnoseFont — round-trip fix for invalid-example.otf', () => {
	it('should detect problems in the original file', async () => {
		const buffer = await loadSample('invalid-example.otf');
		const report = diagnoseFont(buffer);

		// Original has zeroed checksums
		expect(report.summary.warningCount).toBeGreaterThan(0);
		expect(report.warnings.some((w) => w.code === 'BAD_CHECKSUM')).toBe(true);
	});

	it('should produce a clean font after import → fix → export → re-diagnose', async () => {
		const buffer = await loadSample('invalid-example.otf');

		// Step 1: Open in FontFlux (import + simplify)
		const font = FontFlux.open(buffer);

		// Step 2: Apply the same fixes the demo "Fix All" would apply
		//   - Set missing family name
		if (!font.info.familyName || font.info.familyName === 'Untitled') {
			font.info.familyName = 'FixedFont';
		}
		//   - Set missing style name
		if (!font.info.styleName || font.info.styleName === 'Regular') {
			font.info.styleName = 'Regular';
		}
		// The rest (checksums, header fields, hmtx/hhea) should be fixed by export

		// Step 3: Export
		const exported = font.export();

		// Step 4: Re-diagnose the exported binary
		const report2 = diagnoseFont(exported);

		// Checksums should now be valid (no BAD_CHECKSUM warnings)
		const checksumWarnings = report2.warnings.filter(
			(w) => w.code === 'BAD_CHECKSUM',
		);
		expect(checksumWarnings).toEqual([]);

		// hmtx/hhea should be consistent
		expect(report2.warnings.some((w) => w.code === 'HMTX_GLYPH_MISMATCH')).toBe(
			false,
		);
		expect(report2.warnings.some((w) => w.code === 'HHEA_HMTX_MISMATCH')).toBe(
			false,
		);

		// Name table should have family and style names
		expect(report2.warnings.some((w) => w.code === 'NO_FAMILY_NAME')).toBe(
			false,
		);
		expect(report2.warnings.some((w) => w.code === 'NO_STYLE_NAME')).toBe(
			false,
		);

		// Header fields should be correct
		expect(report2.warnings.some((w) => w.code === 'BAD_SEARCH_RANGE')).toBe(
			false,
		);
		expect(report2.warnings.some((w) => w.code === 'BAD_ENTRY_SELECTOR')).toBe(
			false,
		);
		expect(report2.warnings.some((w) => w.code === 'BAD_RANGE_SHIFT')).toBe(
			false,
		);

		// Overall: should have no errors
		expect(report2.summary.errorCount).toBe(0);
	});
});
