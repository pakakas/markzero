# ADN Specification (via MarkZero Protocol v1)

> **"Markup is for Screens. Markdown is for Docs. ADN is for Intelligence."**

## Overview
**ADN (Agent Data Notation)** is an ultra-efficient, AI-native serialization format designed for Large Language Models. It represents data in a multi-dimensional latent space, optimized for AI attention rather than visual hierarchy.

To facilitate seamless integration within LLM chat streams, the ecosystem operates on a trinity:
1. **MZHAO**: The Engine/Parser that processes text streams.
2. **MarkZero**: The Protocol envelope (`ⓜ` and `ⓩ`) used to switch between human and machine text.
3. **ADN**: The pure Data Format structure.

### Representation Categorization: Human IR vs. Agent IR
Through collaborative design and philosophical refinements, representation systems for programming logic and data notation are classified into two primary categories based on how structural boundaries are defined:

1. **Human IR (Human Intermediate Representation / Interface Representation)**:
   - **Key Characteristic**: Relies on **visual block delimiters** (such as curly braces `{ }`, square brackets `[ ]`, commas, indentation, and nested quotes) to define scope and hierarchy.
   - **Purpose**: Optimized for human ocular parsing and linear cognitive processing (visualizing boundaries and nesting levels).
   - **AI-Native Limitation**: While AI-centric formats like *Zerolang* utilize human natural language words (which are highly *native* to LLMs), their syntax remains tied to the **Human IR** paradigm because they still rely on visual JSON-like curly braces `{ }` to define blocks.
   - **Drawback for AI**: Syntactic overhead of balancing and parsing visual delimiters that consumes excessive tokens and clutter the LLM's attention mechanism.

2. **Agent IR (Agent Intermediate Representation / Interface Representation)**:
   - **Key Characteristic**: Discards visual block delimiters (`{ }`) entirely, replacing them with a **flat relational referencing system** utilizing 1-token structural markers (such as `ⓟ` / `ⓜ`, `·`, `¤`, `ⓖ`, `※`).
   - **Purpose**: Allows native natural language to flow freely without artificial visual boundaries. The data is flattened non-linearly and mapped directly into the AI's attention and latent space with extreme token efficiency.
   - **ADN as a Pure Agent IR**: **ADN** is designed purely as an Agent IR. It is carried over the **MarkZero** protocol and processed by the **MZHAO** parser, streaming structured help and command descriptions from CLI tools to AI agents as flat relational grids and pointers, omitting all human visual braces.

| Category (IR) | Structural Boundary | Interface Tier | Notation Type | Target |
| :--- | :--- | :--- | :--- | :--- |
| **Human IR** | Visual Blocks (`{ }`, `[ ]`, commas) | **User Interface (UI)** | **Mark-UP** | Human Eye |
| **Human IR** | Linear Text & Visual Blocks | **Developer Interface (DX)** | **Mark-DOWN** / *Zerolang* | Human Logic |
| **Agent IR** | Flat Relational Pointers (`※`, `¤`) | **Agent Interface (AX)** | **ADN** (via MarkZero) | **AI Attention (Latent)** |

## 1. Structural Markers

| Role | Char | Unicode Name | Description |
| :--- | :---: | :--- | :--- |
| **Value Marker** | `·` | U+00B7 (MIDDLE DOT) | Portal to define an interned string inside the Token Pool. |
| **Grid Marker** | `ⓖ` | U+24D6 (CIRCLED LATIN SMALL LETTER G) | Marks the start of a Grid block. |
| **Column Marker** | `ᴄ` | U+1D04 (LATIN LETTER SMALL CAPITAL C) | Marks the heading section in a Grid. |
| **Row Marker** | `ʀ` | U+0280 (LATIN LETTER SMALL CAPITAL R) | Marks a Set item, a Map property, or a Grid row. |
| **Row Separator** | `¦` | U+00A6 (BROKEN BAR) | Separates cells in a Grid row. |
| **Relation Binder** | `→` | U+2192 (RIGHTWARDS ARROW) | Binds a key to a value in a Map property. |
| **Value Ref** | `¤` | U+00A4 (CURRENCY SIGN) | Portal to a string in the Token Pool (Index). |
| **Grid Ref** | `※` | U+203B (REFERENCE MARK) | Portal to a previously defined data block (Index). |
| **Title Marker** | `★` | U+2605 (BLACK STAR) | Prefix for block titles. |
| **Escaper** | `ɛ` | U+025B (LATIN SMALL LETTER OPEN E) | Escapes structural markers within literal content. |

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
- **Pure ADN**: An ADN payload has no boundaries like brackets or envelope markers. It starts naturally with a Token Pool (`❖`) or a Grid (`ⓖ`).
- **Token Pool**: The token pool is **required** at the start of the payload if the data contains any Value References (`¤`). If no Value References exist, the pool is omitted.
- **Optional Payload Blocks**: Payload blocks (such as Grids/Sets) are completely **optional**. A valid payload can consist of just the Token Pool, without any trailing data blocks.
- **Multi-Grid Capability**: A single MarkZero payload can contain **multiple** Grid blocks (`ⓖ`) and Title blocks (`★`), allowing complex multi-set or multi-grid structures to be serialized and parsed in a single stream.
- **Auto Grid Indexing**: Every Grid block (`ⓖ`) parsed in the payload is automatically assigned a sequential index starting from `0`. This sequential index (Auto Grid Index) is used by Grid Referencing (`※`) to reference and reuse previously defined data blocks (e.g., `※0`, `※1`).
- **Empty Collections**: An empty Map `{}` and an empty List/Set `[]` both serialize to `ⓜⓖⓩ` (Start Marker + Grid Start + Close Marker) to maintain structural minimalism.
- **Unresolvable Referencing**: Unresolved grid referencing or circular dependency (e.g., `※0` referencing grid index `0` while decoding itself) resolves to `null` by design to prevent infinite recursion.


### 1.1 The Escaper Marker (`ɛ`)
To guarantee zero-collision even when discussing the notation itself, structural markers found within data must be escaped by prefixing them with the **Escaper (`ɛ`)** marker.
*   **Literal Marker**: To include a structural marker (like `¦`, `ⓖ`, `★`, `ᴄ`, or `ʀ`) as literal data, prefix it: `ɛ¦`, `ɛⓖ`, `ɛ★`, `ɛᴄ`, `ɛʀ`.
*   **Escaped Escaper**: To include a literal `ɛ` within data, it must be doubled: `ɛɛ`.

*Official MarkZero Specification - Monday, May 25, 2026*
