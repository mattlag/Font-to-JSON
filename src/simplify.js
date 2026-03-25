/**
 * Font Flux JS : Simplify
 * Derives a human-friendly `simplified` object from the `raw` parsed font data.
 *
 * The simplified structure consolidates data scattered across many tables into
 * a single coherent view: glyphs are self-contained, font metadata is flat
 * strings, and metrics live in one place.
 */

// ===========================================================================
//  MAIN ENTRY
// ===========================================================================

/**
 * Tables that are fully decomposed into top-level simplified fields.
 * These are NOT passed through to the `tables` property because their
 * data is already represented in font info, glyphs, kerning, etc.
 */
const DECOMPOSED_TABLES = new Set([
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

	// OpenType layout features (passthrough: GPOS, GSUB, GDEF)
	const features = {};
	if (tables.GPOS && !tables.GPOS._raw) features.GPOS = tables.GPOS;
	if (tables.GSUB && !tables.GSUB._raw) features.GSUB = tables.GSUB;
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

	// CFF charset has glyph names
	if (tables['CFF '] && !tables['CFF ']._raw) {
		const cff = tables['CFF '];
		if (cff.fonts && cff.fonts[0] && cff.fonts[0].charset) {
			// CFF charset includes .notdef implicitly at index 0
			return ['.notdef', ...cff.fonts[0].charset];
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
			const charStrings = tables['CFF '].fonts[0].charStrings;
			if (charStrings[i]) {
				glyph.charString = charStrings[i];
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
 * Extract kerning pairs from kern table, resolved to glyph names.
 */
function extractKerning(tables, glyphs) {
	const kern = tables.kern;
	if (!kern || kern._raw || !kern.subtables) return [];

	const pairs = [];
	for (const subtable of kern.subtables) {
		if (subtable.format === 0 && subtable.pairs) {
			for (const pair of subtable.pairs) {
				const leftName = glyphs[pair.left]?.name || `glyph${pair.left}`;
				const rightName = glyphs[pair.right]?.name || `glyph${pair.right}`;
				pairs.push({
					left: leftName,
					right: rightName,
					value: pair.value,
				});
			}
		}
	}

	return pairs;
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
