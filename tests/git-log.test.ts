import { test, expect } from "bun:test";
import { decode, encode } from "../src";

test("Git Log --name-only Use Case (Nested 1D Arrays)", () => {
  const gitLogData = [
    {
      commit: "8d8a1a8feb4d5e0f4f879777852f05bb3ec8b337",
      author: "hyuze",
      message: "feat: implement optional titles",
      files: [
        "skills/pakakas/SKILL.md",
        "src/index.ts",
        "src/pap/decode.ts"
      ]
    },
    {
      commit: "5381aa755738fdf22b4faf556adfc0d5702dda7d",
      author: "hyuze",
      message: "feat: implement modular PAP v1",
      files: [
        "src/pap.ts",
        "src/pap/util.ts"
      ]
    }
  ];

  // Encode the data
  const encoded = encode(gitLogData);
  console.log("\nEncoded Git Log MarkZero:");
  console.log(encoded);

  // Decode the data
  const decodedBlocks = decode(encoded);
  const commits = decodedBlocks[0]; // Main block is the first block of the decoded results

  // Validation
  expect(commits.length).toBe(2);
  expect(commits[0].commit).toBe("8d8a1a8feb4d5e0f4f879777852f05bb3ec8b337");
  
  // Checking the nested 'files' array
  const firstFiles = commits[0].files; // Relational flat referencing resolves directly to the actual array of files
  console.log("\nDecoded 'files' for first commit:");
  console.log(JSON.stringify(firstFiles));

  // Verify it's a 1D array of strings
  expect(Array.isArray(firstFiles)).toBe(true);
  expect(firstFiles.length).toBe(3);
  expect(firstFiles[0]).toBe("skills/pakakas/SKILL.md");
});
