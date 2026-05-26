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
  // Expected behavior: 'files' property will be encoded as a 1D Set and recovered as a clean array of strings
  const encoded = encode(gitLogData);
  console.log("\nEncoded Git Log MarkZero:");
  console.log(encoded);

  // Decode the data
  const decodedBlocks = decode(encoded);
  const commits = decodedBlocks[0]; // First block is the grid of commits

  // Validation
  expect(commits.length).toBe(2);
  expect(commits[0].commit).toBe("8d8a1a8feb4d5e0f4f879777852f05bb3ec8b337");
  
  // Checking the nested 'files' array
  const firstFiles = commits[0].files[0]; // Nested MarkZero string decodes to an array of blocks
  console.log("\nDecoded 'files' for first commit:");
  console.log(JSON.stringify(firstFiles));

  // Verify it's a 1D array of strings
  expect(Array.isArray(firstFiles)).toBe(true);
  expect(firstFiles.length).toBe(3);
  expect(firstFiles[0]).toBe("skills/pakakas/SKILL.md");
});
