/**
 * Font Flux JS : glyf (Glyph Data) table parser / writer.
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/glyf
 *
 * Contains glyph outlines for TrueType fonts. Each glyph is located via the
 * 'loca' table. Glyph descriptions come in two flavours:
 *
 *   • Simple  (numberOfContours ≥ 0) — Bézier control points
 *   • Composite (numberOfContours < 0) — references to other glyphs
 *
 * Cross-table dependencies:
 *   - loca.offsets — byte offsets of each glyph within this table
 *   - maxp.numGlyphs — total glyph count
 */

import { DataReader } from '../reader.js';
import { DataWriter } from '../writer.js';

// ===========================================================================
//  Flag constants
// ===========================================================================

// Simple glyph point flags
const ON_CURVE_POINT = 0x01;
const X_SHORT_VECTOR = 0x02;
const Y_SHORT_VECTOR = 0x04;
const REPEAT_FLAG = 0x08;
const X_IS_SAME_OR_POSITIVE = 0x10;
const Y_IS_SAME_OR_POSITIVE = 0x20;
const OVERLAP_SIMPLE = 0x40;

// Composite glyph component flags
const ARG_1_AND_2_ARE_WORDS = 0x0001;
const ARGS_ARE_XY_VALUES = 0x0002;
const ROUND_XY_TO_GRID = 0x0004;
const WE_HAVE_A_SCALE = 0x0008;
const MORE_COMPONENTS = 0x0020;
const WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
const WE_HAVE_A_TWO_BY_TWO = 0x0080;
const WE_HAVE_INSTRUCTIONS = 0x0100;
const USE_MY_METRICS = 0x0200;
const OVERLAP_COMPOUND = 0x0400;
const SCALED_COMPONENT_OFFSET = 0x0800;
const UNSCALED_COMPONENT_OFFSET = 0x1000;

// ===========================================================================
//  PARSING  (binary -> JSON)
// ===========================================================================

/**
 * Parse the glyf table.
 *
 * @param {number[]} rawBytes
 * @param {object}   tables - Already-parsed tables (needs loca, maxp)
 * @returns {object}  { glyphs: Array }
 */
export function parseGlyf(rawBytes, tables) {
	const offsets = tables.loca.offsets;
	const numGlyphs = tables.maxp.numGlyphs;
	const reader = new DataReader(rawBytes);

	const glyphs = [];
	for (let i = 0; i < numGlyphs; i++) {
		const start = offsets[i];
		const end = offsets[i + 1];

		if (start === end) {
			// Empty glyph (no outline, e.g. space)
			glyphs.push(null);
			continue;
		}

		reader.seek(start);
		const numberOfContours = reader.int16();
		const xMin = reader.int16();
		const yMin = reader.int16();
		const xMax = reader.int16();
		const yMax = reader.int16();

		if (numberOfContours >= 0) {
			glyphs.push(
				parseSimpleGlyph(reader, numberOfContours, xMin, yMin, xMax, yMax),
			);
		} else {
			glyphs.push(parseCompositeGlyph(reader, xMin, yMin, xMax, yMax));
		}
	}

	return { glyphs };
}

// --- Simple glyph --------------------------------------------------------

/**
 * Parse a simple glyph (numberOfContours ≥ 0).
 *
 * JSON shape:
 *   { type: 'simple', xMin, yMin, xMax, yMax,
 *     contours: [ [ {x, y, onCurve}, … ], … ],
 *     instructions: number[],
 *     overlapSimple: boolean }
 */
