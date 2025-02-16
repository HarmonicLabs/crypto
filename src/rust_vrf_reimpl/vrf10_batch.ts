import { uint8ArrayEq } from "@harmoniclabs/uint8array-utils";
import { sha2_512_sync } from "../sha2_512";
import { add_scalars, decompressCompressedEdwardsY, ED25519_BASEPOINT_POINT, EdwardsPoint, FieldElem51, mul_scalars, negate_scalar, scalar_from_bytes_mod_order_wide } from "./curves";
import { extend_secret_key, vrf10_ed25519_sha512_ell2_compute_challenge, vrf10_ed25519_sha512_ell2_hash_to_curve, vrf10_ed25519_sha512_ell2_nonce_generation } from "./vrf10";

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

suite_string = 0x10.
The hash function Hash is SHA-512 as specified in [RFC6234], with hLen = 64.
MGF_salt = I2OSP(k, 4) || I2OSP(n, k).

 */
const SUITE = 0x04;

/*
/// Temporary SUITE identifier, as TAI uses 0x03
pub const SUITE_TEMP: &[u8] = &[0x03];
*/
const SUITE_TEMP = 0x03;

const ONE = 0x01;
const TWO = 0x02;
const THREE = 0x03;

export interface IVrfProof10Batch {
    gamma: EdwardsPoint;
    u_point: EdwardsPoint;
    v_point: EdwardsPoint;
    response: Uint8Array;
}

export function vrf10_bach_ed25519_sha512_ell2_generate_proof(
    secret_key: Uint8Array,
    public_key: Uint8Array,
    alpha_string: Uint8Array
): IVrfProof10Batch
{
    const [ secret_scalar, secret_extension ] = extend_secret_key( secret_key );

    const h = vrf10_ed25519_sha512_ell2_hash_to_curve( public_key, alpha_string );
    const compressed_h = h.compress();

    const gamma = h.scalarMul( secret_scalar );
    const compressed_gamma = gamma.compress();

    const k = vrf10_ed25519_sha512_ell2_nonce_generation( secret_extension, compressed_h );

    const announcement_base = ED25519_BASEPOINT_POINT.scalarMul( k );
    const compressed_announcement_base = announcement_base.compress();
    const announcement_h = h.scalarMul( k );
    const compressed_announcement_h = announcement_h.compress();

    // Self::compute_challenge(&compressed_h, &gamma, &announcement_base, &announcement_h);
    const challenge: Uint8Array =
    vrf10_ed25519_sha512_ell2_compute_challenge(
        compressed_h,
        compressed_gamma,
        compressed_announcement_base,
        compressed_announcement_h
    );

    const response = add_scalars( k, mul_scalars( challenge, secret_scalar ) );

    return {
        gamma: gamma,
        u_point: announcement_base,
        v_point: announcement_h,
        response
    };
}

export function vrf10_batch_ed25519_sha512_ell2_verify_proof(
    public_key: Uint8Array,
    alpha_string: Uint8Array,
    proof: IVrfProof10Batch
): boolean
{
    const h = vrf10_ed25519_sha512_ell2_hash_to_curve( public_key, alpha_string );
    const compressed_h = h.compress();

    const decompressed_pk = decompressCompressedEdwardsY( public_key );// pointFromBytes( public_key );

    if( !decompressed_pk || decompressed_pk.is_small_order() ) return false;

    const gamma = proof.gamma;
    const compressed_gamma = gamma.compress();
    const compressed_announcement_base = proof.u_point.compress();
    const compressed_announcement_h = proof.v_point.compress();

    // Scalar
    const challenge: Uint8Array =
    vrf10_ed25519_sha512_ell2_compute_challenge(
        compressed_h,
        compressed_gamma,
        compressed_announcement_base,
        compressed_announcement_h
    );

    const U = EdwardsPoint.vartime_double_scalar_mul_basepoint(
        negate_scalar( challenge ),
        decompressed_pk,
        proof.response
    );
    /*
    let V = EdwardsPoint::vartime_multiscalar_mul(
            iter::once(self.response).chain(iter::once(self.challenge.neg())),
            iter::once(h).chain(iter::once(self.gamma)),
        );
    */
   const V = EdwardsPoint.vartime_multiscalar_mul(
        [ proof.response, negate_scalar( challenge ) ],
        [ h, gamma ]
    );

    const computed_challenge = vrf10_ed25519_sha512_ell2_compute_challenge(
        compressed_h,
        proof.gamma.compress(),
        U.compress(),
        V.compress()
    );

    return (
        U.equals( proof.u_point ) &&
        V.equals( proof.v_point )
    );
}

