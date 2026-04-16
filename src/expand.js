/**
 * Font Flux JS : Expand
 * Builds a `raw` font object from a `simplified` schema object.
 *
 * This is the reverse of simplify.js — it takes the human-friendly format
 * and produces the table-by-table structure that export.js can encode to binary.
 */

import {
	buildNameToGlyphIdMap,
	hexToBGRA,
	resolvePaintGlyphNames,
} from './color.js';
import { resolveGlyphId } from './glyph.js';
import { compileCharString } from './otf/charstring_compiler.js';
import { isoToLongdatetime, MVAR_NAME_TAGS } from './simplify.js';

// ===========================================================================
//  MAIN ENTRY
// ===========================================================================

/**
 * Build a raw font data object from a simplified representation.
 * The returned object has the shape { header, tables } expected by exportFont.
 *
 * @param {object} simplified
 * @returns {{ header: object, tables: object }}
 */
export function buildRawFromSimplified(simplified) {
	const { font, glyphs } = simplified;

	// Determine outline format: CFF if any glyph has charString, else TrueType
	const isCFF = glyphs.some((g) => g.charString);

	const metrics = computeGlyphMetrics(glyphs, font);
	const tables = {};

	// == Required tables ==============================================
	tables.head = buildHeadTable(font, metrics);
	tables.hhea = buildHheaTable(font, metrics, glyphs.length);
	tables.maxp = buildMaxpTable(glyphs, isCFF);
	tables['OS/2'] = buildOS2Table(font, metrics);
	tables.name = buildNameTable(font);
	tables.post = buildPostTable(font, glyphs);
	tables.cmap = buildCmapTable(glyphs);
	tables.hmtx = buildHmtxTable(glyphs);

	// == Outline tables ===============================================
	if (isCFF) {
		tables['CFF '] = buildCFFShell(font, glyphs);
	} else {
		tables.glyf = buildGlyfTable(glyphs);
		tables.loca = { offsets: [] }; // placeholder — coordinated by export.js
	}

	// == Vertical metrics (only when glyphs carry vertical data) ======
	const hasVerticalMetrics = glyphs.some((g) => g.advanceHeight !== undefined);
	if (hasVerticalMetrics) {
		tables.vhea = buildVheaTable(glyphs);
		tables.vmtx = buildVmtxTable(glyphs);
	}

	// == Optional kerning =============================================
	const kerningFormat = simplified._options?.kerningFormat || 'gpos';
	if (simplified.kerning && simplified.kerning.length > 0) {
		const wantGpos = kerningFormat === 'gpos' || kerningFormat === 'gpos+kern';
		const wantKern = kerningFormat !== 'gpos';

		if (wantGpos) {
			// Build or merge GPOS kerning
			const existingGPOS = simplified.features?.GPOS;
			if (existingGPOS) {
				tables.GPOS = mergeKerningIntoGPOS(
					existingGPOS,
					simplified.kerning,
					glyphs,
				);
			} else {
				tables.GPOS = buildGPOSFromKerning(simplified.kerning, glyphs);
			}
		}

		if (wantKern) {
			const kernTable = buildKernTableForFormat(
				simplified.kerning,
				glyphs,
				kerningFormat,
			);
			if (kernTable) tables.kern = kernTable;
		}
	}

	// == Variable font ================================================
	if (simplified.axes && simplified.axes.length > 0) {
		tables.fvar = buildFvarTable(simplified, tables.name);

		// avar from axisMapping (if provided)
		if (simplified.axisMapping) {
			tables.avar = buildAvarTable(simplified);
		}

		// STAT from axisStyles (if provided), else auto-generate
		if (simplified.axisStyles) {
			tables.STAT = buildSTATFromAxisStyles(simplified, tables.name);
		} else if (!simplified.tables?.STAT) {
			tables.STAT = buildSTATTable(simplified, tables.name);
		}

		// MVAR from metricVariations (if provided)
		if (simplified.metricVariations) {
			tables.MVAR = buildMVARTable(simplified);
		}
	}

	// == Hinting ======================================================
	if (simplified.gasp) {
		tables.gasp = {
			version: 1,
			gaspRanges: simplified.gasp.map((g) => ({
				rangeMaxPPEM: g.maxPPEM,
				rangeGaspBehavior: g.behavior,
			})),
		};
	}
	if (simplified.cvt) {
		tables['cvt '] = { values: simplified.cvt };
	}
	if (simplified.fpgm) {
		tables.fpgm = { instructions: simplified.fpgm };
	}
	if (simplified.prep) {
		tables.prep = { instructions: simplified.prep };
	}

	// -- OpenType layout features (passthrough) -----------------------
	if (simplified.features) {
		if (simplified.features.GPOS && !tables.GPOS)
			tables.GPOS = simplified.features.GPOS;
		if (simplified.features.GDEF) tables.GDEF = simplified.features.GDEF;
	}

	// -- GSUB from simplified substitutions ---------------------------
	if (simplified.substitutions && simplified.substitutions.length > 0) {
		tables.GSUB = buildGSUBFromSubstitutions(
			simplified.substitutions,
			simplified._rawGSUBLookups || [],
			glyphs,
		);
	} else if (
		simplified._rawGSUBLookups &&
		simplified._rawGSUBLookups.length > 0
	) {
		// Only raw lookups, no simplified substitutions — rebuild minimal GSUB
		tables.GSUB = buildGSUBFromRawLookups(simplified._rawGSUBLookups);
	}

	// Legacy: if features.GSUB is set directly (e.g. setFeatures), use it
	if (simplified.features?.GSUB && !tables.GSUB) {
		tables.GSUB = simplified.features.GSUB;
	}

	// -- Color font tables (CPAL + COLR from simplified) ----------------
	if (simplified.palettes && simplified.palettes.length > 0) {
		tables.CPAL = buildCPALFromPalettes(simplified.palettes);
	}
	if (simplified.colorGlyphs && simplified.colorGlyphs.length > 0) {
		tables.COLR = buildCOLRFromColorGlyphs(simplified.colorGlyphs, glyphs);
	}

	// -- Passthrough tables (carried from import, not decomposed) -----
	if (simplified.tables) {
		for (const [tag, tableData] of Object.entries(simplified.tables)) {
			if (!tables[tag]) {
				tables[tag] = tableData;
			}
		}
	}

	// == SFNT header ==================================================
	// Prefer the original header if available (lossless round-trip),
	// otherwise compute one.
	let header;
	if (simplified._header) {
		header = { ...simplified._header, numTables: Object.keys(tables).length };
	} else {
		const numTables = Object.keys(tables).length;
		const entrySelector = Math.floor(Math.log2(numTables));
		const searchRange = Math.pow(2, entrySelector) * 16;
		const rangeShift = numTables * 16 - searchRange;

		header = {
			sfVersion: isCFF ? 0x4f54544f : 0x00010000,
			numTables,
			searchRange,
			entrySelector,
			rangeShift,
		};
	}

	return { header, tables };
}

// ===========================================================================
//  GLYPH METRICS AGGREGATION
// ===========================================================================

/**
 * Compute aggregate metrics from all glyphs.
 */
function computeGlyphMetrics(glyphs, font) {
	let xMin = Infinity,
		yMin = Infinity,
		xMax = -Infinity,
		yMax = -Infinity;
	let advanceWidthMax = 0;
	let advanceWidthSum = 0;
	let minLSB = Infinity;
	let minRSB = Infinity;
	let maxExtent = -Infinity;
	let firstCharIndex = 0xffff;
	let lastCharIndex = 0;
	const unicodeRanges = new Set();

	for (const glyph of glyphs) {
		const aw = glyph.advanceWidth || 0;
		advanceWidthSum += aw;
		if (aw > advanceWidthMax) advanceWidthMax = aw;

		const bbox = getGlyphBBox(glyph);

		if (bbox) {
			if (bbox.xMin < xMin) xMin = bbox.xMin;
			if (bbox.yMin < yMin) yMin = bbox.yMin;
			if (bbox.xMax > xMax) xMax = bbox.xMax;
			if (bbox.yMax > yMax) yMax = bbox.yMax;

			const lsb = glyph.leftSideBearing ?? bbox.xMin;
			const rsb = aw - (lsb + (bbox.xMax - bbox.xMin));
			const extent = lsb + (bbox.xMax - bbox.xMin);

			if (lsb < minLSB) minLSB = lsb;
			if (rsb < minRSB) minRSB = rsb;
			if (extent > maxExtent) maxExtent = extent;
		}

		// Unicode tracking
		const codes = glyph.unicodes || (glyph.unicode ? [glyph.unicode] : []);
		for (const code of codes) {
			if (code < firstCharIndex) firstCharIndex = code;
			if (code > lastCharIndex) lastCharIndex = code;
			unicodeRanges.add(code);
		}
	}

	// Clamp to safe values if no glyphs had outlines
	if (xMin === Infinity) xMin = 0;
	if (yMin === Infinity) yMin = 0;
	if (xMax === -Infinity) xMax = 0;
	if (yMax === -Infinity) yMax = 0;
	if (minLSB === Infinity) minLSB = 0;
	if (minRSB === Infinity) minRSB = 0;
	if (maxExtent === -Infinity) maxExtent = 0;
	if (firstCharIndex === 0xffff) firstCharIndex = 0;
	if (lastCharIndex === 0) lastCharIndex = 0;

	// Estimate sxHeight and sCapHeight
	const sxHeight = estimateMetricForChars(
		glyphs,
		'xyvw',
		font.ascender ? Math.round(font.ascender / 2) : 0,
	);
	const sCapHeight = estimateMetricForChars(
		glyphs,
		'HIKLEFJMNTZBDPRAGOQSUVWXY',
		yMax,
	);

	return {
		xMin,
		yMin,
		xMax,
		yMax,
		advanceWidthMax,
		advanceWidthAvg:
			glyphs.length > 0 ? Math.round(advanceWidthSum / glyphs.length) : 0,
		minLSB,
		minRSB,
		maxExtent,
		firstCharIndex: Math.min(firstCharIndex, 0xffff),
		lastCharIndex: Math.min(lastCharIndex, 0xffff),
		sxHeight,
		sCapHeight,
		unicodeRanges,
	};
}

/**
 * Get bounding box from a glyph's contour data.
 */
