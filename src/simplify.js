/**
 * Font Flux JS : Simplify
 * Derives a human-friendly `simplified` object from the `raw` parsed font data.
 *
 * The simplified structure consolidates data scattered across many tables into
 * a single coherent view: glyphs are self-contained, font metadata is flat
 * strings, and metrics live in one place.
 */

import {
	disassembleCharString,
	interpretCharString,
} from './otf/charstring_interpreter.js';

// ===========================================================================
//  MAIN ENTRY
// ===========================================================================

/**
 * Tables that are fully decomposed into top-level simplified fields.
 * These are NOT passed through to the `tables` property because their
 * data is already represented in font info, glyphs, kerning, etc.
 */
export const DECOMPOSED_TABLES = new Set([
	'head',
	'hhea',
	'hmtx',
	'vmtx',
	'name',
	'OS/2',
	'post',
	'maxp',
	'cmap',
	'glyf',
	'loca',
	'CFF ',
	'kern',
	'fvar',
	'GPOS',
	'GSUB',
	'GDEF',
	'gasp',
	'cvt ',
	'fpgm',
	'prep',
]);

/**
 * Build a simplified representation from raw parsed font data.
 * @param {{ header: object, tables: object }} raw
 * @returns {object} simplified object
 */
export function buildSimplified(raw) {
	const { header, tables } = raw;

	const font = extractFontInfo(tables);
	const glyphs = buildSimplifiedGlyphs(tables);

	const result = { font, glyphs };

	// Kerning
	const kerning = extractKerning(tables, glyphs);
	if (kerning.length > 0) {
		result.kerning = kerning;
	}

	// Variable font axes
	if (tables.fvar) {
		result.axes = extractAxes(tables);
		result.instances = extractInstances(tables);
	}

	// GSUB substitutions — decompose types 1-4, 8 into simplified form
	if (tables.GSUB && !tables.GSUB._raw) {
		const { substitutions, rawLookups } = extractSubstitutions(
			tables.GSUB,
			glyphs,
		);
		if (substitutions.length > 0) {
			result.substitutions = substitutions;
		}
		// Store raw lookups that couldn't be simplified (types 5/6)
		if (rawLookups.length > 0) {
			result._rawGSUBLookups = rawLookups;
		}
	}

	// OpenType layout features (passthrough: GPOS, GDEF)
	// GSUB is now decomposed into substitutions; only pass through non-GSUB features
	const features = {};
	if (tables.GPOS && !tables.GPOS._raw) features.GPOS = tables.GPOS;
	if (tables.GDEF && !tables.GDEF._raw) features.GDEF = tables.GDEF;
	if (Object.keys(features).length > 0) {
		result.features = features;
	}

	// Gasp
	if (tables.gasp && !tables.gasp._raw && tables.gasp.gaspRanges) {
		result.gasp = tables.gasp.gaspRanges.map((r) => ({
			maxPPEM: r.rangeMaxPPEM,
			behavior: r.rangeGaspBehavior,
		}));
	}

	// TrueType hinting programs (passthrough)
	if (tables['cvt '] && !tables['cvt ']._raw && tables['cvt '].values) {
		result.cvt = tables['cvt '].values;
	}
	if (tables.fpgm && !tables.fpgm._raw && tables.fpgm.instructions) {
		result.fpgm = tables.fpgm.instructions;
	}
	if (tables.prep && !tables.prep._raw && tables.prep.instructions) {
		result.prep = tables.prep.instructions;
	}

	// Store ALL original parsed tables for lossless round-trip export.
	// The top-level simplified fields (font, glyphs, etc.) are the
	// editable interface; tables is the authoritative data for export.
	result.tables = { ...tables };

	// Store the SFNT header (needed for lossless export round-trip)
	result._header = header;

	return result;
}

// ===========================================================================
//  FONT INFO
// ===========================================================================

/**
 * Name ID -> simplified property key mapping.
 */
const NAME_ID_MAP = {
	0: 'copyright',
	1: 'familyName',
	2: 'styleName',
	3: 'uniqueID',
	4: 'fullName',
	5: 'version',
	6: 'postScriptName',
	7: 'trademark',
	8: 'manufacturer',
	9: 'designer',
	10: 'description',
	11: 'vendorURL',
	12: 'designerURL',
	13: 'license',
	14: 'licenseURL',
	19: 'sampleText',
};

/**
 * Extract the best string for a given nameID from the name table.
 * Preference: Windows Unicode (3,1,0x0409) -> Unicode (0,*,0) -> Mac Roman (1,0,0).
 */
function getBestName(nameTable, nameID) {
	if (!nameTable || !nameTable.names) return undefined;
	const records = nameTable.names.filter((r) => r.nameID === nameID);
	if (records.length === 0) return undefined;

	// Prefer Windows English
	const win = records.find(
		(r) => r.platformID === 3 && r.encodingID === 1 && r.languageID === 0x0409,
	);
	if (win) return win.value;

	// Unicode
	const uni = records.find((r) => r.platformID === 0);
	if (uni) return uni.value;

	// Mac Roman
	const mac = records.find(
		(r) => r.platformID === 1 && r.encodingID === 0 && r.languageID === 0,
	);
	if (mac) return mac.value;

	// Any
	return records[0].value;
}

