---
name: markzero
description: Guidance for MarkZero, the Agent Interface (AX) standard. Focuses on omni-directional, multi-dimensional data representation.
---

# ADN (via MarkZero Protocol)

**ADN (Agent Data Notation)** is an AI-native serialization format. Unlike human-centric formats (Markup/Markdown), it uses 1-token non-linear markers to represent data as a multi-dimensional field, optimized for AI attention rather than visual hierarchy.

**MarkZero** is the protocol that defines the structure of the **AI Chat Document**. It merges human conversation and structured machine-executable payloads into a single, cohesive, token-efficient stream document using role-based start markers (`М{ROLE}`) without a close marker. See [MarkZero Protocol Specification](references/markzero-spec.md).

## Structural Markers

Every structural marker is exactly **1 token** in modern LLMs (e.g., GPT-4o).

| Role | Char | Unicode Name | Description |
| :--- | :---: | :--- | :--- |
| **Value Marker** | `·` | U+00B7 (MIDDLE DOT) | Prefixes an interned string inside the intern pool. |
| **Grid Marker** | `░` | U+2591 (LIGHT SHADE) | Marks the start of a Grid block. |
| **Row Marker** | `→` | U+2192 (RIGHTWARDS ARROW) | Marks a Set item, a Map property, or a Grid row. |
| **Column Marker** | `§` | U+00A7 (SECTION SIGN) | Marks the heading section in a Grid. |
| **Item Separator** | `¦` | U+00A6 (BROKEN BAR) | Separates cells in a Grid row. Trailing `¦` for empty last cells may be omitted. |
| **Relation Binder** | `≡` | U+2261 (IDENTICAL TO) | Binds a key to a value in a Map property. |
| **Value Ref** | `¤` | U+00A4 (CURRENCY SIGN) | References a string from the Value Pool via index (`¤0`). |
| **Grid Ref** | `※` | U+203B (REFERENCE MARK) | References a Grid from the pool via index (`※1`). |

---

## Examples (Pure ADN)

### 1. Simple Map (Key-Value)
```mz-ascii
·name·role░→¤0≡hyuze→¤1≡admin
```

### 2. 1D Set (List)
```mz-ascii
░item1→item2→item3
```

### 3. Titled Grid (2D Set)
```mz-ascii
░Files§name¦size→index.ts¦1024→util.ts¦2048
```

*For technical specifications and types, see [ADN Specification](references/adn-spec-v1.md).*