function getGlyphBBox(glyph) {
	if (glyph.contours && glyph.contours.length > 0) {
		let xMin = Infinity,
			yMin = Infinity,
			xMax = -Infinity,
			yMax = -Infinity;
		let hasPoints = false;
		for (const contour of glyph.contours) {
			for (const pt of contour) {
				// Collect all numeric coordinate fields (x, y, x1, y1, x2, y2)
				const coords = [
					[pt.x, pt.y],
					[pt.x1, pt.y1],
					[pt.x2, pt.y2],
				];
				for (const [cx, cy] of coords) {
					if (typeof cx === 'number' && typeof cy === 'number') {
						hasPoints = true;
						if (cx < xMin) xMin = cx;
						if (cy < yMin) yMin = cy;
						if (cx > xMax) xMax = cx;
						if (cy > yMax) yMax = cy;
					}
				}
			}
		}
		if (hasPoints) return { xMin, yMin, xMax, yMax };
	}
	// Components and CFF: can't easily compute bbox here,
	// return null (the export pipeline handles it)
	return null;
}

/**
 * Estimate a vertical metric by looking for specific characters in the glyph set.
 */
function estimateMetricForChars(glyphs, chars, fallback) {
	for (const ch of chars) {
		const code = ch.charCodeAt(0);
		const glyph = glyphs.find((g) => {
			const codes = g.unicodes || (g.unicode ? [g.unicode] : []);
			return codes.includes(code);
		});
		if (glyph) {
			const bbox = getGlyphBBox(glyph);
			if (bbox) return bbox.yMax;
		}
	}
	return fallback || 0;
}

/**
 * Compute Unicode range bits (ulUnicodeRange1-4) from a set of codepoints.
 * Simplified — covers major ranges.
 */
function computeUnicodeRangeBits(unicodeSet) {
	const ranges = [0, 0, 0, 0];

	// Each bit in ulUnicodeRange1-4 corresponds to a Unicode block.
	// This is a simplified implementation covering common ranges.
	const RANGE_MAP = [
		// [bitPosition (0-127), rangeStart, rangeEnd]
		[0, 0x0020, 0x007e], // Basic Latin
		[1, 0x0080, 0x00ff], // Latin-1 Supplement
		[2, 0x0100, 0x017f], // Latin Extended-A
		[3, 0x0180, 0x024f], // Latin Extended-B
		[7, 0x0370, 0x03ff], // Greek
		[9, 0x0400, 0x04ff], // Cyrillic
		[10, 0x0530, 0x058f], // Armenian
		[11, 0x0590, 0x05ff], // Hebrew
		[13, 0x0600, 0x06ff], // Arabic
		[24, 0x0e00, 0x0e7f], // Thai
		[28, 0x1100, 0x11ff], // Hangul Jamo
		[30, 0x1e00, 0x1eff], // Latin Extended Additional
		[31, 0x1f00, 0x1fff], // Greek Extended
		[32, 0x2000, 0x206f], // General Punctuation
		[33, 0x2070, 0x209f], // Superscripts and Subscripts
		[34, 0x20a0, 0x20cf], // Currency Symbols
		[35, 0x20d0, 0x20ff], // Combining Diacritical Marks for Symbols
		[36, 0x2100, 0x214f], // Letterlike Symbols
		[37, 0x2150, 0x218f], // Number Forms
		[38, 0x2190, 0x21ff], // Arrows
		[39, 0x2200, 0x22ff], // Mathematical Operators
		[40, 0x2300, 0x23ff], // Miscellaneous Technical
		[42, 0x2500, 0x257f], // Box Drawing
		[43, 0x2580, 0x259f], // Block Elements
		[44, 0x25a0, 0x25ff], // Geometric Shapes
		[45, 0x2600, 0x26ff], // Miscellaneous Symbols
		[46, 0x2700, 0x27bf], // Dingbats
		[48, 0x3000, 0x303f], // CJK Symbols and Punctuation
		[49, 0x3040, 0x309f], // Hiragana
		[50, 0x30a0, 0x30ff], // Katakana
		[52, 0x3100, 0x312f], // Bopomofo
		[56, 0xac00, 0xd7af], // Hangul Syllables
		[57, 0xd800, 0xdfff], // Surrogates (should not appear)
		[59, 0x4e00, 0x9fff], // CJK Unified Ideographs
		[60, 0xe000, 0xf8ff], // Private Use Area
		[62, 0xfe20, 0xfe2f], // Combining Half Marks
		[69, 0xfb50, 0xfdff], // Arabic Presentation Forms-A
		[70, 0xfe70, 0xfeff], // Arabic Presentation Forms-B
		[78, 0xff00, 0xffef], // Halfwidth and Fullwidth Forms
	];

	for (const [bit, start, end] of RANGE_MAP) {
		for (const cp of unicodeSet) {
			if (cp >= start && cp <= end) {
				const word = Math.floor(bit / 32);
				ranges[word] |= 1 << (bit % 32);
				break;
			}
		}
	}

	return ranges;
}

// ===========================================================================
//  TABLE BUILDERS
// ===========================================================================

/**
 * Build the head table from simplified font info and computed metrics.
 */
function buildHeadTable(font, metrics) {
	const isBold = (font.weightClass || 400) >= 700;
	const isItalic = (font.italicAngle || 0) !== 0;
	let macStyle = 0;
	if (isBold) macStyle |= 1;
	if (isItalic) macStyle |= 2;

	return {
		majorVersion: 1,
		minorVersion: 0,
		fontRevision: 1.0,
		checksumAdjustment: 0, // will be overwritten by export
		magicNumber: 0x5f0f3cf5,
		flags: 0x000b, // baseline at y=0, lsb at x=0, instructions may alter advance
		unitsPerEm: font.unitsPerEm,
		created: isoToLongdatetime(font.created),
		modified: isoToLongdatetime(font.modified),
		xMin: metrics.xMin,
		yMin: metrics.yMin,
		xMax: metrics.xMax,
		yMax: metrics.yMax,
		macStyle,
		lowestRecPPEM: 8,
		fontDirectionHint: 2,
		indexToLocFormat: 0, // coordinated by export.js for glyf/loca
		glyphDataFormat: 0,
	};
}

/**
 * Build the hhea table.
 */
function buildHheaTable(font, metrics, numGlyphs) {
	return {
		majorVersion: 1,
		minorVersion: 0,
		ascender: font.ascender || 0,
		descender: font.descender || 0,
		lineGap: font.lineGap || 0,
		advanceWidthMax: metrics.advanceWidthMax,
		minLeftSideBearing: metrics.minLSB,
		minRightSideBearing: metrics.minRSB,
		xMaxExtent: metrics.maxExtent,
		caretSlopeRise: 1,
		caretSlopeRun: 0,
		caretOffset: 0,
		reserved1: 0,
		reserved2: 0,
		reserved3: 0,
		reserved4: 0,
		metricDataFormat: 0,
		numberOfHMetrics: numGlyphs,
	};
}

/**
 * Build the maxp table.
 */
function buildMaxpTable(glyphs, isCFF) {
	if (isCFF) {
		return {
			version: 0x00005000,
			numGlyphs: glyphs.length,
		};
	}

	// TrueType: compute maxPoints, maxContours, etc.
	let maxPoints = 0;
	let maxContours = 0;
	let maxCompositePoints = 0;
	let maxCompositeContours = 0;
	let maxComponentElements = 0;
	let maxComponentDepth = 0;
	let maxSizeOfInstructions = 0;

	for (const glyph of glyphs) {
		if (glyph.contours) {
			let points = 0;
			for (const contour of glyph.contours) {
				points += contour.length;
			}
			if (points > maxPoints) maxPoints = points;
			if (glyph.contours.length > maxContours)
				maxContours = glyph.contours.length;
		}
		if (glyph.components) {
			if (glyph.components.length > maxComponentElements)
				maxComponentElements = glyph.components.length;
			if (1 > maxComponentDepth) maxComponentDepth = 1;
		}
		if (
			glyph.instructions &&
			glyph.instructions.length > maxSizeOfInstructions
		) {
			maxSizeOfInstructions = glyph.instructions.length;
		}
	}

	return {
		version: 0x00010000,
		numGlyphs: glyphs.length,
		maxPoints,
		maxContours,
		maxCompositePoints,
		maxCompositeContours,
		maxZones: 2,
		maxTwilightPoints: 0,
		maxStorage: 0,
		maxFunctionDefs: 0,
		maxInstructionDefs: 0,
		maxStackElements: 0,
		maxSizeOfInstructions,
		maxComponentElements,
		maxComponentDepth,
	};
}

/**
 * Build the OS/2 table.
 */
function buildOS2Table(font, metrics) {
	const isBold = (font.weightClass || 400) >= 700;
	const isItalic = (font.italicAngle || 0) !== 0;

	let fsSelection = font.fsSelection;
	if (fsSelection === undefined) {
		fsSelection = 0;
		if (isBold) fsSelection |= 0x0020; // BOLD
		if (isItalic) fsSelection |= 0x0001; // ITALIC
		if (!isBold && !isItalic) fsSelection |= 0x0040; // REGULAR
		fsSelection |= 0x0080; // USE_TYPO_METRICS — recommended by the OpenType spec
	}

	const unicodeBits = computeUnicodeRangeBits(metrics.unicodeRanges);

	// Check if space glyph exists
	const hasSpace = metrics.unicodeRanges.has(32);

	return {
		version: 4,
		xAvgCharWidth: metrics.advanceWidthAvg,
		usWeightClass: font.weightClass || 400,
		usWidthClass: font.widthClass || 5,
		fsType: font.fsType || 0,
		ySubscriptXSize: Math.round((font.unitsPerEm || 1000) * 0.65),
		ySubscriptYSize: Math.round((font.unitsPerEm || 1000) * 0.6),
		ySubscriptXOffset: 0,
		ySubscriptYOffset: Math.round((font.unitsPerEm || 1000) * 0.075),
		ySuperscriptXSize: Math.round((font.unitsPerEm || 1000) * 0.65),
		ySuperscriptYSize: Math.round((font.unitsPerEm || 1000) * 0.6),
		ySuperscriptXOffset: 0,
		ySuperscriptYOffset: Math.round((font.unitsPerEm || 1000) * 0.35),
		yStrikeoutSize: Math.round((font.unitsPerEm || 1000) * 0.05),
		yStrikeoutPosition: Math.round((font.unitsPerEm || 1000) * 0.3),
		sFamilyClass: 0,
		panose: font.panose || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		ulUnicodeRange1: unicodeBits[0],
		ulUnicodeRange2: unicodeBits[1],
		ulUnicodeRange3: unicodeBits[2],
		ulUnicodeRange4: unicodeBits[3],
		achVendID: font.achVendID || 'XXXX',
		fsSelection,
		usFirstCharIndex: metrics.firstCharIndex,
		usLastCharIndex: metrics.lastCharIndex,
		sTypoAscender: font.ascender || 0,
		sTypoDescender: font.descender || 0,
		sTypoLineGap: font.lineGap || 0,
		usWinAscent: metrics.yMax > 0 ? metrics.yMax : font.ascender || 0,
		usWinDescent: metrics.yMin < 0 ? Math.abs(metrics.yMin) : 0,
		ulCodePageRange1: 1,
		ulCodePageRange2: 0,
		sxHeight: metrics.sxHeight,
		sCapHeight: metrics.sCapHeight,
		usDefaultChar: hasSpace ? 32 : 0,
		usBreakChar: hasSpace ? 32 : 0,
		usMaxContext: 0,
	};
}

