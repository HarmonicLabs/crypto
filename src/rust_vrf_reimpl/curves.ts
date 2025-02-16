import { uint8ArrayEq } from "@harmoniclabs/uint8array-utils";

function load8(bytes: DataView | Uint8Array, offset: number): bigint {
    const dataView = bytes instanceof DataView ? bytes : new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return dataView.getBigUint64(offset, true);
}

const _0n = BigInt( 0 );
const _1n = BigInt( 1 );
const _51n = BigInt( 51 );
const _52n = BigInt( 52 );
const _64n = BigInt( 64 );

const LOW_51_BIT_MASK = ( _1n << _51n ) - _1n;
const LOW_52_BIT_MASK = ( _1n << _52n ) - _1n;
const LOW_64_BIT_MASK = ( _1n << _64n ) - _1n;

function innerConditionalAssign( self: bigint, other: bigint, choice: boolean ): bigint
{
    // if choice = 0, mask = (-0) = 0000...0000
    // if choice = 1, mask = (-1) = 1111...1111
    // return self ^ ( choice ? ( self ^ other ) : _0n );
    // const mask = choice ? (_1n << _64n) - _1n : _0n;
    // return self ^ ( mask & ( self ^ other ) );

    return choice ? other : self;
}

export class FieldElem51
{
    constructor(
        readonly bytes: BigUint64Array
    ) {}

    static zero(): FieldElem51
    {
        return new FieldElem51(
            new BigUint64Array([
                _0n,
                _0n,
                _0n,
                _0n,
                _0n
            ])
        );
    }

    static one(): FieldElem51
    {
        return new FieldElem51(
            new BigUint64Array([
                _1n,
                _0n,
                _0n,
                _0n,
                _0n,
            ])
        );
    }

    /*
    /// Construct -1.
    pub fn minus_one() -> FieldElem51 {
        FieldElem51([2251799813685228, 2251799813685247, 2251799813685247, 2251799813685247, 2251799813685247])
    }
    */
    static minus_one(): FieldElem51
    {
        return new FieldElem51(
            new BigUint64Array([
                BigInt( "2251799813685228" ),
                BigInt( "2251799813685247" ),
                BigInt( "2251799813685247" ),
                BigInt( "2251799813685247" ),
                BigInt( "2251799813685247" ),
            ])
        )
    }

    static get EDWARDS_D(): FieldElem51
    {
        return new FieldElem51(
            new BigUint64Array([
                BigInt( "929955233495203" ),
                BigInt( "466365720129213" ),
                BigInt( "1662059464998953" ),
                BigInt( "2033849074728123" ),
                BigInt( "1442794654840575" ),
            ])
        );
    }

    static get EDWARDS_D2(): FieldElem51
    {
        return new FieldElem51(
            new BigUint64Array([
                BigInt( "1859910466990425" ),
                BigInt( "932731440258426" ),
                BigInt( "1072319116312658" ),
                BigInt( "1815898335770999" ),
                BigInt( "633789495995903" ),
            ])
        );
    }

    static fromBytes( bytes: Uint8Array ): FieldElem51
    {
        const dataView = new DataView( bytes.buffer, bytes.byteOffset, bytes.byteLength );
        return new FieldElem51(
            new BigUint64Array([
                  load8( dataView, 0 )                     & LOW_51_BIT_MASK,
                ( load8( dataView, 6  ) >> BigInt( 3  ) )  & LOW_51_BIT_MASK,
                ( load8( dataView, 12 ) >> BigInt( 6  ) )  & LOW_51_BIT_MASK,
                ( load8( dataView, 19 ) >> BigInt( 1  ) )  & LOW_51_BIT_MASK,
                ( load8( dataView, 24 ) >> BigInt( 12 ) )  & LOW_51_BIT_MASK,
            ])
        );
    }

    /*
    #[allow(unused)]
    pub(crate) fn elligator_encode(r_0: &FieldElement) -> MontgomeryPoint {
        let one = FieldElement::one();
        let d_1 = &one + &r_0.square2(); / * 2r^2 * /
    
        let d = &MONTGOMERY_A_NEG * &(d_1.invert()); // * A/(1+2r^2) * /
    
        let d_sq = &d.square();
        let au = &MONTGOMERY_A * &d;
    
        let inner = &(d_sq + &au) + &one;
        let eps = &d * &inner; // * eps = d^3 + Ad^2 + d * /
    
        let (eps_is_sq, _eps) = FieldElement::sqrt_ratio_i(&eps, &one);
    
        let zero = FieldElement::zero();
        let Atemp = FieldElement::conditional_select(&MONTGOMERY_A, &zero, eps_is_sq); /* 0, or A if nonsquare* /
        let mut u = &d + &Atemp; /* d, or d+A if nonsquare * /
        u.conditional_negate(!eps_is_sq); /* d, or -d-A if nonsquare * /
    
        MontgomeryPoint(u.to_bytes())
    }
    */
    static elligator_encode( r_0: FieldElem51 ): MontgomeryPoint
    {
        const one = FieldElem51.one();
        const d_1 = one.add( r_0.square2() );
    
        // const d = d_1.invert().mul( FieldElem51.fromBytes( new Uint8Array( 32 ) ) );
        const d = FieldElem51.MONTGOMERY_A_NEG.mul( d_1.invert() );
    
        const MONTGOMERY_A = FieldElem51.MONTGOMERY_A;
        const d_sq = d.square();
        const au = MONTGOMERY_A.mul( d );
    
        const inner = d_sq.add( au ).add( one );
        const eps = d.mul( inner );
    
        const [ eps_is_sq, _eps ] = FieldElem51.sqrt_ratio_i( eps, one );
    
        const zero = FieldElem51.zero();
        // let Atemp = FieldElement::conditional_select(&MONTGOMERY_A, &zero, eps_is_sq); /* 0, or A if nonsquare*/
        const Atemp = FieldElem51.conditional_select( MONTGOMERY_A, zero, eps_is_sq );
        let u = d.add( Atemp );

        u.conditional_negate( !eps_is_sq );
    
        return new MontgomeryPoint( u.toBytes() );
    }

    static elligator_encode_var_time( r_0: FieldElem51 ): MontgomeryPoint
    {
        const one = FieldElem51.one();
        const d_1 = one.add( r_0.square2() );
    
        // const d = d_1.invert().mul( FieldElem51.fromBytes( new Uint8Array( 32 ) ) );
        const d = FieldElem51.MONTGOMERY_A_NEG.mul( d_1.invert() );
    
        const MONTGOMERY_A = FieldElem51.MONTGOMERY_A;
        const d_sq = d.square();
        const au = MONTGOMERY_A.mul( d );
    
        const inner = d_sq.add( au ).add( one );
        const eps = d.mul( inner );
    
        const [ eps_is_sq, _eps ] = FieldElem51.sqrt_ratio_i( eps, one );
    
        const zero = FieldElem51.zero();
        // let Atemp = FieldElement::conditional_select(&MONTGOMERY_A, &zero, eps_is_sq); /* 0, or A if nonsquare*/
        const Atemp = FieldElem51.conditional_select( MONTGOMERY_A, zero, eps_is_sq );
        let u = d.add( Atemp );

        u.conditional_negate( !eps_is_sq );
    
        return new MontgomeryPoint( u.toBytes() );
    }

    /*
    fn conditional_select(
        a: &FieldElement51,
        b: &FieldElement51,
        choice: Choice,
    ) -> FieldElement51 {
        FieldElement51([
            u64::conditional_select(&a.0[0], &b.0[0], choice),
            u64::conditional_select(&a.0[1], &b.0[1], choice),
            u64::conditional_select(&a.0[2], &b.0[2], choice),
            u64::conditional_select(&a.0[3], &b.0[3], choice),
            u64::conditional_select(&a.0[4], &b.0[4], choice),
        ])
    }
        // u64::conditional_select(&a.0[0], &b.0[0], choice),
        #[inline]
            fn conditional_select(a: &Self, b: &Self, choice: Choice) -> Self {
                // if choice = 0, mask = (-0) = 0000...0000
                // if choice = 1, mask = (-1) = 1111...1111
                let mask = -(choice.unwrap_u8() as to_signed_int!($t)) as $t;
                a ^ (mask & (a ^ b))
            }
    */
    static conditional_select(
        a: FieldElem51,
        b: FieldElem51,
        choice: boolean
    ): FieldElem51
    {
        const mask = choice ? LOW_64_BIT_MASK : _0n;
        const a_bytes = a.bytes;
        const b_bytes = b.bytes;
        return new FieldElem51(
            new BigUint64Array([
                a_bytes[0] ^ ( mask & ( a_bytes[0] ^ b_bytes[0] ) ),
                a_bytes[1] ^ ( mask & ( a_bytes[1] ^ b_bytes[1] ) ),
                a_bytes[2] ^ ( mask & ( a_bytes[2] ^ b_bytes[2] ) ),
                a_bytes[3] ^ ( mask & ( a_bytes[3] ^ b_bytes[3] ) ),
                a_bytes[4] ^ ( mask & ( a_bytes[4] ^ b_bytes[4] ) ),
            ])
        );
    }

    static get MONTGOMERY_A_NEG(): FieldElem51
    {
        return new FieldElem51(
            new BigUint64Array([
                BigInt( "2251799813198567" ),
                BigInt( "2251799813685247" ),
                BigInt( "2251799813685247" ),
                BigInt( "2251799813685247" ),
                BigInt( "2251799813685247" ),
            ])
        );
    }

    static get MONTGOMERY_A(): FieldElem51
    {
        return new FieldElem51(
            new BigUint64Array([
                BigInt( "486662" ),
                _0n,
                _0n,
                _0n,
                _0n,
            ])
        )
    }

    pow2k( k: number ): FieldElem51
    {
        /*
        pub fn pow2k(&self, mut k: u32) -> FieldElem51 {

        debug_assert!( k > 0 );

        /// Multiply two 64-bit integers with 128 bits of output.
        #[inline(always)]
        fn m(x: u64, y: u64) -> u128 { (x as u128) * (y as u128) }

        let mut a: [u64; 5] = self.0;

        loop {
            // Precondition: assume input limbs a[i] are bounded as
            //
            // a[i] < 2^(51 + b)
            //
            // where b is a real parameter measuring the "bit excess" of the limbs.

            // Precomputation: 64-bit multiply by 19.
            //
            // This fits into a u64 whenever 51 + b + lg(19) < 64.
            //
            // Since 51 + b + lg(19) < 51 + 4.25 + b
            //                       = 55.25 + b,
            // this fits if b < 8.75.
            let a3_19 = 19 * a[3];
            let a4_19 = 19 * a[4];

            // Multiply to get 128-bit coefficients of output.
            //
            // The 128-bit multiplications by 2 turn into 1 slr + 1 slrd each,
            // which doesn't seem any better or worse than doing them as precomputations
            // on the 64-bit inputs.
            let     c0: u128 = m(a[0],  a[0]) + 2*( m(a[1], a4_19) + m(a[2], a3_19) );
            let mut c1: u128 = m(a[3], a3_19) + 2*( m(a[0],  a[1]) + m(a[2], a4_19) );
            let mut c2: u128 = m(a[1],  a[1]) + 2*( m(a[0],  a[2]) + m(a[4], a3_19) );
            let mut c3: u128 = m(a[4], a4_19) + 2*( m(a[0],  a[3]) + m(a[1],  a[2]) );
            let mut c4: u128 = m(a[2],  a[2]) + 2*( m(a[0],  a[4]) + m(a[1],  a[3]) );

            // Same bound as in multiply:
            //    c[i] < 2^(102 + 2*b) * (1+i + (4-i)*19)
            //         < 2^(102 + lg(1 + 4*19) + 2*b)
            //         < 2^(108.27 + 2*b)
            //
            // The carry (c[i] >> 51) fits into a u64 when
            //    108.27 + 2*b - 51 < 64
            //    2*b < 6.73
            //    b < 3.365.
            //
            // So we require b < 3 to ensure this fits.
            debug_assert!(a[0] < (1 << 54));
            debug_assert!(a[1] < (1 << 54));
            debug_assert!(a[2] < (1 << 54));
            debug_assert!(a[3] < (1 << 54));
            debug_assert!(a[4] < (1 << 54));

            const LOW_51_BIT_MASK: u64 = (1u64 << 51) - 1;

            // Casting to u64 and back tells the compiler that the carry is bounded by 2^64, so
            // that the addition is a u128 + u64 rather than u128 + u128.
            c1 += ((c0 >> 51) as u64) as u128;
            a[0] = (c0 as u64) & LOW_51_BIT_MASK;

            c2 += ((c1 >> 51) as u64) as u128;
            a[1] = (c1 as u64) & LOW_51_BIT_MASK;

            c3 += ((c2 >> 51) as u64) as u128;
            a[2] = (c2 as u64) & LOW_51_BIT_MASK;

            c4 += ((c3 >> 51) as u64) as u128;
            a[3] = (c3 as u64) & LOW_51_BIT_MASK;

            let carry: u64 = (c4 >> 51) as u64;
            a[4] = (c4 as u64) & LOW_51_BIT_MASK;

            // To see that this does not overflow, we need a[0] + carry * 19 < 2^64.
            //
            // c4 < a2^2 + 2*a0*a4 + 2*a1*a3 + (carry from c3)
            //    < 2^(102 + 2*b + lg(5)) + 2^64.
            //
            // When b < 3 we get
            //
            // c4 < 2^110.33  so that carry < 2^59.33
            //
            // so that
            //
            // a[0] + carry * 19 < 2^51 + 19 * 2^59.33 < 2^63.58
            //
            // and there is no overflow.
            a[0] = a[0] + carry * 19;

            // Now a[1] < 2^51 + 2^(64 -51) = 2^51 + 2^13 < 2^(51 + epsilon).
            a[1] += a[0] >> 51;
            a[0] &= LOW_51_BIT_MASK;

            // Now all a[i] < 2^(51 + epsilon) and a = self^(2^k).

            k = k - 1;
            if k == 0 {
                break;
            }
        }

        FieldElem51(a)
    }
        */

        k = Math.abs( k );
        const a: BigUint64Array = this.bytes.slice();

        while( true )
        {
            const a3_19 = BigInt( 19 ) * a[ 3 ];
            const a4_19 = BigInt( 19 ) * a[ 4 ];

            let c0: bigint = ( a[ 0 ] * a[ 0 ] ) + BigInt( 2 ) * ( ( a[ 1 ] * a4_19  ) + ( a[ 2 ] * a3_19 ) );
            let c1: bigint = ( a[ 3 ] * a3_19  ) + BigInt( 2 ) * ( ( a[ 0 ] * a[ 1 ] ) + ( a[ 2 ] * a4_19 ) );
            let c2: bigint = ( a[ 1 ] * a[ 1 ] ) + BigInt( 2 ) * ( ( a[ 0 ] * a[ 2 ] ) + ( a[ 4 ] * a3_19 ) );
            let c3: bigint = ( a[ 4 ] * a4_19  ) + BigInt( 2 ) * ( ( a[ 0 ] * a[ 3 ] ) + ( a[ 1 ] * a[ 2 ] ) );
            let c4: bigint = ( a[ 2 ] * a[ 2 ] ) + BigInt( 2 ) * ( ( a[ 0 ] * a[ 4 ] ) + ( a[ 1 ] * a[ 3 ] ) );

            c1 += ( c0 >> _51n );
            a[ 0 ] = c0 & LOW_51_BIT_MASK;

            c2 += ( c1 >> _51n );
            a[ 1 ] = c1 & LOW_51_BIT_MASK;

            c3 += ( c2 >> _51n );
            a[ 2 ] = c2 & LOW_51_BIT_MASK;

            c4 += ( c3 >> _51n );
            a[ 3 ] = c3 & LOW_51_BIT_MASK;

            let carry: bigint = ( c4 >> _51n );
            a[ 4 ] = c4 & LOW_51_BIT_MASK;

            a[ 0 ] = a[ 0 ] + carry * BigInt( 19 );

            a[ 1 ] += a[ 0 ] >> _51n;
            a[ 0 ] &= LOW_51_BIT_MASK;

            k = k - 1;
            if( k === 0 ) break;
        }

        return new FieldElem51( a );
    } 

    square2(): FieldElem51
    {
        let square: FieldElem51 = this.pow2k( 1 );
        // for i in 0..5 {
        //     square.0[i] *= 2;
        // }
        for( let i = 0; i < 5; i++ )
        {
            square.bytes[ i ] *= BigInt( 2 );
        }
        return square;
    }

    /*
    fn add_assign(&mut self, _rhs: &'b FieldElem51) {
        for i in 0..5 {
            self.0[i] += _rhs.0[i];
        }
    }
    add(self, _rhs: &'b FieldElem51) -> FieldElem51 {
        let mut output = *self;
        output += _rhs;
        output
    }
    */
    add( _rhs: FieldElem51 ): FieldElem51
    {
        let output: BigUint64Array = this.bytes.slice();
        for( let i = 0; i < 5; i++ )
        {
            output[ i ] += _rhs.bytes[ i ];
        }
        return new FieldElem51( output );
    }

    /*
    /// Given 64-bit input limbs, reduce to enforce the bound 2^(51 + epsilon).
    #[inline(always)]
    fn reduce(mut limbs: [u64; 5]) -> FieldElem51 {
        const LOW_51_BIT_MASK: u64 = (1u64 << 51) - 1;

        // Since the input limbs are bounded by 2^64, the biggest
        // carry-out is bounded by 2^13.
        //
        // The biggest carry-in is c4 * 19, resulting in
        //
        // 2^51 + 19*2^13 < 2^51.0000000001
        //
        // Because we don't need to canonicalize, only to reduce the
        // limb sizes, it's OK to do a "weak reduction", where we
        // compute the carry-outs in parallel.

        let c0 = limbs[0] >> 51;
        let c1 = limbs[1] >> 51;
        let c2 = limbs[2] >> 51;
        let c3 = limbs[3] >> 51;
        let c4 = limbs[4] >> 51;

        limbs[0] &= LOW_51_BIT_MASK;
        limbs[1] &= LOW_51_BIT_MASK;
        limbs[2] &= LOW_51_BIT_MASK;
        limbs[3] &= LOW_51_BIT_MASK;
        limbs[4] &= LOW_51_BIT_MASK;

        limbs[0] += c4 * 19;
        limbs[1] += c0;
        limbs[2] += c1;
        limbs[3] += c2;
        limbs[4] += c3;

        FieldElem51(limbs)
    }
    */
    static reduce( limbs: BigUint64Array ): FieldElem51
    {
        let c0 = limbs[ 0 ] >> _51n;
        let c1 = limbs[ 1 ] >> _51n;
        let c2 = limbs[ 2 ] >> _51n;
        let c3 = limbs[ 3 ] >> _51n;
        let c4 = limbs[ 4 ] >> _51n;

        limbs[ 0 ] &= LOW_51_BIT_MASK;
        limbs[ 1 ] &= LOW_51_BIT_MASK;
        limbs[ 2 ] &= LOW_51_BIT_MASK;
        limbs[ 3 ] &= LOW_51_BIT_MASK;
        limbs[ 4 ] &= LOW_51_BIT_MASK;

        limbs[ 0 ] += c4 * BigInt( 19 );
        limbs[ 1 ] += c0;
        limbs[ 2 ] += c1;
        limbs[ 3 ] += c2;
        limbs[ 4 ] += c3;

        return new FieldElem51( limbs );
    }

    /*
    fn sub_assign(&mut self, _rhs: &'b FieldElem51) {
        let result = (self as &FieldElem51) - _rhs;
        self.0 = result.0;
    }
    type Output = FieldElem51;
    fn sub(self, _rhs: &'b FieldElem51) -> FieldElem51 {
        // To avoid underflow, first add a multiple of p.
        // Choose 16*p = p << 4 to be larger than 54-bit _rhs.
        //
        // If we could statically track the bitlengths of the limbs
        // of every FieldElem51, we could choose a multiple of p
        // just bigger than _rhs and avoid having to do a reduction.
        //
        // Since we don't yet have type-level integers to do this, we
        // have to add an explicit reduction call here.
        FieldElem51::reduce([
            (self.0[0] + 36028797018963664u64) - _rhs.0[0],
            (self.0[1] + 36028797018963952u64) - _rhs.0[1],
            (self.0[2] + 36028797018963952u64) - _rhs.0[2],
            (self.0[3] + 36028797018963952u64) - _rhs.0[3],
            (self.0[4] + 36028797018963952u64) - _rhs.0[4],
        ])
    }
    */
    sub( _rhs: FieldElem51 ): FieldElem51
    {
        return FieldElem51.reduce(
            new BigUint64Array([
                ( this.bytes[ 0 ] + BigInt( "36028797018963664" ) ) - _rhs.bytes[ 0 ],
                ( this.bytes[ 1 ] + BigInt( "36028797018963952" ) ) - _rhs.bytes[ 1 ],
                ( this.bytes[ 2 ] + BigInt( "36028797018963952" ) ) - _rhs.bytes[ 2 ],
                ( this.bytes[ 3 ] + BigInt( "36028797018963952" ) ) - _rhs.bytes[ 3 ],
                ( this.bytes[ 4 ] + BigInt( "36028797018963952" ) ) - _rhs.bytes[ 4 ],
            ])
        );
    }

