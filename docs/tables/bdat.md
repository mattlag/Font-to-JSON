# `bdat` table

Stores bitmap glyph image data in Apple-format bitmap fonts.

## Scope

- Format family: Apple AAT
- Table tag in JSON: `bdat`

## Overview

The `bdat` (bitmap data) table is Apple's equivalent of the OpenType `CBDT`/`EBDT` tables. It stores the actual bitmap glyph image data.

The binary format is identical to CBDT — Font Flux JS delegates parsing and writing to the CBDT implementation.

## Specs

- https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6bdat.html

## JSON Structure

Same structure as the [`CBDT`](./CBDT.md) table. See that page for field documentation.

## Notes

- Always paired with a [`bloc`](./bloc.md) table (the bitmap locations/index).
- Preserve `_checksum` for stable round-tripping.
- Validate with `.validate()` after edits.
