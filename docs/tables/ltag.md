# `ltag` table

Stores IETF language tags referenced by other tables for Apple-platform language identification.

## Scope

- Format family: Apple AAT
- Table tag in JSON: `ltag`

## Overview

The `ltag` table maps numeric language codes to IETF BCP 47 language tags (e.g. `"en"`, `"sr"`, `"zh-Hant"`). These codes are used by the `name` table for Unicode-platform strings and by `feat`/`morx` tables for language-specific shaping.

## Specs

- https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6ltag.html

## JSON Skeleton

```json
{
	"tables": {
		"ltag": {
			"version": 1,
			"flags": 0,
			"tags": ["en", "es", "sr"],
			"_checksum": 0
		}
	}
}
```

## Top-level Fields

- `version` — number (UInt32). Currently 1.
- `flags` — number (UInt32). Currently unused, should be 0.
- `tags` — string[]. Array of IETF BCP 47 language tag strings. Index position is the numeric language code.

## Notes

- Tag index 0 maps to language code 0, index 1 to code 1, etc.
- Tags are ASCII strings (also valid UTF-8).
- Preserve `_checksum` for stable round-tripping.
- Validate with `.validate()` after edits.
