# MarkZero v1 - Benchmark Report

*Generated automatically on: 6/2/2026, 12:16:27 AM*

## 1. Cross-Language Stack Traces
Comparison of stack trace formats across different languages. Formats are sorted from **Winner** (Top) to **Worst** (Bottom). Gain (%) is relative to the **Worst** format in each group.

### Zig Stack Trace

<details>
<summary><b>Click to view Raw Stack Trace</b></summary>
<br>
<pre><b>Raw STDERR</b><code>/src/main.zig:10:5: 0x103456 in main
    try secondFunction();
    ^
/src/main.zig:20:9: 0x103789 in secondFunction
    return error.FileNotFound;
    ^</code></pre>
<pre><b>JSON</b><code>[
  {
    "loc": "/src/main.zig:10:5",
    "func": "main",
    "msg": "try secondFunction()"
  },
  {
    "loc": "/src/main.zig:20:9",
    "func": "secondFunction",
    "msg": "return error.FileNotFound"
  }
]</code></pre>
<pre><b>TOON</b><code>[2]{loc,func,msg}:
  "/src/main.zig:10:5",main,try secondFunction()
  "/src/main.zig:20:9",secondFunction,return error.FileNotFound</code></pre>
<pre><b>MarkZero</b><code>RAW:
ⓖᴄloc¦func¦msgʀ/src/main.zig:10:5¦main¦try secondFunction()ʀ/src/main.zig:20:9¦secondFunction¦return error.FileNotFoundⓩ
<br>PRETTY:
ⓜ
ⓖ ᴄ loc                ¦ func           ¦ msg
   ʀ /src/main.zig:10:5 ¦ main           ¦ try secondFunction()
   ʀ /src/main.zig:20:9 ¦ secondFunction ¦ return error.FileNotFoundⓩ
</code></pre>
</details>

| Format | Token Count | Efficiency Gain |
| :--- | :---: | :---: |
| **TOON** | **45T** | +13.5% |
| MarkZero (No interning) | 49T | +5.8% |
| MarkZero (Value interning) | 49T | +5.8% |
| MarkZero (Full interning) | 49T | +5.8% |
| JSON (DoD) | 50T | +3.8% |
| JSON (Minified) | 51T | +1.9% |
| ASCII (Stderr) | 52T | WORST (BASE) |
| Markdown | 52T | WORST (BASE) |

### PHP Stack Trace

<details>
<summary><b>Click to view Raw Stack Trace</b></summary>
<br>
<pre><b>Raw STDERR</b><code>Fatal error: Uncaught Exception in /app/index.php:5
Stack trace:
#0 /app/index.php(5): divide(10, 0)
#1 /app/server.php(120): handleRequest('GET', '/')
#2 {main}</code></pre>
<pre><b>JSON</b><code>[
  {
    "id": 0,
    "loc": "/app/index.php:5",
    "call": "divide(10, 0)"
  },
  {
    "id": 1,
    "loc": "/app/server.php:120",
    "call": "handleRequest('GET', '/')"
  },
  {
    "id": 2,
    "loc": "{main}",
    "call": ""
  }
]</code></pre>
<pre><b>TOON</b><code>[3]{id,loc,call}:
  "0","/app/index.php:5","divide(10, 0)"
  "1","/app/server.php:120","handleRequest('GET', '/')"
  "2","{main}",""</code></pre>
<pre><b>MarkZero</b><code>RAW:
ⓖᴄid¦loc¦callʀ0¦/app/index.php:5¦divide(10, 0)ʀ1¦/app/server.php:120¦handleRequest('GET', '/')ʀ2¦{main}¦ⓩ
<br>PRETTY:
ⓜ
ⓖ ᴄ id ¦ loc                 ¦ call
   ʀ 0  ¦ /app/index.php:5    ¦ divide(10, 0)
   ʀ 1  ¦ /app/server.php:120 ¦ handleRequest('GET', '/')
   ʀ 2  ¦ {main}              ¦ ⓩ
</code></pre>
</details>

