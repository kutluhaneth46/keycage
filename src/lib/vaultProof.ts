export const VAULT_ACCOUNT = "kcvaultu7vylu.testnet";
export const VAULT_OWNER = "kcownerwprb69.testnet";
export const VAULT_AGENT_KEY = "ed25519:7CCF5HziPcVuUG8XSivCy3WWLmweWEKw21CX1LvoC6cM";
export const VAULT_INVOICE = "kcinvoicevq0sat.testnet";
export const VAULT_PAYROLL = "kcpayrolll0lko3.testnet";
export const VAULT_VENDOR = "kcvendorb3jwhe.testnet";

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
    hash: "6CPPr9AYvzg5JBxAmWQZnPdPpQJ5VA6xFNNkmELs2oZQ",
  },
  {
    code: "RECEIVER_DENIED",
    ok: false,
    amount: "1",
    method: "pay_invoice",
    receiver: "attacker.near",
    hash: "3Hbz9FarD8U8o48VxvV3S2ZB6ZBQxUw12dwZiKdgMctq",
  },
  {
    code: "METHOD_DENIED",
    ok: false,
    amount: "0.1",
    method: "delete_account",
    receiver: VAULT_PAYROLL,
    hash: "AxEDQsSvLMqYQFGQNP8wbyFRHo1nNDbUSKo3D6wHJaF7",
  },
  {
    code: "PER_TX_CAP",
    ok: false,
    amount: "12",
    method: "transfer_stable",
    receiver: VAULT_VENDOR,
    hash: "6duKuRDr91JjBth746EmabWYLi1SmXvnc9Zh68V3FWY6",
  },
  {
    code: "ALLOWED",
    ok: true,
    amount: "4",
    method: "run_payroll",
    receiver: VAULT_PAYROLL,
    hash: "6eisLmYfTHSBjHBKRCnVWGBX2tQmaKWKbh14u1E4uKzT",
  },
  {
    code: "DAILY_CAP",
    ok: false,
    amount: "5",
    method: "transfer_stable",
    receiver: VAULT_VENDOR,
    hash: "EDTM7xgmbxGmJn7KYv9RUbmKy2PqLWPJSPKNi3BfHDoT",
  },
];
