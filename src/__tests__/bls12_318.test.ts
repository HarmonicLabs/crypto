import { fromHex } from "@harmoniclabs/uint8array-utils"
import { BlsG1, BlsG2, bls12_381_G1_add, bls12_381_G1_compress, bls12_381_G1_equal, bls12_381_G1_hashToGroup, bls12_381_G1_neg, bls12_381_G1_scalarMul, bls12_381_G1_uncompress, bls12_381_G2_add, bls12_381_G2_compress, bls12_381_G2_equal, bls12_381_G2_hashToGroup, bls12_381_G2_neg, bls12_381_G2_scalarMul, bls12_381_G2_uncompress, bls12_381_finalVerify, bls12_381_millerLoop, bls12_381_mulMlResult } from "../bls12_318";

describe("bls12_318", () => {
    // some conformance tests from IntersectMBO/plutus
    // https://github.com/IntersectMBO/plutus/tree/master/plutus-conformance/test-cases/uplc/evaluation/builtin/semantics

    const g1_zero = bls12_381_G1_uncompress( fromHex("c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000") );
    const g2_zero = bls12_381_G2_uncompress( fromHex("c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000") );

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

    describe("bls12_381_G1_compress", () => {

        test("compress", () => {
            const bytes = fromHex("950dfd33da2682260c76038dfb8bad6e84ae9d599a3c151815945ac1e6ef6b1027cd917f3907479d20d636ce437a41f5");

            const pnt = bls12_381_G1_uncompress( bytes );

            expect( bls12_381_G1_compress( pnt ) ).toEqual( bytes );
        });

    });

    describe("bls12_381_G2_compress", () => {

        test("compress", () => {
            const bytes = fromHex("b0629fa1158c2d23a10413fe91d381a84d25e31d041cd0377d25828498fd02011b35893938ced97535395e4815201e67108bcd4665e0db25d602d76fa791fab706c54abf5e1a9e44b4ac1e6badf3d2ac0328f5e30be341677c8bac5dda7682f1");

            const pnt = bls12_381_G2_uncompress( bytes );

            expect( bls12_381_G2_compress( pnt ) ).toEqual( bytes );
        });

    });

    describe("bls12_381_G1_equal", () => {

        test("equal-false", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_uncompress( fromHex("950dfd33da2682260c76038dfb8bad6e84ae9d599a3c151815945ac1e6ef6b1027cd917f3907479d20d636ce437a41f5") ),
                    bls12_381_G1_uncompress( fromHex("abd61864f519748032551e42e0ac417fd828f079454e3e3c9891c5c29ed7f10bdecc046854e3931cb7002779bd76d71f") ),
                )
            ).toEqual( false )
        });

        test("equal-true", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_uncompress( fromHex("abd61864f519748032551e42e0ac417fd828f079454e3e3c9891c5c29ed7f10bdecc046854e3931cb7002779bd76d71f") ),
                    bls12_381_G1_uncompress( fromHex("abd61864f519748032551e42e0ac417fd828f079454e3e3c9891c5c29ed7f10bdecc046854e3931cb7002779bd76d71f") ),
                )
            ).toEqual( true )
        });
    });

    describe("bls12_381_G2_equal", () => {

        test("equal-false", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_uncompress( fromHex("b0629fa1158c2d23a10413fe91d381a84d25e31d041cd0377d25828498fd02011b35893938ced97535395e4815201e67108bcd4665e0db25d602d76fa791fab706c54abf5e1a9e44b4ac1e6badf3d2ac0328f5e30be341677c8bac5dda7682f1") ),
                    bls12_381_G2_uncompress( fromHex("8310bc97fc7ad9b1616e51226c6a521b9d7fdf03f7299833e6a208ae0399fec76045a43ceef846e0958d0cdf05cf2b1f00460ee6edd2778b413eb7c272bc5b94d12b910f8ac4eb1b55e50a93644714787417bc462349c5e0f6f357b9ac32262a") ),
                )
            ).toEqual( false )
        });

        test("equal-true", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_uncompress( fromHex("b0629fa1158c2d23a10413fe91d381a84d25e31d041cd0377d25828498fd02011b35893938ced97535395e4815201e67108bcd4665e0db25d602d76fa791fab706c54abf5e1a9e44b4ac1e6badf3d2ac0328f5e30be341677c8bac5dda7682f1") ),
                    bls12_381_G2_uncompress( fromHex("b0629fa1158c2d23a10413fe91d381a84d25e31d041cd0377d25828498fd02011b35893938ced97535395e4815201e67108bcd4665e0db25d602d76fa791fab706c54abf5e1a9e44b4ac1e6badf3d2ac0328f5e30be341677c8bac5dda7682f1") ),
                )
            ).toEqual( true )
        });
    });

    describe("bls12_381_G1_add", () => {

        const a = bls12_381_G1_uncompress( fromHex("abd61864f519748032551e42e0ac417fd828f079454e3e3c9891c5c29ed7f10bdecc046854e3931cb7002779bd76d71f") );
        const b = bls12_381_G1_uncompress( fromHex("950dfd33da2682260c76038dfb8bad6e84ae9d599a3c151815945ac1e6ef6b1027cd917f3907479d20d636ce437a41f5") );
        const c = bls12_381_G1_uncompress( fromHex("b962fd0cc81048e0cf7557bf3e4b6edc5ab4bfb3dc87f83af428b6300727b139c404ab159bdf2eaea3f649903421537f") );

        test("add-associative", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_add(
                        a,
                        bls12_381_G1_add( b, c )
                    ),
                    bls12_381_G1_add(
                        bls12_381_G1_add( a, b ),
                        c
                    )
                )
            ).toBe( true );
        });

        test("add-commutative", () => {
            
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_add( a, b ),
                    bls12_381_G1_add( b, a )
                )
            ).toBe( true );
        });

        test("add-zero", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_add(
                        a,
                        bls12_381_G1_uncompress( fromHex("c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000") )
                    ),
                    a
                )
            ).toEqual( true )
        });

        test("add", () => {
            /*
            using `expect( add ).toEqual( expected )

            fails because of different internal reprensentation

            but the result is the same

            equal method works, and converting to compressed and then using `toEqual` works too
            */
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_add( a, b ),
                    bls12_381_G1_uncompress( fromHex("a4870e983a149bb1e7cc70fde907a2aa52302833bce4d62f679819022924e9caab52e3631d376d36d9692664b4cfbc22") )
                )
            ).toEqual( true )
        });

    });

    describe("bls12_381_G2_add", () => {

        const a = bls12_381_G2_uncompress( fromHex("b0629fa1158c2d23a10413fe91d381a84d25e31d041cd0377d25828498fd02011b35893938ced97535395e4815201e67108bcd4665e0db25d602d76fa791fab706c54abf5e1a9e44b4ac1e6badf3d2ac0328f5e30be341677c8bac5dda7682f1") );
        const b = bls12_381_G2_uncompress( fromHex("8310bc97fc7ad9b1616e51226c6a521b9d7fdf03f7299833e6a208ae0399fec76045a43ceef846e0958d0cdf05cf2b1f00460ee6edd2778b413eb7c272bc5b94d12b910f8ac4eb1b55e50a93644714787417bc462349c5e0f6f357b9ac32262a") );
        const c = bls12_381_G2_uncompress( fromHex("a69d86e011cf692e51ac2031201c27aa06a8f902068fcb98f284d9d925c6502bb0821ba4f49ece3d1db06cd9556f690a117e51df792f7c1d1f5f22b91c3155e9ef2bc43f24ab0a62d8606b3262a117c5635326ae8c9ad897980db6bf4849f903") );

        test("add-associative", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_add(
                        a,
                        bls12_381_G2_add( b, c )
                    ),
                    bls12_381_G2_add(
                        bls12_381_G2_add( a, b ),
                        c
                    )
                )
            ).toBe( true );
        });

        test("add-commutative", () => {
            
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_add( a, b ),
                    bls12_381_G2_add( b, a )
                )
            ).toBe( true );
        });

        test("add-zero", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_add(
                        a,
                        bls12_381_G2_uncompress( fromHex("c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000") )
                    ),
                    a
                )
            ).toEqual( true )
        });

        test("add", () => {
            /*
            using `expect( add ).toEqual( expected )

            fails because of different internal reprensentation

            but the result is the same

            equal method works, and converting to compressed and then using `toEqual` works too
            */
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_add( a, b ),
                    bls12_381_G2_uncompress( fromHex("b5cf6c76309d98a38950948ce6768309e2e92561762734caaaab65077e1279faff6bba6f9f21bbb3b3fa4ee55aa1332d0f4b3b9a6fa4848e0bf7ae0d38fdc1f1c1908b953ee2b47b88a595b10431acab16522d12a785e27692fc7e0ffa33be07") )
                )
            ).toEqual( true )
        });

    });

    describe("bls12_381_G1_neg", () => {

        const a = bls12_381_G1_uncompress( fromHex("950dfd33da2682260c76038dfb8bad6e84ae9d599a3c151815945ac1e6ef6b1027cd917f3907479d20d636ce437a41f5") );
        const neg_a = bls12_381_G1_neg( a );

        test("add-neg", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_add( a, neg_a ),
                    g1_zero
                )
            ).toBe( true );
        });

        test("neg-zero", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_neg( g1_zero ),
                    g1_zero
                )
            ).toBe( true )
        });

        test("neg", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_neg(
                        bls12_381_G1_uncompress( fromHex("abd61864f519748032551e42e0ac417fd828f079454e3e3c9891c5c29ed7f10bdecc046854e3931cb7002779bd76d71f") )
                    ),
                    bls12_381_G1_uncompress( fromHex("8bd61864f519748032551e42e0ac417fd828f079454e3e3c9891c5c29ed7f10bdecc046854e3931cb7002779bd76d71f") )
                )
            ).toBe( true );
        });

    });

    describe("bls12_381_G2_neg", () => {

        const a = bls12_381_G2_uncompress( fromHex("b0629fa1158c2d23a10413fe91d381a84d25e31d041cd0377d25828498fd02011b35893938ced97535395e4815201e67108bcd4665e0db25d602d76fa791fab706c54abf5e1a9e44b4ac1e6badf3d2ac0328f5e30be341677c8bac5dda7682f1") );
        const neg_a = bls12_381_G2_neg( a );

        test("add-neg", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_add( a, neg_a ),
                    g2_zero
                )
            ).toBe( true );
        });

        test("neg-zero", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_neg( g2_zero ),
                    g2_zero
                )
            ).toBe( true )
        });

        test("neg", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_neg(
                        bls12_381_G2_uncompress( fromHex("8310bc97fc7ad9b1616e51226c6a521b9d7fdf03f7299833e6a208ae0399fec76045a43ceef846e0958d0cdf05cf2b1f00460ee6edd2778b413eb7c272bc5b94d12b910f8ac4eb1b55e50a93644714787417bc462349c5e0f6f357b9ac32262a") )
                    ),
                    bls12_381_G2_uncompress( fromHex("a310bc97fc7ad9b1616e51226c6a521b9d7fdf03f7299833e6a208ae0399fec76045a43ceef846e0958d0cdf05cf2b1f00460ee6edd2778b413eb7c272bc5b94d12b910f8ac4eb1b55e50a93644714787417bc462349c5e0f6f357b9ac32262a") )
                )
            ).toBe( true );
        });

    });

    describe("bls12_381_G1_scalarMul", () => {

        const a        = bls12_381_G1_uncompress( fromHex("950dfd33da2682260c76038dfb8bad6e84ae9d599a3c151815945ac1e6ef6b1027cd917f3907479d20d636ce437a41f5") );
        const b        = bls12_381_G1_uncompress( fromHex("abd61864f519748032551e42e0ac417fd828f079454e3e3c9891c5c29ed7f10bdecc046854e3931cb7002779bd76d71f") );
        const a_b_2157 = bls12_381_G1_uncompress( fromHex("8cc84679c6c870408169a656c245a2ab9ccc46598769b19f07711c18624284d1bfa33667cac7b99a12e058abfd14ef88") );
        const b_44     = bls12_381_G1_uncompress( fromHex("8d9e9f6adcea14e8d38221bb3cfe4afdcc59b86e9d3b0093c0ef8252d5d90dfc5d73c9e9d352b9a54b46d35e7ff4d58c") );
        const neg_b_44 = bls12_381_G1_uncompress( fromHex("ad9e9f6adcea14e8d38221bb3cfe4afdcc59b86e9d3b0093c0ef8252d5d90dfc5d73c9e9d352b9a54b46d35e7ff4d58c") );

        test("addmul", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_add(
                        bls12_381_G1_scalarMul( 2157, a ),
                        bls12_381_G1_scalarMul( 2157, b )
                    ),
                    a_b_2157
                )
            ).toBe( true );
        });

        test("mul0", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_scalarMul( 0, b ),
                    g1_zero
                )
            ).toBe( true )
        });

        test("mul1", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_scalarMul( 1, b ),
                    b
                )
            ).toBe( true )
        });

        test("mul19+25", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_add(
                        bls12_381_G1_scalarMul( 19, b ),
                        bls12_381_G1_scalarMul( 25, b )
                    ),
                    b_44
                )
            ).toBe( true );
        });

        test("mul44", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_scalarMul( 44, b ),
                    b_44
                )
            ).toBe( true )
        });

        test("mul4x11", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_scalarMul( 4, bls12_381_G1_scalarMul( 11, b ) ),
                    b_44
                )
            ).toBe( true )
        });

        test("muladd", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_scalarMul(
                        2157,
                        bls12_381_G1_add( a, b )
                    ),
                    a_b_2157
                )
            ).toBe( true )
        });

        test("mulneg1", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_scalarMul( -1, b ),
                    bls12_381_G1_uncompress( fromHex("8bd61864f519748032551e42e0ac417fd828f079454e3e3c9891c5c29ed7f10bdecc046854e3931cb7002779bd76d71f") )
                )
            ).toBe( true )
        });

        test("mulneg44", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_scalarMul( -44, b ),
                    neg_b_44
                )
            ).toBe( true )
        });

        test("mulperiodic1", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_scalarMul(
                        BigInt("52435875175126190479447740508185965837690552500527637822603658699938581184513"),
                        b
                    ),
                    g1_zero
                )
            ).toBe( true )
        });

        test("mulperiodic2", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_scalarMul(
                        BigInt("52435875175126190479447740508185965837690552500527637822603658699938581184513") + BigInt(123),
                        b
                    ),
                    bls12_381_G1_scalarMul(
                        BigInt(123),
                        b
                    )
                )
            ).toBe( true )
        });

        test("mulperiodic3", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_scalarMul(
                        ( BigInt("52435875175126190479447740508185965837690552500527637822603658699938581184513") * BigInt(987654321) )+ BigInt(123),
                        b
                    ),
                    bls12_381_G1_scalarMul(
                        BigInt(123),
                        b
                    )
                )
            ).toBe( true )
        });

        test("mulperiodic4", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_scalarMul(
                        ( BigInt("52435875175126190479447740508185965837690552500527637822603658699938581184513") * BigInt(-987654321) )+ BigInt(123),
                        b
                    ),
                    bls12_381_G1_scalarMul(
                        BigInt(123),
                        b
                    )
                )
            ).toBe( true )
        });
    });

    describe("bls12_381_G2_scalarMul", () => {

        const a        = bls12_381_G2_uncompress( fromHex("b0629fa1158c2d23a10413fe91d381a84d25e31d041cd0377d25828498fd02011b35893938ced97535395e4815201e67108bcd4665e0db25d602d76fa791fab706c54abf5e1a9e44b4ac1e6badf3d2ac0328f5e30be341677c8bac5dda7682f1") );
        const b        = bls12_381_G2_uncompress( fromHex("8310bc97fc7ad9b1616e51226c6a521b9d7fdf03f7299833e6a208ae0399fec76045a43ceef846e0958d0cdf05cf2b1f00460ee6edd2778b413eb7c272bc5b94d12b910f8ac4eb1b55e50a93644714787417bc462349c5e0f6f357b9ac32262a") );
        const a_b_2157 = bls12_381_G2_uncompress( fromHex("b8a335cdbb3de744ba2b6bb3c9ad9c209a7f33a1453c2ed0460e188c1f31f185e359a62727fe1d8ba5c931d75ef644e50173e5255b62194677fb67323ce42bac5c6b1b077e682df3aabca1caee2f640db1fed0b4ad511562f7c54d84ea76debc") );
        const b_44     = bls12_381_G2_uncompress( fromHex("aa2a95bc9936c61f5039cc6fbbe0e25fa8b1528ea18c5be09c93ed941d1c9052597086b8d3b3b5fbbd110ce389378c5414efd310de2120a7efbaaf70d01f5b80835118c1f39a4273a10f1f2a4af0ed33a7c17fba4c8e3f7cb08a1d97e82d5611") );
        const neg_b_44 = bls12_381_G2_uncompress( fromHex("8a2a95bc9936c61f5039cc6fbbe0e25fa8b1528ea18c5be09c93ed941d1c9052597086b8d3b3b5fbbd110ce389378c5414efd310de2120a7efbaaf70d01f5b80835118c1f39a4273a10f1f2a4af0ed33a7c17fba4c8e3f7cb08a1d97e82d5611") );

        test("addmul", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_add(
                        bls12_381_G2_scalarMul( 2157, a ),
                        bls12_381_G2_scalarMul( 2157, b )
                    ),
                    a_b_2157
                )
            ).toBe( true );
        });

        test("mul0", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_scalarMul( 0, b ),
                    g2_zero
                )
            ).toBe( true )
        });

        test("mul1", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_scalarMul( 1, b ),
                    b
                )
            ).toBe( true )
        });

        test("mul19+25", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_add(
                        bls12_381_G2_scalarMul( 19, b ),
                        bls12_381_G2_scalarMul( 25, b )
                    ),
                    b_44
                )
            ).toBe( true );
        });

        test("mul44", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_scalarMul( 44, b ),
                    b_44
                )
            ).toBe( true )
        });

        test("mul4x11", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_scalarMul( 4, bls12_381_G2_scalarMul( 11, b ) ),
                    b_44
                )
            ).toBe( true )
        });

        test("muladd", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_scalarMul(
                        2157,
                        bls12_381_G2_add( a, b )
                    ),
                    a_b_2157
                )
            ).toBe( true )
        });

        test("mulneg1", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_scalarMul( -1, b ),
                    bls12_381_G2_uncompress( fromHex("a310bc97fc7ad9b1616e51226c6a521b9d7fdf03f7299833e6a208ae0399fec76045a43ceef846e0958d0cdf05cf2b1f00460ee6edd2778b413eb7c272bc5b94d12b910f8ac4eb1b55e50a93644714787417bc462349c5e0f6f357b9ac32262a") )
                )
            ).toBe( true )
        });

        test("mulneg44", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_scalarMul( -44, b ),
                    neg_b_44
                )
            ).toBe( true )
        });

        test("mulperiodic1", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_scalarMul(
                        BigInt("52435875175126190479447740508185965837690552500527637822603658699938581184513"),
                        b
                    ),
                    g2_zero
                )
            ).toBe( true )
        });

        test("mulperiodic2", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_scalarMul(
                        BigInt("52435875175126190479447740508185965837690552500527637822603658699938581184513") + BigInt(123),
                        b
                    ),
                    bls12_381_G2_scalarMul(
                        BigInt(123),
                        b
                    )
                )
            ).toBe( true )
        });

        test("mulperiodic3", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_scalarMul(
                        ( BigInt("52435875175126190479447740508185965837690552500527637822603658699938581184513") * BigInt(987654321) )+ BigInt(123),
                        b
                    ),
                    bls12_381_G2_scalarMul(
                        BigInt(123),
                        b
                    )
                )
            ).toBe( true )
        });

        test("mulperiodic4", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_scalarMul(
                        ( BigInt("52435875175126190479447740508185965837690552500527637822603658699938581184513") * BigInt(-987654321) )+ BigInt(123),
                        b
                    ),
                    bls12_381_G2_scalarMul(
                        BigInt(123),
                        b
                    )
                )
            ).toBe( true )
        });
    });

    describe("bls12_381_G1_hashToGroup", () => {

        test("hash-different-msg-same-dst", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_hashToGroup(
                        new Uint8Array([ 0x8e ]),
                        new Uint8Array([ 0x0a ]),
                    ),
                    bls12_381_G1_hashToGroup(
                        new Uint8Array([ 0x81 ]),
                        new Uint8Array([ 0x0a ]),
                    )
                )
            ).toBe( false )
        });

        test("hash-dst-len-255", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_hashToGroup(
                        new Uint8Array([ 0x3f ]),
                        fromHex("123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"),
                    ),
                    bls12_381_G1_uncompress( fromHex("931bd1f65dd2d34a55c93d82c20dcacd3a91afa5932fdd7fed06119f8574520c9609d337d680060b4bd2c59f0b60bb54") )
                )
            ).toBe( true )
        });

        test("hash-dst-len-256", () => {
            expect(() =>
                bls12_381_G1_hashToGroup(
                    new Uint8Array([ 0x3f ]),
                    fromHex("123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890ff"),
                )
            ).toThrow()
        });

        test("hash-empty-dst", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_hashToGroup(
                        new Uint8Array([ 0x8e ]),
                        new Uint8Array([])
                    ),
                    bls12_381_G1_uncompress( fromHex("9019067bf1fa5b2a7a40fb31a70c66f25a3de7e3ef42f8365c9b7963dc01e15a2e086df6d1a181b1d12811a520440909") )
                )
            ).toBe( true )
        });

        test("hash-same-msg-different-dst", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_hashToGroup(
                        new Uint8Array([ 0x8e ]),
                        new Uint8Array([ 0x0a ]),
                    ),
                    bls12_381_G1_hashToGroup(
                        new Uint8Array([ 0x8e ]),
                        new Uint8Array([ 0x01 ]),
                    )
                )
            ).toBe( false )
        });

        test("hash", () => {
            expect(
                bls12_381_G1_equal(
                    bls12_381_G1_hashToGroup(
                        new Uint8Array([ 0x8e ]),
                        new Uint8Array([ 0x0a ]),
                    ),
                    bls12_381_G1_uncompress( fromHex("a45ddef02cdd86039be4b0a863cba70ea903194ea0489ce619c6276175839d62eea72b095d6566067f4a44b85614f199") )
                )
            ).toBe( true )
        });
    });

    describe("bls12_381_G2_hashToGroup", () => {

        test("hash-different-msg-same-dst", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_hashToGroup(
                        new Uint8Array([ 0x8e ]),
                        new Uint8Array([ 0x0a ]),
                    ),
                    bls12_381_G2_hashToGroup(
                        new Uint8Array([ 0x81 ]),
                        new Uint8Array([ 0x0a ]),
                    )
                )
            ).toBe( false )
        });

        test("hash-dst-len-255", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_hashToGroup(
                        new Uint8Array([ 0x3f ]),
                        fromHex("123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"),
                    ),
                    bls12_381_G2_uncompress( fromHex("9028b507444b4283faf2f85e7f7d3890b67e9bcf84c7de2f75fe603996ab1b12a25b4637d68f310b7bd6d47ec11e3fa60d0f8f9d1dc880746105b4d7e9b5bba86abfdef96dfda303b1fb00b5d866b5d7f67883efb39efca301ae44a7f1322a33") )
                )
            ).toBe( true )
        });

        test("hash-dst-len-256", () => {
            expect(() =>
                bls12_381_G2_hashToGroup(
                    new Uint8Array([ 0x3f ]),
                    fromHex("123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890ff"),
                )
            ).toThrow()
        });

        test("hash-empty-dst", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_hashToGroup(
                        new Uint8Array([ 0x8e ]),
                        new Uint8Array([])
                    ),
                    bls12_381_G2_uncompress( fromHex("8785334bbccf9f7a1bc656fcbcaf9901521cc09a076ff69d40e467082b605d668219747dfec37c798c97b2c7f28ec90117c4ccfc54ef3cc3c0038951c4969a3c0b3fb842a78103586657428ab38d719c9d3314de566cd95540aaccf7afd48821") )
                )
            ).toBe( true )
        });

        test("hash-same-msg-different-dst", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_hashToGroup(
                        new Uint8Array([ 0x8e ]),
                        new Uint8Array([ 0x0a ]),
                    ),
                    bls12_381_G2_hashToGroup(
                        new Uint8Array([ 0x8e ]),
                        new Uint8Array([ 0x01 ]),
                    )
                )
            ).toBe( false )
        });

        test("hash", () => {
            expect(
                bls12_381_G2_equal(
                    bls12_381_G2_hashToGroup(
                        new Uint8Array([ 0x8e ]),
                        new Uint8Array([ 0x0a ]),
                    ),
                    bls12_381_G2_uncompress( fromHex("abdb064dbaa986d9609796d7a80ef07f719f99fa5d9876e01f9298793d4c7e7ba9b2c55da6896f90693ad76a093d280118a4c24df9a387eaf85b15927365a110fe5256f53ddf8bef4069fe761d8215d4a73ec980f1a801dbaba25146b6ca7e07") )
                )
            ).toBe( true )
        });
    });

    describe("bls12_381_millerLoop", () => {

        const a_g1 = bls12_381_G1_uncompress( fromHex("950dfd33da2682260c76038dfb8bad6e84ae9d599a3c151815945ac1e6ef6b1027cd917f3907479d20d636ce437a41f5") );
        const b_g1 = bls12_381_G1_uncompress( fromHex("abd61864f519748032551e42e0ac417fd828f079454e3e3c9891c5c29ed7f10bdecc046854e3931cb7002779bd76d71f") );
        const a_g2 = bls12_381_G2_uncompress( fromHex("b0629fa1158c2d23a10413fe91d381a84d25e31d041cd0377d25828498fd02011b35893938ced97535395e4815201e67108bcd4665e0db25d602d76fa791fab706c54abf5e1a9e44b4ac1e6badf3d2ac0328f5e30be341677c8bac5dda7682f1") );
        const b_g2 = bls12_381_G2_uncompress( fromHex("8310bc97fc7ad9b1616e51226c6a521b9d7fdf03f7299833e6a208ae0399fec76045a43ceef846e0958d0cdf05cf2b1f00460ee6edd2778b413eb7c272bc5b94d12b910f8ac4eb1b55e50a93644714787417bc462349c5e0f6f357b9ac32262a") );
        
        test("balanced", () => {
            expect(
                bls12_381_finalVerify(
                    bls12_381_millerLoop(
                        bls12_381_G1_scalarMul(
                            251123,
                            a_g1
                        ),
                        a_g2
                    ),
                    bls12_381_millerLoop(
                        a_g1,
                        bls12_381_G2_scalarMul(
                            251123,
                            a_g2
                        )
                    )
                )
            ).toBe( true );
        });

        test("equal-pairing", () => {
            expect(
                bls12_381_finalVerify(
                    bls12_381_millerLoop( a_g1, a_g2 ),
                    bls12_381_millerLoop( a_g1, a_g2 )
                )
            ).toBe( true );
        });

        test("left-additive", () => {
            expect(
                bls12_381_finalVerify(
                    bls12_381_millerLoop(
                        bls12_381_G1_add( a_g1, b_g1 ),
                        a_g2
                    ),
                    bls12_381_mulMlResult(
                        bls12_381_millerLoop( a_g1, a_g2 ),
                        bls12_381_millerLoop( b_g1, a_g2 ),
                    )
                )
            ).toBe( true );
        });

        test("right-additive", () => {
            expect(
                bls12_381_finalVerify(
                    bls12_381_millerLoop(
                        a_g1,
                        bls12_381_G2_add( a_g2, b_g2 )
                    ),
                    bls12_381_mulMlResult(
                        bls12_381_millerLoop( a_g1, a_g2 ),
                        bls12_381_millerLoop( a_g1, b_g2 ),
                    )
                )
            ).toBe( true );
        });

        test("random-pairing", () => {
            // -- Check that the results of two millerLoops of random points are different.
            expect(
                bls12_381_finalVerify(
                    bls12_381_millerLoop( a_g1, a_g2 ),
                    bls12_381_millerLoop( b_g1, b_g2 )
                )
            ).toBe( false );
        });

    })

})