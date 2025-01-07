import { fromHex, fromUtf8 } from "@harmoniclabs/uint8array-utils";
import { RIPEMD160 } from "./noble/ripemd_160";

export function ripemd160(input: Uint8Array | string): Uint8Array {
    if (typeof input === "string") {
        if( input.startsWith("0x") ) input = fromHex(input.toLowerCase().slice(2));
        else if( isHex(input) ) input = fromHex(input.toLowerCase());
        else input = fromUtf8(input);
    }
    if (!(input instanceof Uint8Array)) throw new Error("ripemd160: input must be Uint8Array or string");
    return new RIPEMD160().update(input).digest();
}

function isHex(str: string): boolean {
    return /^[0-9A-Fa-f]*$/.test(str);
}