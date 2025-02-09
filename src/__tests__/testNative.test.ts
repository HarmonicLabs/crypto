import { fromHex, toHex, uint8ArrayEq } from "@harmoniclabs/uint8array-utils";
import { hasGlobalWebCrypto } from "../hasGlobalWebCrypto";
import { sha2_256_sync } from "../sha2_256";

jest.setTimeout( 1000 * 60 );

describe("test native", () => {

    if( !hasGlobalWebCrypto )
    {
        // mock test
        test("no globalThis.crypto.subtle", () => {
            expect( hasGlobalWebCrypto ).toBe( false );
        });
        return;
    }

    describe("sha2_256_sync", () => {
        let __hasNativeSupport = hasGlobalWebCrypto && typeof globalThis.crypto.subtle.digest === "function";

        if( !__hasNativeSupport )
        {
            // mock test
            test("no globalThis.crypto.subtle.digest", () => {
                expect( hasGlobalWebCrypto ).toBe( false );
            });
            return;
        }

        const NATIVE_ALGO = "SHA-256";
        const digest = __hasNativeSupport ?
            globalThis.crypto.subtle.digest.bind(globalThis.crypto.subtle) :
            () => Promise.resolve( new ArrayBuffer(0) );

        function nativesha2_256_sync( data: Uint8Array | ArrayBuffer | DataView ): Promise<ArrayBuffer>
        {
            return digest( NATIVE_ALGO, data );
        }

        let start = 0;
        let end = 0;
        let avg = 0;
        let avg2 = 0;
        let n = 0;
        async function _test( data: Uint8Array )
        {
            try {
                start = performance.now();
                const nativeRestult = new Uint8Array( await nativesha2_256_sync( data ) ?? [] );
                end = performance.now();
                avg += end - start;

                start = performance.now();
                const result = sha2_256_sync( data );
                end = performance.now();
                avg2 += end - start;

                n++;

                return uint8ArrayEq( nativeRestult, result );
            } catch { return false; }
        }

        function testData( data: Uint8Array )
        {
            test(`nativesha2_256_sync ${toHex( data )}`, async () => {
                expect( await _test( data ) ).toBe( true );
            });
        }

        function testMany( datas: Uint8Array[] )
        {
            test("test many", async () => {
                for( let data of datas )
                {
                    expect( await _test( data ) ).toBe( true );
                    // await new Promise( resolve => setTimeout( resolve, 1000 ) );
                }
                avg /= n;
                avg2 /= n;
                console.log({ avg, avg2 });
                console.log( avg * 100 / avg2 );
            })
        }
        
        // testData( new Uint8Array( 10 ) );
        // testData( new Uint8Array( fromHex("deadbeef") ) );
        // testData( new Uint8Array( fromHex("aa".repeat(20)) ) );
        // testData( new Uint8Array( fromHex("deadbeef".repeat(3)) ) );
        // testData( new Uint8Array( 0 ) );

        testMany([
            new Uint8Array( 10 ),
            new Uint8Array( fromHex("deadbeef") ),
            new Uint8Array( fromHex("aa".repeat(20)) ),
            new Uint8Array( fromHex("deadbeef".repeat(3)) ),
            new Uint8Array( 0 )
        ]);

    })
})