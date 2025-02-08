
let hasGlobalThis = true;

try {
    hasGlobalThis = typeof globalThis !== "undefined";
} catch { hasGlobalThis = false; }

let _hasGlobalWebCrypto = hasGlobalThis;
if( hasGlobalThis ) {
    try {
        _hasGlobalWebCrypto = (
            typeof globalThis.crypto !== "undefined" &&
            typeof globalThis.crypto.subtle !== "undefined"
        );
    } catch { _hasGlobalWebCrypto = false; }
}

export const hasGlobalWebCrypto = _hasGlobalWebCrypto;