    /*
    fn mul_assign(&mut self, _rhs: &'b FieldElem51) {
        let result = (self as &FieldElem51) * _rhs;
        self.0 = result.0;
    }
    type Output = FieldElem51;
    fn mul(self, _rhs: &'b FieldElem51) -> FieldElem51 {
        /// Helper function to multiply two 64-bit integers with 128
        /// bits of output.
        #[inline(always)]
        fn m(x: u64, y: u64) -> u128 { (x as u128) * (y as u128) }

        // Alias self, _rhs for more readable formulas
        let a: &[u64; 5] = &self.0;
        let b: &[u64; 5] = &_rhs.0;

        // Precondition: assume input limbs a[i], b[i] are bounded as
        //
        // a[i], b[i] < 2^(51 + b)
        //
        // where b is a real parameter measuring the "bit excess" of the limbs.

        // 64-bit precomputations to avoid 128-bit multiplications.
        //
        // This fits into a u64 whenever 51 + b + lg(19) < 64.
        //
        // Since 51 + b + lg(19) < 51 + 4.25 + b
        //                       = 55.25 + b,
        // this fits if b < 8.75.
        let b1_19 = b[1] * 19;
        let b2_19 = b[2] * 19;
        let b3_19 = b[3] * 19;
        let b4_19 = b[4] * 19;

        // Multiply to get 128-bit coefficients of output
        let     c0: u128 = m(a[0],b[0]) + m(a[4],b1_19) + m(a[3],b2_19) + m(a[2],b3_19) + m(a[1],b4_19);
        let mut c1: u128 = m(a[1],b[0]) + m(a[0],b[1])  + m(a[4],b2_19) + m(a[3],b3_19) + m(a[2],b4_19);
        let mut c2: u128 = m(a[2],b[0]) + m(a[1],b[1])  + m(a[0],b[2])  + m(a[4],b3_19) + m(a[3],b4_19);
        let mut c3: u128 = m(a[3],b[0]) + m(a[2],b[1])  + m(a[1],b[2])  + m(a[0],b[3])  + m(a[4],b4_19);
        let mut c4: u128 = m(a[4],b[0]) + m(a[3],b[1])  + m(a[2],b[2])  + m(a[1],b[3])  + m(a[0],b[4]);

        // How big are the c[i]? We have
        //
        //    c[i] < 2^(102 + 2*b) * (1+i + (4-i)*19)
        //         < 2^(102 + lg(1 + 4*19) + 2*b)
        //         < 2^(108.27 + 2*b)
        //
        // The carry (c[i] >> 51) fits into a u64 when
        //    108.27 + 2*b - 51 < 64
        //    2*b < 6.73
        //    b < 3.365.
        //
        // So we require b < 3 to ensure this fits.
        debug_assert!(a[0] < (1 << 54)); debug_assert!(b[0] < (1 << 54));
        debug_assert!(a[1] < (1 << 54)); debug_assert!(b[1] < (1 << 54));
        debug_assert!(a[2] < (1 << 54)); debug_assert!(b[2] < (1 << 54));
        debug_assert!(a[3] < (1 << 54)); debug_assert!(b[3] < (1 << 54));
        debug_assert!(a[4] < (1 << 54)); debug_assert!(b[4] < (1 << 54));

        // Casting to u64 and back tells the compiler that the carry is
        // bounded by 2^64, so that the addition is a u128 + u64 rather
        // than u128 + u128.

        const LOW_51_BIT_MASK: u64 = (1u64 << 51) - 1;
        let mut out = [0u64; 5];

        c1 += ((c0 >> 51) as u64) as u128;
        out[0] = (c0 as u64) & LOW_51_BIT_MASK;

        c2 += ((c1 >> 51) as u64) as u128;
        out[1] = (c1 as u64) & LOW_51_BIT_MASK;

        c3 += ((c2 >> 51) as u64) as u128;
        out[2] = (c2 as u64) & LOW_51_BIT_MASK;

        c4 += ((c3 >> 51) as u64) as u128;
        out[3] = (c3 as u64) & LOW_51_BIT_MASK;

        let carry: u64 = (c4 >> 51) as u64;
        out[4] = (c4 as u64) & LOW_51_BIT_MASK;

        // To see that this does not overflow, we need out[0] + carry * 19 < 2^64.
        //
        // c4 < a0*b4 + a1*b3 + a2*b2 + a3*b1 + a4*b0 + (carry from c3)
        //    < 5*(2^(51 + b) * 2^(51 + b)) + (carry from c3)
        //    < 2^(102 + 2*b + lg(5)) + 2^64.
        //
        // When b < 3 we get
        //
        // c4 < 2^110.33  so that carry < 2^59.33
        //
        // so that
        //
        // out[0] + carry * 19 < 2^51 + 19 * 2^59.33 < 2^63.58
        //
        // and there is no overflow.
        out[0] = out[0] + carry * 19;

        // Now out[1] < 2^51 + 2^(64 -51) = 2^51 + 2^13 < 2^(51 + epsilon).
        out[1] += out[0] >> 51;
        out[0] &= LOW_51_BIT_MASK;

        // Now out[i] < 2^(51 + epsilon) for all i.
        FieldElem51(out)
    }
    */
    mul( _rhs: FieldElem51 ): FieldElem51
    {
        const a: BigUint64Array = this.bytes.slice();
        const b: BigUint64Array = _rhs.bytes.slice();

        const b1_19 = b[ 1 ] * BigInt( 19 );
        const b2_19 = b[ 2 ] * BigInt( 19 );
        const b3_19 = b[ 3 ] * BigInt( 19 );
        const b4_19 = b[ 4 ] * BigInt( 19 );

        let c0: bigint = ( a[0] * b[0] ) + ( a[4] * b1_19 ) + ( a[3] * b2_19 ) + ( a[2] * b3_19 ) + ( a[1] * b4_19 );
        let c1: bigint = ( a[1] * b[0] ) + ( a[0] * b[1]  ) + ( a[4] * b2_19 ) + ( a[3] * b3_19 ) + ( a[2] * b4_19 );
        let c2: bigint = ( a[2] * b[0] ) + ( a[1] * b[1]  ) + ( a[0] * b[2]  ) + ( a[4] * b3_19 ) + ( a[3] * b4_19 );
        let c3: bigint = ( a[3] * b[0] ) + ( a[2] * b[1]  ) + ( a[1] * b[2]  ) + ( a[0] * b[3]  ) + ( a[4] * b4_19 );
        let c4: bigint = ( a[4] * b[0] ) + ( a[3] * b[1]  ) + ( a[2] * b[2]  ) + ( a[1] * b[3]  ) + ( a[0] * b[4]  );

        let out: BigUint64Array = new BigUint64Array( 5 );

        c1 += ( c0 >> _51n );
        out[ 0 ] = c0 & LOW_51_BIT_MASK;

        c2 += ( c1 >> _51n );
        out[ 1 ] = c1 & LOW_51_BIT_MASK;

        c3 += ( c2 >> _51n );
        out[ 2 ] = c2 & LOW_51_BIT_MASK;

        c4 += ( c3 >> _51n );
        out[ 3 ] = c3 & LOW_51_BIT_MASK;

        let carry: bigint = ( c4 >> _51n );
        out[ 4 ] = c4 & LOW_51_BIT_MASK;

        out[ 0 ] = out[ 0 ] + carry * BigInt( 19 );

        out[ 1 ] += out[ 0 ] >> _51n;
        out[ 0 ] &= LOW_51_BIT_MASK;

        return new FieldElem51( out );
    }

    /*
    pub fn invert(&self) -> FieldElement {
        // The bits of p-2 = 2^255 -19 -2 are 11010111111...11.
        //
        //                                 nonzero bits of exponent
        let (t19, t3) = self.pow22501();   // t19: 249..0 ; t3: 3,1,0
        let t20 = t19.pow2k(5);            // 254..5
        let t21 = &t20 * &t3;              // 254..5,3,1,0

        t21
    }
    */
    invert(): FieldElem51
    {
        let [ t19, t3 ] = this.pow22501();
        let t20 = t19.pow2k( 5 );
        let t21 = t20.mul( t3 );
        return t21;
    }

    /*
    /// Compute (self^(2^250-1), self^11), used as a helper function
    /// within invert() and pow22523().
    fn pow22501(&self) -> (FieldElement, FieldElement) {
        // Instead of managing which temporary variables are used
        // for what, we define as many as we need and leave stack
        // allocation to the compiler
        //
        // Each temporary variable t_i is of the form (self)^e_i.
        // Squaring t_i corresponds to multiplying e_i by 2,
        // so the pow2k function shifts e_i left by k places.
        // Multiplying t_i and t_j corresponds to adding e_i + e_j.
        //
        // Temporary t_i                      Nonzero bits of e_i
        //
        let t0  = self.square();           // 1         e_0 = 2^1
        let t1  = t0.square().square();    // 3         e_1 = 2^3
        let t2  = self * &t1;              // 3,0       e_2 = 2^3 + 2^0
        let t3  = &t0 * &t2;               // 3,1,0
        let t4  = t3.square();             // 4,2,1
        let t5  = &t2 * &t4;               // 4,3,2,1,0
        let t6  = t5.pow2k(5);             // 9,8,7,6,5
        let t7  = &t6 * &t5;               // 9,8,7,6,5,4,3,2,1,0
        let t8  = t7.pow2k(10);            // 19..10
        let t9  = &t8 * &t7;               // 19..0
        let t10 = t9.pow2k(20);            // 39..20
        let t11 = &t10 * &t9;              // 39..0
        let t12 = t11.pow2k(10);           // 49..10
        let t13 = &t12 * &t7;              // 49..0
        let t14 = t13.pow2k(50);           // 99..50
        let t15 = &t14 * &t13;             // 99..0
        let t16 = t15.pow2k(100);          // 199..100
        let t17 = &t16 * &t15;             // 199..0
        let t18 = t17.pow2k(50);           // 249..50
        let t19 = &t18 * &t13;             // 249..0

        (t19, t3)
    }
    */
    pow22501(): [ FieldElem51, FieldElem51 ]
    {
        let t0 = this.square();
        let t1 = t0.square().square();
        let t2 = this.mul( t1 );
        let t3 = t0.mul( t2 );
        let t4 = t3.square();
        let t5 = t2.mul( t4 );
        let t6 = t5.pow2k( 5 );
        let t7 = t6.mul( t5 );
        let t8 = t7.pow2k( 10 );
        let t9 = t8.mul( t7 );
        let t10 = t9.pow2k( 20 );
        let t11 = t10.mul( t9 );
        let t12 = t11.pow2k( 10 );
        let t13 = t12.mul( t7 );
        let t14 = t13.pow2k( 50 );
        let t15 = t14.mul( t13 );
        let t16 = t15.pow2k( 100 );
        let t17 = t16.mul( t15 );
        let t18 = t17.pow2k( 50 );
        let t19 = t18.mul( t13 );

        return [ t19, t3 ];
    }

    /*
    pub fn square(&self) -> FieldElem51 {
        self.pow2k(1)
    }
    */
    square(): FieldElem51
    {
        return this.pow2k( 1 );
    }

    /*
    /// Given `FieldElements` `u` and `v`, compute either `sqrt(u/v)`
    /// or `sqrt(i*u/v)` in constant time.
    ///
    /// This function always returns the nonnegative square root.
    ///
    /// # Return
    ///
    /// - `(Choice(1), +sqrt(u/v))  ` if `v` is nonzero and `u/v` is square;
    /// - `(Choice(1), zero)        ` if `u` is zero;
    /// - `(Choice(0), zero)        ` if `v` is zero and `u` is nonzero;
    /// - `(Choice(0), +sqrt(i*u/v))` if `u/v` is nonsquare (so `i*u/v` is square).
    ///
    pub fn sqrt_ratio_i(u: &FieldElement, v: &FieldElement) -> (Choice, FieldElement) {
        // Using the same trick as in ed25519 decoding, we merge the
        // inversion, the square root, and the square test as follows.
        //
        // To compute sqrt(α), we can compute β = α^((p+3)/8).
        // Then β^2 = ±α, so multiplying β by sqrt(-1) if necessary
        // gives sqrt(α).
        //
        // To compute 1/sqrt(α), we observe that
        //    1/β = α^(p-1 - (p+3)/8) = α^((7p-11)/8)
        //                            = α^3 * (α^7)^((p-5)/8).
        //
        // We can therefore compute sqrt(u/v) = sqrt(u)/sqrt(v)
        // by first computing
        //    r = u^((p+3)/8) v^(p-1-(p+3)/8)
        //      = u u^((p-5)/8) v^3 (v^7)^((p-5)/8)
        //      = (uv^3) (uv^7)^((p-5)/8).
        //
        // If v is nonzero and u/v is square, then r^2 = ±u/v,
        //                                     so vr^2 = ±u.
        // If vr^2 =  u, then sqrt(u/v) = r.
        // If vr^2 = -u, then sqrt(u/v) = r*sqrt(-1).
        //
        // If v is zero, r is also zero.

        let v3 = &v.square()  * v;
        let v7 = &v3.square() * v;
        let mut r = &(u * &v3) * &(u * &v7).pow_p58();
        let check = v * &r.square();

        let i = &constants::SQRT_M1;

        let correct_sign_sqrt   = check.ct_eq(        u);
        let flipped_sign_sqrt   = check.ct_eq(     &(-u));
        let flipped_sign_sqrt_i = check.ct_eq(&(&(-u)*i));

        let r_prime = &constants::SQRT_M1 * &r;
        r.conditional_assign(&r_prime, flipped_sign_sqrt | flipped_sign_sqrt_i);

        // Choose the nonnegative square root.
        let r_is_negative = r.is_negative();
        r.conditional_negate(r_is_negative);

        let was_nonzero_square = correct_sign_sqrt | flipped_sign_sqrt;

        (was_nonzero_square, r)
    }
    */
    static sqrt_ratio_i( u: FieldElem51, v: FieldElem51 ): [ boolean, FieldElem51 ]
    {
        const v3 = v.square().mul( v );
        const v7 = v3.square().mul( v );
        const r = u.mul( v3 ).mul( u.mul( v7 ).pow_p58() );
        const check = v.mul( r.square() );

        const i = FieldElem51.SQRT_M1;

        const correct_sign_sqrt   = check.ct_eq( u );
        const flipped_sign_sqrt   = check.ct_eq( u.neg() );
        const flipped_sign_sqrt_i = check.ct_eq( u.neg().mul( i ) );

        let r_prime = i.mul( r );
        r.conditional_assign( r_prime, flipped_sign_sqrt || flipped_sign_sqrt_i );

        // let r_is_negative = r.is_negative();
        r.conditional_negate( r.is_negative() );

        const was_nonzero_square =
            correct_sign_sqrt || flipped_sign_sqrt
            // `flipped_sign_sqrt_i` WAS NOT HERE IN THE ORIGINAL CODE
            // but otherwise I get the "Montgomery conversion to Edwards point in Elligator failed" error
            // || flipped_sign_sqrt_i;

        return [ was_nonzero_square, r ];
    }

    /*
    pub fn is_negative(&self) -> Choice {
        let bytes = self.to_bytes();
        (bytes[0] & 1).into()
    }
    */
    is_negative(): boolean
    {
        return ( this.toBytes()[0] & 1 ) === 1;
    }

    /*
    fn conditional_negate(&mut self, choice: Choice) {
        // Need to cast to eliminate mutability
        let self_neg: T = -(self as &T);
        self.conditional_assign(&self_neg, choice);
    }
    */
    conditional_negate( choice: boolean ): void
    {
        let self_neg = this.neg();
        return this.conditional_assign( self_neg, choice );

        // the above should have been the proper implementation
        // however it was NOT negating for some reason
    
        // this implementation should be equivalent to the intended implementation
        // with the exception that it is not constant
        // const self_neg = this.neg();
        // if( choice ) (this as any).bytes = self_neg.bytes;
    }

    /*
    // `Choice` is just a `boolean` in a `u8`
    fn conditional_assign(&mut self, other: &FieldElem51, choice: Choice) {
        inner_conditional_assign( self.0[0], (&other.0[0], choice));
        inner_conditional_assign( self.0[1], (&other.0[1], choice));
        inner_conditional_assign( self.0[2], (&other.0[2], choice));
        inner_conditional_assign( self.0[3], (&other.0[3], choice));
        inner_conditional_assign( self.0[4], (&other.0[4], choice));
    }
    #[inline]
    fn inner_conditional_assign(&mut self, other: &Self, choice: Choice) {
        // if choice = 0, mask = (-0) = 0000...0000
        // if choice = 1, mask = (-1) = 1111...1111
        let mask = -(choice.unwrap_u8() as to_signed_int!($t)) as $t;
        *self ^= mask & (*self ^ *other);
    }
    */
    conditional_assign( other: FieldElem51, choice: boolean ): void
    {
        this.bytes[0] = innerConditionalAssign( this.bytes[0], other.bytes[0], choice );
        this.bytes[1] = innerConditionalAssign( this.bytes[1], other.bytes[1], choice );
        this.bytes[2] = innerConditionalAssign( this.bytes[2], other.bytes[2], choice );
        this.bytes[3] = innerConditionalAssign( this.bytes[3], other.bytes[3], choice );
        this.bytes[4] = innerConditionalAssign( this.bytes[4], other.bytes[4], choice );

        // the above was giving problems
        // I'm not sure this is constant time
        // but it should at least be close to it
        // if( choice ) (this as any).bytes = other.bytes.slice();
        // else (this as any).bytes = this.bytes.slice();

        // return this;
    }

    clone(): FieldElem51
    {
        return new FieldElem51( this.bytes.slice() );
    }

    /*
    fn neg(self) -> FieldElem51 {
        let mut output = *self;
        output.negate();
        output
    }
    */
    neg(): FieldElem51
    {
        const output = this.clone();
        return output.negate();
    }

    /*
    pub fn negate(&mut self) {
        // See commentary in the Sub impl
        let neg = FieldElem51::reduce([
            36028797018963664u64 - self.0[0],
            36028797018963952u64 - self.0[1],
            36028797018963952u64 - self.0[2],
            36028797018963952u64 - self.0[3],
            36028797018963952u64 - self.0[4],
        ]);
        self.0 = neg.0;
    }
    */
    negate(): FieldElem51
    {
        return FieldElem51.reduce(
            new BigUint64Array([
                BigInt( "36028797018963664" ) - this.bytes[ 0 ],
                BigInt( "36028797018963952" ) - this.bytes[ 1 ],
                BigInt( "36028797018963952" ) - this.bytes[ 2 ],
                BigInt( "36028797018963952" ) - this.bytes[ 3 ],
                BigInt( "36028797018963952" ) - this.bytes[ 4 ],
            ])
        );
    }

    /*
    /// Test equality between two `FieldElement`s.  Since the
    /// internal representation is not canonical, the field elements
    /// are normalized to wire format before comparison.
    fn ct_eq(&self, other: &FieldElement) -> Choice {
        self.to_bytes().ct_eq(&other.to_bytes())
    }
    */
    ct_eq( other: FieldElem51 ): boolean
    {
        return uint8ArrayEq( this.toBytes(), other.toBytes() );
    }

    static get SQRT_M1(): FieldElem51
    {
        return new FieldElem51(
            new BigUint64Array([
                BigInt( "1718705420411056" ),
                BigInt( "234908883556509" ),
                BigInt( "2233514472574048" ),
                BigInt( "2117202627021982" ),
                BigInt( "765476049583133" ),
            ])
        );
    }
    /*
    /// Raise this field element to the power (p-5)/8 = 2^252 -3.
    fn pow_p58(&self) -> FieldElement {
        // The bits of (p-5)/8 are 101111.....11.
        //
        //                                 nonzero bits of exponent
        let (t19, _) = self.pow22501();    // 249..0
        let t20 = t19.pow2k(2);            // 251..2
        let t21 = self * &t20;             // 251..2,0

        t21
    }
    */
    pow_p58(): FieldElem51
    {
        let [ t19, _ ] = this.pow22501();
        let t20 = t19.pow2k( 2 );
        let t21 = this.mul( t20 );
        return t21;
    }

