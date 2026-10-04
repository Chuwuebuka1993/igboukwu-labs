import test from "node:test";
import assert from "node:assert/strict";
import { scoreAcb001Foundation } from "./acb001.js";

test("ACB-001 foundation score is bounded and componentized", () => {
  const result = scoreAcb001Foundation({
    deterministicIdentity: true,
    queueOrdering: true,
    queueImmutability: true,
    inputValidation: true,
    evidenceHonesty: true,
    statusModel: true,
  });

  assert.equal(result.maxScore, 100);
  assert.equal(result.score, 100);
  assert.equal(result.verified, false);
  assert.equal(result.components.length, 6);
});

test("ACB-001 foundation score does not award unsupported capabilities", () => {
  const result = scoreAcb001Foundation({
    deterministicIdentity: true,
    queueOrdering: true,
    queueImmutability: false,
    inputValidation: true,
    evidenceHonesty: true,
    statusModel: true,
  });

  assert.equal(result.score, 85);
  assert.equal(result.verified, false);
});