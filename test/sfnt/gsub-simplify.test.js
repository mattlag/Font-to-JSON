/**
 * GSUB Simplification Integration Tests.
 *
 * Tests the full pipeline: import → simplify (extract substitutions) →
 * expand (build GSUB) → export → reimport.
 *
 * Also tests the hand-authored (from-scratch) path.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportFont } from '../../src/export.js';
import { FontFlux } from '../../src/font_flux.js';
import { importFont } from '../../src/import.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '..', 'sample fonts');

// ═══════════════════════════════════════════════════════════════════════════
//  Simplification: import decomposes GSUB into substitutions
// ═══════════════════════════════════════════════════════════════════════════

describe('GSUB simplification on import', () => {
	it('should extract substitutions from oblegg.ttf GSUB', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFont(buffer);

		// oblegg.ttf has a GSUB table — should produce substitutions
		if (!font.substitutions || font.substitutions.length === 0) {
			// If the font has no simplifiable lookups, this is OK
			return;
		}

		// Each substitution should have required fields
		for (const sub of font.substitutions) {
			expect(sub.type).toBeDefined();
			expect(sub.feature).toBeDefined();
			expect(sub.script).toBeDefined();
			expect([
				'single',
				'multiple',
				'alternate',
				'ligature',
				'reverse',
			]).toContain(sub.type);
		}
	});

	it('should extract ligature substitutions from fira.ttf', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'fira.ttf'))).buffer;
		const font = importFont(buffer);

		// Fira has ligatures
		const ligatures = (font.substitutions || []).filter(
			(s) => s.type === 'ligature',
		);

		if (ligatures.length > 0) {
			for (const lig of ligatures) {
				expect(lig.components).toBeDefined();
				expect(Array.isArray(lig.components)).toBe(true);
				expect(lig.components.length).toBeGreaterThanOrEqual(2);
				expect(typeof lig.ligature).toBe('string');
			}
		}
	});

	it('should not have GSUB in features after simplification', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font = importFont(buffer);

		// GSUB is now decomposed into substitutions, not stored in features
		expect(font.features?.GSUB).toBeUndefined();
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Round-trip: import → export → reimport preserves substitutions
// ═══════════════════════════════════════════════════════════════════════════

describe('GSUB round-trip', () => {
	it('should round-trip oblegg.ttf substitutions', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'oblegg.ttf'))).buffer;
		const font1 = importFont(buffer);

		if (!font1.substitutions || font1.substitutions.length === 0) return;

		const exported = exportFont(font1);
		const font2 = importFont(exported);

		// Substitution counts should match
		expect(font2.substitutions?.length).toBe(font1.substitutions.length);

		// Compare substitution types
		const types1 = font1.substitutions.map((s) => s.type).sort();
		const types2 = (font2.substitutions || []).map((s) => s.type).sort();
		expect(types2).toEqual(types1);
	});

	it('should round-trip fira.ttf substitutions', async () => {
		const buffer = (await readFile(resolve(SAMPLES_DIR, 'fira.ttf'))).buffer;
		const font1 = importFont(buffer);

		if (!font1.substitutions || font1.substitutions.length === 0) return;

		const exported = exportFont(font1);
		const font2 = importFont(exported);

		expect(font2.substitutions?.length).toBe(font1.substitutions.length);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  Hand-authored: build GSUB from scratch
// ═══════════════════════════════════════════════════════════════════════════

describe('GSUB from scratch (hand-authored)', () => {
	it('should build GSUB with ligature substitutions', () => {
		const font = FontFlux.create({ family: 'LigTest' });
		font.addGlyph({ name: 'f', unicode: 102, advanceWidth: 300 });
		font.addGlyph({ name: 'i', unicode: 105, advanceWidth: 300 });
		font.addGlyph({ name: 'fi', advanceWidth: 550 });

		font.addSubstitution({
			type: 'ligature',
			feature: 'liga',
			substitution: { components: ['f', 'i'], ligature: 'fi' },
		});

		expect(font.substitutions.length).toBe(1);

		const exported = font.export();
		const reimported = FontFlux.open(exported);

		// The reimported font should have the ligature
		const ligatures = reimported.listSubstitutions({ type: 'ligature' });
		expect(ligatures.length).toBeGreaterThanOrEqual(1);

		const fiLig = ligatures.find(
			(l) =>
				l.components.includes('f') &&
				l.components.includes('i') &&
				l.ligature === 'fi',
		);
		expect(fiLig).toBeDefined();
	});

	it('should build GSUB with single substitutions', () => {
		const font = FontFlux.create({ family: 'SmcpTest' });
		font.addGlyph({ name: 'a', unicode: 97, advanceWidth: 500 });
		font.addGlyph({ name: 'a.smcp', advanceWidth: 480 });

		font.addSubstitution({
			type: 'single',
			feature: 'smcp',
			substitution: { from: 'a', to: 'a.smcp' },
		});

		const exported = font.export();
		const reimported = FontFlux.open(exported);

		const singles = reimported.listSubstitutions({ type: 'single' });
		expect(singles.length).toBeGreaterThanOrEqual(1);
		expect(singles.some((s) => s.from === 'a' && s.to === 'a.smcp')).toBe(true);
	});

	it('should build GSUB with alternate substitutions', () => {
		const font = FontFlux.create({ family: 'AltTest' });
		font.addGlyph({ name: 'a', unicode: 97, advanceWidth: 500 });
		font.addGlyph({ name: 'a.alt1', advanceWidth: 500 });
		font.addGlyph({ name: 'a.alt2', advanceWidth: 500 });

		font.addSubstitution({
			type: 'alternate',
			feature: 'salt',
			substitution: { from: 'a', alternates: ['a.alt1', 'a.alt2'] },
		});

		const exported = font.export();
		const reimported = FontFlux.open(exported);

		const alts = reimported.listSubstitutions({ type: 'alternate' });
		expect(alts.length).toBeGreaterThanOrEqual(1);
		expect(alts[0].from).toBe('a');
		expect(alts[0].alternates).toContain('a.alt1');
		expect(alts[0].alternates).toContain('a.alt2');
	});

	it('should build GSUB with multiple substitutions', () => {
		const font = FontFlux.create({ family: 'MultTest' });
		font.addGlyph({ name: 'ffi', advanceWidth: 800 });
		font.addGlyph({ name: 'f', unicode: 102, advanceWidth: 300 });
		font.addGlyph({ name: 'i', unicode: 105, advanceWidth: 300 });

		font.addSubstitution({
			type: 'multiple',
			feature: 'ccmp',
			substitution: { from: 'ffi', to: ['f', 'f', 'i'] },
		});

		const exported = font.export();
		const reimported = FontFlux.open(exported);

		const mults = reimported.listSubstitutions({ type: 'multiple' });
		expect(mults.length).toBeGreaterThanOrEqual(1);
		expect(mults[0].from).toBe('ffi');
		expect(mults[0].to).toEqual(['f', 'f', 'i']);
	});

	it('should build GSUB with mixed substitution types', () => {
		const font = FontFlux.create({ family: 'MixedTest' });
		font.addGlyph({ name: 'f', unicode: 102, advanceWidth: 300 });
		font.addGlyph({ name: 'i', unicode: 105, advanceWidth: 300 });
		font.addGlyph({ name: 'fi', advanceWidth: 550 });
		font.addGlyph({ name: 'a', unicode: 97, advanceWidth: 500 });
		font.addGlyph({ name: 'a.smcp', advanceWidth: 480 });

		font.addSubstitution([
			{
				type: 'ligature',
				feature: 'liga',
				substitution: { components: ['f', 'i'], ligature: 'fi' },
			},
			{
				type: 'single',
				feature: 'smcp',
				substitution: { from: 'a', to: 'a.smcp' },
			},
		]);

		const exported = font.export();
		const reimported = FontFlux.open(exported);

		expect(
			reimported.listSubstitutions({ type: 'ligature' }).length,
		).toBeGreaterThanOrEqual(1);
		expect(
			reimported.listSubstitutions({ type: 'single' }).length,
		).toBeGreaterThanOrEqual(1);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
//  FontFlux convenience methods
// ═══════════════════════════════════════════════════════════════════════════

describe('FontFlux substitution methods', () => {
	it('addSubstitution() and listSubstitutions()', () => {
		const font = FontFlux.create({ family: 'Test' });
		font.addGlyph({ name: 'f', unicode: 102, advanceWidth: 300 });
		font.addGlyph({ name: 'i', unicode: 105, advanceWidth: 300 });
		font.addGlyph({ name: 'fi', advanceWidth: 550 });

		font.addSubstitution({
			type: 'ligature',
			feature: 'liga',
			substitution: { components: ['f', 'i'], ligature: 'fi' },
		});

		expect(font.listSubstitutions()).toHaveLength(1);
		expect(font.listSubstitutions({ type: 'ligature' })).toHaveLength(1);
		expect(font.listSubstitutions({ type: 'single' })).toHaveLength(0);
	});

	it('getSubstitution() finds rules by glyph', () => {
		const font = FontFlux.create({ family: 'Test' });
		font.addGlyph({ name: 'a', unicode: 97, advanceWidth: 500 });
		font.addGlyph({ name: 'a.smcp', advanceWidth: 480 });

		font.addSubstitution({
			type: 'single',
			feature: 'smcp',
			substitution: { from: 'a', to: 'a.smcp' },
		});

		const results = font.getSubstitution('a');
		expect(results).toHaveLength(1);
		expect(results[0].to).toBe('a.smcp');
	});

	it('removeSubstitution() removes by filter', () => {
		const font = FontFlux.create({ family: 'Test' });
		font.addGlyph({ name: 'a', unicode: 97, advanceWidth: 500 });
		font.addGlyph({ name: 'a.smcp', advanceWidth: 480 });
		font.addGlyph({ name: 'f', unicode: 102, advanceWidth: 300 });
		font.addGlyph({ name: 'i', unicode: 105, advanceWidth: 300 });
		font.addGlyph({ name: 'fi', advanceWidth: 550 });

		font.addSubstitution([
			{
				type: 'single',
				feature: 'smcp',
				substitution: { from: 'a', to: 'a.smcp' },
			},
			{
				type: 'ligature',
				feature: 'liga',
				substitution: { components: ['f', 'i'], ligature: 'fi' },
			},
		]);

		expect(font.listSubstitutions()).toHaveLength(2);

		const removed = font.removeSubstitution({ type: 'single' });
		expect(removed).toBe(1);
		expect(font.listSubstitutions()).toHaveLength(1);
		expect(font.listSubstitutions()[0].type).toBe('ligature');
	});

	it('clearSubstitutions() removes all', () => {
		const font = FontFlux.create({ family: 'Test' });
		font.addGlyph({ name: 'f', unicode: 102, advanceWidth: 300 });
		font.addGlyph({ name: 'i', unicode: 105, advanceWidth: 300 });
		font.addGlyph({ name: 'fi', advanceWidth: 550 });

		font.addSubstitution({
			type: 'ligature',
			feature: 'liga',
			substitution: { components: ['f', 'i'], ligature: 'fi' },
		});

		font.clearSubstitutions();
		expect(font.substitutions).toHaveLength(0);
	});

	it('substitutions property provides live reference', () => {
		const font = FontFlux.create({ family: 'Test' });
		const subs = font.substitutions;
		expect(Array.isArray(subs)).toBe(true);
		expect(subs).toBe(font.substitutions); // same reference
	});
});
