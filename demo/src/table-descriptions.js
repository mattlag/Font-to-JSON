/**
 * One-sentence descriptions for every OpenType / TrueType / CFF font table.
 * Keyed by the canonical 4-character tag (with trailing spaces where the spec requires them).
 * A trimmed-key lookup is also exported for convenience.
 */
export const TABLE_DESCRIPTIONS = {
	avar: 'Maps axis coordinates to modified values, enabling non-linear interpolation for variable fonts.',
	BASE: 'Defines baseline positions for scripts and languages used in horizontal and vertical text layout.',
	bdat: 'Stores bitmap glyph image data in Apple-format bitmap fonts.',
	bloc: 'Indexes the location of bitmap glyph data within the bdat table for Apple-format bitmap fonts.',
	CBDT: 'Stores color bitmap glyph image data, commonly used for color emoji.',
	CBLC: 'Indexes the location and format of color bitmap glyphs within the CBDT table.',
	'CFF ':
		'Contains PostScript-flavored (Type 2) cubic Bézier glyph outlines for CFF-based OpenType fonts.',
	CFF2: 'Contains variable PostScript glyph outlines with blend operators for CFF2-based variable fonts.',
	cmap: 'Maps character codes (Unicode codepoints) to glyph indices.',
	COLR: 'Defines multi-colored glyphs using layered glyph references (v0) or a full paint graph (v1).',
	CPAL: 'Provides named color palettes used by the COLR table for multi-colored glyphs.',
	'cvt ':
		'Stores TrueType control values used by glyph hinting instructions to ensure consistent rendering.',
	cvar: 'Provides variation deltas for CVT values across the design space of a TrueType variable font.',
	DSIG: 'Contains a digital signature for verifying the integrity and origin of the font file.',
	EBDT: 'Stores embedded bitmap glyph image data for screen-optimized rendering at specific sizes.',
	EBLC: 'Indexes the location and format of embedded bitmap glyphs within the EBDT table.',
	EBSC: 'Defines scaling rules that map bitmap strikes to other sizes when exact-size bitmaps are unavailable.',
	FFTM: 'A non-standard table added by FontForge that stores font creation and modification timestamps.',
	fpgm: 'Contains the TrueType font program - global hinting instructions executed once when the font is loaded.',
	fvar: 'Defines the variation axes (e.g. weight, width) and their ranges for a variable font.',
	gasp: 'Controls grid-fitting (hinting) and anti-aliasing behavior at different pixel sizes.',
	GDEF: 'Classifies glyphs (base, ligature, mark, component) and provides attachment and ligature caret data for layout.',
	glyf: 'Stores TrueType glyph outlines as quadratic Bézier contours and composite glyph references.',
	GPOS: 'Defines glyph positioning rules - kerning, mark placement, cursive attachment, and other adjustments.',
	GSUB: 'Defines glyph substitution rules - ligatures, alternates, contextual forms, and other replacements.',
	gvar: 'Stores per-glyph variation deltas for interpolating TrueType outlines across the design space.',
	hdmx: 'Caches pre-computed horizontal device metrics (advance widths) at specific pixel sizes for faster rendering.',
	head: 'Contains global font metadata - units per em, bounding box, creation dates, and format flags.',
	hhea: 'Provides horizontal layout metrics - ascender, descender, line gap, and caret slope for horizontal text.',
	hmtx: 'Stores per-glyph horizontal metrics - advance width and left side bearing for each glyph.',
	HVAR: 'Provides variation deltas for horizontal metrics (advance widths and side bearings) in variable fonts.',
	JSTF: 'Defines justification rules - glyph- and language-level adjustments for justified text layout.',
	kern: 'Contains legacy kerning pair adjustments for horizontal glyph positioning (superseded by GPOS).',
	loca: 'Maps glyph indices to byte offsets within the glyf table for TrueType fonts.',
	ltag: 'Stores IETF language tags referenced by other tables for Apple-platform language identification.',
	LTSH: 'Records the pixel size at which each glyph transitions from needing hinting to rendering well without it.',
	MATH: 'Provides metrics, glyph variants, and assembly rules for mathematical typesetting layout.',
	maxp: 'Declares maximum resource limits - glyph count, point/contour maximums, and stack depths.',
	MERG: 'Contains merge rules that control how glyphs combine when fonts are merged together.',
	meta: 'Stores font-level metadata as tagged key-value pairs (e.g. design languages, supported scripts).',
	MVAR: 'Provides variation deltas for global font metrics (ascender, descender, caret offset, etc.) in variable fonts.',
	name: 'Contains human-readable strings - font name, designer, license, description, and other identifiers.',
	'OS/2':
		'Stores OS/2 and Windows-specific metrics - weight class, width class, Unicode ranges, and embedding flags.',
	PCLT: 'Contains PCL 5 printer compatibility data - typeface number, pitch, symbol set, and style.',
	post: 'Provides PostScript name mappings for glyphs and global italic angle and underline metrics.',
	prep: 'Contains the TrueType control value program - hinting instructions executed before each glyph is rendered.',
	sbix: 'Stores resolution-dependent bitmap or vector (PNG, JPEG, TIFF) glyph images, commonly used by Apple.',
	STAT: 'Describes design attributes (axis values and names) for presenting variable and non-variable font families.',
	'SVG ':
		'Contains SVG documents that define glyph appearances as scalable vector graphics.',
	VDMX: 'Stores pre-computed vertical device metrics to prevent clipping at specific pixel sizes on Windows.',
	vhea: 'Provides vertical layout metrics - ascender, descender, and line gap for vertical text.',
	vmtx: 'Stores per-glyph vertical metrics - advance height and top side bearing for each glyph.',
	VORG: 'Defines vertical origin positions for CFF/CFF2 glyphs used in vertical text layout.',
	VVAR: 'Provides variation deltas for vertical metrics (advance heights and side bearings) in variable fonts.',
};

/**
 * Look up a table description by tag. Handles trimmed and untrimmed tags.
 */
export function getTableDescription(tag) {
	return TABLE_DESCRIPTIONS[tag] || TABLE_DESCRIPTIONS[tag.trim()] || null;
}
