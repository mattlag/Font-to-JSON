# Table References

Use these pages when hand-authoring table JSON fragments.

## Shared SFNT Tables

### Required Tables

- [`cmap`](./cmap.md) — Character to glyph mapping
- [`head`](./head.md) — Font header
- [`hhea`](./hhea.md) — Horizontal header
- [`hmtx`](./hmtx.md) — Horizontal metrics
- [`maxp`](./maxp.md) — Maximum profile
- [`name`](./name.md) — Naming table
- [`OS/2`](./OS-2.md) — OS/2 and Windows specific metrics
- [`post`](./post.md) — PostScript name mapping

### Advanced Typographic Tables

- [`GDEF`](./GDEF.md) — Glyph definition data
- [`GPOS`](./GPOS.md) — Glyph positioning data
- [`GSUB`](./GSUB.md) — Glyph substitution data
- [`BASE`](./BASE.md) — Baseline data
- [`JSTF`](./JSTF.md) — Justification data
- [`MATH`](./MATH.md) — Math layout data

### Vertical Metrics

- [`vhea`](./vhea.md) — Vertical metrics header
- [`vmtx`](./vmtx.md) — Vertical metrics

### Bitmap Glyph Tables

- [`EBLC`](./EBLC.md) — Embedded bitmap location data
- [`EBDT`](./EBDT.md) — Embedded bitmap data
- [`EBSC`](./EBSC.md) — Embedded bitmap scaling data
- [`CBLC`](./CBLC.md) — Color bitmap location data
- [`CBDT`](./CBDT.md) — Color bitmap data
- [`sbix`](./sbix.md) — Standard bitmap graphics

### Color Font Tables

- [`COLR`](./COLR.md) — Color table
- [`CPAL`](./CPAL.md) — Color palette table
- [`SVG `](./SVG.md) — SVG glyph descriptions

### Font Variations Tables

- [`fvar`](./fvar.md) — Font variations (defines axes)
- [`avar`](./avar.md) — Axis variations (axis mapping)
- [`STAT`](./STAT.md) — Style attributes
- [`MVAR`](./MVAR.md) — Metrics variations
- [`HVAR`](./HVAR.md) — Horizontal metrics variations
- [`VVAR`](./VVAR.md) — Vertical metrics variations

### Other Shared Tables

- [`kern`](./kern.md) — Kerning (legacy, prefer GPOS)
- [`DSIG`](./DSIG.md) — Digital signature
- [`hdmx`](./hdmx.md) — Horizontal device metrics
- [`LTSH`](./LTSH.md) — Linear threshold data
- [`MERG`](./MERG.md) — Merge
- [`meta`](./meta.md) — Metadata
- [`PCLT`](./PCLT.md) — PCL 5 data
- [`VDMX`](./VDMX.md) — Vertical device metrics

## OTF-Specific Tables

- [`CFF `](./CFF.md) — Compact Font Format 1.0
- [`CFF2`](./CFF2.md) — Compact Font Format 2.0
- [`VORG`](./VORG.md) — Vertical Origin

## TTF-Specific Tables

### Outline Tables

- [`glyf`](./glyf.md) — Glyph data (TrueType outlines)
- [`loca`](./loca.md) — Index to location (glyph offsets)

### Hinting Tables

- [`cvt `](./cvt.md) — Control Value Table
- [`fpgm`](./fpgm.md) — Font program
- [`prep`](./prep.md) — Control Value Program
- [`gasp`](./gasp.md) — Grid-fitting / Scan-conversion

### TrueType Variation Tables

- [`gvar`](./gvar.md) — Glyph variations
- [`cvar`](./cvar.md) — CVT variations

## Apple AAT Tables

- [`bloc`](./bloc.md) — Bitmap location data (Apple)
- [`bdat`](./bdat.md) — Bitmap data (Apple)
- [`ltag`](./ltag.md) — Language tags (Apple)
