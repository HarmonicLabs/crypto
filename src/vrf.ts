import { toHex } from "@harmoniclabs/uint8array-utils";
import { add_scalars, EdwardsPoint, mul_scalars, negate_scalar } from "./rust_vrf_reimpl/curves";
import { IVrfProof03, proof_to_hash, vrf_ed25519_sha512_ell2_generate_proof, vrf_ed25519_sha512_ell2_verify_proof } from "./rust_vrf_reimpl/vrf03";
import { extend_secret_key, IVrfProof10, vrf10_ed25519_sha512_ell2_compute_challenge, vrf10_ed25519_sha512_ell2_generate_proof, vrf10_ed25519_sha512_ell2_hash_to_curve, vrf10_ed25519_sha512_ell2_verify_proof, vrf10_proof_to_hash } from "./rust_vrf_reimpl/vrf10";
import { IVrfBatchProof10, vrf10_batch_ed25519_sha512_ell2_generate_proof, vrf10_batch_ed25519_sha512_ell2_proof_to_hash, vrf10_batch_ed25519_sha512_ell2_verify_proof } from "./rust_vrf_reimpl/vrf10_batch";
import { getRandomValues } from "./utils/getRandomValues";

export class VrfProof03
    implements IVrfProof03
{
    readonly gamma: EdwardsPoint;
    readonly challenge: Uint8Array;
    readonly response: Uint8Array;
    
    constructor({
        gamma,
        challenge,
        response
    }: IVrfProof03)
    {
        this.gamma = gamma;
        this.challenge = challenge;
        this.response = response;
    }

    toHash(): Uint8Array & { length: 64 }
    {
        return proof_to_hash( this );
    }

    static generate(
        secret_key: Uint8Array,
        public_key: Uint8Array,
        alpha_string: Uint8Array
    ): VrfProof03
    {
        return new VrfProof03(
            vrf_ed25519_sha512_ell2_generate_proof(
                secret_key,
                public_key,
                alpha_string
            )
        );
    }

    static verify(
        public_key: Uint8Array,
        alpha_string: Uint8Array,
        proof: IVrfProof03
    ): boolean
    {
        return vrf_ed25519_sha512_ell2_verify_proof(
            public_key,
            alpha_string,
            proof
        );
    }

    verify( public_key: Uint8Array, alpha_string: Uint8Array ): boolean
    {
        return vrf_ed25519_sha512_ell2_verify_proof(
            public_key,
            alpha_string,
            this
        );
    }

    /*
    pub fn to_bytes(&self) -> [u8; PROOF_SIZE] {
        let mut proof = [0u8; PROOF_SIZE];
        proof[..32].copy_from_slice(self.gamma.compress().as_bytes());
        proof[32..48].copy_from_slice(&self.challenge.to_bytes()[..16]);
        proof[48..].copy_from_slice(self.response.as_bytes());

        proof
    }
    */
    toBytes(): Uint8Array & { length: 80 }
    {
        const output = new Uint8Array( 80 ) as (Uint8Array & { length: 80 });
        output.set( this.gamma.compress(), 0 );
        output.set( this.challenge.slice(0,16), 32 );
        output.set( this.response, 48 );
        return output;
    }

    static fromBytes( bytes: Uint8Array ): VrfProof03
    {
        const gamma = EdwardsPoint.decompress( Uint8Array.prototype.slice.call( bytes, 0, 32 ) );
        if( !gamma ) throw new Error("Invalid gamma point");

        const challenge = new Uint8Array( 32 );
        challenge.set( Uint8Array.prototype.slice.call( bytes, 32, 48 ), 0 );

        const response = Uint8Array.prototype.slice.call( bytes, 48, 80 )

        return new VrfProof03({
            gamma,
            challenge,
            response
        });
    }
}

export function derive_vrf10_public_key( secret_key: Uint8Array ): Uint8Array
{
    return EdwardsPoint.BASEPOINT_ED25519.scalarMul( extend_secret_key( secret_key )[0] ).compress();
}