    /*
    // Serialize this `FieldElem51` to a 32-byte array.  The
    /// encoding is canonical.
    pub fn to_bytes(&self) -> [u8; 32] {
        // Let h = limbs[0] + limbs[1]*2^51 + ... + limbs[4]*2^204.
        //
        // Write h = pq + r with 0 <= r < p.
        //
        // We want to compute r = h mod p.
        //
        // If h < 2*p = 2^256 - 38,
        // then q = 0 or 1,
        //
        // with q = 0 when h < p
        //  and q = 1 when h >= p.
        //
        // Notice that h >= p <==> h + 19 >= p + 19 <==> h + 19 >= 2^255.
        // Therefore q can be computed as the carry bit of h + 19.

        // First, reduce the limbs to ensure h < 2*p.
        let mut limbs = FieldElem51::reduce(self.0).0;

        let mut q = (limbs[0] + 19) >> 51;
        q = (limbs[1] + q) >> 51;
        q = (limbs[2] + q) >> 51;
        q = (limbs[3] + q) >> 51;
        q = (limbs[4] + q) >> 51;

        // Now we can compute r as r = h - pq = r - (2^255-19)q = r + 19q - 2^255q

        limbs[0] += 19*q;

        // Now carry the result to compute r + 19q ...
        let low_51_bit_mask = (1u64 << 51) - 1;
        limbs[1] +=  limbs[0] >> 51;
        limbs[0] = limbs[0] & low_51_bit_mask;
        limbs[2] +=  limbs[1] >> 51;
        limbs[1] = limbs[1] & low_51_bit_mask;
        limbs[3] +=  limbs[2] >> 51;
        limbs[2] = limbs[2] & low_51_bit_mask;
        limbs[4] +=  limbs[3] >> 51;
        limbs[3] = limbs[3] & low_51_bit_mask;
        // ... but instead of carrying (limbs[4] >> 51) = 2^255q
        // into another limb, discard it, subtracting the value
        limbs[4] = limbs[4] & low_51_bit_mask;

        // Now arrange the bits of the limbs.
        let mut s = [0u8;32];
        s[ 0] =   limbs[0]        as u8;
        s[ 1] =  (limbs[0] >>  8) as u8;
        s[ 2] =  (limbs[0] >> 16) as u8;
        s[ 3] =  (limbs[0] >> 24) as u8;
        s[ 4] =  (limbs[0] >> 32) as u8;
        s[ 5] =  (limbs[0] >> 40) as u8;
        s[ 6] = ((limbs[0] >> 48) | (limbs[1] << 3)) as u8;
        s[ 7] =  (limbs[1] >>  5) as u8;
        s[ 8] =  (limbs[1] >> 13) as u8;
        s[ 9] =  (limbs[1] >> 21) as u8;
        s[10] =  (limbs[1] >> 29) as u8;
        s[11] =  (limbs[1] >> 37) as u8;
        s[12] = ((limbs[1] >> 45) | (limbs[2] << 6)) as u8;
        s[13] =  (limbs[2] >>  2) as u8;
        s[14] =  (limbs[2] >> 10) as u8;
        s[15] =  (limbs[2] >> 18) as u8;
        s[16] =  (limbs[2] >> 26) as u8;
        s[17] =  (limbs[2] >> 34) as u8;
        s[18] =  (limbs[2] >> 42) as u8;
        s[19] = ((limbs[2] >> 50) | (limbs[3] << 1)) as u8;
        s[20] =  (limbs[3] >>  7) as u8;
        s[21] =  (limbs[3] >> 15) as u8;
        s[22] =  (limbs[3] >> 23) as u8;
        s[23] =  (limbs[3] >> 31) as u8;
        s[24] =  (limbs[3] >> 39) as u8;
        s[25] = ((limbs[3] >> 47) | (limbs[4] << 4)) as u8;
        s[26] =  (limbs[4] >>  4) as u8;
        s[27] =  (limbs[4] >> 12) as u8;
        s[28] =  (limbs[4] >> 20) as u8;
        s[29] =  (limbs[4] >> 28) as u8;
        s[30] =  (limbs[4] >> 36) as u8;
        s[31] =  (limbs[4] >> 44) as u8;

        // High bit should be zero.
        debug_assert!((s[31] & 0b1000_0000u8) == 0u8);

        s
    }
    */
    toBytes(): Uint8Array & { length: 32 }
    {
        const limbs = FieldElem51.reduce( this.bytes ).bytes.slice();

        let q = ( limbs[ 0 ] + BigInt( 19 ) ) >> _51n;
        q = ( limbs[ 1 ] + q ) >> _51n;
        q = ( limbs[ 2 ] + q ) >> _51n;
        q = ( limbs[ 3 ] + q ) >> _51n;
        q = ( limbs[ 4 ] + q ) >> _51n;

        limbs[ 0 ] += BigInt( 19 ) * q;

        limbs[ 1 ] += limbs[ 0 ] >> _51n;
        limbs[ 0 ] &= LOW_51_BIT_MASK;
        limbs[ 2 ] += limbs[ 1 ] >> _51n;
        limbs[ 1 ] &= LOW_51_BIT_MASK;
        limbs[ 3 ] += limbs[ 2 ] >> _51n;
        limbs[ 2 ] &= LOW_51_BIT_MASK;
        limbs[ 4 ] += limbs[ 3 ] >> _51n;
        limbs[ 3 ] &= LOW_51_BIT_MASK;
        limbs[ 4 ] &= LOW_51_BIT_MASK;

        const s = new Uint8Array( 32 ) as (Uint8Array & { length: 32 });

        // DO NOT TRY TO DO SMART THINGS
        //
        // DO NOT USE `DataView` OR OTHER BULLSHIT
        // 
        // THIS IS THE CODE AND THIS WE KEEP
        // IT MIGHT SEEM IT IS JUST SHIFITNG THE BITS TO ALLIGN TO THE BYTES
        // !!! BUT IT IS NOT !!!
        // SOME ELEMENTS ARE SHIFTED BY STRANGE NUMBERS
        s[ 0 ] = Number(   limbs[ 0 ]                                                   & BigInt( 0xff ) );
        s[ 1 ] = Number( ( limbs[ 0 ] >> BigInt( 8  ) )                                 & BigInt( 0xff ) );
        s[ 2 ] = Number( ( limbs[ 0 ] >> BigInt( 16 ) )                                 & BigInt( 0xff ) );
        s[ 3 ] = Number( ( limbs[ 0 ] >> BigInt( 24 ) )                                 & BigInt( 0xff ) );
        s[ 4 ] = Number( ( limbs[ 0 ] >> BigInt( 32 ) )                                 & BigInt( 0xff ) );
        s[ 5 ] = Number( ( limbs[ 0 ] >> BigInt( 40 ) )                                 & BigInt( 0xff ) );
        s[ 6 ] = Number( ( limbs[ 0 ] >> BigInt( 48 ) ) | ( limbs[ 1 ] << BigInt( 3 ) ) & BigInt( 0xff ) );

        s[ 7 ] = Number( ( limbs[ 1 ] >> BigInt( 5  ) )                                 & BigInt( 0xff ) );
        s[ 8 ] = Number( ( limbs[ 1 ] >> BigInt( 13 ) )                                 & BigInt( 0xff ) );
        s[ 9 ] = Number( ( limbs[ 1 ] >> BigInt( 21 ) )                                 & BigInt( 0xff ) );
        s[10 ] = Number( ( limbs[ 1 ] >> BigInt( 29 ) )                                 & BigInt( 0xff ) );
        s[11 ] = Number( ( limbs[ 1 ] >> BigInt( 37 ) )                                 & BigInt( 0xff ) );
        s[12 ] = Number( ( limbs[ 1 ] >> BigInt( 45 ) ) | ( limbs[ 2 ] << BigInt( 6 ) ) & BigInt( 0xff ) );

        s[13 ] = Number( ( limbs[ 2 ] >> BigInt( 2  ) )                                 & BigInt( 0xff ) );
        s[14 ] = Number( ( limbs[ 2 ] >> BigInt( 10 ) )                                 & BigInt( 0xff ) );
        s[15 ] = Number( ( limbs[ 2 ] >> BigInt( 18 ) )                                 & BigInt( 0xff ) );
        s[16 ] = Number( ( limbs[ 2 ] >> BigInt( 26 ) )                                 & BigInt( 0xff ) );
        s[17 ] = Number( ( limbs[ 2 ] >> BigInt( 34 ) )                                 & BigInt( 0xff ) );
        s[18 ] = Number( ( limbs[ 2 ] >> BigInt( 42 ) )                                 & BigInt( 0xff ) );
        s[19 ] = Number( ( limbs[ 2 ] >> BigInt( 50 ) ) | ( limbs[ 3 ] << _1n ) & BigInt( 0xff ) );

        s[20 ] = Number( ( limbs[ 3 ] >> BigInt( 7  ) )                                 & BigInt( 0xff ) );
        s[21 ] = Number( ( limbs[ 3 ] >> BigInt( 15 ) )                                 & BigInt( 0xff ) );
        s[22 ] = Number( ( limbs[ 3 ] >> BigInt( 23 ) )                                 & BigInt( 0xff ) );
        s[23 ] = Number( ( limbs[ 3 ] >> BigInt( 31 ) )                                 & BigInt( 0xff ) );
        s[24 ] = Number( ( limbs[ 3 ] >> BigInt( 39 ) )                                 & BigInt( 0xff ) );
        s[25 ] = Number( ( limbs[ 3 ] >> BigInt( 47 ) ) | ( limbs[ 4 ] << BigInt( 4 ) ) & BigInt( 0xff ) );

        s[26 ] = Number( ( limbs[ 4 ] >> BigInt( 4  ) )                                 & BigInt( 0xff ) );
        s[27 ] = Number( ( limbs[ 4 ] >> BigInt( 12 ) )                                 & BigInt( 0xff ) );
        s[28 ] = Number( ( limbs[ 4 ] >> BigInt( 20 ) )                                 & BigInt( 0xff ) );
        s[29 ] = Number( ( limbs[ 4 ] >> BigInt( 28 ) )                                 & BigInt( 0xff ) );
        s[30 ] = Number( ( limbs[ 4 ] >> BigInt( 36 ) )                                 & BigInt( 0xff ) );
        s[31 ] = Number( ( limbs[ 4 ] >> BigInt( 44 ) )                                 & BigInt( 0xff ) );

        return s;
    }
}

export class MontgomeryPoint
{
    constructor(
        readonly bytes: Uint8Array
    ) {}

    /*
    pub fn to_edwards(&self, sign: u8) -> Option<EdwardsPoint> {
        // To decompress the Montgomery u coordinate to an
        // `EdwardsPoint`, we apply the birational map to obtain the
        // Edwards y coordinate, then do Edwards decompression.
        //
        // The birational map is y = (u-1)/(u+1).
        //
        // The exceptional points are the zeros of the denominator,
        // i.e., u = -1.
        //
        // But when u = -1, v^2 = u*(u^2+486662*u+1) = 486660.
        //
        // Since this is nonsquare mod p, u = -1 corresponds to a point
        // on the twist, not the curve, so we can reject it early.

        let u = FieldElement::from_bytes(&self.0);

        if u == FieldElement::minus_one() { return None; }

        let one = FieldElement::one();

        let y = &(&u - &one) * &(&u + &one).invert();

        let mut y_bytes = y.to_bytes();
        y_bytes[31] ^= sign << 7;

        CompressedEdwardsY(y_bytes).decompress()
    }
    */
    to_edwards( sign_bit: 0 | 1 ): EdwardsPoint | undefined
    {
        const u = FieldElem51.fromBytes( this.bytes );

        if( u.ct_eq( FieldElem51.minus_one() ) ) return undefined;

        const one = FieldElem51.one();

        const y = u.sub( one ).mul( u.add( one ).invert() );

        const y_bytes = y.toBytes();
        y_bytes[ 31 ] ^= sign_bit << 7;

        return decompressCompressedEdwardsY( y_bytes );
    }
}

/*
fn optional_multiscalar_mul<I, J>(scalars: I, points: J) -> Option<EdwardsPoint>
    where
        I: IntoIterator,
        I::Item: Borrow<Scalar>,
        J: IntoIterator<Item = Option<EdwardsPoint>>,
    {
        use backend::serial::curve_models::{CompletedPoint, ProjectiveNielsPoint, ProjectivePoint};
        use window::NafLookupTable5;
        use traits::Identity;

        let nafs: Vec<_> = scalars
            .into_iter()
            .map(|c| c.borrow().non_adjacent_form(5))
            .collect();

        let lookup_tables = points
            .into_iter()
            .map(|P_opt| P_opt.map(|P| NafLookupTable5::<ProjectiveNielsPoint>::from(&P)))
            .collect::<Option<Vec<_>>>()?;

        let mut r = ProjectivePoint::identity();

        for i in (0..256).rev() {
            let mut t: CompletedPoint = r.double();

            for (naf, lookup_table) in nafs.iter().zip(lookup_tables.iter()) {
                if naf[i] > 0 {
                    t = &t.to_extended() + &lookup_table.select(naf[i] as usize);
                } else if naf[i] < 0 {
                    t = &t.to_extended() - &lookup_table.select(-naf[i] as usize);
                }
            }

            r = t.to_projective();
        }

        Some(r.to_extended())
    }
*/
function straus_optional_multiscalar_mul(
    scalars: Uint8Array[],
    points: EdwardsPoint[]
): EdwardsPoint
{
    const nafs = scalars.map( s => scalar_non_adjacent_form( s, 5 ) );

    const lookupTables = points.map( p => NafLookupTable.fromEdwardsPoint( p ) );

    let r = ProjectivePoint.IDENTITY;

    for( let i = 255; i >= 0; i-- )
    {
        let t = r.double();

        for( let j = 0; j < nafs.length; j++ )
        {
            const naf = nafs[ j ];
            const lookupTable = lookupTables[ j ];

            if( naf[ i ] > 0 )
                t = t.toExtended().addProjectiveNiels( lookupTable.select( naf[ i ] ) );
            else if( naf[ i ] < 0 )
                t = t.toExtended().subProjectiveNiels( lookupTable.select( -naf[ i ] ) );

            r = t.toProjective();
        }

        r = t.toProjective();
    }

    return r.toExtended();
}

/*
fn optional_multiscalar_mul<I, J>(scalars: I, points: J) -> Option<EdwardsPoint>
    where
        I: IntoIterator,
        I::Item: Borrow<Scalar>,
        J: IntoIterator<Item = Option<EdwardsPoint>>,
    {
        use traits::Identity;

        let mut scalars = scalars.into_iter();
        let size = scalars.by_ref().size_hint().0;

        // Digit width in bits. As digit width grows,
        // number of point additions goes down, but amount of
        // buckets and bucket additions grows exponentially.
        let w = if size < 500 {
            6
        } else if size < 800 {
            7
        } else {
            8
        };

        let max_digit: usize = 1 << w;
        let digits_count: usize = Scalar::to_radix_2w_size_hint(w);
        let buckets_count: usize = max_digit / 2; // digits are signed+centered hence 2^w/2, excluding 0-th bucket

        // Collect optimized scalars and points in buffers for repeated access
        // (scanning the whole set per digit position).
        let scalars = scalars
            .map(|s| s.borrow().to_radix_2w(w));

        let points = points
            .into_iter()
            .map(|p| p.map(|P| P.to_projective_niels()));

        let scalars_points = scalars
            .zip(points)
            .map(|(s, maybe_p)| maybe_p.map(|p| (s, p)))
            .collect::<Option<Vec<_>>>()?;

        // Prepare 2^w/2 buckets.
        // buckets[i] corresponds to a multiplication factor (i+1).
        let mut buckets: Vec<_> = (0..buckets_count)
            .map(|_| EdwardsPoint::identity())
            .collect();

        let mut columns = (0..digits_count).rev().map(|digit_index| {
            // Clear the buckets when processing another digit.
            for i in 0..buckets_count {
                buckets[i] = EdwardsPoint::identity();
            }

            // Iterate over pairs of (point, scalar)
            // and add/sub the point to the corresponding bucket.
            // Note: if we add support for precomputed lookup tables,
            // we'll be adding/subtracting point premultiplied by `digits[i]` to buckets[0].
            for (digits, pt) in scalars_points.iter() {
                // Widen digit so that we don't run into edge cases when w=8.
                let digit = digits[digit_index] as i16;
                if digit > 0 {
                    let b = (digit - 1) as usize;
                    buckets[b] = (&buckets[b] + pt).to_extended();
                } else if digit < 0 {
                    let b = (-digit - 1) as usize;
                    buckets[b] = (&buckets[b] - pt).to_extended();
                }
            }

            // Add the buckets applying the multiplication factor to each bucket.
            // The most efficient way to do that is to have a single sum with two running sums:
            // an intermediate sum from last bucket to the first, and a sum of intermediate sums.
            //
            // For example, to add buckets 1*A, 2*B, 3*C we need to add these points:
            //   C
            //   C B
            //   C B A   Sum = C + (C+B) + (C+B+A)
            let mut buckets_intermediate_sum = buckets[buckets_count - 1];
            let mut buckets_sum = buckets[buckets_count - 1];
            for i in (0..(buckets_count - 1)).rev() {
                buckets_intermediate_sum += buckets[i];
                buckets_sum += buckets_intermediate_sum;
            }

            buckets_sum
        });

        // Take the high column as an initial value to avoid wasting time doubling the identity element in `fold()`.
        // `unwrap()` always succeeds because we know we have more than zero digits.
        let hi_column = columns.next().unwrap();

        Some(
            columns
                .fold(hi_column, |total, p| total.mul_by_pow_2(w as u32) + p),
        )
    }
}
*/
function pippenger_optional_multiscalar_mul(
    scalars: Uint8Array[],
    points: EdwardsPoint[]
): EdwardsPoint
{
    const size = scalars.length;

    const w = size < 500 ? 6 : size < 800 ? 7 : 8;

    const max_digit = 1 << w;
    const digits_count = scalar_to_radix_2w_size_hint( w );
    const buckets_count = (max_digit / 2) >>> 0;

    const scalras_digits = scalars.map( s => scalar_to_radix_2w( s, w ) );

    const points_proj = points.map( p => p.toProjectiveNiels() );

    // zipped
    const scalars_points: [Int8Array<ArrayBufferLike> & { length: 64 }, ProjectiveNielsPoint][] =
        scalras_digits.map( ( s, i ) => [ s, points_proj[ i ] ] );

    // all elems will be replaced in `columns` loop, just a temp value
    const buckets: EdwardsPoint[] = new Array( buckets_count ).fill( EdwardsPoint.IDENTITY );

    const columns = new Array( buckets_count ).fill( 0 ).map( () => EdwardsPoint.IDENTITY );
    for( let i = digits_count - 1; i >= 0; i-- )
    {
        for( let j = 0; j < buckets_count; j++ )
            buckets[ j ] = EdwardsPoint.IDENTITY;

        for( let j = 0; j < scalars_points.length; j++ )
        {
            const [ digits, pt ] = scalars_points[ j ];

            const digit = digits[ i ];

            if( digit > 0 )
            {
                const b = digit - 1;
                buckets[b] = buckets[b].addProjectiveNiels( pt ).toExtended();
            }
            else if( digit < 0 )
            {
                const b = -digit - 1;
                buckets[b] = buckets[b].subProjectiveNiels( pt ).toExtended();
            }
        }

        let buckets_intermediate_sum = buckets[ buckets_count - 1 ];
        let buckets_sum = buckets[ buckets_count - 1 ];
        for( let j = buckets_count - 2; j >= 0; j-- )
        {
            buckets_intermediate_sum = buckets_intermediate_sum.add( buckets[ j ] );
            buckets_sum = buckets_sum.add( buckets_intermediate_sum );
        }

        columns[ i ] = buckets_sum;
    }

    // const hi_column = columns[ columns.length - 1 ];

    return columns.reduce( ( total, p ) => total.mulByPow2( w ).add( p ) );
}

function scalar_to_radix_2w_size_hint( w: number ): number
{
    return (((256 + w - 1)/w) >>> 0) + (w >= 8 ?  1 : 0);
}

/*
pub(crate) fn to_radix_2w(&self, w: usize) -> [i8; 64] {
        debug_assert!(w >= 4);
        debug_assert!(w <= 8);

        if w == 4 {
            return self.to_radix_16();
        }

        use byteorder::{ByteOrder, LittleEndian};

        // Scalar formatted as four `u64`s with carry bit packed into the highest bit.
        let mut scalar64x4 = [0u64; 4];
        LittleEndian::read_u64_into(&self.bytes, &mut scalar64x4[0..4]);

        let radix: u64 = 1 << w;
        let window_mask: u64 = radix - 1;

        let mut carry = 0u64;
        let mut digits = [0i8; 64];
        let digits_count = (256 + w - 1)/w as usize;
        for i in 0..digits_count {
            // Construct a buffer of bits of the scalar, starting at `bit_offset`.
            let bit_offset = i*w;
            let u64_idx = bit_offset / 64;
            let bit_idx = bit_offset % 64;

            // Read the bits from the scalar
            let bit_buf: u64;
            if bit_idx < 64 - w  || u64_idx == 3 {
                // This window's bits are contained in a single u64,
                // or it's the last u64 anyway.
                bit_buf = scalar64x4[u64_idx] >> bit_idx;
            } else {
                // Combine the current u64's bits with the bits from the next u64
                bit_buf = (scalar64x4[u64_idx] >> bit_idx) | (scalar64x4[1+u64_idx] << (64 - bit_idx));
            }

            // Read the actual coefficient value from the window
            let coef = carry + (bit_buf & window_mask); // coef = [0, 2^r)

             // Recenter coefficients from [0,2^w) to [-2^w/2, 2^w/2)
            carry = (coef + (radix/2) as u64) >> w;
            digits[i] = ((coef as i64) - (carry << w) as i64) as i8;
        }

        // When w < 8, we can fold the final carry onto the last digit d,
        // because d < 2^w/2 so d + carry*2^w = d + 1*2^w < 2^(w+1) < 2^8.
        //
        // When w = 8, we can't fit carry*2^w into an i8.  This should
        // not happen anyways, because the final carry will be 0 for
        // reduced scalars, but the Scalar invariant allows 255-bit scalars.
        // To handle this, we expand the size_hint by 1 when w=8,
        // and accumulate the final carry onto another digit.
        match w {
            8 => digits[digits_count] += carry as i8,
            _ => digits[digits_count-1] += (carry << w) as i8,
        }

        digits
    }
*/
function scalar_to_radix_2w( scalar: Uint8Array, w: number ): Int8Array & { length: 64 }
{
    if( w === 4 ) return scalar_to_radix_16( scalar );

    const scalar64x4 = new BigUint64Array( 4 );
    read_u64_into_LE( scalar, scalar64x4 );

    const radix = BigInt(1 << w);
    const window_mask = radix - _1n;

    let carry = _0n;
    const digits = new Int8Array( 64 ) as (Int8Array & { length: 64 });
    const u8digits = new Uint8Array( digits.buffer );
    const digits_count = (((256 + w - 1)/w) >>> 0);
    for( let i = 0; i < digits_count; i++ )
    {
        const bit_offset = i * w;
        const u64_idx = (bit_offset / 64) >>> 0;
        const bit_idx = BigInt( bit_offset % 64 );

        let bit_buf: bigint;
        if( bit_idx < 64 - w || u64_idx === 3 )
            bit_buf = scalar64x4[ u64_idx ] >> bit_idx;
        else
            bit_buf = (scalar64x4[ u64_idx ] >> bit_idx) | ((scalar64x4[ 1 + u64_idx ] << (_64n - bit_idx)) & LOW_64_BIT_MASK);

        const coef = (carry + (bit_buf & window_mask) & LOW_64_BIT_MASK);

        carry = ((coef + (radix >> _1n)) / radix) & LOW_64_BIT_MASK;
        u8digits[ i ] = Number((coef - (carry * radix))) & 0xff;
    }
    
    if( w === 8 )
        u8digits[digits_count] =  (u8digits[digits_count] + Number( carry )) & 0xff ;
    else
        u8digits[digits_count-1] = (u8digits[digits_count-1] + (Number( carry ) << w)) & 0xff ;

    return digits;
}

