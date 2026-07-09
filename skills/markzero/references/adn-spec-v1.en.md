# ADN Specification (v1)

> **"Markup is for Screens. Markdown is for Docs. ADN is for Intelligence."**

## Overview
**ADN (Agent Data Notation)** is an ultra-efficient, AI-native serialization format designed for Large Language Models. It represents data in a multi-dimensional latent space, optimized for AI attention rather than visual hierarchy.

### Representation Categorization: Human IR vs. Agent IR
Through collaborative design and philosophical refinements, representation systems for programming logic and data notation are classified into two primary categories based on how structural boundaries are defined:

1. **Human IR (Human Intermediate Representation / Interface Representation)**:
   - **Key Characteristic**: Relies on **visual block delimiters** (such as brackets, commas, indentation, and nested quotes) to define scope and hierarchy.
   - **Purpose**: Optimized for human ocular parsing and linear cognitive processing (visualizing boundaries and nesting levels).
   - **AI-Native Limitation**: While AI-centric formats utilize human natural language words (which are highly *native* to LLMs), their syntax remains tied to the **Human IR** paradigm because they still rely on visual block delimiters to define blocks.
   - **Drawback for AI**: Syntactic overhead of balancing and parsing visual delimiters that consumes excessive tokens and clutter the LLM's attention mechanism.

2. **Agent IR (Agent Intermediate Representation / Interface Representation)**:
   - **Key Characteristic**: Discards visual block delimiters entirely, replacing them with a **flat relational referencing system** utilizing 1-token structural markers (such as `·`, `¤`, `§`, `※`).
   - **Purpose**: Allows native natural language to flow freely without artificial visual boundaries. The data is flattened non-linearly and mapped directly into the AI's attention and latent space with extreme token efficiency.

| Category (IR) | Structural Boundary | Interface Tier | Target |
| :--- | :--- | :--- | :--- |
| **Human IR** | Visual Blocks (brackets, commas) | **User Interface (UI)** | Human Eye |
| **Human IR** | Linear Text & Visual Blocks | **Developer Interface (DX)** | Human Logic |
| **Agent IR** | Flat Relational Pointers (`≡`, `※`, `¤`) + Structural Markers (`░`, `§`, `→`, `¦`) | **Agent Interface (AX)** | **AI Attention (Latent)** |

## 1. Structural Markers

| Role | Char | Unicode Name | Description |
| :--- | :---: | :--- | :--- |
| **Value Marker** | `·` | U+00B7 (MIDDLE DOT) | Portal to define an interned string inside the intern pool. |
| **Grid Marker** | `░` | U+2591 (LIGHT SHADE) | Marks the start of a Grid block. |
| **Column Marker** | `§` | U+00A7 (SECTION SIGN) | Marks the heading section in a Grid. |
| **Title Marker** | `†` | U+2020 (DAGGER) | Marks a title. |
| **Row Marker** | `→` | U+2192 (RIGHTWARDS ARROW) | Marks a Set item, a Map property, or a Grid row. |
| **Cell Separator** | `¦` | U+00A6 (BROKEN BAR) | Separates cells in a Grid row. |
| **Relation Binder** | `≡` | U+2261 (IDENTICAL TO) | Binds a key to a value in a Map property. |
| **Value Ref** | `¤` | U+00A4 (CURRENCY SIGN) | Portal to a string in the intern pool (Index). |
| **Grid Ref** | `※` | U+203B (REFERENCE MARK) | Portal to a previously defined data block (Index). |
| **True** | `◆` | U+25C6 (BLACK DIAMOND) | Boolean true value. |
| **False** | `◇` | U+25C7 (WHITE DIAMOND) | Boolean false value. |
| **Null** | `○` | U+25CB (WHITE CIRCLE) | Null / empty value. |

---

## 2. Notation Mechanics
ADN includes advanced features designed for extreme data efficiency and non-linear connectivity:
- **List / Set**: A one column anonymous grid.
- **Meta / Map**: A 2-column anonymous grid using the relation binder `≡`.
- **Value Referencing (`¤`)**: A portal to a central intern pool, enabling deduplication.
- **Grid Referencing (`※`)**: A portal to existing data blocks, enabling structural reuse.
- **Interning**: The process of replacing literal strings with portals to save space.

