import { Fp, Fp12, Fp12Multiply, Fp12_ONE, Fp12_conjugate, Fp12_eql, Fp12_finalExponentiate, Fp2, G1_mapToCurve, G2_mapToCurve, bls12_381, parseMask } from "./noble";
import { H2CPointConstructor, createHasher } from "./noble/abstract/hash-to-curve";
import { bitGet, bitLen } from "./noble/abstract/utils";
import { AffinePoint, ProjConstructor } from "./noble/abstract/weierstrass";
import { sha256 } from "./noble/sha256";

export const BlsG1 = bls12_381.G1.ProjectivePoint;
export const BlsG2 = bls12_381.G2.ProjectivePoint;

export function isBlsG1( stuff: any ): stuff is BlsG1
{
    return stuff instanceof BlsG1 && (
        typeof stuff.px === "bigint" &&
        typeof stuff.py === "bigint" &&
        typeof stuff.pz === "bigint"
    );
}

export function isBlsG2( stuff: any ): stuff is BlsG2
{
    return stuff instanceof BlsG2 && (
        isFp2( stuff.px ) &&
        isFp2( stuff.py ) &&
        isFp2( stuff.pz )
    );
}

type UnwrapProjConstructor<Stuff extends ProjConstructor<any>> =
    Stuff extends ProjConstructor<infer T> ? T : never;

export type Fp2 = UnwrapProjConstructor<typeof BlsG2>;

export function isFp2( stuff: any ): stuff is Fp2
{
    return typeof stuff === "object" && (
        stuff !== null && !Array.isArray( stuff ) &&
        typeof stuff.c0 === "bigint" &&
        typeof stuff.c1 === "bigint"
    );
}

type ConstructorReturnType<CtorLike extends { new( ...args: any ): any }> =
    CtorLike extends { new( ...args: any ): infer ReturnT } ? ReturnT :
    never;

export type BlsG1 = ConstructorReturnType<typeof BlsG1>;
export type BlsG2 = ConstructorReturnType<typeof BlsG2>;

const curveOrder = BigInt("52435875175126190479447740508185965837690552500527637822603658699938581184513");

const htfDefaults = Object.freeze({
    // DST: a domain separation tag
    // defined in section 2.2.5
    // Use utils.getDSTLabel(), utils.setDSTLabel(value)
    DST: "" ,// 'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_',
    encodeDST: "", // 'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_',
    // p: the characteristic of F
    //    where F is a finite field of characteristic p and order q = p^m
    p: Fp.ORDER,
    // m: the extension degree of F, m >= 1
    //     where F is a finite field of characteristic p and order q = p^m
    m: 2,
    // k: the target security level for the suite in bits
    // defined in section 5.1
    k: 128,
    // option to use a message that has already been processed by
    // expand_message_xmd
    expand: 'xmd',
    // Hash functions for: expand_message_xmd is appropriate for use with a
    // wide range of hash functions, including SHA-2, SHA-3, BLAKE2, and others.
    // BBS+ uses blake2: https://github.com/hyperledger/aries-framework-go/issues/2247
    hash: sha256,
} as const);

const G2_Hasher = createHasher(BlsG2 as H2CPointConstructor<Fp2>, G2_mapToCurve, { ...htfDefaults })
const G1_Hasher = createHasher(BlsG1, G1_mapToCurve, { ...htfDefaults, m: 1, DST: 'BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_' })

export function bls12_381_G1_add( a: BlsG1, b: BlsG1 ): BlsG1
{
    // if( bls12_381_G1_equal( a, BlsG1.ZERO ) ) return b;
    // if( bls12_381_G1_equal( b, BlsG1.ZERO ) ) return a;
    return a.add( b );
}

export function bls12_381_G1_neg( elem: BlsG1 ): BlsG1
{
    return elem.negate();
}

export function bls12_381_G1_scalarMul( n: number | bigint, g1: BlsG1 ): BlsG1
{
    if( n < 0 ) return bls12_381_G1_scalarMul( -n, bls12_381_G1_neg( g1 ) );
    n = BigInt( n );
    if( n >= curveOrder ) n = n % curveOrder;
    if( n === BigInt( 0 ) ) return BlsG1.ZERO;
    return g1.multiply( n );
}

export function bls12_381_G1_equal( a: BlsG1, b: BlsG1 ): boolean
{
    return a.equals( b );
}

export function bls12_381_G1_hashToGroup( a: Uint8Array, b: Uint8Array ): BlsG1
{
    // noble-curves can handle that but the plutus-machine doesn't
    // so we artificially throw an error here
    if( b.length > 255 ) throw new Error("DST length can not be greater than 255");
    return BlsG1.fromAffine(
        G1_Hasher.hashToCurve( a, { DST: b })
        .toAffine()
    );
}