export class VrfProof10
    implements IVrfProof10
{
    readonly gamma: EdwardsPoint;
    readonly challenge: Uint8Array;
    readonly response: Uint8Array;
    
    constructor({
        gamma,
        challenge,
        response
    }: IVrfProof10)
    {
        this.gamma = gamma;
        this.challenge = challenge;
        this.response = response;
    }

    toHash(): Uint8Array & { length: 64 }
    {
        return vrf10_proof_to_hash( this );
    }

    static generate(
        secret_key: Uint8Array,
        public_key: Uint8Array,
        alpha_string: Uint8Array
    ): VrfProof10
    {
        return new VrfProof10(
            vrf10_ed25519_sha512_ell2_generate_proof(
                secret_key,
                public_key,
                alpha_string
            )
        );
    }

    static verify(
        public_key: Uint8Array,
        alpha_string: Uint8Array,
        proof: IVrfProof10
    ): boolean
    {
        return vrf10_ed25519_sha512_ell2_verify_proof(
            public_key,
            alpha_string,
            proof
        );
    }

    verify( public_key: Uint8Array, alpha_string: Uint8Array ): boolean
    {
        return vrf10_ed25519_sha512_ell2_verify_proof(
            public_key,
            alpha_string,
            this
        );
    }

    /*
    pub fn to_bytes(&self) -> [u8; PROOF_SIZE] {
        let mut proof = [0u8; PROOF_SIZE];
        proof[..32].copy_from_slice(self.gamma.compress().as_bytes());
        proof[32..48].copy_from_slice(&self.challenge.to_bytes()[..16]);
        proof[48..].copy_from_slice(self.response.as_bytes());

        proof
    }
    */
    toBytes(): Uint8Array & { length: 80 }
    {
        const output = new Uint8Array( 80 ) as (Uint8Array & { length: 80 });
        output.set( this.gamma.compress(), 0 );
        output.set( this.challenge.slice(0,16), 32 );
        output.set( this.response, 48 );
        return output;
    }

    static fromBytes( bytes: Uint8Array ): VrfProof10
    {
        const gamma = EdwardsPoint.decompress( Uint8Array.prototype.slice.call( bytes, 0, 32 ) );
        if( !gamma ) throw new Error("Invalid gamma point");

        const challenge = new Uint8Array( 32 );
        challenge.set( Uint8Array.prototype.slice.call( bytes, 32, 48 ), 0 );

        const response = Uint8Array.prototype.slice.call( bytes, 48, 80 )

        return new VrfProof10({
            gamma,
            challenge,
            response
        });
    }
}

export class VrfBatchProof10
    implements IVrfBatchProof10
{
    readonly gamma: EdwardsPoint;
    readonly u_point: EdwardsPoint;
    readonly v_point: EdwardsPoint;
    readonly response: Uint8Array;
    
    constructor({
        gamma,
        u_point,
        v_point,
        response
    }: IVrfBatchProof10)
    {
        this.gamma = gamma;
        this.u_point = u_point;
        this.v_point = v_point;
        this.response = response;
    }

    toHash(): Uint8Array & { length: 64 }
    {
        return vrf10_batch_ed25519_sha512_ell2_proof_to_hash( this );
    }

    static generate(
        secret_key: Uint8Array,
        public_key: Uint8Array,
        alpha_string: Uint8Array
    ): VrfBatchProof10
    {
        return new VrfBatchProof10(
            vrf10_batch_ed25519_sha512_ell2_generate_proof(
                secret_key,
                public_key,
                alpha_string
            )
        );
    }

    static verify(
        public_key: Uint8Array,
        alpha_string: Uint8Array,
        proof: IVrfBatchProof10
    ): boolean
    {
        return vrf10_batch_ed25519_sha512_ell2_verify_proof(
            public_key,
            alpha_string,
            proof
        );
    }

    verify( public_key: Uint8Array, alpha_string: Uint8Array ): boolean
    {
        return vrf10_batch_ed25519_sha512_ell2_verify_proof(
            public_key,
            alpha_string,
            this
        );
    }

    /*
    pub fn to_bytes(&self) -> [u8; PROOF_SIZE] {
        let mut proof = [0u8; PROOF_SIZE];
        proof[..32].copy_from_slice(self.gamma.compress().as_bytes());
        proof[32..48].copy_from_slice(&self.challenge.to_bytes()[..16]);
        proof[48..].copy_from_slice(self.response.as_bytes());

        proof
    }
    */
    toBytes(): Uint8Array & { length: 128 }
    {
        const output = new Uint8Array( 128 ) as (Uint8Array & { length: 128 });
        output.set( this.gamma.compress(), 0 );
        output.set( this.u_point.compress(), 32 );
        output.set( this.v_point.compress(), 64 );
        output.set( this.response, 96 );
        return output;
    }

    static fromBytes( bytes: Uint8Array ): VrfBatchProof10
    {
        const gamma = EdwardsPoint.decompress( Uint8Array.prototype.slice.call( bytes, 0, 32 ) );
        if( !gamma ) throw new Error("Invalid gamma point");

        const u_point = EdwardsPoint.decompress( Uint8Array.prototype.slice.call( bytes, 32, 64 ) );
        if( !u_point ) throw new Error("Invalid u_point point");

        const v_point = EdwardsPoint.decompress( Uint8Array.prototype.slice.call( bytes, 64, 96 ) );
        if( !v_point ) throw new Error("Invalid v_point point");

        const response = Uint8Array.prototype.slice.call( bytes, 96, 128 );

        return new VrfBatchProof10({
            gamma,
            u_point,
            v_point,
            response
        });
    }
}

