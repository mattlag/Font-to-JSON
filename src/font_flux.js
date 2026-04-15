/**
 * Font Flux JS : FontFlux Class
 *
 * The v2 public API — a wrapper around the simplified font object that provides
 * a clean, discoverable interface for font manipulation.
 *
 * Design: Hybrid wrapper (Option C from architecture doc).
 * - Readable properties return live references (zero-friction reads).
 * - Mutations should go through methods for coordination and cleanup.
 * - Direct mutation of exposed properties also works — export always rebuilds.
 */

import { createColorGlyph, normalizePalette } from './color.js';
import { exportFont } from './export.js';
import { createGlyph, getGlyph, resolveGlyphId } from './glyph.js';
import { importFont } from './import.js';
import { fontFromJSON, fontToJSON } from './json.js';
import { createKerning, getKerningValue } from './kerning.js';
import {
	assembleCharString,
	compileCharString,
} from './otf/charstring_compiler.js';
import {
	disassembleCharString,
	interpretCharString,
} from './otf/charstring_interpreter.js';
import { createSubstitution, getSubstitutions } from './substitution.js';
import { contoursToSVGPath, svgPathToContours } from './svg_path.js';
import { diagnoseFont } from './validate/diagnoseFont.js';
import { validateJSON } from './validate/index.js';
import { initBrotli } from './woff/woff2.js';

// ============================================================================
//  NOTDEF GLYPH — minimal rectangle used by createFont
// ============================================================================

const DEFAULT_NOTDEF = {
	name: '.notdef',
	advanceWidth: 500,
	contours: [
		[
			{ x: 50, y: 0, onCurve: true },
			{ x: 50, y: 700, onCurve: true },
			{ x: 450, y: 700, onCurve: true },
			{ x: 450, y: 0, onCurve: true },
		],
	],
};

// ============================================================================
//  FONTFLUX CLASS
// ============================================================================

export class FontFlux {
	/**
	 * @private — use FontFlux.open(), FontFlux.create(), or FontFlux.fromJSON().
	 * @param {object} data - The internal simplified font data object.
	 */
	constructor(data) {
		/** @type {object} Internal simplified font data. */
		this._data = data;
	}

	// ========================================================================
	//  STATIC FACTORY METHODS
	// ========================================================================

	/**
	 * Create a new font from scratch (Scenario 2).
	 *
	 * Returns a FontFlux instance with .notdef and space glyphs, ready for
	 * addGlyph() calls and immediate export.
	 *
	 * @param {object} [options]
	 * @param {string} options.family - Font family name (required)
	 * @param {string} [options.style='Regular'] - Style name
	 * @param {number} [options.unitsPerEm=1000] - Units per em
	 * @param {number} [options.ascender=800] - Ascender
	 * @param {number} [options.descender=-200] - Descender
	 * @returns {FontFlux}
	 */
	static create(options = {}) {
		const {
			family = 'Untitled',
			style = 'Regular',
			unitsPerEm = 1000,
			ascender = 800,
			descender = -200,
		} = options;

		const data = {
			font: {
				familyName: family,
				styleName: style,
				unitsPerEm,
				ascender,
				descender,
				lineGap: 0,
			},
			glyphs: [
				{ ...DEFAULT_NOTDEF },
				{
					name: 'space',
					unicode: 32,
					advanceWidth: Math.round(unitsPerEm / 4),
				},
			],
			kerning: [],
			// Default gasp table: enable symmetric smoothing at all sizes.
			// Optimal for unhinted fonts — tells rasterizers to use anti-aliasing.
			gasp: [{ maxPPEM: 0xffff, behavior: 0x000a }],
		};

		return new FontFlux(data);
	}

	/**
	 * Open an existing font from binary data (Scenario 1).
	 *
	 * @param {ArrayBuffer} buffer - Binary font data (TTF/OTF/WOFF/WOFF2/TTC/OTC).
	 * @returns {FontFlux} Single-font instance. For collections, use openAll().
	 * @throws {Error} If buffer is a collection (TTC/OTC) — use openAll() instead.
	 */
	static open(buffer) {
		const result = importFont(buffer);

		// Collection check
		if (result.collection && result.fonts) {
			throw new Error(
				'FontFlux.open() received a font collection (TTC/OTC). ' +
					'Use FontFlux.openAll() for collections.',
			);
		}

		return new FontFlux(result);
	}