export class EdwardsPoint
{
    constructor(
        readonly X: FieldElem51,
        readonly Y: FieldElem51,
        readonly Z: FieldElem51,
        readonly T: FieldElem51
    ) {}

    /*
    /// Compute \\([2\^k] P \\) by successive doublings. Requires \\( k > 0 \\).
    pub(crate) fn mul_by_pow_2(&self, k: u32) -> EdwardsPoint {
        debug_assert!( k > 0 );
        let mut r: CompletedPoint;
        let mut s = self.to_projective();
        for _ in 0..(k-1) {
            r = s.double(); s = r.to_projective();
        }
        // Unroll last iteration so we can go directly to_extended()
        s.double().to_extended()
    }
    */
    mulByPow2( k: number ): EdwardsPoint
    {
        if( k <= 0 ) throw new Error( "k must be > 0" );

        let r: CompletedPoint;
        let s = this.toProjective();
        for( let i = 0; i < k - 1; i++ )
        {
            r = s.double();
            s = r.toProjective();
        }

        return s.double().toExtended();
    }

    equals( other: EdwardsPoint ): boolean
    {
        return this.X.ct_eq( other.X )
            && this.Y.ct_eq( other.Y )
            && this.Z.ct_eq( other.Z )
            && this.T.ct_eq( other.T );
    }

    static get DOUBLE_BASE_COMPRESSED(): Uint8Array
    {
        return new Uint8Array([0xc9, 0xa3, 0xf8, 0x6a, 0xae, 0x46, 0x5f, 0xe,
            0x56, 0x51, 0x38, 0x64, 0x51, 0x0f, 0x39, 0x97,
            0x56, 0x1f, 0xa2, 0xc9, 0xe8, 0x5e, 0xa2, 0x1d,
            0xc2, 0x29, 0x23, 0x09, 0xf3, 0xcd, 0x60, 0x22]);
    }

    static get BASEPOINT_ED25519_COMPRESSED(): Uint8Array
    {
        return new Uint8Array([0x58, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66]);
    }

    static get BASEPOINT_ED25519(): EdwardsPoint
    {
        return new EdwardsPoint(
            new FieldElem51(new BigUint64Array([
                BigInt( "1738742601995546" ),
                BigInt( "1146398526822698" ),
                BigInt( "2070867633025821" ),
                BigInt( "562264141797630" ),
                BigInt( "587772402128613" ),
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "1801439850948184" ),
                BigInt( "1351079888211148" ),
                BigInt( "450359962737049" ),
                BigInt( "900719925474099" ),
                BigInt( "1801439850948198" ),
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "1" ),
                BigInt( "0" ),
                BigInt( "0" ),
                BigInt( "0" ),
                BigInt( "0" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "1841354044333475" ),
                BigInt( "16398895984059" ),
                BigInt( "755974180946558" ),
                BigInt( "900171276175154" ),
                BigInt( "1821297809914039" ),
            ])),
        );
    }

    is_valid(): boolean
    {
        const on_curve = this.toProjective().is_valid();
        const on_ceger_image = this.X.mul( this.Y ).ct_eq( this.Z.mul( this.T ) );

        return on_curve && on_ceger_image;
    }

    /*
    fn optional_multiscalar_mul<I, J>(scalars: I, points: J) -> Option<EdwardsPoint>
    where
        I: IntoIterator,
        I::Item: Borrow<Scalar>,
        J: IntoIterator<Item = Option<EdwardsPoint>>,
    {
        // Sanity-check lengths of input iterators
        let mut scalars = scalars.into_iter();
        let mut points = points.into_iter();

        // Lower and upper bounds on iterators
        let (s_lo, s_hi) = scalars.by_ref().size_hint();
        let (p_lo, p_hi) = points.by_ref().size_hint();

        // They should all be equal
        assert_eq!(s_lo, p_lo);
        assert_eq!(s_hi, Some(s_lo));
        assert_eq!(p_hi, Some(p_lo));

        // Now we know there's a single size.
        // Use this as the hint to decide which algorithm to use.
        let size = s_lo;

        if size < 190 {
            scalar_mul::straus::Straus::optional_multiscalar_mul(scalars, points)
        } else {
            scalar_mul::pippenger::Pippenger::optional_multiscalar_mul(scalars, points)
        }
    }
    */
    static vartime_multiscalar_mul( scalars: Uint8Array[], points: EdwardsPoint[] ): EdwardsPoint // | undefined
    {
        return straus_optional_multiscalar_mul( scalars, points );
        
        // pippenger is giving problems

        // if( scalars.length < 190 )
        //     return straus_optional_multiscalar_mul( scalars, points );
        // else
        //     return pippenger_optional_multiscalar_mul( scalars, points );
    }

    double(): EdwardsPoint
    {
        return this.toProjective().double().toExtended();
    }

    /*
/// Compute \\(aA + bB\\) in variable time, where \\(B\\) is the Ed25519 basepoint.
pub fn mul(a: &Scalar, A: &EdwardsPoint, b: &Scalar) -> EdwardsPoint {
    let a_naf = a.non_adjacent_form(5);
    let b_naf = b.non_adjacent_form(8);

    // Find starting index
    let mut i: usize = 255;
    for j in (0..256).rev() {
        i = j;
        if a_naf[i] != 0 || b_naf[i] != 0 {
            break;
        }
    }

    let table_A = NafLookupTable::<ProjectiveNielsPoint>::from(A);
    let table_B = &constants::AFFINE_ODD_MULTIPLES_OF_BASEPOINT;

    let mut r = ProjectivePoint::identity();
    loop {
        let mut t = r.double();

        if a_naf[i] > 0 {
            t = &t.to_extended() + &table_A.select(a_naf[i] as usize);
        } else if a_naf[i] < 0 {
            t = &t.to_extended() - &table_A.select(-a_naf[i] as usize);
        }

        if b_naf[i] > 0 {
            t = &t.to_extended() + &table_B.select(b_naf[i] as usize);
        } else if b_naf[i] < 0 {
            t = &t.to_extended() - &table_B.select(-b_naf[i] as usize);
        }

        r = t.to_projective();

        if i == 0 {
            break;
        }
        i -= 1;
    }

    r.to_extended()
}
    */
    static vartime_double_scalar_mul_basepoint(
        neg_challenge: Uint8Array,
        pk: EdwardsPoint,
        response: Uint8Array
    )
    {
        const a_naf = scalar_non_adjacent_form( neg_challenge, 5 );
        const b_naf = scalar_non_adjacent_form( response, 8 );

        let i = 255;
        for( let j = 255; j >= 0; j-- )
        {
            i = j;
            if( a_naf[ i ] !== 0 || b_naf[ i ] !== 0 )
            {
                break;
            }
        };

        const table_A = NafLookupTable.fromEdwardsPoint( pk );
        const table_B = AFFINE_ODD_MULTIPLES_OF_BASEPOINT;

        let r = ProjectivePoint.IDENTITY;
        while( true )
        {
            let t = r.double();

            if( a_naf[ i ] > 0 )
                t = t.toExtended().addProjectiveNiels( table_A.select( a_naf[ i ] ) );
            else if( a_naf[ i ] < 0 )
                t = t.toExtended().subProjectiveNiels( table_A.select( -a_naf[ i ] ) );

            if( b_naf[ i ] > 0 )
                t = t.toExtended().addAffineNielsPoint( table_B.select( b_naf[ i ] ) );
            else if( b_naf[ i ] < 0 )
                t = t.toExtended().subAffineNielsPoint( table_B.select( -b_naf[ i ] ) );

            r = t.toProjective();

            if( i === 0 )
                break;
            i--;
        }

        return r.toExtended();
    }

    ct_eq( other: EdwardsPoint ): boolean
    {
        return uint8ArrayEq( this.compress(), other.compress() );
    }

    static decompress( compressed: Uint8Array ): EdwardsPoint | undefined
    {
        return decompressCompressedEdwardsY( compressed );
    }
    static uncompress( compressed: Uint8Array ): EdwardsPoint | undefined
    {
        return decompressCompressedEdwardsY( compressed );
    }

    /*
    pub fn is_small_order(&self) -> bool {
        self.mul_by_cofactor().is_identity()
    }
    */
    is_small_order(): boolean
    {
        return this.mul_by_cofactor().is_identity();
    }

    /*
    fn is_identity(&self) -> bool {
        self.ct_eq(&T::identity()).unwrap_u8() == 1u8
    }
    */
    is_identity(): boolean
    {
        
        return this.ct_eq( EdwardsPoint.IDENTITY );
    }

    clone(): EdwardsPoint
    {
        return new EdwardsPoint(
            this.X.clone(),
            this.Y.clone(),
            this.Z.clone(),
            this.T.clone()
        );
    }

    static get IDENTITY(): EdwardsPoint
    {
        return new EdwardsPoint(
            FieldElem51.zero(),
            FieldElem51.one(),
            FieldElem51.one(),
            FieldElem51.zero()
        );
    }

    /*
    fn add(self, other: &'b EdwardsPoint) -> EdwardsPoint {
        (self + &other.to_projective_niels()).to_extended()
    }
    */
    add( other: EdwardsPoint ): EdwardsPoint
    {
        return this.addProjectiveNiels( other.toProjectiveNiels() ).toExtended();
    }

    /*
    fn add(self, other: &'b ProjectiveNielsPoint) -> CompletedPoint {
        let Y_plus_X  = &self.Y + &self.X;
        let Y_minus_X = &self.Y - &self.X;
        let PP = &Y_plus_X  * &other.Y_plus_X;
        let MM = &Y_minus_X * &other.Y_minus_X;
        let TT2d = &self.T * &other.T2d;
        let ZZ   = &self.Z * &other.Z;
        let ZZ2  = &ZZ + &ZZ;

        CompletedPoint{
            X: &PP - &MM,
            Y: &PP + &MM,
            Z: &ZZ2 + &TT2d,
            T: &ZZ2 - &TT2d
        }
    }
    */
    addProjectiveNiels( other: ProjectiveNielsPoint ): CompletedPoint
    {
        const Y_plus_X = this.Y.add( this.X );
        const Y_minus_X = this.Y.sub( this.X );

        const PP = Y_plus_X.mul( other.Y_plus_X );
        const MM = Y_minus_X.mul( other.Y_minus_X );
        const TT2d = this.T.mul( other.T2d );
        const ZZ = this.Z.mul( other.Z );
        const ZZ2 = ZZ.add( ZZ );

        return new CompletedPoint(
            PP.sub( MM ),
            PP.add( MM ),
            ZZ2.add( TT2d ),
            ZZ2.sub( TT2d )
        );
    }

    /*
    fn sub(self, other: &'b ProjectiveNielsPoint) -> CompletedPoint {
        let Y_plus_X  = &self.Y + &self.X;
        let Y_minus_X = &self.Y - &self.X;
        let PM = &Y_plus_X * &other.Y_minus_X;
        let MP = &Y_minus_X  * &other.Y_plus_X;
        let TT2d = &self.T * &other.T2d;
        let ZZ   = &self.Z * &other.Z;
        let ZZ2  = &ZZ + &ZZ;

        CompletedPoint{
            X: &PM - &MP,
            Y: &PM + &MP,
            Z: &ZZ2 - &TT2d,
            T: &ZZ2 + &TT2d
        }
    }
    */
    subProjectiveNiels( other: ProjectiveNielsPoint ): CompletedPoint
    {
        const Y_plus_X = this.Y.add( this.X );
        const Y_minus_X = this.Y.sub( this.X );

        const PM = Y_plus_X.mul( other.Y_minus_X );
        const MP = Y_minus_X.mul( other.Y_plus_X );
        const TT2d = this.T.mul( other.T2d );
        const ZZ = this.Z.mul( other.Z );
        const ZZ2 = ZZ.add( ZZ );

        return new CompletedPoint(
            PM.sub( MP ),
            PM.add( MP ),
            ZZ2.sub( TT2d ),
            ZZ2.add( TT2d )
        );
    }

    /*
    fn add(self, other: &'b AffineNielsPoint) -> CompletedPoint {
        let Y_plus_X  = &self.Y + &self.X;
        let Y_minus_X = &self.Y - &self.X;
        let PP        = &Y_plus_X  * &other.y_plus_x;
        let MM        = &Y_minus_X * &other.y_minus_x;
        let Txy2d     = &self.T * &other.xy2d;
        let Z2        = &self.Z + &self.Z;

        CompletedPoint{
            X: &PP - &MM,
            Y: &PP + &MM,
            Z: &Z2 + &Txy2d,
            T: &Z2 - &Txy2d
        }
    }
    */
    addAffineNielsPoint( other: AffineNielsPoint ): CompletedPoint
    {
        const Y_plus_X = this.Y.add( this.X );
        const Y_minus_X = this.Y.sub( this.X );
        const PP = Y_plus_X.mul( other.y_plus_x );
        const MM = Y_minus_X.mul( other.y_minus_x );
        const Txy2d = this.T.mul( other.xy2d );
        const Z2 = this.Z.add( this.Z );

        return new CompletedPoint(
            PP.sub( MM ),
            PP.add( MM ),
            Z2.add( Txy2d ),
            Z2.sub( Txy2d )
        );
    }

    /*
    fn sub(self, other: &'b AffineNielsPoint) -> CompletedPoint {
        let Y_plus_X  = &self.Y + &self.X;
        let Y_minus_X = &self.Y - &self.X;
        let PM        = &Y_plus_X  * &other.y_minus_x;
        let MP        = &Y_minus_X * &other.y_plus_x;
        let Txy2d     = &self.T * &other.xy2d;
        let Z2        = &self.Z + &self.Z;

        CompletedPoint{
            X: &PM - &MP,
            Y: &PM + &MP,
            Z: &Z2 - &Txy2d,
            T: &Z2 + &Txy2d
        }
    }
    */
    subAffineNielsPoint( other: AffineNielsPoint ): CompletedPoint
    {
        const Y_plus_X = this.Y.add( this.X );
        const Y_minus_X = this.Y.sub( this.X );
        const PM = Y_plus_X.mul( other.y_minus_x );
        const MP = Y_minus_X.mul( other.y_plus_x );
        const Txy2d = this.T.mul( other.xy2d );
        const Z2 = this.Z.add( this.Z );

        return new CompletedPoint(
            PM.sub( MP ),
            PM.add( MP ),
            Z2.sub( Txy2d ),
            Z2.add( Txy2d )
        );
    }

    /*
    /// Convert to a ProjectiveNielsPoint
    pub(crate) fn to_projective_niels(&self) -> ProjectiveNielsPoint {
        ProjectiveNielsPoint{
            Y_plus_X:  &self.Y + &self.X,
            Y_minus_X: &self.Y - &self.X,
            Z:          self.Z,
            T2d:       &self.T * &constants::EDWARDS_D2,
        }
    }
    */
    toProjectiveNiels(): ProjectiveNielsPoint
    {
        return new ProjectiveNielsPoint(
            this.Y.add( this.X ),
            this.Y.sub( this.X ),
            this.Z,
            this.T.mul( FieldElem51.EDWARDS_D2 )
        );
    }

    /*
    /// Multiply by the cofactor: return \\([8]P\\).
    pub fn mul_by_cofactor(&self) -> EdwardsPoint {
        self.mul_by_pow_2(3)
    }
    */
    mul_by_cofactor(): EdwardsPoint
    {
        return this.mul_by_pow_2( 3 );
    }

    /*
    /// Compress this point to `CompressedEdwardsY` format.
    pub fn compress(&self) -> CompressedEdwardsY {
        let recip = self.Z.invert();
        let x = &self.X * &recip;
        let y = &self.Y * &recip;
        let mut s: [u8; 32];

        s = y.to_bytes();
        s[31] ^= x.is_negative().unwrap_u8() << 7;
        CompressedEdwardsY(s)
    }
    */
    compress(): Uint8Array & { length: 32 }
    {
        const recip = this.Z.invert();
        const x = this.X.mul( recip );
        const y = this.Y.mul( recip );
        const s = y.toBytes();
        const bit = x.is_negative() ? 1 : 0;
        s[31] ^= bit << 7;
        return s;
    }

    compressed_is_negative(): boolean
    {
        const recip = this.Z.invert();
        const x = this.X.mul( recip );
        return x.is_negative();
    }

    /*
    /// Compute \\([2\^k] P \\) by successive doublings. Requires \\( k > 0 \\).
    pub(crate) fn mul_by_pow_2(&self, k: u32) -> EdwardsPoint {
        debug_assert!( k > 0 );
        let mut r: CompletedPoint;
        let mut s = self.to_projective();
        for _ in 0..(k-1) {
            r = s.double(); s = r.to_projective();
        }
        // Unroll last iteration so we can go directly to_extended()
        s.double().to_extended()
    }
    */
    mul_by_pow_2( k: number ): EdwardsPoint
    {
        if( k <= 0 ) throw new Error("mul_by_pow_2 :: k must be greater than 0");
        let r: CompletedPoint;
        let s = this.toProjective();

        for( let i = 0; i < k - 1; i++ )
        {
            r = s.double();
            s = r.toProjective();
        }
        return s.double().toExtended();
    }

    /*
    /// Convert the representation of this point from extended
    /// coordinates to projective coordinates.
    ///
    /// Free.
    pub(crate) fn to_projective(&self) -> ProjectivePoint {
        ProjectivePoint{
            X: self.X,
            Y: self.Y,
            Z: self.Z,
        }
    }
    */
    toProjective(): ProjectivePoint
    {
        return new ProjectivePoint( this.X, this.Y, this.Z );
    }

    /*
    /// Perform constant-time, variable-base scalar multiplication.
    pub(crate) fn mul(point: &EdwardsPoint, scalar: &Scalar) -> EdwardsPoint {
        // Construct a lookup table of [P,2P,3P,4P,5P,6P,7P,8P]
        let lookup_table = LookupTable::<ProjectiveNielsPoint>::from(point);
        // Setting s = scalar, compute
        //
        //    s = s_0 + s_1*16^1 + ... + s_63*16^63,
        //
        // with `-8 ≤ s_i < 8` for `0 ≤ i < 63` and `-8 ≤ s_63 ≤ 8`.
        let scalar_digits = scalar.to_radix_16();
        // Compute s*P as
        //
        //    s*P = P*(s_0 +   s_1*16^1 +   s_2*16^2 + ... +   s_63*16^63)
        //    s*P =  P*s_0 + P*s_1*16^1 + P*s_2*16^2 + ... + P*s_63*16^63
        //    s*P = P*s_0 + 16*(P*s_1 + 16*(P*s_2 + 16*( ... + P*s_63)...))
        //
        // We sum right-to-left.

        // Unwrap first loop iteration to save computing 16*identity
        let mut tmp2;
        let mut tmp3 = EdwardsPoint::identity();
        let mut tmp1 = &tmp3 + &lookup_table.select(scalar_digits[63]);
        // Now tmp1 = s_63*P in P1xP1 coords
        for i in (0..63).rev() {
            tmp2 = tmp1.to_projective(); // tmp2 =    (prev) in P2 coords
            tmp1 = tmp2.double();        // tmp1 =  2*(prev) in P1xP1 coords
            tmp2 = tmp1.to_projective(); // tmp2 =  2*(prev) in P2 coords
            tmp1 = tmp2.double();        // tmp1 =  4*(prev) in P1xP1 coords
            tmp2 = tmp1.to_projective(); // tmp2 =  4*(prev) in P2 coords
            tmp1 = tmp2.double();        // tmp1 =  8*(prev) in P1xP1 coords
            tmp2 = tmp1.to_projective(); // tmp2 =  8*(prev) in P2 coords
            tmp1 = tmp2.double();        // tmp1 = 16*(prev) in P1xP1 coords
            tmp3 = tmp1.to_extended();   // tmp3 = 16*(prev) in P3 coords
            tmp1 = &tmp3 + &lookup_table.select(scalar_digits[i]);
            // Now tmp1 = s_i*P + 16*(prev) in P1xP1 coords
        }
        tmp1.to_extended()
    }
    */
    /*
    */
    scalarMul( scalar: Uint8Array ): EdwardsPoint
    {
        const lookup_table = ProjectiveNielsPoint.tableFromEdwardPoint( this );

        const scalar_digits = scalar_to_radix_16( scalar );

        let tmp2: ProjectivePoint = ProjectivePoint.IDENTITY;
        let tmp3 = EdwardsPoint.IDENTITY;
        let tmp1 = tmp3.addProjectiveNiels( lookup_table.select( scalar_digits[ 63 ] ) );
        
        for( let i = 62; i >= 0; i-- )
        {
            tmp2 = tmp1.toProjective();
            tmp1 = tmp2.double();

            tmp2 = tmp1.toProjective();
            tmp1 = tmp2.double();

            tmp2 = tmp1.toProjective();
            tmp1 = tmp2.double();

            tmp2 = tmp1.toProjective();
            tmp1 = tmp2.double();

            tmp3 = tmp1.toExtended();

            tmp1 = tmp3.addProjectiveNiels(
                lookup_table.select( scalar_digits[i] )
            );
        }

        return tmp1.toExtended();
    }
}

