/**
 * Font Flux JS : Bitmap Common
 * Shared helpers for bitmap tables (CBLC/EBLC, CBDT/EBDT).
 */

export const SMALL_GLYPH_METRICS_SIZE = 5;
export const BIG_GLYPH_METRICS_SIZE = 8;

export function parseSmallGlyphMetrics(reader) {
	return {
		height: reader.uint8(),
		width: reader.uint8(),
		bearingX: reader.int8(),
		bearingY: reader.int8(),
		advance: reader.uint8(),
	};
}

export function writeSmallGlyphMetrics(writer, m) {
	writer.uint8(m.height ?? 0);
	writer.uint8(m.width ?? 0);
	writer.int8(m.bearingX ?? 0);
	writer.int8(m.bearingY ?? 0);
	writer.uint8(m.advance ?? 0);
}

export function parseBigGlyphMetrics(reader) {
	return {
		height: reader.uint8(),
		width: reader.uint8(),
		horiBearingX: reader.int8(),
		horiBearingY: reader.int8(),
		horiAdvance: reader.uint8(),
		vertBearingX: reader.int8(),
		vertBearingY: reader.int8(),
		vertAdvance: reader.uint8(),
	};
}

export function writeBigGlyphMetrics(writer, m) {
	writer.uint8(m.height ?? 0);
	writer.uint8(m.width ?? 0);
	writer.int8(m.horiBearingX ?? 0);
	writer.int8(m.horiBearingY ?? 0);
	writer.uint8(m.horiAdvance ?? 0);
	writer.int8(m.vertBearingX ?? 0);
	writer.int8(m.vertBearingY ?? 0);
	writer.uint8(m.vertAdvance ?? 0);
}
