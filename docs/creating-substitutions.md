# Creating Substitutions (GSUB)

This guide covers how to create and work with OpenType GSUB substitution rules in a Font Flux font. Whether you're adding ligatures to a font built from scratch, inspecting substitutions from an imported font, or constructing a full set of small-caps and stylistic alternates — this is the reference for substitution structure, input formats, and the export pipeline.

## Quick start with `.addSubstitution()`

The `.addSubstitution()` method accepts substitution data in several flexible formats and merges them into the font's substitutions array.

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.create({ family: 'My Font' });

// Add glyphs first — substitutions reference glyphs by name
font.addGlyph({ name: 'f', unicode: 102, advanceWidth: 300, path: '...' });
font.addGlyph({ name: 'i', unicode: 105, advanceWidth: 300, path: '...' });
font.addGlyph({ name: 'fi', advanceWidth: 550, path: '...' });

// Add a ligature substitution
font.addSubstitution({
	type: 'ligature',
	feature: 'liga',
	substitution: { components: ['f', 'i'], ligature: 'fi' },
});
```

You can also construct the substitutions array directly as plain JSON and assign to `font.substitutions` without using `.addSubstitution()`. The method is a convenience, not a requirement.

## Substitution types

Font Flux supports five simplified GSUB substitution types. Each type maps to one or more OpenType lookup types.

### Single substitution (GSUB type 1)

Replace one glyph with one glyph. Used for small caps, case forms, and stylistic sets.

```js
font.addSubstitution({
	type: 'single',
	feature: 'smcp',
	substitution: { from: 'a', to: 'a.smcp' },
});
```

Add many at once with `substitutions` (plural):

```js
font.addSubstitution({
	type: 'single',
	feature: 'smcp',
	substitutions: [
		{ from: 'a', to: 'a.smcp' },
		{ from: 'b', to: 'b.smcp' },
		{ from: 'c', to: 'c.smcp' },
	],
});
```

### Multiple substitution (GSUB type 2)

Replace one glyph with a sequence of glyphs. Used for decomposition.

```js
font.addSubstitution({
	type: 'multiple',
	feature: 'ccmp',
	substitution: { from: 'ffi', to: ['f', 'f', 'i'] },
});
```

### Alternate substitution (GSUB type 3)

One glyph has several alternate forms the user can choose from. Used for stylistic alternates.

```js
font.addSubstitution({
	type: 'alternate',
	feature: 'salt',
	substitution: { from: 'a', alternates: ['a.alt1', 'a.alt2', 'a.alt3'] },
});
```

### Ligature substitution (GSUB type 4)

A sequence of glyphs is replaced by a single glyph. Used for standard ligatures, discretionary ligatures, and more.

```js
font.addSubstitution({
	type: 'ligature',
	feature: 'liga',
	substitution: { components: ['f', 'i'], ligature: 'fi' },
});
```

Add multiple ligatures at once:

```js
font.addSubstitution({
	type: 'ligature',
	feature: 'liga',
	substitutions: [
		{ components: ['f', 'i'], ligature: 'fi' },
		{ components: ['f', 'l'], ligature: 'fl' },
		{ components: ['f', 'f', 'i'], ligature: 'ffi' },
	],
});
```

### Reverse chaining single substitution (GSUB type 8)

A context-dependent single substitution that processes glyphs in reverse order. Used for cursive connection in Arabic and similar scripts.

```js
font.addSubstitution({
	type: 'reverse',
	feature: 'rclt',
	substitution: {
		from: 'alef',
		to: 'alef.final',
		backtrack: [['lam', 'lam.init']],
		lookahead: [],
	},
});
```

## Common OpenType feature tags

The `feature` field determines when the substitution is applied. Here are the most common tags:

| Feature       | Description                     | Typical type(s)      |
| ------------- | ------------------------------- | -------------------- |
| `liga`        | Standard ligatures              | ligature             |
| `dlig`        | Discretionary ligatures         | ligature             |
| `smcp`        | Small capitals                  | single               |
| `c2sc`        | Caps to small caps              | single               |
| `salt`        | Stylistic alternates            | alternate, single    |
| `ss01`–`ss20` | Stylistic sets                  | single               |
| `ccmp`        | Glyph composition/decomposition | multiple, ligature   |
| `calt`        | Contextual alternates           | single (via context) |
| `locl`        | Localized forms                 | single               |
| `frac`        | Fractions                       | single, ligature     |
| `subs`        | Subscript                       | single               |
| `sups`        | Superscript                     | single               |
| `zero`        | Slashed zero                    | single               |
| `onum`        | Oldstyle figures                | single               |
| `lnum`        | Lining figures                  | single               |

## Script and language

Each substitution rule has a `script` and `language` field that controls which writing system it applies to. Defaults are `'DFLT'` and `null` (default language system), which work for most Latin fonts.

```js
font.addSubstitution({
	type: 'ligature',
	feature: 'liga',
	script: 'latn', // Latin script
	language: 'DEU ', // German (4-char tag, space-padded)
	substitution: { components: ['c', 'h'], ligature: 'ch.de' },
});
```

If you omit `script` and `language`, the substitution applies to the default script and language system — this is correct for the vast majority of Latin-script fonts.

## Input formats

`.addSubstitution()` accepts several input shapes:

### Single rule object

```js
font.addSubstitution({
	type: 'ligature',
	feature: 'liga',
	substitution: { components: ['f', 'i'], ligature: 'fi' },
});
```

### Multiple rules in one object

```js
font.addSubstitution({
	type: 'ligature',
	feature: 'liga',
	substitutions: [
		{ components: ['f', 'i'], ligature: 'fi' },
		{ components: ['f', 'l'], ligature: 'fl' },
	],
});
```

### Array of mixed rules

```js
font.addSubstitution([
	{
		type: 'ligature',
		feature: 'liga',
		substitution: { components: ['f', 'i'], ligature: 'fi' },
	},
	{
		type: 'single',
		feature: 'smcp',
		substitutions: [
			{ from: 'a', to: 'a.smcp' },
			{ from: 'b', to: 'b.smcp' },
		],
	},
	{
		type: 'alternate',
		feature: 'salt',
		substitution: { from: 'a', alternates: ['a.alt1', 'a.alt2'] },
	},
]);
```

### Class-based expansion

Define glyph classes and reference them with `@className`:

```js
font.addSubstitution([
	{
		classes: {
			lowercase: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
			lowercaseSmcp: [
				'a.smcp',
				'b.smcp',
				'c.smcp',
				'd.smcp',
				'e.smcp',
				'f.smcp',
				'g.smcp',
			],
		},
	},
	{
		type: 'single',
		feature: 'smcp',
		substitution: { from: '@lowercase', to: '@lowercaseSmcp' },
	},
]);
// Expands to 7 individual single substitution rules
```

## Looking up substitutions

### By filter

Use `.listSubstitutions()` to get all substitutions, optionally filtered:

```js
// All substitutions
font.listSubstitutions();

