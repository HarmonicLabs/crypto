import { toHex } from "@harmoniclabs/uint8array-utils";
import { FieldElem51 } from "../rust_vrf_reimpl"

describe("negate", () => {

    test("u", () => {

        // FieldElement51([
        //      1213845222667727,
        //      156026505343998,
        //      1004342731707625,
        //      896956956627304,
        //      341977914924723
        // ])
        const u = new FieldElem51(
            new BigUint64Array([
                936292574774286n,
                2130398392959545n,
                1280931128010030n,
                1182760305369263n,
                1736640888287092n
            ])
        );

        const wrong = new FieldElem51(
            new BigUint64Array([
                1213845222667727n,
                156026505343998n,
                1004342731707625n,
                896956956627304n,
                341977914924723n
            ])
        );

        // `neg` DOES NOT mutate
        const negated = u.neg();

        expect( u ).not.toEqual( negated );

        u.conditional_negate( true );

        expect( negated ).not.toEqual(wrong);
        expect( u ).toEqual( negated );
        /*

[src/vrf03.rs:582:9] u = FieldElement51([1213845222667727, 156026505343998, 1004342731707625, 896956956627304, 341977914924723])
[src/vrf03.rs:583:9] u.negate() = ()
[src/vrf03.rs:584:9] u = FieldElement51([1037954591017502, 2095773308341249, 1247457081977622, 1354842857057943, 1909821898760524])
        */
    })
})