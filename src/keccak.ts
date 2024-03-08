import * as noble from "./noble/keccak";

export function keccak_256( msg: Uint8Array ): Uint8Array
{
    return noble.keccak_256( msg );
}

export function keccak_224( msg: Uint8Array ): Uint8Array
{
    return noble.keccak_224( msg );
}

export function keccak_384( msg: Uint8Array ): Uint8Array
{
    return noble.keccak_384( msg );
}

export function keccak_512( msg: Uint8Array ): Uint8Array
{
    return noble.keccak_512( msg );
}