| Format | Token Count | Efficiency Gain |
| :--- | :---: | :---: |
| **JSON (DoD)** | **53T** | +13.1% |
| ASCII (Stderr) | 54T | +11.5% |
| TOON | 55T | +9.8% |
| MarkZero (No interning) | 56T | +8.2% |
| MarkZero (Value interning) | 56T | +8.2% |
| MarkZero (Full interning) | 56T | +8.2% |
| JSON (Minified) | 61T | WORST (BASE) |
| Markdown | 61T | WORST (BASE) |

### Rust Stack Trace

<details>
<summary><b>Click to view Raw Stack Trace</b></summary>
<br>
<pre><b>Raw STDERR</b><code>stack backtrace:
   0: rust_begin_unwind
             at src/libstd/panicking.rs:35
   1: core::panicking::panic_fmt
             at src/libcore/panicking.rs:12
   2: my_app::main
             at src/main.rs:5</code></pre>
<pre><b>JSON</b><code>[
  {
    "frame": 0,
    "func": "rust_begin_unwind",
    "loc": "src/libstd/panicking.rs:35"
  },
  {
    "frame": 1,
    "func": "core::panicking::panic_fmt",
    "loc": "src/libcore/panicking.rs:12"
  },
  {
    "frame": 2,
    "func": "my_app::main",
    "loc": "src/main.rs:5"
  }
]</code></pre>
<pre><b>TOON</b><code>[3]{frame,func,loc}:
  "0",rust_begin_unwind,"src/libstd/panicking.rs:35"
  "1","core::panicking::panic_fmt","src/libcore/panicking.rs:12"
  "2","my_app::main","src/main.rs:5"</code></pre>
<pre><b>MarkZero</b><code>RAW:
ⓖᴄframe¦func¦locʀ0¦rust_begin_unwind¦src/libstd/panicking.rs:35ʀ1¦core::panicking::panic_fmt¦src/libcore/panicking.rs:12ʀ2¦my_app::main¦src/main.rs:5ⓩ
<br>PRETTY:
ⓜ
ⓖ ᴄ frame ¦ func                       ¦ loc
   ʀ 0     ¦ rust_begin_unwind          ¦ src/libstd/panicking.rs:35
   ʀ 1     ¦ core::panicking::panic_fmt ¦ src/libcore/panicking.rs:12
   ʀ 2     ¦ my_app::main               ¦ src/main.rs:5ⓩ
</code></pre>
</details>

| Format | Token Count | Efficiency Gain |
| :--- | :---: | :---: |
| **JSON (DoD)** | **63T** | +11.3% |
| ASCII (Stderr) | 65T | +8.5% |
| MarkZero (No interning) | 66T | +7.0% |
| MarkZero (Value interning) | 66T | +7.0% |
| MarkZero (Full interning) | 66T | +7.0% |
| TOON | 66T | +7.0% |
| Markdown | 70T | +1.4% |
| JSON (Minified) | 71T | WORST (BASE) |

### TypeScript Stack Trace

<details>
<summary><b>Click to view Raw Stack Trace</b></summary>
<br>
<pre><b>Raw STDERR</b><code>Error: Something went wrong
    at Object.<anonymous> (/work/project/src/services/user.service.ts:12:5)
    at Module._compile (node:internal/modules/cjs/loader:1101:14)
    at Object.Module._extensions..js (node:internal/modules/cjs/loader:1130:10)</code></pre>
<pre><b>JSON</b><code>[
  {
    "func": "Object.<anonymous>",
    "loc": "/work/project/src/services/user.service.ts:12:5"
  },
  {
    "func": "Module._compile",
    "loc": "node:internal/modules/cjs/loader:1101:14"
  },
  {
    "func": "Object.Module._extensions..js",
    "loc": "node:internal/modules/cjs/loader:1130:10"
  }
]</code></pre>
<pre><b>TOON</b><code>[3]{func,loc}:
  Object.<anonymous>,"/work/project/src/services/user.service.ts:12:5"
  Module._compile,"node:internal/modules/cjs/loader:1101:14"
  Object.Module._extensions..js,"node:internal/modules/cjs/loader:1130:10"</code></pre>
