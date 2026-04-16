# Creating Variable Fonts

This guide covers how to create and work with variable font data in Font Flux JS. Variable fonts define **design axes** (like weight or width) that allow smooth interpolation between different styles from a single font file.

Font Flux JS decomposes variable font tables into three simplified fields — `axisMapping`, `axisStyles`, and `metricVariations` — alongside the existing `axes` and `instances` fields. These provide a human-readable interface for the underlying `avar`, `STAT`, and `MVAR` tables.

## Concepts overview

A variable font has several layers:

| Layer                 | Simplified field   | Table  | What it does                                                                      |
| --------------------- | ------------------ | ------ | --------------------------------------------------------------------------------- |
| **Axes**              | `axes`             | `fvar` | Declares what can vary (weight, width, etc.) and the min/default/max range        |
| **Instances**         | `instances`        | `fvar` | Named presets ("Regular", "Bold") at specific axis coordinates                    |
| **Axis mapping**      | `axisMapping`      | `avar` | Non-linear coordinate warping per axis                                            |
| **Axis styles**       | `axisStyles`       | `STAT` | UI labels and relationships for axis values                                       |
| **Metric variations** | `metricVariations` | `MVAR` | How global font metrics (ascender, x-height, etc.) change across the design space |

## Quick start

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.create({ family: 'My Variable Font' });

// Define variation axes
font.addAxis({ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 });
font.addAxis({ tag: 'wdth', name: 'Width', min: 75, default: 100, max: 125 });

// Add named instances
font.addInstance({ name: 'Regular', coordinates: { wght: 400, wdth: 100 } });
font.addInstance({ name: 'Bold', coordinates: { wght: 700, wdth: 100 } });

const buffer = font.export();
```

For the `axisMapping`, `axisStyles`, and `metricVariations` fields, assign them directly on the underlying data:

```js
const data = font._data; // internal simplified data object

// Add axis mapping (avar)
data.axisMapping = {
	wght: [
		{ from: -1, to: -1 },
		{ from: 0, to: 0 },
		{ from: 0.5, to: 0.7 },
		{ from: 1, to: 1 },
	],
};

// Add axis styles (STAT)
data.axisStyles = {
	elidedFallbackName: 'Regular',
	values: [
		{ name: 'Regular', axis: 'wght', value: 400, linkedValue: 700, flags: 2 },
		{ name: 'Bold', axis: 'wght', value: 700, flags: 0 },
	],
};