### 2.1 Payload & Structural Rules
- **Pure ADN**: An ADN payload has no boundaries like brackets or envelope markers. It consists of an optional intern pool followed by one or more data blocks.
- **Intern Pool**: The intern pool is a block of `·`-prefixed interned strings. It is optional — present only when the data contains Value References (`¤`).

### 2.2 Grid
- **Grid Requirement**: A valid ADN payload must contain at least one grid (`░`).
- **Multi-Grid Capability**: A single ADN payload can contain **multiple** Grid blocks (`░`), allowing complex multi-set or multi-grid structures.
- **Bound Title**: A grid MAY carry a bound title inline between `░` and `§`. A bound title is **one** label. When a column header (`§`) is present, the `†` Title Marker is implicit at the title position (e.g. `░User§name¦role`). When the bound title is present WITHOUT a column header, the `†` Title Marker is REQUIRED to disambiguate the title from a value (e.g. `░†User→hyuze¦admin`).
- **Anonymous Grid**: A grid with neither a bound title nor a column header is an anonymous grid (e.g. `░hyuze¦admin→alice¦dev`). In an anonymous grid, the first row's Row Marker (`→`) is OPTIONAL. Anonymous grids typically represent homogeneous lists or sets where the row shape is implied by context. All subsequent rows still require the Row Marker.
- **Auto Grid Indexing**: Every Grid block (`░`) in the payload is assigned a sequential index starting from `0` in a top-down / parent-first manner. Grid 0 represents the outermost parent (root) grid. Because index 0 is the parent itself, grid references (`※`) for nested child structures always start from `※1`.
- **Empty Collections**: An empty Set is `░`. An empty Map is `░≡`.
- **Scalar Values**: Scalar values (`◆`, `◇`, `○`) are cell values within a Grid row. They do not appear outside a Grid.
- **Trailing Separator Omission**: Trailing `¦` separators MAY be absent when the last cells in a row are empty. Missing trailing cells are treated as empty strings.
- **Unresolvable Referencing**: A grid or value reference is unresolvable when the index is out of range or forms a circular dependency. Unresolvable references resolve to `null`.




---

## 3. Token Cost Analysis

All structural markers are optimized for **1-token cost** on primary target models (OpenAI, Claude, Grok/xAI). Some Chinese models (GLM, Qwen, Hy3, Kimi, Nex) may tokenize certain markers at +2 due to different tokenizer training data; we continuously strive to achieve universal +1 cost across all models.

### 3.1 Marker Cost Matrix

| Char | Role | MiMo | DeepSeek | Grok | GLM-5.1 | Qwen3.6 | Hy3 | Kimi-K2.6 | Nex-N2 |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `·` | Value | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `░` | Grid | +1 | +1 | +1 | +1 | +1 | +2 | +1 | +1 |
| `§` | Column | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `†` | Title | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `→` | Row | +1 | +1 | +1 | +1 | +2 | +1 | +2 | +2 |
| `¦` | Row Sep | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `≡` | Bind | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `¤` | Value Ref | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `※` | Grid Ref | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `◆` | True | +1 | +1 | +1 | +1 | +1 | +1 | +2 | +1 |
| `◇` | False | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |
| `○` | Null | +1 | +1 | +1 | +1 | +1 | +1 | +1 | +1 |

### 3.2 Methodology

- **Baseline approach**: Each marker char is prepended to the fixed string `"char hyuze"`. The baseline token count of `"char hyuze"` alone is subtracted to isolate the marker's cost.
- **System prompt**: API-based providers (MiMo, SiliconFlow, OpenAI, Claude) use **no system prompt** — only a single user message is sent. xAI/Grok uses system prompt `"Respond with only: ok"` to stabilize output for consistent metric extraction.
- **MiMo**: Tested via MiMo API (`mimo-v2.5`).
- **DeepSeek**: Tested via SiliconFlow API (`deepseek-ai/DeepSeek-V3`).
- **Grok**: Tested via xAI web console (puppeteer automation, `console.x.ai`).
- **Chinese models**: Tested via SiliconFlow API (GLM-5.1, Qwen3.6-35B-A3B, Hy3-preview, Kimi-K2.6, Nex-N2-Pro).

*Official ADN Specification - Monday, May 25, 2026*
