/**
 * Font Flux JS : COLR v1 Paint table parser / writer
 *
 * Parses and writes the 32 Paint formats, ColorLine/VarColorLine,
 * Affine2x3/VarAffine2x3, BaseGlyphList, LayerList, ClipList, and
 * DeltaSetIndexMap for the COLR version 1 table.
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/colr
 *
 * The Paint tables form a DAG (directed acyclic graph). During parsing,
 * a cache keyed by absolute byte offset ensures that shared subtables
 * produce the same JS object. During writing, identity-based dedup
 * recovers the sharing, and topological sort ensures forward offsets.
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';
import {
	parseItemVariationStore,
	writeItemVariationStore,
} from './item_variation_store.js';

// ===================================================================
//  PAINT HEADER SIZES (bytes, excluding inline subtables)
// ===================================================================
const PAINT_HEADER_SIZE = [
	0, // index 0 unused
	6,
	5,
	9, // 1-3
	16,
	20, // 4-5  (+ ColorLine / VarColorLine inline)
	16,
	20, // 6-7  (+ ColorLine / VarColorLine inline)
	12,
	16, // 8-9  (+ ColorLine / VarColorLine inline)
	6,
	3, // 10-11
	7,
	7, // 12-13 (+ Affine2x3 / VarAffine2x3 inline)
	8,
	12, // 14-15
	8,
	12, // 16-17
	12,
	16, // 18-19
	6,
	10, // 20-21
	10,
	14, // 22-23
	6,
	10, // 24-25
	10,
	14, // 26-27
	8,
	12, // 28-29
	12,
	16, // 30-31
	8, // 32
];

// ===================================================================
//  DeltaSetIndexMap  (local parse/write — same format as HVAR/VVAR)
// ===================================================================
const INNER_BIT_MASK = 0x0f;
const ENTRY_SIZE_MASK = 0x30;

function readUIntN(reader, size) {
	if (size === 1) return reader.uint8();
	if (size === 2) return reader.uint16();
	if (size === 3) return reader.uint24();
	return reader.uint32();
}

function writeUIntN(w, value, size) {
	if (size === 1) w.uint8(value);
	else if (size === 2) w.uint16(value);
	else if (size === 3) w.uint24(value);
	else w.uint32(value >>> 0);
}

function parseDeltaSetIndexMap(reader, absOffset) {
	reader.seek(absOffset);
	const format = reader.uint8();
	const entryFormat = reader.uint8();
	const mapCount = format === 1 ? reader.uint32() : reader.uint16();
	const innerBitCount = (entryFormat & INNER_BIT_MASK) + 1;
	const entrySize = ((entryFormat & ENTRY_SIZE_MASK) >> 4) + 1;
	const entries = [];
	for (let i = 0; i < mapCount; i++) {
		const packed = readUIntN(reader, entrySize);
		const innerMask = (1 << innerBitCount) - 1;
		entries.push({
			outerIndex: packed >> innerBitCount,
			innerIndex: packed & innerMask,
		});
	}
	return { format, entryFormat, mapCount, entries };
}

function writeDeltaSetIndexMap(map) {
	const entries = map.entries ?? [];
	const mapCount = map.mapCount ?? entries.length;
	const format = map.format ?? (mapCount > 0xffff ? 1 : 0);

	let maxInner = 0,
		maxOuter = 0;
	for (const e of entries) {
		maxInner = Math.max(maxInner, e.innerIndex ?? 0);
		maxOuter = Math.max(maxOuter, e.outerIndex ?? 0);
	}
	let innerBitCount = 1;
	while ((1 << innerBitCount) - 1 < maxInner && innerBitCount < 16)
		innerBitCount++;
	const packedMax = (maxOuter << innerBitCount) | maxInner;
	let entrySize = 1;
	while (
		entrySize < 4 &&
		packedMax > (entrySize === 1 ? 0xff : entrySize === 2 ? 0xffff : 0xffffff)
	)
		entrySize++;
	const entryFormat =
		map.entryFormat ?? ((entrySize - 1) << 4) | (innerBitCount - 1);
	const headerSize = format === 1 ? 6 : 4;

	const actualInnerBits = (entryFormat & INNER_BIT_MASK) + 1;
	const actualEntrySize = ((entryFormat & ENTRY_SIZE_MASK) >> 4) + 1;
	const w = new DataWriter(headerSize + mapCount * actualEntrySize);
	w.uint8(format);
	w.uint8(entryFormat);
	if (format === 1) w.uint32(mapCount);
	else w.uint16(mapCount);
	for (let i = 0; i < mapCount; i++) {
		const e = entries[i] ?? { outerIndex: 0, innerIndex: 0 };
		const packed =
			((e.outerIndex ?? 0) << actualInnerBits) |
			((e.innerIndex ?? 0) & ((1 << actualInnerBits) - 1));
		writeUIntN(w, packed, actualEntrySize);
	}
	return w.toArray();
}

// ===================================================================
//  PARSING  (binary -> JSON)
// ===================================================================

/**
 * Parse all COLR v1 structures from the raw COLR table bytes.
 *
 * @param {DataReader} reader - reader over the full COLR table
 * @param {object} v1Header - parsed v1 header offsets
 * @returns {object} { baseGlyphPaintRecords, layerPaints, clipList, varIndexMap, itemVariationStore }
 */
