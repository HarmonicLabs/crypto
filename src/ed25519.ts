import { fromHex, isUint8Array } from "@harmoniclabs/uint8array-utils";
import { sha2_512 } from "./sha2_512";
import { buffToByteArr, byte, byteArrToHex } from "./types";
import { positiveMod } from "./utils/positiveMod";
import { assert } from "./utils/assert";
import { bigintToBuffer } from "./utils/bigintToBuffer";


type bigpoint = [bigint,bigint];

const Q = BigInt( "57896044618658097711785492504343953926634992332820282019728792003956564819949" ); // ipowi(255) - 19
const Q38 = BigInt( "7237005577332262213973186563042994240829374041602535252466099000494570602494" ); // (Q + 3)/8
const CURVE_ORDER = BigInt( "7237005577332262213973186563042994240857116359379907606001950938285454250989" ); // ipow2(252) + 27742317777372353535851937790883648493;
const D = -BigInt( "4513249062541557337682894930092624173785641285191125241628941591882900924598840740" ); // -121665 * invert(121666);
const I = BigInt( "19681161376707505956807079304988542015446066515923890162744021073123829784752" ); // expMod(BigInt( 2 ), (Q - BigInt( 1 ))/4, Q);

const BASE = Object.freeze([
    BigInt( "15112221349535400772501151409588531511454012693041857206046113283949847762202" ), // recoverX(B[1]) % Q
    BigInt( "46316835694926478169428394003475163141307993866256225615783033603165251855960" ) // (4*invert(5)) % Q
] as const);

/**
 * 
 * @param {bigint} b 
 * @param {bigint} e 
 * @param {bigint} m 
 * @returns {bigint}
 */
function expMod(b: bigint, e: bigint, m: bigint): bigint
{
    if (e == BigInt( 0 )) {
        return BigInt( 1 );
    } else {
        let t = expMod(b, e/BigInt( 2 ), m);
        t = (t*t) % m;

        if ((e % BigInt( 2 )) != BigInt( 0 )) {
            t = positiveMod(t*b, m)
        }

        return t;
    }
}

function invert(n: bigint): bigint {
    let a = positiveMod(n, Q);
    let b = Q;

    let x = BigInt( 0 );
    let y = BigInt( 1 );
    let u = BigInt( 1 );
    let v = BigInt( 0 );

    while (a !== BigInt( 0 )) {
        const q = b / a;
        const r = b % a;
        const m = x - u*q;
        const n = y - v*q;
        b = a;
        a = r;
        x = u;
        y = v;
        u = m;
        v = n;
    }

    return positiveMod(x, Q)
}

/**
 * @param {bigint} y 
 * @returns {bigint}
 */
function recoverX( y: bigint ): bigint
{
    const yy = y*y;
    const xx = (yy - BigInt( 1 )) * invert(D*yy + BigInt( 1 ));
    let x = expMod(xx, Q38, Q);

    if (((x*x - xx) % Q) !== BigInt( 0 )) {
        x = (x*I) % Q;
    }

    if (( x % BigInt( 2 ) ) !== BigInt( 0 )) {
        x = Q - x;
    }

    return x;
}		

/**
 * Curve point 'addition'
 * Note: this is probably the bottleneck of this Ed25519 implementation
 */
export function addPointsEdwards(a: Readonly<bigpoint>, b: Readonly<bigpoint>): bigpoint
{
    const x1 = a[0];
    const y1 = a[1];
    const x2 = b[0];
    const y2 = b[1];
    const dxxyy = D*x1*x2*y1*y2;
    const x3 = (x1*y2+x2*y1) * invert(BigInt( 1 )+dxxyy);
    const y3 = (y1*y2+x1*x2) * invert(BigInt( 1 )-dxxyy);
    return [positiveMod(x3, Q), positiveMod(y3, Q)];
}