/**
 * Extract font identity and metrics from multiple raw tables.
 */
function extractFontInfo(tables) {
	const nameTable = tables.name;
	const head = tables.head;
	const hhea = tables.hhea;
	const os2 = tables['OS/2'];
	const post = tables.post;

	const font = {};

	// Name table strings
	for (const [nameID, key] of Object.entries(NAME_ID_MAP)) {
		const value = getBestName(nameTable, Number(nameID));
		if (value !== undefined && value.trim() !== '') {
			font[key] = value;
		}
	}

	// Core metrics from head
	if (head && !head._raw) {
		font.unitsPerEm = head.unitsPerEm;
		font.created = longdatetimeToISO(head.created);
		font.modified = longdatetimeToISO(head.modified);
	}

	// Vertical metrics from hhea
	if (hhea && !hhea._raw) {
		font.ascender = hhea.ascender;
		font.descender = hhea.descender;
		font.lineGap = hhea.lineGap;
	}

	// Style from post
	if (post && !post._raw) {
		font.italicAngle = post.italicAngle;
		font.underlinePosition = post.underlinePosition;
		font.underlineThickness = post.underlineThickness;
		font.isFixedPitch = post.isFixedPitch !== 0;
	}

	// OS/2 fields
	if (os2 && !os2._raw) {
		font.weightClass = os2.usWeightClass;
		font.widthClass = os2.usWidthClass;
		font.fsType = os2.fsType;
		font.fsSelection = os2.fsSelection;
		font.achVendID = os2.achVendID;
		if (os2.panose) font.panose = os2.panose;
	}

	return font;
}

// ===========================================================================
//  GLYPHS
// ===========================================================================

/**
 * Build a reverse map: glyphIndex -> array of unicode codepoints.
 */
function buildGlyphToUnicodeMap(cmapTable) {
	const map = new Map();
	if (!cmapTable || cmapTable._raw || !cmapTable.subtables) return map;

	for (const subtable of cmapTable.subtables) {
		switch (subtable.format) {
			case 0:
				for (let code = 0; code < subtable.glyphIdArray.length; code++) {
					const gid = subtable.glyphIdArray[code];
					if (gid !== 0) addToMap(map, gid, code);
				}
				break;

			case 4:
				for (const seg of subtable.segments) {
					for (let c = seg.startCode; c <= seg.endCode; c++) {
						let gid;
						if (seg.idRangeOffset === 0) {
							gid = (c + seg.idDelta) & 0xffff;
						} else {
							// idRangeOffset-based lookup: we need the glyphIdArray
							const idx =
								seg.idRangeOffset / 2 +
								(c - seg.startCode) -
								(subtable.segments.length - subtable.segments.indexOf(seg));
							gid = subtable.glyphIdArray[idx];
							if (gid !== undefined && gid !== 0) {
								gid = (gid + seg.idDelta) & 0xffff;
							}
						}
						if (gid !== undefined && gid !== 0) addToMap(map, gid, c);
					}
				}
				break;

			case 6:
				for (let i = 0; i < subtable.glyphIdArray.length; i++) {
					const gid = subtable.glyphIdArray[i];
					if (gid !== 0) addToMap(map, gid, subtable.firstCode + i);
				}
				break;

			case 12:
				for (const group of subtable.groups) {
					for (let c = group.startCharCode; c <= group.endCharCode; c++) {
						const gid = group.startGlyphID + (c - group.startCharCode);
						if (gid !== 0) addToMap(map, gid, c);
					}
				}
				break;

			case 13:
				for (const group of subtable.groups) {
					for (let c = group.startCharCode; c <= group.endCharCode; c++) {
						if (group.glyphID !== 0) addToMap(map, group.glyphID, c);
					}
				}
				break;
			// Format 14 (variation selectors) — skip for simplified mapping
		}
	}

	return map;
}

function addToMap(map, glyphIndex, codepoint) {
	if (!map.has(glyphIndex)) {
		map.set(glyphIndex, []);
	}
	const arr = map.get(glyphIndex);
	if (!arr.includes(codepoint)) {
		arr.push(codepoint);
	}
}

/**
 * Get glyph names from post or CFF tables.
 */
function getGlyphNames(tables, numGlyphs) {
	// post table v2.0 has individual glyph names
	if (
		tables.post &&
		!tables.post._raw &&
		tables.post.glyphNames &&
		tables.post.glyphNames.length > 0
	) {
		return tables.post.glyphNames;
	}

	// CFF charset has glyph names (as SIDs)
	if (tables['CFF '] && !tables['CFF ']._raw) {
		const cff = tables['CFF '];
		if (cff.fonts && cff.fonts[0] && cff.fonts[0].charset) {
			const charset = cff.fonts[0].charset;
			const strings = cff.strings || [];
			// Resolve SIDs: 0-390 are standard CFF strings, 391+ are custom
			const resolved = charset.map((sid) => {
				if (typeof sid === 'string') return sid;
				if (typeof sid === 'number' && sid >= 391) {
					const custom = strings[sid - 391];
					return typeof custom === 'string' && custom !== ''
						? custom
						: String(sid);
				}
				return String(sid);
			});
			return ['.notdef', ...resolved];
		}
	}

	// Fallback: generate generic names
	const names = [];
	for (let i = 0; i < numGlyphs; i++) {
		names.push(i === 0 ? '.notdef' : `glyph${i}`);
	}
	return names;
}

