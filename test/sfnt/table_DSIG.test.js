/**
 * Tests for DSIG table parsing and writing.
 */

import { describe, expect, it } from 'vitest';
import { parseDSIG, writeDSIG } from '../../src/sfnt/table_DSIG.js';

describe('DSIG table', () => {
	it('should round-trip DSIG with one signature block', () => {
		const original = {
			version: 1,
			flags: 0,
			signatures: [{ format: 1, _raw: [0x30, 0x82, 0x01, 0x00] }],
		};

		const parsed = parseDSIG(writeDSIG(original));

		expect(parsed.version).toBe(1);
		expect(parsed.flags).toBe(0);
		expect(parsed.signatures.length).toBe(1);
		expect(parsed.signatures[0].format).toBe(1);
		expect(parsed.signatures[0]._raw).toEqual([0x30, 0x82, 0x01, 0x00]);
	});

	it('should round-trip empty DSIG', () => {
		const original = {
			version: 1,
			flags: 0,
			signatures: [],
		};

		const parsed = parseDSIG(writeDSIG(original));
		expect(parsed.signatures).toEqual([]);
	});
});
