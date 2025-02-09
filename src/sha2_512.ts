import { uint8ArrayEq } from "@harmoniclabs/uint8array-utils";
import { hasGlobalWebCrypto } from "./hasGlobalWebCrypto";
import { byte, uint64 as uint64_t } from "./types";
import { uint64, forceUint64, uint64Rotr, byteArrToHex, uint64ToBytesBE } from "./types";
import { sha512 } from "./noble/sha512";

let __hasNativeSupport = hasGlobalWebCrypto && typeof globalThis.crypto.subtle.digest === "function";
const NATIVE_ALGO = "SHA-512";
const digest = __hasNativeSupport ?
    globalThis.crypto.subtle.digest.bind(globalThis.crypto.subtle) :
    () => Promise.resolve( new ArrayBuffer(0) );

async function nativeSha2_512( data: Uint8Array | ArrayBuffer ): Promise<Uint8Array>
{
    return new Uint8Array( await digest( NATIVE_ALGO, data ) );
}

async function _test( data: Uint8Array )
{
    try {
        const nativeRestult = new Uint8Array( await nativeSha2_512( data ) ?? [] );
        __hasNativeSupport = __hasNativeSupport && uint8ArrayEq( nativeRestult, sha2_512_sync( data ) );
    } catch { __hasNativeSupport = false; }
}
if( __hasNativeSupport ) {
    (async function(){
        try {
            const repeatArr = ( arr: number[], n: number ) => {
                const finalLen = arr.length * n;
                const dest = new Array( finalLen );
                for( let i = 0; i < finalLen; i++ ) {
                    dest[i] = arr[i % arr.length];
                }
                return dest;
            }
            [
                new Uint8Array( 0 ),
                new Uint8Array( 10 ),
                new Uint8Array( new Uint8Array([ 0xde, 0xad, 0xbe, 0xef ]) ),
                new Uint8Array( new Uint8Array( repeatArr([0xaa], 20 ) ) ),
                new Uint8Array( new Uint8Array( repeatArr([ 0xde, 0xad, 0xbe, 0xef ], 10 ) ) ),
            ].forEach( _test );
        } catch { __hasNativeSupport = false; }
    })()
}

/**
 * Pad a bytearray so its size is a multiple of 128 (1024 bits).
 * Internal method.
 */
export function _sha2_512_sync_pad( src: byte[] ): byte[]
{
    const nBits = src.length*8;
    
    // clone
    const dst = src.slice();

    dst.push(0x80);

    let nZeroes = ( 128 - dst.length % 128 ) - 8;
    if (nZeroes < 0) {
        nZeroes += 128;
    }

    for (let i = 0; i < nZeroes; i++) {
        dst.push(0);
    }

    // assume nBits fits in 32 bits

    dst.push(0);
    dst.push(0);
    dst.push(0);
    dst.push(0);
    dst.push( ((nBits >> 24) & 0xff) as byte );
    dst.push( ((nBits >> 16) & 0xff) as byte );
    dst.push( ((nBits >> 8)  & 0xff) as byte );
    dst.push( ((nBits >> 0)  & 0xff) as byte );
    
    return dst;
}

