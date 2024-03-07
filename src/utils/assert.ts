export function assert( condition: boolean, errorMessage: string | Error , addInfos?: any  ,...args: any[])
{
    if( condition ) return;
    
    args.length > 0 && console.error(...args);
    addInfos && console.error(addInfos);

    if( errorMessage instanceof Error )
    {
        throw errorMessage
    };

    throw new Error( errorMessage );
}

// keccak asserts
export function assertPostiveInteger( n: any ): void
{
    if (!Number.isSafeInteger(n) || n < 0) throw new Error(`positive integer expected, not ${n}`);
}

export function assertBytes( stuff: any ): void
{
    if(!( stuff instanceof Uint8Array )) throw new Error("Uint8Array expected");
}