	/**
	 * Open all fonts from a binary file. Works for both single fonts and collections.
	 *
	 * @param {ArrayBuffer} buffer - Binary font data.
	 * @returns {FontFlux[]} Array of FontFlux instances (one per face).
	 */
	static openAll(buffer) {
		const result = importFont(buffer);

		if (result.collection && result.fonts) {
			return result.fonts.map((face) => new FontFlux(face));
		}

		return [new FontFlux(result)];
	}

	/**
	 * Restore a font from a JSON string.
	 *
	 * @param {string} jsonString - JSON produced by font.toJSON().
	 * @returns {FontFlux}
	 */
	static fromJSON(jsonString) {
		const data = fontFromJSON(jsonString);
		return new FontFlux(data);
	}

	/**
	 * Initialize WOFF2 support. Must be called (and awaited) once before
	 * opening or exporting WOFF2 files.
	 *
	 * @returns {Promise<void>}
	 */
	static async initWoff2() {
		return initBrotli();
	}

	/**
	 * Export a collection of FontFlux instances as a TTC/OTC file.
	 *
	 * @param {FontFlux[]} fonts - Array of FontFlux instances.
	 * @param {object} [options] - Export options.
	 * @param {string} [options.format='sfnt'] - Output format: 'sfnt', 'woff', 'woff2'.
	 * @returns {ArrayBuffer}
	 */
	static exportCollection(fonts, options = {}) {
		if (!Array.isArray(fonts) || fonts.length === 0) {
			throw new Error(
				'exportCollection requires a non-empty array of FontFlux instances',
			);
		}

		// Build a collection data structure that exportFont understands
		const collectionData = {
			collection: {
				tag: 'ttcf',
				majorVersion: 2,
				minorVersion: 0,
				numFonts: fonts.length,
			},
			fonts: fonts.map((f) => f._data),
		};

		return exportFont(collectionData, options);
	}

	// ========================================================================
	//  STATIC UTILITIES (font-independent)
	// ========================================================================

	/**
	 * Diagnose a binary font file and return a detailed report of problems.
	 *
	 * Unlike `FontFlux.open()` which throws on corruption, this method
	 * catches errors at each phase and continues, producing a comprehensive
	 * report that explains exactly what's wrong with the file.
	 *
	 * @param {ArrayBuffer} buffer - Raw font file bytes.
	 * @returns {object} Report: `{ valid, errors, warnings, infos, issues, summary }`.
	 */
	static diagnose(buffer) {
		return diagnoseFont(buffer);
	}

	/** Convert an SVG path `d` string to font contours. */
	static svgToContours(pathData, format) {
		return svgPathToContours(pathData, format);
	}

	/** Convert font contours to an SVG path `d` string. */
	static contoursToSVG(contours) {
		return contoursToSVGPath(contours);
	}

	/** Compile CFF contours to Type 2 charstring bytecode. */
	static compileCharString(contours) {
		return compileCharString(contours);
	}

	/** Assemble charstring assembly text to Type 2 bytecode. */
	static assembleCharString(text) {
		return assembleCharString(text);
	}

	/** Interpret Type 2 charstring bytecode to CFF contours. */
	static interpretCharString(bytes, globalSubrs, localSubrs) {
		return interpretCharString(bytes, globalSubrs, localSubrs);
	}

	/** Disassemble Type 2 charstring bytecode to assembly text. */
	static disassembleCharString(bytes) {
		return disassembleCharString(bytes);
	}

	// ========================================================================
	//  DIRECT DATA ACCESS (live references — zero friction reads)
	// ========================================================================

	/** Font metadata object. */
	get info() {
		return this._data.font;
	}

	/** Glyphs array. */
	get glyphs() {
		return this._data.glyphs;
	}

	/** Kerning pairs array. */
	get kerning() {
		if (!this._data.kerning) this._data.kerning = [];
		return this._data.kerning;
	}

	/** Variable font axes, or undefined. */
	get axes() {
		return this._data.axes;
	}

	/** Named instances, or undefined. */
	get instances() {
		return this._data.instances;
	}

	/** OpenType features { GPOS, GSUB, GDEF }, or undefined. */
	get features() {
		return this._data.features;
	}

	/** Original stored raw tables (Scenario 1 imports), or undefined. */
	get tables() {
		return this._data.tables;
	}

	/** Number of glyphs. */
	get glyphCount() {
		return this._data.glyphs.length;
	}

	/** Detected outline format: 'truetype', 'cff', or 'cff2'. */
	get format() {
		if (this._data._header?.sfVersion === 0x4f54544f) return 'cff';
		const glyphs = this._data.glyphs;
		if (glyphs.some((g) => g.charString)) return 'cff';
		return 'truetype';
	}

