import { concatUint8Array, fromHex, isUint8Array } from "@harmoniclabs/uint8array-utils";
import { sha2_512, sha2_512_sync } from "./sha2_512";
import { buffToByteArr, byte, byteArrToHex } from "./types";
import { positiveMod } from "./utils/positiveMod";
import { assert } from "./utils/assert";
import { bigintToBuffer } from "./utils/bigintToBuffer";
import { hasGlobalWebCrypto } from "./hasGlobalWebCrypto";


// "Ed25519" does not seem to have great support yet
let __hasNativeSupport = false && (
    hasGlobalWebCrypto
    && typeof globalThis.crypto.subtle.importKey === "function"
    && typeof globalThis.crypto.subtle.sign === "function"
    && typeof globalThis.crypto.subtle.verify === "function"
);
const NATIVE_ALGO_NAME = "Ed25519";
const NATIVE_ALGO = Object.freeze({ name: NATIVE_ALGO_NAME });
const importKey: typeof globalThis.crypto.subtle.importKey = __hasNativeSupport ?
    globalThis.crypto.subtle.importKey.bind(globalThis.crypto.subtle) :
    () => Promise.resolve( new ArrayBuffer(0) ) as any;

async function getNativePrivateKey( bytes: Uint8Array ): Promise<CryptoKey>
{
    // ensure 64 bytes
    if( bytes.length === 32 ) bytes = getExtendedEd25519PrivateKey_sync( bytes );
    return await importKey(
        "raw",
        bytes,
        NATIVE_ALGO,
        false,
        ["sign", "deriveKey"]
    );
}

async function getNativePublicKey( bytes: Uint8Array ): Promise<CryptoKey>
{
    return importKey(
        "raw",
        bytes,
        NATIVE_ALGO,
        false,
        ["verify"]
    );
}

async function nativeEd25519Sign( privateKey: Uint8Array, data: Uint8Array ): Promise<Uint8Array>
{
    if( !(await ensureNativeSupport()) )
        return getEd25519Signature_sync( privateKey, data );
    return new Uint8Array(
        await globalThis.crypto.subtle.sign(
            NATIVE_ALGO_NAME,
            await getNativePrivateKey( privateKey ),
            data
        )
    );
}


const ED25519_ORDER = BigInt(
    '57896044618658097711785492504343953926634992332820282019728792003956564819949'
);

export function ed25519bigint( n: bigint ): bigint
{
    return positiveMod( n , ED25519_ORDER );
}

function toArrayBuffer( bytes: Uint8Array | ArrayBuffer ): ArrayBuffer
{
    if( bytes instanceof ArrayBuffer ) return bytes;
    const buffer = new ArrayBuffer( bytes.length );
    const view = new Uint8Array( buffer );
    view.set( bytes );
    return buffer;
}

async function nativeEd25519Verify(
    publicKey: Uint8Array,
    signature: Uint8Array | ArrayBuffer,
    data: Uint8Array | ArrayBuffer
): Promise<boolean>
{
    if(!(await ensureNativeSupport()))
        return verifyEd25519Signature_sync( signature, data, publicKey );
    
    return globalThis.crypto.subtle.verify(
        NATIVE_ALGO_NAME,
        await getNativePublicKey( publicKey ),
        toArrayBuffer( signature ),
        toArrayBuffer( data )
    );
}

