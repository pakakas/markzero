#!/usr/bin/env bun
import { encode, ENC_VALUES, ENC_INTERN_ALL } from "./src/index";

const data = {
  type: "error_chain",
  depth: 4,
  error: {
    name: "DatabaseQueryError",
    message: "Failed to execute query 'SELECT * FROM users WHERE id = ?'",
    code: "DB_QUERY_FAILED",
    location: { file: "src/db/query.js", line: 45, col: 12 },
    cause: {
      name: "ConnectionPoolError",
      message: "Connection pool exhausted (active: 50/50, waiting: 23)",
      code: "POOL_EXHAUSTED",
      location: { file: "src/db/pool.js", line: 112, col: 8 },
      cause: {
        name: "NetworkTimeoutError",
        message: "TCP connection to db.internal.prod:5432 timed out after 30000ms",
        code: "NET_TIMEOUT",
        location: { file: "src/net/socket.js", line: 78, col: 15 },
        cause: {
          name: "DNSError",
          message: "getaddrinfo ENOTFOUND db.internal.prod",
          code: "ENOTFOUND",
          location: { file: "src/net/dns.js", line: 23, col: 5 }
        }
      }
    }
  }
};

const internValues = encode(data, ENC_VALUES);
const internAll = encode(data, ENC_INTERN_ALL);

const outDir = "pakakas/imzhao/benchmark/scenarios/js-nested-cause/payloads";

await Bun.write(`${outDir}/mz-intern-values.txt`, internValues);
await Bun.write(`${outDir}/mz-intern-all.txt`, internAll);

console.log("=== ENC_INTERN_VALUES ===");
console.log(internValues);
console.log("\n=== ENC_INTERN_ALL ===");
console.log(internAll);
console.log("\n✅ Payloads generated!");