export function bls12_381_G1_compress( elem: BlsG1 ): Uint8Array
{
    return elem.toRawBytes();
}

export function bls12_381_G1_uncompress( compressed: Uint8Array ): BlsG1
{
    const { compressed: compressed_bit, infinity, sort, value } = parseMask( compressed );

    // point zero edge case
    if(
        compressed_bit &&
        infinity &&
        sort &&
        value.every( n => n === 0 )
    ) throw new Error(
        "sign bit set on pont ZERO, we don't like it"
    );

    // not compressed bytes would be totally fine for the library but we artificially fail here
    // https://github.com/IntersectMBO/plutus/blob/master/plutus-conformance/test-cases/uplc/evaluation/builtin/semantics/bls12_381_G1_uncompress/on-curve-serialised-not-compressed/on-curve-serialised-not-compressed.uplc
    if( !compressed_bit ) throw new Error(
        "uncompress only works with compressed byets"
    );

    return BlsG1.fromHex( compressed );
}

export function bls12_381_G2_add( a: BlsG2, b: BlsG2 ): BlsG2
{
    // if( bls12_381_G2_equal( a, BlsG2.ZERO ) ) return b;
    // if( bls12_381_G2_equal( b, BlsG2.ZERO ) ) return a;
    return a.add( b );
}

export function bls12_381_G2_neg( elem: BlsG2 ): BlsG2
{
    return elem.negate();
}

export function bls12_381_G2_scalarMul( n: number | bigint, g2: BlsG2 ): BlsG2
{
    if( n < 0 ) return bls12_381_G2_scalarMul( -n, bls12_381_G2_neg( g2 ) );
    n = BigInt( n );
    if( n >= curveOrder ) n = n % curveOrder;
    if( n === BigInt( 0 ) ) return BlsG2.ZERO;
    return g2.multiply( BigInt( n ) );
}

export function bls12_381_G2_equal( a: BlsG2, b: BlsG2 ): boolean
{
    return a.equals( b );
}

export function bls12_381_G2_hashToGroup( a: Uint8Array, b: Uint8Array ): BlsG2
{
    // noble-curves can handle that but the plutus-machine doesn't
    // so we artificially throw an error here
    if( b.length > 255 ) throw new Error("DST length can not be greater than 255");
    return BlsG2.fromAffine(
        G2_Hasher.hashToCurve( a, { DST: b })
        .toAffine()
    );
}

export function bls12_381_G2_compress( elem: BlsG2 ): Uint8Array
{
    return elem.toRawBytes();
}

export function bls12_381_G2_uncompress( compressed: Uint8Array ): BlsG2
{
    const { compressed: compressed_bit } = parseMask( compressed );

    // not compressed bytes would be totally fine for the library but we artificially fail here
    // https://github.com/IntersectMBO/plutus/blob/master/plutus-conformance/test-cases/uplc/evaluation/builtin/semantics/bls12_381_G2_uncompress/on-curve-serialised-not-compressed/on-curve-serialised-not-compressed.uplc
    if( !compressed_bit ) throw new Error(
        "uncompress only works with compressed byets"
    );
    
    return BlsG2.fromHex( compressed );
}

export function bls12_381_millerLoop( g1: BlsG1, g2: BlsG2 ): BlsResult
{
    const { x, y } = g1.toAffine();
    return millerLoop(pairingPrecomputes(g2), [ x, y ]);
}

export function bls12_381_mulMlResult( a: BlsResult, b: BlsResult ): BlsResult
{
    return Fp12Multiply( a, b );
}

export const bls12_381_eqMlResult: ( a: BlsResult, b: BlsResult ) => boolean = Fp12_eql;

export function bls12_381_finalVerify( a: BlsResult, b: BlsResult ): boolean
{
    // blst implementation https://github.com/supranational/blst/blob/0d46eefa45fc1e57aceb42bba0e84eab3a7a9725/src/aggregate.c#L506
    let GT = Fp12_conjugate( a );
    GT = Fp12Multiply( GT, b );
    GT = Fp12_finalExponentiate( GT );

    return Fp12_eql( GT, Fp12_ONE );
}


// The BLS parameter x for BLS12-381
const BLS_X = BigInt('0xd201000000010000');
const BLS_X_LEN = bitLen(BLS_X);
const _2n = BigInt(2), _3n = BigInt(3);