export function parseV1Data(reader, v1Header) {
	const cache = new Map(); // absolute offset -> parsed paint node

	const baseGlyphPaintRecords = parseBaseGlyphList(
		reader,
		v1Header.baseGlyphListOffset,
		cache,
	);

	const layerPaints = v1Header.layerListOffset
		? parseLayerList(reader, v1Header.layerListOffset, cache)
		: null;

	const clipList = v1Header.clipListOffset
		? parseClipList(reader, v1Header.clipListOffset)
		: null;

	const varIndexMap = v1Header.varIndexMapOffset
		? parseDeltaSetIndexMap(reader, v1Header.varIndexMapOffset)
		: null;

	const itemVariationStore = v1Header.itemVariationStoreOffset
		? parseItemVariationStore(
				reader.bytes(0).length ? [] : [], // unused — we re-read below
			)
		: null;

	// IVS needs raw bytes from the offset to end of table (or next subtable)
	let ivs = null;
	if (v1Header.itemVariationStoreOffset) {
		reader.seek(v1Header.itemVariationStoreOffset);
		const ivsBytes = [];
		while (reader.position < reader.length) {
			ivsBytes.push(reader.uint8());
		}
		ivs = parseItemVariationStore(ivsBytes);
	}

	return {
		baseGlyphPaintRecords,
		layerPaints,
		clipList,
		varIndexMap,
		itemVariationStore: ivs,
	};
}

// ----- BaseGlyphList ------------------------------------------------

function parseBaseGlyphList(reader, offset, cache) {
	reader.seek(offset);
	const numRecords = reader.uint32();
	const records = [];
	const rawRecords = [];

	for (let i = 0; i < numRecords; i++) {
		rawRecords.push({
			glyphID: reader.uint16(),
			paintOffset: reader.uint32(),
		});
	}

	for (const rec of rawRecords) {
		records.push({
			glyphID: rec.glyphID,
			paint: parsePaint(reader, offset + rec.paintOffset, cache),
		});
	}

	return records;
}

// ----- LayerList ----------------------------------------------------

function parseLayerList(reader, offset, cache) {
	reader.seek(offset);
	const numLayers = reader.uint32();
	const offsets = [];
	for (let i = 0; i < numLayers; i++) {
		offsets.push(reader.uint32());
	}
	const paints = [];
	for (const off of offsets) {
		paints.push(parsePaint(reader, offset + off, cache));
	}
	return paints;
}

// ----- ClipList -----------------------------------------------------

function parseClipList(reader, offset) {
	reader.seek(offset);
	const format = reader.uint8();
	const numClips = reader.uint32();
	// Read all clip records first (reader position advances sequentially)
	const rawClips = [];
	for (let i = 0; i < numClips; i++) {
		rawClips.push({
			startGlyphID: reader.uint16(),
			endGlyphID: reader.uint16(),
			clipBoxOffset: reader.uint24(),
		});
	}
	// Now resolve clip boxes (seeks away from clip record array)
	const clips = rawClips.map((rc) => ({
		startGlyphID: rc.startGlyphID,
		endGlyphID: rc.endGlyphID,
		clipBox: parseClipBox(reader, offset + rc.clipBoxOffset),
	}));
	return { format, clips };
}

function parseClipBox(reader, offset) {
	reader.seek(offset);
	const format = reader.uint8();
	const xMin = reader.fword();
	const yMin = reader.fword();
	const xMax = reader.fword();
	const yMax = reader.fword();
	const box = { format, xMin, yMin, xMax, yMax };
	if (format === 2) {
		box.varIndexBase = reader.uint32();
	}
	return box;
}

// ----- ColorLine / VarColorLine -------------------------------------

function parseColorLine(reader, offset, isVar) {
	reader.seek(offset);
	const extend = reader.uint8();
	const numStops = reader.uint16();
	const colorStops = [];
	for (let i = 0; i < numStops; i++) {
		const stop = {
			stopOffset: reader.f2dot14(),
			paletteIndex: reader.uint16(),
			alpha: reader.f2dot14(),
		};
		if (isVar) stop.varIndexBase = reader.uint32();
		colorStops.push(stop);
	}
	return { extend, colorStops };
}