/**
 * Build the unified simplified glyphs array.
 */
function buildSimplifiedGlyphs(tables) {
	const isTrueType = tables.glyf && !tables.glyf._raw;
	const isCFF = tables['CFF '] && !tables['CFF ']._raw;
	const hmtx = tables.hmtx && !tables.hmtx._raw ? tables.hmtx : null;
	const vmtx = tables.vmtx && !tables.vmtx._raw ? tables.vmtx : null;
	const hhea = tables.hhea && !tables.hhea._raw ? tables.hhea : null;
	const vhea = tables.vhea && !tables.vhea._raw ? tables.vhea : null;

	// Determine glyph count
	let numGlyphs = 0;
	if (tables.maxp && !tables.maxp._raw) {
		numGlyphs = tables.maxp.numGlyphs;
	} else if (isTrueType) {
		numGlyphs = tables.glyf.glyphs.length;
	} else if (isCFF) {
		numGlyphs = tables['CFF '].fonts[0].charStrings.length;
	} else if (hmtx) {
		numGlyphs = hmtx.hMetrics.length + (hmtx.leftSideBearings?.length || 0);
	}

	const numberOfHMetrics = hhea ? hhea.numberOfHMetrics : numGlyphs;
	const numberOfVMetrics = vhea ? vhea.numOfLongVerMetrics : 0;

	const unicodeMap = buildGlyphToUnicodeMap(tables.cmap);
	const glyphNames = getGlyphNames(tables, numGlyphs);

	const glyphs = [];
	for (let i = 0; i < numGlyphs; i++) {
		const glyph = {};

		// Name
		if (glyphNames[i]) {
			glyph.name = glyphNames[i];
		}

		// Unicode mapping
		const unicodes = unicodeMap.get(i) || [];
		if (unicodes.length === 1) {
			glyph.unicode = unicodes[0];
		} else if (unicodes.length > 1) {
			glyph.unicode = unicodes[0];
			glyph.unicodes = unicodes;
		} else {
			glyph.unicode = null;
		}

		// Horizontal metrics
		if (hmtx) {
			if (i < numberOfHMetrics) {
				glyph.advanceWidth = hmtx.hMetrics[i].advanceWidth;
				glyph.leftSideBearing = hmtx.hMetrics[i].lsb;
			} else {
				// Use last hMetric's advanceWidth
				glyph.advanceWidth = hmtx.hMetrics[numberOfHMetrics - 1].advanceWidth;
				glyph.leftSideBearing = hmtx.leftSideBearings[i - numberOfHMetrics];
			}
		}

		// Vertical metrics
		if (vmtx) {
			if (i < numberOfVMetrics) {
				glyph.advanceHeight = vmtx.vMetrics[i].advanceHeight;
				glyph.topSideBearing = vmtx.vMetrics[i].topSideBearing;
			} else if (vmtx.topSideBearings) {
				glyph.advanceHeight = vmtx.vMetrics[numberOfVMetrics - 1].advanceHeight;
				glyph.topSideBearing = vmtx.topSideBearings[i - numberOfVMetrics];
			}
		}

		// TrueType outlines
		if (isTrueType) {
			const rawGlyph = tables.glyf.glyphs[i];
			if (rawGlyph && rawGlyph.type === 'simple') {
				glyph.contours = rawGlyph.contours;
				if (rawGlyph.instructions && rawGlyph.instructions.length > 0) {
					glyph.instructions = rawGlyph.instructions;
				}
			} else if (rawGlyph && rawGlyph.type === 'composite') {
				glyph.components = rawGlyph.components;
				if (rawGlyph.instructions && rawGlyph.instructions.length > 0) {
					glyph.instructions = rawGlyph.instructions;
				}
			}
			// null/empty glyphs have no outline data
		}

		// CFF outlines
		if (isCFF) {
			const cffTable = tables['CFF '];
			const font = cffTable.fonts[0];
			const charStrings = font.charStrings;
			if (charStrings[i]) {
				glyph.charString = charStrings[i];
				glyph.charStringDisassembly = disassembleCharString(charStrings[i]);
				// Interpret bytecode into cubic Bézier contours
				const globalSubrs = cffTable.globalSubrs || [];
				const localSubrs = font.localSubrs || [];
				const result = interpretCharString(
					charStrings[i],
					globalSubrs,
					localSubrs,
				);
				if (result.contours.length > 0) {
					glyph.contours = result.contours;
				}
			}
		}

		glyphs.push(glyph);
	}

	return glyphs;
}

// ===========================================================================
//  KERNING
// ===========================================================================

/**
 * Extract kerning pairs from all available sources (GPOS and kern table),
 * resolved to glyph names. GPOS pairs take priority on conflict.
 */
function extractKerning(tables, glyphs) {
	const gposPairs = extractGPOSKerning(tables, glyphs);
	const kernPairs = extractKernTableKerning(tables, glyphs);

	if (gposPairs.length === 0) return kernPairs;
	if (kernPairs.length === 0) return gposPairs;

	// Merge: GPOS wins on conflict, dedup by (left, right)
	const seen = new Map();
	for (const p of gposPairs) {
		seen.set(`${p.left}\0${p.right}`, p);
	}
	for (const p of kernPairs) {
		const key = `${p.left}\0${p.right}`;
		if (!seen.has(key)) {
			seen.set(key, p);
		}
	}
	return Array.from(seen.values());
}

