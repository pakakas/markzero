# ADN: Agent Data Notation
_"Agents, machines, humans — we get each other."_

## Overview
**ADN (Agent Data Notation)** is an AI-native Intermediate Representation (Agent IR) designed for token efficiency, multi-dimensional latent structures, and structural integrity.

## Installation

```sh
npm install @pakakas/markzero
# or using bun
bun add @pakakas/markzero
```

## API Usage

### Primary Usage (@pakakas/markzero/adn)

```ts
import { encode, decode } from "@pakakas/markzero/adn";

const payload = { os: "win32", arch: "x64" };
const encoded = encode(payload); 

const decoded = decode(encoded);
```

### Main Entrypoint (@pakakas/markzero)

```ts
import { encode, decode, ENC_VALUES, ENC_INTERN_ALL } from "@pakakas/markzero";

// 1. Encoding data to pure ADN format
const payload = { os: "win32", arch: "x64" };
const encoded = encode(payload); 

// 2. Decoding payload
const decoded = decode(encoded);

// 3. Smart Token Interning Modes
const poolValuesOnly = encode(payload, ENC_VALUES);
const poolEverything = encode(payload, ENC_INTERN_ALL);
```

### Available APIs:
- `encode(input: any, encodingMode?: number): string` - Encodes any JavaScript object/array to a pure ADN string.
- `decode(payload: string): any` - Decodes a pure ADN string back into its original structures.
- `ENC_VALUES` - Encoding mode where only data values are interned if mathematically profitable.
- `ENC_INTERN_ALL` - Encoding mode where both keys and values are interned if mathematically profitable.

## References

- [MarkZero Specification](skills/markzero/references/markzero-spec.en.md)
- [ADN Specification](skills/markzero/references/adn-spec-v1.en.md)