<pre><b>MarkZero</b><code>RAW:
ⓖᴄfunc¦locʀObject.<anonymous>¦/work/project/src/services/user.service.ts:12:5ʀModule._compile¦node:internal/modules/cjs/loader:1101:14ʀObject.Module._extensions..js¦node:internal/modules/cjs/loader:1130:10ⓩ
<br>PRETTY:
ⓜ
ⓖ ᴄ func                          ¦ loc
   ʀ Object.<anonymous>            ¦ /work/project/src/services/user.service.ts:12:5
   ʀ Module._compile               ¦ node:internal/modules/cjs/loader:1101:14
   ʀ Object.Module._extensions..js ¦ node:internal/modules/cjs/loader:1130:10ⓩ
</code></pre>
</details>

| Format | Token Count | Efficiency Gain |
| :--- | :---: | :---: |
| **ASCII (Stderr)** | **68T** | +5.6% |
| JSON (DoD) | 68T | +5.6% |
| TOON | 68T | +5.6% |
| Markdown | 70T | +2.8% |
| MarkZero (No interning) | 71T | +1.4% |
| MarkZero (Value interning) | 71T | +1.4% |
| MarkZero (Full interning) | 71T | +1.4% |
| JSON (Minified) | 72T | WORST (BASE) |

### Go Stack Trace

<details>
<summary><b>Click to view Raw Stack Trace</b></summary>
<br>
<pre><b>Raw STDERR</b><code>panic: runtime error: index out of range
goroutine 1 [running]:
main.main()
    /app/main.go:15 +0x25
runtime.main()
    /app/runtime.go:200 +0x112</code></pre>
<pre><b>JSON</b><code>{
  "panic": "runtime error: index out of range",
  "goroutine": 1,
  "state": "running",
  "stack": [
    {
      "func": "main.main",
      "loc": "/app/main.go:15",
      "pc": "0x25"
    },
    {
      "func": "runtime.main",
      "loc": "/app/runtime.go:200",
      "pc": "0x112"
    }
  ]
}</code></pre>
<pre><b>TOON</b><code>panic: "runtime error: index out of range"
goroutine: "1"
state: running
stack:
  [2]{func,loc,pc}:
    main.main,"/app/main.go:15","0x25"
    runtime.main,"/app/runtime.go:200","0x112"</code></pre>
<pre><b>MarkZero</b><code>RAW:
ⓖᴄfunc¦loc¦pcʀmain.main¦/app/main.go:15¦0x25ʀruntime.main¦/app/runtime.go:200¦0x112ⓩⓖʀpanic→runtime error: index out of rangeʀgoroutine→1ʀstate→runningʀstack→※0ⓩ
<br>PRETTY:
ⓜ
ⓖ ᴄ func         ¦ loc                 ¦ pc
   ʀ main.main    ¦ /app/main.go:15     ¦ 0x25
   ʀ runtime.main ¦ /app/runtime.go:200 ¦ 0x112ⓩ
ⓖ ʀ panic     → runtime error: index out of range
   ʀ goroutine → 1
   ʀ state     → running
   ʀ stack     → ※0ⓩ
</code></pre>
</details>

| Format | Token Count | Efficiency Gain |
| :--- | :---: | :---: |
| **Markdown** | **41T** | +45.3% |
| ASCII (Stderr) | 46T | +38.7% |
| JSON (Minified) | 64T | +14.7% |
| JSON (DoD) | 64T | +14.7% |
| TOON | 64T | +14.7% |
| MarkZero (No interning) | 75T | WORST (BASE) |
| MarkZero (Value interning) | 75T | WORST (BASE) |
| MarkZero (Full interning) | 75T | WORST (BASE) |

### Zero Official Diagnostic Stack Trace