class NafLookupTable<PointT>
{
    constructor( readonly points: PointT[] ) {}
    
    /*
    /// Given public, odd \\( x \\) with \\( 0 < x < 2^4 \\), return \\(xA\\).
    pub fn select(&self, x: usize) -> T {
        debug_assert_eq!(x & 1, 1);
        debug_assert!(x < 16););

        self.0[x / 2]
    }
    */
    select( i: number ): PointT
    {
        // debug_assert_eq(x & 1, 1);
        // debug_assert(x < 16););
        return this.points[ (i / 2) >>> 0 ];
    }

    /*
    fn from(A: &'a EdwardsPoint) -> Self {
        let mut Ai: [ProjectiveNielsPoint; 8] = [A.to_projective_niels(); 8];
        let A2 = A.double();
        for i in 0..7 {
            Ai[i + 1] = (&A2 + &Ai[i]).to_extended().to_projective_niels();
        }
        // Now Ai = [A, 3A, 5A, 7A, 9A, 11A, 13A, 15A]
        NafLookupTable(Ai)
    }
    */
    static fromEdwardsPoint( point: EdwardsPoint ): NafLookupTable<ProjectiveNielsPoint>
    {
        const Ai = new Array( 8 ).fill( 0 ).map( _ => point.toProjectiveNiels() );
        const A2 = point.double();
        for( let i = 0; i < 7; i++ )
        {
            Ai[ i + 1 ] = A2.addProjectiveNiels( Ai[ i ] ).toExtended().toProjectiveNiels();
        }
        // Now Ai = [A, 3A, 5A, 7A, 9A, 11A, 13A, 15A]
        return new NafLookupTable( Ai );
    }
}

class AffineNielsPoint
{
    constructor(
        readonly y_plus_x: FieldElem51,
        readonly y_minus_x: FieldElem51,
        readonly xy2d: FieldElem51
    ) {}
}





export const ED25519_BASEPOINT_POINT = new EdwardsPoint(
    new FieldElem51(new BigUint64Array([
        BigInt( "1738742601995546" ),
        BigInt( "1146398526822698" ),
        BigInt( "2070867633025821" ),
        BigInt( "562264141797630" ),
        BigInt( "587772402128613" ),
    ])),
    new FieldElem51(new BigUint64Array([
        BigInt( "1801439850948184" ),
        BigInt( "1351079888211148" ),
        BigInt( "450359962737049" ),
        BigInt( "900719925474099" ),
        BigInt( "1801439850948198" ),
    ])),
    new FieldElem51(new BigUint64Array([
        BigInt( "1" ),
        BigInt( "0" ),
        BigInt( "0" ),
        BigInt( "0" ),
        BigInt( "0" )
    ])),
    new FieldElem51(new BigUint64Array([
        BigInt( "1841354044333475" ),
        BigInt( "16398895984059" ),
        BigInt( "755974180946558" ),
        BigInt( "900171276175154" ),
        BigInt( "1821297809914039" ),
    ])),
);

/*
pub struct ProjectiveNielsPoint {
    pub Y_plus_X:  FieldElement,
    pub Y_minus_X: FieldElement,
    pub Z:         FieldElement,
    pub T2d:       FieldElement,
}

*/
export class ProjectiveNielsPoint
{
    constructor(
        readonly Y_plus_X: FieldElem51,
        readonly Y_minus_X: FieldElem51,
        readonly Z: FieldElem51,
        readonly T2d: FieldElem51
    ) {}

    clone(): ProjectiveNielsPoint
    {
        return new ProjectiveNielsPoint(
            this.Y_plus_X.clone(),
            this.Y_minus_X.clone(),
            this.Z.clone(),
            this.T2d.clone()
        );
    }

    /** not really, but useful to debug */
    compress()
    {
        return EdwardsPoint.IDENTITY
        .addProjectiveNiels( this )
        .toExtended()
        .compress();
    }

    compressed_is_negative(): boolean
    {
        return EdwardsPoint.IDENTITY
        .addProjectiveNiels( this )
        .toExtended()
        .compressed_is_negative();
    }

    static identity(): ProjectiveNielsPoint
    {
        return new ProjectiveNielsPoint(
            FieldElem51.one(),
            FieldElem51.one(),
            FieldElem51.one(),
            FieldElem51.zero()
        );
    }

    /**
     * # WARNING
     * 
     * **I FOUND NO IMPLEMENTATION** (Thanks generics)
     * 
     * I am ASSUMING this is what is meant to happen
     * 
     */
    conditional_negate( choice: boolean ): void
    {
        // this.Y_plus_X.conditional_negate( choice );
        // this.Y_minus_X.conditional_negate( choice );
        // this.Z.conditional_negate( choice );
        // this.T2d.conditional_negate( choice );

        // ??? WTF ???
        // ??? not even this works ???
        // ??? WHY ???
        // 
        // if( choice )
        // {
        //     (this as any).Y_plus_X = this.Y_plus_X.neg();
        //     (this as any).Y_minus_X = this.Y_minus_X.neg();
        //     (this as any).Z = this.Z.neg();
        //     (this as any).T2d = this.T2d.neg();
        // }

        if( choice )
        {
            const neg = this.neg();
            (this as any).Y_plus_X = neg.Y_plus_X;
            (this as any).Y_minus_X = neg.Y_minus_X;
            (this as any).Z = neg.Z;
            (this as any).T2d = neg.T2d;
        }
    }

    /**
     * 
     * I HAD TO FUCKING REVERSE ENGENEER THIS SHIT
     * 
     * WHO THE FUCK TOUGHT MACROS WERE A GOOD IDEA IN RUST?
     */
    neg(): ProjectiveNielsPoint
    {
        return new ProjectiveNielsPoint(
            // swap places minus and plus
            this.Y_minus_X.clone(),
            this.Y_plus_X.clone(),
            // same Z
            this.Z.clone(),
            // negate T2d
            this.T2d.neg()
        );
    }

    /*
    fn conditional_assign(&mut self, other: &Self, choice: Choice) {
        self.Y_plus_X.conditional_assign(&other.Y_plus_X, choice);
        self.Y_minus_X.conditional_assign(&other.Y_minus_X, choice);
        self.Z.conditional_assign(&other.Z, choice);
        self.T2d.conditional_assign(&other.T2d, choice);
    }
    */
    conditional_assign( other: ProjectiveNielsPoint, choice: boolean ): void
    {
        this.Y_plus_X.conditional_assign( other.Y_plus_X, choice );
        this.Y_minus_X.conditional_assign( other.Y_minus_X, choice );
        this.Z.conditional_assign( other.Z, choice );
        this.T2d.conditional_assign( other.T2d, choice );
    }

    /*
    fn from(P: &'a EdwardsPoint) -> Self {
        let mut points = [P.to_projective_niels(); $size];
        for j in $conv_range {
            points[j + 1] = (P + &points[j]).to_extended().to_projective_niels();
        }
        $name(points)
    }
    */
    static tableFromEdwardPoint( point: EdwardsPoint ): LookupTableProjectiveNielsPoint
    {
        const points = new Array( LookupTableProjectiveNielsPoint.SIZE ).fill( 0 ).map( _ => point.toProjectiveNiels() );
        for(let j = 0; j < LookupTableProjectiveNielsPoint.CONVERSION_RANGE_MAX; j++)
        {
            points[ j + 1 ] = point.addProjectiveNiels( points[j] ).toExtended().toProjectiveNiels();
        }
        return new LookupTableProjectiveNielsPoint( points );
    }
}

/*
impl_lookup_table! {
    Name = LookupTable,        
    Size = 8,
    SizeNeg = -8,
    SizeRange = 1 .. 9,
    ConversionRange = 0 .. 7
} // radix-16
*/
export class LookupTableProjectiveNielsPoint
{
    constructor( readonly points: ProjectiveNielsPoint[] ) {}

    static readonly SIZE = 8;
    static readonly SIZE_NEG = -8;
    static readonly SIZE_RANGE = [ 1, 2, 3, 4, 5, 6, 7, 8 ];
    static readonly SIZE_RANGE_MIN = 1;
    static readonly SIZE_RANGE_MAX = 8;
    static readonly CONVERSION_RANGE = [ 0, 1, 2, 3, 4, 5, 6, 7 ];
    static readonly CONVERSION_RANGE_MAX = 7;

    /*
    /// Given \\(-8 \leq x \leq 8\\), return \\(xP\\) in constant time.
    pub fn select(&self, x: i8) -> T {
        debug_assert!(x >= $neg);
        debug_assert!(x as i16 <= $size as i16); // XXX We have to convert to i16s here for the radix-256 case.. this is wrong.

        // Compute xabs = |x|
        let xmask = x  as i16 >> 7;
        let xabs = (x as i16 + xmask) ^ xmask;

        // Set t = 0 * P = identity
        let mut t = T::identity();
        for j in $range {
            // Copy `points[j-1] == j*P` onto `t` in constant time if `|x| == j`.
            let c = (xabs as u16).ct_eq(&(j as u16));
            t.conditional_assign(&self.0[j - 1], c);
        }
        // Now t == |x| * P.

        let neg_mask = Choice::from((xmask & 1) as u8);
        t.conditional_negate(neg_mask);
        // Now t == x * P.

        t
    }
    */
    select( pos: number ): ProjectiveNielsPoint
    {
        const view = new DataView( new ArrayBuffer( 2 ) );
        view.setUint16( 0, pos & 0xffff, false );
        const posI16 = view.getInt16( 0, false );
        // const posU16 = view.getUint16( 0, false );

        const xmask = posI16 >> 7;
        const xabs = (posI16 + xmask) ^ xmask;

        let t = ProjectiveNielsPoint.identity() as ProjectiveNielsPoint;
        for(
            let j = LookupTableProjectiveNielsPoint.SIZE_RANGE_MIN;
            j <= LookupTableProjectiveNielsPoint.SIZE_RANGE_MAX;
            j++
        )
        {
            const c = xabs === j;
            t.conditional_assign( this.points[ j - 1 ].clone(), c );
        }

        const neg_mask = xmask & 1;
        t.conditional_negate( neg_mask === 1 );

        return t;
    }
}

/*
pub(crate) fn to_radix_16(&self) -> [i8; 64] {
    debug_assert!(self[31] <= 127);
    let mut output = [0i8; 64];

    // Step 1: change radix.
    // Convert from radix 256 (bytes) to radix 16 (nibbles)
    #[inline(always)]
    fn bot_half(x: u8) -> u8 { (x >> 0) & 15 }
    #[inline(always)]
    fn top_half(x: u8) -> u8 { (x >> 4) & 15 }

    for i in 0..32 {
        output[2*i  ] = bot_half(self[i]) as i8;
        output[2*i+1] = top_half(self[i]) as i8;
    }
    // Precondition note: since self[31] <= 127, output[63] <= 7

    // Step 2: recenter coefficients from [0,16) to [-8,8)
    for i in 0..63 {
        let carry    = (output[i] + 8) >> 4;
        output[i  ] -= carry << 4;
        output[i+1] += carry;
    }
    // Precondition note: output[63] is not recentered.  It
    // increases by carry <= 1.  Thus output[63] <= 8.

    output
}
*/
function scalar_to_radix_16( scalar: Uint8Array ): Int8Array & { length: 64 }
{
    const output = new Int8Array( 64 ) as (Int8Array & { length: 64 });
    const u8 = new Uint8Array( output.buffer );

    for( let i = 0; i < 32; i++ )
    {
        u8[ 2 * i ]     = ( scalar[ i ] >> 0 ) & 15;
        u8[ 2 * i + 1 ] = ( scalar[ i ] >> 4 ) & 15;
    }

    for( let i = 0; i < 63; i++ )
    {
        const carry  = (output[i] + 8) >> 4;
        u8[ i ]     -= (carry << 4) & 0xff;
        u8[ i + 1 ] += (carry) & 0xff;
    }

    return output;
}

/*
/// Attempt to decompress to an `EdwardsPoint`.
///
/// Returns `None` if the input is not the \\(y\\)-coordinate of a
/// curve point.
pub fn decompress( bytes: [u8] ) -> Option<EdwardsPoint> {
    let Y = FieldElement::from_bytes( bytes );
    let Z = FieldElement::one();
    let YY = Y.square();
    let u = &YY - &Z;                            // u =  y²-1
    let v = &(&YY * &constants::EDWARDS_D) + &Z; // v = dy²+1
    let (is_valid_y_coord, mut X) = FieldElement::sqrt_ratio_i(&u, &v);

    if is_valid_y_coord.unwrap_u8() != 1u8 { return None; }

        // FieldElement::sqrt_ratio_i always returns the nonnegative square root,
        // so we negate according to the supplied sign bit.
    let compressed_sign_bit = Choice::from(self.as_bytes()[31] >> 7);
    X.conditional_negate(compressed_sign_bit);

    Some(EdwardsPoint{ X, Y, Z, T: &X * &Y })
}
*/
export function decompressCompressedEdwardsY( bytes: Uint8Array ): EdwardsPoint | undefined
{
    const Y = FieldElem51.fromBytes( bytes );
    const Z = FieldElem51.one();
    const YY = Y.square();
    const u = YY.sub( Z );
    const v = YY.mul( FieldElem51.EDWARDS_D ).add( Z );
    const [ is_valid_y_coord, X ] = FieldElem51.sqrt_ratio_i( u, v );

    if( is_valid_y_coord !== true ) return undefined;

    const compressed_sign_bit = ( bytes[ 31 ] >> 7 ) & 1;
    X.conditional_negate( compressed_sign_bit === 1 );

    return new EdwardsPoint( X, Y, Z, X.mul( Y ) );
}

export class CompletedPoint
{
    constructor(
        readonly X: FieldElem51,
        readonly Y: FieldElem51,
        readonly Z: FieldElem51,
        readonly T: FieldElem51
    ) {}

    clone(): CompletedPoint
    {
        return new CompletedPoint(
            this.X.clone(),
            this.Y.clone(),
            this.Z.clone(),
            this.T.clone()
        );
    }

    /*
    pub fn to_projective(&self) -> ProjectivePoint {
        ProjectivePoint {
            X: &self.X * &self.T,
            Y: &self.Y * &self.Z,
            Z: &self.Z * &self.T,
        }
    }
    */
    toProjective(): ProjectivePoint
    {
        return new ProjectivePoint(
            this.X.mul( this.T ),
            this.Y.mul( this.Z ),
            this.Z.mul( this.T )
        );
    }

    /*
    pub fn to_extended(&self) -> EdwardsPoint {
        EdwardsPoint {
            X: &self.X * &self.T,
            Y: &self.Y * &self.Z,
            Z: &self.Z * &self.T,
            T: &self.X * &self.Y,
        }
    }
    */
    toExtended(): EdwardsPoint
    {
        return new EdwardsPoint(
            this.X.mul( this.T ),
            this.Y.mul( this.Z ),
            this.Z.mul( this.T ),
            this.X.mul( this.Y )
        );
    }
}

export class ProjectivePoint
{
    constructor(
        readonly X: FieldElem51,
        readonly Y: FieldElem51,
        readonly Z: FieldElem51
    ) {}

    /*
    fn is_valid(&self) -> bool {
        // Curve equation is    -x^2 + y^2 = 1 + d*x^2*y^2,
        // homogenized as (-X^2 + Y^2)*Z^2 = Z^4 + d*X^2*Y^2
        let XX = self.X.square();
        let YY = self.Y.square();
        let ZZ = self.Z.square();
        let ZZZZ = ZZ.square();
        let lhs = &(&YY - &XX) * &ZZ;
        let rhs = &ZZZZ + &(&constants::EDWARDS_D * &(&XX * &YY));

        lhs == rhs
    }
    */
    is_valid()
    {
        const XX = this.X.square();
        const YY = this.Y.square();
        const ZZ = this.Z.square();
        const ZZZZ = ZZ.square();
        const lhs = YY.sub( XX ).mul( ZZ );
        const rhs = ZZZZ.add( FieldElem51.EDWARDS_D.mul( XX.mul( YY ) ) );

        return lhs.ct_eq( rhs );
    }

    clone(): ProjectivePoint
    {
        return new ProjectivePoint(
            this.X.clone(),
            this.Y.clone(),
            this.Z.clone()
        );
    }
    /*
    pub fn to_extended(&self) -> EdwardsPoint {
        EdwardsPoint {
            X: &self.X * &self.Z,
            Y: &self.Y * &self.Z,
            Z: self.Z.square(),
            T: &self.X * &self.Y,
        }
    }
    */
    toExtended(): EdwardsPoint
    {
        return new EdwardsPoint(
            this.X.mul( this.Z ),
            this.Y.mul( this.Z ),
            this.Z.square(),
            this.X.mul( this.Y )
        );
    }

    static get IDENTITY(): ProjectivePoint
    {
        return new ProjectivePoint(
            FieldElem51.zero(),
            FieldElem51.one(),
            FieldElem51.one()
        );
    }

    /*
    /// Double this point: return self + self
    pub fn double(&self) -> CompletedPoint { // Double()
        let XX          = self.X.square();
        let YY          = self.Y.square();
        let ZZ2         = self.Z.square2();
        let X_plus_Y    = &self.X + &self.Y;
        let X_plus_Y_sq = X_plus_Y.square();
        let YY_plus_XX  = &YY + &XX;
        let YY_minus_XX = &YY - &XX;

        CompletedPoint{
            X: &X_plus_Y_sq - &YY_plus_XX,
            Y: YY_plus_XX,
            Z: YY_minus_XX,
            T: &ZZ2 - &YY_minus_XX
        }
    }
    */
    double(): CompletedPoint
    {
        const XX = this.X.square();
        const YY = this.Y.square();
        const ZZ2 = this.Z.square2();
        const X_plus_Y = this.X.add( this.Y );
        const X_plus_Y_sq = X_plus_Y.square();
        const YY_plus_XX = YY.add( XX );
        const YY_minus_XX = YY.sub( XX );

        return new CompletedPoint(
            X_plus_Y_sq.sub( YY_plus_XX ),
            YY_plus_XX,
            YY_minus_XX,
            ZZ2.sub( YY_minus_XX )
        );
    }
}

/*
#[inline]
    fn write_u64(buf: &mut [u8], n: u64) {
        buf[..8].copy_from_slice(&n.to_le_bytes());
    }
fn from(x: u64) -> Scalar {
        use byteorder::{ByteOrder, LittleEndian};
        let mut s_bytes = [0u8; 32];
        LittleEndian::write_u64(&mut s_bytes, x);
        Scalar{ bytes: s_bytes }
    }
*/
export function scalar_from_u64( n: bigint | number ): Uint8Array
{
    n = BigInt( n );
    const s_bytes = new Uint8Array( 32 );
    const view = new DataView( s_bytes.buffer );

    view.setBigUint64( 0, n, true );

    return s_bytes;
}

export function scalar_from_bytes_mod_order_wide( input: Uint8Array ): Uint8Array
{
    // UnpackedScalar::from_bytes_wide(input).pack()
    return pack_unpacked_scalar(
        unpacked_scalar_from_bytes_wide(
            input
        )
    );
}

export function mul_scalars( a: Uint8Array, b: Uint8Array ): Uint8Array
{
    return pack_unpacked_scalar(
        mul_unpacked_scalars(
            unpacked_scalar_from_bytes( a ),
            unpacked_scalar_from_bytes( b )
        )
    )
}

/*
type Output = Scalar;
    #[allow(non_snake_case)]
    fn add(self, _rhs: &'b Scalar) -> Scalar {
        // The UnpackedScalar::add function produces reduced outputs
        // if the inputs are reduced.  However, these inputs may not
        // be reduced -- they might come from Scalar::from_bits.  So
        // after computing the sum, we explicitly reduce it mod l
        // before repacking.
        let sum = UnpackedScalar::add(&self.unpack(), &_rhs.unpack());
        let sum_R = UnpackedScalar::mul_internal(&sum, &constants::R);
        let sum_mod_l = UnpackedScalar::montgomery_reduce(&sum_R);
        sum_mod_l.pack()
    }
*/
export function add_scalars( a: Uint8Array, b: Uint8Array ): Uint8Array
{
    const sum = unpacked_scalar_add(
        unpacked_scalar_from_bytes( a ),
        unpacked_scalar_from_bytes( b )
    );
    const sum_R = scalar_mul_internal( sum, SCALAR_R );
    const sum_mod_l = scalar_montgomery_reduce( sum_R );
    return pack_unpacked_scalar( sum_mod_l );
}