/*
/// `proof_to_hash` function, following the 10 specification. This computes the output of the VRF
    /// function. In particular, this function computes
    /// SHA512(SUITE || THREE || Gamma || ZERO)
    fn proof_to_hash(&self) -> [u8; OUTPUT_SIZE] {
        let mut output = [0u8; OUTPUT_SIZE];
        let gamma_cofac = self.gamma.mul_by_cofactor();
        let mut hash = Sha512::new();
        hash.update(SUITE_TEMP);
        hash.update(THREE);
        hash.update(gamma_cofac.compress().as_bytes());
        hash.update(ZERO);

        output.copy_from_slice(hash.finalize().as_slice());
        output
    }
*/
function vrf10_proof_to_hash( proof: IVrfProof10Batch ): Uint8Array & { length: 64 }
{
    const compressed_gamma_cofac = proof.gamma.mul_by_cofactor().compress();
    const hashInput = new Uint8Array( 3 + compressed_gamma_cofac.length );
    hashInput[0] = SUITE_TEMP;
    hashInput[1] = 0x03;
    hashInput.set( compressed_gamma_cofac, 2 );
    hashInput[2 + compressed_gamma_cofac.length] = 0;

    return sha2_512_sync( hashInput );
}

/*
function vrfProofToBytesProof( proof: IVrfProof10Batch )
{
    return {
        gamma: bigpointToUint8Array( proof.gamma ),
        challange: encodeInt( proof.challange ),
        response: encodeInt( proof.response ),
    }
}
//*/

function edwards_hash_from_bytes( bytes: Uint8Array ): EdwardsPoint
{
    const hash = sha2_512_sync( bytes );
    const res = hash.slice(0,32);

    /*
        //////////////////////////////////////////////////////////////////////////////////////
        //// We need to be compatible with the third version of the VRF standard, which   ////
        //// always unsets the sign bit. Given the visibility of the functions used to    ////
        //// compute the ristretto mapping, we need to fork the original repo, to unset   ////
        //// bit in this function. This fork should never be used, unless one needs to be ////
        //// compatible with the version 3 of the VRF standard.                           ////
        //// https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-vrf-10#section-5.4.1.2 ////
        //// The goal is to be always a single commit ahead of version 3.2.0, and this    ////
        //// single commit only changes the following line, and a disclaimer in the       ////
        //// README.                                                                      ////
        //////////////////////////////////////////////////////////////////////////////////////
        let sign_bit = 0;

        let fe = FieldElement::from_bytes(&res);

        let M1 = crate::montgomery::elligator_encode(&fe);
        let E1_opt = M1.to_edwards(sign_bit);

        E1_opt
            .expect("Montgomery conversion to Edwards point in Elligator failed")
            .mul_by_cofactor()
    */
    let sign_bit = 0 as const;

    const fe = FieldElem51.fromBytes( res );

    const M1 = FieldElem51.elligator_encode( fe );

    const E1_opt = M1.to_edwards( sign_bit );

    if( !E1_opt )
    {
        throw new Error( "Montgomery conversion to Edwards point in Elligator failed" );
    }

    return E1_opt.mul_by_cofactor();
}

/*
// Construct a `Scalar` from the low 255 bits of a 256-bit integer.
    ///
    /// This function is intended for applications like X25519 which
    /// require specific bit-patterns when performing scalar
    /// multiplication.
    pub const fn from_bits(bytes: [u8; 32]) -> Scalar {
        let mut s = Scalar{bytes};
        // Ensure that s < 2^255 by masking the high bit
        s.bytes[31] &= 0b0111_1111;

        s
    }
*/
function scalar_from_bits_inplace( bytes: Uint8Array ): void
{
    bytes[31] &= 0b0111_1111;
}

/**
 * https://datatracker.ietf.org/doc/html/rfc9381#section-5.1
 * 
 * test cases:
 * https://datatracker.ietf.org/doc/html/rfc9381#name-ecvrf-edwards25519-sha512-e
 * https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-vrf-10#appendix-A.4
 * 
 * /// Generate a new VRF proof following the 10 standard. It proceeds as follows:
 * /// - Extend the secret key, into a `secret_scalar` and the `secret_extension`
 * /// - Evaluate `hash_to_curve` over PK || alpha_string to get `H`
 * /// - Compute `Gamma = secret_scalar *  H`
 * /// - Generate a proof of discrete logarithm equality between `PK` and `Gamma` with
 * ///   bases `generator` and `H` respectively.
 *
 * /
function vrf_ed25519_sha512_ell2_prove(sk: Uint8Array, alpha: Uint8Array): IVrfProof10Batch
{
    /// - Extend the secret key, into a `secret_scalar` and the `secret_extension`
    const [ scalar, extension ] = getExtendEd25519PrivateKeyComponents_sync( sk );
    // 1. Use SK to derive the VRF secret scalar x and the VRF public key Y = x*B
    /// - Evaluate `hash_to_curve` over PK || alpha_string to get `H`
    const pk = new Uint8Array( deriveEd25519PublicKey_sync( sk ) );
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
//*/