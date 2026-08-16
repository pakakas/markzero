import { test, expect, describe } from "bun:test";
import { encode } from "../src/adn/encode";
import { decode } from "../src/adn/decode";
import { ENC_VALUES, ENC_INTERN_FIRST, ENC_INTERN_LAST } from "../src/index";

describe("Intern Pool Placement (INTERN_LAST & INTERN_FIRST)", () => {
  test("encode produces INTERN_LAST payload by default (Grid first, Pool at rear)", () => {
    const data = {
      role: "administrator_role_privilege",
      status: "administrator_role_privilege",
      type: "administrator_role_privilege"
    };
    const encoded = encode(data, ENC_VALUES);
    // Grid (░) starts at position 0, pool (·) is at the rear
    expect(encoded.startsWith("░")).toBe(true);
    expect(encoded.includes("·administrator_role_privilege")).toBe(true);
  });

  test("encode produces INTERN_FIRST payload when ENC_INTERN_FIRST is set", () => {
    const data = {
      role: "administrator_role_privilege",
      status: "administrator_role_privilege",
      type: "administrator_role_privilege"
    };
    const encoded = encode(data, ENC_VALUES | ENC_INTERN_FIRST);
    // Pool (·) starts at position 0
    expect(encoded.startsWith("·administrator_role_privilege")).toBe(true);
  });

  test("decode seamlessly parses INTERN_LAST payload (Rear Pool)", () => {
    const rawRearPool = "░→role≡¤0→status≡¤0→type≡¤0·admin";
    const decoded = decode(rawRearPool);
    expect(decoded).toEqual([{ role: "admin", status: "admin", type: "admin" }]);
  });

  test("decode seamlessly parses INTERN_FIRST payload (Top Pool)", () => {
    const rawTopPool = "·admin░→role≡¤0→status≡¤0→type≡¤0";
    const decoded = decode(rawTopPool);
    expect(decoded[decoded.length - 1]).toEqual({ role: "admin", status: "admin", type: "admin" });
  });
});