/**
 * Build name table with multi-platform records.
 */
function buildNameTable(font) {
	const names = [];

	// Name ID mapping
	const entries = {
		0: font.copyright || '',
		1: font.familyName || '',
		2: font.styleName || '',
		3: font.uniqueID || buildUniqueID(font),
		4:
			font.fullName ||
			`${font.familyName || ''} ${font.styleName || ''}`.trim(),
		5: font.version || 'Version 1.000',
		6: font.postScriptName || buildPostScriptName(font),
		7: font.trademark || '',
		8: font.manufacturer || '',
		9: font.designer || '',
		10: font.description || '',
		11: font.vendorURL || '',
		12: font.designerURL || '',
		13: font.license || '',
		14: font.licenseURL || '',
		19: font.sampleText || '',
	};

	for (const [nameIDStr, value] of Object.entries(entries)) {
		const nameID = Number(nameIDStr);
		if (!value) continue;

		// Windows (platformID 3, encodingID 1, languageID 0x0409)
		names.push({
			platformID: 3,
			encodingID: 1,
			languageID: 0x0409,
			nameID,
			value,
		});

		// Macintosh (platformID 1, encodingID 0, languageID 0)
		names.push({
			platformID: 1,
			encodingID: 0,
			languageID: 0,
			nameID,
			value,
		});

		// Unicode (platformID 0, encodingID 3, languageID 0)
		names.push({
			platformID: 0,
			encodingID: 3,
			languageID: 0,
			nameID,
			value,
		});
	}

	return { version: 0, names };
}

function buildUniqueID(font) {
	const fullName =
		font.fullName || `${font.familyName || ''} ${font.styleName || ''}`.trim();
	if (font.manufacturer) return `${font.manufacturer}: ${fullName}`;
	return fullName;
}

function buildPostScriptName(font) {
	const family = (font.familyName || '').replace(/\s/g, '');
	const style = font.styleName || 'Regular';
	return `${family}-${style}`;
}

/**
 * Build the post table.
 */
function buildPostTable(font, glyphs) {
	const italicAngle = font.italicAngle || 0;
	const underlinePosition =
		font.underlinePosition || Math.round(-(font.unitsPerEm || 1000) * 0.1);
	const underlineThickness =
		font.underlineThickness || Math.round((font.unitsPerEm || 1000) * 0.05);

	return {
		version: 0x00020000,
		italicAngle,
		underlinePosition,
		underlineThickness,
		isFixedPitch: font.isFixedPitch ? 1 : 0,
		minMemType42: 0,
		maxMemType42: 0,
		minMemType1: 0,
		maxMemType1: 0,
		glyphNames: glyphs.map((g) => String(g.name ?? '.notdef')),
	};
}

/**
 * Build the cmap table from glyph unicodes.
 */
function buildCmapTable(glyphs) {
	// Build unicode -> glyphID map
	const unicodeMap = new Map();
	let hasBeyondBMP = false;

	for (let i = 0; i < glyphs.length; i++) {
		const glyph = glyphs[i];
		const codes =
			glyph.unicodes || (glyph.unicode != null ? [glyph.unicode] : []);
		for (const code of codes) {
			if (!unicodeMap.has(code)) {
				unicodeMap.set(code, i);
			}
			if (code > 0xffff) hasBeyondBMP = true;
		}
	}

	// Sort by codepoint
	const sortedEntries = [...unicodeMap.entries()].sort((a, b) => a[0] - b[0]);

	const subtables = [];
	const encodingRecords = [];

	if (hasBeyondBMP) {
		// Use Format 12 (segmented coverage, full 32-bit)
		const groups = buildFormat12Groups(sortedEntries);
		subtables.push({ format: 12, language: 0, groups });
		// Windows full repertoire
		encodingRecords.push({ platformID: 3, encodingID: 10, subtableIndex: 0 });
		// Unicode full
		encodingRecords.push({ platformID: 0, encodingID: 4, subtableIndex: 0 });
	}

	// Format 4 for BMP entries
	const bmpEntries = sortedEntries.filter(([code]) => code <= 0xffff);
	if (bmpEntries.length > 0) {
		const { segments, glyphIdArray } = buildFormat4Data(bmpEntries);
		const subtableIndex = subtables.length;
		subtables.push({ format: 4, language: 0, segments, glyphIdArray });
		// Windows BMP
		encodingRecords.push({ platformID: 3, encodingID: 1, subtableIndex });
		// Unicode BMP
		encodingRecords.push({ platformID: 0, encodingID: 3, subtableIndex });
	}

	return { version: 0, encodingRecords, subtables };
}

/**
 * Build Format 12 groups from sorted (codepoint, glyphID) pairs.
 */
function buildFormat12Groups(entries) {
	if (entries.length === 0) return [];

	const groups = [];
	let startCode = entries[0][0];
	let startGlyphID = entries[0][1];
	let prevCode = startCode;
	let prevGlyphID = startGlyphID;

	for (let i = 1; i < entries.length; i++) {
		const [code, gid] = entries[i];
		// Continue group if consecutive codepoints and consecutive glyph IDs
		if (code === prevCode + 1 && gid === prevGlyphID + 1) {
			prevCode = code;
			prevGlyphID = gid;
		} else {
			groups.push({
				startCharCode: startCode,
				endCharCode: prevCode,
				startGlyphID,
			});
			startCode = code;
			startGlyphID = gid;
			prevCode = code;
			prevGlyphID = gid;
		}
	}
	groups.push({
		startCharCode: startCode,
		endCharCode: prevCode,
		startGlyphID,
	});

	return groups;
}

/**
 * Build Format 4 segments from sorted BMP (codepoint, glyphID) pairs.
 * Uses idDelta encoding (idRangeOffset = 0) for simplicity.
 */
function buildFormat4Data(entries) {
	const segments = [];
	const glyphIdArray = [];

	if (entries.length === 0) {
		// Must have sentinel
		segments.push({
			startCode: 0xffff,
			endCode: 0xffff,
			idDelta: 1,
			idRangeOffset: 0,
		});
		return { segments, glyphIdArray };
	}

	let segStart = entries[0][0];
	let segDelta = entries[0][1] - entries[0][0];
	let prevCode = entries[0][0];

	for (let i = 1; i < entries.length; i++) {
		const [code, gid] = entries[i];
		const delta = gid - code;
		if (code === prevCode + 1 && delta === segDelta) {
			prevCode = code;
		} else {
			segments.push({
				startCode: segStart,
				endCode: prevCode,
				idDelta: segDelta,
				idRangeOffset: 0,
			});
			segStart = code;
			segDelta = delta;
			prevCode = code;
		}
	}
	segments.push({
		startCode: segStart,
		endCode: prevCode,
		idDelta: segDelta,
		idRangeOffset: 0,
	});

	// Sentinel segment
	segments.push({
		startCode: 0xffff,
		endCode: 0xffff,
		idDelta: 1,
		idRangeOffset: 0,
	});

	return { segments, glyphIdArray };
}

/**
 * Build the hmtx table from simplified glyphs.
 */
function buildHmtxTable(glyphs) {
	const hMetrics = glyphs.map((g) => ({
		advanceWidth: g.advanceWidth || 0,
		lsb: g.leftSideBearing ?? 0,
	}));
	return { hMetrics, leftSideBearings: [] };
}

/**
 * Build the vhea table from simplified glyphs (vertical header).
 * Mirrors buildHheaTable but for vertical metrics.
 */
function buildVheaTable(glyphs) {
	let advanceHeightMax = 0;
	let minTSB = Infinity;
	let minBSB = Infinity;
	let maxExtent = -Infinity;

	for (const glyph of glyphs) {
		const ah = glyph.advanceHeight || 0;
		if (ah > advanceHeightMax) advanceHeightMax = ah;

		const bbox = getGlyphBBox(glyph);
		if (bbox) {
			const tsb = glyph.topSideBearing ?? 0;
			const height = bbox.yMax - bbox.yMin;
			const bsb = ah - (tsb + height);
			const extent = tsb + height;

			if (tsb < minTSB) minTSB = tsb;
			if (bsb < minBSB) minBSB = bsb;
			if (extent > maxExtent) maxExtent = extent;
		}
	}

	if (minTSB === Infinity) minTSB = 0;
	if (minBSB === Infinity) minBSB = 0;
	if (maxExtent === -Infinity) maxExtent = 0;

	return {
		version: 0x00011000, // v1.1
		vertTypoAscender: 0,
		vertTypoDescender: 0,
		vertTypoLineGap: 0,
		advanceHeightMax,
		minTopSideBearing: minTSB,
		minBottomSideBearing: minBSB,
		yMaxExtent: maxExtent,
		caretSlopeRise: 0,
		caretSlopeRun: 0,
		caretOffset: 0,
		reserved1: 0,
		reserved2: 0,
		reserved3: 0,
		reserved4: 0,
		metricDataFormat: 0,
		numOfLongVerMetrics: glyphs.length,
	};
}

/**
 * Build the vmtx table from simplified glyphs (vertical metrics).
 * Mirrors buildHmtxTable but for advanceHeight / topSideBearing.
 */
function buildVmtxTable(glyphs) {
	const vMetrics = glyphs.map((g) => ({
		advanceHeight: g.advanceHeight || 0,
		topSideBearing: g.topSideBearing ?? 0,
	}));
	return { vMetrics, topSideBearings: [] };
}

/**
 * Build the glyf table from simplified glyphs.
 */
function buildGlyfTable(glyphs) {
	const rawGlyphs = glyphs.map((glyph) => {
		if (glyph.contours && glyph.contours.length > 0) {
			// Simple glyph
			const bbox = getGlyphBBox(glyph);
			return {
				type: 'simple',
				xMin: bbox ? bbox.xMin : 0,
				yMin: bbox ? bbox.yMin : 0,
				xMax: bbox ? bbox.xMax : 0,
				yMax: bbox ? bbox.yMax : 0,
				contours: glyph.contours,
				instructions: glyph.instructions || [],
				overlapSimple: false,
			};
		}
		if (glyph.components && glyph.components.length > 0) {
			// Composite glyph
			return {
				type: 'composite',
				xMin: 0,
				yMin: 0,
				xMax: 0,
				yMax: 0,
				components: glyph.components,
				instructions: glyph.instructions || [],
			};
		}
		// Empty glyph (e.g., space)
		return null;
	});
	return { glyphs: rawGlyphs };
}