// Add metric variations (MVAR)
data.metricVariations = {
	regions: [{ axes: { wght: [0, 1, 1] } }],
	metrics: {
		ascender: [{ region: 0, delta: 30 }],
		descender: [{ region: 0, delta: -10 }],
	},
};
```

## Axes

Axes define the dimensions a variable font can vary along. Each axis has a 4-character tag, a human name, and a numeric range.

### Axis reference

| Field     | Type      | Description                                                                                               |
| --------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `tag`     | `string`  | 4-character axis tag. Registered tags: `wght`, `wdth`, `ital`, `slnt`, `opsz`. Custom tags use uppercase. |
| `name`    | `string`  | Human-readable name (e.g. `"Weight"`)                                                                     |
| `min`     | `number`  | Minimum axis value                                                                                        |
| `default` | `number`  | Default axis value                                                                                        |
| `max`     | `number`  | Maximum axis value                                                                                        |
| `hidden`  | `boolean` | If `true`, the axis should not appear in UI (e.g. optical size set automatically)                         |

### Registered axis tags

| Tag    | Name         | Typical range                   |
| ------ | ------------ | ------------------------------- |
| `wght` | Weight       | 100 (Thin) – 900 (Black)        |
| `wdth` | Width        | 75 (Condensed) – 125 (Extended) |
| `ital` | Italic       | 0 (Upright) – 1 (Italic)        |
| `slnt` | Slant        | -20° – 0°                       |
| `opsz` | Optical Size | 6pt – 144pt                     |

Custom axes use uppercase tags (e.g. `GRAD` for grade, `CASL` for casualness).

### Using the axis API

```js
font.addAxis({ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 });
font.getAxis('wght'); // returns the axis object
font.setAxis('wght', { max: 1000 }); // update properties
font.listAxes(); // list all axes
font.removeAxis('wght'); // remove an axis
```

## Instances

Named instances are presets that map to specific coordinates in the design space.

### Instance reference

| Field            | Type     | Description                                               |
| ---------------- | -------- | --------------------------------------------------------- |
| `name`           | `string` | Human-readable name (e.g. `"Bold Condensed"`)             |
| `postScriptName` | `string` | Optional PostScript name (e.g. `"MyFont-BoldCondensed"`)  |
| `coordinates`    | `object` | Axis tag → value mapping (e.g. `{ wght: 700, wdth: 75 }`) |

### Using the instance API

```js
font.addInstance({ name: 'Bold', coordinates: { wght: 700, wdth: 100 } });
font.addInstance({
	name: 'Bold Condensed',
	postScriptName: 'MyFont-BoldCond',
	coordinates: { wght: 700, wdth: 75 },
});
font.listInstances();
font.removeInstance('Bold');
```

## Axis mapping (avar)

Axis mapping provides non-linear coordinate remapping. Without it, axis interpolation is perfectly linear. With it, you can make `wght: 500` behave as if it were `wght: 600` internally — useful for perceptually even weight distribution.

### Format

`axisMapping` is an object keyed by axis tag. Each value is an array of `{ from, to }` pairs in normalized F2DOT14 coordinate space (-1.0 to 1.0):

```js
axisMapping: {
  wght: [
    { from: -1, to: -1 },     // axis minimum
    { from: -0.5, to: -0.7 }, // remap: half-thin is pushed thinner
    { from: 0, to: 0 },       // default (must be identity)
    { from: 0.5, to: 0.3 },   // remap: half-bold is less bold
    { from: 1, to: 1 },       // axis maximum
  ],
}
```

### Key rules

- Each axis mapping must include the identity points `{ from: -1, to: -1 }`, `{ from: 0, to: 0 }`, and `{ from: 1, to: 1 }`.
- Values are in **normalized** coordinate space, not user-space values. -1.0 maps to the axis minimum, 0 to the default, and 1.0 to the maximum.
- Coordinates are stored as F2DOT14 values, which have limited precision (~0.00006 resolution). Round-tripped values may differ very slightly from the originals.
- Axes not listed in `axisMapping` use identity (linear) mapping.
- Identity-only mappings are stripped during import — if all axes are linear, `axisMapping` will be `undefined`.

## Axis styles (STAT)

Axis styles provide the labels and relationships that font consumers use to build menus and UI. Without a STAT table, applications may not correctly group font styles into families.

When you define `axes` but don't provide `axisStyles`, Font Flux JS auto-generates a minimal STAT table with format 1 entries for each axis default value. Providing explicit `axisStyles` gives you full control.

### Format

```js
axisStyles: {
  elidedFallbackName: 'Regular',  // name for the default style (usually "Regular")
  values: [
    // Format 1: single value
    { name: 'Regular', axis: 'wght', value: 400, flags: 2 },
    { name: 'Bold', axis: 'wght', value: 700, flags: 0 },

    // Format 2: range
    { name: 'Normal', axis: 'wdth', range: [87.5, 100, 112.5], flags: 2 },

    // Format 3: linked value (Regular ↔ Bold)
    { name: 'Regular', axis: 'wght', value: 400, linkedValue: 700, flags: 2 },

    // Format 4: multi-axis combination
    { name: 'Bold Condensed', values: { wght: 700, wdth: 75 }, flags: 0 },
  ],
}
```

### Axis style value reference

| Field         | Type                  | When used       | Description                                                                       |
| ------------- | --------------------- | --------------- | --------------------------------------------------------------------------------- |
| `name`        | `string`              | All formats     | Human-readable label                                                              |
| `axis`        | `string`              | Formats 1, 2, 3 | Axis tag this value applies to                                                    |
| `value`       | `number`              | Formats 1, 3    | Axis value in user-space coordinates                                              |
| `range`       | `[min, nominal, max]` | Format 2        | Range of values (e.g. `[87.5, 100, 112.5]` for Normal width)                      |
| `linkedValue` | `number`              | Format 3        | The partner value (e.g. Regular linked to Bold at 700)                            |
| `values`      | `object`              | Format 4        | Multi-axis coordinate (e.g. `{ wght: 700, wdth: 75 }`)                            |
| `flags`       | `number`              | All formats     | Bit 1 (`0x0002`): ELIDABLE — this name can be omitted in UI when it's the default |

### Flags

| Value | Meaning                                                                                          |
| ----- | ------------------------------------------------------------------------------------------------ |
| `0`   | Always show this label in UI                                                                     |
| `2`   | **Elidable**: can be hidden when displaying the default style (e.g. "Regular" is often elidable) |

### elidedFallbackName

The `elidedFallbackName` (usually `"Regular"`) is the name used when all elidable axis values are hidden. For example, if Weight is "Regular" (elidable) and Width is "Normal" (elidable), the resulting style name is just the `elidedFallbackName`.

## Metric variations (MVAR)

Metric variations describe how global font metrics change across the design space. For example, a bolder weight might have a taller ascender or wider strikeout.

### Format

```js
metricVariations: {
  regions: [
    { axes: { wght: [0, 1, 1] } },           // "when weight goes to max"
    { axes: { wdth: [-1, -1, 0] } },          // "when width goes to min"
    { axes: { wght: [0, 1, 1], wdth: [-1, -1, 0] } }, // interaction region
  ],
  metrics: {
    ascender:  [{ region: 0, delta: 50 }, { region: 1, delta: -10 }],
    xHeight:   [{ region: 0, delta: 15 }],
    capHeight: [{ region: 0, delta: 20 }],
  },
}
```

### Variation regions

Each region defines a zone of influence in the design space. The `axes` object maps axis tags to `[start, peak, end]` triplets in normalized coordinates:

```
[start, peak, end]
  └── axis influence begins
           └── full influence (1.0 scalar)
                    └── influence ends