export function scalarMul(point: Readonly<bigpoint>, n: bigint): bigpoint
{
    if (n === BigInt( 0 )) {
        return [BigInt( 0 ), BigInt( 1 )];
    } else {
        let sum = scalarMul(point, n/BigInt( 2 ));
        sum = addPointsEdwards(sum, sum);
        if ((n % BigInt( 2 )) !== BigInt( 0 )) {
            sum = addPointsEdwards(sum, point);
        }

        return sum;
    }
}

/**
 * Curve point 'multiplication'
 */
export function encodeInt(y: bigint): byte[] {
    let bytes = Array.from( bigintToBuffer(y) ).reverse() as byte[];
    
    while (bytes.length < 32)
    {
        bytes.push(0);
    }

    return bytes;
}

function decodeInt(s: byte[] | Uint8Array): bigint {
    return BigInt(
        "0x" + byteArrToHex( s.reverse() )
    );
}

function bigpointToByteArray(point: bigpoint): byte[] {
    const [x, y] = point;

    let bytes = encodeInt(y);

    // last bit is determined by x
    bytes[31] = ((bytes[31] & 0b011111111) | (Number(x & BigInt( 1 )) * 0b10000000)) as byte;

    return bytes;
}

export function bigpointToUint8Array( point: bigpoint ): Uint8Array
{
    return new Uint8Array( bigpointToByteArray( point ) );
}

function getBit(bytes: byte[], i: number): 0 | 1
{
    return ((bytes[Math.floor(i/8)] >> i%8) & 1) as  0 | 1
}

function isOnCurve(point: bigpoint): boolean
{
    const x = point[0];
    const y = point[1];
    const xx = x*x;
    const yy = y*y;
    return (-xx + yy - BigInt( 1 ) - D*xx*yy) % Q == BigInt( 0 );
}

export function pointFromBytes(s: byte[] | Uint8Array): bigpoint
{
    if( s instanceof Uint8Array ) s = asBytes( s );
    assert(s.length == 32, "point must have length of 32");

    const bytes = s.slice();
    bytes[31] = (bytes[31] & 0b01111111) as byte;

    const y = decodeInt(bytes);

    let x = recoverX(y);
    if (Number(x & BigInt( 1 )) != getBit(s, 255)) {
        x = Q - x;
    }

    const point: bigpoint = [x, y];

    if (!isOnCurve(point)) {
        throw new Error("point isn't on curve");
    }

    return point;
}

const ipow2_253 = BigInt( "28948022309329048855892746252171976963317496166410141009864396001978282409984" ); // ipow2(253)

export function scalarFromBytes(h: byte[] | Uint8Array): bigint
{
    const bytes = h.slice(0, 32);
    bytes[0]  = (bytes[ 0  ] & 0b11111000) as byte;
    bytes[31] = (bytes[ 31 ] & 0b00111111) as byte;

    return ipow2_253 + BigInt( 
        "0x" + byteArrToHex( bytes.reverse() )
    );
}

function ihash( m: byte[] ): bigint
{
    return decodeInt( sha2_512(m) );
}

type Uint8ArrayLike = Uint8Array | string | byte[];

function forceUint8Array( stuff: Uint8ArrayLike ): Uint8Array
{
    if( typeof stuff === "string" ) return fromHex( stuff );
    return isUint8Array( stuff ) ? stuff : new Uint8Array( stuff )
}

export function scalarMultBase( scalar: bigint ): bigpoint
{
    return scalarMul(BASE, scalar);
}

export function deriveEd25519PublicKey(privateKey: byte[]): byte[]
{
    const extended = sha2_512(privateKey);
    const a = scalarFromBytes(extended);
    const A = scalarMul(BASE, a);

    return bigpointToByteArray(A);
}

export function extendedToPublic( extended: Uint8Array | byte[] ): Uint8Array
{
    if( extended instanceof Uint8Array ) extended = Array.from( extended ) as byte[];
    const a = scalarFromBytes(extended);
    const A = scalarMul(BASE, a);

    return new Uint8Array( bigpointToByteArray(A) );
}

