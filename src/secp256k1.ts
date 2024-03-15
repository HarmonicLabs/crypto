import { verifySchnorr, verifySecp256k1 } from "./noble/secp256k1";

export function verifyEcdsaSecp256k1Signature(
    vk: Uint8Array, // 33 bytes
    messageHash: Uint8Array, // 32 bytes
    signature: Uint8Array, // 64 bytes (strict according to plutus conformance)
): boolean
{
    if(!(
        vk instanceof Uint8Array &&
        messageHash instanceof Uint8Array &&
        signature instanceof Uint8Array &&

        vk.length === 33 &&
        messageHash.length === 32 &&
        signature.length === 64
    )) throw new TypeError("invalid arguments passed to 'verifyEcdsaSecp256k1Signature'");

    const vkHead = vk[0];

    if(!(
        vkHead === 0x02 ||
        vkHead === 0x03
    )) throw new Error("plutus-machine only supports compressed public keys for 'verifyEcdsaSecp256k1Signature'");

    return verifySecp256k1( signature, messageHash, vk );
}

export function verifySchnorrSecp256k1Signature(
    pubKey: Uint8Array,
    messageHash: Uint8Array,
    signature: Uint8Array
): boolean
{
    if(!(
        pubKey instanceof Uint8Array &&
        messageHash instanceof Uint8Array &&
        signature instanceof Uint8Array &&

        pubKey.length === 32 &&
        signature.length === 64
    )) throw new TypeError("invalid arguments passed to 'verifyEcdsaSecp256k1Signature'");
    // signature 64
    // pubKey 32
    return verifySchnorr( signature, messageHash, pubKey );
}