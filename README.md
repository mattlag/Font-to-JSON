# Font Flux JS

Convert a font file to JSON... and back!

Font Flux JS is a JavaScript library for parsing OpenType/TrueType font binaries into JSON, then exporting that JSON back into a valid font binary.

# How to use

Use the built library file from `dist/font-flux-js.js`.

```html
<script type="module">
	import { importFont, exportFont } from './dist/font-flux-js.js';

	// 1) Load a font file (ArrayBuffer)
	const response = await fetch('./fonts/MyFont.ttf');
	const buffer = await response.arrayBuffer();

	// 2) Convert binary font -> JSON
	const fontJson = importFont(buffer);

	// 3) (Optional) modify JSON
	// Example: keep as-is or edit fields like fontJson.tables.name

	// 4) Convert JSON -> binary font
	const outputBuffer = exportFont(fontJson);

	// 5) Save/download the output
	const blob = new Blob([outputBuffer], { type: 'font/ttf' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'MyFont-roundtrip.ttf';
	a.click();
	URL.revokeObjectURL(url);
</script>
```

# Support

## Font formats covered

- OTF (`.otf`, `.otc`) — supported
- TTF (`.ttf`, `.ttc`) — supported

## Supported tables by format

- Shared SFNT tables (used by both OTF and TTF): `BASE`, `CBDT`, `CBLC`, `COLR`, `CPAL`, `DSIG`, `EBDT`, `EBLC`, `EBSC`, `GDEF`, `GPOS`, `GSUB`, `HVAR`, `JSTF`, `LTSH`, `MATH`, `MERG`, `MVAR`, `OS/2`, `PCLT`, `STAT`, `SVG `, `VDMX`, `VVAR`, `avar`, `cmap`, `fvar`, `hdmx`, `head`, `hhea`, `hmtx`, `kern`, `maxp`, `meta`, `name`, `post`, `sbix`, `vhea`, `vmtx`
- OTF-specific tables: `CFF `, `CFF2`, `VORG`
- TTF-specific tables: `cvar`, `cvt `, `fpgm`, `gasp`, `glyf`, `gvar`, `loca`, `prep`
