import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const srcRoots = [
	{ dir: path.join(repoRoot, 'src', 'sfnt'), family: 'Shared SFNT' },
	{ dir: path.join(repoRoot, 'src', 'otf'), family: 'OTF-specific' },
	{ dir: path.join(repoRoot, 'src', 'ttf'), family: 'TTF-specific' },
];
const docsDir = path.join(repoRoot, 'docs', 'tables');

const OPENTYPE_TABLE_REGISTRY =
	'https://learn.microsoft.com/en-us/typography/opentype/spec/otff#font-tables';

const TABLE_TAG_OVERRIDES = {
	CFF: 'CFF ',
	SVG: 'SVG ',
	'OS-2': 'OS/2',
	cvt: 'cvt ',
};

const TYPE_HINTS = {
	uint8: 'number (0..255)',
	uint16: 'number (0..65535)',
	uint24: 'number',
	uint32: 'number',
	int8: 'number (-128..127)',
	int16: 'number (-32768..32767)',
	int32: 'number',
	offset16: 'number',
	offset32: 'number',
	fword: 'number',
	ufword: 'number',
	fixed: 'number (16.16 fixed)',
	longDateTime: 'number (seconds since 1904-01-01 UTC)',
	tag: 'string (4-char tag)',
	array: 'array',
	bytes: 'number[]',
	write: 'implementation-defined',
	unknown: 'implementation-defined',
};

const SPEC_TYPE_TO_HINT = {
	uint8: TYPE_HINTS.uint8,
	uint16: TYPE_HINTS.uint16,
	uint24: TYPE_HINTS.uint24,
	uint32: TYPE_HINTS.uint32,
	int8: TYPE_HINTS.int8,
	int16: TYPE_HINTS.int16,
	int32: TYPE_HINTS.int32,
	fword: TYPE_HINTS.fword,
	ufword: TYPE_HINTS.ufword,
	fixed: TYPE_HINTS.fixed,
	offset16: TYPE_HINTS.offset16,
	offset32: TYPE_HINTS.offset32,
	longdatetime: TYPE_HINTS.longDateTime,
	tag: TYPE_HINTS.tag,
};

const PLACEHOLDER_BY_READER = {
	uint8: 0,
	uint16: 0,
	uint24: 0,
	uint32: 0,
	int8: 0,
	int16: 0,
	int32: 0,
	offset16: 0,
	offset32: 0,
	fword: 0,
	ufword: 0,
	fixed: 0,
	longDateTime: 0,
	tag: 'ABCD',
	array: [],
	bytes: [],
	write: null,
	unknown: null,
};

