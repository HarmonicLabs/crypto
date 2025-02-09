import { fromHex, toHex, uint8ArrayEq } from "@harmoniclabs/uint8array-utils";
import { hasGlobalWebCrypto } from "../hasGlobalWebCrypto";
import { sha2_256_sync } from "../sha2_256";
import { sha2_512_sync } from "../sha2_512";

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

    describe.skip("sha2_256", () => {
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
        
        testMany([
            new Uint8Array( 0 ),
            new Uint8Array( 10 ),
            new Uint8Array( fromHex("deadbeef") ),
            new Uint8Array( fromHex("aa".repeat(20)) ),
            new Uint8Array( fromHex("deadbeef".repeat(3)) ),
            new Uint8Array( fromHex("deadbeef".repeat(42)) ),
            new Uint8Array( fromHex("deadbeef".repeat(2)) ),
            new Uint8Array( fromHex("deadbeef".repeat(6)) ),
            new Uint8Array( fromHex("deadbeef".repeat(10)) ),
            new Uint8Array( fromHex("deadbeef".repeat(17)) ),
            new Uint8Array( fromHex("deadbeef".repeat(22)) ),
            new Uint8Array( fromHex("deadbeef".repeat(27)) ),
            new Uint8Array( fromHex("deadbeef".repeat(39)) ),
            new Uint8Array( fromHex("deadbeef".repeat(42)) ),
            new Uint8Array( fromHex("deadbeef".repeat(50)) ),
            new Uint8Array( fromHex("deadbeef".repeat(60)) ),
            new Uint8Array( fromHex("deadbeef".repeat(69)) ),
        ]);

    })

    describe("sha2_512", () => {
        let __hasNativeSupport = hasGlobalWebCrypto && typeof globalThis.crypto.subtle.digest === "function";

        if( !__hasNativeSupport )
        {
            // mock test
            test("no globalThis.crypto.subtle.digest", () => {
                expect( hasGlobalWebCrypto ).toBe( false );
            });
            return;
        }

        const NATIVE_ALGO = "SHA-512";
        const digest = __hasNativeSupport ?
            globalThis.crypto.subtle.digest.bind(globalThis.crypto.subtle) :
            () => Promise.resolve( new ArrayBuffer(0) );

        function nativeSha2_512( data: Uint8Array | ArrayBuffer | DataView ): Promise<ArrayBuffer>
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
                const nativeRestult = new Uint8Array( await nativeSha2_512( data ) ?? [] );
                end = performance.now();
                avg += end - start;

                start = performance.now();
                const result = sha2_512_sync( data );
                end = performance.now();
                avg2 += end - start;

                n++;

                return [nativeRestult, result];
            } catch { return [ new Uint8Array(2), new Uint8Array(3) ]; }
        }

        function testData( data: Uint8Array )
        {
            test(`nativesha2_256_sync ${toHex( data )}`, async () => {
                const [nativeRestult, result] = await _test( data );
                expect( toHex( result ) ).toEqual( toHex( nativeRestult ) );
            });
        }

        function testMany( datas: Uint8Array[] )
        {
            test("test many", async () => {
                for( let data of datas )
                {
                    const [nativeRestult,result] = await _test( data );
                    expect( toHex( result ) ).toEqual( toHex( nativeRestult ) );
                    // await new Promise( resolve => setTimeout( resolve, 1000 ) );
                }
                avg /= n;
                avg2 /= n;
                console.log({ avg, avg2 });
                console.log( avg * 100 / avg2 );
            })
        }

        testMany([
            new Uint8Array( 0 ),
            new Uint8Array( 10 ),
            new Uint8Array( fromHex("deadbeef") ),
            new Uint8Array( fromHex("aa".repeat(20)) ),
            new Uint8Array( fromHex("deadbeef".repeat(3)) ),
            new Uint8Array( fromHex("deadbeef".repeat(42)) ),
            new Uint8Array( fromHex("deadbeef".repeat(2)) ),
            new Uint8Array( fromHex("deadbeef".repeat(6)) ),
            new Uint8Array( fromHex("deadbeef".repeat(10)) ),
            new Uint8Array( fromHex("deadbeef".repeat(17)) ),
            new Uint8Array( fromHex("deadbeef".repeat(22)) ),
            new Uint8Array( fromHex("deadbeef".repeat(27)) ),
            new Uint8Array( fromHex("deadbeef".repeat(39)) ),
            new Uint8Array( fromHex("deadbeef".repeat(42)) ),
            new Uint8Array( fromHex("deadbeef".repeat(50)) ),
            new Uint8Array( fromHex("deadbeef".repeat(60)) ),
            new Uint8Array( fromHex("deadbeef".repeat(69)) ),
        ]);

    })
})