/*
// Compute `a + b` (mod l)
    pub fn add(a: &Scalar52, b: &Scalar52) -> Scalar52 {
        let mut sum = Scalar52::zero();
        let mask = (1u64 << 52) - 1;

        // a + b
        let mut carry: u64 = 0;
        for i in 0..5 {
            carry = a[i] + b[i] + (carry >> 52);
            sum[i] = carry & mask;
        }

        // subtract l if the sum is >= l
        Scalar52::sub(&sum, &constants::L)
    }
*/
function unpacked_scalar_add( a: BigUint64Array, b: BigUint64Array ): BigUint64Array
{
    let sum = SCALAR_0.slice();
    const mask = LOW_52_BIT_MASK;

    let carry = _0n;
    for( let i = 0; i < 5; i++ )
    {
        carry = a[i] + b[i] + (carry >> _52n);
        sum[i] = carry & mask;
    }

    return scalar_sub( sum, SCALAR_L );
}

/*
/// Unpack a 32 byte / 256 bit scalar into 5 52-bit limbs.
    pub fn from_bytes(bytes: &[u8; 32]) -> Scalar52 {
        let mut words = [0u64; 4];
        for i in 0..4 {
            for j in 0..8 {
                words[i] |= (bytes[(i * 8) + j] as u64) << (j * 8);
            }
        }

        let mask = (1u64 << 52) - 1;
        let top_mask = (1u64 << 48) - 1;
        let mut s = Scalar52::zero();

        s[ 0] =   words[0]                            & mask;
        s[ 1] = ((words[0] >> 52) | (words[1] << 12)) & mask;
        s[ 2] = ((words[1] >> 40) | (words[2] << 24)) & mask;
        s[ 3] = ((words[2] >> 28) | (words[3] << 36)) & mask;
        s[ 4] =  (words[3] >> 16)                     & top_mask;

        s
    }
*/
function unpacked_scalar_from_bytes( input: Uint8Array ): BigUint64Array
{
    const words = new BigUint64Array(4);
    for( let i = 0; i < 4; i++ )
    {
        for( let j = 0; j < 8; j++ )
        {
            words[i] |= BigInt(input[(i * 8) + j]) << BigInt(j * 8);
        }
    }

    const mask = LOW_52_BIT_MASK;
    const top_mask = (_1n << BigInt(48)) - _1n;
    const s = SCALAR_0.slice();

    s[ 0] =   words[0]                                            & mask;
    s[ 1] = ((words[0] >> _52n)       | (words[1] << BigInt(12))) & mask;
    s[ 2] = ((words[1] >> BigInt(40)) | (words[2] << BigInt(24))) & mask;
    s[ 3] = ((words[2] >> BigInt(28)) | (words[3] << BigInt(36))) & mask;
    s[ 4] = ( words[3] >> BigInt(16))                             & top_mask;

    return s;
}
export const unpack_scalar = unpacked_scalar_from_bytes;

/*
#[inline(never)]
    pub fn mul(a: &Scalar52, b: &Scalar52) -> Scalar52 {
        let ab = Scalar52::montgomery_reduce(&Scalar52::mul_internal(a, b));
        Scalar52::montgomery_reduce(&Scalar52::mul_internal(&ab, &constants::RR))
    }
*/
function mul_unpacked_scalars( a: BigUint64Array, b: BigUint64Array ): BigUint64Array
{
    const ab = scalar_montgomery_reduce( scalar_mul_internal( a, b ) );
    return scalar_montgomery_reduce( scalar_mul_internal( ab, SCALAR_RR ) );
}

/*
pub struct Scalar52(pub [u64; 5]);

    /// Reduce a 64 byte / 512 bit scalar mod l
    pub fn from_bytes_wide(bytes: &[u8; 64]) -> Scalar52 {
        let mut words = [0u64; 8];
        for i in 0..8 {
            for j in 0..8 {
                words[i] |= (bytes[(i * 8) + j] as u64) << (j * 8);
            }
        }

        let mask = (1u64 << 52) - 1;
        let mut lo = Scalar52::zero();
        let mut hi = Scalar52::zero();

        lo[0] =   words[ 0]                             & mask;
        lo[1] = ((words[ 0] >> 52) | (words[ 1] << 12)) & mask;
        lo[2] = ((words[ 1] >> 40) | (words[ 2] << 24)) & mask;
        lo[3] = ((words[ 2] >> 28) | (words[ 3] << 36)) & mask;
        lo[4] = ((words[ 3] >> 16) | (words[ 4] << 48)) & mask;
        hi[0] =  (words[ 4] >>  4)                      & mask;
        hi[1] = ((words[ 4] >> 56) | (words[ 5] <<  8)) & mask;
        hi[2] = ((words[ 5] >> 44) | (words[ 6] << 20)) & mask;
        hi[3] = ((words[ 6] >> 32) | (words[ 7] << 32)) & mask;
        hi[4] =   words[ 7] >> 20                             ;

        lo = Scalar52::montgomery_mul(&lo, &constants::R);  // (lo * R) / R = lo
        hi = Scalar52::montgomery_mul(&hi, &constants::RR); // (hi * R^2) / R = hi * R

        Scalar52::add(&hi, &lo)
    }

*/
export function unpacked_scalar_from_bytes_wide( input: Uint8Array ): BigUint64Array
{
    // UnpackedScalar::from_bytes_wide(input)
    const words = new BigUint64Array(8);
    for( let i = 0; i < 8; i++ )
    {
        for( let j = 0; j < 8; j++ )
        {
            words[i] |= BigInt( input[(i * 8) + j] ) << BigInt( (j * 8) );
        }
    }

    const mask = LOW_52_BIT_MASK;
    let lo = new BigUint64Array(5);
    let hi = new BigUint64Array(5);

    lo[0] =   words[0]                                             & mask;
    lo[1] = ((words[0] >> _52n)       | (words[ 1] << BigInt(12))) & mask;
    lo[2] = ((words[1] >> BigInt(40)) | (words[ 2] << BigInt(24))) & mask;
    lo[3] = ((words[2] >> BigInt(28)) | (words[ 3] << BigInt(36))) & mask;
    lo[4] = ((words[3] >> BigInt(16)) | (words[ 4] << BigInt(48))) & mask;

    hi[0] =  (words[4] >> BigInt( 4))                              & mask;
    hi[1] = ((words[4] >> BigInt(56)) | (words[ 5] << BigInt( 8))) & mask;
    hi[2] = ((words[5] >> BigInt(44)) | (words[ 6] << BigInt(20))) & mask;
    hi[3] = ((words[6] >> BigInt(32)) | (words[ 7] << BigInt(32))) & mask;
    hi[4] =   words[7] >> BigInt(20);

    lo = scalar_montgomery_mul( lo, SCALAR_R );
    hi = scalar_montgomery_mul( hi, SCALAR_RR );

    return scalar_52_add( hi, lo );
}

const SCALAR_R: BigUint64Array = new BigUint64Array([
    BigInt( "0x000f48bd6721e6ed" ),
    BigInt( "0x0003bab5ac67e45a" ),
    BigInt( "0x000fffffeb35e51b" ),
    BigInt( "0x000fffffffffffff" ),
    BigInt( "0x00000fffffffffff" ),
]);
const SCALAR_RR: BigUint64Array = new BigUint64Array([
    BigInt( "0x0009d265e952d13b" ),
    BigInt( "0x000d63c715bea69f" ),
    BigInt( "0x0005be65cb687604" ),
    BigInt( "0x0003dceec73d217f" ),
    BigInt( "0x000009411b7c309a" ),
]);

/*
/// Compute `a + b` (mod l)
    pub fn add(a: &Scalar52, b: &Scalar52) -> Scalar52 {
        let mut sum = Scalar52::zero();
        let mask = (1u64 << 52) - 1;

        // a + b
        let mut carry: u64 = 0;
        for i in 0..5 {
            carry = a[i] + b[i] + (carry >> 52);
            sum[i] = carry & mask;
        }

        // subtract l if the sum is >= l
        Scalar52::sub(&sum, &constants::L)
    }
*/
function scalar_52_add( a: BigUint64Array, b: BigUint64Array ): BigUint64Array
{
    const sum = SCALAR_0.slice();
    const mask = LOW_52_BIT_MASK;

    let carry = _0n;
    for( let i = 0; i < 5; i++ )
    {
        carry = a[i] + b[i] + (carry >> _52n);
        sum[i] = carry & mask;
    }

    return scalar_sub( sum, SCALAR_L );
}

function scalar_montgomery_mul( a: BigUint64Array, b: BigUint64Array ): BigUint64Array
{
    return scalar_montgomery_reduce( scalar_mul_internal( a, b ) );
}

/*
// Compute `limbs/R` (mod l), where R is the Montgomery modulus 2^260
    #[inline(always)]
    pub (crate) fn montgomery_reduce(limbs: &[u128; 9]) -> Scalar52 {

        #[inline(always)]
        fn part1(sum: u128) -> (u128, u64) {
            let p = (sum as u64).wrapping_mul(constants::LFACTOR) & ((1u64 << 52) - 1);
            ((sum + m(p,constants::L[0])) >> 52, p)
        }

        #[inline(always)]
        fn part2(sum: u128) -> (u128, u64) {
            let w = (sum as u64) & ((1u64 << 52) - 1);
            (sum >> 52, w)
        }

        // note: l[3] is zero, so its multiples can be skipped
        let l = &constants::L;

        // the first half computes the Montgomery adjustment factor n, and begins adding n*l to make limbs divisible by R
        let (carry, n0) = part1(        limbs[0]);
        let (carry, n1) = part1(carry + limbs[1] + m(n0,l[1]));
        let (carry, n2) = part1(carry + limbs[2] + m(n0,l[2]) + m(n1,l[1]));
        let (carry, n3) = part1(carry + limbs[3]              + m(n1,l[2]) + m(n2,l[1]));
        let (carry, n4) = part1(carry + limbs[4] + m(n0,l[4])              + m(n2,l[2]) + m(n3,l[1]));

        // limbs is divisible by R now, so we can divide by R by simply storing the upper half as the result
        let (carry, r0) = part2(carry + limbs[5]              + m(n1,l[4])              + m(n3,l[2]) + m(n4,l[1]));
        let (carry, r1) = part2(carry + limbs[6]                           + m(n2,l[4])              + m(n4,l[2]));
        let (carry, r2) = part2(carry + limbs[7]                                        + m(n3,l[4])             );
        let (carry, r3) = part2(carry + limbs[8]                                                     + m(n4,l[4]));
        let         r4 = carry as u64;

        // result may be >= l, so attempt to subtract l
        Scalar52::sub(&Scalar52([r0,r1,r2,r3,r4]), l)
    }

*/
function scalar_montgomery_reduce( limbs: bigint[] & { length: 9 } ): BigUint64Array
{
    const l = SCALAR_L.slice();
    let
        carry: bigint,
        n0: bigint, n1: bigint, n2: bigint, n3: bigint, n4: bigint,
        r0: bigint, r1: bigint, r2: bigint, r3: bigint, r4: bigint;

    [carry, n0] = smr_part1(         limbs[0] );
    [carry, n1] = smr_part1( carry + limbs[1] + ( n0 * l[1] ) );
    [carry, n2] = smr_part1( carry + limbs[2] + ( n0 * l[2] ) + ( n1 * l[1] ) );
    [carry, n3] = smr_part1( carry + limbs[3]                 + ( n1 * l[2] ) + ( n2 * l[1] ) );
    [carry, n4] = smr_part1( carry + limbs[4] + ( n0 * l[4] )                 + ( n2 * l[2] ) + ( n3 * l[1] ) );

    [carry, r0] = smr_part2( carry + limbs[5]                 + ( n1 * l[4] )                 + ( n3 * l[2] ) + ( n4 * l[1] ) );
    [carry, r1] = smr_part2( carry + limbs[6]                                 + ( n2 * l[4] )                 + ( n4 * l[2] ) );
    [carry, r2] = smr_part2( carry + limbs[7]                                                 + ( n3 * l[4] )                 );
    [carry, r3] = smr_part2( carry + limbs[8]                                                                 + ( n4 * l[4] ) );
            r4 = carry & LOW_64_BIT_MASK;

    return scalar_sub( new BigUint64Array([r0, r1, r2, r3, r4]), l );
}

function smr_part1( sum: bigint ): [bigint, bigint]
{
    const p = rust_u64_wrapping_mul(sum, LFACTOR) & LOW_52_BIT_MASK;
    return [
        (sum + ( p * SCALAR_L[0] )) >> _52n,
        p
    ];
}

function smr_part2( sum: bigint ): [bigint, bigint]
{
    const w = sum & LOW_52_BIT_MASK;
    return [
        sum >> _52n,
        w
    ];
}

const U64_PLUS_ONE = _1n << _64n;

function rust_u64_wrapping_mul( a: bigint, b: bigint ): bigint
{
    // Convert inputs to BigInt and perform multiplication
    return (a * b) % U64_PLUS_ONE;
}

/*
/// Compute `a - b` (mod l)
    pub fn sub(a: &Scalar52, b: &Scalar52) -> Scalar52 {
        let mut difference = Scalar52::zero();
        let mask = (1u64 << 52) - 1;

        // a - b
        let mut borrow: u64 = 0;
        for i in 0..5 {
            borrow = a[i].wrapping_sub(b[i] + (borrow >> 63));
            difference[i] = borrow & mask;
        }

        // conditionally add l if the difference is negative
        let underflow_mask = ((borrow >> 63) ^ 1).wrapping_sub(1);
        let mut carry: u64 = 0;
        for i in 0..5 {
            carry = (carry >> 52) + difference[i] + (constants::L[i] & underflow_mask);
            difference[i] = carry & mask;
        }

        difference
    }
*/
function scalar_sub( a: BigUint64Array, b: BigUint64Array ): BigUint64Array
{
    let difference = SCALAR_0.slice();
    const mask = LOW_52_BIT_MASK;

    let borrow = _0n;
    for( let i = 0; i < 5; i++ )
    {
        borrow = rust_u64_wrapping_sub( a[i], ( b[i] + ( borrow >> BigInt(63) ) ) );
        difference[i] = borrow & mask;
    }

    // conditionally add l if the difference is negative
    const underflow_mask = rust_u64_wrapping_sub( ( borrow >> BigInt(63) ) ^ _1n, _1n );
    let carry = _0n;
    for( let i = 0; i < 5; i++ )
    {
        carry = (carry >> _52n) + difference[i] + ( SCALAR_L[i] & underflow_mask );
        difference[i] = carry & mask;
    }

    return difference;
}

/**
 * ```rs
 * pub const fn wrapping_sub_signed(self, rhs: i64) -> u64
 * ```
*/
function rust_u64_wrapping_sub(self: bigint, rhs: bigint) {
    const U64_MAX = LOW_64_BIT_MASK; // 2^64 - 1, max value of u64

    // Convert inputs to BigInt
    let result = BigInt(self) - BigInt(rhs);

    // Wrap around if out of bounds
    if (result < _0n) {
        result += U64_MAX + _1n; // Wrap from negative to upper bound
    } else if (result > U64_MAX) {
        result %= U64_MAX + _1n; // Wrap around on overflow
    }

    return result;
}

const SCALAR_0 = new BigUint64Array( 5 ).fill( _0n )

const SCALAR_L = new BigUint64Array([
    BigInt( "0x0002631a5cf5d3ed" ),
    BigInt( "0x000dea2f79cd6581" ),
    BigInt( "0x000000000014def9" ),
    BigInt( "0x0000000000000000" ),
    BigInt( "0x0000100000000000" ),
]);

const LFACTOR = BigInt( "0x51da312547e1b" );

/*
#[inline(always)]
fn m(x: u64, y: u64) -> u128 {
    (x as u128) * (y as u128)
}
/// Compute `a * b`
    #[inline(always)]
    pub (crate) fn mul_internal(a: &Scalar52, b: &Scalar52) -> [u128; 9] {
        let mut z = [0u128; 9];

        z[0] = m(a[0],b[0]);
        z[1] = m(a[0],b[1]) + m(a[1],b[0]);
        z[2] = m(a[0],b[2]) + m(a[1],b[1]) + m(a[2],b[0]);
        z[3] = m(a[0],b[3]) + m(a[1],b[2]) + m(a[2],b[1]) + m(a[3],b[0]);
        z[4] = m(a[0],b[4]) + m(a[1],b[3]) + m(a[2],b[2]) + m(a[3],b[1]) + m(a[4],b[0]);
        z[5] =                m(a[1],b[4]) + m(a[2],b[3]) + m(a[3],b[2]) + m(a[4],b[1]);
        z[6] =                               m(a[2],b[4]) + m(a[3],b[3]) + m(a[4],b[2]);
        z[7] =                                              m(a[3],b[4]) + m(a[4],b[3]);
        z[8] =                                                             m(a[4],b[4]);

        z
    }
*/
function scalar_mul_internal( a: BigUint64Array, b: BigUint64Array ): bigint[] & { length: 9 }
{
    const z = new Array<bigint>( 9 ) as bigint[] & { length: 9 };

    z[0] = a[0] * b[0];
    z[1] = a[0] * b[1] + a[1] * b[0];
    z[2] = a[0] * b[2] + a[1] * b[1] + a[2] * b[0];
    z[3] = a[0] * b[3] + a[1] * b[2] + a[2] * b[1] + a[3] * b[0];
    z[4] = a[0] * b[4] + a[1] * b[3] + a[2] * b[2] + a[3] * b[1] + a[4] * b[0];
    z[5] =               a[1] * b[4] + a[2] * b[3] + a[3] * b[2] + a[4] * b[1];
    z[6] =                             a[2] * b[4] + a[3] * b[3] + a[4] * b[2];
    z[7] =                                           a[3] * b[4] + a[4] * b[3];
    z[8] =                                                         a[4] * b[4];

    return z;
}

/*
 /// Pack the limbs of this `Scalar52` into 32 bytes
    pub fn to_bytes(&self) -> [u8; 32] {
        let mut s = [0u8; 32];

        s[0]  =  (self.0[ 0] >>  0)                      as u8;
        s[1]  =  (self.0[ 0] >>  8)                      as u8;
        s[2]  =  (self.0[ 0] >> 16)                      as u8;
        s[3]  =  (self.0[ 0] >> 24)                      as u8;
        s[4]  =  (self.0[ 0] >> 32)                      as u8;
        s[5]  =  (self.0[ 0] >> 40)                      as u8;
        s[6]  = ((self.0[ 0] >> 48) | (self.0[ 1] << 4)) as u8;
        s[7]  =  (self.0[ 1] >>  4)                      as u8;
        s[8]  =  (self.0[ 1] >> 12)                      as u8;
        s[9]  =  (self.0[ 1] >> 20)                      as u8;
        s[10] =  (self.0[ 1] >> 28)                      as u8;
        s[11] =  (self.0[ 1] >> 36)                      as u8;
        s[12] =  (self.0[ 1] >> 44)                      as u8;
        s[13] =  (self.0[ 2] >>  0)                      as u8;
        s[14] =  (self.0[ 2] >>  8)                      as u8;
        s[15] =  (self.0[ 2] >> 16)                      as u8;
        s[16] =  (self.0[ 2] >> 24)                      as u8;
        s[17] =  (self.0[ 2] >> 32)                      as u8;
        s[18] =  (self.0[ 2] >> 40)                      as u8;
        s[19] = ((self.0[ 2] >> 48) | (self.0[ 3] << 4)) as u8;
        s[20] =  (self.0[ 3] >>  4)                      as u8;
        s[21] =  (self.0[ 3] >> 12)                      as u8;
        s[22] =  (self.0[ 3] >> 20)                      as u8;
        s[23] =  (self.0[ 3] >> 28)                      as u8;
        s[24] =  (self.0[ 3] >> 36)                      as u8;
        s[25] =  (self.0[ 3] >> 44)                      as u8;
        s[26] =  (self.0[ 4] >>  0)                      as u8;
        s[27] =  (self.0[ 4] >>  8)                      as u8;
        s[28] =  (self.0[ 4] >> 16)                      as u8;
        s[29] =  (self.0[ 4] >> 24)                      as u8;
        s[30] =  (self.0[ 4] >> 32)                      as u8;
        s[31] =  (self.0[ 4] >> 40)                      as u8;

        s
    }
*/
export function pack_unpacked_scalar( input: BigUint64Array ): Uint8Array
{
    const s = new Uint8Array( 32 );
    const u8mask = BigInt( 0xff );

    s[0 ] = Number( (input[0] >> _0n)                                   & u8mask);
    s[1 ] = Number( (input[0] >> BigInt( 8))                            & u8mask);
    s[2 ] = Number( (input[0] >> BigInt(16))                            & u8mask);
    s[3 ] = Number( (input[0] >> BigInt(24))                            & u8mask);
    s[4 ] = Number( (input[0] >> BigInt(32))                            & u8mask);
    s[5 ] = Number( (input[0] >> BigInt(40))                            & u8mask);
    s[6 ] = Number(((input[0] >> BigInt(48)) | (input[1] << BigInt(4))) & u8mask);

    s[7 ] = Number( (input[1] >> BigInt( 4))                            & u8mask);
    s[8 ] = Number( (input[1] >> BigInt(12))                            & u8mask);
    s[9 ] = Number( (input[1] >> BigInt(20))                            & u8mask);
    s[10] = Number( (input[1] >> BigInt(28))                            & u8mask);
    s[11] = Number( (input[1] >> BigInt(36))                            & u8mask);
    s[12] = Number( (input[1] >> BigInt(44))                            & u8mask);

    s[13] = Number( (input[2] >> _0n)                            & u8mask);
    s[14] = Number( (input[2] >> BigInt( 8))                            & u8mask);
    s[15] = Number( (input[2] >> BigInt(16))                            & u8mask);
    s[16] = Number( (input[2] >> BigInt(24))                            & u8mask);
    s[17] = Number( (input[2] >> BigInt(32))                            & u8mask);
    s[18] = Number( (input[2] >> BigInt(40))                            & u8mask);
    s[19] = Number(((input[2] >> BigInt(48)) | (input[3] << BigInt(4))) & u8mask);

    s[20] = Number( (input[3] >> BigInt( 4))                            & u8mask);
    s[21] = Number( (input[3] >> BigInt(12))                            & u8mask);
    s[22] = Number( (input[3] >> BigInt(20))                            & u8mask);
    s[23] = Number( (input[3] >> BigInt(28))                            & u8mask);
    s[24] = Number( (input[3] >> BigInt(36))                            & u8mask);
    s[25] = Number( (input[3] >> BigInt(44))                            & u8mask);

    s[26] = Number( (input[4] >> _0n)                            & u8mask);
    s[27] = Number( (input[4] >> BigInt( 8))                            & u8mask);
    s[28] = Number( (input[4] >> BigInt(16))                            & u8mask);
    s[29] = Number( (input[4] >> BigInt(24))                            & u8mask);
    s[30] = Number( (input[4] >> BigInt(32))                            & u8mask);
    s[31] = Number( (input[4] >> BigInt(40))                            & u8mask);

    return s;
}

