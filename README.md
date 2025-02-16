# @harmoniclabs/crypto

collection of cryptographic functions that support every js runtime for ES5+

## Disclaimer

The purpose of the library is to guarantee support for any javascript runtime with ES5+.

**THIS IMPLEMENTATION SHOULD NOT BE ASSUMED TO BE SAFE**

If you are in a node js environment you should use the [node crypto native module](https://nodejs.org/api/crypto.html); without doubt more preformant and secure.

## vrf batch verification benchmarks

```
node --version
v22.13.1
```

```
size:    2; time:     47.698ms; time/proof:   23.849ms
size:    4; time:     59.977ms; time/proof:   14.994ms
size:    8; time:    106.320ms; time/proof:   13.290ms
size:   16; time:    202.464ms; time/proof:   12.654ms
size:   32; time:    381.865ms; time/proof:   11.933ms
size:   64; time:    435.186ms; time/proof:    6.800ms
size:  128; time:    766.041ms; time/proof:    5.985ms
size:  256; time:   1483.253ms; time/proof:    5.794ms
size:  512; time:   2743.719ms; time/proof:    5.359ms
size: 1024; time:   5338.563ms; time/proof:    5.213ms
```

> NOTE: bun performs better in basically all cryptography functions except for this specific batch vrf.

```
bun --version
1.1.13
```

```
size:    2; time:     83.612ms; time/proof:   41.806ms
size:    4; time:    142.970ms; time/proof:   35.742ms
size:    8; time:    289.918ms; time/proof:   36.240ms
size:   16; time:    514.814ms; time/proof:   32.176ms
size:   32; time:   1003.016ms; time/proof:   31.344ms
size:   64; time:   1479.513ms; time/proof:   23.117ms
size:  128; time:   2061.125ms; time/proof:   16.103ms
size:  256; time:   4005.528ms; time/proof:   15.647ms
size:  512; time:   7263.623ms; time/proof:   14.187ms
size: 1024; time:  14842.491ms; time/proof:   14.495ms
```