// Only ligatures
font.listSubstitutions({ type: 'ligature' });

// Only rules for the 'smcp' feature
font.listSubstitutions({ feature: 'smcp' });

// Combine filters
font.listSubstitutions({ type: 'single', feature: 'smcp' });
```

### By glyph

Use `.getSubstitution()` to find rules involving a specific glyph:

```js
// Find all rules where 'a' is the input glyph
font.getSubstitution('a');

// Find rules where 'f' participates (including as a ligature component)
font.getSubstitution('f');

// Filter by type
font.getSubstitution('a', { type: 'single' });
```

Glyph IDs accept names, numeric code points, or hex strings:

```js
font.getSubstitution('a'); // by name
font.getSubstitution(97); // by code point
font.getSubstitution('U+0061'); // by hex string
```

## Removing substitutions

### By filter

```js
// Remove all single substitutions
font.removeSubstitution({ type: 'single' });

// Remove all rules for the 'dlig' feature
font.removeSubstitution({ feature: 'dlig' });

// Remove rules for a specific input glyph
font.removeSubstitution({ from: 'a' });

// Remove a specific ligature
font.removeSubstitution({ ligature: 'fi' });
```

### Clear all

```js
font.clearSubstitutions();
```

## Building a font from scratch with substitutions

Here's a complete example building a font with ligatures and small caps:

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.create({
	family: 'My Fancy Font',
	unitsPerEm: 1000,
	ascender: 800,
	descender: -200,
});

// ── Glyphs ──────────────────────────────────────────────
font.addGlyph({ name: '.notdef', advanceWidth: 500 });
font.addGlyph({ name: 'space', unicode: 32, advanceWidth: 250 });

// Standard Latin
font.addGlyph({ name: 'A', unicode: 65, advanceWidth: 600, path: '...' });
font.addGlyph({ name: 'B', unicode: 66, advanceWidth: 600, path: '...' });
font.addGlyph({ name: 'a', unicode: 97, advanceWidth: 500, path: '...' });
font.addGlyph({ name: 'b', unicode: 98, advanceWidth: 520, path: '...' });
font.addGlyph({ name: 'f', unicode: 102, advanceWidth: 300, path: '...' });
font.addGlyph({ name: 'i', unicode: 105, advanceWidth: 250, path: '...' });
font.addGlyph({ name: 'l', unicode: 108, advanceWidth: 250, path: '...' });

// Ligature glyphs (no unicode — accessed only via substitution)
font.addGlyph({ name: 'fi', advanceWidth: 550, path: '...' });
font.addGlyph({ name: 'fl', advanceWidth: 550, path: '...' });
font.addGlyph({ name: 'ffi', advanceWidth: 800, path: '...' });

// Small cap glyphs
font.addGlyph({ name: 'a.smcp', advanceWidth: 480, path: '...' });
font.addGlyph({ name: 'b.smcp', advanceWidth: 500, path: '...' });

// Alternate glyphs
font.addGlyph({ name: 'a.alt1', advanceWidth: 500, path: '...' });
font.addGlyph({ name: 'a.alt2', advanceWidth: 500, path: '...' });

// ── Substitutions ───────────────────────────────────────

// Standard ligatures (liga — on by default in most apps)
font.addSubstitution({
	type: 'ligature',
	feature: 'liga',
	substitutions: [
		{ components: ['f', 'f', 'i'], ligature: 'ffi' },
		{ components: ['f', 'i'], ligature: 'fi' },
		{ components: ['f', 'l'], ligature: 'fl' },
	],
});

// Small caps (smcp — user-activated feature)
font.addSubstitution({
	type: 'single',
	feature: 'smcp',
	substitutions: [
		{ from: 'a', to: 'a.smcp' },
		{ from: 'b', to: 'b.smcp' },
	],
});

// Stylistic alternates (salt — user picks from alternates)
font.addSubstitution({
	type: 'alternate',
	feature: 'salt',
	substitution: { from: 'a', alternates: ['a.alt1', 'a.alt2'] },
});

// ── Kerning ─────────────────────────────────────────────
font.addKerning([
	{ left: 'A', right: 'V', value: -80 },
	{ left: 'f', right: 'i', value: -20 },
]);

// ── Export ───────────────────────────────────────────────
const buffer = font.export();
```

