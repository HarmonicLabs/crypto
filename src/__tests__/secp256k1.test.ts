import { fromHex } from "@harmoniclabs/uint8array-utils";
import { verifyEcdsaSecp256k1Signature, verifySchnorrSecp256k1Signature } from "../secp256k1";
import { secp256k1, signSecp256k1 } from "../noble/secp256k1";

function testFail( title: string, fn: () => void ): void
{
    test(title, () => {
        expect( fn ).toThrow()
    });
}

describe("secp256k1", () => {

    describe("ecdsa", () => {

        testFail("invalid key", () =>
            verifyEcdsaSecp256k1Signature(
                fromHex("04e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                fromHex("b2fc46ad47af464478c199e1f8be169f1be6327c7f9a0a6689371ca94caf04064a01b22aff1520abd58951341603faed768cf78ce97ae7b038abfe456aa17c09")
            )
        );

        testFail("long key", () =>
            verifyEcdsaSecp256k1Signature(
                fromHex("02e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f0101"),
                fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                fromHex("b2fc46ad47af464478c199e1f8be169f1be6327c7f9a0a6689371ca94caf04064a01b22aff1520abd58951341603faed768cf78ce97ae7b038abfe456aa17c09")
            )
        );

        testFail("long msg", () =>
            verifyEcdsaSecp256k1Signature(
                fromHex("02e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f0101"),
                fromHex("b2fc46ad47af464478c199e1f8be169f1be6327c7f9a0a6689371ca94caf04064a01b22aff1520abd58951341603faed768cf78ce97ae7b038abfe456aa17c09")
            )
        );

        testFail("long sig", () =>
            verifyEcdsaSecp256k1Signature(
                fromHex("02e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                fromHex("b2fc46ad47af464478c199e1f8be169f1be6327c7f9a0a6689371ca94caf04064a01b22aff1520abd58951341603faed768cf78ce97ae7b038abfe456aa17c0909")
            )
        );

        testFail("short key", () =>
            verifyEcdsaSecp256k1Signature(
                fromHex("02e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f"),
                fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                fromHex("b2fc46ad47af464478c199e1f8be169f1be6327c7f9a0a6689371ca94caf04064a01b22aff1520abd58951341603faed768cf78ce97ae7b038abfe456aa17c09")
            )
        );

        testFail("short msg", () =>
            verifyEcdsaSecp256k1Signature(
                fromHex("02e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f"),
                fromHex("b2fc46ad47af464478c199e1f8be169f1be6327c7f9a0a6689371ca94caf04064a01b22aff1520abd58951341603faed768cf78ce97ae7b038abfe456aa17c09")
            )
        );

        testFail("short sig", () =>
            verifyEcdsaSecp256k1Signature(
                fromHex("02e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                fromHex("b2fc46ad47af464478c199e1f8be169f1be6327c7f9a0a6689371ca94caf04064a01b22aff1520abd58951341603faed768cf78ce97ae7b038abfe456aa17c")
            )
        );

        test("all good", () => {
            expect(
                () => verifyEcdsaSecp256k1Signature(
                    fromHex("02e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                    fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                    fromHex("b2fc46ad47af464478c199e1f8be169f1be6327c7f9a0a6689371ca94caf04064a01b22aff1520abd58951341603faed768cf78ce97ae7b038abfe456aa17c09")
                )
            ).not.toThrow()
        });

        test("correct verify", () => {
            const msg = fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01");
            const priv = new Uint8Array( 32 ).fill( 1 );
            const sig = secp256k1.sign( msg, priv );
            const pub = sig.recoverPublicKey( msg ).toRawBytes();
            expect(
                verifyEcdsaSecp256k1Signature(
                    pub,
                    msg,
                    sig.toCompactRawBytes()
                )
            ).toEqual( true )
        })
    });

    describe("schnorr", () => {

        testFail("long key", () =>
            verifySchnorrSecp256k1Signature(
                fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f0101"),
                fromHex("18b6bec097"),
                fromHex("b2fc46ad47af464478c199e1f8be169f1be6327c7f9a0a6689371ca94caf04064a01b22aff1520abd58951341603faed768cf78ce97ae7b038abfe456aa17c09")
            )
        );

        testFail("long sig", () =>
            verifySchnorrSecp256k1Signature(
                fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                fromHex("18b6bec097"),
                fromHex("b2fc46ad47af464478c199e1f8be169f1be6327c7f9a0a6689371ca94caf04064a01b22aff1520abd58951341603faed768cf78ce97ae7b038abfe456aa17c0909")
            )
        );

        testFail("short key", () =>
            verifySchnorrSecp256k1Signature(
                fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f"),
                fromHex("18b6bec097"),
                fromHex("b2fc46ad47af464478c199e1f8be169f1be6327c7f9a0a6689371ca94caf04064a01b22aff1520abd58951341603faed768cf78ce97ae7b038abfe456aa17c09")
            )
        );

        testFail("short sig", () =>
            verifySchnorrSecp256k1Signature(
                fromHex("e253af0766804b869bb1595be9765b534886bbaab8305bf50dbc7f899bfb5f01"),
                fromHex("18b6bec097"),
                fromHex("b2fc46ad47af464478c199e1f8be169f1be6327c7f9a0a6689371ca94caf04064a01b22aff1520abd58951341603faed768cf78ce97ae7b038abfe456aa17c")
            )
        );

    });
});