const _sha2_512_sync_k: readonly uint64_t[] = Object.freeze([
    uint64( "0x428a2f98d728ae22" ), uint64( "0x7137449123ef65cd" ), 
    uint64( "0xb5c0fbcfec4d3b2f" ), uint64( "0xe9b5dba58189dbbc" ),
    uint64( "0x3956c25bf348b538" ), uint64( "0x59f111f1b605d019" ), 
    uint64( "0x923f82a4af194f9b" ), uint64( "0xab1c5ed5da6d8118" ),
    uint64( "0xd807aa98a3030242" ), uint64( "0x12835b0145706fbe" ), 
    uint64( "0x243185be4ee4b28c" ), uint64( "0x550c7dc3d5ffb4e2" ),
    uint64( "0x72be5d74f27b896f" ), uint64( "0x80deb1fe3b1696b1" ), 
    uint64( "0x9bdc06a725c71235" ), uint64( "0xc19bf174cf692694" ),
    uint64( "0xe49b69c19ef14ad2" ), uint64( "0xefbe4786384f25e3" ), 
    uint64( "0x0fc19dc68b8cd5b5" ), uint64( "0x240ca1cc77ac9c65" ),
    uint64( "0x2de92c6f592b0275" ), uint64( "0x4a7484aa6ea6e483" ), 
    uint64( "0x5cb0a9dcbd41fbd4" ), uint64( "0x76f988da831153b5" ),
    uint64( "0x983e5152ee66dfab" ), uint64( "0xa831c66d2db43210" ), 
    uint64( "0xb00327c898fb213f" ), uint64( "0xbf597fc7beef0ee4" ),
    uint64( "0xc6e00bf33da88fc2" ), uint64( "0xd5a79147930aa725" ), 
    uint64( "0x06ca6351e003826f" ), uint64( "0x142929670a0e6e70" ),
    uint64( "0x27b70a8546d22ffc" ), uint64( "0x2e1b21385c26c926" ), 
    uint64( "0x4d2c6dfc5ac42aed" ), uint64( "0x53380d139d95b3df" ),
    uint64( "0x650a73548baf63de" ), uint64( "0x766a0abb3c77b2a8" ), 
    uint64( "0x81c2c92e47edaee6" ), uint64( "0x92722c851482353b" ),
    uint64( "0xa2bfe8a14cf10364" ), uint64( "0xa81a664bbc423001" ), 
    uint64( "0xc24b8b70d0f89791" ), uint64( "0xc76c51a30654be30" ),
    uint64( "0xd192e819d6ef5218" ), uint64( "0xd69906245565a910" ), 
    uint64( "0xf40e35855771202a" ), uint64( "0x106aa07032bbd1b8" ),
    uint64( "0x19a4c116b8d2d0c8" ), uint64( "0x1e376c085141ab53" ), 
    uint64( "0x2748774cdf8eeb99" ), uint64( "0x34b0bcb5e19b48a8" ),
    uint64( "0x391c0cb3c5c95a63" ), uint64( "0x4ed8aa4ae3418acb" ), 
    uint64( "0x5b9cca4f7763e373" ), uint64( "0x682e6ff3d6b2b8a3" ),
    uint64( "0x748f82ee5defb2fc" ), uint64( "0x78a5636f43172f60" ), 
    uint64( "0x84c87814a1f0ab72" ), uint64( "0x8cc702081a6439ec" ),
    uint64( "0x90befffa23631e28" ), uint64( "0xa4506cebde82bde9" ), 
    uint64( "0xbef9a3f7b2c67915" ), uint64( "0xc67178f2e372532b" ),
    uint64( "0xca273eceea26619c" ), uint64( "0xd186b8c721c0c207" ), 
    uint64( "0xeada7dd6cde0eb1e" ), uint64( "0xf57d4f7fee6ed178" ),
    uint64( "0x06f067aa72176fba" ), uint64( "0x0a637dc5a2c898a6" ), 
    uint64( "0x113f9804bef90dae" ), uint64( "0x1b710b35131c471b" ),
    uint64( "0x28db77f523047d84" ), uint64( "0x32caab7b40c72493" ), 
    uint64( "0x3c9ebe0a15c9bebc" ), uint64( "0x431d67c49c100d4c" ),
    uint64( "0x4cc5d4becb3e42b6" ), uint64( "0x597f299cfc657e2a" ), 
    uint64( "0x5fcb6fab3ad6faec" ), uint64( "0x6c44198c4a475817" ),
]);

/**
 * getulates sha2-512 (64bytes) hash of a list of uint8 numbers.
 * Result is also a list of uint8 number.
 * @example 
 * bytesToHex(sha2_512_sync([0x61, 0x62, 0x63])) => "ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f"
 * @example 
 * bytesToHex(sha2_512_sync([])) => "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"
 * @param {number[]} bytes - list of uint8 numbers
 * @returns {number[]} - list of uint8 numbers
 */
export function sha2_512_sync( bytes: byte[] | Uint8Array ): Uint8Array
{
    if(!( bytes instanceof Uint8Array )) bytes = new Uint8Array( bytes );
    return sha512( bytes );
}