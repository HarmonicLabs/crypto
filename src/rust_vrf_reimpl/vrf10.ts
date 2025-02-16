import { uint8ArrayEq } from "@harmoniclabs/uint8array-utils";
import { sha2_512_sync } from "../sha2_512";
import { add_scalars, decompressCompressedEdwardsY, ED25519_BASEPOINT_POINT, EdwardsPoint, FieldElem51, mul_scalars, negate_scalar, scalar_from_bytes_mod_order_wide } from "./curves";

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

export interface IVrfProof10 {
    gamma: EdwardsPoint;
    challenge: Uint8Array;
    response: Uint8Array;
}

/*
pub fn extend(&self) -> (Scalar, [u8; 32]) {
    let mut h: Sha512 = Sha512::new();
    let mut extended = [0u8; 64];
    let mut secret_key_bytes = [0u8; 32];
    let mut extension = [0u8; 32];

    h.update(self.as_bytes());
    extended.copy_from_slice(&h.finalize().as_slice()[..64]);

    secret_key_bytes.copy_from_slice(&extended[..32]);
    extension.copy_from_slice(&extended[32..]);

    secret_key_bytes[0] &= 248;
    secret_key_bytes[31] &= 127;
    secret_key_bytes[31] |= 64;

    (Scalar::from_bits(secret_key_bytes), extension)
}
*/
export function extend_secret_key( secret_key: Uint8Array ): [ scalar: Uint8Array, extension: Uint8Array ]
{
    const extended = sha2_512_sync( secret_key );
    const secret_key_bytes = extended.slice(0,32);
    const extension = extended.slice(32,64);

    secret_key_bytes[0] &= 248;
    secret_key_bytes[31] &= 127;
    secret_key_bytes[31] |= 64;

    adjust_scalar_bits( secret_key_bytes );
    return [ secret_key_bytes, extension ];
}

export function adjust_scalar_bits( bytes: Uint8Array ): void
{
    bytes[31] &= 0b0111_1111;
}

export function vrf10_ed25519_sha512_ell2_generate_proof(
    secret_key: Uint8Array,
    public_key: Uint8Array,
    alpha_string: Uint8Array
): IVrfProof10
{
    const [ secret_scalar, secret_extension ] = extend_secret_key( secret_key );

    const h = vrf10_ed25519_sha512_ell2_hash_to_curve( public_key, alpha_string );
    const compressed_h = h.compress();

    const gamma = h.scalarMul( secret_scalar );
    const compressed_gamma = gamma.compress();

    const k = vrf10_ed25519_sha512_ell2_nonce_generation( secret_extension, compressed_h );

    const compressed_announcement_base = ED25519_BASEPOINT_POINT.scalarMul( k ).compress();
    const compressed_announcement_h = h.scalarMul( k ).compress();

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
        challenge,
        response
    };
}

