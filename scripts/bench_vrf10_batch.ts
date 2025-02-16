import { derive_vrf10_public_key, VrfBatchProof10, VrfBatchVerifier } from "../src";
import { getRandomValues } from "../src/utils/getRandomValues";


void async function main() {
    const alpha = new Uint8Array(32);
    const sk = new Uint8Array(32);

    const sizes = Object.freeze([2, 4, 8, 16, 32, 64, 128, 256 , 512, 1024]);
    // const sizes = Object.freeze([2, 4, 8, 16, 32, 37, 38]);
    // const sizes = Object.freeze([37, 38]);

    const results = new Array<boolean>(sizes.length).fill(false);
    const times = new Array<number>(sizes.length);

    let start = 0;
    let end = 0;
    for( let size_idx = 0; size_idx < sizes.length; size_idx++ )
    {
        const size = sizes[size_idx];
        console.log(`size: ${size}`);
        const pks = new Array<Uint8Array>(size);
        const alphas = new Array<Uint8Array>(size);
        const proofs = new Array<VrfBatchProof10>(size);
        for( let j = 0; j < size; j++ )
        {
            getRandomValues(sk);
            pks[j] = derive_vrf10_public_key(sk);
            getRandomValues(alpha);
            alphas[j] = alpha.slice();
            proofs[j] = VrfBatchProof10.generate(sk, pks[j], alphas[j]);
        }

        const verifier = new VrfBatchVerifier(size);
        let result = false;
        start = performance.now();
        for( let i = 0; i < size; i++ )
        {
            verifier.insert({
                public_key: pks[i],
                alpha: alphas[i],
                proof: proofs[i],
            });
        }
        result = verifier.verify();
        end = performance.now();
        times[size_idx] = end - start;
        results[size_idx] = result;
    }

    for( let i = 0; i < sizes.length; i++ )
    {
        console.log(
            `size: ${sizes[i].toString().padStart(4, " ")}; `+
            `time: ${times[i].toFixed(3).padStart(10, " ")}ms; `+
            `time/proof: ${(times[i] / sizes[i]).toFixed(3).padStart(8, " ")}ms ` +
            `result: ${results[i]}`
        );
    }
}()