/**
 * Extract kerning pairs from GPOS PairPos lookups tagged with 'kern' feature.
 */
function extractGPOSKerning(tables, glyphs) {
	const gpos = tables.GPOS;
	if (!gpos || gpos._raw || !gpos.featureList || !gpos.lookupList) return [];

	// Find 'kern' feature lookup indices
	const kernLookupIndices = new Set();
	for (const rec of gpos.featureList.featureRecords) {
		if (rec.featureTag === 'kern') {
			for (const idx of rec.feature.lookupListIndices) {
				kernLookupIndices.add(idx);
			}
		}
	}
	if (kernLookupIndices.size === 0) return [];

	const pairs = [];
	for (const idx of kernLookupIndices) {
		const lookup = gpos.lookupList.lookups[idx];
		if (!lookup || lookup.lookupType !== 2) continue; // PairPos only

		for (const st of lookup.subtables) {
			if (st.format === 1) {
				extractPairPosFormat1(st, glyphs, pairs);
			} else if (st.format === 2) {
				extractPairPosFormat2(st, glyphs, pairs);
			}
		}
	}
	return pairs;
}

/**
 * Extract pairs from GPOS PairPos Format 1 (individual glyph pairs).
 */
function extractPairPosFormat1(st, glyphs, pairs) {
	const covGlyphs = expandCoverage(st.coverage);
	for (let i = 0; i < covGlyphs.length && i < st.pairSets.length; i++) {
		const leftGlyph = covGlyphs[i];
		const leftName = glyphs[leftGlyph]?.name || `glyph${leftGlyph}`;
		for (const pvr of st.pairSets[i]) {
			const value = pvr.value1?.xAdvance;
			if (value === undefined || value === 0) continue;
			const rightName =
				glyphs[pvr.secondGlyph]?.name || `glyph${pvr.secondGlyph}`;
			pairs.push({ left: leftName, right: rightName, value });
		}
	}
}

/**
 * Extract pairs from GPOS PairPos Format 2 (class-based).
 * Expands classes to individual glyph pairs; skips zero-value entries.
 */
function extractPairPosFormat2(st, glyphs, pairs) {
	const glyphToClass1 = buildClassMap(st.classDef1, glyphs.length);
	const glyphToClass2 = buildClassMap(st.classDef2, glyphs.length);

	// Build reverse maps: class → glyph indices
	const class1Glyphs = new Map(); // classIdx → [glyphIdx, ...]
	const class2Glyphs = new Map();

	// Only include glyphs in the coverage for class 1 lookups
	const covSet = new Set(expandCoverage(st.coverage));

	for (let g = 0; g < glyphs.length; g++) {
		if (covSet.has(g)) {
			const c1 = glyphToClass1.get(g) ?? 0;
			if (!class1Glyphs.has(c1)) class1Glyphs.set(c1, []);
			class1Glyphs.get(c1).push(g);
		}
		const c2 = glyphToClass2.get(g) ?? 0;
		if (!class2Glyphs.has(c2)) class2Glyphs.set(c2, []);
		class2Glyphs.get(c2).push(g);
	}

	for (let c1 = 0; c1 < st.class1Count; c1++) {
		const leftGlyphs = class1Glyphs.get(c1);
		if (!leftGlyphs) continue;
		for (let c2 = 0; c2 < st.class2Count; c2++) {
			const rec = st.class1Records[c1]?.[c2];
			const value = rec?.value1?.xAdvance;
			if (value === undefined || value === 0) continue;
			const rightGlyphs = class2Glyphs.get(c2);
			if (!rightGlyphs) continue;
			for (const lg of leftGlyphs) {
				const leftName = glyphs[lg]?.name || `glyph${lg}`;
				for (const rg of rightGlyphs) {
					const rightName = glyphs[rg]?.name || `glyph${rg}`;
					pairs.push({ left: leftName, right: rightName, value });
				}
			}
		}
	}
}

/**
 * Expand a Coverage table to an array of glyph indices.
 */
function expandCoverage(coverage) {
	if (coverage.format === 1) return coverage.glyphs;
	if (coverage.format === 2) {
		const result = [];
		for (const range of coverage.ranges) {
			for (let g = range.startGlyphID; g <= range.endGlyphID; g++) {
				result.push(g);
			}
		}
		return result;
	}
	return [];
}

/**
 * Build a Map<glyphIndex, classIndex> from a ClassDef table.
 */
function buildClassMap(classDef, numGlyphs) {
	const map = new Map();
	if (classDef.format === 1) {
		for (let i = 0; i < classDef.classValues.length; i++) {
			map.set(classDef.startGlyphID + i, classDef.classValues[i]);
		}
	} else if (classDef.format === 2) {
		for (const range of classDef.ranges) {
			for (let g = range.startGlyphID; g <= range.endGlyphID; g++) {
				map.set(g, range.class);
			}
		}
	}
	return map;
}

/**
 * Extract kerning pairs from the kern table (all supported formats).
 */
