# MarkZero: an Agent Data Notation
_"Markup is for Screens. Markdown is for Docs. MarkZero is for Intelligence."_

## Overview
**MarkZero** is the third evolution of documentation and data representation, following **Markup** (UI) and **Markdown** (DX). While its predecessors focused on visual hierarchy and human readability, MarkZero is designed for **Agentic Attention**—where data exists in a multi-dimensional latent space rather than a linear page.

## Documentation
- [MarkZero Specification (v1)](skills/markzero/references/markzero-spec-v1.md)
- [Spesifikasi MarkZero (v1) - Bahasa Indonesia](skills/markzero/references/markzero-spec-v1.id.md)

## Installation

### As an Agent Skill
```sh
skills add pakakas/markzero
```

### As an NPM Library
```sh
npm install @pakakas/markzero
# or using bun
bun add @pakakas/markzero
```

## API Usage

```ts
import { encode, decode, ENC_VALUES, ENC_INTERN_ALL } from "@pakakas/markzero";

// 1. Encoding data
const payload = { os: "win32", arch: "x64" };
const encoded = encode(payload); 
// Output: ⓩⓖos→win32ʀarch→x64

// 2. Decoding payload
const decoded = decode(encoded);
// Output: [{ os: "win32", arch: "x64" }]

// 3. Smart Token Interning Modes
const poolValuesOnly = encode(payload, ENC_VALUES);
const poolEverything = encode(payload, ENC_INTERN_ALL);
```

### Available APIs:
- `encode(input: any, encodingMode?: number): string` - Encodes any JavaScript object/array to a MarkZero string.
- `decode(payload: string): any` - Decodes a MarkZero string back into its original structures.
- `ENC_VALUES` - Encoding mode where only data values are interned if mathematically profitable.
- `ENC_INTERN_ALL` - Encoding mode where both keys and values are interned if mathematically profitable.



