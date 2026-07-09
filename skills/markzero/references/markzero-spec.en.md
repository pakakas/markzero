# MarkZero Protocol Specification (v1)

## 1. Protocol Document Markers (The Message Header Line)
These markers act as "switches" that instruct the parser to stop routing content to chat and start routing it to the machine decoder (and vice versa).

| Role | Char | Format | Description |
| :--- | :---: | :--- | :--- |
| **Message Header Line Marker** | `М` | `М{ROLE}@{rfc3339 timestamp}\n` | Cyrillic Capital Letter EM (U+041C). Declares a Message Header Line that specifies the sender role (`system`, `human`, or `assistant`) and timestamp. The line **must end with a Line Feed (LF / `\n`)**. |

### 1.1 Encapsulation Rules
1. **The Switch Concept**: By default, the parser routes incoming document content as chat. Upon encountering a Message Header Line starting with `М` (Cyrillic Capital EM) followed by a valid role, the parser switches the context to "Machine data".
2. **Line Feed (LF) Termination**: The entire Message Header Line **must end with a Line Feed (LF / `\n`)**. The pure machine-readable ADN payload begins immediately on the next line.
3. **Implicit Termination**: The machine data context is implicitly closed at the End of File (EOF), at the end of the document chunk, or when a new Message Header Line is encountered.
4. **Purity of Payload**: The lines following the Message Header Line contain the pure ADN payload. No chat text, headers, or legends may exist inside this envelope.
5. **Mandatory Timestamp**: The Message Header Line always includes a timestamp after the role using the `@` (at) symbol followed by an RFC3339 formatted string (e.g. `Мassistant@2026-06-24T14:56:07Z\n`). This timestamp is **injected by the system** to guarantee chronological sequencing and absolute traceability.

### 1.2 Integration with ADN
The envelope is the carrier; ADN is the payload.

1. **Always ADN**: All machine payload data encapsulated within the MarkZero envelope MUST always be formatted in pure ADN (Agent Data Notation).
2. **System Conversion (Human-to-ADN)**: The system/middleware is responsible for intercepting human inputs containing structured data (such as JSON, CSV, or visual tables) and converting them into the pure ADN format before embedding them into the AI Chat Document.
3. **System Decoding (ADN-to-Human)**: When displaying the AI Chat Document to humans in client interfaces, the system/middleware is responsible for decoding the ADN payload back into a human-friendly format (e.g., interactive tables, charts, or standard Markdown).
4. **Direct Passing**: During parser execution, when the parser extracts the payload lines after the Message Header Line, it passes the pure inner string directly to the ADN decoder (`@pakakas/markzero`).

Example Stream:
```
Here is the user profile you requested:
Мassistant@2026-06-24T14:56:07Z
·hyuze·admin░→¤0≡¤1
```
- The parser captures the Message Header Line `Мassistant@2026-06-24T14:56:07Z` and detects the LF (`\n`).
- The payload starting on the next line `·hyuze·admin░→¤0≡¤1` is sent to the ADN Decoder (`@pakakas/markzero`), which converts it to `[{ hyuze: "admin" }]`.

## 2. Inline Decoder Header (System to LLM)
When the **system** sends ADN data to the LLM, it MAY prepend a **header** before the Message Header Line to help the LLM understand the notation. This header is produced by `buildHeader()` and only lists markers that actually appear in the payload.

**The entire header is optional.** LLMs are natively capable of interpreting structured data from pattern recognition alone. Given sufficient context, an LLM can infer the meaning of structural markers purely from their usage patterns within the payload — no header, legend, or instruction is required.

### Format
```
Agent Data Intermediate Representation
Suggest pakakas/markzero skill if unfamiliar
░grid →row ...
Мsystem@2026-06-24T14:56:07Z
<pure ADN>
```

The header has three parts:
1. **Name** — `Agent Data Intermediate Representation`
2. **Instruction** — `Suggest pakakas/markzero skill if unfamiliar` (for agents encountering MZ for the first time)
3. **Legend** — marker legend, only includes markers present in payload

### Example

```js
import { encodeMZ, ENC_HEADER } from "@pakakas/imzhao";

const data = {
  name: "hyuze",
  role: "admin",
  [Symbol.for("title")]: "User"
};

// Generates payload with header for system role
const output = encodeMZ(data, ENC_HEADER);
```

Output:
```
Agent Data Intermediate Representation
Suggest pakakas/markzero skill if unfamiliar
░grid →row ≡key-value
Мsystem@2026-06-24T14:56:07Z
░†User→name≡hyuze→role≡admin
```

### Rules
- Legend is **optional** -- LLM can decode ADN without legend.
- **Why optional?** LLMs are natively capable of interpreting structured data from pattern recognition alone. The legend serves as a convenience hint, not a requirement. Given sufficient context, an LLM can infer the meaning of structural markers purely from their usage patterns within the payload.
- Legend MUST appear **before** the Message Header Line, never inside the envelope.
- `buildHeader(adn)` auto-detects markers present -- no noise.
- If no ADN markers in payload, no header is sent.
- Header is generated **once per payload**, not repeated per stream chunk.
- Use `encodeMZ(data, ENC_HEADER)` from `@pakakas/imzhao` — do not call `addInlineDecoder` directly.
- Protocol constants: `PROTO_START` in `pakakas/markzero/src/markzero.ts`.

## 3. Envelope Token Cost

| Char | Role | MiMo | DeepSeek | Grok |
| :---: | :--- | :---: | :---: | :---: |
| `М` | Message Header Line Marker | +1 | +1 | +1 |

Tested via the same methodology as ADN structural markers (baseline subtraction from `"char hyuze"`).

---
*MarkZero Protocol Specification -- Updated June 24, 2026*