async function _test(
    privateKey: CryptoKey,
    publicKey: CryptoKey,
    data: Uint8Array,
    uint8ArrayEq: (a: Uint8Array, b: Uint8Array) => boolean
): Promise<void>
{
    try {
        const privBytes = new Uint8Array( await globalThis.crypto.subtle.exportKey( "raw", privateKey ) );
        const pubBytes = new Uint8Array( await globalThis.crypto.subtle.exportKey( "raw", publicKey ) );
        const nativeSignResult = await nativeEd25519Sign( privBytes, data );
        const nativeVerifyResult = await nativeEd25519Verify( pubBytes, nativeSignResult, data );
        const mySignResult = getEd25519Signature_sync( data, privBytes );
        const myVerifyResult = verifyEd25519Signature_sync( mySignResult, data, pubBytes );
        __hasNativeSupport = (
            __hasNativeSupport &&
            uint8ArrayEq( nativeSignResult, mySignResult ) &&
            nativeVerifyResult === myVerifyResult
        );
    } catch { __hasNativeSupport = false; }
}
let _support_was_tested = false;
async function _test_support(){
    if( _support_was_tested || !__hasNativeSupport ) return;
    try {
        // just for test
        // well use our own keys
        const _keyPair /* { privateKey, publicKey } */ = (await globalThis.crypto.subtle.generateKey(
            NATIVE_ALGO,
            true,
            ["sign", "verify"]
        )) as CryptoKeyPair;
        const extendedPrivate = new Uint8Array( 64 );
        globalThis.crypto.getRandomValues( extendedPrivate );

        const cryptoPrivate = await getNativePrivateKey( extendedPrivate );

        const repeatArr = <T>( arr: T[], n: number ): T[] => {
            for( let i = 0; i < n; i++ ) arr = arr.concat( ...arr );
            return arr;
        };
        const eqU8Arr = (a: Uint8Array, b: Uint8Array): boolean => {
            if(!( a instanceof Uint8Array ) || !( b instanceof Uint8Array )) return false;
            if( a.length !== b.length ) return false;
            for( let i = 0; i < a.length; i++ ) if( a[i] !== b[i] ) return false;
            return true;
        };
        const bench: [ native: number, js: number ][] = await Promise.all(
            // repeatArr(
            //     [
            //         new Uint8Array( 0 ),
            //         new Uint8Array( 10 ),
            //         new Uint8Array([ 0xde, 0xad, 0xbe, 0xef ]),
    // 
            //         new Uint8Array( repeatArr([0xaa], 20 ) ),
            //         new Uint8Array( repeatArr([0xbb], 20 ) ),
            //         new Uint8Array( repeatArr([0xcc], 20 ) ),
            //         new Uint8Array( repeatArr([0xdd], 20 ) ),
            //         new Uint8Array( repeatArr([0xee], 20 ) ),
            //         new Uint8Array( repeatArr([0xff], 20 ) ),
    // 
            //         new Uint8Array( repeatArr([0xaa, 0xbb], 33 ) ),
            //         new Uint8Array( repeatArr([0xbb, 0xcc], 33 ) ),
            //         new Uint8Array( repeatArr([0xcc, 0xdd], 33 ) ),
            //         new Uint8Array( repeatArr([0xdd, 0xee], 33 ) ),
            //         new Uint8Array( repeatArr([0xee, 0xff], 33 ) ),
            //         new Uint8Array( repeatArr([0xff, 0x00], 33 ) ),
    // 
            //         new Uint8Array( repeatArr([ 0xde, 0xad, 0xbe, 0xef ], 30 ) ),
            //     ],
            //     10
            // )
            // .map( data => _test( privateKey, publicKey, data, uint8ArrayEq ) )
            []
        );
        if( !__hasNativeSupport ) return;
        let sum = bench.reduce( (acc, [native, js]) => {
            acc[0] += native;
            acc[1] += js;
            return acc;
        }, [ 0, 0 ] );
        __hasNativeSupport = __hasNativeSupport && sum[0] < sum[1];
    } catch { __hasNativeSupport = false; _support_was_tested = true; }
    _support_was_tested = true;
}
if( __hasNativeSupport ) {
    _test_support()
} else { _support_was_tested = true; }
/**
 * There are cases where `globalThis.crypto.subtle` is fully defined
 * but the algorithm `Ed25519` is NOT SUPPORTED.
 * 
 * unfortunately, there is NO WAY to check this syncronously.
 */
async function ensureNativeSupport(): Promise<boolean>
{
    if( !__hasNativeSupport ) return false;
    await _test_support();
    return __hasNativeSupport;
}

