/*
THIS IMPLEMENTATION WAS TAKEN FROM `@noble/hashes`

original source: https://github.com/paulmillr/noble-hashes/blob/6ae82e75d4c354d53a488e95b1bfe9cba90bd6ff/src/_u64.ts#L1

it was modified and adapted to this repository to re-use already defined stuff

the main reason for copying over and not using as dependency is because of different target in the `tsconfig.json`

`@noble/hashes` targets es2020, which tends to cause problems with some other (older) packages sometimes

this repo targets ES5+
*/
const U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
const _32n = /* @__PURE__ */ BigInt(32);

// We are not using BigUint64Array, because they are extremely slow as per 2022
export function fromBig(n: bigint, le = false) {
    if (le) return { h: Number(n & U32_MASK64), l: Number((n >> _32n) & U32_MASK64) };
    return { h: Number((n >> _32n) & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}

export function split(lst: bigint[], le = false) {
    let Ah = new Uint32Array(lst.length);
    let Al = new Uint32Array(lst.length);
    for (let i = 0; i < lst.length; i++) {
        const { h, l } = fromBig(lst[i], le);
        [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
}

export const toBig = (h: number, l: number) => (BigInt(h >>> 0) << _32n) | BigInt(l >>> 0);
// for Shift in [0, 32)
export const shrSH = (h: number, _l: number, s: number) => h >>> s;
export const shrSL = (h: number, l: number, s: number) => (h << (32 - s)) | (l >>> s);
// Right rotate for Shift in [1, 32)
export const rotrSH = (h: number, l: number, s: number) => (h >>> s) | (l << (32 - s));
export const rotrSL = (h: number, l: number, s: number) => (h << (32 - s)) | (l >>> s);
// Right rotate for Shift in (32, 64), NOTE: 32 is special case.
export const rotrBH = (h: number, l: number, s: number) => (h << (64 - s)) | (l >>> (s - 32));
export const rotrBL = (h: number, l: number, s: number) => (h >>> (s - 32)) | (l << (64 - s));
// Right rotate for shift===32 (just swaps l&h)
export const rotr32H = (_h: number, l: number) => l;
export const rotr32L = (h: number, _l: number) => h;
// Left rotate for Shift in [1, 32)
export const rotlSH = (h: number, l: number, s: number) => (h << s) | (l >>> (32 - s));
export const rotlSL = (h: number, l: number, s: number) => (l << s) | (h >>> (32 - s));
// Left rotate for Shift in (32, 64), NOTE: 32 is special case.
export const rotlBH = (h: number, l: number, s: number) => (l << (s - 32)) | (h >>> (64 - s));
export const rotlBL = (h: number, l: number, s: number) => (h << (s - 32)) | (l >>> (64 - s));

// JS uses 32-bit signed integers for bitwise operations which means we cannot
// simple take carry out of low bit sum by shift, we need to use division.
export function add(Ah: number, Al: number, Bh: number, Bl: number) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: (Ah + Bh + ((l / 2 ** 32) | 0)) | 0, l: l | 0 };
}
// Addition with more than 2 elements
export const add3L = (Al: number, Bl: number, Cl: number) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
export const add3H = (low: number, Ah: number, Bh: number, Ch: number) =>
    (Ah + Bh + Ch + ((low / 2 ** 32) | 0)) | 0;
export const add4L = (Al: number, Bl: number, Cl: number, Dl: number) =>
    (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
export const add4H = (low: number, Ah: number, Bh: number, Ch: number, Dh: number) =>
    (Ah + Bh + Ch + Dh + ((low / 2 ** 32) | 0)) | 0;
export const add5L = (Al: number, Bl: number, Cl: number, Dl: number, El: number) =>
    (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
export const add5H = (low: number, Ah: number, Bh: number, Ch: number, Dh: number, Eh: number) =>
    (Ah + Bh + Ch + Dh + Eh + ((low / 2 ** 32) | 0)) | 0;