<details>
<summary><b>Click to view Raw Stack Trace</b></summary>
<br>
<pre><b>Raw STDERR</b><code>NAM003: Undeclared identifier 'count' at src/main.0:124
Repair: REP_ADD_LET</code></pre>
<pre><b>JSON</b><code>[
  {
    "code": "NAM003",
    "message": "Undeclared identifier 'count'",
    "node_id": "ast_node_592",
    "location": {
      "file": "src/main.0",
      "span": [
        124,
        129
      ]
    },
    "repair": {
      "repair_id": "REP_ADD_LET",
      "actions": [
        {
          "type": "insert",
          "pos": 124,
          "text": "let "
        }
      ]
    }
  }
]</code></pre>
<pre><b>TOON</b><code>[1]{code,message,node_id,location,repair}:
  NAM003,Undeclared identifier 'count',ast_node_592,[Complex],[Complex]</code></pre>
<pre><b>MarkZero</b><code>RAW:
ⓖ124ʀ129ⓩⓖʀfile→src/main.0ʀspan→※0ⓩⓖᴄtype¦pos¦textʀinsert¦124¦let ⓩⓖʀrepair_id→REP_ADD_LETʀactions→※2ⓩⓖᴄcode¦message¦node_id¦location¦repairʀNAM003¦Undeclared identifier 'count'¦ast_node_592¦※1¦※3ⓩ
<br>PRETTY:
ⓜ
ⓖ ʀ 124
   ʀ 129ⓩ
ⓖ ʀ file → src/main.0
   ʀ span → ※0ⓩ
ⓖ ᴄ type   ¦ pos ¦ text
   ʀ insert ¦ 124 ¦ let ⓩ
ⓖ ʀ repair_id → REP_ADD_LET
   ʀ actions   → ※2ⓩ
ⓖ ᴄ code   ¦ message                       ¦ node_id      ¦ location ¦ repair
   ʀ NAM003 ¦ Undeclared identifier 'count' ¦ ast_node_592 ¦ ※1       ¦ ※3ⓩ
</code></pre>
</details>

| Format | Token Count | Efficiency Gain |
| :--- | :---: | :---: |
| **ASCII (Stderr)** | **24T** | +77.1% |
| TOON | 33T | +68.6% |
| Markdown | 50T | +52.4% |
| JSON (Minified) | 69T | +34.3% |
| JSON (DoD) | 76T | +27.6% |
| MarkZero (No interning) | 105T | WORST (BASE) |
| MarkZero (Value interning) | 105T | WORST (BASE) |
| MarkZero (Full interning) | 105T | WORST (BASE) |

### Bun (with Context) Stack Trace

