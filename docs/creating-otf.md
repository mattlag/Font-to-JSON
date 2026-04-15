# Creating an OTF

This guide is for building a single CFF-based OpenType font (`.otf`).

## Required tables

These are the practical minimum required by Font Flux validation for a valid single-font export.

- [`cmap`](./tables/cmap.md): Unicode code point to glyph mapping.
- [`head`](./tables/head.md): Global font header and bounds metadata.
- [`hhea`](./tables/hhea.md): Horizontal layout header values.
- [`hmtx`](./tables/hmtx.md): Horizontal advance/side-bearing metrics.
- [`maxp`](./tables/maxp.md): Glyph count and profile limits.
- [`name`](./tables/name.md): Family/style/version naming records.
- [`post`](./tables/post.md): PostScript-oriented metadata.

Outline requirement (choose exactly one):

- [`CFF `](./tables/CFF.md): Compact Font Format v1 outlines.
- [`CFF2`](./tables/CFF2.md): Compact Font Format v2 outlines.

## Strongly recommended

- [`OS/2`](./tables/OS-2.md): Platform metrics/flags used widely by layout engines.

## Optional tables (grouped by function)

### Layout and Typography

- [`BASE`](./tables/BASE.md): Baseline coordination across scripts.
- [`GDEF`](./tables/GDEF.md): Glyph classes and attachment metadata for layout.
- [`GPOS`](./tables/GPOS.md): Advanced glyph positioning rules.
- [`GSUB`](./tables/GSUB.md): Advanced glyph substitution rules.
- [`JSTF`](./tables/JSTF.md): Script-specific justification behavior.
- [`kern`](./tables/kern.md): Legacy kerning pairs.
- [`MATH`](./tables/MATH.md): Math typography layout data.

### Variations (Variable Fonts)

- [`fvar`](./tables/fvar.md): Variation axis definitions.
- [`avar`](./tables/avar.md): Non-linear axis mapping.
- [`STAT`](./tables/STAT.md): Style attributes and axis naming.
- [`HVAR`](./tables/HVAR.md): Horizontal metrics variation deltas.
- [`MVAR`](./tables/MVAR.md): Global metrics variation deltas.
- [`VVAR`](./tables/VVAR.md): Vertical metrics variation deltas.

### Color and Emoji Presentation

- [`COLR`](./tables/COLR.md): Layered or paint-graph color glyph composition.
- [`CPAL`](./tables/CPAL.md): Color palettes consumed by COLR.
- [`SVG `](./tables/SVG.md): SVG glyph outlines.
- [`CBDT`](./tables/CBDT.md): Color bitmap glyph image data.
- [`CBLC`](./tables/CBLC.md): Index/location data for CBDT strikes.
- [`EBDT`](./tables/EBDT.md): Embedded bitmap glyph image data.
- [`EBLC`](./tables/EBLC.md): Embedded bitmap location/index data.
- [`EBSC`](./tables/EBSC.md): Embedded bitmap scaling metadata.
- [`sbix`](./tables/sbix.md): Apple bitmap glyphs.

### Vertical Layout

- [`vhea`](./tables/vhea.md): Vertical header metrics.
- [`vmtx`](./tables/vmtx.md): Vertical metrics per glyph.
- [`VORG`](./tables/VORG.md): CFF vertical origin defaults.

### Device, Grid-Fit, and Legacy Metrics

- [`hdmx`](./tables/hdmx.md): Device-specific horizontal metrics.
- [`LTSH`](./tables/LTSH.md): Linear threshold hints.
- [`VDMX`](./tables/VDMX.md): Vertical device metrics data.
- [`PCLT`](./tables/PCLT.md): PCL printer-oriented metrics.

### Metadata and Miscellaneous

- [`meta`](./tables/meta.md): Arbitrary metadata tags.
- [`DSIG`](./tables/DSIG.md): Digital signature container (legacy/deprecated use).
- [`MERG`](./tables/MERG.md): Merge metadata (rare).

## Notes

- Use [`CFF `](./tables/CFF.md) for CFF v1 workflows and [`CFF2`](./tables/CFF2.md) for modern variable-friendly CFF2 workflows.

## Working with CFF outlines

CFF fonts store glyph outlines as Type 2 charstring byte arrays — an opaque binary program format. Font Flux decodes these into editable cubic Bézier contour data.

### Reading outlines

When you open an OTF with `FontFlux.open()`, each glyph includes:

- `contours` — decoded cubic Bézier commands: `M` (moveTo), `L` (lineTo), `C` (curveTo)
- `charString` — the raw charstring bytes (for lossless export)
- `charStringDisassembly` — human-readable charstring text

```js
const font = FontFlux.open(buffer);
const glyph = font.getGlyph('A');
console.log(glyph.contours); // [[{ type: 'M', x, y }, { type: 'C', ... }, ...]]
console.log(glyph.charStringDisassembly); // "100 700 rmoveto 300 0 rlineto ..."
```

For table-level work, use `FontFlux.interpretCharString()` and `FontFlux.disassembleCharString()` directly on charstring byte arrays. See the [`CFF `](./tables/CFF.md#interpreting-charstrings) or [`CFF2`](./tables/CFF2.md#interpreting-charstrings) table docs.

### Editing outlines via SVG

Convert contours to SVG path strings for visual editing, then convert back:

```js
import { FontFlux } from 'font-flux-js';

const svg = FontFlux.contoursToSVG(glyph.contours); // "M100 700 C... Z"
// ... edit the SVG path string ...
const newContours = FontFlux.svgToContours(svg, 'cff');
```

CFF outlines produce `C` (cubic) SVG commands. The round-trip is lossless for cubic paths. See the [SVG path conversion docs](./index.md#svg-path-conversion) for details on supported SVG commands and coordinate handling.

### Creating CFF glyphs from scratch

For a complete guide to hand-authoring glyph data — including `.addGlyph()`, all outline formats, metadata reference, and examples — see [Creating Glyphs](./creating-glyphs.md).

- Keep required metrics tables (`head`, `hhea`, `hmtx`, `maxp`) consistent with your outline and glyph count.
- Validate early with [`.validate()`](./validation.md).

## Creating an OTC (OpenType Collection)

An `.otc` file bundles multiple CFF-based OpenType font faces into a single binary. Each face is a complete OTF — it must satisfy all the requirements above.

### Required collection shape

At the top level, collection JSON uses this shape:

```json
{
	"collection": {
		"tag": "ttcf",
		"majorVersion": 2,
		"minorVersion": 0,
		"numFonts": 2
	},
	"fonts": [
		{ "header": {}, "tables": {} },
		{ "header": {}, "tables": {} }
	]
}
```

Each entry in `fonts[]` is validated as a normal single font — it needs the same required tables listed above (`cmap`, `head`, `hhea`, `hmtx`, `maxp`, `name`, `post`, plus `CFF` or `CFF2`).

### Optional collection-level fields

- `collection.dsigTag`: DSIG tag for TTC v2+ metadata.
- `collection.dsigLength`: DSIG block length.
- `collection.dsigOffset`: DSIG block offset.

### Notes

- `collection.numFonts` should match `fonts.length`.
- Faces in a collection can mix CFF v1 and CFF v2 as long as each face is internally valid.
- Validate full collection JSON with [`.validate()`](./validation.md) before export.