This produces a font with:

- A working GSUB table with 3 lookup types across 3 features
- Standard ligatures that activate automatically in browsers and apps
- Small caps accessible via the `smcp` feature in design tools
- Stylistic alternates selectable in apps that support `salt`

## Editing substitutions from an imported font

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.open(buffer);

// Inspect existing substitutions
console.log(font.substitutions.length); // e.g. 340
console.log(font.listSubstitutions({ type: 'ligature' }).length); // e.g. 28

// Add new ligatures alongside existing ones
font.addSubstitution({
	type: 'ligature',
	feature: 'dlig',
	substitutions: [
		{ components: ['s', 't'], ligature: 'st' },
		{ components: ['c', 't'], ligature: 'ct' },
	],
});

// Remove all stylistic set 3 rules
font.removeSubstitution({ feature: 'ss03' });

// Replace small caps with custom ones
font.removeSubstitution({ feature: 'smcp' });
font.addSubstitution({
	type: 'single',
	feature: 'smcp',
	substitutions: [
		{ from: 'a', to: 'a.smcp' },
		{ from: 'b', to: 'b.smcp' },
		// ...
	],
});

const output = font.export();
```

## How substitutions are stored in fonts

Font Flux decomposes the GSUB table on import and reconstructs it on export.

### Import (GSUB binary → `substitutions[]`)

When you call `FontFlux.open()`, the GSUB table is parsed and decomposed:

- **Lookup types 1–4** (single, multiple, alternate, ligature) → simplified rules in `substitutions[]`
- **Lookup type 8** (reverse chaining single) → simplified rules in `substitutions[]`
- **Lookup types 5, 6** (contextual, chaining contextual) → preserved as raw lookup data in `_rawGSUBLookups[]` (these are complex structures that reference other lookups by index)

### Export (`substitutions[]` → GSUB binary)

On export, Font Flux:

1. Groups substitution rules by type + feature tag
2. Builds one GSUB lookup per group
3. Appends any raw lookups (types 5/6) with corrected indices
4. Constructs the complete featureList and scriptList from rule metadata
5. Writes the binary GSUB table

### Round-trip fidelity

Imported fonts round-trip correctly — all substitution rules are preserved through import → edit → export cycles. The GSUB binary structure may be reorganized (lookups reordered, coverage tables rebuilt), but the functional behavior is identical.

## Contextual lookups (types 5 and 6)

GSUB lookup types 5 and 6 (contextual substitution and chaining contextual substitution) are preserved as raw data during import because they reference other lookups by index, making simplified authoring impractical.

If you need to inspect or manipulate these, access them via the raw features:

```js
const font = FontFlux.open(buffer);

// Raw GSUB lookups are available for advanced use
console.log(font._data._rawGSUBLookups?.length);
```

For most font editing workflows (ligatures, small caps, alternates, stylistic sets), the simplified substitution types cover all common needs.

## Validation

Run `.validate()` on your font to catch structural issues before export:

```js
const report = font.validate();
if (!report.valid) {
	console.error(report.issues);
}
```

See the [Validation guide](./guide/validation.md) for details on what's checked.
