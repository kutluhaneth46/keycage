export const VAULT_ACCOUNT = "kcvault1rkmug.testnet";
export const VAULT_OWNER = "kcownerubd7dn.testnet";
export const VAULT_AGENT_KEY = "ed25519:7z2H58eQ7tLM3jaQnsXrEpkdqVt3fj8KFyRswWLHACen";
export const VAULT_INVOICE = "kcinvoicezoffwz.testnet";
export const VAULT_PAYROLL = "kcpayroll020exf.testnet";
export const VAULT_VENDOR = "kcvendoryowfk9.testnet";

export type VaultProofRow = {
  code: "ALLOWED" | "RECEIVER_DENIED" | "METHOD_DENIED" | "PER_TX_CAP" | "DAILY_CAP";
  ok: boolean;
  amount: string;
  method: string;
  receiver: string;
  hash: string;
};

export const VAULT_PROOFS: VaultProofRow[] = [
  {
    code: "ALLOWED",
    ok: true,
    amount: "2.5",
    method: "pay_invoice",
    receiver: VAULT_INVOICE,
    hash: "DXi4R1dNpU9YNzGPJbnP6UhxhwKjpDKAJ4MKTMAitxSL",
  },
  {
    code: "RECEIVER_DENIED",
    ok: false,
    amount: "1",
    method: "pay_invoice",
    receiver: "attacker.near",
    hash: "EYsx9zLz5F8mkGtf8JED1NmP8taRFid49UjNMZJKrGYC",
  },
  {
    code: "METHOD_DENIED",
    ok: false,
    amount: "0.1",
    method: "delete_account",
    receiver: VAULT_PAYROLL,
    hash: "2k1WeEPn4Xa2PqjSGY3ZYRGj8EHFV1EumfSo1VujV6AB",
  },
  {
    code: "PER_TX_CAP",
    ok: false,
    amount: "12",
    method: "transfer_stable",
    receiver: VAULT_VENDOR,
    hash: "CyinXzULsAmXDSYJStUeUrGdjAtz9h3s5uJ1zrMsn5Bn",
  },
  {
    code: "ALLOWED",
    ok: true,
    amount: "4",
    method: "run_payroll",
    receiver: VAULT_PAYROLL,
    hash: "UbB4QVR6y6u8vYhRFEQVhag7Ud3zBZWg83bWy3q57dP",
  },
  {
    code: "DAILY_CAP",
    ok: false,
    amount: "5",
    method: "transfer_stable",
    receiver: VAULT_VENDOR,
    hash: "5jEQvLEyyVG1PJvsJKZgzrWUnqndXtGdML45i1JhthUd",
  },
];

export const VAULT_WARN = {
  code: "WARN_AMOUNT",
  amount: "4.8",
  method: "pay_invoice",
  receiver: VAULT_INVOICE,
  hash: "3VsguWWVHp1M6TtihEg8jxTn7F4QhGxyW9v7hj1qNyEq",
  rejectHash: "FxGqCkQBYiAaiB841GNrQPiq7vv6MX2Xa4wkK4MwY7CL",
};

export const VAULT_REVIEW = {
  code: "WARN_NEW_RECEIVER",
  amount: "1",
  method: "pay_invoice",
  receiver: "kcnew0xzjwi.testnet",
  hash: "95vpTLMPpjaM22NMwRzBsYwougNVckFD1WDow59b4kzN",
  approveHash: "3i8HZ37CzEcB3WoVdkSrsoxeNfTm9byfXiTeeeNBPwYF",
};

export const VAULT_INJECTION = {
  code: "RECEIVER_DENIED",
  amount: "1",
  method: "pay_invoice",
  receiver: "attacker.near",
  hash: "4yQ5W2DjhCxmSf8378ystJsbAbkUegw9PEPnwgSXwH5J",
};
