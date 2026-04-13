# Font-Flux-JS Table Completeness Audit

_Last Updated: April 13, 2026_

**51 table types** have registered parsers and writers. **~40 are fully structured JSON**; **~11 have partial raw byte storage**. No tables are completely missing. Every table that has a parser also has a writer.

---

## HIGH — Entire subtables stored as raw bytes

| Table    | Gap                                                                                                                                     |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **MATH** | `mathConstants`, `mathGlyphInfo`, `mathVariants` — all 3 subtables stored as `{ _raw }`. Only the header (version + offsets) is parsed. |
| **JSTF** | Header + script record tags/offsets parsed, but per-script justification rules stored as `{ _raw }`.                                    |
| **MERG** | Only `version` (uint16) is parsed. Everything after is `data: Array.from(rawBytes.slice(2))`.                                           |

---

## MEDIUM — Specific structures stored as raw bytes

| Table      | Gap                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CFF v1** | **CharStrings** stored as raw byte arrays (decoded on-demand via `charstring_interpreter.js`). **CIDFont writing** incomplete — comment: _"full CIDFont writing is complex and can be expanded later."_ |
| **CFF2**   | **CharStrings** same as CFF v1.                                                                                                                                                                         |
| **glyf**   | Points, contours, flags fully structured. **Glyph instructions** stored as raw byte arrays — no TrueType bytecode parsing.                                                                              |
| **fpgm**   | Entire table is raw instruction bytes: `{ instructions: Array.from(rawBytes) }`.                                                                                                                        |
| **prep**   | Same as fpgm — raw instruction bytes only.                                                                                                                                                              |
| **GDEF**   | v1.0–1.2 fully parsed. v1.3+ `itemVariationStore` now fully structured via `item_variation_store.js`.                                                                                                   |
| **DSIG**   | Header + record metadata parsed. **CMS/PKCS#7 signature bytes** stored as `_raw`.                                                                                                                       |

---

## LOW — Expected binary or rare edge cases

| Table          | Gap                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **sbix**       | Bitmap image data (PNG/JPEG/TIFF) stored as raw `imageData` — expected for opaque image blobs.                            |
| **SVG**        | Plain-text SVGs are decoded to UTF-8 strings. **Gzip-compressed SVGs** stored as `{ compressed: true, data: byteArray }`. |
| **cmap**       | Formats 0, 2, 4, 6, 8, 10, 12, 13, 14 fully parsed. Unknown/rare formats fall through to `{ format, _raw }`.              |
| **STAT**       | Axis value formats 1–4 fully parsed. Unknown formats stored as `{ format, _raw }`.                                        |
| **EBSC**       | All fields are parsed, but also caches `_raw` per record; writer prefers `_raw` if present.                               |
| **cff_common** | Encoding `hasSupplement` flag preserved but **supplement entries not decoded**.                                           |

---

## Fully Complete Tables (~40, no gaps)

**Required:** head, hhea, hmtx, maxp (v0.5+v1.0), name (UTF-16BE+MacRoman), OS/2 (v0–v5), post (v1–v3)

**Advanced Typographic:** GPOS (all lookup types, PairPos fmt 1+2), GSUB (all lookup types), GDEF (v1.0–v1.3 with ItemVariationStore), BASE (v1.0+v1.1 with ItemVariationStore)

**Variation:** fvar, avar (v1+v2), STAT (formats 1–4), MVAR, HVAR, VVAR (all with structured ItemVariationStore), gvar (via tuple_variation_common), cvar

**Other Shared:** kern (OpenType + Apple formats 0–3), hdmx, LTSH, VDMX, PCLT, meta, ltag, vhea, vmtx

**Color/Bitmap:** COLR (v0+v1 with full Paint DAG), CPAL (v0+v1), EBLC/CBLC, EBDT/CBDT

**TTF:** loca (short+long), glyf (outlines), gasp, cvt

**OTF:** VORG

**Container:** TTC/OTC multi-face collections

---

## Observations

1. **By-design raw storage:** CharStrings (CFF/CFF2), TrueType instructions (fpgm/prep/glyf), and image blobs (sbix/CBDT) are intentionally raw — they have dedicated interpreter/compiler modules or are opaque binary formats.
2. **Structural gaps:** MATH, JSTF, and MERG are the only tables where meaningful font data remains largely inaccessible as structured JSON.
