import { bls12_381_G1_compress, bls12_381_G1_uncompress, bls12_381_G2_uncompress, isBlsG1, isBlsG2 } from "../bls12_318";

// regression: parseMask used `bytes.slice()` to copy before clearing the mask bits,
// but Node's Buffer overrides slice() with a view (alias of subarray), so the
// compression bit was cleared IN THE CALLER'S BYTES and the second parse inside
// fromHex saw compressed = false -> "Invalid point G1, expected 48/96 bytes"
// for every valid point.
describe("bls12_318 with Node Buffer inputs", () => {

    // the compressed BLS12-381 G1 / G2 generators
    const G1_GEN_HEX = "97f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb";
    const G2_GEN_HEX = "93e02b6052719f607dacd3a088274f65596bd0d09920b61ab5da61bbdc7f5049334cf11213945d57e5ac7d055d042b7e024aa2b2f08f0a91260805272dc51051c6e47ad4fa403b02b4510b647ae3d1770bac0326a805bbefd48056c8c121bdb8";

    test("G1 uncompress accepts a Buffer and does not mutate it", () => {

        const bytes = Buffer.from( G1_GEN_HEX, "hex" );
        const point = bls12_381_G1_uncompress( bytes );

        expect( isBlsG1( point ) ).toBe( true );
        // input untouched (mask bits still set)
        expect( bytes.toString("hex") ).toEqual( G1_GEN_HEX );
        // compress round-trips
        expect(
            Buffer.from( bls12_381_G1_compress( point ) ).toString("hex")
        ).toEqual( G1_GEN_HEX );

    });

    test("G1 uncompress(Buffer) equals uncompress(Uint8Array)", () => {

        const asBuffer = bls12_381_G1_uncompress( Buffer.from( G1_GEN_HEX, "hex" ) );
        const asUint8 = bls12_381_G1_uncompress( new Uint8Array( Buffer.from( G1_GEN_HEX, "hex" ) ) );

        expect( asBuffer.equals( asUint8 ) ).toBe( true );

    });

    test("G2 uncompress accepts a Buffer and does not mutate it", () => {

        const bytes = Buffer.from( G2_GEN_HEX, "hex" );
        const point = bls12_381_G2_uncompress( bytes );

        expect( isBlsG2( point ) ).toBe( true );
        expect( bytes.toString("hex") ).toEqual( G2_GEN_HEX );

    });

})
