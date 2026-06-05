# ADN: Agent Data Notation (via MarkZero Protocol)
_"Markup is for Screens. Markdown is for Docs. MarkZero is for Intelligence."_

## Overview
**ADN (Agent Data Notation)** is the third evolution of documentation and data representation, following **Markup** (UI) and **Markdown** (DX). While its predecessors focused on visual hierarchy and human readability, ADN is an **Agent IR (Intermediate Representation)** designed purely for **Agentic Attention**—where data exists in a multi-dimensional latent space rather than a linear page.

Under the hood, all representation formats can be categorized into two major paradigms:
- **Human IR (Intermediate Representation)**: Formats optimized for human eyes and minds (like HTML/Markup and Markdown).
- **Agent IR (Intermediate Representation)**: Formats optimized for AI attention (like **ADN**).

To manage the streaming boundaries between human conversation and machine data, the ecosystem relies on a trinity of architecture:
1. **MZHAO (The Engine/Parser)**: The interceptor engine that parses LLM streams, detecting when to render human text versus when to extract machine data.
2. **MarkZero (The Protocol)**: The envelope protocol that uses start (`ⓜ`) and close (`ⓩ`) markers to safely embed machine data within human conversation.
3. **ADN (The Data Format)**: The pure underlying data format (`ⓖ`, `·`, `※`, etc.) that serializes complex objects into 1-token relational pointers without visual brackets.


## Documentation
- [MarkZero Protocol Specification](skills/markzero/references/markzero-spec.md)
- [Spesifikasi MarkZero Protocol](skills/markzero/references/markzero-spec.id.md)
- [ADN Specification](skills/markzero/references/adn-spec-v1.md)
- [Spesifikasi ADN - Bahasa Indonesia](skills/markzero/references/adn-spec-v1.id.md)
- [ADN Encoder Specification](skills/markzero/references/adn-encoder-spec-v1.md)
- [Spesifikasi Encoder ADN - Bahasa Indonesia](skills/markzero/references/adn-encoder-spec-v1.id.md)

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

// 1. Encoding data to pure ADN format
const payload = { os: "win32", arch: "x64" };
const encoded = encode(payload); 
// Output: ⓖos→win32ʀarch→x64

// 2. Decoding payload
const decoded = decode(encoded);
// Output: [{ os: "win32", arch: "x64" }]

// 3. Smart Token Interning Modes
const poolValuesOnly = encode(payload, ENC_VALUES);
const poolEverything = encode(payload, ENC_INTERN_ALL);
```

### Available APIs:
- `encode(input: any, encodingMode?: number): string` - Encodes any JavaScript object/array to a pure ADN string.
- `decode(payload: string): any` - Decodes a pure ADN string back into its original structures.
- `ENC_VALUES` - Encoding mode where only data values are interned if mathematically profitable.
- `ENC_INTERN_ALL` - Encoding mode where both keys and values are interned if mathematically profitable.



