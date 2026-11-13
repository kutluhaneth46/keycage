export type Policy = {
  name: string;
  perTxMaxNear: number;
  dailyBudgetNear: number;
  gasAllowanceNear: number;
  allowReceivers: string[];
  allowMethods: string[];
  windowStartIso: string;
};

export type SpendAttempt = {
  id: string;
  label: string;
  receiverId: string;
  methodName: string;
  amountNear: number;
  gasNear: number;
  atIso: string;
};

export type Decision =
  | {
      ok: true;
      code: "ALLOWED";
      reason: string;
      remainingDailyNear: number;
      remainingGasNear: number;
    }
  | {
      ok: false;
      code:
        | "RECEIVER_DENIED"
        | "METHOD_DENIED"
        | "PER_TX_CAP"
        | "DAILY_CAP"
        | "GAS_ALLOWANCE";
      reason: string;
      remainingDailyNear: number;
      remainingGasNear: number;
    };

export type LedgerEntry = {
  attempt: SpendAttempt;
  decision: Decision;
};

export type CageState = {
  policy: Policy;
  spentTodayNear: number;
  gasUsedNear: number;
  ledger: LedgerEntry[];
};

export function createDefaultPolicy(): Policy {
  return {
    name: "Treasury agent fence",
    perTxMaxNear: 5,
    dailyBudgetNear: 10,
    gasAllowanceNear: 2,
    allowReceivers: [
      "payroll.demo.near",
      "invoices.demo.near",
      "vendor.acme.near",
    ],
    allowMethods: ["pay_invoice", "run_payroll", "transfer_stable"],
    windowStartIso: startOfUtcDay(new Date()).toISOString(),
  };
}

export function createCage(policy: Policy = createDefaultPolicy()): CageState {
  return {
    policy: normalizePolicy(policy),
    spentTodayNear: 0,
    gasUsedNear: 0,
    ledger: [],
  };
}

export function normalizePolicy(policy: Policy): Policy {
  return {
    ...policy,
    name: policy.name.trim() || "Untitled fence",
    perTxMaxNear: clampMoney(policy.perTxMaxNear),
    dailyBudgetNear: clampMoney(policy.dailyBudgetNear),
    gasAllowanceNear: clampMoney(policy.gasAllowanceNear),
    allowReceivers: uniqueLower(policy.allowReceivers),
    allowMethods: uniqueLower(policy.allowMethods),
    windowStartIso: policy.windowStartIso || startOfUtcDay(new Date()).toISOString(),
  };
}

export function evaluateAttempt(
  cage: CageState,
  attempt: SpendAttempt,
): Decision {
  const policy = cage.policy;
  const remainingDaily = round2(policy.dailyBudgetNear - cage.spentTodayNear);
  const remainingGas = round2(policy.gasAllowanceNear - cage.gasUsedNear);
  const receiver = attempt.receiverId.trim().toLowerCase();
  const method = attempt.methodName.trim().toLowerCase();

  if (!policy.allowReceivers.includes(receiver)) {
    return {
      ok: false,
      code: "RECEIVER_DENIED",
      reason: `${receiver} is outside the allowlist. A function call key can name only one approved receiver contract.`,
      remainingDailyNear: remainingDaily,
      remainingGasNear: remainingGas,
    };
  }

  if (!policy.allowMethods.includes(method)) {
    return {
      ok: false,
      code: "METHOD_DENIED",
      reason: `${method} is not on the allowed method list for this cage.`,
      remainingDailyNear: remainingDaily,
      remainingGasNear: remainingGas,
    };
  }

  if (attempt.amountNear > policy.perTxMaxNear) {
    return {
      ok: false,
      code: "PER_TX_CAP",
      reason: `Amount ${fmt(attempt.amountNear)} N is over the transaction cap of ${fmt(policy.perTxMaxNear)} N.`,
      remainingDailyNear: remainingDaily,
      remainingGasNear: remainingGas,
    };
  }

  if (attempt.amountNear > remainingDaily) {
    return {
      ok: false,
      code: "DAILY_CAP",
      reason: `Amount ${fmt(attempt.amountNear)} N would break the daily budget. Left today: ${fmt(remainingDaily)} N.`,
      remainingDailyNear: remainingDaily,
      remainingGasNear: remainingGas,
    };
  }

  if (attempt.gasNear > remainingGas) {
    return {
      ok: false,
      code: "GAS_ALLOWANCE",
      reason: `Gas ${fmt(attempt.gasNear)} N is over the remaining function call allowance of ${fmt(remainingGas)} N.`,
      remainingDailyNear: remainingDaily,
      remainingGasNear: remainingGas,
    };
  }

  return {
    ok: true,
    code: "ALLOWED",
    reason: "The receiver, the method, the transaction cap, the daily budget, and the gas allowance all pass.",
    remainingDailyNear: round2(remainingDaily - attempt.amountNear),
    remainingGasNear: round2(remainingGas - attempt.gasNear),
  };
}

