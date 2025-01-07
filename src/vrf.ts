import { bigpoint, bigpointToUint8Array, deriveEd25519PublicKey, extendEd25519PrivateKey, pointFromBytes, scalarFromBytes, scalarMul, scalarMultBase } from "./ed25519";
import { sha2_512 } from "./sha2_512";
import { byte } from "./types";

/**
4.4. RSA-FDH-VRF Ciphersuites

This document defines RSA-FDH-VRF-SHA256 as follows:

suite_string = 0x01.
The hash function Hash is SHA-256 as specified in [RFC6234], with hLen = 32.
MGF_salt = I2OSP(k, 4) || I2OSP(n, k).

This document defines RSA-FDH-VRF-SHA384 as follows:

suite_string = 0x02.
The hash function Hash is SHA-384 as specified in [RFC6234], with hLen = 48.
MGF_salt = I2OSP(k, 4) || I2OSP(n, k).

This document defines RSA-FDH-VRF-SHA512 as follows:

suite_string = 0x03.
The hash function Hash is SHA-512 as specified in [RFC6234], with hLen = 64.
MGF_salt = I2OSP(k, 4) || I2OSP(n, k).

 */
const SUITE = 0x03;

const ONE = 0x01;
const TWO = 0x02;

export interface VRFProof {
    gamma: bigpoint;
    challange: bigint;
    response: bigint;
}

/**
 * https://datatracker.ietf.org/doc/html/rfc9381#section-5.1
 */
export function vrf_ed25519_sha512_ell2_prove(sk: Uint8Array, alpha: Uint8Array): VRFProof
{
    const [ scalar, extension ] = extendEd25519PrivateKey( sk );
    // 1. Use SK to derive the VRF secret scalar x and the VRF public key Y = x*B
    const pk = new Uint8Array( deriveEd25519PublicKey( Array.from( sk ) as byte[] ) );
    const H = vrf_ed25519_sha512_ell2_hash_to_curve( pk, alpha );
    const H_point = pointFromBytes( H );
    const gamma = scalarMul( H_point, scalar );
    const compressed_gamma = bigpointToUint8Array( gamma );
    const k = vrf_ed25519_sha512_ell2_nonce_generation( extension, H );
    const announcement_1 = bigpointToUint8Array( scalarMultBase( k ) );
    const announcement_2 = bigpointToUint8Array( scalarMul( H_point, k ) );
    const challange = scalarFromBytes(
        vrf_ed25519_sha512_ell2_challenge_generation( H, compressed_gamma, announcement_1, announcement_2 )
    );
    const response = k + challange * scalar;
    return {
        gamma,
        challange,
        response
    };
}

export function  vrf_ed25519_sha512_ell2_hash_to_curve(
    public_key: Uint8Array,
    alpha_string: Uint8Array
)
{
    const input = new Uint8Array(2 + public_key.length + alpha_string.length);
    input[0] = SUITE;
    input[1] = ONE;
    input.set(public_key, 2);
    input.set(alpha_string, 2 + public_key.length);
    //return pointFromBytes(sha2_512(input))
    return sha2_512(input)
}

export function vrf_ed25519_sha512_ell2_nonce_generation(
    secret_extension: Uint8Array,
    H: Uint8Array,
)
{
    const input = new Uint8Array( 64 );
    input.set( secret_extension, 0 );
    input.set( H, 32 );
    //return pointFromBytes(sha2_512(input))
    return scalarFromBytes(sha2_512(input));
}

export function vrf_ed25519_sha512_ell2_challenge_generation(
    H: Uint8Array,
    gamma: Uint8Array,
    announcement_1: Uint8Array,
    announcement_2: Uint8Array,
)
{
    const input = new Uint8Array( 2 + H.length + gamma.length + announcement_1.length + announcement_2.length );
    input[0] = SUITE;
    input[1] = TWO;
    input.set( H, 2 );
    input.set( gamma, 2 + H.length );
    input.set( announcement_1, 2 + H.length + gamma.length );
    input.set( announcement_2, 2 + H.length + gamma.length + announcement_1.length );
    return sha2_512(input).slice(0,16);
}