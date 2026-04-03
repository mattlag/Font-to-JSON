# `bloc` table

Indexes the location of bitmap glyph data within the bdat table for Apple-format bitmap fonts.

## Scope

- Format family: Apple AAT
- Table tag in JSON: `bloc`

## Overview

The `bloc` (bitmap location) table is Apple's equivalent of the OpenType `CBLC`/`EBLC` tables. It stores location and index data for embedded bitmap glyphs.

The binary format is identical to CBLC — Font Flux JS delegates parsing and writing to the CBLC implementation.

## Specs

- https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6bloc.html

## JSON Structure

Same structure as the [`CBLC`](./CBLC.md) table. See that page for field documentation.

## Notes

- Always paired with a [`bdat`](./bdat.md) table (the bitmap data).
- Preserve `_checksum` for stable round-tripping.
- Validate with `.validate()` after edits.
