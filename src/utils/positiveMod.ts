const _0n = BigInt(0);

export function positiveMod(x: bigint, n: bigint): bigint
{
    n = typeof n === "bigint" ? n : BigInt( n );
    x = typeof x === "bigint" ? x : BigInt( x );
	const res = x % n;
    return res < _0n ? res + n : res;
}