export function applyAttempt(cage: CageState, attempt: SpendAttempt): CageState {
  const decision = evaluateAttempt(cage, attempt);
  const next: CageState = {
    ...cage,
    ledger: [{ attempt, decision }, ...cage.ledger].slice(0, 40),
  };

  if (!decision.ok) return next;

  return {
    ...next,
    spentTodayNear: round2(cage.spentTodayNear + attempt.amountNear),
    gasUsedNear: round2(cage.gasUsedNear + attempt.gasNear),
  };
}

export function resetWindow(cage: CageState): CageState {
  return {
    ...cage,
    spentTodayNear: 0,
    gasUsedNear: 0,
    policy: {
      ...cage.policy,
      windowStartIso: startOfUtcDay(new Date()).toISOString(),
    },
    ledger: [],
  };
}

/** Maps the product fence to a NEAR AddKey FunctionCallPermission shape. */
export function toNearAccessKeyDraft(policy: Policy) {
  return {
    access_key: {
      nonce: 0,
      permission: {
        FunctionCall: {
          allowance: nearToYocto(policy.gasAllowanceNear),
          receiver_id: policy.allowReceivers[0] ?? "policy.keycage.near",
          method_names: policy.allowMethods,
        },
      },
    },
    product_notes: {
      why_single_receiver:
        "A NEAR function call key binds to one receiver_id. I put a PolicyVault contract in that slot for KeyCage. The vault enforces the receiver allowlist and the daily caps.",
      per_tx_and_daily:
        "A protocol key does not encode a transaction cap or a daily spend cap. Those values live in PolicyVault storage. I check them before every payout.",
      gas_allowance:
        "allowance is the NEAR the key may burn on gas and fees. When it hits zero the key is dead until I issue a fresh key.",
    },
  };
}

export function attackSuite(): SpendAttempt[] {
  const now = Date.now();
  return [
    {
      id: `atk-${now}-1`,
      label: "Normal invoice pay",
      receiverId: "invoices.demo.near",
      methodName: "pay_invoice",
      amountNear: 2.5,
      gasNear: 0.05,
      atIso: new Date(now).toISOString(),
    },
    {
      id: `atk-${now}-2`,
      label: "Drain to unknown wallet",
      receiverId: "attacker.near",
      methodName: "pay_invoice",
      amountNear: 1,
      gasNear: 0.05,
      atIso: new Date(now + 1).toISOString(),
    },
    {
      id: `atk-${now}-3`,
      label: "Forbidden method",
      receiverId: "payroll.demo.near",
      methodName: "delete_account",
      amountNear: 0.1,
      gasNear: 0.05,
      atIso: new Date(now + 2).toISOString(),
    },
    {
      id: `atk-${now}-4`,
      label: "Over per-tx cap",
      receiverId: "vendor.acme.near",
      methodName: "transfer_stable",
      amountNear: 12,
      gasNear: 0.05,
      atIso: new Date(now + 3).toISOString(),
    },
    {
      id: `atk-${now}-5`,
      label: "Second payroll (still in budget)",
      receiverId: "payroll.demo.near",
      methodName: "run_payroll",
      amountNear: 4,
      gasNear: 0.08,
      atIso: new Date(now + 4).toISOString(),
    },
    {
      id: `atk-${now}-6`,
      label: "Blow daily budget",
      receiverId: "vendor.acme.near",
      methodName: "transfer_stable",
      amountNear: 5,
      gasNear: 0.05,
      atIso: new Date(now + 5).toISOString(),
    },
  ];
}

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function uniqueLower(values: string[]) {
  return [...new Set(values.map((v) => v.trim().toLowerCase()).filter(Boolean))];
}

function clampMoney(n: number) {
  if (!Number.isFinite(n) || n < 0) return 0;
  return round2(n);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function fmt(n: number) {
  return n.toFixed(2);
}

function nearToYocto(near: number) {
  // Display helper only; not for signing txs.
  const whole = BigInt(Math.floor(near));
  const frac = BigInt(Math.round((near % 1) * 1e5));
  const yoctoPerNear = BigInt("1000000000000000000000000");
  const fracScale = BigInt("10000000000000000000");
  return (whole * yoctoPerNear + frac * fracScale).toString();
}