function parseSimpleGlyph(reader, numberOfContours, xMin, yMin, xMax, yMax) {
	// 1. endPtsOfContours
	const endPtsOfContours = reader.array('uint16', numberOfContours);

	// Total number of points
	const numPoints =
		numberOfContours > 0 ? endPtsOfContours[numberOfContours - 1] + 1 : 0;

	// 2. Instructions
	const instructionLength = reader.uint16();
	const instructions = reader.bytes(instructionLength);

	// 3. Flags (packed with repeat compression)
	const flags = [];
	while (flags.length < numPoints) {
		const flag = reader.uint8();
		flags.push(flag);
		if (flag & REPEAT_FLAG) {
			const repeatCount = reader.uint8();
			for (let r = 0; r < repeatCount; r++) {
				flags.push(flag);
			}
		}
	}

	// 4. X coordinates (packed deltas)
	const xCoords = new Array(numPoints);
	let x = 0;
	for (let i = 0; i < numPoints; i++) {
		const flag = flags[i];
		if (flag & X_SHORT_VECTOR) {
			const dx = reader.uint8();
			x += flag & X_IS_SAME_OR_POSITIVE ? dx : -dx;
		} else if (!(flag & X_IS_SAME_OR_POSITIVE)) {
			x += reader.int16();
		}
		// else: x unchanged (same as previous)
		xCoords[i] = x;
	}

	// 5. Y coordinates (packed deltas)
	const yCoords = new Array(numPoints);
	let y = 0;
	for (let i = 0; i < numPoints; i++) {
		const flag = flags[i];
		if (flag & Y_SHORT_VECTOR) {
			const dy = reader.uint8();
			y += flag & Y_IS_SAME_OR_POSITIVE ? dy : -dy;
		} else if (!(flag & Y_IS_SAME_OR_POSITIVE)) {
			y += reader.int16();
		}
		yCoords[i] = y;
	}

	// 6. Check overlap flag (set on first flag byte)
	const overlapSimple = numPoints > 0 && (flags[0] & OVERLAP_SIMPLE) !== 0;

	// 7. Build contours from flat point arrays
	const contours = [];
	let ptIdx = 0;
	for (let c = 0; c < numberOfContours; c++) {
		const end = endPtsOfContours[c];
		const contour = [];
		while (ptIdx <= end) {
			contour.push({
				x: xCoords[ptIdx],
				y: yCoords[ptIdx],
				onCurve: (flags[ptIdx] & ON_CURVE_POINT) !== 0,
			});
			ptIdx++;
		}
		contours.push(contour);
	}

	return {
		type: 'simple',
		xMin,
		yMin,
		xMax,
		yMax,
		contours,
		instructions,
		overlapSimple,
	};
}

// --- Composite glyph ----------------------------------------------------

/**
 * Parse a composite glyph.
 *
 * JSON shape:
 *   { type: 'composite', xMin, yMin, xMax, yMax,
 *     components: [ { glyphIndex, flags, argument1, argument2,
 *                     transform?: { ... } }, … ],
 *     instructions: number[] }
 */
function parseCompositeGlyph(reader, xMin, yMin, xMax, yMax) {
	const components = [];
	let flags;
	let hasInstructions = false;

	do {
		flags = reader.uint16();
		const glyphIndex = reader.uint16();

		// Arguments — size depends on ARG_1_AND_2_ARE_WORDS
		let argument1, argument2;
		if (flags & ARG_1_AND_2_ARE_WORDS) {
			if (flags & ARGS_ARE_XY_VALUES) {
				argument1 = reader.int16();
				argument2 = reader.int16();
			} else {
				argument1 = reader.uint16();
				argument2 = reader.uint16();
			}
		} else {
			if (flags & ARGS_ARE_XY_VALUES) {
				argument1 = reader.int8();
				argument2 = reader.int8();
			} else {
				argument1 = reader.uint8();
				argument2 = reader.uint8();
			}
		}

		const component = {
			glyphIndex,
			flags: buildComponentFlagObject(flags),
			argument1,
			argument2,
		};

		// Transform
		if (flags & WE_HAVE_A_SCALE) {
			component.transform = { scale: reader.f2dot14() };
		} else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) {
			component.transform = {
				xScale: reader.f2dot14(),
				yScale: reader.f2dot14(),
			};
		} else if (flags & WE_HAVE_A_TWO_BY_TWO) {
			component.transform = {
				xScale: reader.f2dot14(),
				scale01: reader.f2dot14(),
				scale10: reader.f2dot14(),
				yScale: reader.f2dot14(),
			};
		}

		components.push(component);

		if (flags & WE_HAVE_INSTRUCTIONS) {
			hasInstructions = true;
		}
	} while (flags & MORE_COMPONENTS);

	// Instructions (after all components)
	let instructions = [];
	if (hasInstructions) {
		const numInstr = reader.uint16();
		instructions = reader.bytes(numInstr);
	}

	return {
		type: 'composite',
		xMin,
		yMin,
		xMax,
		yMax,
		components,
		instructions,
	};
}