// ----- Affine2x3 / VarAffine2x3 ------------------------------------

function parseAffine2x3(reader, offset, isVar) {
	reader.seek(offset);
	const t = {
		xx: reader.fixed(),
		yx: reader.fixed(),
		xy: reader.fixed(),
		yy: reader.fixed(),
		dx: reader.fixed(),
		dy: reader.fixed(),
	};
	if (isVar) t.varIndexBase = reader.uint32();
	return t;
}

// ----- Paint (recursive, cached) ------------------------------------

function parsePaint(reader, offset, cache) {
	if (cache.has(offset)) return cache.get(offset);

	reader.seek(offset);
	const format = reader.uint8();
	let paint;

	switch (format) {
		case 1:
			paint = parsePaintColrLayers(reader);
			break;
		case 2:
			paint = parsePaintSolid(reader, false);
			break;
		case 3:
			paint = parsePaintSolid(reader, true);
			break;
		case 4:
			paint = parsePaintLinearGradient(reader, offset, false);
			break;
		case 5:
			paint = parsePaintLinearGradient(reader, offset, true);
			break;
		case 6:
			paint = parsePaintRadialGradient(reader, offset, false);
			break;
		case 7:
			paint = parsePaintRadialGradient(reader, offset, true);
			break;
		case 8:
			paint = parsePaintSweepGradient(reader, offset, false);
			break;
		case 9:
			paint = parsePaintSweepGradient(reader, offset, true);
			break;
		case 10:
			paint = parsePaintGlyph(reader, offset, cache);
			break;
		case 11:
			paint = parsePaintColrGlyph(reader);
			break;
		case 12:
			paint = parsePaintTransform(reader, offset, cache, false);
			break;
		case 13:
			paint = parsePaintTransform(reader, offset, cache, true);
			break;
		case 14:
			paint = parsePaintTranslate(reader, offset, cache, false);
			break;
		case 15:
			paint = parsePaintTranslate(reader, offset, cache, true);
			break;
		case 16:
			paint = parsePaintScale(reader, offset, cache, false);
			break;
		case 17:
			paint = parsePaintScale(reader, offset, cache, true);
			break;
		case 18:
			paint = parsePaintScaleAroundCenter(reader, offset, cache, false);
			break;
		case 19:
			paint = parsePaintScaleAroundCenter(reader, offset, cache, true);
			break;
		case 20:
			paint = parsePaintScaleUniform(reader, offset, cache, false);
			break;
		case 21:
			paint = parsePaintScaleUniform(reader, offset, cache, true);
			break;
		case 22:
			paint = parsePaintScaleUniformAroundCenter(reader, offset, cache, false);
			break;
		case 23:
			paint = parsePaintScaleUniformAroundCenter(reader, offset, cache, true);
			break;
		case 24:
			paint = parsePaintRotate(reader, offset, cache, false);
			break;
		case 25:
			paint = parsePaintRotate(reader, offset, cache, true);
			break;
		case 26:
			paint = parsePaintRotateAroundCenter(reader, offset, cache, false);
			break;
		case 27:
			paint = parsePaintRotateAroundCenter(reader, offset, cache, true);
			break;
		case 28:
			paint = parsePaintSkew(reader, offset, cache, false);
			break;
		case 29:
			paint = parsePaintSkew(reader, offset, cache, true);
			break;
		case 30:
			paint = parsePaintSkewAroundCenter(reader, offset, cache, false);
			break;
		case 31:
			paint = parsePaintSkewAroundCenter(reader, offset, cache, true);
			break;
		case 32:
			paint = parsePaintComposite(reader, offset, cache);
			break;
		default:
			// Unknown format — store raw bytes for round-trip
			paint = { format, _unknown: true };
			cache.set(offset, paint);
			return paint;
	}
	paint.format = format;
	cache.set(offset, paint);
	return paint;
}

// ---- Individual paint parsers (format byte already consumed) -------

function parsePaintColrLayers(reader) {
	return {
		numLayers: reader.uint8(),
		firstLayerIndex: reader.uint32(),
	};
}

function parsePaintSolid(reader, isVar) {
	const p = {
		paletteIndex: reader.uint16(),
		alpha: reader.f2dot14(),
	};
	if (isVar) p.varIndexBase = reader.uint32();
	return p;
}