<details>
<summary><b>Click to view Raw Stack Trace</b></summary>
<br>
<pre><b>Raw STDERR</b><code>TypeError: undefined is not an object (evaluating 'decodedRows.map')
      at /work/src/pap/decode.ts:114:26
      112 |         // Mode: Explicit Headers
      113 |         const headers = cellsOfFirstRow.map(resolve);
    > 114 |         const decodedRows = rows.map(row => {
          |                          ^
      115 |           const cells = row.split(ITEM_SEP);</code></pre>
<pre><b>JSON</b><code>[
  {
    "error": "TypeError: undefined is not an object (evaluating 'decodedRows.map')",
    "at": "/work/src/decode.ts:114:26",
    "context": [
      {
        "l": 112,
        "c": "// Mode: Explicit Headers"
      },
      {
        "l": 113,
        "c": "const headers = cellsOfFirstRow.map(resolve);"
      },
      {
        "l": 114,
        "c": "const decodedRows = rows.map(row => {",
        "active": true
      },
      {
        "l": 115,
        "c": "const cells = row.split(ITEM_SEP);"
      }
    ]
  }
]</code></pre>
<pre><b>TOON</b><code>[1]{error,at,context}:
  "TypeError: undefined is not an object (evaluating 'decodedRows.map')","/work/src/decode.ts:114:26",[Complex]</code></pre>
<pre><b>MarkZero</b><code>RAW:
ⓖᴄl¦c¦activeʀ112¦// Mode: Explicit Headers¦ʀ113¦const headers = cellsOfFirstRow.map(resolve);¦ʀ114¦const decodedRows = rows.map(row => {¦trueʀ115¦const cells = row.split(ITEM_SEP);¦ⓩⓖᴄerror¦at¦contextʀTypeError: undefined is not an object (evaluating 'decodedRows.map')¦/work/src/decode.ts:114:26¦※0ⓩ
<br>PRETTY:
ⓜ
ⓖ ᴄ l   ¦ c                                             ¦ active
   ʀ 112 ¦ // Mode: Explicit Headers                     ¦ 
   ʀ 113 ¦ const headers = cellsOfFirstRow.map(resolve); ¦ 
   ʀ 114 ¦ const decodedRows = rows.map(row => {         ¦ true
   ʀ 115 ¦ const cells = row.split(ITEM_SEP);            ¦ ⓩ
ⓖ ᴄ error                                                                ¦ at                         ¦ context
   ʀ TypeError: undefined is not an object (evaluating 'decodedRows.map') ¦ /work/src/decode.ts:114:26 ¦ ※0ⓩ
</code></pre>
</details>

| Format | Token Count | Efficiency Gain |
| :--- | :---: | :---: |
| **TOON** | **42T** | +62.2% |
| Markdown | 57T | +48.6% |
| ASCII (Stderr) | 91T | +18.0% |
| JSON (Minified) | 105T | +5.4% |
| JSON (DoD) | 111T | WORST (BASE) |
| MarkZero (No interning) | 111T | WORST (BASE) |
| MarkZero (Value interning) | 111T | WORST (BASE) |
| MarkZero (Full interning) | 111T | WORST (BASE) |

### Java (Long OOM) Stack Trace

<details>
<summary><b>Click to view Raw Stack Trace</b></summary>
<br>
<pre><b>Raw STDERR</b><code>Exception in thread "main" java.lang.OutOfMemoryError: Java heap space
    at java.base/java.util.Arrays.copyOf(Arrays.java:3512)
    at java.base/java.util.Arrays.copyOf(Arrays.java:3481)
    at java.base/java.util.ArrayList.grow(ArrayList.java:237)
    at java.base/java.util.ArrayList.grow(ArrayList.java:244)
    at java.base/java.util.ArrayList.add(ArrayList.java:454)
    at java.base/java.util.ArrayList.add(ArrayList.java:467)
    at com.example.app.DataProcessor.process(DataProcessor.java:120)
    at com.example.app.DataProcessor.start(DataProcessor.java:45)
    at com.example.app.Main.main(Main.java:20)</code></pre>
<pre><b>JSON</b><code>[
  {
    "class": "java.util.Arrays",
    "method": "copyOf",
    "file": "Arrays.java",
    "line": 3512
  },
  {
    "class": "java.util.Arrays",
    "method": "copyOf",
    "file": "Arrays.java",
    "line": 3481
  },
  {
    "class": "java.util.ArrayList",
    "method": "grow",
    "file": "ArrayList.java",
    "line": 237
  },
  {
    "class": "java.util.ArrayList",
    "method": "grow",
    "file": "ArrayList.java",
    "line": 244
  },
  {
    "class": "java.util.ArrayList",
    "method": "add",
    "file": "ArrayList.java",
    "line": 454
  },
  {
    "class": "java.util.ArrayList",
    "method": "add",
    "file": "ArrayList.java",
    "line": 467
  },
  {
    "class": "com.example.app.DataProcessor",
    "method": "process",
    "file": "DataProcessor.java",
    "line": 120
  },
  {
    "class": "com.example.app.DataProcessor",
    "method": "start",
    "file": "DataProcessor.java",
    "line": 45
  },
  {
    "class": "com.example.app.Main",
    "method": "main",
    "file": "Main.java",
    "line": 20
  }
]</code></pre>
<pre><b>TOON</b><code>[9]{class,method,file,line}:
  java.util.Arrays,copyOf,Arrays.java,"3512"
  java.util.Arrays,copyOf,Arrays.java,"3481"
  java.util.ArrayList,grow,ArrayList.java,"237"
  java.util.ArrayList,grow,ArrayList.java,"244"
  java.util.ArrayList,add,ArrayList.java,"454"
  java.util.ArrayList,add,ArrayList.java,"467"
  com.example.app.DataProcessor,process,DataProcessor.java,"120"
  com.example.app.DataProcessor,start,DataProcessor.java,"45"
  com.example.app.Main,main,Main.java,"20"</code></pre>
<pre><b>MarkZero</b><code>RAW:
·java.util.ArrayList·com.example.app.DataProcessorⓩⓖᴄclass¦method¦file¦lineʀjava.util.Arrays¦copyOf¦Arrays.java¦3512ʀjava.util.Arrays¦copyOf¦Arrays.java¦3481ʀ¤0¦grow¦ArrayList.java¦237ʀ¤0¦grow¦ArrayList.java¦244ʀ¤0¦add¦ArrayList.java¦454ʀ¤0¦add¦ArrayList.java¦467ʀ¤1¦process¦DataProcessor.java¦120ʀ¤1¦start¦DataProcessor.java¦45ʀcom.example.app.Main¦main¦Main.java¦20ⓩ
<br>PRETTY:
ⓜ
   · 0: java.util.ArrayList
   · 1: com.example.app.DataProcessorⓩ
ⓖ ᴄ class                ¦ method  ¦ file               ¦ line
   ʀ java.util.Arrays     ¦ copyOf  ¦ Arrays.java        ¦ 3512
   ʀ java.util.Arrays     ¦ copyOf  ¦ Arrays.java        ¦ 3481
   ʀ ¤0                   ¦ grow    ¦ ArrayList.java     ¦ 237
   ʀ ¤0                   ¦ grow    ¦ ArrayList.java     ¦ 244
   ʀ ¤0                   ¦ add     ¦ ArrayList.java     ¦ 454
   ʀ ¤0                   ¦ add     ¦ ArrayList.java     ¦ 467
   ʀ ¤1                   ¦ process ¦ DataProcessor.java ¦ 120
   ʀ ¤1                   ¦ start   ¦ DataProcessor.java ¦ 45
   ʀ com.example.app.Main ¦ main    ¦ Main.java          ¦ 20ⓩ
</code></pre>
</details>

| Format | Token Count | Efficiency Gain |
| :--- | :---: | :---: |
| **JSON (DoD)** | **134T** | +30.2% |
| TOON | 136T | +29.2% |
| MarkZero (Value interning) | 141T | +26.6% |
| MarkZero (Full interning) | 141T | +26.6% |
| MarkZero (No interning) | 142T | +26.0% |
| ASCII (Stderr) | 149T | +22.4% |
| Markdown | 154T | +19.8% |
| JSON (Minified) | 192T | WORST (BASE) |

### JavaScript (Nested Causes) Stack Trace

<details>
<summary><b>Click to view Raw Stack Trace</b></summary>
<br>
<pre><b>Raw STDERR</b><code>Error: Failed to fetch user profile
    at fetchUserProfile (/app/src/api.ts:120:5)
    at async loadData (/app/src/main.ts:45:10)
[cause]: Error: Connection timeout
    at Socket.onTimeout (node:net:950:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
[cause]: Error: ECONNREFUSED 127.0.0.1:5432
    at TCP.onStreamRead (node:internal/stream_base_commons:190:23)</code></pre>
<pre><b>JSON</b><code>{
  "error": "Failed to fetch user profile",
  "stack": [
    {
      "at": "fetchUserProfile",
      "file": "/app/src/api.ts",
      "line": "120:5"
    },
    {
      "at": "loadData",
      "file": "/app/src/main.ts",
      "line": "45:10"
    }
  ],
  "cause": {
    "error": "Connection timeout",
    "stack": [
      {
        "at": "Socket.onTimeout",
        "file": "node:net",
        "line": "950:12"
      },
      {
        "at": "process.processTicksAndRejections",
        "file": "node:internal/process/task_queues",
        "line": "95:5"
      }
    ],
    "cause": {
      "error": "ECONNREFUSED 127.0.0.1:5432",
      "stack": [
        {
          "at": "TCP.onStreamRead",
          "file": "node:internal/stream_base_commons",
          "line": "190:23"
        }
      ]
    }
  }
}</code></pre>
<pre><b>TOON</b><code>error: Failed to fetch user profile
stack:
  [2]{at,file,line}:
    fetchUserProfile,/app/src/api.ts,"120:5"
    loadData,/app/src/main.ts,"45:10"
cause:
    error: Connection timeout
  stack:
    [2]{at,file,line}:
      Socket.onTimeout,"node:net","950:12"
      process.processTicksAndRejections,"node:internal/process/task_queues","95:5"
  cause:
        error: "ECONNREFUSED 127.0.0.1:5432"
    stack:
      [1]{at,file,line}:
        TCP.onStreamRead,"node:internal/stream_base_commons","190:23"</code></pre>
<pre><b>MarkZero</b><code>RAW:
ⓖᴄat¦file¦lineʀfetchUserProfile¦/app/src/api.ts¦120:5ʀloadData¦/app/src/main.ts¦45:10ⓩⓖᴄat¦file¦lineʀSocket.onTimeout¦node:net¦950:12ʀprocess.processTicksAndRejections¦node:internal/process/task_queues¦95:5ⓩⓖᴄat¦file¦lineʀTCP.onStreamRead¦node:internal/stream_base_commons¦190:23ⓩⓖʀerror→ECONNREFUSED 127.0.0.1:5432ʀstack→※2ⓩⓖʀerror→Connection timeoutʀstack→※1ʀcause→※3ⓩⓖʀerror→Failed to fetch user profileʀstack→※0ʀcause→※4ⓩ
<br>PRETTY:
ⓜ
ⓖ ᴄ at               ¦ file             ¦ line
   ʀ fetchUserProfile ¦ /app/src/api.ts  ¦ 120:5
   ʀ loadData         ¦ /app/src/main.ts ¦ 45:10ⓩ
ⓖ ᴄ at                                ¦ file                              ¦ line
   ʀ Socket.onTimeout                  ¦ node:net                          ¦ 950:12
   ʀ process.processTicksAndRejections ¦ node:internal/process/task_queues ¦ 95:5ⓩ
ⓖ ᴄ at               ¦ file                              ¦ line
   ʀ TCP.onStreamRead ¦ node:internal/stream_base_commons ¦ 190:23ⓩ
ⓖ ʀ error → ECONNREFUSED 127.0.0.1:5432
   ʀ stack → ※2ⓩ
ⓖ ʀ error → Connection timeout
   ʀ stack → ※1
   ʀ cause → ※3ⓩ
ⓖ ʀ error → Failed to fetch user profile
   ʀ stack → ※0
   ʀ cause → ※4ⓩ
</code></pre>
</details>

| Format | Token Count | Efficiency Gain |
| :--- | :---: | :---: |
| **Markdown** | **32T** | +83.4% |
| ASCII (Stderr) | 122T | +36.8% |
| TOON | 154T | +20.2% |
| JSON (Minified) | 157T | +18.7% |
| JSON (DoD) | 157T | +18.7% |
| MarkZero (No interning) | 193T | WORST (BASE) |
| MarkZero (Value interning) | 193T | WORST (BASE) |
| MarkZero (Full interning) | 193T | WORST (BASE) |


## 2. Forensic Error Components

Sorted by MarkZero v1 efficiency (ascending). Gain (%) is relative to JSON standard.

| Component | **MarkZero v1 (Token)** | TOON (Token) | Markdown (Token) | JSON (Token) | Gain (vs JSON) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Code Snippets | **55** | 52 | 57 | 52 | -5.8% |
| Complexity Torture | **87** | 79 | 39 | 49 | -77.6% |
| Application State | **95** | 25 | 37 | 68 | -39.7% |
| Runtime Env | **124** | 132 | 142 | 150 | +17.3% |

## 3. Configuration Errors

Sorted by MarkZero v1 efficiency (ascending). Gain (%) is relative to JSON standard.

| System / Tool | **MarkZero v1 (Token)** | TOON (Token) | Markdown (Token) | ASCII (Stderr) (Token) | JSON (Token) | Gain (vs JSON) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Apache Error | **48** | 35 | 18 | 41 | 35 | -37.1% |
| Nginx Error | **54** | 37 | 16 | 25 | 40 | -35.0% |