/**
 * Extract meaningful flag bits into a human-readable object.
 * This preserves all flag information for round-trip fidelity.
 */
function buildComponentFlagObject(flags) {
	const obj = {};
	if (flags & ARG_1_AND_2_ARE_WORDS) obj.argsAreWords = true;
	if (flags & ARGS_ARE_XY_VALUES) obj.argsAreXYValues = true;
	if (flags & ROUND_XY_TO_GRID) obj.roundXYToGrid = true;
	if (flags & WE_HAVE_A_SCALE) obj.weHaveAScale = true;
	if (flags & WE_HAVE_AN_X_AND_Y_SCALE) obj.weHaveAnXAndYScale = true;
	if (flags & WE_HAVE_A_TWO_BY_TWO) obj.weHaveATwoByTwo = true;
	if (flags & WE_HAVE_INSTRUCTIONS) obj.weHaveInstructions = true;
	if (flags & USE_MY_METRICS) obj.useMyMetrics = true;
	if (flags & OVERLAP_COMPOUND) obj.overlapCompound = true;
	if (flags & SCALED_COMPONENT_OFFSET) obj.scaledComponentOffset = true;
	if (flags & UNSCALED_COMPONENT_OFFSET) obj.unscaledComponentOffset = true;
	return obj;
}

// ===========================================================================
//  WRITING  (JSON -> binary)
// ===========================================================================

/**
 * Write the glyf table and compute the byte offset of every glyph.
 *
 * Returns `{ bytes, offsets }` where:
 *   - bytes:   number[] — the complete glyf table binary data
 *   - offsets: number[] — numGlyphs + 1 entries (same shape as loca.offsets)
 *
 * The offsets array MUST be used to rebuild the loca table so that loca
 * entries match the actual positions inside the new glyf data.
 *
 * @param {object} glyf - Parsed glyf data { glyphs }
 * @returns {{ bytes: number[], offsets: number[] }}
 */
export function writeGlyfComputeOffsets(glyf) {
	const { glyphs } = glyf;
	const parts = [];

	for (const g of glyphs) {
		if (g === null) {
			// Empty glyph — zero bytes
			parts.push([]);
			continue;
		}

		if (g.type === 'simple') {
			parts.push(writeSimpleGlyph(g));
		} else {
			parts.push(writeCompositeGlyph(g));
		}
	}

	// Concatenate all glyph data with 2-byte alignment padding between glyphs
	// (glyf offsets in loca must be even for short format compatibility)
	const bytes = [];
	const offsets = [];

	for (const part of parts) {
		offsets.push(bytes.length);
		for (let i = 0; i < part.length; i++) {
			bytes.push(part[i]);
		}
		// Pad to even boundary
		if (part.length % 2 !== 0) {
			bytes.push(0);
		}
	}
	// Sentinel entry — marks the end of the last glyph (needed by loca)
	offsets.push(bytes.length);

	return { bytes, offsets };
}

/**
 * Write the glyf table from JSON back to raw bytes.
 * Standard writer interface for the tableWriters registry.
 *
 * @param {object} glyf - Parsed glyf data { glyphs }
 * @returns {number[]}
 */
export function writeGlyf(glyf) {
	return writeGlyfComputeOffsets(glyf).bytes;
}

// --- Simple glyph writer ------------------------------------------------