function parsePaintLinearGradient(reader, paintOffset, isVar) {
	const colorLineOffset = reader.uint24();
	const p = {
		x0: reader.fword(),
		y0: reader.fword(),
		x1: reader.fword(),
		y1: reader.fword(),
		x2: reader.fword(),
		y2: reader.fword(),
	};
	if (isVar) p.varIndexBase = reader.uint32();
	p.colorLine = parseColorLine(reader, paintOffset + colorLineOffset, isVar);
	return p;
}

function parsePaintRadialGradient(reader, paintOffset, isVar) {
	const colorLineOffset = reader.uint24();
	const p = {
		x0: reader.fword(),
		y0: reader.fword(),
		radius0: reader.ufword(),
		x1: reader.fword(),
		y1: reader.fword(),
		radius1: reader.ufword(),
	};
	if (isVar) p.varIndexBase = reader.uint32();
	p.colorLine = parseColorLine(reader, paintOffset + colorLineOffset, isVar);
	return p;
}

function parsePaintSweepGradient(reader, paintOffset, isVar) {
	const colorLineOffset = reader.uint24();
	const p = {
		centerX: reader.fword(),
		centerY: reader.fword(),
		startAngle: reader.f2dot14(),
		endAngle: reader.f2dot14(),
	};
	if (isVar) p.varIndexBase = reader.uint32();
	p.colorLine = parseColorLine(reader, paintOffset + colorLineOffset, isVar);
	return p;
}

function parsePaintGlyph(reader, paintOffset, cache) {
	const childOffset = reader.uint24();
	const glyphID = reader.uint16();
	return {
		glyphID,
		paint: parsePaint(reader, paintOffset + childOffset, cache),
	};
}

function parsePaintColrGlyph(reader) {
	return { glyphID: reader.uint16() };
}

function parsePaintTransform(reader, paintOffset, cache, isVar) {
	const childOffset = reader.uint24();
	const transformOffset = reader.uint24();
	return {
		paint: parsePaint(reader, paintOffset + childOffset, cache),
		transform: parseAffine2x3(reader, paintOffset + transformOffset, isVar),
	};
}

function parsePaintTranslate(reader, paintOffset, cache, isVar) {
	const childOffset = reader.uint24();
	const p = {
		dx: reader.fword(),
		dy: reader.fword(),
	};
	if (isVar) p.varIndexBase = reader.uint32();
	p.paint = parsePaint(reader, paintOffset + childOffset, cache);
	return p;
}

function parsePaintScale(reader, paintOffset, cache, isVar) {
	const childOffset = reader.uint24();
	const p = {
		scaleX: reader.f2dot14(),
		scaleY: reader.f2dot14(),
	};
	if (isVar) p.varIndexBase = reader.uint32();
	p.paint = parsePaint(reader, paintOffset + childOffset, cache);
	return p;
}

function parsePaintScaleAroundCenter(reader, paintOffset, cache, isVar) {
	const childOffset = reader.uint24();
	const p = {
		scaleX: reader.f2dot14(),
		scaleY: reader.f2dot14(),
		centerX: reader.fword(),
		centerY: reader.fword(),
	};
	if (isVar) p.varIndexBase = reader.uint32();
	p.paint = parsePaint(reader, paintOffset + childOffset, cache);
	return p;
}

function parsePaintScaleUniform(reader, paintOffset, cache, isVar) {
	const childOffset = reader.uint24();
	const p = { scale: reader.f2dot14() };
	if (isVar) p.varIndexBase = reader.uint32();
	p.paint = parsePaint(reader, paintOffset + childOffset, cache);
	return p;
}

function parsePaintScaleUniformAroundCenter(reader, paintOffset, cache, isVar) {
	const childOffset = reader.uint24();
	const p = {
		scale: reader.f2dot14(),
		centerX: reader.fword(),
		centerY: reader.fword(),
	};
	if (isVar) p.varIndexBase = reader.uint32();
	p.paint = parsePaint(reader, paintOffset + childOffset, cache);
	return p;
}

function parsePaintRotate(reader, paintOffset, cache, isVar) {
	const childOffset = reader.uint24();
	const p = { angle: reader.f2dot14() };
	if (isVar) p.varIndexBase = reader.uint32();
	p.paint = parsePaint(reader, paintOffset + childOffset, cache);
	return p;
}

function parsePaintRotateAroundCenter(reader, paintOffset, cache, isVar) {
	const childOffset = reader.uint24();
	const p = {
		angle: reader.f2dot14(),
		centerX: reader.fword(),
		centerY: reader.fword(),
	};
	if (isVar) p.varIndexBase = reader.uint32();
	p.paint = parsePaint(reader, paintOffset + childOffset, cache);
	return p;
}

