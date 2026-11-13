import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Account, JsonRpcProvider, KeyPair, actions } from "near-api-js";

const { functionCall, transfer } = actions;

const RPC = "https://rpc.testnet.near.org";
const HELPER = "https://helper.testnet.near.org/account";
const DIR = "/tmp/keycage-near";
const WASM = new URL("./policy-vault/target/wasm32-unknown-unknown/release/policy_vault.wasm", import.meta.url);

const provider = new JsonRpcProvider({ url: RPC });

function yocto(near) {
  const [whole, frac = ""] = String(near).split(".");
  const padded = `${frac}000000000000000000000000`.slice(0, 24);
  return (BigInt(whole) * 10n ** 24n + BigInt(padded)).toString();
}

function saveKey(name) {
  const pair = KeyPair.fromRandom("ed25519");
  const record = {
    accountId: "",
    secret: pair.toString(),
    publicKey: pair.getPublicKey().toString(),
  };
  writeFileSync(`${DIR}/${name}.json`, JSON.stringify(record, null, 2));
  return record;
}

function loadKey(name) {
  return JSON.parse(readFileSync(`${DIR}/${name}.json`, "utf8"));
}

async function createAccount(name) {
  const record = saveKey(name);
  const suffix = Math.random().toString(36).slice(2, 8);
  const accountId = `kc${name}${suffix}.testnet`;
  const response = await fetch(HELPER, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      newAccountId: accountId,
      newAccountPublicKey: record.publicKey,
    }),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`faucet ${name} ${response.status} ${text}`);
  }
  record.accountId = accountId;
  writeFileSync(`${DIR}/${name}.json`, JSON.stringify(record, null, 2));
  console.log("created", accountId, text.slice(0, 180));
  return record;
}

function account(record) {
  return new Account(record.accountId, provider, record.secret);
}

function txHash(result) {
  return result?.transaction?.hash || result?.transaction_outcome?.id || "";
}

function failureText(result) {
  return JSON.stringify(result?.status || result || "");
}

async function send(signer, methodName, args, gas = 100_000_000_000_000n) {
  const result = await signer.signAndSendTransaction({
    receiverId: loadKey("vault").accountId,
    actions: [functionCall(methodName, args, gas, 0n)],
    throwOnFailure: false,
    waitUntil: "FINAL",
  });
  return result;
}

mkdirSync(DIR, { recursive: true });

const owner = await createAccount("owner");
const vault = await createAccount("vault");
const invoice = await createAccount("invoice");
const payroll = await createAccount("payroll");
const vendor = await createAccount("vendor");

const vaultAccount = account(vault);
const state = await vaultAccount.getState();
console.log("vault balance", state.balance.total.toString());

const wasm = new Uint8Array(readFileSync(WASM));
const deployed = await vaultAccount.deployContract(wasm);
console.log("deploy", txHash(deployed));

const init = await send(vaultAccount, "new", {
  owner: owner.accountId,
  per_tx_max: yocto(5),
  daily_budget: yocto(10),
  gas_allowance: yocto(2),
  receivers: [invoice.accountId, payroll.accountId, vendor.accountId],
  methods: ["pay_invoice", "run_payroll", "transfer_stable"],
});
console.log("init", txHash(init), failureText(init).slice(0, 240));

for (const source of [invoice, payroll, vendor]) {
  const moved = await account(source).signAndSendTransaction({
    receiverId: vault.accountId,
    actions: [transfer(BigInt(yocto(6)))],
    throwOnFailure: false,
    waitUntil: "FINAL",
  });
  console.log("fund", source.accountId, txHash(moved), failureText(moved).slice(0, 160));
}

const agent = KeyPair.fromRandom("ed25519");
writeFileSync(
  `${DIR}/agent.json`,
  JSON.stringify({ accountId: vault.accountId, secret: agent.toString(), publicKey: agent.getPublicKey().toString() }, null, 2),
);
const added = await vaultAccount.addFunctionCallAccessKey({
  publicKey: agent.getPublicKey().toString(),
  contractId: vault.accountId,
  methodNames: ["pay"],
  allowance: yocto(2),
});
console.log("agent key", agent.getPublicKey().toString(), txHash(added));

const agentAccount = new Account(vault.accountId, provider, agent.toString());
const attacks = [
  ["ALLOWED", invoice.accountId, "pay_invoice", "2.5"],
  ["RECEIVER_DENIED", "attacker.near", "pay_invoice", "1"],
  ["METHOD_DENIED", payroll.accountId, "delete_account", "0.1"],
  ["PER_TX_CAP", vendor.accountId, "transfer_stable", "12"],
  ["ALLOWED", payroll.accountId, "run_payroll", "4"],
  ["DAILY_CAP", vendor.accountId, "transfer_stable", "5"],
];

const proofs = [];
for (const [code, receiver, method, amount] of attacks) {
  const result = await send(agentAccount, "pay", {
    receiver,
    method,
    amount: yocto(amount),
  });
  const text = failureText(result);
  const hash = txHash(result);
  const failed = text.includes("Failure");
  console.log(code, hash, failed ? text.slice(0, 300) : "ok");
  proofs.push({ code, receiver, method, amount, hash, failed });
}

const view = await fetch(RPC, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: "status",
    method: "query",
    params: {
      request_type: "call_function",
      finality: "final",
      account_id: vault.accountId,
      method_name: "get_status",
      args_base64: Buffer.from("{}").toString("base64"),
    },
  }),
});
const viewJson = await view.json();
const statusBytes = viewJson.result?.result || [];
const policy = JSON.parse(Buffer.from(statusBytes).toString("utf8"));
console.log("status", JSON.stringify(policy));
writeFileSync(`${DIR}/proofs.json`, JSON.stringify({ owner: owner.accountId, vault: vault.accountId, invoice: invoice.accountId, payroll: payroll.accountId, vendor: vendor.accountId, agent: agent.getPublicKey().toString(), proofs, policy }, null, 2));
console.log("wrote proofs");