const TABLE_DEEP_SECTIONS = {
	GDEF: `## Nested JSON Structure

Common parsed shape (optional blocks appear only when present in source data):

\`\`\`json
{
	"majorVersion": 1,
	"minorVersion": 3,
	"glyphClassDef": { "format": 1, "startGlyphID": 0, "classValueArray": [1, 2] },
	"attachList": {
		"coverage": { "format": 1, "glyphArray": [10, 11] },
		"attachPoints": [[12, 45], [20]]
	},
	"ligCaretList": {
		"coverage": { "format": 1, "glyphArray": [50] },
		"ligGlyphs": [[
			{ "format": 1, "coordinate": 320 },
			{ "format": 2, "caretValuePointIndex": 7 },
			{ "format": 3, "coordinate": 400, "device": { "format": 1, "deltaFormat": 2, "deltaValues": [0] } }
		]]
	},
	"markAttachClassDef": { "format": 2, "classRangeRecords": [{ "start": 100, "end": 120, "class": 1 }] },
	"markGlyphSetsDef": {
		"format": 1,
		"coverages": [
			{ "format": 1, "glyphArray": [200, 201] }
		]
	},
	"itemVarStoreOffset": 1234,
	"itemVarStoreRaw": [0, 1, 2]
}
\`\`\`

Notes:

- \`itemVarStoreRaw\` preserves binary bytes (not fully parsed yet).
- ClassDef/Coverage/Device object formats are shared OpenType Layout structures.
`,
	GPOS: `## Nested JSON Structure

Top-level layout (shared OpenType Layout container):

\`\`\`json
{
	"majorVersion": 1,
	"minorVersion": 1,
	"scriptList": { "scriptRecords": [] },
	"featureList": { "featureRecords": [] },
	"lookupList": {
		"lookups": [
			{
				"lookupType": 1,
				"lookupFlag": 0,
				"subtables": [
					{
						"format": 1,
						"coverage": { "format": 1, "glyphArray": [10, 11] },
						"valueFormat": 5,
						"valueRecord": { "xPlacement": 20, "xAdvance": 30 }
					}
				]
			}
		]
	},
	"featureVariations": { "featureVariationRecords": [] }
}
\`\`\`

Lookup subtable families by \`lookupType\`:

- \`1\` SinglePos: \`valueFormat\` + \`valueRecord\` or \`valueRecords[]\`.
- \`2\` PairPos: either \`pairSets[]\` (format 1) or class-based \`class1Records\` (format 2).
- \`3\` CursivePos: \`entryExitRecords[]\` with \`entryAnchor\`/\`exitAnchor\`.
- \`4\` MarkBasePos: \`markArray\` + \`baseArray\`.
- \`5\` MarkLigPos: \`markArray\` + \`ligatureArray\`.
- \`6\` MarkMarkPos: \`mark1Array\` + \`mark2Array\`.
- \`7\` ContextPos and \`8\` ChainedContextPos: shared Sequence/ChainedSequence context structures.
- \`9\` ExtensionPos: wraps another positioning subtable in \`subtable\` with \`extensionLookupType\`.
`,
	GSUB: `## Nested JSON Structure

Top-level layout matches OpenType Layout GSUB container:

\`\`\`json
{
	"majorVersion": 1,
	"minorVersion": 1,
	"scriptList": { "scriptRecords": [] },
	"featureList": { "featureRecords": [] },
	"lookupList": {
		"lookups": [
			{
				"lookupType": 4,
				"lookupFlag": 0,
				"subtables": [
					{
						"format": 1,
						"coverage": { "format": 1, "glyphArray": [30] },
						"ligatureSets": [
							[
								{ "ligatureGlyph": 400, "componentCount": 3, "componentGlyphIDs": [31, 32] }
							]
						]
					}
				]
			}
		]
	},
	"featureVariations": { "featureVariationRecords": [] }
}
\`\`\`

Lookup subtable families by \`lookupType\`:

- \`1\` SingleSubst: \`deltaGlyphID\` (format 1) or \`substituteGlyphIDs[]\` (format 2).
- \`2\` MultipleSubst: \`sequences[][]\`.
- \`3\` AlternateSubst: \`alternateSets[][]\`.
- \`4\` LigatureSubst: \`ligatureSets[][]\` with \`ligatureGlyph\` and component list.
- \`5\` ContextSubst and \`6\` ChainedContextSubst: shared Sequence/ChainedSequence context structures.
- \`7\` ExtensionSubst: wraps another substitution subtable in \`subtable\` with \`extensionLookupType\`.
- \`8\` ReverseChainSingleSubst: \`backtrackCoverages[]\`, \`lookaheadCoverages[]\`, \`substituteGlyphIDs[]\`.
`,
	CFF: `## Nested JSON Structure

Parsed CFF v1 table:

\`\`\`json
{
	"majorVersion": 1,
	"minorVersion": 0,
	"names": ["FontName"],
	"strings": ["CustomString"],
	"globalSubrs": [[0, 1, 2]],
	"fonts": [
		{
			"topDict": { "FullName": 391, "Weight": 392 },
			"charset": { "format": 0, "glyphSIDs": [0, 1, 2] },
			"encoding": { "format": 0, "codes": [{ "code": 65, "glyph": 1 }] },
			"charStrings": [[139, 14]],
			"privateDict": { "BlueValues": [0, 10] },
			"localSubrs": [[11]],
			"isCIDFont": true,
			"fdArray": [
				{
					"fontDict": { "FontName": 393 },
					"privateDict": { "BlueScale": 0.039625 },
					"localSubrs": [[11]]
				}
			],
			"fdSelect": { "format": 3, "ranges": [{ "first": 0, "fd": 0 }], "sentinel": 500 }
		}
	]
}
\`\`\`

Notes:

- \`charStrings\`, \`globalSubrs\`, and \`localSubrs\` are byte arrays (Type 2 charstring programs) preserved as raw bytes.
- Offsets (for charset/encoding/Private/FDArray/FDSelect) are resolved during parse and re-derived during write.
`,
	CFF2: `## Nested JSON Structure

Parsed CFF2 table:

\`\`\`json
{
	"majorVersion": 2,
	"minorVersion": 0,
	"topDict": { "FontMatrix": [0.001, 0, 0, 0.001, 0, 0] },
	"globalSubrs": [[0, 1]],
	"charStrings": [[139, 14]],
	"fontDicts": [
		{
			"fontDict": { "FontName": 391 },
			"privateDict": { "BlueScale": 0.039625 },
			"localSubrs": [[11]]
		}
	],
	"fdSelect": { "format": 3, "ranges": [{ "first": 0, "fd": 0 }], "sentinel": 500 },
	"variationStore": [0, 20, 0, 1]
}
\`\`\`

Notes:

- CFF2 has no Name INDEX, no String INDEX, and no Encoding table.
- \`variationStore\` is currently stored as raw bytes.
- Private DICT and local subroutines are represented per entry in \`fontDicts[]\`.
`,
	gvar: `## Nested JSON Structure

Parsed gvar container shape:

\`\`\`json
{
	"majorVersion": 1,
	"minorVersion": 0,
	"axisCount": 2,
	"flags": 0,
	"sharedTuples": [
		[1.0, 0.0],
		[0.5, -0.25]
	],
	"glyphVariationData": [
		[0, 16, 32],
		[]
	]
}
\`\`\`

Notes:

- This implementation parses/writes gvar container metadata and stores per-glyph variation tuple data as raw bytes.
- \`glyphVariationData\` length defines glyph count for write.
- Short vs long internal offsets are selected automatically on write based on payload size/alignment.
`,
};

