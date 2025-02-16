import { fromHex, toHex } from "@harmoniclabs/uint8array-utils";
import { EdwardsPoint, FieldElem51, ProjectiveNielsPoint, scalar_from_u64 } from "../../rust_vrf_reimpl/curves"

describe("add", () => {

    test("decompression_sign_handling", () => {
        const compressed_base = EdwardsPoint.BASEPOINT_ED25519_COMPRESSED;
        compressed_base[31] |= 1 << 7;
        const neg_base = EdwardsPoint.decompress(compressed_base)!;

        expect( neg_base.X ).toEqual( EdwardsPoint.BASEPOINT_ED25519.X.neg() );
        expect( neg_base.Y ).toEqual( EdwardsPoint.BASEPOINT_ED25519.Y       );
        expect( neg_base.Z ).toEqual( EdwardsPoint.BASEPOINT_ED25519.Z       );
        expect( neg_base.T ).toEqual( EdwardsPoint.BASEPOINT_ED25519.T.neg() );
    });

    test("basepoint_plus_basepoint_vs_basepoint2", () => {
        const bp = EdwardsPoint.BASEPOINT_ED25519;
        const bp2 = bp.add(bp);

        expect( bp2.compress() ).toEqual( EdwardsPoint.DOUBLE_BASE_COMPRESSED );
    });

    test("basepoint_plus_basepoint_projective_niels_vs_basepoint2", () => {
        const bp = EdwardsPoint.BASEPOINT_ED25519;
        const bp2 = bp.addProjectiveNiels(bp.toProjectiveNiels()).toExtended();

        expect( bp2.compress() ).toEqual( EdwardsPoint.DOUBLE_BASE_COMPRESSED );
    });

    test("basepoint_double_vs_basepoint2", () => {
        const bp = EdwardsPoint.BASEPOINT_ED25519;
        const bp2 = bp.double();

        expect( bp2.compress() ).toEqual( EdwardsPoint.DOUBLE_BASE_COMPRESSED );
    });

    /*
    #[test]
    fn impl_sum() {

        // Test that sum works for non-empty iterators
        let BASE = constants::ED25519_BASEPOINT_POINT;

        let s1 = Scalar::from(999u64);
        let P1 = &BASE * &s1;

        let s2 = Scalar::from(333u64);
        let P2 = &BASE * &s2;

        let vec = vec![P1.clone(), P2.clone()];
        let sum: EdwardsPoint = vec.iter().sum();

        assert_eq!(sum, P1 + P2);

        // Test that sum works for the empty iterator
        let empty_vector: Vec<EdwardsPoint> = vec![];
        let sum: EdwardsPoint = empty_vector.iter().sum();

        assert_eq!(sum, EdwardsPoint::identity());

        // Test that sum works on owning iterators
        let s = Scalar::from(2u64);
        let mapped = vec.iter().map(|x| x * s);
        let sum: EdwardsPoint = mapped.sum();

        assert_eq!(sum, &P1 * &s + &P2 * &s);
      }
    */
    test("impl_sum", () => {

        const BASE = EdwardsPoint.BASEPOINT_ED25519;

        const s1 = scalar_from_u64(999);
        const P1 = BASE.scalarMul(s1);

        console.log( toHex( P1.compress() ) );

        const s2 = scalar_from_u64(333);
        const P2 = BASE.scalarMul(s2);

        console.log( toHex( P2.compress() ) );

        const sum = P1.add(P2);
        
        console.log( toHex( sum.compress() ) );

        const s = scalar_from_u64(2);
        const sP1 = P1.scalarMul(s);
        const sP2 = P2.scalarMul(s);

        const ssum = sP1.add(sP2);

        console.log( toHex( s ) );
        console.log( toHex( sP1.compress() ) );
        console.log( toHex( sP2.compress() ) );
        console.log( toHex( ssum.compress() ) );

        // expect( ssum ).toEqual( sum.scalarMul(s) );
    });

    test.only("rhs is negative", () => {

        const tmp3_extracted = EdwardsPoint.decompress(fromHex("eb2767c137ab7ad8279c078eff116ab0786ead3a2e0f989f72c37f82f2969670"))!;
        const compressed_rhs  = fromHex("c9a3f86aae465f0e56513864510f3997561fa2c9e85ea21dc2292309f3cd60a2");
        const expected_sum = EdwardsPoint.decompress(fromHex("39289c8998fd69835c26b619e89848a7bf02b7cb7ad1ba1581cbc4506f2550ce"))!;
        const NOT_EXPECTED = EdwardsPoint.decompress(fromHex("0f06610f1c1d6a4bd17ae7f2c2ba7253e3f55a06abca6cb984c0a3b3060b38f8"))!;

        const real_proj_niels = new ProjectiveNielsPoint(
            new FieldElem51(new BigUint64Array([
                BigInt( "1519297034332653" ),
                BigInt( "1098796920435767" ),
                BigInt( "1823476547744119" ),
                BigInt( "808144629470969" ),
                BigInt( "2110930855619772" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "2589805796513532" ),
                BigInt( "1667856962156924" ),
                BigInt( "2352199083792699" ),
                BigInt( "1604566703601690" ),
                BigInt( "1950338038771369" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "1507481815385608" ),
                BigInt( "2223447444246085" ),
                BigInt( "1083941587175919" ),
                BigInt( "2059929906842505" ),
                BigInt( "1581435440146976" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "331294045953982" ),
                BigInt( "808040234708355" ),
                BigInt( "591947715328199" ),
                BigInt( "767368522615039" ),
                BigInt( "1976781068772601" )
            ]))
        );
        const rhs = real_proj_niels;

        const real_tmp3 = new EdwardsPoint(
            new FieldElem51(new BigUint64Array([
                BigInt( "756114041516686" ), 
                BigInt( "1369587757143823" ), 
                BigInt( "416185695249199" ), 
                BigInt( "615103553328687" ), 
                BigInt( "156955943909708" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "1497543382975235" ), 
                BigInt( "1667769359772261" ), 
                BigInt( "1495050320325016" ), 
                BigInt( "728558171548597" ), 
                BigInt( "1953659327866929" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "846770915761948" ), 
                BigInt( "1920925181120452" ), 
                BigInt( "2002723433229678" ), 
                BigInt( "678382258071095" ), 
                BigInt( "158509539488966" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "2017998633530542" ), 
                BigInt( "295318225333438" ), 
                BigInt( "1094258976751820" ), 
                BigInt( "719190591560386" ), 
                BigInt( "204249641286342" )
            ]))
        );

        expect( tmp3_extracted.compress() ).toEqual( real_tmp3.compress() );

        const tmp3 = real_tmp3;

        expect( real_proj_niels.compress() ).toEqual( compressed_rhs );
        
        expect( tmp3.addProjectiveNiels(rhs).toExtended().compress() )
        .toEqual( expected_sum.compress() );
        
        // expect( rhs_proj ).toEqual( real_proj_niels );
        
    });
})