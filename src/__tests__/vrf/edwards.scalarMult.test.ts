import { fromHex, toHex } from "@harmoniclabs/uint8array-utils";
import { EdwardsPoint, FieldElem51 } from "../../rust_vrf_reimpl"

describe("scalarMul", () => {

    test("scalar_mul_vs_ed25519py", () => {
        const pt = EdwardsPoint.BASEPOINT_ED25519;
        const A_SCALAR = new Uint8Array([
            0x1a, 0x0e, 0x97, 0x8a, 0x90, 0xf6, 0x62, 0x2d,
            0x37, 0x47, 0x02, 0x3f, 0x8a, 0xd8, 0x26, 0x4d,
            0xa7, 0x58, 0xaa, 0x1b, 0x88, 0xe0, 0x40, 0xd1,
            0x58, 0x9e, 0x7b, 0x7f, 0x23, 0x76, 0xef, 0x09,
        ]);
        const COMPRESSED_A_TIMES_BASE = new Uint8Array([
            0xea, 0x27, 0xe2, 0x60, 0x53, 0xdf, 0x1b, 0x59,
            0x56, 0xf1, 0x4d, 0x5d, 0xec, 0x3c, 0x34, 0xc3,
            0x84, 0xa2, 0x69, 0xb7, 0x4c, 0xc3, 0x80, 0x3e,
            0xa8, 0xe2, 0xe7, 0xc9, 0x42, 0x5e, 0x40, 0xa5]);
        const A_TIMES_BASE = EdwardsPoint.decompress(COMPRESSED_A_TIMES_BASE);

        const result = pt.scalarMul(A_SCALAR);

        const COMPRESSED_AFTER_ONE_LOOP = fromHex("2c7be86ab07488ba43e8e03d85a67625cfbf98c8544de4c877241b7aaafc7fe3");

        // modify based on what rust says
        const tmp_result = fromHex("d4e0e2ad3516776cab358379c07477025fc48e8095f8b868a457389c85d1354f")

        expect( toHex( result.compress() ) )
        .toEqual( toHex( COMPRESSED_A_TIMES_BASE ) );

        // expect( result )
        // .toEqual( A_TIMES_BASE );
    });

})