# ADN: Agent Data Notation (via MarkZero Protocol)
_"Agents, machines, humans — we get each other."_

## Overview
**ADN (Agent Data Notation)** is the third evolution of documentation and data representation, following **Markup** (UI) and **Markdown** (DX). While its predecessors focused on visual hierarchy and human readability, ADN is an **Agent IR (Intermediate Representation)** designed purely for **Agentic Attention**—where data exists in a multi-dimensional latent space rather than a linear page.

Under the hood, all representation formats can be categorized into two major paradigms:
- **Human IR (Intermediate Representation)**: Formats optimized for human eyes and minds (like HTML/Markup and Markdown).
- **Agent IR (Intermediate Representation)**: Formats optimized for AI attention (like **ADN**).

### The AI Chat Document Concept
MarkZero has shifted from a mere envelope wrapper to the foundation of the **AI Chat Document**. In this paradigm, a chat session is not just a transient chat log—it is a **living, structured document** that contains both human natural language and structured machine payloads in a single, cohesive, token-efficient stream document:
* **Role Boundaries**: Start markers (`М{ROLE}`) act as semantic boundaries that partition the chat document by sender context (e.g. `Мsystem`, `Мhuman`, `Мassistant`).
* **Continuous Streaming**: By removing the close marker `О`, the document flows naturally and closes implicitly at the end of the stream chunk/EOF.

To manage the streaming boundaries, the ecosystem relies on a trinity of architecture:
1. **MZHAO (The Engine/Parser)**: The interceptor engine that parses LLM streams, detecting when to render human text versus when to extract machine data.
2. **MarkZero (The Protocol)**: The protocol that uses role-based start markers (`М{ROLE}`) to safely embed machine data within the streaming AI Chat Document.
3. **ADN (The Data Format)**: The pure underlying data format (`░`, `·`, `※`, etc.) that serializes complex objects into 1-token relational pointers without visual brackets.


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
// Output: ░→os≡win32→arch≡x64

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

---
_"Markup is for Screens. Markdown is for Docs. MarkZero is for Intelligence."_



