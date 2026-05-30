# MarkZero Encoder Optimization & Relational Flattening Specification (v1)

## Overview
While the **MarkZero Specification** governs payload structure and decoding rules, the **Encoder Specification** governs the strategies and algorithms used to translate complex, nested runtime data structures into highly compressed, token-efficient MarkZero payloads.

An encoder's primary objective is to maximize LLM **Attention Efficiency** by:
1. **Relational Data-Flattening**: Converting hierarchical, deeply nested structures into a flat stream of independent, cross-referenced grid blocks.
2. **Mathematical Interning**: Using cost heuristics to decide which repetitive literals should be pooled.

---

## 1. Relational Data-Flattening (Post-Order Multi-Grid Serialization)
Deeply nested, tree-like JSON structures present cognitive load for LLMs due to nesting syntax overhead (braces, brackets, commas, escaped quotes). MarkZero encoders solve this by flattening nested objects and arrays bottom-up (post-order traversal) into a flat array of grid blocks, referencing them via Grid References (`※index`).

### 1.1 Traversal & Indexing Rules
1. **Post-Order/Bottom-Up Traversal**: Encoders traverse nested structures depth-first. Nested child objects or arrays are serialized *before* their parents.
2. **Sequential Block Pushing**: Every serialized child grid is pushed to a central payload list (`blocks`). The parent object references the child using `※index`, where `index` corresponds to the child's position in the `blocks` list.
3. **Implicit Grid Indexing**: Decoders reconstruct references sequentially. Every Grid Marker (`ⓖ`) encountered in the transmission payload increments the auto-grid index, matching the post-order sequence.
4. **Grid Deduplication / Grid Interning**: To maximize token efficiency, encoders can deduplicate identical nested structures. When serializing a nested child, the encoder checks if an identical serialized grid (same keys and values) already exists in the central `blocks` list. If a match is found, the encoder reuses the existing grid's index reference (`※index`) instead of pushing a duplicate block. This allows multiple parent keys to share the same grid block, drastically reducing payload size while maintaining perfect decoder compatibility.

---

## 2. Collection Classification & Preserving Rules
To preserve logical boundaries (like tabular data or uniform grids), encoders classify arrays prior to flattening.

### 2.1 Collection Classification
- **Uniform Grid (Array of Objects / DoD)**: An array where every element is a plain object without titles (e.g., `[{name: "a"}, {name: "b"}]`).
- **2D Matrix**: An array where every element is an array (e.g., `[["1", "0"], ["0", "1"]]`).
- **Heterogeneous Array**: An array containing mixed types or nested objects/arrays (e.g., `[{title: "Header"}, [1, 2]]`).

### 2.2 Preserving & Splitting Logic
When the encoder processes an array `input` at any level:
1. **Early Return for Non-Arrays**: If `input` is not an array, serialize it as a single block directly.
2. **Preserve Uniform Grids (DoD)**: If `isUniformGrid(input)` is true, do not split it. It is serialized as a single, column-headed grid (`ⓖᴄ...`).
3. **Preserve 2D Matrices**: If `is2DMatrix(input)` is true, do not split it. It is serialized as a single 2D grid matrix.
4. **Split Heterogeneous Arrays**: If `input.some(isNestedStructure)` is true, the array is heterogeneous and contains nested structures. In this case, the array is split: the encoder maps over the array, recursively serializing each item, and returns the joined stream of blocks.

---

## 3. Token Pool & Profitability Heuristics
Value interning (Token Pooling) replaces repetitive string literals with reference pointers (`¤index`) pointing to a Token Pool (`·`) at the payload start. Interning carries definition overhead, so encoders use the profitability formula to make optimal decisions.

### 3.1 The Profitability Formula
A candidate string is pooled only if the total token savings exceed the overhead of defining it in the pool:

$$\text{frequency} \times (\text{tokenLength} - \text{refCost}) > (\text{poolOverhead} + \text{tokenLength})$$

- **frequency**: The total number of times the candidate string appears in the payload (both in keys and values).
- **tokenLength**: Estimated token size of the string.
- **refCost**: Token cost of a reference pointer (`¤index`), assumed to be **2 tokens** (1 for `¤`, 1 for index).
- **poolOverhead**: Token cost of defining a pool entry (`·`), assumed to be **1 token**.

### 3.2 Token Size Estimation Heuristic
To avoid expensive regex or heavy sub-tokenizers, encoders use a zero-allocation character scanning heuristic:
- **Symbols**: Consecutive punctuation, spaces, or Unicode symbols represent **1 token**.
- **Alphanumeric Blocks**: Consecutive alphabetic letters or digits represent **1 token**.
- **Whitespace**: Consecutive newlines or whitespace represent **1 token**.

---

## 4. Encoding Modes (Compression Strategies)
Encoders typically support three reference operational modes to balance compression ratio with encoding runtime performance:

| Mode | Identifier | Interning Strategy | Use Case |
| :--- | :--- | :--- | :--- |
| **Default (Literal)** | `MODE_DEFAULT` | **No pooling**. All keys and values are written directly as literals. Safe for small payloads where overhead outweighs savings. | Low latency, small config maps |
| **Smart Values** | `ENC_VALUES` | **Pools values only**. Checks only data values against the profitability formula. Keys are left as literals. | Logs, database rows, telemetry |
| **Intern All** | `ENC_INTERN_ALL` | **Pools both keys and values**. Evaluates all string occurrences (both keys and values) for profitability. | Deeply repetitive structures, API schemas |

---

## 5. Extensibility & Flexible Modes (Flex Mode)
The reference encoding modes defined in this specification are designed to guide implementers. However, the MarkZero standard does not lock down the encoder to only these modes.

1. **Custom Heuristics**: Developers are encouraged to design new, custom compression modes tailored to specific use cases (e.g., domain-specific dictionary interning or aggressive nesting-avoidance policies).
2. **Strict Mode**: Certain secure or low-complexity environments may choose to enforce a strict "No Interning" policy (identical to `MODE_DEFAULT`) to ensure payloads are completely literal and eliminate all reference processing overhead.
3. **Decoder-Neutral Evolution**: Because all compression strategies emit standard structural elements (Token Pools, Value References, and Grid References), any custom or future encoding mode will remain fully backward and forward compatible. Standard MarkZero v1 decoders will decode them flawlessly without requiring updates.

---
*Official MarkZero Encoder Specification - Sunday, May 31, 2026*
