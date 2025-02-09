import { assert } from "./assert";
import { fromHex } from "@harmoniclabs/uint8array-utils";

export function bigintToBuffer( bigint: bigint, nBytes: number | undefined = undefined ): Uint8Array
{
    if( bigint < BigInt( 0 ) )
        throw new Error( "cannot convert negative bigint to buffer" );
    if( typeof nBytes !== "number" ) nBytes = undefined;

    if( bigint === BigInt( 0 ) )
    {
        if(nBytes === undefined) nBytes = 0;
        return new Uint8Array( nBytes )
    }
    
    let buffHexString = bigint.toString(16);
    buffHexString = buffHexString.length % 2 === 0 ? buffHexString : '0' + buffHexString;

    if( typeof nBytes === "number" )
    {
        nBytes = Math.round( Math.abs( nBytes ) );
        buffHexString = buffHexString.padStart( nBytes * 2, "00" );  
        
        if( buffHexString.length > nBytes * 2 )
            // only keep the last nBytes
            buffHexString = buffHexString.slice( buffHexString.length - (nBytes * 2) );
    }

    return fromHex( buffHexString );
}