/**
 * Build a minimal CFF table shell from simplified glyphs.
 * Note: This creates the parsed CFF structure that the existing
 * writeCFF function can encode.
 */
function buildCFFShell(font, glyphs) {
	const fontName = font.postScriptName || buildPostScriptName(font);
	const charset = glyphs.slice(1).map((g) => g.name || '.notdef');
	const charStrings = glyphs.map((g) => {
		if (g.charString) return g.charString;
		// Auto-compile CFF contours to charstring bytes if not provided
		if (g.contours && g.contours.length > 0 && g.contours[0]?.[0]?.type) {
			return compileCharString(g.contours);
		}
		return [];
	});

	// CFF Top DICT string values (FullName, FamilyName, Weight) must be
	// stored as SIDs. Custom strings get SID = 391 + index in the strings array.
	const strings = [];
	function addString(str) {
		const sid = 391 + strings.length;
		strings.push(str);
		return sid;
	}

	const fullName =
		font.fullName || `${font.familyName || ''} ${font.styleName || ''}`.trim();
	const familyName = font.familyName || '';
	const weight = getWeightString(font.weightClass);

	// Charset glyph names also need SIDs
	const charsetSIDs = charset.map((name) => addString(name));

	return {
		majorVersion: 1,
		minorVersion: 0,
		names: [fontName],
		strings,
		globalSubrs: [],
		fonts: [
			{
				topDict: {
					FullName: addString(fullName),
					FamilyName: addString(familyName),
					Weight: addString(weight),
					FontBBox: [
						0,
						font.descender || 0,
						font.unitsPerEm || 1000,
						font.ascender || 0,
					],
				},
				charset: charsetSIDs,
				encoding: [],
				charStrings,
				privateDict: {},
				localSubrs: [],
			},
		],
	};
}

function getWeightString(weightClass) {
	if (!weightClass || weightClass <= 400) return 'Regular';
	if (weightClass <= 500) return 'Medium';
	if (weightClass <= 600) return 'SemiBold';
	if (weightClass <= 700) return 'Bold';
	if (weightClass <= 800) return 'ExtraBold';
	return 'Black';
}

/**
 * Build the kern table from simplified kerning pairs.
 */
function buildKernTable(kerning, glyphs) {
	// Build name -> index map
	const nameToIndex = new Map();
	for (let i = 0; i < glyphs.length; i++) {
		if (glyphs[i].name) nameToIndex.set(glyphs[i].name, i);
	}

	const pairs = [];
	for (const pair of kerning) {
		const left = nameToIndex.get(pair.left);
		const right = nameToIndex.get(pair.right);
		if (left !== undefined && right !== undefined) {
			pairs.push({ left, right, value: pair.value });
		}
	}

	if (pairs.length === 0) return null;

	const nPairs = pairs.length;
	const entrySelector = Math.floor(Math.log2(nPairs));
	const searchRange = Math.pow(2, entrySelector) * 6;
	const rangeShift = nPairs * 6 - searchRange;

	return {
		formatVariant: 'opentype',
		version: 0,
		nTables: 1,
		subtables: [
			{
				version: 0,
				coverage: 1,
				format: 0,
				nPairs,
				searchRange,
				entrySelector,
				rangeShift,
				pairs,
			},
		],
	};
}

// ===========================================================================
//  KERNING FORMAT BUILDERS
// ===========================================================================

/**
 * Resolve simplified kerning pairs to glyph-index pairs.
 * @returns {{ pairs: Array<{left: number, right: number, value: number}>, nameToIndex: Map }}
 */
function resolveKerningPairs(kerning, glyphs) {
	const nameToIndex = new Map();
	for (let i = 0; i < glyphs.length; i++) {
		if (glyphs[i].name) nameToIndex.set(glyphs[i].name, i);
	}

	const pairs = [];
	for (const pair of kerning) {
		const left = nameToIndex.get(pair.left);
		const right = nameToIndex.get(pair.right);
		if (left !== undefined && right !== undefined) {
			pairs.push({ left, right, value: pair.value });
		}
	}
	return { pairs, nameToIndex };
}

/**
 * Dispatch kern table building based on the requested format string.
 */
function buildKernTableForFormat(kerning, glyphs, format) {
	switch (format) {
		case 'kern-ot-f0':
		case 'gpos+kern':
			return buildKernTable(kerning, glyphs);
		case 'kern-ot-f2':
			return buildKernTableOTFormat2(kerning, glyphs);
		case 'kern-apple-f0':
			return buildKernTableAppleFormat0(kerning, glyphs);
		case 'kern-apple-f3':
			return buildKernTableAppleFormat3(kerning, glyphs);
		default:
			return buildKernTable(kerning, glyphs);
	}
}

/**
 * Build an OpenType kern Format 2 (class-based) table from simplified pairs.
 */
function buildKernTableOTFormat2(kerning, glyphs) {
	const { pairs } = resolveKerningPairs(kerning, glyphs);
	if (pairs.length === 0) return null;

	// Group pairs by left glyph to find classes
	const {
		leftClasses,
		rightClasses,
		valueMatrix,
		leftGlyphToClass,
		rightGlyphToClass,
	} = buildClassesFromPairs(pairs);

	const nLeftClasses = leftClasses.length;
	const nRightClasses = rightClasses.length;
	const rowWidth = nRightClasses * 2;

	// Layout: header(8) + leftClassTable + rightClassTable + array
	const headerSize = 8;

	// Find glyph ranges for class tables
	const leftGlyphs = Array.from(leftGlyphToClass.keys()).sort((a, b) => a - b);
	const rightGlyphs = Array.from(rightGlyphToClass.keys()).sort(
		(a, b) => a - b,
	);

	const leftFirstGlyph = leftGlyphs.length > 0 ? leftGlyphs[0] : 0;
	const leftNGlyphs =
		leftGlyphs.length > 0
			? leftGlyphs[leftGlyphs.length - 1] - leftFirstGlyph + 1
			: 0;
	const rightFirstGlyph = rightGlyphs.length > 0 ? rightGlyphs[0] : 0;
	const rightNGlyphs =
		rightGlyphs.length > 0
			? rightGlyphs[rightGlyphs.length - 1] - rightFirstGlyph + 1
			: 0;

	const leftClassTableSize = 4 + leftNGlyphs * 2;
	const rightClassTableSize = 4 + rightNGlyphs * 2;
	const arraySize = nLeftClasses * nRightClasses * 2;

	const leftOffsetTable = headerSize;
	const rightOffsetTable = leftOffsetTable + leftClassTableSize;
	const kerningArrayOffset = rightOffsetTable + rightClassTableSize;

	// Build pre-multiplied offset arrays
	const leftOffsets = [];
	for (let i = 0; i < leftNGlyphs; i++) {
		const g = leftFirstGlyph + i;
		const c = leftGlyphToClass.get(g) ?? 0;
		leftOffsets.push(kerningArrayOffset + c * rowWidth);
	}

	const rightOffsets = [];
	for (let i = 0; i < rightNGlyphs; i++) {
		const g = rightFirstGlyph + i;
		const c = rightGlyphToClass.get(g) ?? 0;
		rightOffsets.push(c * 2);
	}

	return {
		formatVariant: 'opentype',
		version: 0,
		nTables: 1,
		subtables: [
			{
				version: 0,
				coverage: (2 << 8) | 1, // format 2, horizontal
				format: 2,
				rowWidth,
				leftOffsetTable,
				rightOffsetTable,
				kerningArrayOffset,
				leftClassTable: {
					firstGlyph: leftFirstGlyph,
					nGlyphs: leftNGlyphs,
					offsets: leftOffsets,
				},
				rightClassTable: {
					firstGlyph: rightFirstGlyph,
					nGlyphs: rightNGlyphs,
					offsets: rightOffsets,
				},
				nLeftClasses,
				nRightClasses,
				values: valueMatrix,
			},
		],
	};
}

/**
 * Build an Apple kern Format 0 table from simplified pairs.
 */
function buildKernTableAppleFormat0(kerning, glyphs) {
	const { pairs } = resolveKerningPairs(kerning, glyphs);
	if (pairs.length === 0) return null;

	const nPairs = pairs.length;
	const entrySelector = Math.floor(Math.log2(nPairs));
	const searchRange = Math.pow(2, entrySelector) * 6;
	const rangeShift = nPairs * 6 - searchRange;

	return {
		formatVariant: 'apple',
		version: 0x00010000,
		nTables: 1,
		subtables: [
			{
				coverage: 0x00, // horizontal
				format: 0,
				tupleIndex: 0,
				nPairs,
				searchRange,
				entrySelector,
				rangeShift,
				pairs,
			},
		],
	};
}

/**
 * Build an Apple kern Format 3 (compact class-based) table from simplified pairs.
 * Falls back to Apple Format 0 if > 256 classes or > 256 unique values.
 */
function buildKernTableAppleFormat3(kerning, glyphs) {
	const { pairs } = resolveKerningPairs(kerning, glyphs);
	if (pairs.length === 0) return null;

	const {
		leftClasses,
		rightClasses,
		valueMatrix,
		leftGlyphToClass,
		rightGlyphToClass,
	} = buildClassesFromPairs(pairs);

	const leftClassCount = leftClasses.length;
	const rightClassCount = rightClasses.length;

	// Collect unique kern values from the matrix
	const uniqueValues = new Set();
	uniqueValues.add(0);
	for (const row of valueMatrix) {
		for (const v of row) {
			uniqueValues.add(v);
		}
	}

	// Check Format 3 limits (uint8 for all arrays)
	if (
		leftClassCount > 255 ||
		rightClassCount > 255 ||
		uniqueValues.size > 255
	) {
		return buildKernTableAppleFormat0(kerning, glyphs);
	}

	// Build kernValues array and value-to-index map
	const kernValues = Array.from(uniqueValues).sort((a, b) => a - b);
	const valueToIndex = new Map();
	for (let i = 0; i < kernValues.length; i++) {
		valueToIndex.set(kernValues[i], i);
	}

	// Build left/right class arrays indexed by glyph index
	const glyphCount = glyphs.length;
	const leftClassArr = new Array(glyphCount).fill(0);
	const rightClassArr = new Array(glyphCount).fill(0);

	for (const [g, c] of leftGlyphToClass) {
		if (g < glyphCount) leftClassArr[g] = c;
	}
	for (const [g, c] of rightGlyphToClass) {
		if (g < glyphCount) rightClassArr[g] = c;
	}

	// Build kern index array
	const kernIndices = [];
	for (let lc = 0; lc < leftClassCount; lc++) {
		for (let rc = 0; rc < rightClassCount; rc++) {
			const value = valueMatrix[lc]?.[rc] || 0;
			kernIndices.push(valueToIndex.get(value) ?? 0);
		}
	}

	return {
		formatVariant: 'apple',
		version: 0x00010000,
		nTables: 1,
		subtables: [
			{
				coverage: 0x00,
				format: 3,
				tupleIndex: 0,
				glyphCount,
				kernValueCount: kernValues.length,
				leftClassCount,
				rightClassCount,
				flags: 0,
				kernValues,
				leftClasses: leftClassArr,
				rightClasses: rightClassArr,
				kernIndices,
			},
		],
	};
}

