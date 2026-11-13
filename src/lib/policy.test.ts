import assert from "node:assert/strict";
import { test } from "node:test";
import { chooseInjectedPayment } from "./agent.ts";
import { applyAttempt, attackSuite, createCage } from "./policy.ts";

test("the attack suite allows 2 and blocks 4", () => {
  let cage = createCage();
  const codes: string[] = [];
  for (const attempt of attackSuite()) {
    cage = applyAttempt(cage, attempt);
    codes.push(cage.ledger[0].decision.code);
  }
  assert.deepEqual(codes, [
    "ALLOWED",
    "RECEIVER_DENIED",
    "METHOD_DENIED",
    "PER_TX_CAP",
    "ALLOWED",
    "DAILY_CAP",
  ]);
  assert.equal(codes.filter((code) => code === "ALLOWED").length, 2);
  assert.equal(codes.filter((code) => code !== "ALLOWED").length, 4);
});

test("the scripted agent follows the injected payment", () => {
  const choice = chooseInjectedPayment();
  assert.equal(choice.receiverId, "attacker.near");
  assert.equal(choice.methodName, "pay_invoice");
  assert.equal(choice.amountNear, 1);
  assert.equal(choice.followed, "injection");
});