/*
#[allow(non_snake_case)]
    fn neg(self) -> Scalar {
        let self_R = UnpackedScalar::mul_internal(&self.unpack(), &constants::R);
        let self_mod_l = UnpackedScalar::montgomery_reduce(&self_R);
        UnpackedScalar::sub(&UnpackedScalar::zero(), &self_mod_l).pack()
    }
}
*/
export function negate_scalar( scalar: Uint8Array ): Uint8Array
{
    const self_R = scalar_mul_internal(
        unpacked_scalar_from_bytes( scalar ),
        SCALAR_R
    );
    const self_mod_l = scalar_montgomery_reduce( self_R );
    return pack_unpacked_scalar(
        scalar_sub(
            SCALAR_0,
            self_mod_l
        )
    );
}

/*
pub(crate) fn non_adjacent_form(&self, w: usize) -> [i8; 256] {
        // required by the NAF definition
        debug_assert!( w >= 2 );
        // required so that the NAF digits fit in i8
        debug_assert!( w <= 8 );

        use byteorder::{ByteOrder, LittleEndian};

        let mut naf = [0i8; 256];

        let mut x_u64 = [0u64; 5];
        LittleEndian::read_u64_into(&self.bytes, &mut x_u64[0..4]);

        let width = 1 << w;
        let window_mask = width - 1;

        let mut pos = 0;
        let mut carry = 0;
        while pos < 256 {
            // Construct a buffer of bits of the scalar, starting at bit `pos`
            let u64_idx = pos / 64;
            let bit_idx = pos % 64;
            let bit_buf: u64;
            if bit_idx < 64 - w {
                // This window's bits are contained in a single u64
                bit_buf = x_u64[u64_idx] >> bit_idx;
            } else {
                // Combine the current u64's bits with the bits from the next u64
                bit_buf = (x_u64[u64_idx] >> bit_idx) | (x_u64[1+u64_idx] << (64 - bit_idx));
            }

            // Add the carry into the current window
            let window = carry + (bit_buf & window_mask);

            if window & 1 == 0 {
                // If the window value is even, preserve the carry and continue.
                // Why is the carry preserved?
                // If carry == 0 and window & 1 == 0, then the next carry should be 0
                // If carry == 1 and window & 1 == 0, then bit_buf & 1 == 1 so the next carry should be 1
                pos += 1;
                continue;
            }

            if window < width/2 {
                carry = 0;
                naf[pos] = window as i8;
            } else {
                carry = 1;
                naf[pos] = (window as i8).wrapping_sub(width as i8);
            }

            pos += w;
        }

        naf
    }
*/
function scalar_non_adjacent_form( scalar: Uint8Array, w: number ): Int8Array
{
    // required by the NAF definition
    if( w < 2 )
        throw new Error( "w must be >= 2" );
    // required so that the NAF digits fit in i8
    if( w > 8 )
        throw new Error( "w must be <= 8" );

    const naf = new Int8Array( 256 );
    const naf_u8 = new Uint8Array( naf.buffer );

    const x_u64 = new BigUint64Array( 5 );
    // LittleEndian::read_u64_into(&self.bytes, &mut x_u64[0..4]);
    read_u64_into_LE( scalar, x_u64, 4 );

    const width = _1n << BigInt(w);
    const window_mask = width - _1n;

    let pos = 0;
    let carry = _0n;
    while( pos < 256 )
    {
        let u64_idx = (pos / 64) >>> 0;
        let bit_idx = pos % 64;
        let bit_buf: bigint;
        if( bit_idx < 64 - w )
            bit_buf = x_u64[u64_idx] >> BigInt(bit_idx);
        else
            bit_buf = (x_u64[u64_idx] >> BigInt(bit_idx)) | (x_u64[1+u64_idx] << BigInt(64 - bit_idx));

        const window = carry + (bit_buf & window_mask);

        if( (window & _1n) === _0n )
        {
            // If the window value is even, preserve the carry and continue.
            // Why is the carry preserved?
            // If carry == 0 and window & 1 == 0, then the next carry should be 0
            // If carry == 1 and window & 1 == 0, then bit_buf & 1 == 1 so the next carry should be 1
            pos += 1;
            continue;
        }

        if( window < (width / BigInt(2)) )
        {
            carry = _0n;
            naf_u8[pos] = Number(window) & 0xff;
        }
        else
        {
            carry = _1n;
            naf_u8[pos] = (Number(window) - Number(width)) & 0xff;
        }

        pos += w;
    }

    return naf;
}

function read_u64_into_LE(src: Uint8Array, dst: BigUint64Array, dst_len: number = (Math.min( dst.length * 8, src.length ) / 8) >>> 0 ): void
{
    if (src.length > dst.length * 8) {
        throw new Error("Source and destination size mismatch");
    }

    const srcView = new DataView(src.buffer, src.byteOffset, src.byteLength);
    const dstView = new DataView(dst.buffer, dst.byteOffset, dst.byteLength);

    for (let i = 0; i < dst_len; i++) {
        dstView.setBigUint64(i * 8, srcView.getBigUint64(i * 8, true), true);
    }
}

