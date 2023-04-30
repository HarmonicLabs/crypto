import { assert } from "./assert";
import { fromHex } from "@harmoniclabs/uint8array-utils";

export function bigintToBuffer( bigint: bigint, nBytes: number | undefined = undefined ): Uint8Array
{
    assert(
        bigint >= BigInt( 0 ),
        "cannot convert negative bigint to buffer"
    );

    if( bigint == BigInt( 0 ) )
    {
        if(nBytes === undefined)
        {
            return Uint8Array.from( [] );
        }

        return new Uint8Array( nBytes )
    }
    
    let buffHexString = bigint.toString(16);
    buffHexString = buffHexString.length % 2 === 0 ? buffHexString : '0' + buffHexString;


    if( nBytes !== undefined )
    {
        assert(
            Math.round( Math.abs( nBytes ) ) === nBytes,
            "cannot construct a buffer of length " + nBytes + ", while using BigIntUtils.toBufferOfNBytesBE"
        );

        // pads with zeroes so that the final length is of nBytes*2 (2 hex digits per byte)
        // String.prototype.padStart docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
        buffHexString = buffHexString.padStart( nBytes * 2, "00" );  
        
        if( buffHexString.length > nBytes * 2 )
        {
            console.warn(
                "required buffer size is smaller than the one used effectively by the given bigint, truncating the initial bytes as overflow"
            );

            buffHexString = buffHexString.slice( buffHexString.length - (nBytes * 2) );
        }
    }

    return fromHex( buffHexString );
}