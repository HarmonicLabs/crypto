import { hmac } from "./noble/hmac";
import { sha512 } from "./noble/sha512";

/**
 * here because we need it in `@harmoniclabs/bip32_ed25519`
 * 
 * and in particular, because it is a dependency of `pbkdf2` (which could also be calculated using native webcrypto)
 */
export function hmacSHA512( key: Uint8Array, data: Uint8Array )
{
    return new Uint8Array( hmac( sha512, key, data ) )
}