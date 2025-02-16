# @harmoniclabs/crypto

collection of cryptographic functions that support every js runtime for ES5+

## Disclaimer

The purpose of the library is to guarantee support for any javascript runtime with ES5+.

**THIS IMPLEMENTATION SHOULD NOT BE ASSUMED TO BE SAFE**

If you are in a node js environment you should use the [node crypto native module](https://nodejs.org/api/crypto.html); without doubt more preformant and secure.

## vrf batch verification benchmarks

> NOTE: for batches with 38 elements or more the pippenger multiscalar multiplication should be used
> 
> however it seems that there is something wrong wiht the implementation;
> since pippenger returns false where instead straus returns true (as it should be);
>
> for now then all batches sizes do use the straus algorithm, which is not optimal
>
> as you can see from the benchmarks, after size 32, the time/proof flattens
> (or get even worse in the case of bun) 

```
node --version
v22.13.1
```

```
size:    2; time:     36.216ms; time/proof:   18.108ms result: true
size:    4; time:     59.885ms; time/proof:   14.971ms result: true
size:    8; time:    105.061ms; time/proof:   13.133ms result: true
size:   16; time:    217.173ms; time/proof:   13.573ms result: true
size:   32; time:    397.940ms; time/proof:   12.436ms result: true
size:   64; time:    753.830ms; time/proof:   11.779ms result: true
size:  128; time:   1514.647ms; time/proof:   11.833ms result: true
size:  256; time:   3118.631ms; time/proof:   12.182ms result: true
size:  512; time:   6004.233ms; time/proof:   11.727ms result: true
size: 1024; time:  11948.110ms; time/proof:   11.668ms result: true
```

> NOTE: bun performs better in basically all cryptography functions except for this specific batch vrf.

```
bun --version
1.1.13
```

```
size:    2; time:     68.439ms; time/proof:   34.219ms result: true
size:    4; time:    130.650ms; time/proof:   32.662ms result: true
size:    8; time:    254.191ms; time/proof:   31.774ms result: true
size:   16; time:    505.512ms; time/proof:   31.594ms result: true
size:   32; time:   1001.648ms; time/proof:   31.301ms result: true
size:   64; time:   1975.420ms; time/proof:   30.866ms result: true
size:  128; time:   4077.155ms; time/proof:   31.853ms result: true
size:  256; time:   9204.953ms; time/proof:   35.957ms result: true
size:  512; time:  18359.952ms; time/proof:   35.859ms result: true
size: 1024; time:  35875.629ms; time/proof:   35.035ms result: true
```