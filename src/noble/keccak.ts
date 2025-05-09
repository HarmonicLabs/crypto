/*
THIS IMPLEMENTATION WAS TAKEN FROM `@noble/hashes`

original source: https://github.com/paulmillr/noble-hashes/blob/6ae82e75d4c354d53a488e95b1bfe9cba90bd6ff/src/sha3.ts#L1

it was modified and adapted to this repository to re-use already defined stuff

the main reason for copying over and not using as dependency is because of different target in the `tsconfig.json`

`@noble/hashes` targets es2020, which tends to cause problems with some other (older) packages sometimes

this repo targets ES5+
*/
import { rotlBH, rotlBL, rotlSH, rotlSL, split } from './_u64';
import {
  Hash,
  u32,
  Input,
  wrapConstructor,
  HashXOF,
  isLE,
  byteSwap32,
  toBytes,
} from './utils';
import { assertPostiveInteger } from '../utils/assert';

// SHA3 (keccak) is based on a new design: basically, the internal state is bigger than output size.
// It's called a sponge function.

// Various per round constants calculations
const SHA3_PI: number[] = [];
const SHA3_ROTL: number[] = [];
const _SHA3_IOTA: bigint[] = [];
const _0n = /** @__PURE__ */ BigInt(0);
const _1n = /** @__PURE__ */ BigInt(1);
const _2n = /** @__PURE__ */ BigInt(2);
const _7n = /** @__PURE__ */ BigInt(7);
const _256n = /** @__PURE__ */ BigInt(256);
const _0x71n = /** @__PURE__ */ BigInt(0x71);
for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
    // Pi
    [x, y] = [y, (2 * x + 3 * y) % 5];
    SHA3_PI.push(2 * (5 * y + x));
    // Rotational
    SHA3_ROTL.push((((round + 1) * (round + 2)) / 2) % 64);
    // Iota
    let t = _0n;
    for (let j = 0; j < 7; j++) {
        R = ((R << _1n) ^ ((R >> _7n) * _0x71n)) % _256n;
        if (R & _2n) t ^= _1n << ((_1n << /** @__PURE__ */ BigInt(j)) - _1n);
    }
    _SHA3_IOTA.push(t);
}
const [SHA3_IOTA_H, SHA3_IOTA_L] = /** @__PURE__ */ split(_SHA3_IOTA, true);

// Left rotation (without 0, 32, 64)
const rotlH = (h: number, l: number, s: number) => (s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s));
const rotlL = (h: number, l: number, s: number) => (s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s));

// Same as keccakf1600, but allows to skip some rounds
export function keccakP(s: Uint32Array, rounds: number = 24) {
    const B = new Uint32Array(5 * 2);
    // NOTE: all indices are x2 since we store state as u32 instead of u64 (bigints to slow in js)
    for (let round = 24 - rounds; round < 24; round++) {
        // Theta θ
        for (let x = 0; x < 10; x++) B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
        for (let x = 0; x < 10; x += 2) {
            const idx1 = (x + 8) % 10;
            const idx0 = (x + 2) % 10;
            const B0 = B[idx0];
            const B1 = B[idx0 + 1];
            const Th = rotlH(B0, B1, 1) ^ B[idx1];
            const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
            for (let y = 0; y < 50; y += 10) {
                s[x + y] ^= Th;
                s[x + y + 1] ^= Tl;
            }
        }
        // Rho (ρ) and Pi (π)
        let curH = s[2];
        let curL = s[3];
        for (let t = 0; t < 24; t++) {
            const shift = SHA3_ROTL[t];
            const Th = rotlH(curH, curL, shift);
            const Tl = rotlL(curH, curL, shift);
            const PI = SHA3_PI[t];
            curH = s[PI];
            curL = s[PI + 1];
            s[PI] = Th;
            s[PI + 1] = Tl;
        }
        // Chi (χ)
        for (let y = 0; y < 50; y += 10)
        {
            for (let x = 0; x < 10; x++) B[x] = s[y + x];
            for (let x = 0; x < 10; x++) s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
        }
        // Iota (ι)
        s[0] ^= SHA3_IOTA_H[round];
        s[1] ^= SHA3_IOTA_L[round];
    }
    B.fill(0);
}

