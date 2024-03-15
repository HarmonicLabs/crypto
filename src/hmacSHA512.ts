import { hmac } from "./noble/hmac";
import { sha512 } from "./noble/sha512";

export function hmacSHA512( key: Uint8Array, data: Uint8Array )
{
    return new Uint8Array( hmac( sha512, key, data ) )
}