/**
 * Build glyph classes from a list of resolved kerning pairs.
 * Groups glyphs with identical kerning profiles into the same class.
 */
function buildClassesFromPairs(pairs) {
	// Build left and right kerning profiles
	// Left profile: for each left glyph, the set of (right, value) entries
	const leftProfiles = new Map(); // leftGlyph → Map<rightGlyph, value>
	const rightGlyphSet = new Set();

	for (const { left, right, value } of pairs) {
		if (!leftProfiles.has(left)) leftProfiles.set(left, new Map());
		leftProfiles.get(left).set(right, value);
		rightGlyphSet.add(right);
	}

	// Group left glyphs by identical kerning profile → same class
	const leftProfileKey = new Map(); // leftGlyph → serialized profile key
	for (const [glyph, profile] of leftProfiles) {
		const entries = Array.from(profile.entries()).sort((a, b) => a[0] - b[0]);
		leftProfileKey.set(glyph, entries.map((e) => `${e[0]}:${e[1]}`).join(','));
	}

	const leftKeyToClass = new Map();
	const leftGlyphToClass = new Map();
	let nextLeftClass = 1; // class 0 = no-kern default
	for (const [glyph, key] of leftProfileKey) {
		if (!leftKeyToClass.has(key)) {
			leftKeyToClass.set(key, nextLeftClass++);
		}
		leftGlyphToClass.set(glyph, leftKeyToClass.get(key));
	}

	// Build right profiles similarly
	const rightProfiles = new Map(); // rightGlyph → Map<leftGlyph, value>
	for (const { left, right, value } of pairs) {
		if (!rightProfiles.has(right)) rightProfiles.set(right, new Map());
		rightProfiles.get(right).set(left, value);
	}

	const rightProfileKey = new Map();
	for (const [glyph, profile] of rightProfiles) {
		const entries = Array.from(profile.entries()).sort((a, b) => a[0] - b[0]);
		rightProfileKey.set(glyph, entries.map((e) => `${e[0]}:${e[1]}`).join(','));
	}

	const rightKeyToClass = new Map();
	const rightGlyphToClass = new Map();
	let nextRightClass = 1;
	for (const [glyph, key] of rightProfileKey) {
		if (!rightKeyToClass.has(key)) {
			rightKeyToClass.set(key, nextRightClass++);
		}
		rightGlyphToClass.set(glyph, rightKeyToClass.get(key));
	}

	const nLeftClasses = nextLeftClass; // 0..nextLeftClass-1
	const nRightClasses = nextRightClass;

	// Build value matrix: leftClasses × rightClasses
	const valueMatrix = [];
	for (let lc = 0; lc < nLeftClasses; lc++) {
		valueMatrix.push(new Array(nRightClasses).fill(0));
	}

	for (const { left, right, value } of pairs) {
		const lc = leftGlyphToClass.get(left) ?? 0;
		const rc = rightGlyphToClass.get(right) ?? 0;
		valueMatrix[lc][rc] = value;
	}

	const leftClasses = Array.from({ length: nLeftClasses }, (_, i) => i);
	const rightClasses = Array.from({ length: nRightClasses }, (_, i) => i);

	return {
		leftClasses,
		rightClasses,
		valueMatrix,
		leftGlyphToClass,
		rightGlyphToClass,
	};
}

// ===========================================================================
//  GPOS KERNING BUILDERS
// ===========================================================================

/**
 * Build a minimal GPOS table from simplified kerning pairs.
 * Creates a single PairPos Format 1 lookup with a 'kern' feature.
 */
function buildGPOSFromKerning(kerning, glyphs) {
	const { pairs } = resolveKerningPairs(kerning, glyphs);
	if (pairs.length === 0) return null;

	const lookup = buildPairPosLookup(pairs);

	return {
		majorVersion: 1,
		minorVersion: 0,
		scriptList: {
			scriptRecords: [
				{
					scriptTag: 'DFLT',
					script: {
						defaultLangSys: {
							lookupOrderOffset: 0,
							requiredFeatureIndex: 0xffff,
							featureIndices: [0],
						},
						langSysRecords: [],
					},
				},
			],
		},
		featureList: {
			featureRecords: [
				{
					featureTag: 'kern',
					feature: {
						featureParamsOffset: 0,
						lookupListIndices: [0],
					},
				},
			],
		},
		lookupList: {
			lookups: [lookup],
		},
	};
}

/**
 * Merge kerning pairs into an existing GPOS table.
 * Replaces the 'kern' feature lookups; preserves all other features/lookups.
 */
function mergeKerningIntoGPOS(existingGPOS, kerning, glyphs) {
	const { pairs } = resolveKerningPairs(kerning, glyphs);
	const gpos = JSON.parse(JSON.stringify(existingGPOS)); // deep clone

	if (pairs.length === 0) return gpos;

	const newLookup = buildPairPosLookup(pairs);

	// Collect old kern lookup indices so we can replace one of them in-place
	const oldKernIndices = new Set();
	for (const rec of gpos.featureList.featureRecords) {
		if (rec.featureTag === 'kern') {
			for (const idx of rec.feature.lookupListIndices) {
				oldKernIndices.add(idx);
			}
		}
	}

	let newLookupIdx;
	if (oldKernIndices.size > 0) {
		// Replace the first old kern lookup in-place, remove extras
		const sorted = [...oldKernIndices].sort((a, b) => a - b);
		newLookupIdx = sorted[0];
		gpos.lookupList.lookups[newLookupIdx] = newLookup;
		// Remove extra kern lookups (in reverse order to preserve indices)
		for (let i = sorted.length - 1; i > 0; i--) {
			gpos.lookupList.lookups.splice(sorted[i], 1);
		}
		// Remap lookup indices that shifted from the removals
		if (sorted.length > 1) {
			const removed = sorted.slice(1);
			remapLookupIndices(gpos, removed);
		}
	} else {
		// Append new lookup
		newLookupIdx = gpos.lookupList.lookups.length;
		gpos.lookupList.lookups.push(newLookup);
	}

	// Point kern feature to the new lookup
	let foundKern = false;
	for (const rec of gpos.featureList.featureRecords) {
		if (rec.featureTag === 'kern') {
			rec.feature.lookupListIndices = [newLookupIdx];
			foundKern = true;
		}
	}

	// If no kern feature exists, add one
	if (!foundKern) {
		gpos.featureList.featureRecords.push({
			featureTag: 'kern',
			feature: {
				featureParamsOffset: 0,
				lookupListIndices: [newLookupIdx],
			},
		});

		// Add kern feature index to all script/langSys featureIndices
		const kernFeatureIdx = gpos.featureList.featureRecords.length - 1;
		for (const sr of gpos.scriptList.scriptRecords) {
			if (sr.script.defaultLangSys) {
				sr.script.defaultLangSys.featureIndices.push(kernFeatureIdx);
			}
			for (const lr of sr.script.langSysRecords || []) {
				lr.langSys.featureIndices.push(kernFeatureIdx);
			}
		}
	}

	return gpos;
}

/**
 * Remap lookup indices in all features and script/langSys after removing lookups.
 * @param {object} gpos
 * @param {number[]} removedIndices - sorted ascending
 */
function remapLookupIndices(gpos, removedIndices) {
	function adjust(idx) {
		let shift = 0;
		for (const r of removedIndices) {
			if (r < idx) shift++;
			else break;
		}
		return idx - shift;
	}
	for (const rec of gpos.featureList.featureRecords) {
		rec.feature.lookupListIndices = rec.feature.lookupListIndices
			.filter((idx) => !removedIndices.includes(idx))
			.map(adjust);
	}
}

/**
 * Build a PairPos Format 1 lookup from resolved glyph-index pairs.
 */
function buildPairPosLookup(pairs) {
	// Group by first (left) glyph
	const byLeft = new Map();
	for (const { left, right, value } of pairs) {
		if (!byLeft.has(left)) byLeft.set(left, []);
		byLeft
			.get(left)
			.push({ secondGlyph: right, value1: { xAdvance: value }, value2: null });
	}

	// Sort coverage glyphs and pair sets
	const covGlyphs = Array.from(byLeft.keys()).sort((a, b) => a - b);
	const pairSets = covGlyphs.map((g) => {
		const ps = byLeft.get(g);
		ps.sort((a, b) => a.secondGlyph - b.secondGlyph);
		return ps;
	});

	return {
		lookupType: 2,
		lookupFlag: 0,
		subtables: [
			{
				format: 1,
				coverage: { format: 1, glyphs: covGlyphs },
				valueFormat1: 0x0004, // xAdvance
				valueFormat2: 0x0000,
				pairSets,
			},
		],
	};
}

/**
 * Build the fvar table from simplified axes and instances.
 * Adds name records to the existing name table for axis and instance names.
 */
function buildFvarTable(simplified, nameTable) {
	const { axes, instances = [] } = simplified;

	// Assign nameIDs starting from 256 (user-defined range)
	let nextNameID = 256;

	const fvarAxes = axes.map((axis) => {
		const nameID = nextNameID++;
		// Add the axis name to the name table
		addNameRecord(nameTable, nameID, axis.name || axis.tag);
		return {
			axisTag: axis.tag,
			minValue: axis.min,
			defaultValue: axis.default,
			maxValue: axis.max,
			flags: axis.hidden ? 0x0001 : 0,
			axisNameID: nameID,
		};
	});

	const fvarInstances = instances.map((inst) => {
		const nameID = nextNameID++;
		addNameRecord(nameTable, nameID, inst.name);
		const coordinates = axes.map((a) => inst.coordinates[a.tag] ?? a.default);
		const instance = {
			subfamilyNameID: nameID,
			flags: 0,
			coordinates,
		};
		if (inst.postScriptName) {
			const psNameID = nextNameID++;
			addNameRecord(nameTable, psNameID, inst.postScriptName);
			instance.postScriptNameID = psNameID;
		}
		return instance;
	});

	return {
		majorVersion: 1,
		minorVersion: 0,
		reserved: 2,
		axisSize: 20,
		instanceSize:
			4 +
			axes.length * 4 +
			(fvarInstances.some((i) => i.postScriptNameID !== undefined) ? 2 : 0),
		axes: fvarAxes,
		instances: fvarInstances,
	};
}

