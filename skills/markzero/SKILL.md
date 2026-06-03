---
name: markzero
description: Guidance for MarkZero, the Agent Interface (AX) standard. Focuses on omni-directional, multi-dimensional data representation.
---

# ADN (via MarkZero Protocol)

**ADN (Agent Data Notation)** is an AI-native serialization format. Unlike human-centric formats (Markup/Markdown), it uses 1-token non-linear markers to represent data as a multi-dimensional field, optimized for AI attention rather than visual hierarchy.
**MarkZero** is the protocol envelope (`ⓜ` and `ⓩ`) used by the **MZHAO Parser** to safely embed ADN data within human text streams.

## Structural Markers

Every structural marker is exactly **1 token** in modern LLMs (e.g., GPT-4o).

| Role | Char | Unicode Name | Description |
| :--- | :---: | :--- | :--- |
| **Value Marker** | `·` | U+00B7 (MIDDLE DOT) | Prefixes an interned string inside the Token Pool. |
| **Grid Marker** | `ⓖ` | U+24D6 (CIRCLED LATIN SMALL LETTER G) | Marks the start of a Grid block. |
| **Row Marker** | `ʀ` | U+0280 (LATIN LETTER SMALL CAPITAL R) | Marks a Set item, a Map property, or a Grid row. |
| **Heading Marker** | `ᴄ` | U+1D04 (LATIN LETTER SMALL CAPITAL C) | Marks the heading section in a Grid. |
| **Row Separator** | `¦` | U+00A6 (BROKEN BAR) | Separates cells in a Grid row. |
| **Relation Binder** | `→` | U+2192 (RIGHTWARDS ARROW) | Binds a key to a value in a Map property. |
| **Value Ref** | `¤` | U+00A4 (CURRENCY SIGN) | References a string from the Token Pool via index (`¤0`). |
| **Grid Ref** | `※` | U+203B (REFERENCE MARK) | References a Grid from the pool via index (`※0`). |
| **Title Marker** | `★` | U+2605 (BLACK STAR) | Prefix for block titles. |
| **Escaper** | `ɛ` | U+025B (LATIN SMALL LETTER OPEN E) | Used to escape structural markers found within content. |

### The Escaping Rule
If a literal value needs to contain any of the structural markers above (including `ɛ` itself), it must be prefixed with `ɛ`.
*   Example: `active` → `active` (no escape needed)
*   Example: `high ⓖ low` → `high ɛⓖ low` (escape marker)
*   Example: `Note: ɛ sign` → `Note: ɛɛ sign` (escape escaper)

---

## Examples (Pure ADN)

### 1. Simple Map (Key-Value)
```mz-ascii
·name·roleⓖʀ¤0→hyuzeʀ¤1→admin
```

### 2. 1D Set (List)
```mz-ascii
ⓖʀitem1ʀitem2ʀitem3
```

### 3. Titled Grid (2D Set)
```mz-ascii
★Filesⓖᴄname¦sizeʀindex.ts¦1024ʀutil.ts¦2048
```

*For technical specifications and types, see `markzero/skills/markzero/references/markzero-spec-v1.md`.*