	// ========================================================================
	//  FONT INFO
	// ========================================================================

	/**
	 * Get font metadata as a plain object.
	 * @returns {object}
	 */
	getInfo() {
		return this._data.font;
	}

	/**
	 * Update font metadata by merging partial values.
	 * @param {object} partial - Fields to update (e.g. { familyName: 'New' }).
	 */
	setInfo(partial) {
		Object.assign(this._data.font, partial);
	}

	// ========================================================================
	//  GLYPHS
	// ========================================================================

	/**
	 * List all glyphs (lightweight summary).
	 * @returns {Array<{name: string, unicode: number|null, index: number}>}
	 */
	listGlyphs() {
		return this._data.glyphs.map((g, i) => ({
			name: g.name,
			unicode: g.unicode ?? null,
			index: i,
		}));
	}

	/**
	 * Get a glyph by name, Unicode code point, or hex string.
	 * Returns the live internal glyph object (direct mutation works).
	 *
	 * @param {string|number} id - Glyph name, code point, or hex string.
	 * @returns {object|undefined}
	 */
	getGlyph(id) {
		return getGlyph(this._data, id);
	}

	/**
	 * Check if a glyph exists.
	 * @param {string|number} id
	 * @returns {boolean}
	 */
	hasGlyph(id) {
		return getGlyph(this._data, id) !== undefined;
	}

	/**
	 * Add or replace a glyph. If raw options are provided (not a glyph object),
	 * they are passed through createGlyph() automatically.
	 *
	 * @param {object} glyphOrOptions - A glyph object or createGlyph() options.
	 */
	addGlyph(glyphOrOptions) {
		let glyph = glyphOrOptions;

		// Auto-wrap in createGlyph if it looks like raw options (has name + advanceWidth
		// but no charString/contours/components yet, OR has path which needs conversion)
		if (glyph.path || (glyph.name && glyph.advanceWidth && !glyph._created)) {
			glyph = createGlyph(glyph);
		}

		const glyphs = this._data.glyphs;

		// Check for existing glyph with same name — replace in place
		const existingIdx = glyphs.findIndex((g) => g.name === glyph.name);
		if (existingIdx >= 0) {
			glyphs[existingIdx] = glyph;
			return;
		}

		// Check for existing glyph with same unicode — replace in place
		if (glyph.unicode != null) {
			const byUnicode = glyphs.findIndex((g) => g.unicode === glyph.unicode);
			if (byUnicode >= 0) {
				glyphs[byUnicode] = glyph;
				return;
			}
		}

		// Append new glyph
		glyphs.push(glyph);
	}

	/**
	 * Remove a glyph by name, Unicode code point, or hex string.
	 * Also removes any kerning pairs referencing the removed glyph.
	 *
	 * @param {string|number} id
	 * @returns {boolean} True if a glyph was removed.
	 */
	removeGlyph(id) {
		const glyphs = this._data.glyphs;
		const glyph = getGlyph(this._data, id);
		if (!glyph) return false;

		const idx = glyphs.indexOf(glyph);
		if (idx < 0) return false;

		glyphs.splice(idx, 1);

		// Clean up kerning references
		if (this._data.kerning && glyph.name) {
			this._data.kerning = this._data.kerning.filter(
				(p) => p.left !== glyph.name && p.right !== glyph.name,
			);
		}

		return true;
	}

	// ========================================================================
	//  KERNING
	// ========================================================================

	/**
	 * Get the kerning value for a pair of glyphs.
	 *
	 * @param {string|number} left - Glyph name, code point, or hex string.
	 * @param {string|number} right - Glyph name, code point, or hex string.
	 * @returns {number|undefined}
	 */
	getKerning(left, right) {
		return getKerningValue(this._data, left, right);
	}

	/**
	 * Add kerning pairs. Accepts all createKerning() input formats.
	 * Duplicate pairs are resolved with last-write-wins.
	 *
	 * @param {object|object[]} pairsOrInput - Kerning data in any supported format.
	 */
	addKerning(pairsOrInput) {
		const newPairs = createKerning(pairsOrInput);
		if (!this._data.kerning) this._data.kerning = [];

		// Merge: for each new pair, replace existing or append
		for (const pair of newPairs) {
			const existing = this._data.kerning.findIndex(
				(p) => p.left === pair.left && p.right === pair.right,
			);
			if (existing >= 0) {
				this._data.kerning[existing] = pair;
			} else {
				this._data.kerning.push(pair);
			}
		}
	}

