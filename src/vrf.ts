import { EdwardsPoint } from "./rust_vrf_reimpl/curves";
import { IVrfProof03, proof_to_hash, vrf_ed25519_sha512_ell2_generate_proof, vrf_ed25519_sha512_ell2_verify_proof } from "./rust_vrf_reimpl/vrf03";
import { IVrfProof10, vrf10_ed25519_sha512_ell2_generate_proof, vrf10_ed25519_sha512_ell2_verify_proof, vrf10_proof_to_hash } from "./rust_vrf_reimpl/vrf10";

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