/**
 * Helper: add a name record to the name table for all three platforms.
 */
function addNameRecord(nameTable, nameID, value) {
	if (!value) return;
	nameTable.names.push(
		{ platformID: 3, encodingID: 1, languageID: 0x0409, nameID, value },
		{ platformID: 1, encodingID: 0, languageID: 0, nameID, value },
		{ platformID: 0, encodingID: 3, languageID: 0, nameID, value },
	);
}

/**
 * Build a STAT (Style Attributes) table from axes and instances.
 * Auto-generates format 1 axis value tables for each axis default value,
 * plus format 2 range axis values when instances provide additional values.
 * Uses the 'Regular' elided fallback name per OpenType spec convention.
 */
function buildSTATTable(simplified, nameTable) {
	const { axes } = simplified;

	// Find the next available nameID after what the name table already has
	let nextNameID = 256;
	for (const rec of nameTable.names) {
		if (rec.nameID >= nextNameID) nextNameID = rec.nameID + 1;
	}

	// Build designAxes array (STAT axis records)
	const designAxes = axes.map((axis) => {
		const nameID = nextNameID++;
		addNameRecord(nameTable, nameID, axis.name || axis.tag);
		return {
			axisTag: axis.tag,
			axisNameID: nameID,
			axisOrdering: 0,
		};
	});

	// Build axis value tables: one format 1 entry per axis for its default value
	const axisValues = [];
	for (let axisIndex = 0; axisIndex < axes.length; axisIndex++) {
		const axis = axes[axisIndex];
		const nameID = nextNameID++;
		const axisLabel = axis.name || axis.tag;
		addNameRecord(nameTable, nameID, axisLabel);

		// Flag the default value with ELIDABLE_AXIS_VALUE_NAME (0x0002)
		// so it can be omitted in UI when it equals the default
		const isDefault = true;
		axisValues.push({
			format: 1,
			axisIndex,
			flags: isDefault ? 0x0002 : 0,
			valueNameID: nameID,
			value: axis.default,
		});
	}

	// Elided fallback name — 'Regular' per OpenType convention
	const elidedNameID = nextNameID++;
	addNameRecord(nameTable, elidedNameID, 'Regular');

	return {
		majorVersion: 1,
		minorVersion: 1,
		designAxes,
		axisValues,
		elidedFallbackNameID: elidedNameID,
	};
}

/**
 * Build a STAT table from explicit axisStyles.
 * Handles all 4 STAT axis value formats based on which fields are present.
 */
function buildSTATFromAxisStyles(simplified, nameTable) {
	const { axes, axisStyles } = simplified;

	let nextNameID = 256;
	for (const rec of nameTable.names) {
		if (rec.nameID >= nextNameID) nextNameID = rec.nameID + 1;
	}

	// Build designAxes array
	const designAxes = axes.map((axis) => {
		const nameID = nextNameID++;
		addNameRecord(nameTable, nameID, axis.name || axis.tag);
		return {
			axisTag: axis.tag,
			axisNameID: nameID,
			axisOrdering: 0,
		};
	});

	// Build axis tag → index lookup
	const tagToIndex = {};
	for (let i = 0; i < axes.length; i++) {
		tagToIndex[axes[i].tag] = i;
	}

	// Convert simplified axis values to STAT format
	const axisValues = [];
	if (axisStyles.values) {
		for (const av of axisStyles.values) {
			const nameID = nextNameID++;
			addNameRecord(nameTable, nameID, av.name || '');

			if (av._raw) {
				// Preserved unknown format — restore directly
				axisValues.push({ ...av._raw, valueNameID: nameID });
			} else if (av.values) {
				// Format 4: multi-axis
				const entries = Object.entries(av.values).map(([tag, value]) => ({
					axisIndex: tagToIndex[tag] ?? 0,
					value,
				}));
				axisValues.push({
					format: 4,
					axisCount: entries.length,
					flags: av.flags ?? 0,
					valueNameID: nameID,
					axisValues: entries,
				});
			} else if (av.range) {
				// Format 2: range
				axisValues.push({
					format: 2,
					axisIndex: tagToIndex[av.axis] ?? 0,
					flags: av.flags ?? 0,
					valueNameID: nameID,
					nominalValue: av.range[1],
					rangeMinValue: av.range[0],
					rangeMaxValue: av.range[2],
				});
			} else if (av.linkedValue !== undefined) {
				// Format 3: linked value
				axisValues.push({
					format: 3,
					axisIndex: tagToIndex[av.axis] ?? 0,
					flags: av.flags ?? 0,
					valueNameID: nameID,
					value: av.value,
					linkedValue: av.linkedValue,
				});
			} else {
				// Format 1: single value
				axisValues.push({
					format: 1,
					axisIndex: tagToIndex[av.axis] ?? 0,
					flags: av.flags ?? 0,
					valueNameID: nameID,
					value: av.value,
				});
			}
		}
	}

	// Elided fallback name
	const elidedNameID = nextNameID++;
	addNameRecord(
		nameTable,
		elidedNameID,
		axisStyles.elidedFallbackName || 'Regular',
	);

	return {
		majorVersion: 1,
		minorVersion: 1,
		designAxes,
		axisValues,
		elidedFallbackNameID: elidedNameID,
	};
}

/**
 * Build an avar table from the simplified axisMapping.
 */
function buildAvarTable(simplified) {
	const { axes, axisMapping } = simplified;

	const segmentMaps = axes.map((axis) => {
		const maps = axisMapping[axis.tag];
		if (!maps || maps.length === 0) {
			// Identity mapping: required minimum entries
			return {
				positionMapCount: 3,
				axisValueMaps: [
					{ fromCoordinate: -1, toCoordinate: -1 },
					{ fromCoordinate: 0, toCoordinate: 0 },
					{ fromCoordinate: 1, toCoordinate: 1 },
				],
			};
		}
		return {
			positionMapCount: maps.length,
			axisValueMaps: maps.map((m) => ({
				fromCoordinate: m.from,
				toCoordinate: m.to,
			})),
		};
	});

	return {
		majorVersion: 1,
		minorVersion: 0,
		reserved: 0,
		segmentMaps,
	};
}

/**
 * Build an MVAR table from the simplified metricVariations.
 * Reconstructs the ItemVariationStore and value records.
 */
function buildMVARTable(simplified) {
	const { axes, metricVariations } = simplified;
	const { regions, metrics } = metricVariations;

	// Build the variation region list with axis-tag keys → axis-indexed arrays
	const tagToIndex = {};
	for (let i = 0; i < axes.length; i++) {
		tagToIndex[axes[i].tag] = i;
	}

	const ivsRegions = regions.map((region) => {
		const regionAxes = [];
		for (let a = 0; a < axes.length; a++) {
			const tag = axes[a].tag;
			if (region.axes[tag]) {
				const [start, peak, end] = region.axes[tag];
				regionAxes.push({ startCoord: start, peakCoord: peak, endCoord: end });
			} else {
				regionAxes.push({ startCoord: 0, peakCoord: 0, endCoord: 0 });
			}
		}
		return { regionAxes };
	});

	// Collect all unique region indices used across all metrics
	const allRegionIndices = new Set();
	for (const deltas of Object.values(metrics)) {
		for (const d of deltas) {
			allRegionIndices.add(d.region);
		}
	}
	const regionIndexes = [...allRegionIndices].sort((a, b) => a - b);
	const regionToLocal = new Map();
	for (let i = 0; i < regionIndexes.length; i++) {
		regionToLocal.set(regionIndexes[i], i);
	}

	// Build delta sets: one row per metric, columns = regions
	const metricEntries = Object.entries(metrics);
	const deltaSets = [];
	const valueRecords = [];

	for (const [humanName, deltas] of metricEntries) {
		const tag = MVAR_NAME_TAGS[humanName] || humanName;
		const row = new Array(regionIndexes.length).fill(0);
		for (const d of deltas) {
			const localIdx = regionToLocal.get(d.region);
			if (localIdx !== undefined) row[localIdx] = d.delta;
		}
		deltaSets.push(row);
		valueRecords.push({
			valueTag: tag,
			deltaSetOuterIndex: 0,
			deltaSetInnerIndex: deltaSets.length - 1,
		});
	}

	// Compute wordDeltaCount: count how many regions need int16 (vs int8)
	let wordCount = 0;
	for (let r = 0; r < regionIndexes.length; r++) {
		let needsWord = false;
		for (const row of deltaSets) {
			if (row[r] < -128 || row[r] > 127) {
				needsWord = true;
				break;
			}
		}
		if (needsWord) wordCount++;
	}

	return {
		majorVersion: 1,
		minorVersion: 0,
		reserved: 0,
		valueRecordSize: 8,
		valueRecords,
		itemVariationStore: {
			format: 1,
			variationRegionList: {
				axisCount: axes.length,
				regions: ivsRegions,
			},
			itemVariationData: [
				{
					itemCount: deltaSets.length,
					wordDeltaCount: wordCount,
					regionIndexes,
					deltaSets,
				},
			],
		},
	};
}

// ===========================================================================
//  GSUB FROM SIMPLIFIED SUBSTITUTIONS
// ===========================================================================

/**
 * Build a glyph name → index mapping. Supports names, numeric codepoints,
 * and hex strings ('U+0041', '0x41') via resolveGlyphId.
 */
function buildNameToIndex(glyphs) {
	const map = new Map();
	for (let i = 0; i < glyphs.length; i++) {
		if (glyphs[i].name) map.set(glyphs[i].name, i);
	}
	return map;
}

/**
 * Resolve a glyph reference (name, codepoint, hex) to a glyph index.
 * Returns undefined if the glyph can't be found.
 */
function resolveToIndex(ref, glyphs, nameToIndex) {
	// Fast path: direct name lookup
	if (typeof ref === 'string' && nameToIndex.has(ref)) {
		return nameToIndex.get(ref);
	}
	// Slow path: resolveGlyphId handles U+XXXX, 0xXX, numeric
	const name = resolveGlyphId(glyphs, ref);
	if (name !== undefined) {
		return nameToIndex.get(name);
	}
	return undefined;
}

