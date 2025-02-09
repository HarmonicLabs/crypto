import { byte } from "./types";
import { rotr32 } from "./utils/rotr32";
import { hasGlobalWebCrypto } from "./hasGlobalWebCrypto";

let __hasNativeSupport = hasGlobalWebCrypto && typeof globalThis.crypto.subtle.digest === "function";
const NATIVE_ALGO = "SHA-256";
const digest = __hasNativeSupport ?
    globalThis.crypto.subtle.digest.bind(globalThis.crypto.subtle) :
    () => Promise.resolve( new ArrayBuffer(0) );

async function _test_nativeSha2_256( data: Uint8Array | ArrayBuffer ): Promise<Uint8Array>
{
    // await ensureNativeSupport();
    // if( !__hasNativeSupport ) return sha2_256_sync( data );
    return new Uint8Array( await digest( NATIVE_ALGO, data ) );
}
async function nativeSha2_256( data: Uint8Array | ArrayBuffer ): Promise<Uint8Array>
{
    await ensureNativeSupport();
    if( !__hasNativeSupport ) return sha2_256_sync( data );
    return new Uint8Array( await digest( NATIVE_ALGO, data ) );
}

async function _test(
    data: Uint8Array,
    uint8ArrayEq: (a: Uint8Array, b: Uint8Array) => boolean
): Promise<[ native: number, js: number ]>
{
    if( !__hasNativeSupport ) return [ 50, 1 ];
    let start = 0;
    let end = 0;
    try {
        start = performance.now();
        const nativeRestult = new Uint8Array( await _test_nativeSha2_256( data ) );
        end = performance.now();
        const nativeTime = end - start;

        start = performance.now();
        const result = sha2_256_sync( data );
        end = performance.now();
        const jsTime = end - start;

        __hasNativeSupport = __hasNativeSupport && uint8ArrayEq( nativeRestult, result );

        return [ nativeTime, jsTime ];
    } catch { __hasNativeSupport = false; }
    return [ 50, 1 ];
}
let _support_was_tested = false;
async function _test_support(){
    if( _support_was_tested || !__hasNativeSupport ) return;
    try {
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
        const bench = await Promise.all(
            repeatArr(
                [
                    new Uint8Array( 0 ),
                    new Uint8Array( 10 ),
                    new Uint8Array([ 0xde, 0xad, 0xbe, 0xef ]),
    
                    new Uint8Array( repeatArr([0xaa], 20 ) ),
                    new Uint8Array( repeatArr([0xbb], 20 ) ),
                    new Uint8Array( repeatArr([0xcc], 20 ) ),
                    new Uint8Array( repeatArr([0xdd], 20 ) ),
                    new Uint8Array( repeatArr([0xee], 20 ) ),
                    new Uint8Array( repeatArr([0xff], 20 ) ),
    
                    new Uint8Array( repeatArr([0xaa, 0xbb], 33 ) ),
                    new Uint8Array( repeatArr([0xbb, 0xcc], 33 ) ),
                    new Uint8Array( repeatArr([0xcc, 0xdd], 33 ) ),
                    new Uint8Array( repeatArr([0xdd, 0xee], 33 ) ),
                    new Uint8Array( repeatArr([0xee, 0xff], 33 ) ),
                    new Uint8Array( repeatArr([0xff, 0x00], 33 ) ),
    
                    new Uint8Array( repeatArr([ 0xde, 0xad, 0xbe, 0xef ], 30 ) ),
                ],
                10
            )
            .map( data => _test( data, eqU8Arr ) ) 
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
    _test_support();
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


/**
 * Pad a bytearray so its size is a multiple of 64 (512 bits).
 * Internal method.
 */
function pad(src: Uint8Array): Uint8Array
{
    const nBits = src.length*8;
    let finalLen = src.length;
    // dst = src.slice();

    // dst.push(0x80);
    finalLen++;

    let nZeroes = (64 - (src.length + 1)%64) - 8;
    if (nZeroes < 0) {
        nZeroes += 64;
    }

    // for (let i = 0; i < nZeroes; i++) {
    //     dst.push(0);
    // }
    finalLen += nZeroes;

    // assume nBits fits in 32 bits

    // dst.push(0);
    // dst.push(0);
    // dst.push(0);
    // dst.push(0);
    // dst.push( ((nBits >> 24) & 0xff) as byte);
    // dst.push( ((nBits >> 16) & 0xff) as byte);
    // dst.push( ((nBits >> 8)  & 0xff) as byte);
    // dst.push( ((nBits >> 0)  & 0xff) as byte);
    finalLen += 8;

    const dst = new Uint8Array( finalLen );
    dst.set( src );
    dst[src.length] = 0x80;
    dst[finalLen - 4] = (nBits >>> 24) & 0xff;
    dst[finalLen - 3] = (nBits >>> 16) & 0xff;
    dst[finalLen - 2] = (nBits >>> 8 ) & 0xff;
    dst[finalLen - 1] =  nBits         & 0xff;
    
    return dst;
}

const k: number[] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sigma0(x: number): number
{
    return rotr32(x, 7) ^ rotr32(x, 18) ^ (x >>> 3);
}

function sigma1(x: number ): number
{
    return rotr32(x, 17) ^ rotr32(x, 19) ^ (x >>> 10);
}

const initialHash = new Uint32Array([
    0x6a09e667, 
    0xbb67ae85, 
    0x3c6ef372, 
    0xa54ff53a, 
    0x510e527f, 
    0x9b05688c, 
    0x1f83d9ab, 
    0x5be0cd19,
]);
/**
 * getulates sha2-256 (32bytes) hash of a list of uint8 numbers.
 * Result is also a list of uint8 number.
 * @example 
 * bytesToHex(sha2_256([0x61, 0x62, 0x63])) => "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
 * @example
 * sha2_256(textToBytes("Hello, World!")) => [223, 253, 96, 33, 187, 43, 213, 176, 175, 103, 98, 144, 128, 158, 195, 165, 49, 145, 221, 129, 199, 247, 10, 75, 40, 104, 138, 54, 33, 130, 152, 111]
 * @param {uint5[]} bytes - list of uint8 numbers
 * @returns {number[]} - list of uint8 numbers
 */
export function sha2_256_sync( _bytes: byte[] | Uint8Array | ArrayBuffer ): Uint8Array
{
    if(!( _bytes instanceof Uint8Array )) _bytes = new Uint8Array( _bytes );
    if(   _bytes instanceof ArrayBuffer ) _bytes = new Uint8Array( _bytes );
    /**
     * Initial hash (updated during compression phase)
     */
    const hash = initialHash.slice();

    const bytes = pad( _bytes as Uint8Array );

    // break message in successive 64 byte chunks
    for (let chunkStart = 0; chunkStart < bytes.length; chunkStart += 64) {
        let chunk = Uint8Array.prototype.slice.call( bytes, chunkStart, chunkStart + 64 ); 
        // bytes.slice(chunkStart, chunkStart + 64);

        const w = new Int32Array( 64 );// (new Array(64)).fill(0); // array of 32 bit numbers!

        // copy chunk into first 16 positions of w
        for (let i = 0; i < 16; i++) {
            w[i] = (chunk[i*4 + 0] << 24) |
                   (chunk[i*4 + 1] << 16) |
                   (chunk[i*4 + 2] <<  8) |
                   (chunk[i*4 + 3]);
        }
        // this DOES NOT WORK
        // w.set( new Int32Array( chunk.buffer, chunk.byteOffset, 16 ) );

        // extends the first 16 positions into the remaining 48 positions
        for (let i = 16; i < 64; i++) {
            w[i] = (w[i-16] + sigma0(w[i-15]) + w[i-7] + sigma1(w[i-2])) | 0;
        }

        // intialize working variables to current hash value
        let a = hash[0];
        let b = hash[1];
        let c = hash[2];
        let d = hash[3];
        let e = hash[4];
        let f = hash[5];
        let g = hash[6];
        let h = hash[7];

        // compression function main loop
        for (let i = 0; i < 64; i++) {
            let S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
            let ch = (e & f) ^ ((~e) & g);
            let temp1 = (h + S1 + ch + k[i] + w[i]) | 0;
            let S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let temp2 = (S0 + maj) | 0;

            h = g;
            g = f;
            f = e;
            e = (d + temp1) | 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) | 0;
        }

        // update the hash
        hash[0] = (hash[0] + a) | 0;
        hash[1] = (hash[1] + b) | 0;
        hash[2] = (hash[2] + c) | 0;
        hash[3] = (hash[3] + d) | 0;
        hash[4] = (hash[4] + e) | 0;
        hash[5] = (hash[5] + f) | 0;
        hash[6] = (hash[6] + g) | 0;
        hash[7] = (hash[7] + h) | 0;
    }

    // produce the final digest of uint8 numbers
    const result = new Uint8Array(32);
    for (let i = 0; i < 8; i++) {
        let item = hash[i];

        // result.push( ((item >> 24) & 0xff) as byte );
        // result.push( ((item >> 16) & 0xff) as byte );
        // result.push( ((item >>  8) & 0xff) as byte );
        // result.push( ((item >>  0) & 0xff) as byte );
        const i4 = i*4;
        result[i4    ] = (item >>> 24) & 0xff;
        result[i4 + 1] = (item >>> 16) & 0xff;
        result[i4 + 2] = (item >>>  8) & 0xff;
        result[i4 + 3] = (item       ) & 0xff;
    }

    return result;
}

function wrapped_sha2_256_sync( data: Uint8Array | ArrayBuffer ): Promise<Uint8Array>
{
    return Promise.resolve( sha2_256_sync( data ) );
}

export const sha2_256: typeof nativeSha2_256 = __hasNativeSupport ? nativeSha2_256 : wrapped_sha2_256_sync;

export const hasNativeSha2_256 = sha2_256 === nativeSha2_256;