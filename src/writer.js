/**
 * Font-to-JSON : DataWriter
 * Cursor-based binary writer with auto-advancing typed write methods
 * for every OpenType data type.
 *
 * Usage:
 *   const writer = new DataWriter(256);   // allocate 256 bytes
 *   writer.uint16(4);                     // format
 *   writer.uint16(totalLen);              // length
 *   // ...
 *   const bytes = writer.toArray();       // → number[]
 */

export class DataWriter {
	/**
	 * @param {number} size - number of bytes to allocate (all initialised to 0)
	 */
	constructor(size) {
		this._buffer = new ArrayBuffer(size);
		this._view = new DataView(this._buffer);
		this._bytes = new Uint8Array(this._buffer);
		this._pos = 0;
	}

	/** Current byte offset. */
	get position() {
		return this._pos;
	}

	/** Total byte length of the buffer. */
	get length() {
		return this._buffer.byteLength;
	}

	/** The underlying DataView — for random-access writes when needed. */
	get view() {
		return this._view;
	}

	/** The underlying Uint8Array — for bulk set operations. */
	get bytes() {
		return this._bytes;
	}

	// ─── Cursor control ─────────────────────────────────────────────────

	/** Move the cursor to an absolute byte offset. */
	seek(offset) {
		this._pos = offset;
		return this;
	}

	/** Advance the cursor by `n` bytes without writing. */
	skip(n) {
		this._pos += n;
		return this;
	}

	// ─── Unsigned integers ──────────────────────────────────────────────

	/** Write uint8 (1 byte). */
	uint8(value) {
		this._view.setUint8(this._pos, value);
		this._pos += 1;
		return this;
	}

	/** Write uint16 (2 bytes, big-endian). */
	uint16(value) {
		this._view.setUint16(this._pos, value);
		this._pos += 2;
		return this;
	}

	/** Write uint24 (3 bytes, big-endian). */
	uint24(value) {
		this._view.setUint8(this._pos, (value >> 16) & 0xff);
		this._view.setUint8(this._pos + 1, (value >> 8) & 0xff);
		this._view.setUint8(this._pos + 2, value & 0xff);
		this._pos += 3;
		return this;
	}

	/** Write uint32 (4 bytes, big-endian). */
	uint32(value) {
		this._view.setUint32(this._pos, value);
		this._pos += 4;
		return this;
	}

	// ─── Signed integers ────────────────────────────────────────────────

	/** Write int8 (1 byte, signed). */
	int8(value) {
		this._view.setInt8(this._pos, value);
		this._pos += 1;
		return this;
	}

	/** Write int16 (2 bytes, big-endian, signed). */
	int16(value) {
		this._view.setInt16(this._pos, value);
		this._pos += 2;
		return this;
	}

	/** Write int32 (4 bytes, big-endian, signed). */
	int32(value) {
		this._view.setInt32(this._pos, value);
		this._pos += 4;
		return this;
	}

	// ─── OpenType-specific types ────────────────────────────────────────

	/** Write a Tag — 4 ASCII bytes from a string. */
	tag(value) {
		for (let i = 0; i < 4; i++) {
			this._view.setUint8(this._pos + i, value.charCodeAt(i));
		}
		this._pos += 4;
		return this;
	}

	/** Write Offset16 (alias for uint16). */
	offset16(value) {
		return this.uint16(value);
	}

	/** Write Offset32 (alias for uint32). */
	offset32(value) {
		return this.uint32(value);
	}

	/** Write Fixed (JS number → 16.16 signed fixed-point). */
	fixed(value) {
		this._view.setInt32(this._pos, Math.round(value * 65536));
		this._pos += 4;
		return this;
	}

	/** Write FWORD (alias for int16). */
	fword(value) {
		return this.int16(value);
	}

	/** Write UFWORD (alias for uint16). */
	ufword(value) {
		return this.uint16(value);
	}

	/** Write F2DOT14 (JS number → 2.14 signed fixed-point). */
	f2dot14(value) {
		this._view.setInt16(this._pos, Math.round(value * 16384));
		this._pos += 2;
		return this;
	}

	/**
	 * Write LONGDATETIME — BigInt representing seconds since 1904-01-01 00:00 UTC.
	 */
	longDateTime(value) {
		const big = BigInt(value);
		this._view.setInt32(this._pos, Number(big >> 32n));
		this._view.setUint32(this._pos + 4, Number(big & 0xffffffffn));
		this._pos += 8;
		return this;
	}

	// ─── Bulk writes ────────────────────────────────────────────────────

	/**
	 * Write an array of values using the named method.
	 * @param {string} method - name of a write method, e.g. 'uint16'
	 * @param {Array} values
	 */
	array(method, values) {
		const fn = this[method].bind(this);
		for (const v of values) {
			fn(v);
		}
		return this;
	}

	/**
	 * Write raw bytes (number[] or Uint8Array) at the current position.
	 * @param {number[]|Uint8Array} data
	 */
	rawBytes(data) {
		const src = data instanceof Uint8Array ? data : new Uint8Array(data);
		this._bytes.set(src, this._pos);
		this._pos += src.length;
		return this;
	}

	// ─── Output ─────────────────────────────────────────────────────────

	/** Return the buffer contents as a plain number[]. */
	toArray() {
		return Array.from(this._bytes);
	}
}
