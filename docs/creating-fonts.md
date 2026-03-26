# Creating Fonts

Use these guides when authoring Font Flux JSON from scratch.

## Choose a target format

- [Creating an OTF](./creating-otf.md)
- [Creating a TTF](./creating-ttf.md)
- [Creating a TTC / OTC Collection](./creating-ttc-otc.md)

## Shared workflow

1. Start from a minimal valid JSON shape with `header` and `tables`.
2. Add required tables for your target format first.
3. Add optional tables only when needed for features (layout, color, variations, metadata).
4. Run `validateJSON` frequently.
5. Export only when `report.valid === true`.

## Container formats (WOFF / WOFF2)

By default, `exportFont` outputs raw SFNT bytes. You can wrap the output in a WOFF or WOFF2 container using the `format` option:

```js
import { initWoff2, exportFont } from 'font-flux-js';

await initWoff2(); // Required once before WOFF2 use

const woff = exportFont(fontData, { format: 'woff' });   // WOFF 1.0 (zlib)
const woff2 = exportFont(fontData, { format: 'woff2' }); // WOFF 2.0 (Brotli)
```

Fonts imported from WOFF or WOFF2 files re-export to their original format by default. Use `format: 'sfnt'` to force raw SFNT output.

See [Validation guide](./guide/validation.md) and [All table references](./tables/index.md).