/**
 * Build a complete GSUB table from simplified substitution rules
 * and any raw (non-simplifiable) lookups from the original font.
 *
 * @param {object[]} substitutions - Simplified substitution rules.
 * @param {object[]} rawLookups - Raw lookup objects (types 5/6) to preserve.
 * @param {object[]} glyphs - Simplified glyphs array.
 * @returns {object} Full GSUB table structure.
 */
function buildGSUBFromSubstitutions(substitutions, rawLookups, glyphs) {
	const nameToIndex = buildNameToIndex(glyphs);
	const lookups = [];
	const featureMap = new Map(); // 'featureTag' → { lookupIndices: Set, scripts: Map }

	// Group substitutions by type + feature tag
	const groups = groupSubstitutions(substitutions);

	for (const [key, rules] of groups) {
		const [type, featureTag] = key.split('\0');
		const lookup = buildLookupFromRules(type, rules, glyphs, nameToIndex);
		if (!lookup) continue;

		const lookupIndex = lookups.length;
		lookups.push(lookup);

		if (!featureMap.has(featureTag)) {
			featureMap.set(featureTag, {
				lookupIndices: new Set(),
				scripts: new Map(),
			});
		}
		const featureEntry = featureMap.get(featureTag);
		featureEntry.lookupIndices.add(lookupIndex);

		// Collect script/language associations from rules.
		// If rules have allScripts (from the deduplication pass),
		// use that to get ALL original script/language associations.
		for (const rule of rules) {
			const scriptEntries = rule.allScripts || [
				{ script: rule.script, language: rule.language },
			];
			for (const entry of scriptEntries) {
				const script = entry.script || 'DFLT';
				const language = entry.language || null;
				if (!featureEntry.scripts.has(script)) {
					featureEntry.scripts.set(script, new Set());
				}
				featureEntry.scripts.get(script).add(language);
			}
		}
	}

	// Merge raw lookups (types 5/6 from import) — append after simplified lookups
	const rawLookupIndexRemap = new Map();
	for (const raw of rawLookups) {
		rawLookupIndexRemap.set(raw.index, lookups.length);
		lookups.push(raw.lookup);

		// Re-register feature associations for raw lookups
		for (const ref of raw.features) {
			const featureTag = ref.featureTag;
			if (!featureMap.has(featureTag)) {
				featureMap.set(featureTag, {
					lookupIndices: new Set(),
					scripts: new Map(),
				});
			}
			const featureEntry = featureMap.get(featureTag);
			featureEntry.lookupIndices.add(lookups.length - 1);

			const script = ref.script || 'DFLT';
			const language = ref.language || null;
			if (!featureEntry.scripts.has(script)) {
				featureEntry.scripts.set(script, new Set());
			}
			featureEntry.scripts.get(script).add(language);
		}
	}

	// Remap lookup indices inside raw contextual subtables (types 5/6)
	if (rawLookupIndexRemap.size > 0) {
		remapContextualLookupIndices(lookups, rawLookupIndexRemap);
	}

	// Build featureList
	const featureRecords = [];
	const featureTagToIndex = new Map();

	for (const [featureTag, entry] of featureMap) {
		featureTagToIndex.set(featureTag, featureRecords.length);
		featureRecords.push({
			featureTag,
			feature: {
				featureParamsOffset: 0,
				lookupListIndices: Array.from(entry.lookupIndices).sort(
					(a, b) => a - b,
				),
			},
		});
	}

	// Build scriptList from all script/language associations
	const scriptMap = new Map(); // scriptTag → Map<langTag|null, Set<featureIndex>>

	for (const [featureTag, entry] of featureMap) {
		const featureIndex = featureTagToIndex.get(featureTag);
		for (const [scriptTag, languages] of entry.scripts) {
			if (!scriptMap.has(scriptTag)) {
				scriptMap.set(scriptTag, new Map());
			}
			const langMap = scriptMap.get(scriptTag);
			for (const langTag of languages) {
				if (!langMap.has(langTag)) {
					langMap.set(langTag, new Set());
				}
				langMap.get(langTag).add(featureIndex);
			}
		}
	}

	const scriptRecords = [];
	for (const [scriptTag, langMap] of scriptMap) {
		const langSysRecords = [];
		let defaultLangSys = null;

		for (const [langTag, featureIndices] of langMap) {
			const langSys = {
				lookupOrderOffset: 0,
				requiredFeatureIndex: 0xffff,
				featureIndices: Array.from(featureIndices).sort((a, b) => a - b),
			};

			if (langTag === null) {
				defaultLangSys = langSys;
			} else {
				langSysRecords.push({
					langSysTag: langTag,
					langSys,
				});
			}
		}

		// Ensure there's always a defaultLangSys
		if (!defaultLangSys) {
			// Merge all language-specific features into a default
			const allIndices = new Set();
			for (const [, featureIndices] of langMap) {
				for (const idx of featureIndices) allIndices.add(idx);
			}
			defaultLangSys = {
				lookupOrderOffset: 0,
				requiredFeatureIndex: 0xffff,
				featureIndices: Array.from(allIndices).sort((a, b) => a - b),
			};
		}

		scriptRecords.push({
			scriptTag,
			script: {
				defaultLangSys,
				langSysRecords,
			},
		});
	}

	return {
		majorVersion: 1,
		minorVersion: 0,
		scriptList: { scriptRecords },
		featureList: { featureRecords },
		lookupList: { lookups },
	};
}

/**
 * Build a minimal GSUB table from only raw (non-simplifiable) lookups.
 * Used when there are no simplified substitutions but raw lookups need preserving.
 */
function buildGSUBFromRawLookups(rawLookups) {
	const lookups = [];
	const featureMap = new Map();
	const lookupIndexRemap = new Map();

	for (const raw of rawLookups) {
		lookupIndexRemap.set(raw.index, lookups.length);
		lookups.push(raw.lookup);

		for (const ref of raw.features) {
			const featureTag = ref.featureTag;
			if (!featureMap.has(featureTag)) {
				featureMap.set(featureTag, {
					lookupIndices: new Set(),
					scripts: new Map(),
				});
			}
			const entry = featureMap.get(featureTag);
			entry.lookupIndices.add(lookups.length - 1);

			const script = ref.script || 'DFLT';
			const language = ref.language || null;
			if (!entry.scripts.has(script)) {
				entry.scripts.set(script, new Set());
			}
			entry.scripts.get(script).add(language);
		}
	}

	if (lookupIndexRemap.size > 0) {
		remapContextualLookupIndices(lookups, lookupIndexRemap);
	}

	const featureRecords = [];
	const featureTagToIndex = new Map();
	for (const [featureTag, entry] of featureMap) {
		featureTagToIndex.set(featureTag, featureRecords.length);
		featureRecords.push({
			featureTag,
			feature: {
				featureParamsOffset: 0,
				lookupListIndices: Array.from(entry.lookupIndices).sort(
					(a, b) => a - b,
				),
			},
		});
	}

	const scriptMap = new Map();
	for (const [featureTag, entry] of featureMap) {
		const featureIndex = featureTagToIndex.get(featureTag);
		for (const [scriptTag, languages] of entry.scripts) {
			if (!scriptMap.has(scriptTag)) {
				scriptMap.set(scriptTag, new Map());
			}
			const langMap = scriptMap.get(scriptTag);
			for (const langTag of languages) {
				if (!langMap.has(langTag)) {
					langMap.set(langTag, new Set());
				}
				langMap.get(langTag).add(featureIndex);
			}
		}
	}

	const scriptRecords = [];
	for (const [scriptTag, langMap] of scriptMap) {
		let defaultLangSys = null;
		const langSysRecords = [];
		for (const [langTag, featureIndices] of langMap) {
			const langSys = {
				lookupOrderOffset: 0,
				requiredFeatureIndex: 0xffff,
				featureIndices: Array.from(featureIndices).sort((a, b) => a - b),
			};
			if (langTag === null) {
				defaultLangSys = langSys;
			} else {
				langSysRecords.push({ langSysTag: langTag, langSys });
			}
		}
		if (!defaultLangSys) {
			const allIndices = new Set();
			for (const [, featureIndices] of langMap) {
				for (const idx of featureIndices) allIndices.add(idx);
			}
			defaultLangSys = {
				lookupOrderOffset: 0,
				requiredFeatureIndex: 0xffff,
				featureIndices: Array.from(allIndices).sort((a, b) => a - b),
			};
		}
		scriptRecords.push({
			scriptTag,
			script: { defaultLangSys, langSysRecords },
		});
	}

	return {
		majorVersion: 1,
		minorVersion: 0,
		scriptList: { scriptRecords },
		featureList: { featureRecords },
		lookupList: { lookups },
	};
}

/**
 * Group substitution rules by type + feature tag.
 * Returns Map<'type\0featureTag', rules[]>.
 */
function groupSubstitutions(substitutions) {
	const groups = new Map();
	for (const rule of substitutions) {
		const key = `${rule.type}\0${rule.feature}`;
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(rule);
	}
	return groups;
}

/**
 * Build a GSUB lookup from a group of simplified rules of the same type.
 */
function buildLookupFromRules(type, rules, glyphs, nameToIndex) {
	switch (type) {
		case 'single':
			return buildSingleSubstLookup(rules, glyphs, nameToIndex);
		case 'multiple':
			return buildMultipleSubstLookup(rules, glyphs, nameToIndex);
		case 'alternate':
			return buildAlternateSubstLookup(rules, glyphs, nameToIndex);
		case 'ligature':
			return buildLigatureSubstLookup(rules, glyphs, nameToIndex);
		case 'reverse':
			return buildReverseChainSubstLookup(rules, glyphs, nameToIndex);
		default:
			return null;
	}
}

/** Build a Single Substitution lookup (type 1, format 2). */
function buildSingleSubstLookup(rules, glyphs, nameToIndex) {
	const fromGlyphs = [];
	const toGlyphs = [];

	for (const rule of rules) {
		const fromIdx = resolveToIndex(rule.from, glyphs, nameToIndex);
		const toIdx = resolveToIndex(rule.to, glyphs, nameToIndex);
		if (fromIdx !== undefined && toIdx !== undefined) {
			fromGlyphs.push(fromIdx);
			toGlyphs.push(toIdx);
		}
	}

	if (fromGlyphs.length === 0) return null;

	// Sort by glyph ID for proper coverage ordering
	const sorted = fromGlyphs
		.map((g, i) => ({ from: g, to: toGlyphs[i] }))
		.sort((a, b) => a.from - b.from);

	return {
		lookupType: 1,
		lookupFlag: 0,
		subtables: [
			{
				format: 2,
				coverage: { format: 1, glyphs: sorted.map((s) => s.from) },
				substituteGlyphIDs: sorted.map((s) => s.to),
			},
		],
	};
}