export type bigpoint = [bigint,bigint];

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

        if ((e % BigInt( 2 )) !== BigInt( 0 )) {
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
export function encodeInt(y: bigint): Uint8Array
{
    return bigintToBuffer( y, 32 ).reverse();
}

function decodeInt(s: Uint8Array ): bigint {
    return BigInt(
        "0x" + byteArrToHex( s.reverse() )
    );
}

function bigpointToByteArray(point: bigpoint): Uint8Array {
    const [x, y] = point;

    const bytes = encodeInt(y);

    // last bit is determined by x
    bytes[31] = ((bytes[31] & 0b011111111) | (Number(x & BigInt( 1 )) * 0b10000000)) as byte;

    return bytes;
}

export function bigpointToUint8Array( point: bigpoint ): Uint8Array
{
    return new Uint8Array( bigpointToByteArray( point ) );
}

function getBit(bytes: Uint8Array, i: number): 0 | 1
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

export function pointFromBytes( s: Uint8Array ): bigpoint
{
    if(!( s instanceof Uint8Array )) s = forceUint8Array( s );
    // assert(s.length === 32, "point must have length of 32; point length:" + s.length);

    const bytes = s.slice(0,32);
    bytes[31] = (bytes[31] & 0b01111111) as byte;

    const y = decodeInt(bytes);

    let x = recoverX(y);
    if (Number(x & BigInt( 1 )) !== getBit(s, 255)) {
        x = Q - x;
    }

    const point: bigpoint = [x, y];

    if (!isOnCurve(point)) throw new Error("point isn't on curve");

    return point;
}

const ipow2_253 = BigInt( "28948022309329048855892746252171976963317496166410141009864396001978282409984" ); // ipow2(253)

export function scalarFromBytes(h: Uint8Array ): bigint
{
    const bytes = h.slice(0, 32);
    bytes[0]  = (bytes[ 0  ] & 0b11111000) as byte;
    bytes[31] = (bytes[ 31 ] & 0b00111111) as byte;

    return ipow2_253 + BigInt( 
        "0x" + byteArrToHex( bytes.reverse() )
    );
}

export function scalarToBytes(s: bigint): Uint8Array
{
    s = positiveMod(s, CURVE_ORDER);
    const bytes = encodeInt(s);
    bytes.reverse();
    return bytes;
}

function ihash( m: Uint8Array ): bigint
{
    return decodeInt( sha2_512_sync(m) );
}

type Uint8ArrayLike = ArrayBuffer | Uint8Array | string | byte[];

function forceUint8Array( stuff: Uint8ArrayLike ): Uint8Array
{
    if( stuff instanceof Uint8Array ) return stuff;
    if( stuff instanceof ArrayBuffer ) return new Uint8Array( stuff );
    if( typeof stuff === "string" ) return fromHex( stuff );
    return new Uint8Array( stuff );
}

export function scalarMultBase( scalar: bigint ): bigpoint
{
    return scalarMul(BASE, scalar);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////// 
//------------------------------------------------------------------------------------------------------// 
//------------------------------------------- key management -------------------------------------------// 
//------------------------------------------- and derivation -------------------------------------------// 
//------------------------------------------------------------------------------------------------------// 
////////////////////////////////////////////////////////////////////////////////////////////////////////// 

export function getExtendEd25519PrivateKeyComponentsAsBytes_sync( privateKey: Uint8Array ): [ scalar: Uint8Array, extension: Uint8Array ]
{
    const extended = sha2_512_sync(privateKey);
    return [ extended.slice(0, 32), extended.slice(32, 64) ]
}

export function getExtendEd25519PrivateKeyComponents_sync( privateKey: Uint8Array ): [ scalar: bigint, extension: Uint8Array ]
{
    const [ a_bytes, extension ] = getExtendEd25519PrivateKeyComponentsAsBytes_sync( privateKey );
    return [ scalarFromBytes( a_bytes ), extension ]
}

export function getExtendedEd25519PrivateKey_sync( privateKey: Uint8Array ): Uint8Array
{
    privateKey = Uint8Array.prototype.slice.call( forceUint8Array( privateKey ), 0, 32 );
    const extended = sha2_512_sync( privateKey );
    extended.set( privateKey, 0 );
    return extended;
}

export async function getExtendedEd25519PrivateKey( privateKey: Uint8Array ): Promise<Uint8Array>
{
    // here `__hasNativeSupport` instead of `await ensureNativeSupport()` is fine
    // because we want to use `sha2_512`, wich implies different tests than the ones
    // used in `ensureNativeSupport`; `__hasNativeSupport` at least tell us if there is a `crypto` global at all 
    if( !__hasNativeSupport )
        return getExtendedEd25519PrivateKey_sync( privateKey );
    privateKey = Uint8Array.prototype.slice.call( forceUint8Array( privateKey ), 0, 32 );
    const extended = await sha2_512(privateKey);
    extended.set(privateKey, 0);
    return extended;
}

export function deriveEd25519PublicKey_sync( privateKey: Uint8Array ): Uint8Array
{
    const extended = sha2_512_sync(privateKey);
    const a = scalarFromBytes(extended);
    const A = scalarMul(BASE, a);

    return bigpointToByteArray(A);
}

function wrapped_deriveEd25519PublicKey_sync( privateKey: Uint8Array ): Promise<Uint8Array>
{
    return Promise.resolve( deriveEd25519PublicKey_sync( privateKey ) );
}

async function deriveEd25519PublicKey_async( privateKey: Uint8Array ): Promise<Uint8Array>
{
    if( !__hasNativeSupport ) return deriveEd25519PublicKey_sync( privateKey );
    const extended = await sha2_512(privateKey);
    const a = scalarFromBytes(extended);
    const A = scalarMul(BASE, a);

    return bigpointToByteArray(A);
}

export const deriveEd25519PublicKey: typeof deriveEd25519PublicKey_async = __hasNativeSupport ? deriveEd25519PublicKey_async : wrapped_deriveEd25519PublicKey_sync;

export function extendedToPublic( extended: Uint8Array | byte[] ): Uint8Array
{
    extended = forceUint8Array( extended );
    const a = scalarFromBytes(extended);
    const A = scalarMul(BASE, a);

    return new Uint8Array( bigpointToByteArray(A) );
}

/////////////////////////////////////////////////////////////////////////////////////////////////// 
//-----------------------------------------------------------------------------------------------// 
//------------------------------------------- signing -------------------------------------------// 
//-----------------------------------------------------------------------------------------------// 
///////////////////////////////////////////////////////////////////////////////////////////////////

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

/** sign a message with a (32 bytes) private key */
export function signEd25519_sync(
    message: Uint8ArrayLike,
    privateKey: Uint8ArrayLike
): SignEd25519Result
{
    message = forceUint8Array( message );
    privateKey = forceUint8Array( privateKey );
    const extendedKey: Uint8Array = (privateKey as Uint8Array).length === 64 ?
        privateKey as any :
        sha2_512_sync( privateKey );

    return signExtendedEd25519_sync( message, extendedKey );
}

/** sign a message with a (32 bytes) private key */
export async function signEd25519(
    message: Uint8ArrayLike,
    privateKey: Uint8ArrayLike
): Promise<SignEd25519Result>
{
    privateKey = forceUint8Array( privateKey );
    const extended = (privateKey as Uint8Array).length === 64 ?
        privateKey as any :
        await sha2_512( privateKey );
    return await signExtendedEd25519( message, extended );
}

/** sign a message with a (64 bytes) private key */
export function signExtendedEd25519_sync(
    _message: Uint8ArrayLike,
    _extendedKey: Uint8ArrayLike
): SignEd25519Result
{
    const message        = forceUint8Array( _message );
    const privateKeyHash = forceUint8Array( _extendedKey );

    if( privateKeyHash.length !== 64 )
    throw new Error('signExtendedEd25519_sync:: extended key must have length 64');

    const a = scalarFromBytes( privateKeyHash );

    // for convenience getulate publicKey here:
    const publicKey = bigpointToByteArray(
        scalarMul(BASE, a)
    );

    const r = ihash(
        concatUint8Array(
            privateKeyHash.slice( 32, 64 ),
            forceUint8Array( message )
        )
    );
    const R = scalarMul(BASE, r);
    const S = positiveMod(
        r + 
        ihash(
            concatUint8Array(
                bigpointToByteArray(R),
                publicKey,
                forceUint8Array( message )
            )
        )*a,
        CURVE_ORDER
    );

    const pubKey = publicKey;
    const signature = concatUint8Array(
        bigpointToByteArray(R),
        encodeInt(S)
    );
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

function wrapped_signExtendedEd25519_sync(
    message: Uint8ArrayLike,
    extendedKey: Uint8ArrayLike
): Promise<SignEd25519Result>
{
    return Promise.resolve( signExtendedEd25519_sync( message, extendedKey ) );
}

/** sign a message with a (64 bytes) private key */
async function nativeExtendedSignEd25519(
    _message: Uint8ArrayLike,
    _extendedKey: Uint8ArrayLike
): Promise<SignEd25519Result>
{
    if(!(await ensureNativeSupport())) return signExtendedEd25519_sync( _message, _extendedKey );
    const message        = forceUint8Array( _message );
    const privateKeyHash = forceUint8Array( _extendedKey );

    if( privateKeyHash.length !== 64 )
    throw new Error('nativeExtendedSignEd25519:: extended key must have length 64');

    const a = scalarFromBytes( privateKeyHash );
    const pubKey = bigpointToByteArray(
        scalarMul(BASE, a)
    );

    const signature = await nativeEd25519Sign( privateKeyHash, message );
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

/** sign a message with a (64 bytes) private key */
export const signExtendedEd25519: typeof nativeExtendedSignEd25519  = __hasNativeSupport ? nativeExtendedSignEd25519 : wrapped_signExtendedEd25519_sync;

/** sign a message with a (32 bytes) private key */
export function getEd25519Signature_sync( message: Uint8ArrayLike, privateKey: Uint8ArrayLike ): Uint8Array
{
    return signEd25519_sync( message, privateKey ).signature;
}

function wrapped_getEd25519Signature_sync( message: Uint8ArrayLike, privateKey: Uint8ArrayLike ): Promise<Uint8Array>
{
    return Promise.resolve( getEd25519Signature_sync( message, privateKey ) );
}

/** sign a message with a (32 bytes) private key */
export const getEd25519Signature: typeof nativeEd25519Sign = __hasNativeSupport ? nativeEd25519Sign : wrapped_getEd25519Signature_sync; 

///////////////////////////////////////////////////////////////////////////////////////////////////// 
//-------------------------------------------------------------------------------------------------// 
//------------------------------------------- verifying -------------------------------------------// 
//-------------------------------------------------------------------------------------------------// 
/////////////////////////////////////////////////////////////////////////////////////////////////////

export function verifyEd25519Signature_sync(
    _signature: Uint8ArrayLike,
    _message: Uint8ArrayLike,
    _publicKey: Uint8ArrayLike
): boolean
{
    const signature   = forceUint8Array( _signature );
    const message     = forceUint8Array( _message );
    const publicKey   = forceUint8Array( _publicKey );
    if( signature.length !== 64 || publicKey.length !== 32 )
    {
        throw new Error(`unexpected signature length ${signature.length}`);
    }
    
    const R_bytes = forceUint8Array( signature ).slice(0, 32);
    const R = pointFromBytes( R_bytes );
    const A = pointFromBytes( forceUint8Array( publicKey ));
    const S = decodeInt( forceUint8Array( signature ).slice(32, 64) );
    const h = ihash(
        concatUint8Array(
            R_bytes,
            publicKey,
            message
        )
    );

    const left = scalarMul(BASE, S);
    const right = addPointsEdwards(R, scalarMul(A, h));

    return (left[0] == right[0]) && (left[1] == right[1]);
}

function wrapped_verifyEd25519Signature_sync( signature: Uint8ArrayLike, message: Uint8ArrayLike, publicKey: Uint8ArrayLike ): Promise<boolean>
{
    return Promise.resolve( verifyEd25519Signature_sync( signature, message, publicKey ) );
}

export const verifyEd25519Signature: typeof nativeEd25519Verify = __hasNativeSupport ? nativeEd25519Verify : wrapped_verifyEd25519Signature_sync;