// Pre-compute coefficients for sparse multiplication
// Point addition and point double calculations is reused for coefficients
function calcPairingPrecomputes(p: AffinePoint<Fp2>) {
    const { x, y } = p;
    // prettier-ignore
    const Qx = x, Qy = y, Qz = Fp2.ONE;
    // prettier-ignore
    let Rx = Qx, Ry = Qy, Rz = Qz;
    let ell_coeff: [Fp2, Fp2, Fp2][] = [];
    for (let i = BLS_X_LEN - 2; i >= 0; i--) {
        // Double
        let t0 = Fp2.sqr(Ry); // Ry²
        let t1 = Fp2.sqr(Rz); // Rz²
        let t2 = Fp2.multiplyByB(Fp2.mul(t1, _3n)); // 3 * T1 * B
        let t3 = Fp2.mul(t2, _3n); // 3 * T2
        let t4 = Fp2.sub(Fp2.sub(Fp2.sqr(Fp2.add(Ry, Rz)), t1), t0); // (Ry + Rz)² - T1 - T0
        ell_coeff.push([
            Fp2.sub(t2, t0), // T2 - T0
            Fp2.mul(Fp2.sqr(Rx), _3n), // 3 * Rx²
            Fp2.neg(t4), // -T4
        ]);
        Rx = Fp2.div(Fp2.mul(Fp2.mul(Fp2.sub(t0, t3), Rx), Ry), _2n); // ((T0 - T3) * Rx * Ry) / 2
        Ry = Fp2.sub(Fp2.sqr(Fp2.div(Fp2.add(t0, t3), _2n)), Fp2.mul(Fp2.sqr(t2), _3n)); // ((T0 + T3) / 2)² - 3 * T2²
        Rz = Fp2.mul(t0, t4); // T0 * T4
        if (bitGet(BLS_X /*CURVE.params.x*/, i)) {
            // Addition
            let t0 = Fp2.sub(Ry, Fp2.mul(Qy, Rz)); // Ry - Qy * Rz
            let t1 = Fp2.sub(Rx, Fp2.mul(Qx, Rz)); // Rx - Qx * Rz
            ell_coeff.push([
            Fp2.sub(Fp2.mul(t0, Qx), Fp2.mul(t1, Qy)), // T0 * Qx - T1 * Qy
            Fp2.neg(t0), // -T0
            t1, // T1
            ]);
            let t2 = Fp2.sqr(t1); // T1²
            let t3 = Fp2.mul(t2, t1); // T2 * T1
            let t4 = Fp2.mul(t2, Rx); // T2 * Rx
            let t5 = Fp2.add(Fp2.sub(t3, Fp2.mul(t4, _2n)), Fp2.mul(Fp2.sqr(t0), Rz)); // T3 - 2 * T4 + T0² * Rz
            Rx = Fp2.mul(t1, t5); // T1 * T5
            Ry = Fp2.sub(Fp2.mul(Fp2.sub(t4, t5), t0), Fp2.mul(t3, Ry)); // (T4 - T5) * T0 - T3 * Ry
            Rz = Fp2.mul(Rz, t3); // Rz * T3
        }
    }
    return ell_coeff;
}

// Sparse multiplication against precomputed coefficients
// TODO: replace with weakmap?
type withPairingPrecomputes = { _PPRECOMPUTES: [Fp2, Fp2, Fp2][] | undefined };
function pairingPrecomputes(point: BlsG2): [Fp2, Fp2, Fp2][] {
    const p = point as BlsG2 & withPairingPrecomputes;
    if (p._PPRECOMPUTES) return p._PPRECOMPUTES;
    p._PPRECOMPUTES = calcPairingPrecomputes(point.toAffine());
    return p._PPRECOMPUTES;
}

function millerLoop(ell: [Fp2, Fp2, Fp2][], g1: [bigint, bigint])
{
    const x = BLS_X;
    const Px = g1[0];
    const Py = g1[1];
    let f12 = Fp12.ONE;
    for (let j = 0, i = BLS_X_LEN - 2; i >= 0; i--, j++) {
      const E = ell[j];
      f12 = Fp12.multiplyBy014(f12, E[0], Fp2.mul(E[1], Px), Fp2.mul(E[2], Py));
      if (bitGet(x, i)) {
        j += 1;
        const F = ell[j];
        f12 = Fp12.multiplyBy014(f12, F[0], Fp2.mul(F[1], Px), Fp2.mul(F[2], Py));
      }
      if (i !== 0) f12 = Fp12.sqr(f12);
    }
    return Fp12.conjugate(f12);
}

export type BlsResult = {
    c0: Fp6_t,
    c1: Fp6_t,
};

export function isBlsResult( stuff: any ): stuff is BlsResult
{
    return typeof stuff === "object" && (
        stuff !== null && !Array.isArray( stuff ) &&
        isFp6( stuff.c0 ) &&
        isFp6( stuff.c1 )
    );
}

type Fp6_t = {
    c0: Fp2;
    c1: Fp2;
    c2: Fp2;
}

export function isFp6( stuff: any ): stuff is Fp6_t
{
    return typeof stuff === "object" && (
        stuff !== null && !Array.isArray( stuff ) &&
        isFp2( stuff.c0 ) &&
        isFp2( stuff.c1 ) &&
        isFp2( stuff.c2 )
    );
}