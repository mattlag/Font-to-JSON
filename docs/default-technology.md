# Default Technology Choices

Font technology is complicated. A single font file can contain dozens of tables, each with multiple format versions, competing implementations, and decades of backward-compatible cruft. Making a font that works well everywhere requires choosing between overlapping standards — and the wrong combination can produce a file that renders incorrectly, gets rejected by validators, or silently loses features.

Font Flux JS makes these choices for you. When you call `FontFlux.create()` and `.export()`, the library picks the most modern, most compatible approach at every decision point. You get an excellent font file without needing to know any of the details below.

If you _do_ want to know — or need to override something — here's what we chose and why.

## TrueType outlines (not CFF)

Font outlines come in two flavors: TrueType (quadratic Bézier curves, stored in the `glyf` table) and CFF/PostScript (cubic Bézier curves, stored in the `CFF` or `CFF2` table). Both live inside the same OpenType container.

Font Flux defaults to **TrueType** because:

- It works everywhere. Every operating system, browser, and application supports TrueType.
- Google Fonts requires it. The world's largest open font families (Noto, Roboto, Inter) all ship TrueType.
- Variable font support is strongest with TrueType (`glyf` + `gvar`).
- TrueType supports composite glyphs (sharing outlines between characters like `é` = `e` + accent), which saves space.

When you pass an SVG path string to `.addGlyph()`, it's automatically converted to TrueType contours. If you need CFF output, pass `format: 'cff'` to `createGlyph()` or set `charString` bytes directly on your glyphs.

## GPOS kerning (not the kern table)

There are two places kerning can live: the old `kern` table or the modern `GPOS` table. The OpenType specification explicitly recommends GPOS:

> _"Font vendors are encouraged to record kerning in the GPOS table's 'kern' feature and not in the 'kern' table."_

Font Flux uses **GPOS** because:

- It's what the spec recommends.
- It's **required** for variable fonts (the legacy `kern` table has no variation mechanism).
- It supports class-based kerning, which is dramatically more efficient for fonts with many glyphs.
- The legacy `kern` table has severe limitations on Windows — only one subtable, no class support.

You don't need to think about this. Call `.addKerning()` with pairs; the library handles the rest.

## Automatic character mapping (cmap)

The `cmap` table maps Unicode code points to glyph indices. It has over a dozen format versions stretching back to the 1990s. For new fonts, the spec recommends:

- **Format 4** for fonts that only use the Basic Multilingual Plane (U+0000–U+FFFF)
- **Format 12** when supplementary plane characters are present (emoji, historic scripts, etc.)

Font Flux **auto-selects** the right format based on which Unicode values your glyphs use. You never need to specify a cmap format.

## Unhinted, with a gasp table

TrueType hinting is a specialized craft — essentially writing low-level bytecode programs to nudge outlines onto pixel grids. It takes months to learn and years to master. CFF hinting (stem declarations and alignment zones) is less extreme but still requires deep typographic knowledge.

The good news: **modern rasterizers don't need manual hints.** DirectWrite (Windows), CoreText (macOS/iOS), and FreeType (Linux/Android) all perform excellent auto-hinting and anti-aliasing on unhinted fonts.

Font Flux creates fonts with:

- A **`gasp` table** that tells rasterizers to use grayscale anti-aliasing and symmetric smoothing at all sizes — the optimal settings for unhinted outlines.
- **No bytecode instructions** (`cvt`, `fpgm`, `prep`, or per-glyph instructions).

If you need hinting for a specialized use case (e.g., very small screen sizes with legacy renderers), you can provide `cvt`, `fpgm`, and `prep` data and set per-glyph `instructions`.

## OS/2 with USE_TYPO_METRICS

The OS/2 table contains two different sets of vertical metrics: the `sTypo*` fields (the "correct" ones) and the `usWin*` fields (legacy Windows overrides). Historically, different platforms read different fields, causing inconsistent line spacing.

The fix is a flag called **USE_TYPO_METRICS** (bit 7 of `fsSelection`). When set, it tells applications to use the `sTypo*` values consistently.

Font Flux sets this flag on all newly created fonts. The library also harmonizes `hhea` metrics with the `sTypo*` values so that all three metric sources (hhea, sTypo, usWin) agree.

## STAT table for variable fonts

Variable fonts define their axes in the `fvar` table, but the **`STAT`** (Style Attributes) table is what tells applications how to label and organize those axes in font menus. A missing STAT table causes problems in font managers, browsers, and design tools.

When your font has variable axes, Font Flux **auto-generates a STAT table** with:

- A format 1 axis value for each axis's default value
- Proper ELIDABLE_AXIS_VALUE_NAME flags (so "Regular" doesn't redundantly appear in style names)
- A "Regular" elided fallback name

If you need a more complex STAT table (e.g., with format 2 range values or format 3 linked values), provide it directly in `tables.STAT`.

## post table format 2.0 with glyph names

The `post` table maps glyph indices to human-readable names. Font Flux uses **format 2.0**, which stores an explicit name for every glyph. This is important for:

- PDF generation (glyph names affect text extraction and accessibility)
- Font debugging tools (FontForge, fontTools, OTMaster)
- PostScript printing

The OpenType spec says CFF-based fonts should use format 3.0 (no names, since CFF has its own charset). Since Font Flux defaults to TrueType, format 2.0 is the correct choice.

## GSUB for substitutions

OpenType Layout substitutions (ligatures, small caps, stylistic alternates) live in the **GSUB** table. There is no competing mechanism — this is the only modern approach.

Font Flux writes substitutions under the `DFLT` script and `dflt` language system, which provides maximum coverage across all scripts and languages. Feature tags follow the [OpenType Layout Tag Registry](https://learn.microsoft.com/en-us/typography/opentype/spec/featuretags) (`liga`, `smcp`, `aalt`, etc.).

## Three name table platforms

The `name` table stores human-readable strings like the font family name. Font Flux writes each string to three platforms:

- **Windows** (platformID 3) — required for Windows and most applications
- **Unicode** (platformID 0) — required by the spec for cross-platform use
- **Macintosh** (platformID 1) — technically optional on modern systems, but some legacy software still reads it

Including all three is harmless and avoids edge cases with older tools.

## SFNT output by default

When you call `.export()` on a font created from scratch, the output is a raw **SFNT** binary (a `.ttf` file). This is the universal format that works everywhere.

To create web fonts, wrap the output in WOFF or WOFF2:

```js
const woff = font.export({ format: 'woff' });
const woff2 = font.export({ format: 'woff2' }); // requires await initWoff2() first
```

## Summary

| What           | Font Flux default          | Why                                           |
| -------------- | -------------------------- | --------------------------------------------- |
| Outlines       | TrueType (`glyf`)          | Universal support, Google Fonts standard      |
| Kerning        | GPOS                       | Spec-recommended, required for variable fonts |
| Character map  | cmap Format 4 or 12        | Auto-selected per spec                        |
| Hinting        | Unhinted + `gasp`          | Modern rasterizers auto-hint well             |
| Metrics        | OS/2 v4 + USE_TYPO_METRICS | Consistent cross-platform line spacing        |
| Variable fonts | fvar + gvar + auto STAT    | Best supported stack                          |
| Glyph names    | post format 2.0            | PDF, debugging, PostScript interop            |
| Substitutions  | GSUB                       | Only modern mechanism                         |
| Name platforms | Windows + Unicode + Mac    | Maximum compatibility                         |
| File format    | SFNT (.ttf)                | Universal, wrappable as WOFF/WOFF2            |

These defaults produce a modern, spec-compliant font that works across all major platforms. For most users, there's nothing to configure — just create your glyphs and export.