	/**
	 * Remove a specific kerning pair.
	 *
	 * @param {string|number} left
	 * @param {string|number} right
	 * @returns {boolean} True if a pair was removed.
	 */
	removeKerning(left, right) {
		if (!this._data.kerning) return false;
		const glyphs = this._data.glyphs;
		const leftName = resolveGlyphId(glyphs, left);
		const rightName = resolveGlyphId(glyphs, right);
		if (!leftName || !rightName) return false;

		const idx = this._data.kerning.findIndex(
			(p) => p.left === leftName && p.right === rightName,
		);
		if (idx < 0) return false;
		this._data.kerning.splice(idx, 1);
		return true;
	}

	/**
	 * List all kerning pairs.
	 * @returns {Array<{left: string, right: string, value: number}>}
	 */
	listKerning() {
		return this._data.kerning || [];
	}

	/**
	 * Remove all kerning.
	 */
	clearKerning() {
		this._data.kerning = [];
	}

	// ========================================================================
	//  GSUB SUBSTITUTIONS
	// ========================================================================

	/**
	 * Live reference to substitution rules.
	 * @returns {Array<object>}
	 */
	get substitutions() {
		if (!this._data.substitutions) this._data.substitutions = [];
		return this._data.substitutions;
	}

	/**
	 * List all substitution rules.
	 * @param {object} [filter] - Optional { type?, feature? } filter.
	 * @returns {Array<object>}
	 */
	listSubstitutions(filter) {
		const subs = this._data.substitutions || [];
		if (!filter) return subs;
		return subs.filter((rule) => {
			if (filter.type && rule.type !== filter.type) return false;
			if (filter.feature && rule.feature !== filter.feature) return false;
			return true;
		});
	}

	/**
	 * Find substitution rules for a specific glyph.
	 *
	 * @param {string|number} glyphId - Glyph name, code point, or hex string.
	 * @param {object} [options] - { type?, feature? }
	 * @returns {Array<object>}
	 */
	getSubstitution(glyphId, options) {
		return getSubstitutions(this._data, glyphId, options);
	}

	/**
	 * Add substitution rules. Accepts the same flexible formats as
	 * createSubstitution(): single rules, arrays, class-based, etc.
	 *
	 * @param {object|object[]} rulesOrInput - Substitution rule(s).
	 */
	addSubstitution(rulesOrInput) {
		const newRules = createSubstitution(rulesOrInput);
		if (!this._data.substitutions) this._data.substitutions = [];

		for (const rule of newRules) {
			this._data.substitutions.push(rule);
		}
	}

	/**
	 * Remove substitution rules matching a filter.
	 *
	 * @param {object} filter - { type?, feature?, from?, ligature? }
	 * @returns {number} Number of rules removed.
	 */
	removeSubstitution(filter) {
		if (!this._data.substitutions) return 0;
		const before = this._data.substitutions.length;
		this._data.substitutions = this._data.substitutions.filter((rule) => {
			if (filter.type && rule.type !== filter.type) return true;
			if (filter.feature && rule.feature !== filter.feature) return true;
			if (filter.from && rule.from !== filter.from) return true;
			if (filter.ligature && rule.ligature !== filter.ligature) return true;
			return false;
		});
		return before - this._data.substitutions.length;
	}

	/**
	 * Remove all substitution rules.
	 */
	clearSubstitutions() {
		this._data.substitutions = [];
	}

	// ========================================================================
	//  VARIABLE FONT AXES
	// ========================================================================

	/**
	 * List variable font axes.
	 * @returns {Array<{tag: string, name: string, min: number, default: number, max: number}>}
	 */
	listAxes() {
		return this._data.axes || [];
	}

	/**
	 * Get a specific axis by tag.
	 * @param {string} tag - 4-character axis tag (e.g. 'wght', 'wdth').
	 * @returns {object|undefined}
	 */
	getAxis(tag) {
		return this._data.axes?.find((a) => a.tag === tag);
	}

	/**
	 * Add a new variable font axis.
	 * @param {object} axis - { tag, name, min, default, max, hidden? }
	 */
	addAxis(axis) {
		if (!this._data.axes) this._data.axes = [];
		const existing = this._data.axes.findIndex((a) => a.tag === axis.tag);
		if (existing >= 0) {
			this._data.axes[existing] = axis;
		} else {
			this._data.axes.push(axis);
		}
	}