const TABLE_CONSTRAINT_SECTIONS = {
	GDEF: `## Validation Constraints

- Requires OpenType Layout context: usually authored together with \`GPOS\` and/or \`GSUB\`.
- \`minorVersion >= 2\` enables \`markGlyphSetsDef\`.
- \`minorVersion >= 3\` enables \`itemVarStoreOffset\` / \`itemVarStoreRaw\`.
- For attachment/caret/glyph-set blocks, coverage sizes should align with corresponding arrays.

## Authoring Example

\`\`\`json
{
	"tables": {
		"GDEF": {
			"majorVersion": 1,
			"minorVersion": 2,
			"glyphClassDef": { "format": 1, "startGlyphID": 0, "classValues": [1, 2, 3] },
			"_checksum": 0
		}
	}
}
\`\`\`
`,
	GPOS: `## Validation Constraints

- \`majorVersion\` is typically \`1\`.
- \`minorVersion >= 1\` may include \`featureVariations\`.
- Each lookup's \`lookupType\` must match the subtable shapes it contains.
- ValueRecord fields must match \`valueFormat\` bits (for Single/Pair positioning subtables).
- Practical dependency: keep \`GDEF\` present when using mark attachment lookups (types 4, 5, 6).

## Authoring Example

\`\`\`json
{
	"tables": {
		"GPOS": {
			"majorVersion": 1,
			"minorVersion": 0,
			"scriptList": { "scriptRecords": [] },
			"featureList": { "featureRecords": [] },
			"lookupList": { "lookups": [] },
			"_checksum": 0
		}
	}
}
\`\`\`
`,
	GSUB: `## Validation Constraints

- \`majorVersion\` is typically \`1\`.
- \`minorVersion >= 1\` may include \`featureVariations\`.
- Each lookup's \`lookupType\` must match the subtable shapes it contains.
- Coverage arrays should align with replacement/substitution arrays by index.
- Extension lookups (type 7) must point to a valid wrapped subtable type.

## Authoring Example

\`\`\`json
{
	"tables": {
		"GSUB": {
			"majorVersion": 1,
			"minorVersion": 0,
			"scriptList": { "scriptRecords": [] },
			"featureList": { "featureRecords": [] },
			"lookupList": { "lookups": [] },
			"_checksum": 0
		}
	}
}
\`\`\`
`,
	CFF: `## Validation Constraints

- Use tag \`"CFF "\` (with trailing space) in table JSON.
- CFF outlines are an alternative to TrueType \`glyf\`/\`loca\`; avoid mixing outline models unless intentional.
- \`fonts[]\` entries should include consistent \`charStrings\`, \`charset\`, and \`encoding\` payloads.
- CID-keyed fonts require coherent \`fdArray\` and \`fdSelect\` structures.

## Authoring Example

\`\`\`json
{
	"tables": {
		"CFF ": {
			"majorVersion": 1,
			"minorVersion": 0,
			"names": ["ExampleFont"],
			"strings": [],
			"globalSubrs": [],
			"fonts": [
				{
					"topDict": {},
					"charset": { "format": 0, "glyphSIDs": [0] },
					"encoding": { "format": 0, "codes": [] },
					"charStrings": [[14]],
					"privateDict": {},
					"localSubrs": []
				}
			],
			"_checksum": 0
		}
	}
}
\`\`\`
`,
	CFF2: `## Validation Constraints

- CFF2 outlines are an alternative to TrueType \`glyf\`/\`loca\`.
- \`majorVersion\` should be \`2\` for standard CFF2 data.
- Keep \`charStrings\` glyph count aligned with \`fdSelect\` ranges when \`fdSelect\` is present.
- \`variationStore\` is currently treated as raw bytes; preserve byte integrity if editing manually.

## Authoring Example

\`\`\`json
{
	"tables": {
		"CFF2": {
			"majorVersion": 2,
			"minorVersion": 0,
			"topDict": {},
			"globalSubrs": [],
			"charStrings": [[14]],
			"fontDicts": [],
			"fdSelect": null,
			"variationStore": null,
			"_checksum": 0
		}
	}
}
\`\`\`
`,
	gvar: `## Validation Constraints

- \`gvar\` is meaningful with variable-font axis definitions from \`fvar\` (validator warns when missing).
- \`axisCount\` should match the number of variation axes.
- \`glyphVariationData.length\` defines glyph count for writing offsets.
- Per-glyph tuple payloads are raw bytes in this implementation; preserve exact bytes when editing.

## Authoring Example

\`\`\`json
{
	"tables": {
		"gvar": {
			"majorVersion": 1,
			"minorVersion": 0,
			"axisCount": 2,
			"flags": 0,
			"sharedTuples": [[1.0, 0.0]],
			"glyphVariationData": [[], []],
			"_checksum": 0
		}
	}
}
\`\`\`
`,
	COLR: `## Validation Constraints

- \`version = 0\`: use parsed \`baseGlyphRecords\` and \`layerRecords\`.
- \`version >= 1\`: this implementation preserves v1 paint graph data as \`_v1RawBytes\` for round-trip safety.
- For v0 data, each BaseGlyphRecord's \`firstLayerIndex\`/\`numLayers\` should reference valid ranges inside \`layerRecords\`.
- \`paletteIndex\` entries in layers should be valid for the active CPAL palette entry count.

## Authoring Example

\`\`\`json
{
	"tables": {
		"COLR": {
			"version": 0,
			"baseGlyphRecords": [
				{ "glyphID": 100, "firstLayerIndex": 0, "numLayers": 2 }
			],
			"layerRecords": [
				{ "glyphID": 101, "paletteIndex": 0 },
				{ "glyphID": 102, "paletteIndex": 1 }
			],
			"_checksum": 0
		}
	}
}
\`\`\`
`,
	CPAL: `## Validation Constraints

- \`numPaletteEntries\` should match the length of each palette in \`palettes[]\`.
- \`version = 0\` supports basic palette arrays only.
- \`version >= 1\` may include \`paletteTypes\`, \`paletteLabels\`, and \`paletteEntryLabels\`.
- All color channels are uint8 BGRA values (\`blue\`, \`green\`, \`red\`, \`alpha\`).

## Authoring Example

\`\`\`json
{
	"tables": {
		"CPAL": {
			"version": 0,
			"numPaletteEntries": 2,
			"palettes": [
				[
					{ "blue": 0, "green": 0, "red": 0, "alpha": 255 },
					{ "blue": 255, "green": 255, "red": 255, "alpha": 255 }
				]
			],
			"_checksum": 0
		}
	}
}
\`\`\`
`,
	name: `## Validation Constraints

- \`version\` supports 0 or 1 in this implementation.
- Each entry in \`names[]\` should include \`platformID\`, \`encodingID\`, \`languageID\`, \`nameID\`, and \`value\`.
- For \`version = 1\`, optional \`langTagRecords[]\` entries provide BCP 47 tags.
- String encoding is platform-sensitive; unsupported data can be preserved with \`"0x:..."\` value form.

## Authoring Example

\`\`\`json
{
	"tables": {
		"name": {
			"version": 0,
			"names": [
				{ "platformID": 3, "encodingID": 1, "languageID": 1033, "nameID": 1, "value": "Example Family" },
				{ "platformID": 3, "encodingID": 1, "languageID": 1033, "nameID": 2, "value": "Regular" }
			],
			"_checksum": 0
		}
	}
}
\`\`\`
`,
	'OS-2': `## Validation Constraints

- \`version\` controls field presence and binary size (0 through 5 supported).
- Legacy short v0 form (68-byte stop at \`usLastCharIndex\`) is supported when typo/win fields are omitted.
- \`panose\` must be a 10-byte array.
- For \`version >= 1\`, include code page range fields; for \`version >= 2\`, include x-height/cap-height/default/break/max-context fields; for \`version >= 5\`, include optical point size fields.

## Authoring Example

\`\`\`json
{
	"tables": {
		"OS/2": {
			"version": 4,
			"xAvgCharWidth": 500,
			"usWeightClass": 400,
			"usWidthClass": 5,
			"fsType": 0,
			"panose": [2, 11, 6, 4, 2, 2, 2, 2, 2, 4],
			"achVendID": "NONE",
			"usFirstCharIndex": 32,
			"usLastCharIndex": 65535,
			"sTypoAscender": 800,
			"sTypoDescender": -200,
			"sTypoLineGap": 0,
			"usWinAscent": 1000,
			"usWinDescent": 250,
			"ulCodePageRange1": 1,
			"ulCodePageRange2": 0,
			"sxHeight": 500,
			"sCapHeight": 700,
			"usDefaultChar": 0,
			"usBreakChar": 32,
			"usMaxContext": 2,
			"_checksum": 0
		}
	}
}
\`\`\`
`,
	STAT: `## Validation Constraints

- \`majorVersion\` is typically \`1\`; \`minorVersion\` commonly 0, 1, or 2.
- \`designAxisSize\` must be large enough for axis records (base size 8 plus any \`_extra\` bytes).
- Axis value records must use supported formats 1, 2, 3, or 4; unknown formats should be preserved via \`_raw\` bytes.
- \`minorVersion >= 1\` supports \`elidedFallbackNameID\`.

## Authoring Example

\`\`\`json
{
	"tables": {
		"STAT": {
			"majorVersion": 1,
			"minorVersion": 2,
			"designAxisSize": 8,
			"designAxes": [
				{ "axisTag": "wght", "axisNameID": 256, "axisOrdering": 0 }
			],
			"axisValues": [
				{ "format": 1, "axisIndex": 0, "flags": 0, "valueNameID": 257, "value": 400 }
			],
			"elidedFallbackNameID": 2,
			"_checksum": 0
		}
	}
}
\`\`\`
`,
	fvar: `## Validation Constraints

- \`axisSize\` is 20 for the current format; each axis needs \`axisTag\`, min/default/max values, and name/flags metadata.
- Instance coordinate count should match the number of axes.
- \`instanceSize\` grows by 2 bytes when any instance uses \`postScriptNameID\`.
- \`reserved\` is typically \`2\`.

## Authoring Example

\`\`\`json
{
	"tables": {
		"fvar": {
			"majorVersion": 1,
			"minorVersion": 0,
			"reserved": 2,
			"axes": [
				{ "axisTag": "wght", "minValue": 100, "defaultValue": 400, "maxValue": 900, "flags": 0, "axisNameID": 256 }
			],
			"instances": [
				{ "subfamilyNameID": 257, "flags": 0, "coordinates": [400], "postScriptNameID": 258 }
			],
			"_checksum": 0
		}
	}
}
\`\`\`
`,
	avar: `## Validation Constraints

- \`segmentMaps.length\` should match axis count from \`fvar\`.
- Each segment map should include monotonic \`axisValueMaps\` pairs from normalized \`fromCoordinate\` to \`toCoordinate\` values.
- Coordinates are F2DOT14 values in normalized axis space.
- \`reserved\` is typically \`0\`.

## Authoring Example

\`\`\`json
{
	"tables": {
		"avar": {
			"majorVersion": 1,
			"minorVersion": 0,
			"reserved": 0,
			"segmentMaps": [
				{
					"axisValueMaps": [
						{ "fromCoordinate": -1.0, "toCoordinate": -1.0 },
						{ "fromCoordinate": 0.0, "toCoordinate": 0.0 },
						{ "fromCoordinate": 1.0, "toCoordinate": 1.0 }
					]
				}
			],
			"_checksum": 0
		}
	}
}
\`\`\`
`,
};

