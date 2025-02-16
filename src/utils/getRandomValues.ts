import { hasGlobalWebCrypto } from "../hasGlobalWebCrypto";

function _getRandomValues( buff: Uint8Array): Uint8Array
{
    for( let i = 0; i < buff.length; i++ )
    {
        buff[i] = ( Math.random() * 256 ) >>> 0;
    }
    return buff;
}

/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Crypto/getRandomValues) */
export const getRandomValues = hasGlobalWebCrypto ? globalThis.crypto.getRandomValues.bind( globalThis.crypto ) : _getRandomValues;