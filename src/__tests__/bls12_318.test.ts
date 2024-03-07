import { fromHex, toHex } from "@harmoniclabs/uint8array-utils"
import { BlsG1, BlsG2, bls12_381_G1_uncompress, bls12_381_G2_uncompress } from "../bls12_318";
import { parseMask } from "../noble";

describe("bls12_318", () => {
    // some conformance tests from IntersectMBO/plutus
    // https://github.com/IntersectMBO/plutus/tree/master/plutus-conformance/test-cases/uplc/evaluation/builtin/semantics

    describe("bls12_381_G1_uncompress (fromBytes)", () => {

        test("bad-zero-1", () => {
            // -- This has the infinity bit set but not the compression bit, and so is invalid.
            const bytes = fromHex("400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

            expect( bytes.length ).toEqual( 48 );
            expect(() => {
                bls12_381_G1_uncompress( bytes )
            }).toThrow();
        });

        test("bad-zero-2", () => {
            // -- This is the zero point of G1, but with the sign bit set.  It should fail to uncompress.
            const bytes = fromHex("e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

            expect( bytes.length ).toEqual( 48 );
            expect(() => {
                bls12_381_G1_uncompress( bytes )
            }).toThrow();
        });

        test("bad-zero-3", () => {
            // -- This is the zero point of G1, but with a random bit set in the body.  It
            // -- should fail to uncompress.                                     v this little boi
            const bytes = fromHex("c00000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000");

            expect( bytes.length ).toEqual( 48 );
            expect(() => {
                bls12_381_G1_uncompress( bytes )
            }).toThrow();
        });
        
        test("off-curve", () => {
            // -- This contains a value which is not the x-coordinate of a point on the E1 curve.
            const bytes = fromHex("a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003");

            expect( bytes.length ).toEqual( 48 );
            expect(() => {
                bls12_381_G1_uncompress( bytes )
            }).toThrow();
        });

        test("on-curve-bit3-clear", () => {
            // -- This value was obtained by hashing 0x0102030405 to G1 but has had the
            // -- compression bit cleared, so uncompression should fail.
            // (comment says uncompression should fail but expected result in the same repo shows it succeeds)
            // this is because compression bit is set
            const bytes = fromHex("81e9a0c68985059bd25a5ef05b351ca22f7d7c19e37928583ae12a1f4939440ff754cfd85b23df4a54f66c7089db6deb");

            expect( bytes.length ).toEqual( 48 );

            let pnt: BlsG1;
            expect(() => {
                pnt = bls12_381_G1_uncompress( bytes )
            }).not.toThrow();
            expect( pnt!.toRawBytes() ).toEqual( bytes )
        });

        test("on-curve-bit3-clear (adjusted)", () => {
            // -- This value was obtained by hashing 0x0102030405 to G1 but has had the
            // -- compression bit cleared, so uncompression should fail.
            // same test as above but as intended
            const bytes = fromHex("01e9a0c68985059bd25a5ef05b351ca22f7d7c19e37928583ae12a1f4939440ff754cfd85b23df4a54f66c7089db6deb");

            expect( bytes.length ).toEqual( 48 );
            expect(() => {
                bls12_381_G1_uncompress( bytes )
            }).toThrow();
        });

        test("on-curve-bit3-set", () => {
            // -- This value was obtained by hashing 0x0102030405 to G1 and has the compression
            // -- bit set, so uncompression should succeed.
            // same test as above but as intended
            const bytes = fromHex("a1e9a0c68985059bd25a5ef05b351ca22f7d7c19e37928583ae12a1f4939440ff754cfd85b23df4a54f66c7089db6deb");

            expect( bytes.length ).toEqual( 48 );
            let pnt: BlsG1;
            expect(() => {
                pnt = bls12_381_G1_uncompress( bytes )
            }).not.toThrow();
            expect( pnt!.toRawBytes() ).toEqual( bytes );
        });

        test("on-curve-serialised-not-compressed", () => {
            // -- This checks that the uncompression function fails on a valid *serialised* G1
            // -- point (obtained by hashing 0x0102030405 onto G1).  The deserialisation
            // -- function in the blst library can handle both serialised and compressed
            // -- points, but we should fail on the former.
            const bytes = fromHex("01e9a0c68985059bd25a5ef05b351ca22f7d7c19e37928583ae12a1f4939440ff754cfd85b23df4a54f66c7089db6deb12ae8470d881eb628dfcf4bb083fb8a6968d907a0c265f6d06e04b05a19418d395d3e0c115430f88e7156822904ef5bf");

            expect( bytes.length ).toEqual( 96 );
            expect(() => {
                bls12_381_G1_uncompress( bytes )
            }).toThrow();
        });

        test("out-of-group", () => {
            // -- This contains a value which is the x-coordinate of a point which lies on the
            // -- E1 curve but not the G1 subgroup.
            const bytes = fromHex("a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005");

            expect( bytes.length ).toEqual( 48 );
            expect(() => {
                bls12_381_G1_uncompress( bytes )
            }).toThrow();
        });

        test("too-long", () => {
            // -- The bytestring is the compressed version of the G1 zero point, but extended
            // -- to 49 bytes.
            const bytes = fromHex("c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

            expect(() => {
                bls12_381_G1_uncompress( bytes )
            }).toThrow();
        });

        test("too-short", () => {
            // -- The bytestring is the compressed version of the G1 zero point, but extended
            // -- to 49 bytes.
            const bytes = fromHex("c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

            expect(() => {
                bls12_381_G1_uncompress( bytes )
            }).toThrow();
        });

        test("zero", () => {
            const bytes = fromHex("c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

            let pnt: BlsG1;
            expect(() => {
                pnt = bls12_381_G1_uncompress( bytes )
            }).not.toThrow()
            expect( pnt!.toRawBytes() ).toEqual( bytes );
        });
    });

    describe("bls12_381_G2_uncompress (fromBytes)", () => {

        test("bad-zero-1", () => {
            // -- This has the infinity bit set but not the compression bit, and so is invalid.
            const bytes = fromHex("400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

            expect( bytes.length ).toEqual( 96 );
            expect(() => {
                bls12_381_G2_uncompress( bytes )
            }).toThrow();
        });

        test("bad-zero-2", () => {
            // -- This is the zero point of G2, but with the sign bit set.  It should fail to uncompress.
            const bytes = fromHex("e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

            expect( bytes.length ).toEqual( 96 );
            expect(() => {
                bls12_381_G2_uncompress( bytes )
            }).toThrow();
        });

        test("bad-zero-3", () => {
            // -- This is the zero point of G1, but with a random bit set in the body.  It
            // -- should fail to uncompress.                                     v this little boi
            const bytes = fromHex("c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000");

            expect( bytes.length ).toEqual( 96 );
            expect(() => {
                bls12_381_G2_uncompress( bytes )
            }).toThrow();
        });
        
        test("off-curve", () => {
            // -- This contains a value which is not the x-coordinate of a point on the E1 curve.
            const bytes = fromHex("a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003");

            expect(() => {
                bls12_381_G2_uncompress( bytes )
            }).toThrow();
        });

        test("on-curve-bit3-clear", () => {
            // -- This value was obtained by hashing 0x0102030405 to G1 but has had the
            // -- compression bit cleared, so uncompression should fail.
            // (comment says uncompression should fail but expected result in the same repo shows it succeeds)
            // this is because compression bit is set
            const bytes = fromHex("88138ebea766d4d1aa64dd3b5826244c32ea3fe9351f9c8d584203716dae151d14bb5d06e245c24877955c79287682ba082d077bbb2afdb1ad1d48d18e2f0c56b001bce207801adfa9fd451fc59d56f0433b02f921ba5a272c58c06536291d07");

            let pnt: BlsG2;
            expect(() => {
                pnt = bls12_381_G2_uncompress( bytes )
            }).not.toThrow();
            expect( pnt!.toRawBytes() ).toEqual( bytes )
        });

        test("on-curve-bit3-clear (adjusted)", () => {
            // -- This value was obtained by hashing 0x0102030405 to G1 but has had the
            // -- compression bit cleared, so uncompression should fail.
            // same test as above but as intended
            const bytes = fromHex("08138ebea766d4d1aa64dd3b5826244c32ea3fe9351f9c8d584203716dae151d14bb5d06e245c24877955c79287682ba082d077bbb2afdb1ad1d48d18e2f0c56b001bce207801adfa9fd451fc59d56f0433b02f921ba5a272c58c06536291d07");

            expect(() => {
                bls12_381_G2_uncompress( bytes )
            }).toThrow();
        });

        test("on-curve-bit3-set", () => {
            // -- This value was obtained by hashing 0x0102030405 to G1 and has the compression
            // -- bit set, so uncompression should succeed.
            // same test as above but as intended
            const bytes = fromHex("a8138ebea766d4d1aa64dd3b5826244c32ea3fe9351f9c8d584203716dae151d14bb5d06e245c24877955c79287682ba082d077bbb2afdb1ad1d48d18e2f0c56b001bce207801adfa9fd451fc59d56f0433b02f921ba5a272c58c06536291d07");

            let pnt: BlsG2;
            expect(() => {
                pnt = bls12_381_G2_uncompress( bytes )
            }).not.toThrow();
            expect( pnt!.toRawBytes() ).toEqual( bytes );
        });

        test("on-curve-serialised-not-compressed", () => {
            // -- This checks that the uncompression function fails on a valid *serialised* G1
            // -- point (obtained by hashing 0x0102030405 onto G1).  The deserialisation
            // -- function in the blst library can handle both serialised and compressed
            // -- points, but we should fail on the former.
            const bytes = fromHex("08138ebea766d4d1aa64dd3b5826244c32ea3fe9351f9c8d584203716dae151d14bb5d06e245c24877955c79287682ba082d077bbb2afdb1ad1d48d18e2f0c56b001bce207801adfa9fd451fc59d56f0433b02f921ba5a272c58c06536291d071676b275e27060b26dd91aac0a1feb56d1c1de7c323f486e48d54eae0c3c8f4caa45faad589c5d180ac0830dcdb3ecd8126c9c5db86cdf7129cf18582013d267a7c2827a901ef61ab58e7ef150219441abc57671eb39009f6bb166bcbade700d");

            expect(() => {
                bls12_381_G2_uncompress( bytes )
            }).toThrow();
        });

        test("out-of-group", () => {
            // -- This contains a value which is the x-coordinate of a point which lies on the
            // -- E2 curve but not the G2 subgroup.
            const bytes = fromHex("a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005");

            expect(() => {
                bls12_381_G2_uncompress( bytes )
            }).toThrow();
        });

        test("too-long", () => {
            // -- The bytestring is the compressed version of the G1 zero point, but extended
            // -- to 49 bytes.
            const bytes = fromHex("c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

            expect(() => {
                bls12_381_G2_uncompress( bytes )
            }).toThrow();
        });

        test("too-short", () => {
            // -- The bytestring is the compressed version of the G1 zero point, but extended
            // -- to 49 bytes.
            const bytes = fromHex("c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

            expect(() => {
                bls12_381_G2_uncompress( bytes )
            }).toThrow();
        });

        test("zero", () => {
            const bytes = fromHex("c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");

            let pnt: BlsG2;
            expect(() => {
                pnt = bls12_381_G2_uncompress( bytes )
            }).not.toThrow()
            expect( pnt!.toRawBytes() ).toEqual( bytes );
        });
    });
})