```

At the `peak` coordinate, the region has full influence (all deltas apply at 100%). At `start` and `end`, influence is zero. Between them, influence ramps linearly. This creates a triangular blending function.

Axes not listed in a region's `axes` object have no influence on that region — equivalent to `[0, 0, 0]`.

Example: `{ axes: { wght: [0, 1, 1] } }` means "this region's influence ramps from 0 at the weight default to full at the weight maximum."

### Metric names

`metricVariations.metrics` uses human-readable metric names instead of 4-character MVAR tags:

| Metric name          | MVAR tag | Description          |
| -------------------- | -------- | -------------------- |
| `ascender`           | `hasc`   | Horizontal ascender  |
| `descender`          | `hdsc`   | Horizontal descender |
| `lineGap`            | `hlgp`   | Horizontal line gap  |
| `caretSlopeRise`     | `hcla`   | Caret slope rise     |
| `caretSlopeRun`      | `hcld`   | Caret slope run      |
| `caretOffset`        | `hcof`   | Caret offset         |
| `vAscender`          | `vasc`   | Vertical ascender    |
| `vDescender`         | `vdsc`   | Vertical descender   |
| `vLineGap`           | `vlgp`   | Vertical line gap    |
| `xHeight`            | `xhgt`   | x-height             |
| `capHeight`          | `cpht`   | Cap height           |
| `subscriptXSize`     | `sbxs`   | Subscript x size     |
| `subscriptYSize`     | `sbys`   | Subscript y size     |
| `subscriptXOffset`   | `sbxo`   | Subscript x offset   |
| `subscriptYOffset`   | `sbyo`   | Subscript y offset   |
| `superscriptXSize`   | `spxs`   | Superscript x size   |
| `superscriptYSize`   | `spys`   | Superscript y size   |
| `superscriptXOffset` | `spxo`   | Superscript x offset |
| `superscriptYOffset` | `spyo`   | Superscript y offset |
| `strikeoutSize`      | `strs`   | Strikeout size       |
| `strikeoutOffset`    | `stro`   | Strikeout offset     |
| `underlineSize`      | `unds`   | Underline size       |
| `underlineOffset`    | `undo`   | Underline offset     |

Unrecognized MVAR tags are preserved using the raw 4-character tag as the key.

### Delta entries

Each metric maps to an array of delta entries:

```js
{ region: 0, delta: 50 }
```

- `region` — index into the `regions` array
- `delta` — the adjustment in font units, applied at the region's peak influence

Multiple deltas for the same metric with different regions are summed (weighted by each region's influence at the current axis position).

## What's imported vs. what's authored

When you open an existing variable font with `FontFlux.open()`:

| Field              | Source table | Imported?                                        |
| ------------------ | ------------ | ------------------------------------------------ |
| `axes`             | `fvar`       | ✅ Always extracted                              |
| `instances`        | `fvar`       | ✅ Always extracted                              |
| `axisMapping`      | `avar`       | ✅ Extracted (omitted if all axes are identity)  |
| `axisStyles`       | `STAT`       | ✅ Extracted with resolved names and axis tags   |
| `metricVariations` | `MVAR`       | ✅ Extracted with resolved region/delta mappings |

When exporting:

| Field                | Output table | Behavior                                                                 |
| -------------------- | ------------ | ------------------------------------------------------------------------ |
| `axes` + `instances` | `fvar`       | Always built from simplified data                                        |
| `axisMapping`        | `avar`       | Built only when `axisMapping` is present                                 |
| `axisStyles`         | `STAT`       | Built from `axisStyles` if present; otherwise auto-generated from `axes` |
| `metricVariations`   | `MVAR`       | Built only when `metricVariations` is present                            |

## What's not yet covered

The following variable font features are preserved for lossless round-trip through the `tables` passthrough, but are **not** yet decomposed into simplified fields:

- **Per-glyph outline variations** — `gvar` (TrueType) and CFF2 `blend` operators store how individual glyph outlines change across axes. These remain in `tables.gvar` / `tables.CFF2`.
- **Per-glyph metric variations** — `HVAR` and `VVAR` store how individual glyph advance widths and side bearings vary. These remain in `tables.HVAR` / `tables.VVAR`.
- **CVT variations** — `cvar` stores how TrueType hinting control values vary. Remains in `tables.cvar`.

These tables pass through the import/export pipeline unchanged, preserving all variation data in existing fonts.

## Complete example

Here's a complete variable font authored from scratch with all variable metric fields:

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.create({
	family: 'My Variable Font',
	unitsPerEm: 1000,
	ascender: 800,
	descender: -200,
});

// Axes
font.addAxis({ tag: 'wght', name: 'Weight', min: 100, default: 400, max: 900 });
font.addAxis({ tag: 'wdth', name: 'Width', min: 75, default: 100, max: 125 });

// Instances
font.addInstance({ name: 'Thin', coordinates: { wght: 100, wdth: 100 } });
font.addInstance({ name: 'Regular', coordinates: { wght: 400, wdth: 100 } });
font.addInstance({ name: 'Bold', coordinates: { wght: 700, wdth: 100 } });
font.addInstance({
	name: 'Bold Condensed',
	coordinates: { wght: 700, wdth: 75 },
});

// Axis mapping — make weight interpolation perceptually even
font._data.axisMapping = {
	wght: [
		{ from: -1, to: -1 },
		{ from: -0.5, to: -0.7 },
		{ from: 0, to: 0 },
		{ from: 0.5, to: 0.3 },
		{ from: 1, to: 1 },
	],
};

// Axis styles — full STAT control
font._data.axisStyles = {
	elidedFallbackName: 'Regular',
	values: [
		{ name: 'Thin', axis: 'wght', value: 100, flags: 0 },
		{ name: 'Regular', axis: 'wght', value: 400, linkedValue: 700, flags: 2 },
		{ name: 'Bold', axis: 'wght', value: 700, flags: 0 },
		{ name: 'Normal', axis: 'wdth', range: [87.5, 100, 112.5], flags: 2 },
		{ name: 'Condensed', axis: 'wdth', range: [75, 75, 87.5], flags: 0 },
		{ name: 'Bold Condensed', values: { wght: 700, wdth: 75 }, flags: 0 },
	],
};

// Metric variations — ascender grows with weight
font._data.metricVariations = {
	regions: [{ axes: { wght: [0, 1, 1] } }],
	metrics: {
		ascender: [{ region: 0, delta: 30 }],
		xHeight: [{ region: 0, delta: 10 }],
		capHeight: [{ region: 0, delta: 15 }],
	},
};

// Add glyphs...
font.addGlyph({
	name: 'A',
	unicode: 65,
	advanceWidth: 600,
	path: 'M 0 0 L 300 700 L 600 0 Z',
});

const buffer = font.export();
```