function asBytes( stuff: Uint8ArrayLike ): byte[]
{
    if( typeof stuff === "string" ) return asBytes( fromHex( stuff ) )
    return Array.from( stuff ) as byte[]
}

export interface SignEd25519Result {
    0: Uint8Array, // pubKey
    1: Uint8Array, // signature
    /** to be `ArrayLike` */
    length: 2,
    // to allow array destructuring
    [Symbol.iterator]: () => Generator<Uint8Array, void, unknown>,
    pubKey: Uint8Array,
    signature: Uint8Array,
}

export function signEd25519(
    message: Uint8ArrayLike,
    privateKey: Uint8ArrayLike
): SignEd25519Result
{
    message = forceUint8Array( message );
    privateKey = forceUint8Array( privateKey );

    return signExtendedEd25519( message, sha2_512( asBytes( privateKey ) ) );
}

export function signExtendedEd25519(
    message: Uint8ArrayLike,
    extendedKey: Uint8ArrayLike
): SignEd25519Result
{
    message = forceUint8Array( message );
    extendedKey = forceUint8Array( extendedKey );

    if( extendedKey.length !== 64 )
    throw new Error('signExtendedEd25519:: extended key must have length 64');

    const privateKeyHash = asBytes( extendedKey );
    const a = scalarFromBytes(privateKeyHash);

    // for convenience getulate publicKey here:
    const publicKey = bigpointToByteArray(scalarMul(BASE, a));

    const r = ihash(privateKeyHash.slice(32, 64).concat( asBytes( message ) ) );
    const R = scalarMul(BASE, r);
    const S = positiveMod(r + ihash(bigpointToByteArray(R).concat(publicKey).concat(asBytes( message )))*a, CURVE_ORDER);

    const pubKey = new Uint8Array( publicKey );
    const signature = new Uint8Array( bigpointToByteArray(R).concat(encodeInt(S) ) );
    return {
        0: pubKey,
        1: signature,
        length: 2,
        [Symbol.iterator]: function* () {
            yield pubKey;
            yield signature;
        },
        pubKey,
        signature
    };
}

export function getEd25519Signature( message: Uint8ArrayLike, privateKey: Uint8ArrayLike ): Uint8Array
{
    return signEd25519( message, privateKey ).signature;
}

export function verifyEd25519Signature(signature: Uint8ArrayLike, message: Uint8ArrayLike, publicKey: Uint8ArrayLike): boolean
{
    if (signature.length !== 64 || publicKey.length != 32)
    {
        throw new Error(`unexpected signature length ${signature.length}`);
    }
    
    if( isUint8Array( signature ) )
    {
        signature = buffToByteArr( signature );
    }

    if( isUint8Array( message ) )
    {
        message = buffToByteArr( message );
    }

    if( isUint8Array( publicKey ) )
    {
        publicKey = buffToByteArr( publicKey );
    }

    const R = pointFromBytes( asBytes( signature ).slice(0, 32));
    const A = pointFromBytes( asBytes( publicKey ));
    const S = decodeInt( asBytes( signature ).slice(32, 64) );
    const h = ihash( asBytes( signature ).slice(0, 32).concat( asBytes( publicKey ) ).concat( asBytes( message ) ));

    const left = scalarMul(BASE, S);
    const right = addPointsEdwards(R, scalarMul(A, h));

    return (left[0] == right[0]) && (left[1] == right[1]);
}

const _0n = BigInt( 0 );

const ED25519_ORDER = BigInt(
    '57896044618658097711785492504343953926634992332820282019728792003956564819949'
);

function mod(a: bigint, b: bigint): bigint {
    const result = a % b;
    return result >= _0n ? result : b + result;
}

export function ed25519bigint( n: bigint ): bigint
{
    return mod( n , ED25519_ORDER );
}