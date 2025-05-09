import { fromHex } from "@harmoniclabs/uint8array-utils"
import { VrfProof10 } from "../vrf";

describe("vrf", () => {

    describe("rust impl tests", () => {

        const test_vectors = [
            [
                "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60",
                "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
                "8657106690b5526245a92b003bb079ccd1a92130477671f6fc01ad16f26f723f5e8bd1839b414219e8626d393787a192241fc442e6569e96c462f62b8079b9ed83ff2ee21c90c7c398802fdeebea4001",
                "90cf1df3b703cce59e2a35b925d411164068269d7b2d29f3301c03dd757876ff66b71dda49d2de59d03450451af026798e8f81cd2e333de5cdf4f3e140fdd8ae",
                "",
            ],
            [
                "4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb",
                "3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c",
                "f3141cd382dc42909d19ec5110469e4feae18300e94f304590abdced48aed593f7eaf3eb2f1a968cba3f6e23b386aeeaab7b1ea44a256e811892e13eeae7c9f6ea8992557453eac11c4d5476b1f35a08",
                "eb4440665d3891d668e7e0fcaf587f1b4bd7fbfe99d0eb2211ccec90496310eb5e33821bc613efb94db5e5b54c70a848a0bef4553a41befc57663b56373a5031",
                "72",
            ],
            [
                "c5aa8df43f9f837bedb7442f31dcb7b166d38535076f094b85ce3a2e0b4458f7",
                "fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025",
                "9bc0f79119cc5604bf02d23b4caede71393cedfbb191434dd016d30177ccbf80e29dc513c01c3a980e0e545bcd848222d08a6c3e3665ff5a4cab13a643bef812e284c6b2ee063a2cb4f456794723ad0a",
                "645427e5d00c62a23fb703732fa5d892940935942101e456ecca7bb217c61c452118fec1219202a0edcf038bb6373241578be7217ba85a2687f7a0310b2df19f",
                "af82",
            ],
        ]

        const n = test_vectors.length;
        for( let i = 0; i < n; i++ )
        {
            const [ _sk, _pk, _proof_bytes, _proof_hash, _alpha ] = test_vectors[i];
            test(`example ${i}`, () => {
                const sk = fromHex( _sk );
                const pk = fromHex( _pk );
                const expected_proof_bytes = fromHex( _proof_bytes );
                const expected_proof_hash  = fromHex( _proof_hash  );
                const alpha = fromHex( _alpha );

                const generated_proof = VrfProof10.generate( sk, pk, alpha );

                expect( generated_proof.toBytes() ).toEqual( expected_proof_bytes );

                const expected_proof = VrfProof10.fromBytes( expected_proof_bytes );

                expect( generated_proof.toHash() ).toEqual( expected_proof_hash );

                expect( VrfProof10.verify( pk, alpha, generated_proof ) ).toBe( true );
                expect( VrfProof10.verify( pk, alpha, expected_proof ) ).toBe( true );

                // using sk just to get some bytes that are not pk
                expect( VrfProof10.verify( sk, alpha, generated_proof ) ).toBe( false );

                const wrong_alpha = fromHex( "01" + _alpha.slice(alpha[0] ?? 0) );
                expect( VrfProof10.verify( pk, wrong_alpha, generated_proof ) ).toBe( false );

            });
        }
    });

})