function gen_u128_bytes(): Uint8Array
{
    const buff = new Uint8Array( 16 );
    getRandomValues( buff );
    return buff;
}
function gen_u128(): bigint
{
    return BigInt(
        "0x" +
        toHex( gen_u128_bytes() )
    );
}

export interface IBatchItem {
    proof: VrfBatchProof10;
    /** in rust called "key" */
    public_key: Uint8Array;
    /** in rust called "msg" */
    alpha: Uint8Array;
    /** length 64, proof to hash */
    // output: Uint8Array;
}

export class VrfBatchVerifier
{
    readonly proof_scalars: [Uint8Array, Uint8Array][];
    readonly pks: EdwardsPoint[];
    readonly us: EdwardsPoint[];
    readonly hs: EdwardsPoint[];
    readonly gammas: EdwardsPoint[];
    readonly vs: EdwardsPoint[];
    private _currLen: number = 0;

    constructor( readonly size: number )
    {
        this.proof_scalars  = new Array( size );
        this.pks            = new Array( size );
        this.us             = new Array( size );
        this.hs             = new Array( size );
        this.gammas         = new Array( size );
        this.vs             = new Array( size );
        this._currLen       = 0;
    }

    insert( item: IBatchItem ): void
    {
        if( this._currLen >= this.size ) throw new Error("BatchVerifier is full");

        const output = item.proof.toHash();

        const decompressed_pk = EdwardsPoint.decompress( item.public_key );
        if( !decompressed_pk || decompressed_pk.is_small_order() ) throw new Error("Invalid public key");

        const h = vrf10_ed25519_sha512_ell2_hash_to_curve(
            item.public_key,
            item.alpha
        );
        const compressed_h = h.compress();

        const gamma = item.proof.gamma;
        const compressed_gamma = gamma.compress();

        const u = item.proof.u_point;
        const compressed_u = u.compress();

        const v = item.proof.v_point;
        const compressed_v = v.compress();

        this.proof_scalars[this._currLen] = [
            vrf10_ed25519_sha512_ell2_compute_challenge(
                compressed_h,
                compressed_gamma,
                compressed_u,
                compressed_v
            ),
            item.proof.response
        ];

        this.pks[this._currLen]     = decompressed_pk;
        this.us[this._currLen]      = u;
        this.hs[this._currLen]      = h;
        this.gammas[this._currLen]  = gamma;
        this.vs[this._currLen]      = v;

        this._currLen++;
    }

    verify(): boolean
    {
        const size = this._currLen;

        let b_coeff = scalar_zero();
        /** array of scalars */
        const lchalls = new Array<Uint8Array>( size );
        /** array of scalars */
        const rchalls = new Array<Uint8Array>( size );
        /** array of scalars */
        const ls = new Array<Uint8Array>( size );
        /** array of scalars */
        const rs = new Array<Uint8Array>( size );
        /** array of scalars */
        const rresponses = new Array<Uint8Array>( size );

        for( let i = 0; i < size; i++ )
        {
            const [ challenge, response ] = this.proof_scalars[i];
            const li = new Uint8Array( 32 );
            li.set( gen_u128_bytes(), 0 );
            const ri = new Uint8Array( 32 );
            ri.set( gen_u128_bytes(), 0 );

            b_coeff = add_scalars( b_coeff, mul_scalars( li, response ) );
            lchalls[i] = mul_scalars( li, challenge );
            ls[i] = li;
            rresponses[i] = mul_scalars( ri, negate_scalar( response ) );
            rchalls[i] = mul_scalars( ri, challenge );
            rs[i] = ri;
        }

        const result = EdwardsPoint.vartime_multiscalar_mul(
            [ negate_scalar( b_coeff ) ]
            .concat( lchalls )
            .concat( ls )
            .concat( rresponses )
            .concat( rchalls )
            .concat( rs ),
            [ EdwardsPoint.BASEPOINT_ED25519 ]
            .concat( this.pks )
            .concat( this.us )
            .concat( this.hs )
            .concat( this.gammas )
            .concat( this.vs )
        );

        return result.is_identity();
    }
}

function scalar_zero(): Uint8Array
{
    return new Uint8Array( 32 );
}