function listTableFiles() {
	const files = [];
	for (const root of srcRoots) {
		if (!fs.existsSync(root.dir)) continue;
		for (const name of fs.readdirSync(root.dir)) {
			if (!name.startsWith('table_') || !name.endsWith('.js')) continue;
			files.push({
				path: path.join(root.dir, name),
				fileName: name,
				family: root.family,
			});
		}
	}
	return files;
}

function toTableDocName(fileName) {
	return fileName.replace(/^table_/, '').replace(/\.js$/, '');
}

function toTableTag(docName) {
	return TABLE_TAG_OVERRIDES[docName] || docName;
}

function extractSpecUrls(sourceText) {
	const urls = [];
	const re = /Spec:\s*(https?:\/\/\S+)/g;
	let m;
	while ((m = re.exec(sourceText))) {
		const clean = m[1].replace(/[),.;]*$/, '');
		if (!urls.includes(clean)) urls.push(clean);
	}
	return urls;
}

function extractWriteParamName(sourceText) {
	const m = sourceText.match(
		/export\s+function\s+write\w+\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)/,
	);
	return m ? m[1] : null;
}

function extractWriteFunctionBody(sourceText) {
	const m = sourceText.match(
		/export\s+function\s+write\w+\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/,
	);
	return m ? m[1] : '';
}

