/* eslint-disable no-redeclare */
/* eslint-disable no-plusplus */
/* eslint-disable block-scoped-var */
/* eslint-disable vars-on-top */
/* eslint-disable no-var */
/* eslint-disable no-buffer-constructor */
/* eslint-disable func-names */
/* eslint-disable brace-style */
/* eslint-disable prefer-rest-params */
/* eslint-disable no-use-before-define */
/* eslint-disable no-bitwise */
/**
xxHash64 implementation in pure Javascript

Copyright (C) 2016, Pierre Curto
MIT license
*/
const UINT64 = require("./uint64");

/*
 * Constants
 */
const PRIME64_1 = UINT64("11400714785074694791");
const PRIME64_2 = UINT64("14029467366897019727");
const PRIME64_3 = UINT64("1609587929392839161");
const PRIME64_4 = UINT64("9650029242287828579");
const PRIME64_5 = UINT64("2870177450012600261");

/**
 * Convert string to proper UTF-8 array
 * @param str Input string
 * @returns {Uint8Array} UTF8 array is returned as uint8 array
 */
function toUTF8Array(str) {
    const utf8 = [];
    for (let i = 0, n = str.length; i < n; i += 1) {
        let charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6),
                0x80 | (charcode & 0x3f));
        } else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i += 1;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >> 18),
                0x80 | ((charcode >> 12) & 0x3f),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
    }
    return new Uint8Array(utf8);
}

/**
 * XXH64 object used as a constructor or a function
 * @constructor
 * or
 * @param {Object|String} input data
 * @param {Number|UINT64} seed
 * @return ThisExpression
 * or
 * @return {UINT64} xxHash
 */
function XXH64() {
    if (arguments.length === 2) return new XXH64(arguments[1]).update(arguments[0]).digest();

    if (!(this instanceof XXH64)) return new XXH64(arguments[0]);

    init.call(this, arguments[0]);
}

/**
 * Initialize the XXH64 instance with the given seed
 * @method init
 * @param {Number|Object} seed as a number or an unsigned 32 bits integer
 * @return ThisExpression
 */
function init(seed) {
    this.seed = seed instanceof UINT64 ? seed.clone() : UINT64(seed);
    this.v1 = this.seed.clone().add(PRIME64_1).add(PRIME64_2);
    this.v2 = this.seed.clone().add(PRIME64_2);
    this.v3 = this.seed.clone();
    this.v4 = this.seed.clone().subtract(PRIME64_1);
    this.total_len = 0;
    this.memsize = 0;
    this.memory = null;

    return this;
}
XXH64.prototype.init = init;

/**
 * Add data to be computed for the XXH64 hash
 * @method update
 * @param {String|Buffer|ArrayBuffer} input as a string or nodejs Buffer or ArrayBuffer
 * @return ThisExpression
 */