const AFFINE_ODD_MULTIPLES_OF_BASEPOINT: NafLookupTable<AffineNielsPoint> = new NafLookupTable([
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3540182452943730" ),
            BigInt( "2497478415033846" ),
            BigInt( "2521227595762870" ),
            BigInt( "1462984067271729" ),
            BigInt( "2389212253076811" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "62697248952638" ),
            BigInt( "204681361388450" ),
            BigInt( "631292143396476" ),
            BigInt( "338455783676468" ),
            BigInt( "1213667448819585" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "301289933810280" ),
            BigInt( "1259582250014073" ),
            BigInt( "1422107436869536" ),
            BigInt( "796239922652654" ),
            BigInt( "1953934009299142" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1601611775252272" ),
            BigInt( "1720807796594148" ),
            BigInt( "1132070835939856" ),
            BigInt( "3512254832574799" ),
            BigInt( "2147779492816910" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "316559037616741" ),
            BigInt( "2177824224946892" ),
            BigInt( "1459442586438991" ),
            BigInt( "1461528397712656" ),
            BigInt( "751590696113597" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1850748884277385" ),
            BigInt( "1200145853858453" ),
            BigInt( "1068094770532492" ),
            BigInt( "672251375690438" ),
            BigInt( "1586055907191707" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "769950342298400" ),
            BigInt( "2384754244604994" ),
            BigInt( "3095885746880802" ),
            BigInt( "3225892188161580" ),
            BigInt( "2977876099231263" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "425251763115706" ),
            BigInt( "608463272472562" ),
            BigInt( "442562545713235" ),
            BigInt( "837766094556764" ),
            BigInt( "374555092627893" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1086255230780037" ),
            BigInt( "274979815921559" ),
            BigInt( "1960002765731872" ),
            BigInt( "929474102396301" ),
            BigInt( "1190409889297339" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2916800678241215" ),
            BigInt( "2065379846933858" ),
            BigInt( "2622030924071124" ),
            BigInt( "2602788184473875" ),
            BigInt( "1233371373142984" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "2019367628972465" ),
            BigInt( "676711900706637" ),
            BigInt( "110710997811333" ),
            BigInt( "1108646842542025" ),
            BigInt( "517791959672113" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "965130719900578" ),
            BigInt( "247011430587952" ),
            BigInt( "526356006571389" ),
            BigInt( "91986625355052" ),
            BigInt( "2157223321444601" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1802695059464988" ),
            BigInt( "1664899123557221" ),
            BigInt( "2845359304426105" ),
            BigInt( "2160434469266658" ),
            BigInt( "3179370264440279" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1725674970513508" ),
            BigInt( "1933645953859181" ),
            BigInt( "1542344539275782" ),
            BigInt( "1767788773573747" ),
            BigInt( "1297447965928905" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1381809363726107" ),
            BigInt( "1430341051343062" ),
            BigInt( "2061843536018959" ),
            BigInt( "1551778050872521" ),
            BigInt( "2036394857967624" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "4222693909998302" ),
            BigInt( "2779866139518454" ),
            BigInt( "1619374932191226" ),
            BigInt( "2207306624415883" ),
            BigInt( "1169170329061080" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "2070390218572616" ),
            BigInt( "1458919061857835" ),
            BigInt( "624171843017421" ),
            BigInt( "1055332792707765" ),
            BigInt( "433987520732508" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "893653801273833" ),
            BigInt( "1168026499324677" ),
            BigInt( "1242553501121234" ),
            BigInt( "1306366254304474" ),
            BigInt( "1086752658510815" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2465253816303469" ),
            BigInt( "3191571337672685" ),
            BigInt( "1159882208056013" ),
            BigInt( "2569188183312765" ),
            BigInt( "621213314200686" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1971678598905747" ),
            BigInt( "338026507889165" ),
            BigInt( "762398079972271" ),
            BigInt( "655096486107477" ),
            BigInt( "42299032696322" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "177130678690680" ),
            BigInt( "1754759263300204" ),
            BigInt( "1864311296286618" ),
            BigInt( "1180675631479880" ),
            BigInt( "1292726903152791" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1913163449625248" ),
            BigInt( "2712579013977241" ),
            BigInt( "2193883288642313" ),
            BigInt( "1008900146920800" ),
            BigInt( "1721983679009502" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1070401523076875" ),
            BigInt( "1272492007800961" ),
            BigInt( "1910153608563310" ),
            BigInt( "2075579521696771" ),
            BigInt( "1191169788841221" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "692896803108118" ),
            BigInt( "500174642072499" ),
            BigInt( "2068223309439677" ),
            BigInt( "1162190621851337" ),
            BigInt( "1426986007309901" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1819621230288238" ),
            BigInt( "2735700366193240" ),
            BigInt( "1755134670739586" ),
            BigInt( "3080648199451191" ),
            BigInt( "4172807995775876" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "992069868904071" ),
            BigInt( "799011518185730" ),
            BigInt( "1777586403832768" ),
            BigInt( "1134820506145684" ),
            BigInt( "1999461475558530" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "425204543703124" ),
            BigInt( "2040469794090382" ),
            BigInt( "1651690622153809" ),
            BigInt( "1500530168597569" ),
            BigInt( "1253908377065966" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2105824306960939" ),
            BigInt( "1387520302709358" ),
            BigInt( "3633176580451016" ),
            BigInt( "2211816663841753" ),
            BigInt( "1629085891776489" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1485201376284999" ),
            BigInt( "1022406647424656" ),
            BigInt( "504181009209019" ),
            BigInt( "962621520820995" ),
            BigInt( "590876713147230" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "265873406365287" ),
            BigInt( "1192742653492898" ),
            BigInt( "88553098803050" ),
            BigInt( "525037770869640" ),
            BigInt( "1266933811251234" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3552316659826612" ),
            BigInt( "1254279525791875" ),
            BigInt( "1609927932077699" ),
            BigInt( "3578654071679972" ),
            BigInt( "3750681296069893" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "37186803519861" ),
            BigInt( "1404297334376301" ),
            BigInt( "578519728836650" ),
            BigInt( "1740727951192592" ),
            BigInt( "2095534282477028" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "833234263154399" ),
            BigInt( "2023862470013762" ),
            BigInt( "1854137933982069" ),
            BigInt( "853924318090959" ),
            BigInt( "1589812702805850" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3679150557957763" ),
            BigInt( "1319179453661745" ),
            BigInt( "497496853611112" ),
            BigInt( "2665464286942351" ),
            BigInt( "1208137952365560" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1654513078530905" ),
            BigInt( "907489875842908" ),
            BigInt( "126098711296368" ),
            BigInt( "1726320004173677" ),
            BigInt( "28269495058173" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "114436686957443" ),
            BigInt( "532739313025996" ),
            BigInt( "115428841215897" ),
            BigInt( "2191499400074366" ),
            BigInt( "370280402676434" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1111146849833253" ),
            BigInt( "2016430049079759" ),
            BigInt( "1860522747477948" ),
            BigInt( "3537164738290194" ),
            BigInt( "4137142824844184" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "429069864577128" ),
            BigInt( "975327637149449" ),
            BigInt( "237881983565075" ),
            BigInt( "1654761232378630" ),
            BigInt( "2122527599091807" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "2093793463548278" ),
            BigInt( "754827233241879" ),
            BigInt( "1420389751719629" ),
            BigInt( "1829952782588138" ),
            BigInt( "2011865756773717" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "676293365438898" ),
            BigInt( "2850296017886344" ),
            BigInt( "1205350322490195" ),
            BigInt( "2763699392265669" ),
            BigInt( "2133931188538142" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "48340340349120" ),
            BigInt( "1299261101494832" ),
            BigInt( "1137329686775218" ),
            BigInt( "1534848106674340" ),
            BigInt( "1351662218216799" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1904520614137939" ),
            BigInt( "1590301001714014" ),
            BigInt( "215781420985270" ),
            BigInt( "2043534301034629" ),
            BigInt( "1970888949300424" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2365217962409710" ),
            BigInt( "2061307169694064" ),
            BigInt( "1887478590157603" ),
            BigInt( "2169639621284316" ),
            BigInt( "2373810867477200" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1020052624656948" ),
            BigInt( "1260412094216707" ),
            BigInt( "366721640607121" ),
            BigInt( "585331442306596" ),
            BigInt( "345876457758061" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "975390299880933" ),
            BigInt( "1066555195234642" ),
            BigInt( "12651997758352" ),
            BigInt( "1184252205433068" ),
            BigInt( "1058378155074223" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1431537716602643" ),
            BigInt( "2024827957433813" ),
            BigInt( "3746434518400495" ),
            BigInt( "1087794891033550" ),
            BigInt( "2156817571680455" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "929288033346881" ),
            BigInt( "255179964546973" ),
            BigInt( "711057989588035" ),
            BigInt( "208899572612840" ),
            BigInt( "185348357387383" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "823689746424808" ),
            BigInt( "47266130989546" ),
            BigInt( "209403309368097" ),
            BigInt( "1100966895202707" ),
            BigInt( "710792075292719" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2311213117823762" ),
            BigInt( "3296668540922318" ),
            BigInt( "2004276520649823" ),
            BigInt( "1861500579441125" ),
            BigInt( "3148029033359833" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1563693677475261" ),
            BigInt( "1843782073741194" ),
            BigInt( "1950700654453170" ),
            BigInt( "911540858113949" ),
            BigInt( "2085151496302359" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1427880892005482" ),
            BigInt( "106216431121745" ),
            BigInt( "42608394782284" ),
            BigInt( "1217295886989793" ),
            BigInt( "1514235272796882" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3544335535746750" ),
            BigInt( "2367994491347456" ),
            BigInt( "2567261456502612" ),
            BigInt( "1854058085060971" ),
            BigInt( "2263545563461076" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "787426011300053" ),
            BigInt( "2105981035769060" ),
            BigInt( "1130476291127206" ),
            BigInt( "1748659348100075" ),
            BigInt( "53470983013756" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "553548273865386" ),
            BigInt( "5927805718390" ),
            BigInt( "65184587381926" ),
            BigInt( "633576679686953" ),
            BigInt( "576048559439973" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "993787326657446" ),
            BigInt( "3868807161609258" ),
            BigInt( "1615796046728943" ),
            BigInt( "2514644292681953" ),
            BigInt( "2059021068660907" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "251010270518880" ),
            BigInt( "1681684095763484" ),
            BigInt( "1521949356387564" ),
            BigInt( "431593457045116" ),
            BigInt( "1855308922422910" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "618490909691959" ),
            BigInt( "1257497595618257" ),
            BigInt( "202952467594088" ),
            BigInt( "35577762721238" ),
            BigInt( "1494883566841973" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1673474571932262" ),
            BigInt( "2409784519770613" ),
            BigInt( "2636095316260487" ),
            BigInt( "2761112584601925" ),
            BigInt( "3333713288149876" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1600640202645197" ),
            BigInt( "1019569075331823" ),
            BigInt( "1041916487915822" ),
            BigInt( "1680448171313267" ),
            BigInt( "2126903137527901" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "894964745143659" ),
            BigInt( "106116880092678" ),
            BigInt( "1009869382959477" ),
            BigInt( "317866368542032" ),
            BigInt( "1986983122763912" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1765281781276487" ),
            BigInt( "2863247187455184" ),
            BigInt( "2589075472439062" ),
            BigInt( "1386435905543054" ),
            BigInt( "2182338478845320" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1144730936996693" ),
            BigInt( "2213315231278180" ),
            BigInt( "1489676672185125" ),
            BigInt( "665039429138074" ),
            BigInt( "1131283313040268" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "2004734176670602" ),
            BigInt( "1738311085075235" ),
            BigInt( "418866995976618" ),
            BigInt( "1050782508034394" ),
            BigInt( "577747313404652" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2185209688340293" ),
            BigInt( "1309276076461009" ),
            BigInt( "2514740038571278" ),
            BigInt( "3994889904012999" ),
            BigInt( "3018098826231021" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1405936970888515" ),
            BigInt( "1754621155316654" ),
            BigInt( "1211862168554999" ),
            BigInt( "1813045702919083" ),
            BigInt( "997853418197172" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "82037622045021" ),
            BigInt( "1646398333621944" ),
            BigInt( "613095452763466" ),
            BigInt( "1312329542583705" ),
            BigInt( "81014679202721" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2389287991277873" ),
            BigInt( "403851022333257" ),
            BigInt( "1597473361477193" ),
            BigInt( "2953351602509212" ),
            BigInt( "2135174663049062" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1826548187201150" ),
            BigInt( "302299893734126" ),
            BigInt( "1475477168615781" ),
            BigInt( "842617616347376" ),
            BigInt( "1438600873676130" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "663049852468609" ),
            BigInt( "1649295727846569" ),
            BigInt( "1048009692742781" ),
            BigInt( "628866177992421" ),
            BigInt( "1914360327429204" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1795645928096646" ),
            BigInt( "306878154408959" ),
            BigInt( "2924901319092394" ),
            BigInt( "2801261341654799" ),
            BigInt( "1653782432983523" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "2077597317438627" ),
            BigInt( "212642017882064" ),
            BigInt( "674844477518888" ),
            BigInt( "875487498687554" ),
            BigInt( "2060550250171182" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1420448018683809" ),
            BigInt( "1032663994771382" ),
            BigInt( "1341927003385267" ),
            BigInt( "1340360916546159" ),
            BigInt( "1988547473895228" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1082660122598844" ),
            BigInt( "2545055705583789" ),
            BigInt( "3888919679589007" ),
            BigInt( "1670283344995811" ),
            BigInt( "3403239134794618" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "90430593339788" ),
            BigInt( "1838338032241275" ),
            BigInt( "571293238480915" ),
            BigInt( "1639938867416883" ),
            BigInt( "257378872001111" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1528535658865034" ),
            BigInt( "1516636853043960" ),
            BigInt( "787000569996728" ),
            BigInt( "1464531394704506" ),
            BigInt( "1684822625133795" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "811329918113934" ),
            BigInt( "2783463529007378" ),
            BigInt( "1769095754634835" ),
            BigInt( "2970819621866866" ),
            BigInt( "881037178164325" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1784566501964517" ),
            BigInt( "433890943689325" ),
            BigInt( "1186055625589419" ),
            BigInt( "1496077405487512" ),
            BigInt( "1731807117886548" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "424909811816304" ),
            BigInt( "1355993963741797" ),
            BigInt( "409606483251841" ),
            BigInt( "455665350637068" ),
            BigInt( "1617009023642808" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2478728492077816" ),
            BigInt( "2780289048655501" ),
            BigInt( "2328687177473769" ),
            BigInt( "4107341333582032" ),
            BigInt( "1316147724308250" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1617420574301156" ),
            BigInt( "1741273341070467" ),
            BigInt( "667135503486508" ),
            BigInt( "2100436564640123" ),
            BigInt( "1032223920000865" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1753947659404033" ),
            BigInt( "247279202390193" ),
            BigInt( "1819288880178945" ),
            BigInt( "737334285670249" ),
            BigInt( "1037873664856104" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1762568490530034" ),
            BigInt( "673742465299012" ),
            BigInt( "2054571050635888" ),
            BigInt( "2040165159255111" ),
            BigInt( "3040123733327257" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1627187989987422" ),
            BigInt( "1686331580821752" ),
            BigInt( "1309895873498183" ),
            BigInt( "719718719104086" ),
            BigInt( "300063199808722" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "238176707016164" ),
            BigInt( "1440454788877048" ),
            BigInt( "203336037573144" ),
            BigInt( "1437789888677072" ),
            BigInt( "101522256664211" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1895216760098480" ),
            BigInt( "1934324337975022" ),
            BigInt( "3677350688973167" ),
            BigInt( "2536415965456176" ),
            BigInt( "714678003308640" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "508185358728815" ),
            BigInt( "1691320535341855" ),
            BigInt( "2168887448239256" ),
            BigInt( "1035124393070661" ),
            BigInt( "1936603999698584" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "390562831571647" ),
            BigInt( "1390223890708972" ),
            BigInt( "1383183990676371" ),
            BigInt( "435998174196410" ),
            BigInt( "1882086414390730" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3747620842612921" ),
            BigInt( "2081794785291195" ),
            BigInt( "3284594056262745" ),
            BigInt( "2090090346797895" ),
            BigInt( "2581692978935809" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "244144781251265" ),
            BigInt( "1290834426417077" ),
            BigInt( "1888701171101942" ),
            BigInt( "1233922456644870" ),
            BigInt( "241117402207491" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1266169390045455" ),
            BigInt( "1148042013187970" ),
            BigInt( "878921907853942" ),
            BigInt( "1815738019658093" ),
            BigInt( "908920199341621" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2521768507305118" ),
            BigInt( "953557056811112" ),
            BigInt( "2015863732865770" ),
            BigInt( "1358382511861315" ),
            BigInt( "2835421647899992" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "2239837206240498" ),
            BigInt( "330928973149665" ),
            BigInt( "422268062913642" ),
            BigInt( "1481280019493032" ),
            BigInt( "619879520439841" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1360166735366017" ),
            BigInt( "1770556573948510" ),
            BigInt( "1395061284191031" ),
            BigInt( "1814003148068126" ),
            BigInt( "522781147076884" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2611794802645686" ),
            BigInt( "707234844948070" ),
            BigInt( "1314059396506491" ),
            BigInt( "2919250341703934" ),
            BigInt( "2161831667832785" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "934831784182383" ),
            BigInt( "433734253968318" ),
            BigInt( "1660867106725771" ),
            BigInt( "1968393082772831" ),
            BigInt( "873946300968490" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "26306827827554" ),
            BigInt( "430884999378685" ),
            BigInt( "1504310424376419" ),
            BigInt( "1761358720837522" ),
            BigInt( "542195685418530" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1762131062631725" ),
            BigInt( "3123952634417535" ),
            BigInt( "3619918390837537" ),
            BigInt( "2909990877347294" ),
            BigInt( "1411594230004385" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "538272372224622" ),
            BigInt( "1425714779586199" ),
            BigInt( "588313661410172" ),
            BigInt( "1497062084392578" ),
            BigInt( "1602174047128512" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "907490361939255" ),
            BigInt( "1963620338391363" ),
            BigInt( "626927432296975" ),
            BigInt( "1250748516081414" ),
            BigInt( "959901171882527" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1335066153744413" ),
            BigInt( "2887804660779657" ),
            BigInt( "2653073855954038" ),
            BigInt( "2765226981667422" ),
            BigInt( "938831784476763" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "296699434737224" ),
            BigInt( "2047543711075683" ),
            BigInt( "2076451038937139" ),
            BigInt( "227783599906901" ),
            BigInt( "1602062110967627" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1574834773194203" ),
            BigInt( "1384279952062839" ),
            BigInt( "393652417255803" ),
            BigInt( "2166968242848859" ),
            BigInt( "1552890441390820" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1619646774410947" ),
            BigInt( "1576090644023562" ),
            BigInt( "3035228391320965" ),
            BigInt( "1735328519940543" ),
            BigInt( "2355324535937066" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1024074573633446" ),
            BigInt( "957088456885874" ),
            BigInt( "1690425531356997" ),
            BigInt( "2102187380180052" ),
            BigInt( "1082544623222033" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1871906170635853" ),
            BigInt( "1719383891167200" ),
            BigInt( "1584032250247862" ),
            BigInt( "823764804192117" ),
            BigInt( "2244048510084261" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "642147846489775" ),
            BigInt( "3334304977145699" ),
            BigInt( "305205716788147" ),
            BigInt( "2589176626729533" ),
            BigInt( "2224680511484174" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1734162377166545" ),
            BigInt( "260713621840346" ),
            BigInt( "157174591942595" ),
            BigInt( "952544272517991" ),
            BigInt( "222818702471733" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1213115494182947" ),
            BigInt( "286778704335711" ),
            BigInt( "2130189536016490" ),
            BigInt( "308349182281342" ),
            BigInt( "1217623948685491" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3360052266973635" ),
            BigInt( "1843486583624091" ),
            BigInt( "1561693837124349" ),
            BigInt( "1084041964025479" ),
            BigInt( "1866270922024009" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "460705465481210" ),
            BigInt( "1968151453817859" ),
            BigInt( "497005926994844" ),
            BigInt( "625618055866751" ),
            BigInt( "2176893440866887" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1655800250476757" ),
            BigInt( "2036588542300609" ),
            BigInt( "666447448675243" ),
            BigInt( "1615721995750683" ),
            BigInt( "1508669225186765" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2245948203759141" ),
            BigInt( "1058306669699396" ),
            BigInt( "1452898014240582" ),
            BigInt( "3961024141962768" ),
            BigInt( "1633235287338608" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "986647273684279" ),
            BigInt( "1507266907811370" ),
            BigInt( "1260572633649005" ),
            BigInt( "2071672342077446" ),
            BigInt( "695976026010857" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1312356620823495" ),
            BigInt( "1635278548098567" ),
            BigInt( "901946076841033" ),
            BigInt( "585120475533168" ),
            BigInt( "1240667113237384" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2313723935779695" ),
            BigInt( "1506054666773895" ),
            BigInt( "996040223525031" ),
            BigInt( "636592914999692" ),
            BigInt( "1497801917020297" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "292042016419794" ),
            BigInt( "1158932298133044" ),
            BigInt( "2062611870323738" ),
            BigInt( "1946058478962569" ),
            BigInt( "1749165808126286" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "654683942212830" ),
            BigInt( "1526897351349087" ),
            BigInt( "2006818439922838" ),
            BigInt( "2194919327350361" ),
            BigInt( "1451960776874416" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3015041017808905" ),
            BigInt( "2951823141773809" ),
            BigInt( "2584865668253675" ),
            BigInt( "2508192032998563" ),
            BigInt( "2582137700042019" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1628123495344283" ),
            BigInt( "2072923641214546" ),
            BigInt( "1647225812023982" ),
            BigInt( "855655925244679" ),
            BigInt( "1758126430071140" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1615895096489599" ),
            BigInt( "275295258643784" ),
            BigInt( "937665541219916" ),
            BigInt( "1313496726746346" ),
            BigInt( "1186468946422626" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1603070202850694" ),
            BigInt( "2072127623773242" ),
            BigInt( "1692648737212158" ),
            BigInt( "2493373404187852" ),
            BigInt( "1248948672117105" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "11167836031898" ),
            BigInt( "596565174397990" ),
            BigInt( "2196351068723859" ),
            BigInt( "314744641791907" ),
            BigInt( "1102014997250781" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1409047922401191" ),
            BigInt( "69960384467966" ),
            BigInt( "688103515547600" ),
            BigInt( "1309746102488044" ),
            BigInt( "150292892873778" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1986083055103168" ),
            BigInt( "691715819340300" ),
            BigInt( "1361811659746933" ),
            BigInt( "3459052030333434" ),
            BigInt( "1063594696046061" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1201987338414749" ),
            BigInt( "2198784582460616" ),
            BigInt( "1203335513981498" ),
            BigInt( "489243077045066" ),
            BigInt( "2205278143582433" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "2034744376624534" ),
            BigInt( "2077387101466387" ),
            BigInt( "148448542974969" ),
            BigInt( "1502697574577258" ),
            BigInt( "473186584705655" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "472016956315960" ),
            BigInt( "720786972252993" ),
            BigInt( "2840633661190043" ),
            BigInt( "3150798753357827" ),
            BigInt( "2816563335499153" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "253464247569755" ),
            BigInt( "168314237403057" ),
            BigInt( "511780806170295" ),
            BigInt( "1058862316549135" ),
            BigInt( "1646858476817137" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "595092995922219" ),
            BigInt( "1491311840717691" ),
            BigInt( "291581784452778" ),
            BigInt( "1569186646367854" ),
            BigInt( "1031385061400544" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3483137021572755" ),
            BigInt( "1526955102024322" ),
            BigInt( "2778006642704458" ),
            BigInt( "457549634924205" ),
            BigInt( "1097420237736736" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1246991699537710" ),
            BigInt( "81367319519439" ),
            BigInt( "530844036072196" ),
            BigInt( "163656863755855" ),
            BigInt( "1950742455979290" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "191532664076407" ),
            BigInt( "539378506082089" ),
            BigInt( "1021612562876554" ),
            BigInt( "1026603384732632" ),
            BigInt( "1773368780410653" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "4144620731387879" ),
            BigInt( "590179521333342" ),
            BigInt( "4034023318016108" ),
            BigInt( "2255745030335426" ),
            BigInt( "2699746851701250" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "2206599697359952" ),
            BigInt( "553895797384417" ),
            BigInt( "181689161933786" ),
            BigInt( "1153123447919104" ),
            BigInt( "778568064152659" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1706307000059211" ),
            BigInt( "1885601289314487" ),
            BigInt( "889758608505788" ),
            BigInt( "550131729999853" ),
            BigInt( "1006862664714268" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3210197754285058" ),
            BigInt( "2048500453422630" ),
            BigInt( "3403309827888207" ),
            BigInt( "927154428508963" ),
            BigInt( "4199813798872019" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "992058915374933" ),
            BigInt( "476120535358775" ),
            BigInt( "1973648780784340" ),
            BigInt( "2025282643598818" ),
            BigInt( "2182318983793230" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1343440812005821" ),
            BigInt( "1316045839091795" ),
            BigInt( "1884951299078063" ),
            BigInt( "1765919609219175" ),
            BigInt( "2197567554627988" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3129247779382818" ),
            BigInt( "4415026969054274" ),
            BigInt( "1900265885969643" ),
            BigInt( "1528796215447059" ),
            BigInt( "2172730393748688" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1773355092297603" ),
            BigInt( "64654329538271" ),
            BigInt( "1332124041660957" ),
            BigInt( "748492100858001" ),
            BigInt( "895500006200535" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "2000840647851980" ),
            BigInt( "546565968824914" ),
            BigInt( "420633283457524" ),
            BigInt( "195470736374507" ),
            BigInt( "1958689297569520" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "743138980705446" ),
            BigInt( "3411117504637167" ),
            BigInt( "2591389959690621" ),
            BigInt( "2380042066577202" ),
            BigInt( "3022267940115114" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "165947002229363" ),
            BigInt( "115186103724967" ),
            BigInt( "1068573292121517" ),
            BigInt( "1842565776920938" ),
            BigInt( "1969395681111987" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "553322266190633" ),
            BigInt( "234265665613185" ),
            BigInt( "484544650202821" ),
            BigInt( "1238773526575826" ),
            BigInt( "2017991917953668" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2581954631514051" ),
            BigInt( "1245093644265357" ),
            BigInt( "3537016673825374" ),
            BigInt( "1834216551713857" ),
            BigInt( "923978372152807" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1855378315339552" ),
            BigInt( "890045579230758" ),
            BigInt( "1764718173975590" ),
            BigInt( "197904186055854" ),
            BigInt( "1718129022310327" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1278162928734862" ),
            BigInt( "1894118254109862" ),
            BigInt( "987503995465517" ),
            BigInt( "177406744098996" ),
            BigInt( "781538103127693" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1996603431230215" ),
            BigInt( "1191888797552937" ),
            BigInt( "1207440075928499" ),
            BigInt( "2765853449051137" ),
            BigInt( "2525314961343288" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "808903879370889" ),
            BigInt( "990820108751280" ),
            BigInt( "1084429472258867" ),
            BigInt( "1078562781312589" ),
            BigInt( "254514692695625" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "615855140068469" ),
            BigInt( "586046731175395" ),
            BigInt( "693470779212674" ),
            BigInt( "1964537100203868" ),
            BigInt( "1350330550265229" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3344544372023708" ),
            BigInt( "720386671449874" ),
            BigInt( "2480841360702110" ),
            BigInt( "2036034126860286" ),
            BigInt( "2015744690201389" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1337446193390478" ),
            BigInt( "1984110761311871" ),
            BigInt( "746489405020285" ),
            BigInt( "407347127604128" ),
            BigInt( "1740475330360596" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "140840424783613" ),
            BigInt( "1063284623568331" ),
            BigInt( "1136446106453878" ),
            BigInt( "372042229029799" ),
            BigInt( "442607248430694" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2330781679120937" ),
            BigInt( "376801425148230" ),
            BigInt( "2032603686676107" ),
            BigInt( "1488926293635130" ),
            BigInt( "1317278311532959" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1290116731380016" ),
            BigInt( "2166899563471713" ),
            BigInt( "831997001838078" ),
            BigInt( "870954980505220" ),
            BigInt( "2108537278055823" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1912719171026343" ),
            BigInt( "846194720551034" ),
            BigInt( "2043988124740726" ),
            BigInt( "993234269653961" ),
            BigInt( "421229796383281" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2651184584992902" ),
            BigInt( "2775702557638963" ),
            BigInt( "2539786009779572" ),
            BigInt( "2575974880015305" ),
            BigInt( "2122619079836732" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1154054290132562" ),
            BigInt( "931753998725577" ),
            BigInt( "1647742001778052" ),
            BigInt( "865765466488226" ),
            BigInt( "1083816107290025" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "986341121095108" ),
            BigInt( "1522330369638573" ),
            BigInt( "1990880546211047" ),
            BigInt( "501525962272123" ),
            BigInt( "198539304862139" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1496414019192687" ),
            BigInt( "3991034436173951" ),
            BigInt( "3380311659062196" ),
            BigInt( "2854747485359158" ),
            BigInt( "3346958036643152" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "805612068303425" ),
            BigInt( "1891790027761335" ),
            BigInt( "1587008567571549" ),
            BigInt( "722120737390201" ),
            BigInt( "378156757163816" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1588994517921951" ),
            BigInt( "977362751042302" ),
            BigInt( "1329302387067714" ),
            BigInt( "2069348224564088" ),
            BigInt( "1586007159625211" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2490539421551682" ),
            BigInt( "1985699850375015" ),
            BigInt( "2331762317128172" ),
            BigInt( "4145097393776678" ),
            BigInt( "2521049460190674" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "615817553313996" ),
            BigInt( "2245962768078178" ),
            BigInt( "482564324326173" ),
            BigInt( "2101336843140780" ),
            BigInt( "1240914880829407" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1438242482238189" ),
            BigInt( "874267817785463" ),
            BigInt( "1620810389770625" ),
            BigInt( "866155221338671" ),
            BigInt( "1040426546798301" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "2403083624110300" ),
            BigInt( "2548561409802975" ),
            BigInt( "2492699136535911" ),
            BigInt( "2358289519456539" ),
            BigInt( "3203964320363148" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1913986535403097" ),
            BigInt( "1977163223054199" ),
            BigInt( "1972905914623196" ),
            BigInt( "1650122133472502" ),
            BigInt( "1905849310819035" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "858174816360838" ),
            BigInt( "614595356564037" ),
            BigInt( "1099584959044836" ),
            BigInt( "636998087084906" ),
            BigInt( "1070393269058348" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3666695924830668" ),
            BigInt( "3585640662737501" ),
            BigInt( "2372994528684236" ),
            BigInt( "2628565977288995" ),
            BigInt( "3482812783469694" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1994161359147952" ),
            BigInt( "2198039369802658" ),
            BigInt( "62790022842537" ),
            BigInt( "1522306785848169" ),
            BigInt( "951223194802833" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "852296621440717" ),
            BigInt( "431889737774209" ),
            BigInt( "370755457746189" ),
            BigInt( "437604073958073" ),
            BigInt( "627857326892757" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1794955764684156" ),
            BigInt( "2586904290013612" ),
            BigInt( "1322647643615887" ),
            BigInt( "856117964085888" ),
            BigInt( "2652432778663153" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "933592377399646" ),
            BigInt( "78031722952813" ),
            BigInt( "926049890685253" ),
            BigInt( "1471649501316246" ),
            BigInt( "33789909190376" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1479319468832059" ),
            BigInt( "203906207621608" ),
            BigInt( "659828362330083" ),
            BigInt( "44358398435755" ),
            BigInt( "1273573524210803" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1592342143350813" ),
            BigInt( "3227219208247713" ),
            BigInt( "2345240352078765" ),
            BigInt( "2577750109932929" ),
            BigInt( "2933512841197243" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "2184946892642995" ),
            BigInt( "1517382324576002" ),
            BigInt( "1557940277419806" ),
            BigInt( "2170635134813213" ),
            BigInt( "747314658627002" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1823193620577742" ),
            BigInt( "1135817878516419" ),
            BigInt( "1731253819308581" ),
            BigInt( "1031652967267804" ),
            BigInt( "2123506616999453" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1346190246005805" ),
            BigInt( "2052692552023851" ),
            BigInt( "1718128041785940" ),
            BigInt( "2491557332978474" ),
            BigInt( "3474370880388305" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "424776012994573" ),
            BigInt( "281050757243423" ),
            BigInt( "626466040846420" ),
            BigInt( "990194703866532" ),
            BigInt( "38571969885982" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "192408346595466" ),
            BigInt( "1054889725292349" ),
            BigInt( "584097975693004" ),
            BigInt( "1447909807397749" ),
            BigInt( "2134645004369136" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3169895788615063" ),
            BigInt( "3503097743181446" ),
            BigInt( "601598510029975" ),
            BigInt( "1422812237223371" ),
            BigInt( "2121009661378329" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1603348391996783" ),
            BigInt( "2066143816131699" ),
            BigInt( "1789627290363958" ),
            BigInt( "2145705961178118" ),
            BigInt( "1985578641438222" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "352633958653380" ),
            BigInt( "856927627345554" ),
            BigInt( "793925083122702" ),
            BigInt( "93551575767286" ),
            BigInt( "1222010153634215" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1756866499986349" ),
            BigInt( "911731956999969" ),
            BigInt( "2707505543214075" ),
            BigInt( "4006920335263786" ),
            BigInt( "822501008147910" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1094036422864347" ),
            BigInt( "1897208881572508" ),
            BigInt( "1503607738246960" ),
            BigInt( "1901060196071406" ),
            BigInt( "294068411105729" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "587776484399576" ),
            BigInt( "1116861711228807" ),
            BigInt( "343398777436088" ),
            BigInt( "936544065763093" ),
            BigInt( "1643746750211060" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "3477749685790410" ),
            BigInt( "267997399528836" ),
            BigInt( "2953780922004404" ),
            BigInt( "3252368924080907" ),
            BigInt( "3787792887348381" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "2042368155872443" ),
            BigInt( "41662387210459" ),
            BigInt( "1676313264498480" ),
            BigInt( "1333968523426810" ),
            BigInt( "1765708383352310" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1453394896690938" ),
            BigInt( "1585795827439909" ),
            BigInt( "1469309456804303" ),
            BigInt( "1294645324464404" ),
            BigInt( "2042954198665899" ),
        ])),
    ),
    new AffineNielsPoint(
        new FieldElem51(new BigUint64Array([
            BigInt( "1810069207599881" ),
            BigInt( "1358344669503239" ),
            BigInt( "1989371257548167" ),
            BigInt( "2316270051121225" ),
            BigInt( "3019675451276507" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1866114438287676" ),
            BigInt( "1663420339568364" ),
            BigInt( "1437691317033088" ),
            BigInt( "538298302628038" ),
            BigInt( "1212711449614363" ),
        ])),
        new FieldElem51(new BigUint64Array([
            BigInt( "1769235035677897" ),
            BigInt( "1562012115317882" ),
            BigInt( "31277513664750" ),
            BigInt( "536198657928416" ),
            BigInt( "1976134212537183" ),
        ])),
    ),
]);