function extractFieldDocs(sourceText) {
	const lines = sourceText.split(/\r?\n/);
	const docs = new Map();

	for (const line of lines) {
		const prefixMatch = line.match(/^\s*\*\s+(.*)$/);
		if (!prefixMatch) continue;

		const content = prefixMatch[1];
		const parts = content
			.split(/\s{2,}/)
			.map((s) => s.trim())
			.filter(Boolean);

		if (parts.length < 2) continue;
		const specTypeRaw = parts[0];
		if (!/^[A-Za-z][A-Za-z0-9.]*$/.test(specTypeRaw)) continue;

		const fieldMatch = parts[1].match(
			/^([A-Za-z_][A-Za-z0-9_]*)(?:\[[^\]]+\])?$/,
		);
		if (!fieldMatch) continue;
		const field = fieldMatch[1];

		let note = parts.slice(2).join(' ');
		note = note.replace(/^[—-]\s*/, '').trim();
		const specType = specTypeRaw.toLowerCase();
		const hint = SPEC_TYPE_TO_HINT[specType] || TYPE_HINTS.unknown;

		if (!docs.has(field)) {
			docs.set(field, {
				specType: specTypeRaw,
				hint,
				note,
			});
		}
	}

	return docs;
}

function extractKeys(sourceText) {
	const lines = sourceText.split(/\r?\n/);
	const topLevel = [];
	const topLevelSet = new Set();
	const allKeys = [];
	const allKeySet = new Set();
	const hints = new Map();

	const writeParam = extractWriteParamName(sourceText);
	const writeBody = extractWriteFunctionBody(sourceText);

	function addTop(key, hint = 'unknown') {
		if (!key || key === '_checksum' || key === '_raw') return;
		if (!topLevelSet.has(key)) {
			topLevelSet.add(key);
			topLevel.push(key);
		}
		if (
			!hints.has(key) ||
			hints.get(key) === 'unknown' ||
			hints.get(key) === 'write'
		) {
			hints.set(key, hint);
		}
	}

	function addAny(key) {
		if (!key || key === '_checksum' || key === '_raw') return;
		if (!allKeySet.has(key)) {
			allKeySet.add(key);
			allKeys.push(key);
		}
	}

	// Top-level keys are derived primarily from write* input usage so the
	// documented JSON shape matches authoring expectations.
	if (writeParam) {
		const writeBodyLines = writeBody.split(/\r?\n/);

		const multiDestructureRe = new RegExp(
			`\\b(?:const|let|var)\\s*\\{([\\s\\S]*?)\\}\\s*=\\s*${writeParam}\\b`,
			'g',
		);
		let md;
		while ((md = multiDestructureRe.exec(writeBody))) {
			const entries = md[1]
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);
			for (const entry of entries) {
				const lhs = entry.split('=')[0].trim();
				const key = lhs.split(':')[0].trim();
				if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
					addTop(key, 'write');
				}
			}
		}

		for (const line of writeBodyLines) {
			const directRe = new RegExp(
				`\\b${writeParam}\\.([A-Za-z_][A-Za-z0-9_]*)`,
				'g',
			);
			let dm;
			while ((dm = directRe.exec(line))) {
				addTop(dm[1], 'write');
			}

			const destructureRe = new RegExp(
				`\\b(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*${writeParam}\\b`,
			);
			const dmatch = line.match(destructureRe);
			if (dmatch) {
				const entries = dmatch[1]
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean);
				for (const entry of entries) {
					const lhs = entry.split('=')[0].trim();
					const key = lhs.split(':')[0].trim();
					if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
						addTop(key, 'write');
					}
				}
			}
		}
	}

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) {
			continue;
		}

		let m = line.match(
			/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*reader\.([A-Za-z0-9_]+)\(/,
		);
		if (m) {
			if (!topLevelSet.size || topLevelSet.has(m[1])) addTop(m[1], m[2]);
			addAny(m[1]);
		}

		m = line.match(
			/\b(?:result|table|output|out)\.([A-Za-z_][A-Za-z0-9_]*)\s*=\s*reader\.([A-Za-z0-9_]+)\(/,
		);
		if (m) {
			if (!topLevelSet.size || topLevelSet.has(m[1])) addTop(m[1], m[2]);
			addAny(m[1]);
		}

		m = line.match(
			/\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*reader\.([A-Za-z0-9_]+)\(/,
		);
		if (m) {
			if (topLevelSet.has(m[1])) addTop(m[1], m[2]);
		}

		m = line.match(
			/\b(?:result|table|output|out)\.([A-Za-z_][A-Za-z0-9_]*)\s*=/,
		);
		if (m) {
			if (!topLevelSet.size) addTop(m[1], 'unknown');
			addAny(m[1]);
		}

		m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:/);
		if (m) {
			const key = m[1];
			if (!['case', 'default', 'const', 'let', 'var', 'return'].includes(key)) {
				addAny(key);
			}
		}
	}

	return {
		topLevel,
		allKeys,
		hints,
	};
}