	/**
	 * Remove an axis by tag. Also removes instances referencing it.
	 * @param {string} tag
	 * @returns {boolean}
	 */
	removeAxis(tag) {
		if (!this._data.axes) return false;
		const idx = this._data.axes.findIndex((a) => a.tag === tag);
		if (idx < 0) return false;
		this._data.axes.splice(idx, 1);

		// Clean up instances referencing this axis
		if (this._data.instances) {
			this._data.instances = this._data.instances.filter(
				(inst) => !inst.coordinates || !(tag in inst.coordinates),
			);
		}

		// Remove axes array entirely if empty
		if (this._data.axes.length === 0) {
			delete this._data.axes;
			delete this._data.instances;
		}
		return true;
	}

	/**
	 * Update an axis's properties.
	 * @param {string} tag
	 * @param {object} partial - Fields to update.
	 * @returns {boolean}
	 */
	setAxis(tag, partial) {
		const axis = this._data.axes?.find((a) => a.tag === tag);
		if (!axis) return false;
		Object.assign(axis, partial);
		return true;
	}

	// ========================================================================
	//  NAMED INSTANCES
	// ========================================================================

	/**
	 * List named instances.
	 * @returns {Array<{name: string, coordinates: object}>}
	 */
	listInstances() {
		return this._data.instances || [];
	}

	/**
	 * Add a named instance.
	 * @param {object} instance - { name, coordinates: { wght: 700, ... } }
	 */
	addInstance(instance) {
		if (!this._data.instances) this._data.instances = [];
		const existing = this._data.instances.findIndex(
			(i) => i.name === instance.name,
		);
		if (existing >= 0) {
			this._data.instances[existing] = instance;
		} else {
			this._data.instances.push(instance);
		}
	}

	/**
	 * Remove a named instance by name.
	 * @param {string} name
	 * @returns {boolean}
	 */
	removeInstance(name) {
		if (!this._data.instances) return false;
		const idx = this._data.instances.findIndex((i) => i.name === name);
		if (idx < 0) return false;
		this._data.instances.splice(idx, 1);
		return true;
	}

	// ========================================================================
	//  COLOR FONTS (PALETTES + COLOR GLYPHS)
	// ========================================================================

	/**
	 * Live reference to palettes array.
	 * Each palette is an array of hex color strings (#RRGGBB or #RRGGBBAA).
	 * @returns {string[][]}
	 */
	get palettes() {
		if (!this._data.palettes) this._data.palettes = [];
		return this._data.palettes;
	}

	/**
	 * Get a palette by index.
	 * @param {number} index - Palette index.
	 * @returns {string[]|undefined} Array of hex strings, or undefined.
	 */
	getPalette(index) {
		return this._data.palettes?.[index];
	}

	/**
	 * Add a palette.
	 *
	 * @param {Array<string|object>} colors - Array of hex strings or BGRA objects.
	 * @returns {number} The index of the added palette.
	 */
	addPalette(colors) {
		if (!this._data.palettes) this._data.palettes = [];
		const normalized = normalizePalette(colors);
		this._data.palettes.push(normalized);
		return this._data.palettes.length - 1;
	}

	/**
	 * Remove a palette by index.
	 * @param {number} index
	 * @returns {boolean} True if a palette was removed.
	 */
	removePalette(index) {
		if (
			!this._data.palettes ||
			index < 0 ||
			index >= this._data.palettes.length
		) {
			return false;
		}
		this._data.palettes.splice(index, 1);
		if (this._data.palettes.length === 0) {
			delete this._data.palettes;
		}
		return true;
	}

	/**
	 * Update a single color in a palette.
	 * @param {number} paletteIndex
	 * @param {number} colorIndex
	 * @param {string} hex - Hex color string.
	 */
	setPaletteColor(paletteIndex, colorIndex, hex) {
		const palette = this._data.palettes?.[paletteIndex];
		if (!palette) {
			throw new Error(`Palette ${paletteIndex} does not exist`);
		}
		if (colorIndex < 0 || colorIndex >= palette.length) {
			throw new Error(`Color index ${colorIndex} out of range`);
		}
		// Validate the hex string
		const validated = normalizePalette([hex]);
		palette[colorIndex] = validated[0];
	}

	/**
	 * Live reference to color glyphs array.
	 * @returns {object[]}
	 */
	get colorGlyphs() {
		if (!this._data.colorGlyphs) this._data.colorGlyphs = [];
		return this._data.colorGlyphs;
	}