/** Build a Multiple Substitution lookup (type 2, format 1). */
function buildMultipleSubstLookup(rules, glyphs, nameToIndex) {
	const entries = [];

	for (const rule of rules) {
		const fromIdx = resolveToIndex(rule.from, glyphs, nameToIndex);
		if (fromIdx === undefined) continue;

		const toIdxs = [];
		let valid = true;
		for (const ref of rule.to) {
			const idx = resolveToIndex(ref, glyphs, nameToIndex);
			if (idx === undefined) {
				valid = false;
				break;
			}
			toIdxs.push(idx);
		}
		if (valid && toIdxs.length > 0) {
			entries.push({ from: fromIdx, to: toIdxs });
		}
	}

	if (entries.length === 0) return null;

	entries.sort((a, b) => a.from - b.from);

	return {
		lookupType: 2,
		lookupFlag: 0,
		subtables: [
			{
				format: 1,
				coverage: { format: 1, glyphs: entries.map((e) => e.from) },
				sequences: entries.map((e) => e.to),
			},
		],
	};
}

/** Build an Alternate Substitution lookup (type 3, format 1). */
function buildAlternateSubstLookup(rules, glyphs, nameToIndex) {
	const entries = [];

	for (const rule of rules) {
		const fromIdx = resolveToIndex(rule.from, glyphs, nameToIndex);
		if (fromIdx === undefined) continue;

		const altIdxs = [];
		let valid = true;
		for (const ref of rule.alternates) {
			const idx = resolveToIndex(ref, glyphs, nameToIndex);
			if (idx === undefined) {
				valid = false;
				break;
			}
			altIdxs.push(idx);
		}
		if (valid && altIdxs.length > 0) {
			entries.push({ from: fromIdx, alternates: altIdxs });
		}
	}

	if (entries.length === 0) return null;

	entries.sort((a, b) => a.from - b.from);

	return {
		lookupType: 3,
		lookupFlag: 0,
		subtables: [
			{
				format: 1,
				coverage: { format: 1, glyphs: entries.map((e) => e.from) },
				alternateSets: entries.map((e) => e.alternates),
			},
		],
	};
}

/** Build a Ligature Substitution lookup (type 4, format 1). */
function buildLigatureSubstLookup(rules, glyphs, nameToIndex) {
	// Group by first component glyph
	const groups = new Map();

	for (const rule of rules) {
		if (!rule.components || rule.components.length < 2) continue;

		const firstIdx = resolveToIndex(rule.components[0], glyphs, nameToIndex);
		const ligIdx = resolveToIndex(rule.ligature, glyphs, nameToIndex);
		if (firstIdx === undefined || ligIdx === undefined) continue;

		const restIdxs = [];
		let valid = true;
		for (let i = 1; i < rule.components.length; i++) {
			const idx = resolveToIndex(rule.components[i], glyphs, nameToIndex);
			if (idx === undefined) {
				valid = false;
				break;
			}
			restIdxs.push(idx);
		}
		if (!valid) continue;

		if (!groups.has(firstIdx)) groups.set(firstIdx, []);
		groups.get(firstIdx).push({
			ligatureGlyph: ligIdx,
			componentCount: rule.components.length,
			componentGlyphIDs: restIdxs,
		});
	}

	if (groups.size === 0) return null;

	// Sort coverage glyphs by glyph ID
	const covGlyphs = Array.from(groups.keys()).sort((a, b) => a - b);
	const ligatureSets = covGlyphs.map((gid) => groups.get(gid));

	return {
		lookupType: 4,
		lookupFlag: 0,
		subtables: [
			{
				format: 1,
				coverage: { format: 1, glyphs: covGlyphs },
				ligatureSets,
			},
		],
	};
}

/** Build a Reverse Chained Contexts Single Substitution lookup (type 8). */
function buildReverseChainSubstLookup(rules, glyphs, nameToIndex) {
	const subtables = [];

	for (const rule of rules) {
		const fromIdx = resolveToIndex(rule.from, glyphs, nameToIndex);
		const toIdx = resolveToIndex(rule.to, glyphs, nameToIndex);
		if (fromIdx === undefined || toIdx === undefined) continue;

		const backtrackCoverages = (rule.backtrack || []).map((arr) => {
			const gids = arr
				.map((ref) => resolveToIndex(ref, glyphs, nameToIndex))
				.filter((idx) => idx !== undefined)
				.sort((a, b) => a - b);
			return { format: 1, glyphs: gids };
		});

		const lookaheadCoverages = (rule.lookahead || []).map((arr) => {
			const gids = arr
				.map((ref) => resolveToIndex(ref, glyphs, nameToIndex))
				.filter((idx) => idx !== undefined)
				.sort((a, b) => a - b);
			return { format: 1, glyphs: gids };
		});

		subtables.push({
			format: 1,
			coverage: { format: 1, glyphs: [fromIdx] },
			backtrackCoverages,
			lookaheadCoverages,
			substituteGlyphIDs: [toIdx],
		});
	}

	if (subtables.length === 0) return null;

	return {
		lookupType: 8,
		lookupFlag: 0,
		subtables,
	};
}

/**
 * Remap lookup indices inside contextual/chained contextual subtables (types 5/6)
 * after reordering lookups.
 */
function remapContextualLookupIndices(lookups, indexRemap) {
	for (const lookup of lookups) {
		if (!lookup || !lookup.subtables) continue;
		if (lookup.lookupType !== 5 && lookup.lookupType !== 6) continue;

		for (const st of lookup.subtables) {
			// SequenceContext and ChainedSequenceContext share similar structures
			// with seqLookupRecords / substitutionLookupRecords
			remapSubtableLookupRefs(st, indexRemap);
		}
	}
}

function remapSubtableLookupRefs(st, indexRemap) {
	// Format 1: rules → ruleSet → rule.seqLookupRecords
	if (st.ruleSets) {
		for (const ruleSet of st.ruleSets) {
			if (!ruleSet) continue;
			for (const rule of ruleSet) {
				remapSeqLookupRecords(rule.seqLookupRecords, indexRemap);
			}
		}
	}
	// Format 2: classSets → classSet → rule.seqLookupRecords
	if (st.classSets) {
		for (const classSet of st.classSets) {
			if (!classSet) continue;
			for (const rule of classSet) {
				remapSeqLookupRecords(rule.seqLookupRecords, indexRemap);
			}
		}
	}
	// Format 3: direct seqLookupRecords
	if (st.seqLookupRecords) {
		remapSeqLookupRecords(st.seqLookupRecords, indexRemap);
	}
	// Chained context variants
	if (st.chainedRuleSets) {
		for (const ruleSet of st.chainedRuleSets) {
			if (!ruleSet) continue;
			for (const rule of ruleSet) {
				remapSeqLookupRecords(rule.seqLookupRecords, indexRemap);
			}
		}
	}
	if (st.chainedClassSets) {
		for (const classSet of st.chainedClassSets) {
			if (!classSet) continue;
			for (const rule of classSet) {
				remapSeqLookupRecords(rule.seqLookupRecords, indexRemap);
			}
		}
	}
}

function remapSeqLookupRecords(records, indexRemap) {
	if (!records) return;
	for (const rec of records) {
		const newIdx = indexRemap.get(rec.lookupListIndex);
		if (newIdx !== undefined) {
			rec.lookupListIndex = newIdx;
		}
	}
}

// ===========================================================================
//  COLOR FONT TABLE BUILDERS
// ===========================================================================

/**
 * Build a CPAL table from simplified palettes (arrays of hex strings).
 *
 * @param {string[][]} palettes - Array of palettes, each an array of hex strings.
 * @returns {object} Parsed CPAL table object.
 */
function buildCPALFromPalettes(palettes) {
	if (!palettes || palettes.length === 0) return null;

	const numPaletteEntries = palettes[0].length;

	const cpalPalettes = palettes.map((palette) =>
		palette.map((hex) => hexToBGRA(hex)),
	);

	return {
		version: 0,
		numPaletteEntries,
		palettes: cpalPalettes,
	};
}

/**
 * Build a COLR table from simplified color glyphs.
 *
 * If all color glyphs use `layers` (no `paint`), produces COLR v0.
 * If any use `paint`, produces COLR v1.
 *
 * @param {object[]} colorGlyphs - Simplified color glyph array.
 * @param {object[]} glyphs - Full glyph array for name→index resolution.
 * @returns {object} Parsed COLR table object.
 */
function buildCOLRFromColorGlyphs(colorGlyphs, glyphs) {
	if (!colorGlyphs || colorGlyphs.length === 0) return null;

	const nameToId = buildNameToGlyphIdMap(glyphs);
	const resolveId = (name) => nameToId.get(name) ?? 0;

	const hasV1 = colorGlyphs.some((cg) => cg.paint);

	// Build v0 records from entries that have layers
	const v0Entries = colorGlyphs.filter((cg) => cg.layers);
	const baseGlyphRecords = [];
	const layerRecords = [];

	// Sort v0 entries by glyph ID for binary search compatibility
	const sortedV0 = v0Entries
		.map((cg) => ({ ...cg, glyphID: resolveId(cg.name) }))
		.sort((a, b) => a.glyphID - b.glyphID);

	for (const entry of sortedV0) {
		const firstLayerIndex = layerRecords.length;
		for (const layer of entry.layers) {
			layerRecords.push({
				glyphID: resolveId(layer.glyph),
				paletteIndex: layer.paletteIndex,
			});
		}
		baseGlyphRecords.push({
			glyphID: entry.glyphID,
			firstLayerIndex,
			numLayers: entry.layers.length,
		});
	}

	if (!hasV1) {
		return {
			version: 0,
			baseGlyphRecords,
			layerRecords,
		};
	}

	// Build v1 paint records
	const v1Entries = colorGlyphs.filter((cg) => cg.paint);
	const baseGlyphPaintRecords = [];

	// Sort v1 entries by glyph ID
	const sortedV1 = v1Entries
		.map((cg) => ({ ...cg, glyphID: resolveId(cg.name) }))
		.sort((a, b) => a.glyphID - b.glyphID);

	for (const entry of sortedV1) {
		const paint = structuredClone(entry.paint);
		resolvePaintGlyphNames(paint, nameToId);
		baseGlyphPaintRecords.push({
			glyphID: entry.glyphID,
			paint,
		});
	}

	return {
		version: 1,
		baseGlyphRecords,
		layerRecords,
		baseGlyphPaintRecords,
		layerPaints: [],
		clipList: null,
		varIndexMap: null,
		itemVariationStore: null,
	};
}