function jsonSkeleton(tableTag, topLevel, hints) {
	const body = {};
	for (const key of topLevel) {
		const hint = hints.get(key) || 'unknown';
		body[key] = PLACEHOLDER_BY_READER[hint] ?? null;
	}
	body._checksum = 0;

	return JSON.stringify({ tables: { [tableTag]: body } }, null, 2);
}

function buildDoc({ tableTag, docName, family, specUrls, keys, fieldDocs }) {
	const titleTag = tableTag;
	const specLines = specUrls.length
		? specUrls.map((url) => `- ${url}`).join('\n')
		: '- (No explicit spec URL found in implementation source)';

	const fieldsList = keys.topLevel.length
		? keys.topLevel
				.map((key) => {
					const inlineDoc = fieldDocs.get(key);
					const hint = keys.hints.get(key) || 'unknown';
					const typeHint =
						TYPE_HINTS[hint] || inlineDoc?.hint || TYPE_HINTS.unknown;
					const note = inlineDoc?.note ? ` (${inlineDoc.note})` : '';
					const specType = inlineDoc?.specType
						? ` [spec type: \`${inlineDoc.specType}\`]`
						: '';
					return `- \`${key}\` - ${typeHint}${specType}${note}`;
				})
				.join('\n')
		: '- No strongly inferred top-level parsed fields found (table may be raw/opaque or heavily nested).';

	const nestedList = keys.allKeys.length
		? keys.allKeys.map((key) => `- \`${key}\``).join('\n')
		: '- None inferred from source.';

	const skeleton = jsonSkeleton(tableTag, keys.topLevel, keys.hints);
	const deepSection = TABLE_DEEP_SECTIONS[docName]
		? `\n${TABLE_DEEP_SECTIONS[docName]}\n`
		: '';
	const constraintSection = TABLE_CONSTRAINT_SECTIONS[docName]
		? `\n${TABLE_CONSTRAINT_SECTIONS[docName]}\n`
		: '';

	return `# \`${titleTag}\` table

## Scope

- Format family: ${family}
- Table tag in JSON: \`${tableTag}\`

## Specs

${specLines}
- OpenType table registry: ${OPENTYPE_TABLE_REGISTRY}

## JSON Skeleton

This skeleton reflects fields currently parsed/written by Font Flux JS for this table.

\`\`\`json
${skeleton}
\`\`\`

## Top-level Fields

${fieldsList}

${deepSection}

${constraintSection}

## Additional Nested Keys Seen In Implementation

${nestedList}

## Notes

- Preserve \`_checksum\` for stable round-tripping.
- If a table is only partially understood, prefer keeping unknown bytes in \`_raw\` instead of dropping data.
- Validate with \`validateJSON\` after edits.
`;
}

function main() {
	const tableFiles = listTableFiles();
	let updated = 0;

	for (const tableFile of tableFiles) {
		const docName = toTableDocName(tableFile.fileName);
		const docPath = path.join(docsDir, `${docName}.md`);
		if (!fs.existsSync(docPath)) continue;

		const sourceText = fs.readFileSync(tableFile.path, 'utf8');
		const specUrls = extractSpecUrls(sourceText);
		const tableTag = toTableTag(docName);
		const keys = extractKeys(sourceText);
		const fieldDocs = extractFieldDocs(sourceText);
		const content = buildDoc({
			tableTag,
			docName,
			family: tableFile.family,
			specUrls,
			keys,
			fieldDocs,
		});

		fs.writeFileSync(docPath, content, 'utf8');
		updated++;
	}

	console.log(`Updated ${updated} table doc files.`);
}

main();