function writeSimpleGlyph(g) {
	const { contours, instructions, xMin, yMin, xMax, yMax, overlapSimple } = g;
	const numberOfContours = contours.length;

	// Flatten contours to point arrays
	const points = [];
	const endPtsOfContours = [];
	for (const contour of contours) {
		for (const pt of contour) {
			points.push(pt);
		}
		endPtsOfContours.push(points.length - 1);
	}

	const numPoints = points.length;

	// Build per-point absolute coordinates
	const xAbs = points.map((p) => p.x);
	const yAbs = points.map((p) => p.y);

	// Convert to deltas
	const xDeltas = new Array(numPoints);
	const yDeltas = new Array(numPoints);
	for (let i = 0; i < numPoints; i++) {
		xDeltas[i] = i === 0 ? xAbs[i] : xAbs[i] - xAbs[i - 1];
		yDeltas[i] = i === 0 ? yAbs[i] : yAbs[i] - yAbs[i - 1];
	}

	// Build flags and packed coordinate arrays
	const flagBytes = [];
	const xBytes = [];
	const yBytes = [];

	for (let i = 0; i < numPoints; i++) {
		let flag = 0;
		if (points[i].onCurve) flag |= ON_CURVE_POINT;

		const dx = xDeltas[i];
		const dy = yDeltas[i];

		// X encoding
		if (dx === 0) {
			flag |= X_IS_SAME_OR_POSITIVE; // same as previous
		} else if (dx >= -255 && dx <= 255) {
			flag |= X_SHORT_VECTOR;
			if (dx > 0) {
				flag |= X_IS_SAME_OR_POSITIVE;
				xBytes.push(dx);
			} else {
				xBytes.push(-dx);
			}
		} else {
			// int16
			xBytes.push((dx >> 8) & 0xff, dx & 0xff);
		}

		// Y encoding
		if (dy === 0) {
			flag |= Y_IS_SAME_OR_POSITIVE;
		} else if (dy >= -255 && dy <= 255) {
			flag |= Y_SHORT_VECTOR;
			if (dy > 0) {
				flag |= Y_IS_SAME_OR_POSITIVE;
				yBytes.push(dy);
			} else {
				yBytes.push(-dy);
			}
		} else {
			yBytes.push((dy >> 8) & 0xff, dy & 0xff);
		}

		// Overlap flag on first point
		if (i === 0 && overlapSimple) {
			flag |= OVERLAP_SIMPLE;
		}

		flagBytes.push(flag);
	}

	// Pack flags with repeat compression
	const packedFlags = packFlags(flagBytes);

	// Compute total size
	const headerSize = 10; // numberOfContours (2) + bbox (8)
	const endPtsSize = numberOfContours * 2;
	const instrLenSize = 2;
	const instrSize = instructions.length;
	const totalSize =
		headerSize +
		endPtsSize +
		instrLenSize +
		instrSize +
		packedFlags.length +
		xBytes.length +
		yBytes.length;

	const w = new DataWriter(totalSize);

	// Header
	w.int16(numberOfContours);
	w.int16(xMin);
	w.int16(yMin);
	w.int16(xMax);
	w.int16(yMax);

	// endPtsOfContours
	w.array('uint16', endPtsOfContours);

	// Instructions
	w.uint16(instructions.length);
	w.rawBytes(instructions);

	// Packed flags
	w.rawBytes(packedFlags);

	// X coordinates
	w.rawBytes(xBytes);

	// Y coordinates
	w.rawBytes(yBytes);

	return w.toArray();
}

/**
 * Pack flags using repeat compression.
 * If consecutive flags are identical, emit flag + REPEAT_FLAG + count.
 */
function packFlags(flags) {
	const result = [];
	let i = 0;
	while (i < flags.length) {
		const flag = flags[i];
		let repeatCount = 0;
		while (
			i + 1 + repeatCount < flags.length &&
			flags[i + 1 + repeatCount] === flag &&
			repeatCount < 255
		) {
			repeatCount++;
		}
		if (repeatCount > 0) {
			result.push(flag | REPEAT_FLAG, repeatCount);
			i += 1 + repeatCount;
		} else {
			result.push(flag);
			i++;
		}
	}
	return result;
}

// --- Composite glyph writer ---------------------------------------------

