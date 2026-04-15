# Creating Color Fonts

This guide covers how to create and work with color font data in Font Flux JS. Color fonts use the COLR table (glyph layer compositions) and the CPAL table (color palettes) to define colored versions of glyphs.

## Quick start

```js
import { FontFlux } from 'font-flux-js';

const font = FontFlux.create({ family: 'My Color Font' });

// Create the base glyph and its color layer glyphs
font.addGlyph({
	name: 'A',
	unicode: 65,
	advanceWidth: 600,
	path: 'M 0 0 L 300 700 L 600 0 Z',
});
font.addGlyph({
	name: 'A.shadow',
	advanceWidth: 600,
	path: 'M 10 -10 L 310 690 L 610 -10 Z',
});
font.addGlyph({
	name: 'A.fill',
	advanceWidth: 600,
	path: 'M 0 0 L 300 700 L 600 0 Z',
});

// Define a color palette
font.addPalette(['#333333', '#FF0000']);

// Assign color layers to the base glyph
font.addColorGlyph({
	name: 'A',
	layers: [
		{ glyph: 'A.shadow', paletteIndex: 0 },
		{ glyph: 'A.fill', paletteIndex: 1 },
	],
});

const buffer = font.export();
```

The base glyph (`A`) is what gets used when color rendering isn't available. The color layers (`A.shadow`, `A.fill`) provide the colored version — they stack bottom-to-top, each drawn in the color at the specified palette index.

## How color fonts work

A color font needs two things:

1. **Palettes** (CPAL table) — arrays of colors that can be referenced by index
2. **Color glyphs** (COLR table) — definitions of how base glyphs are rendered in color

The simplest approach (COLRv0) stacks colored layers. Each layer references a glyph outline and a palette color index. The layers draw bottom-to-top.

```
Layer 0: A.shadow  →  palette[0] (#333333)   ← drawn first (bottom)
Layer 1: A.fill    →  palette[1] (#FF0000)   ← drawn on top
```

Applications that support color fonts render the layered version. Applications that don't fall back to the base glyph's outline.

## Palettes

Palettes are arrays of hex color strings. Add as many palettes as you need — some applications let users switch between them (light mode/dark mode themes, for example).

```js
// Add a default palette
font.addPalette(['#000000', '#FF0000', '#00FF00', '#0000FF']);

// Add a dark-mode palette with the same number of colors
font.addPalette(['#FFFFFF', '#FF6666', '#66FF66', '#6666FF']);
```

All palettes must have the same number of entries. Color glyphs reference colors by index, so palette 0 entry 2 and palette 1 entry 2 should be the "same" color in different contexts.

### Color format

Colors are hex strings:

- `#RRGGBB` — opaque color
- `#RRGGBBAA` — color with alpha (00 = transparent, FF = opaque)
- `#RGB` — short form (expanded to `#RRGGBB`)
- `#RGBA` — short form with alpha

```js
font.addPalette(['#FF0000', '#00FF0080']); // red, semi-transparent green
```

### Updating colors

```js
font.setPaletteColor(0, 1, '#0000FF'); // change palette 0, color 1 to blue
```

### Listing and removing palettes

```js
font.palettes; // live array of all palettes
font.getPalette(0); // ['#ff0000', '#00ff0080']
font.removePalette(1); // remove the second palette
```

## Color glyphs (COLRv0 — layer stacking)

The layer-based approach is the simplest and most widely supported. Each color glyph has:

- `name` — the base glyph this color definition applies to
- `layers` — an ordered array of `{ glyph, paletteIndex }` drawn bottom-to-top

```js
font.addColorGlyph({
	name: 'A',
	layers: [
		{ glyph: 'A.outline', paletteIndex: 0 },
		{ glyph: 'A.fill', paletteIndex: 1 },
		{ glyph: 'A.highlight', paletteIndex: 2 },
	],
});
```

The `glyph` field references the name of another glyph in the font — that glyph's outline is drawn in the specified palette color. Layer glyphs don't need a Unicode mapping; they're only used as color layers.

### Looking up and removing color glyphs

```js
font.getColorGlyph('A'); // { name: 'A', layers: [...] }
font.getColorGlyph(65); // also works (by code point)
font.listColorGlyphs(); // [{ name: 'A', type: 'layers' }]
font.removeColorGlyph('A'); // remove color data for A
```

Removing color data doesn't remove the base glyph or its layer glyphs — it only removes the COLR association.

## Color glyphs (COLRv1 — paint trees)

For advanced color rendering (gradients, transforms, compositing), COLRv1 uses a paint tree instead of flat layers. Font Flux supports the full paint tree structure:

```js
font.addColorGlyph({
	name: 'B',
	paint: {
		format: 10, // PaintGlyph
		glyphID: 'B.outline',
		paint: {
			format: 2, // PaintSolid
			paletteIndex: 0,
			alpha: 1.0,
		},
	},
});
```

Paint formats follow the [OpenType COLRv1 spec](https://learn.microsoft.com/en-us/typography/opentype/spec/colr). The most common formats:

| Format | Name                | Description                         |
| ------ | ------------------- | ----------------------------------- |
| 1      | PaintColrLayers     | Reference a slice of the layer list |
| 2      | PaintSolid          | Solid color fill                    |
| 4      | PaintLinearGradient | Linear gradient                     |
| 6      | PaintRadialGradient | Radial gradient                     |
| 8      | PaintSweepGradient  | Sweep/conic gradient                |
| 10     | PaintGlyph          | Clip paint to a glyph outline       |
| 12     | PaintTransform      | Apply affine transform              |
| 14     | PaintTranslate      | Translate                           |
| 16     | PaintScale          | Scale                               |
| 24     | PaintRotate         | Rotate                              |
| 32     | PaintComposite      | Porter-Duff compositing             |

In paint trees, `glyphID` fields accept glyph names (resolved to indices on export).

## Editing imported color fonts

When you open an existing color font, palettes and color glyphs are extracted into the simplified representation:

```js
const font = FontFlux.open(buffer);

// Inspect
console.log(font.palettes); // [['#c90900', '#ffffff'], ...]
console.log(font.listColorGlyphs()); // [{ name: 'A', type: 'layers' }, ...]

// Modify a color
font.setPaletteColor(0, 0, '#0000FF');

// Re-export
const output = font.export();
```

## Validation

Run `.validate()` before export. The validator checks:

- Color glyph layer references point to existing glyphs
- Palette indices are within range of the palette size
- All palettes have the same number of entries
