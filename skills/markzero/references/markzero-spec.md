# MarkZero Protocol Specification (v1)

## 1. Protocol Stream Markers (The Envelope)
These markers act as "switches" that instruct the stream parser to stop routing tokens to human chat and start routing them to the machine decoder (and vice versa).

| Role | Char | Unicode Name | Description |
| :--- | :---: | :--- | :--- |
| **Start Marker** | `ⓜ` | U+24DC (CIRCLED LATIN SMALL LETTER M) | Safely switches the stream from human mode to machine mode. |
| **Close Marker** | `ⓩ` | U+24E9 (CIRCLED LATIN SMALL LETTER Z) | Ends the machine data block and returns to human mode. |

### 1.1 Encapsulation Rules
1. **The Switch Concept**: The parser treats the text stream as default "Human text". The moment `ⓜ` is encountered, the stream context switches to "Machine data".
2. **Optional Closure**: The close marker `ⓩ` is completely **optional**. If a stream reaches the End of File (EOF), the parser implicitly closes the machine context. `ⓩ` is only strictly required if the LLM intends to write further human-readable text *after* the machine data block.
3. **Purity of Payload**: Everything between `ⓜ` and `ⓩ` is considered the pure ADN payload. No human-readable text, headers, or legends may exist inside this envelope -- they must appear outside (before `ⓜ` or after `ⓩ`).

### 1.2 Integration with ADN
The envelope is the carrier; ADN is the payload.
When the parser extracts the payload between `ⓜ` and `ⓩ` (or EOF), it passes the pure inner string directly to the ADN decoder (`@pakakas/markzero`).

Example Stream:
```
Here is the user profile you requested:
ⓜ·hyuze·adminⓖʀ¤0→¤1ⓩ
Please let me know if you need anything else!
```
- The parser captures `·hyuze·adminⓖʀ¤0→¤1`.
- The string is sent to the ADN Decoder (`@pakakas/markzero`), which converts it to `[{ hyuze: "admin" }]`.

## 2. Inline Decoder Legend (System to LLM)
When the **system** sends ADN data to the LLM, it MAY prepend a **legend** before the `ⓜ` marker to help the LLM understand the notation. This legend is produced by `buildHeader()` and only lists markers that actually appear in the payload.

### Format
```
Agent Data Intermediate Representation
Suggest pakakas/markzero skill if unfamiliar
ⓖgrid ʀrow ...
ⓜ<pure ADN>ⓩ
```

The header has three parts:
1. **Name** — `Agent Data Intermediate Representation`
2. **Instruction** — `Suggest pakakas/markzero skill if unfamiliar` (for agents encountering MZ for the first time)
3. **Decoder** — marker legend, only includes markers present in payload

### Example

```js
import { encodeMZ, ENC_HEADER, ENC_CLOSE } from "@pakakas/imzhao";

const data = {
  name: "hyuze",
  role: "admin",
  [Symbol.for("title")]: "User"
};

const output = encodeMZ(data, ENC_HEADER | ENC_CLOSE);
```

Output:
```
Agent Data Intermediate Representation
Suggest pakakas/markzero skill if unfamiliar
ⓖgrid→key-value
ⓜⓖUserᴄʀname→hyuzeʀrole→adminⓩ
```

### Rules
- Legend is **optional** -- LLM can decode ADN without legend.
- Legend MUST appear **before** `ⓜ`, never inside the envelope.
- `buildHeader(adn)` auto-detects markers present -- no noise.
- If no ADN markers in payload, no legend is sent.
- Header is generated **once per payload**, not repeated per stream chunk.
- Use `encodeMZ(data, ENC_HEADER)` from `@pakakas/imzhao` — do not call `addInlineDecoder` directly.
- Protocol constants: `PROTO_START` / `PROTO_END` in `pakakas/markzero/src/markzero.ts`.

---
*MarkZero Protocol Specification -- June 5, 2026*