function writeCompositeGlyph(g) {
	const { components, instructions, xMin, yMin, xMax, yMax } = g;

	// First pass: compute byte size
	let dataSize = 10; // header
	for (let ci = 0; ci < components.length; ci++) {
		const comp = components[ci];
		dataSize += 4; // flags (2) + glyphIndex (2)
		// Arguments
		const argsAreWords =
			comp.flags.argsAreWords ||
			needsWordArgs(comp.argument1, comp.argument2, comp.flags.argsAreXYValues);
		dataSize += argsAreWords ? 4 : 2;
		// Transform
		if (comp.transform) {
			if ('scale' in comp.transform) dataSize += 2;
			else if ('scale01' in comp.transform) dataSize += 8;
			else if ('xScale' in comp.transform) dataSize += 4;
		}
	}
	// Instructions
	if (instructions && instructions.length > 0) {
		dataSize += 2 + instructions.length;
	}

	const w = new DataWriter(dataSize);

	// Header
	w.int16(-1); // numberOfContours for composite
	w.int16(xMin);
	w.int16(yMin);
	w.int16(xMax);
	w.int16(yMax);

	// Components
	for (let ci = 0; ci < components.length; ci++) {
		const comp = components[ci];
		const isLast = ci === components.length - 1;

		// Rebuild flags uint16 from the flag object
		let flags = rebuildComponentFlags(comp.flags);

		// Determine if args need words
		const argsAreWords =
			comp.flags.argsAreWords ||
			needsWordArgs(comp.argument1, comp.argument2, comp.flags.argsAreXYValues);

		if (argsAreWords) flags |= ARG_1_AND_2_ARE_WORDS;
		else flags &= ~ARG_1_AND_2_ARE_WORDS;

		if (!isLast) flags |= MORE_COMPONENTS;
		else flags &= ~MORE_COMPONENTS;

		// WE_HAVE_INSTRUCTIONS — set on last component if there are instructions
		if (isLast && instructions && instructions.length > 0) {
			flags |= WE_HAVE_INSTRUCTIONS;
		} else if (isLast) {
			flags &= ~WE_HAVE_INSTRUCTIONS;
		}

		w.uint16(flags);
		w.uint16(comp.glyphIndex);

		// Arguments
		if (argsAreWords) {
			if (comp.flags.argsAreXYValues) {
				w.int16(comp.argument1);
				w.int16(comp.argument2);
			} else {
				w.uint16(comp.argument1);
				w.uint16(comp.argument2);
			}
		} else {
			if (comp.flags.argsAreXYValues) {
				w.int8(comp.argument1);
				w.int8(comp.argument2);
			} else {
				w.uint8(comp.argument1);
				w.uint8(comp.argument2);
			}
		}

		// Transform
		if (comp.transform) {
			if ('scale' in comp.transform) {
				w.f2dot14(comp.transform.scale);
			} else if ('scale01' in comp.transform) {
				w.f2dot14(comp.transform.xScale);
				w.f2dot14(comp.transform.scale01);
				w.f2dot14(comp.transform.scale10);
				w.f2dot14(comp.transform.yScale);
			} else if ('xScale' in comp.transform) {
				w.f2dot14(comp.transform.xScale);
				w.f2dot14(comp.transform.yScale);
			}
		}
	}

	// Instructions
	if (instructions && instructions.length > 0) {
		w.uint16(instructions.length);
		w.rawBytes(instructions);
	}

	return w.toArray();
}

/**
 * Determine if argument values require 16-bit encoding.
 */
function needsWordArgs(arg1, arg2, argsAreXY) {
	if (argsAreXY) {
		return arg1 < -128 || arg1 > 127 || arg2 < -128 || arg2 > 127;
	}
	return arg1 > 255 || arg2 > 255;
}

/**
 * Rebuild composite flag uint16 from the JSON flag object.
 */
function rebuildComponentFlags(flagObj) {
	let flags = 0;
	if (flagObj.argsAreWords) flags |= ARG_1_AND_2_ARE_WORDS;
	if (flagObj.argsAreXYValues) flags |= ARGS_ARE_XY_VALUES;
	if (flagObj.roundXYToGrid) flags |= ROUND_XY_TO_GRID;
	if (flagObj.weHaveAScale) flags |= WE_HAVE_A_SCALE;
	if (flagObj.weHaveAnXAndYScale) flags |= WE_HAVE_AN_X_AND_Y_SCALE;
	if (flagObj.weHaveATwoByTwo) flags |= WE_HAVE_A_TWO_BY_TWO;
	if (flagObj.weHaveInstructions) flags |= WE_HAVE_INSTRUCTIONS;
	if (flagObj.useMyMetrics) flags |= USE_MY_METRICS;
	if (flagObj.overlapCompound) flags |= OVERLAP_COMPOUND;
	if (flagObj.scaledComponentOffset) flags |= SCALED_COMPONENT_OFFSET;
	if (flagObj.unscaledComponentOffset) flags |= UNSCALED_COMPONENT_OFFSET;
	return flags;
}
