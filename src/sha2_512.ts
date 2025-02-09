import { uint8ArrayEq } from "@harmoniclabs/uint8array-utils";
import { hasGlobalWebCrypto } from "./hasGlobalWebCrypto";
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
export function _sha2_512_sync_pad( src: number[] ): number[]
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
    dst.push( ((nBits >> 24) & 0xff) );
    dst.push( ((nBits >> 16) & 0xff) );
    dst.push( ((nBits >> 8)  & 0xff) );
    dst.push( ((nBits >> 0)  & 0xff) );
    
    return dst;
}

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
export function sha2_512_sync( bytes: number[] | Uint8Array | ArrayBuffer ): Uint8Array
{
    if(!( bytes instanceof Uint8Array )) bytes = new Uint8Array( bytes );
    if(   bytes instanceof ArrayBuffer ) bytes = new Uint8Array( bytes );
    return sha512( bytes as Uint8Array );
}

function wrapped_sha2_512_sync( bytes: Uint8Array | ArrayBuffer ): Promise<Uint8Array>
{
    return Promise.resolve( sha2_512_sync( bytes ) );
}

export const sha2_512: typeof nativeSha2_512 = __hasNativeSupport ? nativeSha2_512 : wrapped_sha2_512_sync;