function parsePaintSkew(reader, paintOffset, cache, isVar) {
	const childOffset = reader.uint24();
	const p = {
		xSkewAngle: reader.f2dot14(),
		ySkewAngle: reader.f2dot14(),
	};
	if (isVar) p.varIndexBase = reader.uint32();
	p.paint = parsePaint(reader, paintOffset + childOffset, cache);
	return p;
}

function parsePaintSkewAroundCenter(reader, paintOffset, cache, isVar) {
	const childOffset = reader.uint24();
	const p = {
		xSkewAngle: reader.f2dot14(),
		ySkewAngle: reader.f2dot14(),
		centerX: reader.fword(),
		centerY: reader.fword(),
	};
	if (isVar) p.varIndexBase = reader.uint32();
	p.paint = parsePaint(reader, paintOffset + childOffset, cache);
	return p;
}

function parsePaintComposite(reader, paintOffset, cache) {
	const sourceOffset = reader.uint24();
	const compositeMode = reader.uint8();
	const backdropOffset = reader.uint24();
	return {
		sourcePaint: parsePaint(reader, paintOffset + sourceOffset, cache),
		compositeMode,
		backdropPaint: parsePaint(reader, paintOffset + backdropOffset, cache),
	};
}

// ===================================================================
//  WRITING  (JSON -> binary)
// ===================================================================

/**
 * Write all COLR v1 structures to a byte array.
 * Returns the bytes for the v1 portion only (everything after the
 * 14-byte v0 header and v0 records).
 *
 * Layout:
 *   [v1 header: 5 Offset32 fields = 20 bytes]
 *   [BaseGlyphList]
 *   [LayerList]
 *   [Paint blob]
 *   [ClipList]
 *   [DeltaSetIndexMap]
 *   [ItemVariationStore]
 *
 * @param {object} v1 - parsed v1 data
 * @param {number} v1Start - absolute offset where v1 header starts (= 14 + v0 records size)
 * @returns {{ v1HeaderBytes: number[], bodyBytes: number[] }}
 */
export function writeV1Data(v1) {
	const {
		baseGlyphPaintRecords,
		layerPaints,
		clipList,
		varIndexMap,
		itemVariationStore,
	} = v1;

	// --- Step 1: Collect all unique paint nodes, topological sort ---
	const allNodes = new Map(); // paint object → id
	const nodeList = []; // ordered list of paint objects

	function collectNode(paint) {
		if (!paint || allNodes.has(paint)) return;
		allNodes.set(paint, nodeList.length);
		nodeList.push(paint);
		// Collect children
		for (const child of paintChildren(paint)) {
			collectNode(child);
		}
	}

	// Collect from base glyph paint records
	if (baseGlyphPaintRecords) {
		for (const rec of baseGlyphPaintRecords) {
			collectNode(rec.paint);
		}
	}
	// Collect from layer paints
	if (layerPaints) {
		for (const lp of layerPaints) {
			collectNode(lp);
		}
	}

	// Topological sort ensuring parents before children (forward offsets)
	const sorted = topologicalSort(nodeList, allNodes);

	// --- Step 2: Compute paint node sizes & positions in blob ---
	const nodeSize = new Map();
	for (const paint of sorted) {
		nodeSize.set(paint, computePaintBlobSize(paint));
	}

	const nodePosition = new Map(); // paint → position within paint blob
	let blobPos = 0;
	for (const paint of sorted) {
		nodePosition.set(paint, blobPos);
		blobPos += nodeSize.get(paint);
	}
	const paintBlobSize = blobPos;

	// --- Step 3: Compute layout ---
	// BaseGlyphList: 4 + numRecords * 6
	const bglCount = baseGlyphPaintRecords ? baseGlyphPaintRecords.length : 0;
	const bglSize = 4 + bglCount * 6;

	// LayerList: 4 + numLayers * 4
	const llCount = layerPaints ? layerPaints.length : 0;
	const llSize = llCount > 0 ? 4 + llCount * 4 : 0;

	// ClipList
	const clipBytes = clipList ? writeClipList(clipList) : [];

	// DeltaSetIndexMap
	const dimBytes = varIndexMap ? writeDeltaSetIndexMap(varIndexMap) : [];

	// ItemVariationStore
	const ivsBytes = itemVariationStore
		? writeItemVariationStore(itemVariationStore)
		: [];

	// Offsets from start of COLR table
	// v1 header starts at byte 14 of the COLR table (after v0 header)
	// These offsets are from start of the ENTIRE COLR table
	// We don't know v0 size at this point — caller will provide absolute offsets

	// Body layout (relative to bodyStart which is right after the v0 portion):
	// We'll return flat bytes for the entire v1 body
	const bodySize =
		bglSize +
		llSize +
		paintBlobSize +
		clipBytes.length +
		dimBytes.length +
		ivsBytes.length;

	// Absolute offsets from COLR table start will be computed by the caller
	// Here we compute relative positions within the body
	const bglBodyOffset = 0;
	const llBodyOffset = bglSize;
	const paintBlobBodyOffset = bglSize + llSize;
	const clipBodyOffset = paintBlobBodyOffset + paintBlobSize;
	const dimBodyOffset = clipBodyOffset + clipBytes.length;
	const ivsBodyOffset = dimBodyOffset + dimBytes.length;

	// --- Step 4: Write body ---
	const w = new DataWriter(bodySize);

	// Write BaseGlyphList
	w.uint32(bglCount);
	for (const rec of baseGlyphPaintRecords || []) {
		w.uint16(rec.glyphID);
		// paintOffset relative to BaseGlyphList start
		w.uint32(paintBlobBodyOffset - bglBodyOffset + nodePosition.get(rec.paint));
	}

	// Write LayerList
	if (llCount > 0) {
		w.uint32(llCount);
		for (const lp of layerPaints) {
			// paintOffset relative to LayerList start
			w.uint32(paintBlobBodyOffset - llBodyOffset + nodePosition.get(lp));
		}
	}

	// Write paint blob
	for (const paint of sorted) {
		writePaintNode(
			w,
			paint,
			paintBlobBodyOffset + nodePosition.get(paint),
			nodePosition,
			paintBlobBodyOffset,
		);
	}

	// Write ClipList, DeltaSetIndexMap, IVS
	w.rawBytes(clipBytes);
	w.rawBytes(dimBytes);
	w.rawBytes(ivsBytes);

	return {
		bodyBytes: w.toArray(),
		bglBodyOffset,
		llBodyOffset: llCount > 0 ? llBodyOffset : 0,
		clipBodyOffset: clipBytes.length > 0 ? clipBodyOffset : 0,
		dimBodyOffset: dimBytes.length > 0 ? dimBodyOffset : 0,
		ivsBodyOffset: ivsBytes.length > 0 ? ivsBodyOffset : 0,
	};
}

