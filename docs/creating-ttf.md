# Creating a TTF

This guide is for building a single TrueType font (`.ttf`).

## Required tables

These are the practical minimum required by Font Flux validation for a valid single-font export.

- [`cmap`](./tables/cmap.md): Unicode code point to glyph mapping.
- [`head`](./tables/head.md): Global font header and bounds metadata.
- [`hhea`](./tables/hhea.md): Horizontal layout header values.
- [`hmtx`](./tables/hmtx.md): Horizontal advance/side-bearing metrics.
- [`maxp`](./tables/maxp.md): Glyph count and profile limits.
- [`name`](./tables/name.md): Family/style/version naming records.
- [`post`](./tables/post.md): PostScript-oriented metadata.

Outline requirement (both required):

- [`glyf`](./tables/glyf.md): Glyph outlines/instructions.
- [`loca`](./tables/loca.md): Offsets into `glyf` data.

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

### TrueType Hinting and Grid-Fit

- [`cvt `](./tables/cvt.md): Control Value Table for hinting.
- [`fpgm`](./tables/fpgm.md): Font program instructions.
- [`prep`](./tables/prep.md): Pre-program instructions.
- [`gasp`](./tables/gasp.md): Grid-fitting and scan-conversion behavior.

### Variations (Variable Fonts)

- [`fvar`](./tables/fvar.md): Variation axis definitions.
- [`avar`](./tables/avar.md): Non-linear axis mapping.
- [`STAT`](./tables/STAT.md): Style attributes and axis naming.
- [`gvar`](./tables/gvar.md): Glyph variation data.
- [`cvar`](./tables/cvar.md): CVT variation deltas.
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

### Device, Metrics, and Legacy Compatibility

- [`hdmx`](./tables/hdmx.md): Device-specific horizontal metrics.
- [`LTSH`](./tables/LTSH.md): Linear threshold hints.
- [`VDMX`](./tables/VDMX.md): Vertical device metrics data.
- [`PCLT`](./tables/PCLT.md): PCL printer-oriented metrics.

### Metadata and Miscellaneous

- [`meta`](./tables/meta.md): Arbitrary metadata tags.
- [`DSIG`](./tables/DSIG.md): Digital signature container (legacy/deprecated use).
- [`MERG`](./tables/MERG.md): Merge metadata (rare).

## Notes

- `loca` must match `glyf` layout and `head.indexToLocFormat`.
- If you use variable-font tables (`fvar`, `gvar`, `avar`, `HVAR`, `MVAR`, `VVAR`, `cvar`), keep axis and tuple assumptions consistent.
- Validate early with [`validateJSON`](./guide/validation.md).

## Working with TrueType outlines

TrueType fonts store glyph outlines as quadratic Bézier contours in the `glyf` table. Each contour is an array of points with `x`, `y`, and `onCurve` properties.

### Reading outlines

When you import a TTF with `importFont`, each glyph’s `contours` array contains point arrays:

```js
const font = importFont(buffer);
const glyph = font.glyphs.find((g) => g.name === 'A');
console.log(glyph.contours);
// [[ { x: 0, y: 0, onCurve: true }, { x: 100, y: 200, onCurve: false }, ... ]]
```

- `onCurve: true` — on-curve anchor or line endpoint.
- `onCurve: false` — off-curve quadratic control point.
- Consecutive off-curve points have an implied on-curve midpoint between them.

See the [`glyf` table docs](./tables/glyf.md#truetype-contour-format) for detailed format documentation.

### Editing outlines via SVG

Convert contours to SVG path strings for visual editing, then convert back:

```js
import { contoursToSVGPath, svgPathToContours } from 'font-flux';

const svg = contoursToSVGPath(glyph.contours); // "M0 0 Q100 200 200 0 Z"
// ... edit the SVG path string ...
const newContours = svgPathToContours(svg, 'truetype');
```

TrueType outlines produce `Q` (quadratic) SVG commands. The round-trip is lossless for quadratic paths. If the SVG contains cubic `C` commands, they are approximated as quadratic curves (subdivision with 0.5-unit error threshold).

See the [SVG path conversion docs](./index.md#svg-path-conversion) for details on supported SVG commands and coordinate handling.

### Creating TrueType glyphs from scratch

For a complete guide to hand-authoring glyph data — including the `createGlyph` helper, all outline formats, metadata reference, and examples — see [Creating Glyphs](./creating-glyphs.md).

## Creating a TTC (TrueType Collection)

A `.ttc` file bundles multiple TrueType font faces into a single binary. Each face is a complete TTF — it must satisfy all the requirements above.

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

Each entry in `fonts[]` is validated as a normal single font — it needs the same required tables listed above (`cmap`, `head`, `hhea`, `hmtx`, `maxp`, `name`, `post`, `glyf`, `loca`).

### Optional collection-level fields

- `collection.dsigTag`: DSIG tag for TTC v2+ metadata.
- `collection.dsigLength`: DSIG block length.
- `collection.dsigOffset`: DSIG block offset.

### Notes

- `collection.numFonts` should match `fonts.length`.
- Validate full collection JSON with [`validateJSON`](./guide/validation.md) before export.
