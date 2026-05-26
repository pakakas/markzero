# MarkZero Specification (v1)

> **"Markup is for Screens. Markdown is for Docs. MarkZero is for Intelligence."**

## Overview
**MarkZero** is an ultra-efficient, AI-native serialization format designed for Large Language Models. It represents data in a multi-dimensional latent space, optimized for AI attention rather than visual hierarchy.

| Interface Tier | Notation Type | Direction | Target |
| :--- | :--- | :--- | :--- |
| **User Interface (UI)** | **Mark-UP** | Upward | Human Eye |
| **Developer Interface (DX)** | **Mark-DOWN** | Linear | Human Logic |
| **Agent Interface (AX)** | **MarkZero** | **Omni (N-Dim)** | **AI Attention** |

## 1. Structural Markers

| Role | Char | Unicode Name | Description |
| :--- | :---: | :--- | :--- |
| **Start Marker** | `ⓩ` | U+24E9 (CIRCLED LATIN SMALL LETTER Z) | Every MarkZero payload begins with this marker. |
| **Value Marker** | `·` | U+00B7 (MIDDLE DOT) | Portal to define an interned string inside the Token Pool. |
| **Grid Marker** | `ⓖ` | U+24D6 (CIRCLED LATIN SMALL LETTER G) | Marks the start of a Grid block. |
| **Column Marker** | `ᴄ` | U+1D04 (LATIN LETTER SMALL CAPITAL C) | Marks the heading section in a Grid. |
| **Row Marker** | `ʀ` | U+0280 (LATIN LETTER SMALL CAPITAL R) | Marks a Set item, a Map property, or a Grid row. |
| **Row Separator** | `¦` | U+00A6 (BROKEN BAR) | Separates cells in a Grid row. |
| **Relation Binder** | `→` | U+2192 (RIGHTWARDS ARROW) | Binds a key to a value in a Map property. |
| **Value Ref** | `¤` | U+00A4 (CURRENCY SIGN) | Portal to a string in the Token Pool (Index). |
| **Grid Ref** | `※` | U+203B (REFERENCE MARK) | Portal to a previously defined data block (Index). |
| **Title Marker** | `★` | U+2605 (BLACK STAR) | Prefix for block titles. |
| **Escaper** | `Ɇ` | U+0246 (LATIN CAPITAL LETTER E WITH STROKE) | Escapes structural markers within literal content. |

---

## 2. Notation Mechanics
MarkZero includes advanced features designed for extreme data efficiency and non-linear connectivity:
- **List / Set**: A one column anonymous grid.
- **Meta / Map**: A 2-column anonymous grid using the relation binder `→`.
- **Value Referencing (`¤`)**: A portal to a central Token Pool, enabling deduplication.
- **Grid Referencing (`※`)**: A portal to existing data blocks, enabling structural reuse. Unresolvable references resolve to `null`.
- **Interning**: The process of replacing literal strings with portals to save space.
- **Escaping**: A reliable mechanism to handle structural markers within literal content.

### 2.1 Payload & Structural Rules
- **Start Marker (`ⓩ`)**: Every payload begins with the start marker.
- **Token Pool**: Following the start marker, the token pool is **required** if the payload contains any Value References (`¤`). If no Value References exist, the pool is omitted.
- **Optional Payload Blocks**: Payload blocks (such as Grids/Sets) are completely **optional**. A valid payload can consist of just the start marker (`ⓩ`) or just the start marker plus the Token Pool, without any trailing data blocks.
- **Multi-Grid Capability**: A single MarkZero payload can contain **multiple** Grid blocks (`ⓖ`) and Title blocks (`★`), allowing complex multi-set or multi-grid structures to be serialized and parsed in a single stream.
- **Auto Grid Indexing**: Every Grid block (`ⓖ`) parsed in the payload is automatically assigned a sequential index starting from `0`. This sequential index (Auto Grid Index) is used by Grid Referencing (`※`) to reference and reuse previously defined data blocks (e.g., `※0`, `※1`).
- **Empty Collections**: An empty Map `{}` and an empty List/Set `[]` both serialize to `ⓩⓖ` (Start Marker + Grid Start) to maintain structural minimalism.
- **Unresolvable Referencing**: Unresolved grid referencing or circular dependency (e.g., `※0` referencing grid index `0` while decoding itself) resolves to `null` by design to prevent infinite recursion.


### 1.1 The Escaper Marker (`Ɇ`)
To guarantee zero-collision even when discussing the notation itself, structural markers found within data must be escaped by prefixing them with the **Escaper (`Ɇ`)** marker.
*   **Literal Marker**: To include a structural marker (like `¦`, `ⓖ`, `★`, `ᴄ`, or `ʀ`) as literal data, prefix it: `Ɇ¦`, `Ɇⓖ`, `Ɇ★`, `Ɇᴄ`, `Ɇʀ`.
*   **Escaped Escaper**: To include a literal `Ɇ` within data, it must be doubled: `ɆɆ`.

---

## 3. Token Interning Heuristics
MarkZero employs a mathematical model to decide if interning a string into the pool is profitable based on token costs.

### 3.1 Profitability Formula
A string is interned only if the total savings outweigh the definition overhead:

`frequency * (tokenLength - refCost) > (poolOverhead + tokenLength)`

| Variable | Description |
| :--- | :--- |
| **frequency** | How many times the string appears in the payload. |
| **tokenLength** | Estimated tokens of the original string. |
| **refCost** | Tokens for a reference (Marker `¤` + Index, usually 2). |
| **poolOverhead** | Tokens to define a new entry (Marker `·`, usually 1). |

### 3.2 Heuristic Estimation
To maintain performance, the **tokenLength** is estimated using a zero-allocation character scan:
*   **Symbols & Markers**: Each Unicode symbol is counted as **1 token**.
*   **Alphanumeric Blocks**: Consecutive letters or numbers are grouped as **1 token**.
*   **Whitespace**: Consecutive spaces or newlines are grouped as **1 token**.

> [!NOTE]
> **Known Limitation**: Non-alphanumeric characters with Unicode values `>= 128` (including non-Latin blocks such as Emoji, CJK, Arabic, Cyrillic, etc.) are aggressively grouped together into a single token by this scanner heuristic. In real-world LLM tokenizers, non-Latin strings may split into multiple tokens, representing a slight deviation in actual token cost.

---

*Official MarkZero Specification - Monday, May 25, 2026*
