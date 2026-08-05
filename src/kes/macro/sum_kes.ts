export interface IKesSk {
    sign( msg: Uint8Array ): Uint8Array;
}

export interface KesSkClass { new(): IKesSk };

export interface IKesSig {
    sigma: IKesSig;
    lhs_pk: Uint8Array;
    rhs_pk: Uint8Array;
};

export interface KesSigClass { new(): IKesSig };

export function sum_kes(
    prev_kes_class: KesSkClass,
    prev_sig_class: KesSigClass,
): void // [ KesSkClass, KesSigClass ]
{

}