XXH64.prototype.update = function (input) {
    let isArrayBuffer;

    // Convert all strings to utf-8 first (issue #5)
    if (typeof input === "string") {
        input = toUTF8Array(input);
        isArrayBuffer = true;
    }

    if (typeof ArrayBuffer !== "undefined" && input instanceof ArrayBuffer) {
        isArrayBuffer = true;
        input = new Uint8Array(input);
    }

    let p = 0;
    const len = input.length;
    const bEnd = p + len;

    if (len === 0) return this;

    this.total_len += len;

    if (this.memsize === 0) {
        if (isArrayBuffer) {
            this.memory = new Uint8Array(32);
        } else {
            this.memory = new Buffer(32);
        }
    }

    if (this.memsize + len < 32) // fill in tmp buffer
    {
        // XXH64_memcpy(this.memory + this.memsize, input, len)
        if (isArrayBuffer) {
            this.memory.set(input.subarray(0, len), this.memsize);
        } else {
            input.copy(this.memory, this.memsize, 0, len);
        }

        this.memsize += len;
        return this;
    }

    if (this.memsize > 0) // some data left from previous update
    {
        // XXH64_memcpy(this.memory + this.memsize, input, 16-this.memsize);
        if (isArrayBuffer) {
            this.memory.set(input.subarray(0, 32 - this.memsize), this.memsize);
        } else {
            input.copy(this.memory, this.memsize, 0, 32 - this.memsize);
        }

        let p64 = 0;
        var other;
        other = UINT64(
            (this.memory[p64 + 1] << 8) | this.memory[p64],
            (this.memory[p64 + 3] << 8) | this.memory[p64 + 2],
            (this.memory[p64 + 5] << 8) | this.memory[p64 + 4],
            (this.memory[p64 + 7] << 8) | this.memory[p64 + 6]
        );
        this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(
            (this.memory[p64 + 1] << 8) | this.memory[p64],
            (this.memory[p64 + 3] << 8) | this.memory[p64 + 2],
            (this.memory[p64 + 5] << 8) | this.memory[p64 + 4],
            (this.memory[p64 + 7] << 8) | this.memory[p64 + 6]
        );
        this.v2.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(
            (this.memory[p64 + 1] << 8) | this.memory[p64],
            (this.memory[p64 + 3] << 8) | this.memory[p64 + 2],
            (this.memory[p64 + 5] << 8) | this.memory[p64 + 4],
            (this.memory[p64 + 7] << 8) | this.memory[p64 + 6]
        );
        this.v3.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(
            (this.memory[p64 + 1] << 8) | this.memory[p64],
            (this.memory[p64 + 3] << 8) | this.memory[p64 + 2],
            (this.memory[p64 + 5] << 8) | this.memory[p64 + 4],
            (this.memory[p64 + 7] << 8) | this.memory[p64 + 6]
        );
        this.v4.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);

        p += 32 - this.memsize;
        this.memsize = 0;
    }

    if (p <= bEnd - 32) {
        const limit = bEnd - 32;

        do {
            var other;
            other = UINT64(
                (input[p + 1] << 8) | input[p],
                (input[p + 3] << 8) | input[p + 2],
                (input[p + 5] << 8) | input[p + 4],
                (input[p + 7] << 8) | input[p + 6]
            );
            this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
            p += 8;
            other = UINT64(
                (input[p + 1] << 8) | input[p],
                (input[p + 3] << 8) | input[p + 2],
                (input[p + 5] << 8) | input[p + 4],
                (input[p + 7] << 8) | input[p + 6]
            );
            this.v2.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
            p += 8;
            other = UINT64(
                (input[p + 1] << 8) | input[p],
                (input[p + 3] << 8) | input[p + 2],
                (input[p + 5] << 8) | input[p + 4],
                (input[p + 7] << 8) | input[p + 6]
            );
            this.v3.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
            p += 8;
            other = UINT64(
                (input[p + 1] << 8) | input[p],
                (input[p + 3] << 8) | input[p + 2],
                (input[p + 5] << 8) | input[p + 4],
                (input[p + 7] << 8) | input[p + 6]
            );
            this.v4.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
            p += 8;
        } while (p <= limit);
    }

    if (p < bEnd) {
        // XXH64_memcpy(this.memory, p, bEnd-p);
        if (isArrayBuffer) {
            this.memory.set(input.subarray(p, bEnd), this.memsize);
        } else {
            input.copy(this.memory, this.memsize, p, bEnd);
        }

        this.memsize = bEnd - p;
    }

    return this;
};

/**
 * Finalize the XXH64 computation. The XXH64 instance is ready for reuse for the given seed
 * @method digest
 * @return {UINT64} xxHash
 */
XXH64.prototype.digest = function () {
    const input = this.memory;
    let p = 0;
    const bEnd = this.memsize;
    let h64;
    let
        h;
    const u = new UINT64();

    if (this.total_len >= 32) {
        h64 = this.v1.clone().rotl(1);
        h64.add(this.v2.clone().rotl(7));
        h64.add(this.v3.clone().rotl(12));
        h64.add(this.v4.clone().rotl(18));

        h64.xor(this.v1.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
        h64.multiply(PRIME64_1).add(PRIME64_4);

        h64.xor(this.v2.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
        h64.multiply(PRIME64_1).add(PRIME64_4);

        h64.xor(this.v3.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
        h64.multiply(PRIME64_1).add(PRIME64_4);

        h64.xor(this.v4.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
        h64.multiply(PRIME64_1).add(PRIME64_4);
    } else {
        h64 = this.seed.clone().add(PRIME64_5);
    }

    h64.add(u.fromNumber(this.total_len));

    while (p <= bEnd - 8) {
        u.fromBits(
            (input[p + 1] << 8) | input[p],
            (input[p + 3] << 8) | input[p + 2],
            (input[p + 5] << 8) | input[p + 4],
            (input[p + 7] << 8) | input[p + 6]
        );
        u.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1);
        h64
            .xor(u)
            .rotl(27)
            .multiply(PRIME64_1)
            .add(PRIME64_4);
        p += 8;
    }

    if (p + 4 <= bEnd) {
        u.fromBits(
            (input[p + 1] << 8) | input[p],
            (input[p + 3] << 8) | input[p + 2],
            0,
            0
        );
        h64
            .xor(u.multiply(PRIME64_1))
            .rotl(23)
            .multiply(PRIME64_2)
            .add(PRIME64_3);
        p += 4;
    }

    while (p < bEnd) {
        u.fromBits(input[p++], 0, 0, 0);
        h64
            .xor(u.multiply(PRIME64_5))
            .rotl(11)
            .multiply(PRIME64_1);
    }

    h = h64.clone().shiftRight(33);
    h64.xor(h).multiply(PRIME64_2);

    h = h64.clone().shiftRight(29);
    h64.xor(h).multiply(PRIME64_3);

    h = h64.clone().shiftRight(32);
    h64.xor(h);

    // Reset the state
    this.init(this.seed);

    return h64;
};

export default XXH64;
