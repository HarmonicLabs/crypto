import { hasGlobalWebCrypto } from "./hasGlobalWebCrypto";
import { sha512 } from "./noble/sha512";

let __hasNativeSupport = hasGlobalWebCrypto && typeof globalThis.crypto.subtle.digest === "function";
const NATIVE_ALGO = "SHA-512";
const digest = __hasNativeSupport ?
    globalThis.crypto.subtle.digest.bind(globalThis.crypto.subtle) :
    () => Promise.resolve( new ArrayBuffer(0) );

async function _test_nativeSha2_512( data: Uint8Array | ArrayBuffer ): Promise<Uint8Array>
{
    // await ensureNativeSupport();
    // if( !__hasNativeSupport ) return sha2_512_sync( data );
    return new Uint8Array( await digest( NATIVE_ALGO, data ) );
}
async function nativeSha2_512( data: Uint8Array | ArrayBuffer ): Promise<Uint8Array>
{
    await ensureNativeSupport();
    if( !__hasNativeSupport ) return sha2_512_sync( data );
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
        const nativeResult = new Uint8Array( await _test_nativeSha2_512( data ) );
        end = performance.now();
        const nativeTime = end - start;

        start = performance.now();
        const result = sha2_512_sync( data );
        end = performance.now();
        const jsTime = end - start;

        __hasNativeSupport = __hasNativeSupport && uint8ArrayEq( nativeResult, result );

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
            ).map( data => _test( data, eqU8Arr ) )
        );
        if( !__hasNativeSupport ) return;
        let sum = bench.reduce( (acc, [native, js]) => {
            acc[0] += native;
            acc[1] += js;
            return acc;
        }, [ 0, 0 ] );
        __hasNativeSupport = __hasNativeSupport && sum[0] < sum[1];
    } catch { __hasNativeSupport = false; }
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
export function sha2_512_sync( bytes: number[] | Uint8Array | ArrayBuffer ): Uint8Array & { length: 64 }
{
    if(!( bytes instanceof Uint8Array )) bytes = new Uint8Array( bytes );
    if(   bytes instanceof ArrayBuffer ) bytes = new Uint8Array( bytes );
    return sha512( bytes as Uint8Array ) as (Uint8Array & { length: 64 });
}

function wrapped_sha2_512_sync( bytes: Uint8Array | ArrayBuffer ): Promise<Uint8Array>
{
    return Promise.resolve( sha2_512_sync( bytes ) );
}

export const sha2_512: typeof nativeSha2_512 = __hasNativeSupport ? nativeSha2_512 : wrapped_sha2_512_sync;