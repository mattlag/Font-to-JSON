/**
 * Font Flux JS : DataReader
 * Cursor-based binary reader that wraps a DataView with auto-advancing
 * typed read methods for every OpenType data type.
 *
 * Usage:
 *   const reader = new DataReader(rawBytesArray);
 *   const version = reader.uint16();
 *   const tag     = reader.tag();
 *   reader.seek(100);
 *   const val     = reader.int32();
 */

export class DataReader {
	/**
	 * @param {number[]|Uint8Array} bytes - source bytes
	 * @param {number} [startOffset=0]    - initial cursor position
	 */
	constructor(bytes, startOffset = 0) {
		const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
		this._view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
		this._pos = startOffset;
	}

	/** Current byte offset. */
	get position() {
		return this._pos;
	}

	/** Total byte length of the underlying data. */
	get length() {
		return this._view.byteLength;
	}

	/**
	 * The underlying DataView — for callers that need random-access reads
	 * (e.g., subtable offsets that jump around within a table).
	 */
	get view() {
		return this._view;
	}

	// --- Cursor control -------------------------------------------------

	/** Move the cursor to an absolute byte offset. */
	seek(offset) {
		this._pos = offset;
		return this;
	}

	/** Advance the cursor by `n` bytes without reading. */
	skip(n) {
		this._pos += n;
		return this;
	}

	// --- Unsigned integers ----------------------------------------------

	/** Read uint8 (1 byte). */
	uint8() {
		const v = this._view.getUint8(this._pos);
		this._pos += 1;
		return v;
	}

	/** Read uint16 (2 bytes, big-endian). */
	uint16() {
		const v = this._view.getUint16(this._pos);
		this._pos += 2;
		return v;
	}

	/** Read uint24 (3 bytes, big-endian). */
	uint24() {
		const v =
			(this._view.getUint8(this._pos) << 16) |
			(this._view.getUint8(this._pos + 1) << 8) |
			this._view.getUint8(this._pos + 2);
		this._pos += 3;
		return v;
	}

	/** Read uint32 (4 bytes, big-endian). */
	uint32() {
		const v = this._view.getUint32(this._pos);
		this._pos += 4;
		return v;
	}

	// --- Signed integers ------------------------------------------------

	/** Read int8 (1 byte, signed). */
	int8() {
		const v = this._view.getInt8(this._pos);
		this._pos += 1;
		return v;
	}

	/** Read int16 (2 bytes, big-endian, signed). */
	int16() {
		const v = this._view.getInt16(this._pos);
		this._pos += 2;
		return v;
	}

	/** Read int32 (4 bytes, big-endian, signed). */
	int32() {
		const v = this._view.getInt32(this._pos);
		this._pos += 4;
		return v;
	}

	// --- OpenType-specific types ----------------------------------------

	/** Read a Tag — 4 ASCII bytes returned as a string. */
	tag() {
		const s = String.fromCharCode(
			this._view.getUint8(this._pos),
			this._view.getUint8(this._pos + 1),
			this._view.getUint8(this._pos + 2),
			this._view.getUint8(this._pos + 3),
		);
		this._pos += 4;
		return s;
	}

	/** Read Offset16 (alias for uint16). */
	offset16() {
		return this.uint16();
	}

	/** Read Offset32 (alias for uint32). */
	offset32() {
		return this.uint32();
	}

	/** Read Fixed (16.16 signed fixed-point -> JS number). */
	fixed() {
		const raw = this._view.getInt32(this._pos);
		this._pos += 4;
		return raw / 65536;
	}

	/** Read FWORD (alias for int16). */
	fword() {
		return this.int16();
	}

	/** Read UFWORD (alias for uint16). */
	ufword() {
		return this.uint16();
	}

	/** Read F2DOT14 (2.14 signed fixed-point -> JS number). */
	f2dot14() {
		const raw = this._view.getInt16(this._pos);
		this._pos += 2;
		return raw / 16384;
	}

	/**
	 * Read LONGDATETIME — signed 64-bit integer representing seconds since
	 * 1904-01-01 00:00 UTC.  Returned as a BigInt.
	 */
	longDateTime() {
		const hi = this._view.getInt32(this._pos);
		const lo = this._view.getUint32(this._pos + 4);
		this._pos += 8;
		return (BigInt(hi) << 32n) | BigInt(lo);
	}

	// --- Bulk reads -----------------------------------------------------

	/**
	 * Read `count` values using the named method.
	 * @param {string} method - name of a read method, e.g. 'uint16'
	 * @param {number} count
	 * @returns {Array}
	 */
	array(method, count) {
		const result = [];
		const fn = this[method].bind(this);
		for (let i = 0; i < count; i++) {
			result.push(fn());
		}
		return result;
	}

	/**
	 * Read `count` raw bytes and return a plain Array of numbers.
	 * @param {number} count
	 * @returns {number[]}
	 */
	bytes(count) {
		const result = [];
		for (let i = 0; i < count; i++) {
			result.push(this._view.getUint8(this._pos + i));
		}
		this._pos += count;
		return result;
	}
}