// ----- Helper: get child paint references from a paint node ----------

function paintChildren(paint) {
	if (!paint) return [];
	const children = [];
	if (paint.paint) children.push(paint.paint);
	if (paint.sourcePaint) children.push(paint.sourcePaint);
	if (paint.backdropPaint) children.push(paint.backdropPaint);
	return children;
}

// ----- Helper: topological sort (Kahn's algorithm) ------------------

function topologicalSort(nodeList, nodeMap) {
	const inDegree = new Map();
	for (const node of nodeList) inDegree.set(node, 0);

	for (const node of nodeList) {
		for (const child of paintChildren(node)) {
			if (inDegree.has(child)) {
				inDegree.set(child, inDegree.get(child) + 1);
			}
		}
	}

	// Use index-based queue to avoid O(n) shift()
	const queue = [];
	let head = 0;
	for (const node of nodeList) {
		if (inDegree.get(node) === 0) queue.push(node);
	}

	const sorted = [];
	const sortedSet = new Set();
	while (head < queue.length) {
		const node = queue[head++];
		sorted.push(node);
		sortedSet.add(node);
		for (const child of paintChildren(node)) {
			if (!inDegree.has(child)) continue;
			const deg = inDegree.get(child) - 1;
			inDegree.set(child, deg);
			if (deg === 0) queue.push(child);
		}
	}

	// Append any unreached nodes (shouldn't happen in valid data)
	for (const node of nodeList) {
		if (!sortedSet.has(node)) sorted.push(node);
	}

	return sorted;
}

// ----- Compute paint blob entry size (header + inline subtables) ----

function computePaintBlobSize(paint) {
	const headerSize = PAINT_HEADER_SIZE[paint.format] || 0;
	const fmt = paint.format;

	// ColorLine inline for gradient formats
	if (fmt === 4 || fmt === 6 || fmt === 8) {
		return headerSize + colorLineSize(paint.colorLine, false);
	}
	if (fmt === 5 || fmt === 7 || fmt === 9) {
		return headerSize + colorLineSize(paint.colorLine, true);
	}
	// Affine2x3 inline for transform formats
	if (fmt === 12) return headerSize + 24; // Affine2x3
	if (fmt === 13) return headerSize + 28; // VarAffine2x3

	return headerSize;
}

function colorLineSize(cl, isVar) {
	if (!cl) return 0;
	const stopSize = isVar ? 10 : 6;
	return 3 + cl.colorStops.length * stopSize;
}

// ----- Write a single paint node into the writer --------------------