/*
/// Verify VRF function, following the 10 specification.
    pub fn verify(
        &self,
        public_key: &PublicKey10,
        alpha_string: &[u8],
    ) -> Result<[u8; OUTPUT_SIZE], VrfError> {
        let h = Self::hash_to_curve(public_key, alpha_string);
        let compressed_h = h.compress();

        let decompressed_pk = public_key
            .0
            .decompress()
            .ok_or(VrfError::DecompressionFailed)?;

        if decompressed_pk.is_small_order() {
            return Err(VrfError::PkSmallOrder);
        }

        let U = EdwardsPoint::vartime_double_scalar_mul_basepoint(
            &self.challenge.neg(),
            &decompressed_pk,
            &self.response,
        );
        let V = EdwardsPoint::vartime_multiscalar_mul(
            iter::once(self.response).chain(iter::once(self.challenge.neg())),
            iter::once(h).chain(iter::once(self.gamma)),
        );

        // Now we compute the challenge
        let challenge = Self::compute_challenge(&compressed_h, &self.gamma, &U, &V);

        if challenge.to_bytes()[..16] == self.challenge.to_bytes()[..16] {
            Ok(self.proof_to_hash())
        } else {
            Err(VrfError::VerificationFailed)
        }
    }
*/
export function vrf10_ed25519_sha512_ell2_verify_proof(
    public_key: Uint8Array,
    alpha_string: Uint8Array,
    proof: IVrfProof10
): boolean
{
    const h = vrf10_ed25519_sha512_ell2_hash_to_curve( public_key, alpha_string );
    const compressed_h = h.compress();

    const decompressed_pk = decompressCompressedEdwardsY( public_key );// pointFromBytes( public_key );

    if( !decompressed_pk || decompressed_pk.is_small_order() ) return false;

    // Scalar
    const proof_challenge = proof.challenge;

    const U = EdwardsPoint.vartime_double_scalar_mul_basepoint(
        negate_scalar( proof_challenge ),
        decompressed_pk,
        proof.response
    );
    const gamma = proof.gamma;
    /*
    let V = EdwardsPoint::vartime_multiscalar_mul(
            iter::once(self.response).chain(iter::once(self.challenge.neg())),
            iter::once(h).chain(iter::once(self.gamma)),
        );
    */
   const V = EdwardsPoint.vartime_multiscalar_mul(
        [ proof.response, negate_scalar( proof_challenge ) ],
        [ h, gamma ]
    );

    const computed_challenge = vrf10_ed25519_sha512_ell2_compute_challenge(
        compressed_h,
        proof.gamma.compress(),
        U.compress(),
        V.compress()
    );

    return uint8ArrayEq(
        computed_challenge.slice( 0, 16 ),
        proof_challenge.slice( 0, 16 )
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
export function vrf10_proof_to_hash( proof: IVrfProof10 ): Uint8Array & { length: 64 }
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
export function vrfProofToBytesProof( proof: IVrfProof10 )
{
    return {
        gamma: bigpointToUint8Array( proof.gamma ),
        challange: encodeInt( proof.challange ),
        response: encodeInt( proof.response ),
    }
}
//*/

export function edwards_hash_from_bytes( bytes: Uint8Array ): EdwardsPoint
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
/// Computing the `hash_to_curve` using try and increment. In order to make the
    /// function always terminate, we bound  the number of tries to 64. If the try
    /// 64 fails, which happens with probability around 1/2^64, we compute the
    /// Elligator mapping. This diverges from the standard: the latter describes
    /// the function with an infinite loop. To avoid infinite loops or possibly
    /// non-terminating functions, we adopt this modification.
    /// This function is temporary, until `curve25519` provides a `hash_to_curve` as
    /// presented in the standard. Depends on
    /// [this pr](https://github.com/dalek-cryptography/curve25519-dalek/pull/377). The
    /// goal of providing this temporary function, is to ensure that the rest of the
    /// implementation is valid with respect to the standard, by using their test-vectors.
    pub(crate) fn hash_to_curve(public_key: &PublicKey10, alpha_string: &[u8]) -> EdwardsPoint {
        let mut counter = 0u8;
        let mut hash_input = Vec::with_capacity(4 + PUBLIC_KEY_SIZE + alpha_string.len());
        hash_input.extend_from_slice(SUITE_TEMP);
        hash_input.extend_from_slice(ONE);
        hash_input.extend_from_slice(public_key.as_bytes());
        hash_input.extend_from_slice(alpha_string);
        hash_input.extend_from_slice(&counter.to_be_bytes());
        hash_input.extend_from_slice(ZERO);

        while counter < 64 {
            hash_input[2 + PUBLIC_KEY_SIZE + alpha_string.len()] = counter.to_be_bytes()[0];
            if let Some(result) =
                CompressedEdwardsY::from_slice(&Sha512::digest(&hash_input)[..32]).decompress()
            {
                return result.mul_by_cofactor();
            };

            counter += 1;
        }

        EdwardsPoint::hash_from_bytes::<Sha512>(&hash_input)
    }
*/
/**
 * Computing the `hash_to_curve` using try and increment. In order to make the
 * function always terminate, we bound  the number of tries to 64. If the try
 * 64 fails, which happens with probability around 1/2^64, we compute the
 * Elligator mapping. This diverges from the standard: the latter describes
 * the function with an infinite loop. To avoid infinite loops or possibly
 * non-terminating functions, we adopt this modification.
 * This function is temporary, until `curve25519` provides a `hash_to_curve` as
 * presented in the standard. Depends on
 * [this pr](https://github.com/dalek-cryptography/curve25519-dalek/pull/377). The
 * goal of providing this temporary function, is to ensure that the rest of the
 * implementation is valid with respect to the standard, by using their test-vectors.
**/
export function vrf10_ed25519_sha512_ell2_hash_to_curve(
    public_key: Uint8Array,
    alpha_string: Uint8Array
): EdwardsPoint 
{
    let counter_u8 = 0;
    const input = new Uint8Array(4 + 32 + alpha_string.length);
    input[0] = SUITE_TEMP;
    input[1] = ONE;
    input.set(public_key.slice(0,32), 2);
    input.set(alpha_string, 34);
    input[34 + alpha_string.length] = counter_u8;
    input[35 + alpha_string.length] = 0;

    while( counter_u8 < 64 )
    {
        input[34 + alpha_string.length] = counter_u8;
        const result = decompressCompressedEdwardsY( sha2_512_sync( input ).slice(0,32) );
        if( result ) return result.mul_by_cofactor();
        ++counter_u8;
    }

    return edwards_hash_from_bytes( input ); // sha2_512_sync(input);
}

export function scalar_hash_from_bytes( input: Uint8Array ): Uint8Array
{
    return scalar_from_bytes_mod_order_wide( sha2_512_sync( input ) );
}

export function vrf10_ed25519_sha512_ell2_nonce_generation(
    secret_extension: Uint8Array,
    compressed_h: Uint8Array,
): Uint8Array
{
    const input = new Uint8Array( 64 );
    input.set( secret_extension.slice(0,32), 0 );
    input.set( compressed_h.slice(0,32), 32 );
    //return pointFromBytes(sha2_512_sync(input))
    return scalar_hash_from_bytes(input);
}

/*
/// Hash points function, following the 10 specification.
    fn compute_challenge(
        compressed_h: &CompressedEdwardsY,
        gamma: &EdwardsPoint,
        announcement_1: &EdwardsPoint,
        announcement_2: &EdwardsPoint,
    ) -> Scalar {
        // we use a scalar of 16 bytes (instead of 32), but store it in 32 bits, as that is what
        // `Scalar::from_bits()` expects.
        let mut scalar_bytes = [0u8; 32];
        let mut challenge_hash = Sha512::new();
        challenge_hash.update(SUITE);
        challenge_hash.update(TWO);
        challenge_hash.update(compressed_h.to_bytes());
        challenge_hash.update(gamma.compress().as_bytes());
        challenge_hash.update(announcement_1.compress().as_bytes());
        challenge_hash.update(announcement_2.compress().as_bytes());

        scalar_bytes[..16].copy_from_slice(&challenge_hash.finalize().as_slice()[..16]);

        Scalar::from_bits(scalar_bytes)
    }
* /
export function vrf_ed25519_sha512_ell2_challenge_generation(
    H: Uint8Array,
    gamma: Uint8Array,
    announcement_1: Uint8Array,
    announcement_2: Uint8Array,
): Uint8Array
{
    // const input = new Uint8Array( 2 + H.length + gamma.length + announcement_1.length + announcement_2.length );
    // input[0] = SUITE;
    // input[1] = TWO;
    // input.set( H, 2 );
    // input.set( gamma, 2 + H.length );
    // input.set( announcement_1, 2 + H.length + gamma.length );
    // input.set( announcement_2, 2 + H.length + gamma.length + announcement_1.length );
    // return sha2_512_sync(input).slice(0,16);
}
//*/

/*
/// Hash points function, following the 10 specification.
    pub(crate) fn compute_challenge(
        compressed_h: &CompressedEdwardsY,
        gamma: &EdwardsPoint,
        announcement_1: &EdwardsPoint,
        announcement_2: &EdwardsPoint,
    ) -> Scalar {
        // we use a scalar of 16 bytes (instead of 32), but store it in 32 bits, as that is what
        // `Scalar::from_bits()` expects.
        let mut scalar_bytes = [0u8; 32];
        let mut challenge_hash = Sha512::new();
        challenge_hash.update(SUITE_TEMP);
        challenge_hash.update(TWO);
        challenge_hash.update(compressed_h.to_bytes());
        challenge_hash.update(gamma.compress().as_bytes());
        challenge_hash.update(announcement_1.compress().as_bytes());
        challenge_hash.update(announcement_2.compress().as_bytes());
        challenge_hash.update(ZERO);

        scalar_bytes[..16].copy_from_slice(&challenge_hash.finalize().as_slice()[..16]);

        Scalar::from_bits(scalar_bytes)
    }
*/
export function vrf10_ed25519_sha512_ell2_compute_challenge(
    compressed_h: Uint8Array,
    compressed_gamma: Uint8Array,
    compressed_announcement_1: Uint8Array,
    compressed_announcement_2: Uint8Array,
): Uint8Array
{
    const scalar_bytes = new Uint8Array( 32 );
    const hash_input = new Uint8Array(
        3 +
        compressed_h.length +
        compressed_gamma.length +
        compressed_announcement_1.length +
        compressed_announcement_2.length
    );
    hash_input[0] = SUITE_TEMP;
    hash_input[1] = TWO;
    let len = 2;
    hash_input.set( compressed_h, len );
    len += compressed_h.length;
    hash_input.set( compressed_gamma, len );
    len += compressed_gamma.length;
    hash_input.set( compressed_announcement_1, len );
    len += compressed_announcement_1.length;
    hash_input.set( compressed_announcement_2, len);
    hash_input[len + compressed_announcement_2.length] = 0;
    
    const hash = sha2_512_sync( hash_input );
    scalar_bytes.set( hash.slice(0,16), 0 );

    scalar_from_bits_inplace( scalar_bytes );
    return scalar_bytes;
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
export function scalar_from_bits_inplace( bytes: Uint8Array ): void
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
export function vrf_ed25519_sha512_ell2_prove(sk: Uint8Array, alpha: Uint8Array): IVrfProof10
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