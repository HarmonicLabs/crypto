import { fromHex, toHex } from "@harmoniclabs/uint8array-utils";
import { EdwardsPoint, FieldElem51, LookupTableProjectiveNielsPoint, ProjectiveNielsPoint  } from "../rust_vrf_reimpl"

describe("stuff", () => {

    test("a is b", () => {

        const a = fromHex("f47e49f9d07ad2c1606b4d94067c41f9777d4ffda709b71da1d88628fce34d85");
        const b = fromHex("f47e49f9d07ad2c1606b4d94067c41f9777d4ffda709b71da1d88628fce34d05");

        expect(   a[31].toString(2).padStart(8, "0") )
        .toEqual( b[31].toString(2).padStart(8, "0") )


    })
})