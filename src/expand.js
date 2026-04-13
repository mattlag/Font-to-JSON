/**
 * Font Flux JS : Expand
 * Builds a `raw` font object from a `simplified` schema object.
 *
 * This is the reverse of simplify.js — it takes the human-friendly format
 * and produces the table-by-table structure that export.js can encode to binary.
 */

import { compileCharString } from './otf/charstring_compiler.js';
import { isoToLongdatetime } from './simplify.js';

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
		if (simplified.features.GSUB) tables.GSUB = simplified.features.GSUB;
		if (simplified.features.GDEF) tables.GDEF = simplified.features.GDEF;
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