function extractKernTableKerning(tables, glyphs) {
	const kern = tables.kern;
	if (!kern || kern._raw || !kern.subtables) return [];

	const pairs = [];
	for (const subtable of kern.subtables) {
		if (subtable._raw) continue;

		if (subtable.format === 0 && subtable.pairs) {
			// Format 0: ordered pair list (OT and Apple)
			for (const pair of subtable.pairs) {
				const leftName = glyphs[pair.left]?.name || `glyph${pair.left}`;
				const rightName = glyphs[pair.right]?.name || `glyph${pair.right}`;
				pairs.push({
					left: leftName,
					right: rightName,
					value: pair.value,
				});
			}
		} else if (subtable.format === 2 && subtable.values) {
			// Format 2: class-based n×m array (OT and Apple)
			extractKernFormat2Pairs(subtable, glyphs, pairs);
		} else if (subtable.format === 3 && subtable.kernValues) {
			// Format 3: compact class-based (Apple)
			extractKernFormat3Pairs(subtable, glyphs, pairs);
		} else if (subtable.format === 1 && subtable.states) {
			// Format 1: state table contextual kerning (Apple) — best-effort
			extractKernFormat1Pairs(subtable, glyphs, pairs);
		}
	}

	return pairs;
}

/**
 * Extract pairs from kern Format 2 (class-based n×m array).
 * Left/right class tables map glyphs to row/column indices.
 */
function extractKernFormat2Pairs(subtable, glyphs, pairs) {
	const {
		leftClassTable,
		rightClassTable,
		rowWidth,
		kerningArrayOffset,
		values,
	} = subtable;
	if (!values) return;

	const nRightClasses = rowWidth > 0 ? rowWidth / 2 : 0;

	// Build glyph → class index maps
	// Left offsets are pre-multiplied by rowWidth, offset from kerningArrayOffset
	const leftGlyphToClass = new Map();
	for (let i = 0; i < leftClassTable.nGlyphs; i++) {
		const g = leftClassTable.firstGlyph + i;
		const rawOffset = leftClassTable.offsets[i] || 0;
		// Left class = (offset - kerningArrayOffset) / rowWidth
		const classIdx =
			rowWidth > 0
				? Math.floor((rawOffset - kerningArrayOffset) / rowWidth)
				: 0;
		if (classIdx >= 0 && classIdx < values.length) {
			leftGlyphToClass.set(g, classIdx);
		}
	}

	// Right offsets are pre-multiplied by 2 (sizeof int16)
	const rightGlyphToClass = new Map();
	for (let i = 0; i < rightClassTable.nGlyphs; i++) {
		const g = rightClassTable.firstGlyph + i;
		const rawOffset = rightClassTable.offsets[i] || 0;
		const classIdx = Math.floor(rawOffset / 2);
		if (classIdx >= 0 && classIdx < nRightClasses) {
			rightGlyphToClass.set(g, classIdx);
		}
	}

	// Expand class pairs to individual glyph pairs
	for (const [leftGlyph, leftClass] of leftGlyphToClass) {
		const row = values[leftClass];
		if (!row) continue;
		const leftName = glyphs[leftGlyph]?.name || `glyph${leftGlyph}`;
		for (const [rightGlyph, rightClass] of rightGlyphToClass) {
			const value = row[rightClass];
			if (value === 0) continue;
			const rightName = glyphs[rightGlyph]?.name || `glyph${rightGlyph}`;
			pairs.push({ left: leftName, right: rightName, value });
		}
	}
}

/**
 * Extract pairs from kern Format 3 (compact class-based).
 * value = kernValues[kernIndices[leftClass[L] * rightClassCount + rightClass[R]]]
 */
function extractKernFormat3Pairs(subtable, glyphs, pairs) {
	const {
		glyphCount,
		leftClassCount,
		rightClassCount,
		kernValues,
		leftClasses,
		rightClasses,
		kernIndices,
	} = subtable;

	const maxGlyph = Math.min(glyphCount, glyphs.length);

	for (let left = 0; left < maxGlyph; left++) {
		const lc = leftClasses[left];
		if (lc >= leftClassCount) continue;
		const leftName = glyphs[left]?.name || `glyph${left}`;

		for (let right = 0; right < maxGlyph; right++) {
			const rc = rightClasses[right];
			if (rc >= rightClassCount) continue;

			const idx = lc * rightClassCount + rc;
			const kernIdx = kernIndices[idx];
			if (kernIdx === undefined || kernIdx >= kernValues.length) continue;

			const value = kernValues[kernIdx];
			if (value === 0) continue;

			const rightName = glyphs[right]?.name || `glyph${right}`;
			pairs.push({ left: leftName, right: rightName, value });
		}
	}
}

/**
 * Extract pairs from Apple kern Format 1 (state table) — best-effort.
 * Simulates the state machine for each ordered glyph pair in the class table.
 * This is lossy — contextual rules involving 3+ glyph sequences can't be
 * represented as simple pairs.
 */