	/**
	 * Get color data for a glyph by name, code point, or hex string.
	 * @param {string|number} id
	 * @returns {object|undefined} The color glyph object, or undefined.
	 */
	getColorGlyph(id) {
		const name = resolveGlyphId(this._data.glyphs, id);
		if (!name) return undefined;
		return this._data.colorGlyphs?.find((cg) => cg.name === name);
	}

	/**
	 * Add color data for a glyph. Replaces existing color data for the same glyph.
	 *
	 * @param {object} input - Color glyph data with `name` and either `layers` or `paint`.
	 */
	addColorGlyph(input) {
		const cg = createColorGlyph(input);
		if (!this._data.colorGlyphs) this._data.colorGlyphs = [];

		const existingIdx = this._data.colorGlyphs.findIndex(
			(c) => c.name === cg.name,
		);
		if (existingIdx >= 0) {
			this._data.colorGlyphs[existingIdx] = cg;
		} else {
			this._data.colorGlyphs.push(cg);
		}
	}

	/**
	 * Remove color data for a glyph.
	 * @param {string|number} id - Glyph name, code point, or hex string.
	 * @returns {boolean} True if color data was removed.
	 */
	removeColorGlyph(id) {
		if (!this._data.colorGlyphs) return false;
		const name = resolveGlyphId(this._data.glyphs, id);
		if (!name) return false;
		const idx = this._data.colorGlyphs.findIndex((cg) => cg.name === name);
		if (idx < 0) return false;
		this._data.colorGlyphs.splice(idx, 1);
		if (this._data.colorGlyphs.length === 0) {
			delete this._data.colorGlyphs;
		}
		return true;
	}

	/**
	 * List all glyphs that have color data.
	 * @returns {Array<{name: string, type: string}>}
	 */
	listColorGlyphs() {
		return (this._data.colorGlyphs || []).map((cg) => ({
			name: cg.name,
			type: cg.layers ? 'layers' : 'paint',
		}));
	}

	// ========================================================================
	//  FEATURES & HINTING
	// ========================================================================

	/**
	 * Get OpenType features (GPOS, GSUB, GDEF) as raw parsed objects.
	 * @returns {object}
	 */
	getFeatures() {
		return this._data.features || {};
	}

	/**
	 * Replace or update feature tables.
	 * @param {object} partial - { GPOS?, GSUB?, GDEF? }
	 */
	setFeatures(partial) {
		if (!this._data.features) this._data.features = {};
		Object.assign(this._data.features, partial);
	}

	/**
	 * Get TrueType hinting tables.
	 * @returns {object} { gasp?, cvt?, fpgm?, prep? }
	 */
	getHinting() {
		return {
			gasp: this._data.gasp,
			cvt: this._data.cvt,
			fpgm: this._data.fpgm,
			prep: this._data.prep,
		};
	}

	/**
	 * Update TrueType hinting tables.
	 * @param {object} partial - { gasp?, cvt?, fpgm?, prep? }
	 */
	setHinting(partial) {
		if (partial.gasp !== undefined) this._data.gasp = partial.gasp;
		if (partial.cvt !== undefined) this._data.cvt = partial.cvt;
		if (partial.fpgm !== undefined) this._data.fpgm = partial.fpgm;
		if (partial.prep !== undefined) this._data.prep = partial.prep;
	}

	// ========================================================================
	//  EXPORT & SERIALIZATION
	// ========================================================================

	/**
	 * Export the font to binary data.
	 *
	 * @param {object} [options]
	 * @param {string} [options.format] - 'sfnt', 'woff', or 'woff2'.
	 * @returns {ArrayBuffer}
	 */
	export(options) {
		return exportFont(this._data, options);
	}

	/**
	 * Serialize the font to a JSON string.
	 *
	 * @param {number} [indent=2] - Indentation level.
	 * @returns {string}
	 */
	toJSON(indent) {
		return fontToJSON(this._data, indent);
	}

	/**
	 * Validate the font data.
	 *
	 * @returns {object} { valid, errors, warnings, infos }
	 */
	validate() {
		return validateJSON(this._data);
	}

	/**
	 * Strip stored tables and header, converting to a pure hand-authored shape.
	 * Non-decomposed tables (COLR, gvar, bitmap data, etc.) are lost.
	 *
	 * @returns {FontFlux} Returns `this` for chaining.
	 */
	detach() {
		delete this._data._header;
		delete this._data.tables;
		delete this._data._woff;
		return this;
	}
}