export class Keccak extends Hash<Keccak> implements HashXOF<Keccak> {
    protected state: Uint8Array;
    protected pos = 0;
    protected posOut = 0;
    protected finished = false;
    protected state32: Uint32Array;
    protected destroyed = false;
    // NOTE: we accept arguments in bytes instead of bits here.
    constructor(
        public blockLen: number,
        public suffix: number,
        public outputLen: number,
        protected enableXOF = false,
        protected rounds: number = 24
    ) {
        super();
        // Can be passed from user as dkLen
        assertPostiveInteger(outputLen);
        // 1600 = 5x5 matrix of 64bit.  1600 bits === 200 bytes
        if (0 >= this.blockLen || this.blockLen >= 200)
        throw new Error('Sha3 supports only keccak-f1600 function');
        this.state = new Uint8Array(200);
        this.state32 = u32(this.state);
    }
    protected keccak() {
        if (!isLE) byteSwap32(this.state32);
        keccakP(this.state32, this.rounds);
        if (!isLE) byteSwap32(this.state32);
        this.posOut = 0;
        this.pos = 0;
    }
    update(data: Input) {
        this.assertExists();
        const { blockLen, state } = this;
        data = toBytes(data);
        const len = data.length;
        for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        for (let i = 0; i < take; i++) state[this.pos++] ^= data[pos++];
        if (this.pos === blockLen) this.keccak();
        }
        return this;
    }
    protected finish() {
        if (this.finished) return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        // Do the padding
        state[pos] ^= suffix;
        if ((suffix & 0x80) !== 0 && pos === blockLen - 1) this.keccak();
        state[blockLen - 1] ^= 0x80;
        this.keccak();
    }
    protected writeInto(out: Uint8Array): Uint8Array {
        this.assertExists( false );
        if(!( out instanceof Uint8Array )) throw new Error("Uint8Array expected");
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len; ) {
        if (this.posOut >= blockLen) this.keccak();
        const take = Math.min(blockLen - this.posOut, len - pos);
        out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
        this.posOut += take;
        pos += take;
        }
        return out;
    }
    xofInto(out: Uint8Array): Uint8Array {
        // Sha3/Keccak usage with XOF is probably mistake, only SHAKE instances can do XOF
        if (!this.enableXOF) throw new Error('XOF is not possible for this instance');
        return this.writeInto(out);
    }
    xof(bytes: number): Uint8Array {
        assertPostiveInteger(bytes);
        return this.xofInto(new Uint8Array(bytes));
    }
    digestInto(out: Uint8Array) {
        // output(out, this);
        if(!( out instanceof Uint8Array )) throw new Error("Uint8Array expected");
        const min = this.outputLen;
        if (out.length < min) throw new Error(`digestInto() expects output buffer of length at least ${min}`);

        if (this.finished) throw new Error('digest() was already called');
        this.writeInto(out);
        this.destroy();
        return out;
    }
    digest() {
        return this.digestInto(new Uint8Array(this.outputLen));
    }
    destroy() {
        this.destroyed = true;
        this.state.fill(0);
    }
    _cloneInto(to?: Keccak): Keccak {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to ||= new Keccak(blockLen, suffix, outputLen, enableXOF, rounds);
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        // Suffix can change in cSHAKE
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        to.destroyed = this.destroyed;
        return to;
    }
    assertExists(checkFinished = true)
    {
        if( this.destroyed ) throw new Error('Hash instance has been destroyed');
        if( checkFinished && this.finished ) throw new Error('Hash#digest() has already been called');
    }
}

const gen = (suffix: number, blockLen: number, outputLen: number) =>
  wrapConstructor(() => new Keccak(blockLen, suffix, outputLen));

// export const sha3_224 = /** @__PURE__ */ gen(0x06, 144, 224 / 8);
// /**
//  * SHA3-256 hash function
//  * @param message - that would be hashed
//  */
// export const sha3_256 = /** @__PURE__ */ gen(0x06, 136, 256 / 8);
// export const sha3_384 = /** @__PURE__ */ gen(0x06, 104, 384 / 8);
// export const sha3_512 = /** @__PURE__ */ gen(0x06, 72, 512 / 8);
export const keccak_224 = /** @__PURE__ */ gen(0x01, 144, 224 / 8);
/**
 * keccak-256 hash function. Different from SHA3-256.
 * @param message - that would be hashed
 */
export const keccak_256 = /** @__PURE__ */ gen(0x01, 136, 256 / 8);
export const keccak_384 = /** @__PURE__ */ gen(0x01, 104, 384 / 8);
export const keccak_512 = /** @__PURE__ */ gen(0x01, 72, 512 / 8);

export type ShakeOpts = { dkLen?: number };

// const genShake = (suffix: number, blockLen: number, outputLen: number) =>
//   wrapXOFConstructorWithOpts<HashXOF<Keccak>, ShakeOpts>(
//     (opts: ShakeOpts = {}) =>
//       new Keccak(blockLen, suffix, opts.dkLen === undefined ? outputLen : opts.dkLen, true)
//   );
// 
// export const shake128 = /** @__PURE__ */ genShake(0x1f, 168, 128 / 8);
// export const shake256 = /** @__PURE__ */ genShake(0x1f, 136, 256 / 8);