function extractKernFormat1Pairs(subtable, glyphs, pairs) {
	const {
		stateSize,
		classTable,
		states,
		entryTable,
		valueTable,
		stateArrayOffset,
	} = subtable;
	if (!classTable || !states || !entryTable || !valueTable) return;
	if (states.length === 0 || stateSize === 0) return;

	// Build glyph → class map (classes 0–3 are reserved: EOT, OOB, deleted, EOL)
	const glyphToClass = new Map();
	for (let i = 0; i < classTable.nGlyphs; i++) {
		const g = classTable.firstGlyph + i;
		const c = classTable.classArray[i];
		if (c >= 4) {
			// only user-defined classes
			glyphToClass.set(g, c);
		}
	}

	// Collect all glyphs with assigned classes
	const classGlyphs = Array.from(glyphToClass.keys());
	if (classGlyphs.length === 0) return;

	// Simulate for each pair of classified glyphs
	for (const leftGlyph of classGlyphs) {
		for (const rightGlyph of classGlyphs) {
			const value = simulateKernFormat1(
				leftGlyph,
				rightGlyph,
				glyphToClass,
				states,
				entryTable,
				valueTable,
				stateSize,
				stateArrayOffset,
			);
			if (value !== 0) {
				const leftName = glyphs[leftGlyph]?.name || `glyph${leftGlyph}`;
				const rightName = glyphs[rightGlyph]?.name || `glyph${rightGlyph}`;
				pairs.push({ left: leftName, right: rightName, value });
			}
		}
	}
}

/**
 * Simulate the Apple kern Format 1 state machine for a two-glyph sequence.
 * Returns the total kerning value applied to the first glyph.
 */
function simulateKernFormat1(
	leftGlyph,
	rightGlyph,
	glyphToClass,
	states,
	entryTable,
	valueTable,
	stateSize,
	stateArrayOffset,
) {
	let stateIdx = 0; // start-of-text state
	let totalKern = 0;
	const kernStack = [];

	const sequence = [leftGlyph, rightGlyph];

	for (const glyph of sequence) {
		const glyphClass = glyphToClass.get(glyph) ?? 1; // 1 = out-of-bounds
		if (glyphClass >= stateSize || stateIdx >= states.length) break;

		const entryIdx = states[stateIdx][glyphClass];
		if (entryIdx === undefined || entryIdx >= entryTable.length) break;

		const entry = entryTable[entryIdx];
		const push = (entry.flags & 0x8000) !== 0;
		const valueOffset = entry.flags & 0x3fff;

		if (push) {
			kernStack.push(glyph);
		}

		if (valueOffset > 0 && kernStack.length > 0) {
			// valueOffset is byte offset from start of subtable to value table;
			// convert to index into our valueTable array
			const baseIdx = Math.floor((valueOffset - (valueTable._offset || 0)) / 2);
			for (let k = 0; k < kernStack.length; k++) {
				const vidx = baseIdx + k;
				if (vidx >= 0 && vidx < valueTable.length) {
					const v = valueTable[vidx];
					// Check for end-of-list marker (odd value)
					const isLast = (v & 1) !== 0;
					totalKern += isLast ? v & ~1 : v;
					if (isLast) break;
				}
			}
			kernStack.length = 0;
		}

		// Advance state: newStateOffset is byte offset from stateArrayOffset
		const newStateByteOffset = entry.newStateOffset;
		stateIdx =
			stateSize > 0
				? Math.floor((newStateByteOffset - stateArrayOffset) / stateSize)
				: 0;
		if (stateIdx < 0 || stateIdx >= states.length) stateIdx = 0;
	}

	return totalKern;
}

// ===========================================================================
//  VARIABLE FONT
// ===========================================================================

/**
 * Extract variation axes from fvar, resolving nameIDs to strings.
 */
function extractAxes(tables) {
	const fvar = tables.fvar;
	if (!fvar || fvar._raw || !fvar.axes) return [];

	return fvar.axes.map((axis) => ({
		tag: axis.axisTag,
		name: getBestName(tables.name, axis.axisNameID) || axis.axisTag,
		min: axis.minValue,
		default: axis.defaultValue,
		max: axis.maxValue,
		hidden: (axis.flags & 0x0001) !== 0,
	}));
}

/**
 * Extract named instances from fvar, resolving nameIDs to strings.
 */
function extractInstances(tables) {
	const fvar = tables.fvar;
	if (!fvar || fvar._raw || !fvar.instances) return [];

	const axes = fvar.axes;
	return fvar.instances.map((inst) => {
		const coordinates = {};
		for (let j = 0; j < axes.length; j++) {
			coordinates[axes[j].axisTag] = inst.coordinates[j];
		}
		const instance = {
			name:
				getBestName(tables.name, inst.subfamilyNameID) ||
				`Instance ${inst.subfamilyNameID}`,
			coordinates,
		};
		if (inst.postScriptNameID !== undefined) {
			const psName = getBestName(tables.name, inst.postScriptNameID);
			if (psName) instance.postScriptName = psName;
		}
		return instance;
	});
}

// ===========================================================================
//  TIMESTAMP CONVERSION
// ===========================================================================

/**
 * OpenType epoch: 1904-01-01 00:00:00 UTC in milliseconds from Unix epoch.
 */
const OT_EPOCH_MS = Date.UTC(1904, 0, 1, 0, 0, 0);

/**
 * Convert an OpenType longdatetime (BigInt, seconds since 1904) to ISO 8601 string.
 * Returns undefined if the input is null/undefined/0.
 */