function writePaintNode(w, paint, myAbsPos, nodePosition, blobStart) {
	const fmt = paint.format;
	w.uint8(fmt);

	switch (fmt) {
		case 1: // PaintColrLayers
			w.uint8(paint.numLayers);
			w.uint32(paint.firstLayerIndex);
			break;

		case 2: // PaintSolid
			w.uint16(paint.paletteIndex);
			w.f2dot14(paint.alpha);
			break;

		case 3: // PaintVarSolid
			w.uint16(paint.paletteIndex);
			w.f2dot14(paint.alpha);
			w.uint32(paint.varIndexBase);
			break;

		case 4: // PaintLinearGradient
		case 5: {
			// PaintVarLinearGradient
			const headerSize = PAINT_HEADER_SIZE[fmt];
			w.uint24(headerSize); // colorLineOffset: right after header
			w.fword(paint.x0);
			w.fword(paint.y0);
			w.fword(paint.x1);
			w.fword(paint.y1);
			w.fword(paint.x2);
			w.fword(paint.y2);
			if (fmt === 5) w.uint32(paint.varIndexBase);
			writeColorLine(w, paint.colorLine, fmt === 5);
			break;
		}

		case 6: // PaintRadialGradient
		case 7: {
			// PaintVarRadialGradient
			const headerSize = PAINT_HEADER_SIZE[fmt];
			w.uint24(headerSize); // colorLineOffset
			w.fword(paint.x0);
			w.fword(paint.y0);
			w.ufword(paint.radius0);
			w.fword(paint.x1);
			w.fword(paint.y1);
			w.ufword(paint.radius1);
			if (fmt === 7) w.uint32(paint.varIndexBase);
			writeColorLine(w, paint.colorLine, fmt === 7);
			break;
		}

		case 8: // PaintSweepGradient
		case 9: {
			// PaintVarSweepGradient
			const headerSize = PAINT_HEADER_SIZE[fmt];
			w.uint24(headerSize); // colorLineOffset
			w.fword(paint.centerX);
			w.fword(paint.centerY);
			w.f2dot14(paint.startAngle);
			w.f2dot14(paint.endAngle);
			if (fmt === 9) w.uint32(paint.varIndexBase);
			writeColorLine(w, paint.colorLine, fmt === 9);
			break;
		}

		case 10: {
			// PaintGlyph
			const childPos = blobStart + nodePosition.get(paint.paint);
			w.uint24(childPos - myAbsPos);
			w.uint16(paint.glyphID);
			break;
		}

		case 11: // PaintColrGlyph
			w.uint16(paint.glyphID);
			break;

		case 12: // PaintTransform
		case 13: {
			// PaintVarTransform
			const childPos = blobStart + nodePosition.get(paint.paint);
			const headerSize = PAINT_HEADER_SIZE[fmt];
			w.uint24(childPos - myAbsPos); // paintOffset
			w.uint24(headerSize); // transformOffset: right after header
			writeAffine2x3(w, paint.transform, fmt === 13);
			break;
		}

		case 14: // PaintTranslate
		case 15: {
			// PaintVarTranslate
			const childPos = blobStart + nodePosition.get(paint.paint);
			w.uint24(childPos - myAbsPos);
			w.fword(paint.dx);
			w.fword(paint.dy);
			if (fmt === 15) w.uint32(paint.varIndexBase);
			break;
		}

		case 16: // PaintScale
		case 17: {
			// PaintVarScale
			const childPos = blobStart + nodePosition.get(paint.paint);
			w.uint24(childPos - myAbsPos);
			w.f2dot14(paint.scaleX);
			w.f2dot14(paint.scaleY);
			if (fmt === 17) w.uint32(paint.varIndexBase);
			break;
		}

		case 18: // PaintScaleAroundCenter
		case 19: {
			// PaintVarScaleAroundCenter
			const childPos = blobStart + nodePosition.get(paint.paint);
			w.uint24(childPos - myAbsPos);
			w.f2dot14(paint.scaleX);
			w.f2dot14(paint.scaleY);
			w.fword(paint.centerX);
			w.fword(paint.centerY);
			if (fmt === 19) w.uint32(paint.varIndexBase);
			break;
		}

		case 20: // PaintScaleUniform
		case 21: {
			// PaintVarScaleUniform
			const childPos = blobStart + nodePosition.get(paint.paint);
			w.uint24(childPos - myAbsPos);
			w.f2dot14(paint.scale);
			if (fmt === 21) w.uint32(paint.varIndexBase);
			break;
		}

		case 22: // PaintScaleUniformAroundCenter
		case 23: {
			// PaintVarScaleUniformAroundCenter
			const childPos = blobStart + nodePosition.get(paint.paint);
			w.uint24(childPos - myAbsPos);
			w.f2dot14(paint.scale);
			w.fword(paint.centerX);
			w.fword(paint.centerY);
			if (fmt === 23) w.uint32(paint.varIndexBase);
			break;
		}

		case 24: // PaintRotate
		case 25: {
			// PaintVarRotate
			const childPos = blobStart + nodePosition.get(paint.paint);
			w.uint24(childPos - myAbsPos);
			w.f2dot14(paint.angle);
			if (fmt === 25) w.uint32(paint.varIndexBase);
			break;
		}

		case 26: // PaintRotateAroundCenter
		case 27: {
			// PaintVarRotateAroundCenter
			const childPos = blobStart + nodePosition.get(paint.paint);
			w.uint24(childPos - myAbsPos);
			w.f2dot14(paint.angle);
			w.fword(paint.centerX);
			w.fword(paint.centerY);
			if (fmt === 27) w.uint32(paint.varIndexBase);
			break;
		}

		case 28: // PaintSkew
		case 29: {
			// PaintVarSkew
			const childPos = blobStart + nodePosition.get(paint.paint);
			w.uint24(childPos - myAbsPos);
			w.f2dot14(paint.xSkewAngle);
			w.f2dot14(paint.ySkewAngle);
			if (fmt === 29) w.uint32(paint.varIndexBase);
			break;
		}

		case 30: // PaintSkewAroundCenter
		case 31: {
			// PaintVarSkewAroundCenter
			const childPos = blobStart + nodePosition.get(paint.paint);
			w.uint24(childPos - myAbsPos);
			w.f2dot14(paint.xSkewAngle);
			w.f2dot14(paint.ySkewAngle);
			w.fword(paint.centerX);
			w.fword(paint.centerY);
			if (fmt === 31) w.uint32(paint.varIndexBase);
			break;
		}

		case 32: {
			// PaintComposite
			const srcPos = blobStart + nodePosition.get(paint.sourcePaint);
			const bdPos = blobStart + nodePosition.get(paint.backdropPaint);
			w.uint24(srcPos - myAbsPos);
			w.uint8(paint.compositeMode);
			w.uint24(bdPos - myAbsPos);
			break;
		}
	}
}

