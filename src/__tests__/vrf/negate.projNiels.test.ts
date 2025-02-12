import { fromHex, toHex } from "@harmoniclabs/uint8array-utils";
import { EdwardsPoint, FieldElem51, ProjectiveNielsPoint } from "../../rust_vrf_reimpl"

describe("negate projective niels", () => {

    test.skip("that damn point", () => {
        const satan = new ProjectiveNielsPoint(
            new FieldElem51(new BigUint64Array([
                BigInt( "2589805796513532" ), 
                BigInt( "1667856962156924" ), 
                BigInt( "2352199083792699" ), 
                BigInt( "1604566703601690" ), 
                BigInt( "1950338038771369" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "1519297034332653" ), 
                BigInt( "1098796920435767" ), 
                BigInt( "1823476547744119" ), 
                BigInt( "808144629470969" ), 
                BigInt( "2110930855619772" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "1507481815385608" ), 
                BigInt( "2223447444246085" ), 
                BigInt( "1083941587175919" ), 
                BigInt( "2059929906842505" ), 
                BigInt( "1581435440146976" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "1920505767731247" ), 
                BigInt( "1443759578976892" ), 
                BigInt( "1659852098357048" ), 
                BigInt( "1484431291070208" ), 
                BigInt( "275018744912646" )
            ]))
        );
    })

    test("f47e49f9d07ad2c1606b4d94067c41f9777d4ffda709b71da1d88628fce34d85", () => {

        const compressed_pt = fromHex("f47e49f9d07ad2c1606b4d94067c41f9777d4ffda709b71da1d88628fce34d85");
        const compressed_pt_neg = fromHex("f47e49f9d07ad2c1606b4d94067c41f9777d4ffda709b71da1d88628fce34d05");
        const pt = new ProjectiveNielsPoint(
            new FieldElem51(
              new BigUint64Array([
                3890867686939442n,
                1484176557946321n,
                2552600195830037n,
                1329915446659182n,
                1211704578730455n
              ])
            ),
            new FieldElem51(
              new BigUint64Array([
                1820794733038396n,
                1612235121681074n,
                757405923441402n,
                1094031020892801n,
                231025333128907n
              ])
            ),
            new FieldElem51(
              new BigUint64Array([
                1497674430438813n,
                342545521275073n,
                2102107575279372n,
                2108462244669966n,
                1382582406064082n
              ])
            ),
            new FieldElem51(
              new BigUint64Array([
                641900794791527n,
                1711751746971612n,
                179044712319955n, 
                576455585963824n,
                1852617592509865n
              ])
            )
        );

        expect( pt.compress() ).toEqual( compressed_pt );
        expect( pt.neg().compress() ).toEqual( compressed_pt_neg );

        pt.conditional_negate( false );
        expect( pt.compress() ).not.toEqual( compressed_pt_neg );
        expect( pt.compress() ).toEqual( compressed_pt );

        pt.conditional_negate( true );
        expect( pt.compress() ).not.toEqual( compressed_pt );
        expect( pt.compress() ).toEqual( compressed_pt_neg );

    });

})