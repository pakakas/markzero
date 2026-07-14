# iMZHAO Specification (v1)

## Overview
**iMZHAO (MarkZero Hybrid AgentOps)** is the Agent Intermediate Representation (AIR) protocol for handling tool invocation, execution, and human-in-the-loop (HITL) workflows within LLM text streams.

> For data serialization, see **[ADN Specification](adn-spec-v1.en.md)**.
> For message envelope format, see **[MarkZero Protocol Specification](markzero-spec.en.md)**.

## 1. Scope

Agentic does **not** define data serialization (that's ADN) or message framing (that's MarkZero). It defines:

- **AIR Operational Markers** — agent orchestration primitives
- **HITL Protocol** — human approval flow for tool execution
- **Tool Calling Patterns** — single, parallel, sequential invocation

## 2. AIR Operational Markers

| Marker | Description |
| :---: | :--- |
| `τ` | Type annotation prefix — e.g. `τstr`, `τgrid`, `τnum` |
| `ⓘ` | Invoke marker — triggers tool execution |

These markers may appear in ADN payloads and are detected by `buildHeader()` in the MarkZero encoder.

## 3. Tool Calling Patterns

Tool calls are encoded as ADN grids with the `invoke` key. Three patterns:

### 3.1 Single Tool Call
One command, one row:
```
░→invoke≡CLI_SCRIPT
```
Decoded: `{ type: "invoke", commands: "CLI_SCRIPT" }`

### 3.2 Parallel Tool Calls
Multiple commands in one row (multi-cell):
```
░→invoke≡Script1¦Script2¦Script3
```
Decoded: `{ type: "invoke", commands: ["Script1", "Script2", "Script3"] }`

### 3.3 Sequential Tool Calls
Pipeline, multiple rows:
```
░→invoke≡Script1→Script2→Script3
```
Decoded: `{ type: "invoke", commands: ["Script1", "Script2", "Script3"] }`

## 4. HITL (Human-In-The-Loop) Protocol

A lightweight, exit-code-based HITL protocol for CLI tools. Agent tools communicate with tool developers via `--dry-run` flag; tools respond with HTTP-semantic exit codes.

### 4.1 Design Principles

1. **`--dry-run` = Maintenis protocol** — agent tool sends `--dry-run`, tool responds with exit code
2. **Exit codes = HTTP semantics** — mapping from HTTP status codes to 2-digit exit codes
3. **Tiered approval** — destructive tools require stricter confirmation even after "always allow"
4. **Backward compatible** — tools without HITL support return error, agent tool falls back to legacy behavior

### 4.2 `--dry-run` Flag

Agent tool **always** sends `--dry-run` before execute. Tool must respond:

```
Agent tool → tool cmd --dry-run → tool respond exit code → agent tool handle
```

| Argument | Meaning | Sent by |
|----------|---------|---------|
| `--dry-run` | Dry run, check approval | Agent tool (always first) |
| no `--dry-run` | Execute, already approved | Agent tool (after user approve) |

### 4.3 Exit Codes (HTTP Semantics)

| Exit Code | HTTP Analog | Constant | Meaning | Agent Tool Action |
|-----------|-------------|----------|---------|-------------------|
| `0` | 200 OK | `EXIT_SUCCESS` | Success | None (normal) |
| `1` | 400 Bad Request | `EXIT_ERROR` | Error | Report to user |
| `22` | 202 Accepted | `EXIT_ACCEPTED` | Needs approval (moderate) | Ask user once |
| `23` | 423 Locked | `EXIT_LOCKED` | Needs approval (destructive) | Ask + strict warning |
| `28` | 428 Precondition Required | `EXIT_PRECONDITION` | Needs approval (irreversible) | Ask + double confirmation |
| `43` | 403 Forbidden | `EXIT_FORBIDDEN` | Rejected by user | Report rejection |

### 4.4 Tiered Approval

```
┌─────────────────────────────────────────────────────────┐
│  Tier 1: Default (all tools)                            │
│  --dry-run → exit 22 → ASK user → approve/reject           │
│  User "always allow" → save to config                   │
├─────────────────────────────────────────────────────────┤
│  Tier 2: Destructive guard                              │
│  --dry-run → exit 23/28 → even if user already "always"    │
│  → ASK AGAIN with stricter warning                      │
│  = 2x alert before execute                              │
└─────────────────────────────────────────────────────────┘
```

### 4.5 Execution Modes

Agent tool supports 3 execution modes, configurable per user and per tool:

| Mode | Description | Config | `--dry-run` sent? |
|------|-------------|--------|----------------|
| **HITL** (default) | Full approval flow | none | Yes |
| **Always-allow** | Auto-approve, but Tier 2 still asks | `alwaysAllow: { tool: true }` | Yes |
| **YOLO** | Skip all warnings, execute immediately | `yolo: { tool: true }` | No |

**YOLO mode** = user takes full responsibility. No `--dry-run` sent, no exit code check, no approval. Execution is logged with `[YOLO]` tag for audit trail.

Config example (per user + per tool):
```json
{
  "alwaysAllow": { "cat": true, "ls": true },
  "yolo": { "destruktool": true }
}
```

### 4.6 Tool Developer Responsibilities

1. Implement `--dry-run` flag handler (dry run mode)
2. Check if command needs approval → respond with appropriate exit code
3. Output detail to stdout (any format: MZ, JSON, ASCII)
4. Without `--dry-run` = execute normally (already approved)
5. Document exit codes in `--help` output

### 4.7 Agent Tool Responsibilities

1. Always send `--dry-run` before execute
2. Read exit code → implement tiered approval logic
3. Persist "always allow" decisions to config
4. Enforce Tier 2 for destructive tools (exit 23/28)
5. Fall back to legacy behavior if tool doesn't support `--dry-run`

### 4.8 Backward Compatibility

Deployed tools may not support `--dry-run`. Agent tool must handle:

```
Agent tool sends: tool cmd --dry-run
    │
    ├─ Tool responds exit 22/23/28 → HITL SUPPORTED → tiered approval
    │
    └─ Tool responds error "unknown option" → LEGACY → legacy behavior (ask once)
```

| Tool | Response | Agent tool behavior |
|------|----------|-------------------|
| `cat` (HITL) | exit 0 | Auto-approve (safe) |
| `destruktool` (HITL) | exit 28 | Tiered approval |
| `old-tool` (legacy) | "unknown option" | Ask once, then "always" |

---
*Official iMZHAO Specification — updated July 14, 2026*