// ----- Write ColorLine / VarColorLine --------------------------------

function writeColorLine(w, cl, isVar) {
	w.uint8(cl.extend);
	w.uint16(cl.colorStops.length);
	for (const stop of cl.colorStops) {
		w.f2dot14(stop.stopOffset);
		w.uint16(stop.paletteIndex);
		w.f2dot14(stop.alpha);
		if (isVar) w.uint32(stop.varIndexBase);
	}
}

// ----- Write Affine2x3 / VarAffine2x3 -------------------------------

function writeAffine2x3(w, t, isVar) {
	w.fixed(t.xx);
	w.fixed(t.yx);
	w.fixed(t.xy);
	w.fixed(t.yy);
	w.fixed(t.dx);
	w.fixed(t.dy);
	if (isVar) w.uint32(t.varIndexBase);
}

// ----- Write ClipList ------------------------------------------------

function writeClipList(cl) {
	if (!cl || !cl.clips || cl.clips.length === 0) return [];

	// First pass: serialize clip boxes and compute offsets
	const clipBoxEntries = [];
	for (const clip of cl.clips) {
		clipBoxEntries.push(writeClipBox(clip.clipBox));
	}

	// Header: format(1) + numClips(4) + clips[]: startGlyph(2) + endGlyph(2) + clipBoxOffset(3) = 7 each
	const headerSize = 5 + cl.clips.length * 7;
	let boxOffset = headerSize;
	const boxOffsets = [];
	for (const entry of clipBoxEntries) {
		boxOffsets.push(boxOffset);
		boxOffset += entry.length;
	}

	const totalSize = boxOffset;
	const w = new DataWriter(totalSize);
	w.uint8(cl.format || 1);
	w.uint32(cl.clips.length);
	for (let i = 0; i < cl.clips.length; i++) {
		w.uint16(cl.clips[i].startGlyphID);
		w.uint16(cl.clips[i].endGlyphID);
		w.uint24(boxOffsets[i]);
	}
	for (const entry of clipBoxEntries) {
		w.rawBytes(entry);
	}
	return w.toArray();
}

function writeClipBox(box) {
	const size = box.format === 2 ? 13 : 9;
	const w = new DataWriter(size);
	w.uint8(box.format);
	w.fword(box.xMin);
	w.fword(box.yMin);
	w.fword(box.xMax);
	w.fword(box.yMax);
	if (box.format === 2) w.uint32(box.varIndexBase);
	return w.toArray();
}