export function longdatetimeToISO(value) {
	if (value === undefined || value === null) return undefined;
	const bigVal = typeof value === 'bigint' ? value : BigInt(value);
	if (bigVal === 0n) return undefined;
	const ms = Number(bigVal) * 1000 + OT_EPOCH_MS;
	if (!Number.isFinite(ms) || ms < -8640000000000000 || ms > 8640000000000000) {
		return undefined;
	}
	return new Date(ms).toISOString();
}

/**
 * Convert an ISO 8601 string to OpenType longdatetime (BigInt).
 */
export function isoToLongdatetime(isoString) {
	if (!isoString) return 0n;
	const ms = Date.parse(isoString);
	if (isNaN(ms)) return 0n;
	return BigInt(Math.floor((ms - OT_EPOCH_MS) / 1000));
}

// ===========================================================================
//  GSUB SUBSTITUTION EXTRACTION
// ===========================================================================

/** GSUB lookup types that can be simplified. */
const SIMPLIFIABLE_GSUB_TYPES = new Set([1, 2, 3, 4, 8]);

/**
 * Extract GSUB substitution rules into simplified form.
 * Types 1-4 and 8 are decomposed. Types 5/6 (contextual) are preserved
 * as raw lookups for lossless round-trip.
 *
 * @param {object} gsub - Parsed GSUB table.
 * @param {object[]} glyphs - Simplified glyphs array (for name resolution).
 * @returns {{ substitutions: object[], rawLookups: object[] }}
 */
function extractSubstitutions(gsub, glyphs) {
	const substitutions = [];
	const rawLookups = [];

	if (!gsub.featureList || !gsub.lookupList) {
		return { substitutions, rawLookups };
	}

	// Build feature→lookup mapping: for each feature, which lookups it uses
	// and what script/language associations it has.
	const featureInfo = buildFeatureInfo(gsub);

	// Classify each lookup
	const lookups = gsub.lookupList.lookups;
	const simplifiedLookupIndices = new Set();

	for (let i = 0; i < lookups.length; i++) {
		const lookup = lookups[i];
		if (!lookup) continue;

		if (SIMPLIFIABLE_GSUB_TYPES.has(lookup.lookupType)) {
			// Find all features referencing this lookup
			const featureRefs = featureInfo.lookupToFeatures.get(i) || [];

			// Extract the lookup's rules ONCE, then create one rule per
			// unique feature tag (with its first script/language association).
			// This avoids duplicating all rules for every script/language combo.
			const uniqueFeatures = deduplicateFeatureRefs(featureRefs);

			for (const ref of uniqueFeatures) {
				const rules = extractLookupSubstitutions(
					lookup,
					glyphs,
					ref.featureTag,
					ref.script,
					ref.language,
					ref.allScripts,
				);
				substitutions.push(...rules);
			}

			// If no feature references this lookup, still extract with defaults
			if (uniqueFeatures.length === 0) {
				const rules = extractLookupSubstitutions(
					lookup,
					glyphs,
					'DFLT',
					'DFLT',
					null,
				);
				substitutions.push(...rules);
			}

			simplifiedLookupIndices.add(i);
		}
	}

	// Collect raw lookups (types 5/6 and any unhandled)
	for (let i = 0; i < lookups.length; i++) {
		if (!simplifiedLookupIndices.has(i) && lookups[i]) {
			rawLookups.push({
				index: i,
				lookup: lookups[i],
				features: featureInfo.lookupToFeatures.get(i) || [],
			});
		}
	}

	return { substitutions, rawLookups };
}

/**
 * Build a mapping of feature tags and script/language to lookup indices,
 * and the reverse mapping from lookup index to feature references.
 */
function buildFeatureInfo(gsub) {
	const lookupToFeatures = new Map();

	const scriptRecords = gsub.scriptList?.scriptRecords || [];
	const featureRecords = gsub.featureList?.featureRecords || [];

	for (const scriptRec of scriptRecords) {
		const scriptTag = scriptRec.scriptTag;
		const script = scriptRec.script;

		// Process defaultLangSys
		if (script.defaultLangSys) {
			processLangSys(
				script.defaultLangSys,
				scriptTag,
				null,
				featureRecords,
				lookupToFeatures,
			);
		}

		// Process each langSysRecord
		for (const langRec of script.langSysRecords || []) {
			processLangSys(
				langRec.langSys,
				scriptTag,
				langRec.langSysTag,
				featureRecords,
				lookupToFeatures,
			);
		}
	}

	return { lookupToFeatures };
}

/**
 * Deduplicate feature references: keep one entry per unique featureTag.
 * When a lookup is referenced by the same feature tag from multiple
 * script/language pairs, we only need one simplified rule set — the
 * expand step will reconstruct all script/language associations.
 *
 * Preserves ALL unique script/language pairs per feature tag so the
 * expand step can rebuild the scriptList correctly.
 */
function deduplicateFeatureRefs(featureRefs) {
	const byTag = new Map();
	for (const ref of featureRefs) {
		if (!byTag.has(ref.featureTag)) {
			byTag.set(ref.featureTag, {
				featureTag: ref.featureTag,
				script: ref.script,
				language: ref.language,
				allScripts: [{ script: ref.script, language: ref.language }],
			});
		} else {
			byTag.get(ref.featureTag).allScripts.push({
				script: ref.script,
				language: ref.language,
			});
		}
	}
	return Array.from(byTag.values());
}

function processLangSys(
	langSys,
	scriptTag,
	languageTag,
	featureRecords,
	lookupToFeatures,
) {
	for (const featureIdx of langSys.featureIndices || []) {
		const featureRec = featureRecords[featureIdx];
		if (!featureRec) continue;

		for (const lookupIdx of featureRec.feature.lookupListIndices || []) {
			if (!lookupToFeatures.has(lookupIdx)) {
				lookupToFeatures.set(lookupIdx, []);
			}
			const refs = lookupToFeatures.get(lookupIdx);
			// Avoid duplicates
			const exists = refs.some(
				(r) =>
					r.featureTag === featureRec.featureTag &&
					r.script === scriptTag &&
					r.language === languageTag,
			);
			if (!exists) {
				refs.push({
					featureTag: featureRec.featureTag,
					script: scriptTag,
					language: languageTag,
				});
			}
		}
	}
}

/**
 * Extract simplified substitution rules from a single GSUB lookup.
 */
function extractLookupSubstitutions(
	lookup,
	glyphs,
	featureTag,
	script,
	language,
	allScripts,
) {
	const rules = [];
	const base = { feature: featureTag, script, language };
	if (allScripts) base.allScripts = allScripts;

	for (const st of lookup.subtables || []) {
		switch (lookup.lookupType) {
			case 1:
				extractSingleSubst(st, glyphs, base, rules);
				break;
			case 2:
				extractMultipleSubst(st, glyphs, base, rules);
				break;
			case 3:
				extractAlternateSubst(st, glyphs, base, rules);
				break;
			case 4:
				extractLigatureSubst(st, glyphs, base, rules);
				break;
			case 8:
				extractReverseChainSubst(st, glyphs, base, rules);
				break;
		}
	}
	return rules;
}

/** Resolve glyph ID to name. */
function glyphName(glyphs, gid) {
	return glyphs[gid]?.name || `glyph${gid}`;
}

/** Type 1: Single substitution. */
function extractSingleSubst(st, glyphs, base, rules) {
	const covGlyphs = expandCoverage(st.coverage);

	if (st.format === 1) {
		for (const gid of covGlyphs) {
			const toGid = (gid + st.deltaGlyphID) & 0xffff;
			rules.push({
				type: 'single',
				...base,
				from: glyphName(glyphs, gid),
				to: glyphName(glyphs, toGid),
			});
		}
	} else if (st.format === 2) {
		for (let i = 0; i < covGlyphs.length; i++) {
			rules.push({
				type: 'single',
				...base,
				from: glyphName(glyphs, covGlyphs[i]),
				to: glyphName(glyphs, st.substituteGlyphIDs[i]),
			});
		}
	}
}

/** Type 2: Multiple substitution. */
function extractMultipleSubst(st, glyphs, base, rules) {
	const covGlyphs = expandCoverage(st.coverage);
	for (let i = 0; i < covGlyphs.length; i++) {
		rules.push({
			type: 'multiple',
			...base,
			from: glyphName(glyphs, covGlyphs[i]),
			to: (st.sequences[i] || []).map((gid) => glyphName(glyphs, gid)),
		});
	}
}

/** Type 3: Alternate substitution. */
function extractAlternateSubst(st, glyphs, base, rules) {
	const covGlyphs = expandCoverage(st.coverage);
	for (let i = 0; i < covGlyphs.length; i++) {
		rules.push({
			type: 'alternate',
			...base,
			from: glyphName(glyphs, covGlyphs[i]),
			alternates: (st.alternateSets[i] || []).map((gid) =>
				glyphName(glyphs, gid),
			),
		});
	}
}

/** Type 4: Ligature substitution. */
function extractLigatureSubst(st, glyphs, base, rules) {
	const covGlyphs = expandCoverage(st.coverage);
	for (let i = 0; i < covGlyphs.length; i++) {
		const ligatureSet = st.ligatureSets[i] || [];
		for (const lig of ligatureSet) {
			const components = [
				glyphName(glyphs, covGlyphs[i]),
				...lig.componentGlyphIDs.map((gid) => glyphName(glyphs, gid)),
			];
			rules.push({
				type: 'ligature',
				...base,
				components,
				ligature: glyphName(glyphs, lig.ligatureGlyph),
			});
		}
	}
}

/** Type 8: Reverse chained contexts single substitution. */
function extractReverseChainSubst(st, glyphs, base, rules) {
	const covGlyphs = expandCoverage(st.coverage);
	for (let i = 0; i < covGlyphs.length; i++) {
		rules.push({
			type: 'reverse',
			...base,
			from: glyphName(glyphs, covGlyphs[i]),
			to: glyphName(glyphs, st.substituteGlyphIDs[i]),
			backtrack: (st.backtrackCoverages || []).map((cov) =>
				expandCoverage(cov).map((gid) => glyphName(glyphs, gid)),
			),
			lookahead: (st.lookaheadCoverages || []).map((cov) =>
				expandCoverage(cov).map((gid) => glyphName(glyphs, gid)),
			),
		});
	}
}
