export type NearNet = "mainnet" | "testnet";

export type ChainPermission =
  | { kind: "full" }
  | {
      kind: "function";
      receiverId: string;
      methodNames: string[];
      allowanceNear: string | null;
    };

export type ChainKey = {
  publicKey: string;
  nonce: string;
  permission: ChainPermission;
};

export type ChainAccount = {
  accountId: string;
  balanceNear: string;
  keys: ChainKey[];
  truncated: boolean;
};

export class NearLookupError extends Error {
  code: "missing" | "rpc" | "invalid";

  constructor(code: "missing" | "rpc" | "invalid") {
    super(code);
    this.code = code;
  }
}

const RPC: Record<NearNet, string[]> = {
  mainnet: ["https://rpc.mainnet.near.org", "https://rpc.mainnet.fastnear.com"],
  testnet: ["https://rpc.testnet.near.org", "https://rpc.testnet.fastnear.com"],
};

const MAX_KEYS = 100;

export function isAccountId(value: string): boolean {
  const id = value.trim().toLowerCase();
  if (id.length < 2 || id.length > 64) return false;
  return /^[a-z0-9._-]+$/.test(id);
}

export function nearToYocto(near: number): bigint {
  if (!Number.isFinite(near) || near <= 0) return BigInt(0);
  const whole = BigInt(Math.floor(near));
  const frac = BigInt(Math.round((near % 1) * 1e5));
  const yoctoPerNear = BigInt("1000000000000000000000000");
  const fracScale = BigInt("10000000000000000000");
  return whole * yoctoPerNear + frac * fracScale;
}

export function formatYocto(yocto: string): string {
  if (!/^\d+$/.test(yocto)) return "0";
  const padded = yocto.padStart(25, "0");
  const whole = padded.slice(0, -24).replace(/^0+(?=\d)/, "");
  const frac = padded.slice(-24, -19).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}

export function txUrl(net: NearNet, hash: string): string {
  const host = net === "testnet" ? "https://testnet.nearblocks.io" : "https://nearblocks.io";
  return `${host}/txns/${encodeURIComponent(hash)}`;
}

export function accountUrl(net: NearNet, accountId: string): string {
  const host = net === "testnet" ? "https://testnet.nearblocks.io" : "https://nearblocks.io";
  return `${host}/address/${encodeURIComponent(accountId)}`;
}

type AccountView = {
  amount: string;
};

type KeyList = {
  keys: Array<{
    public_key: string;
    access_key: {
      nonce: number | string;
      permission:
        | "FullAccess"
        | {
            FunctionCall: {
              allowance: string | null;
              receiver_id: string;
              method_names: string[];
            };
          };
    };
  }>;
};

export async function lookupAccount(net: NearNet, rawId: string): Promise<ChainAccount> {
  const accountId = rawId.trim().toLowerCase();
  if (!isAccountId(accountId)) throw new NearLookupError("invalid");

  const account = await rpc<AccountView>(net, {
    request_type: "view_account",
    finality: "final",
    account_id: accountId,
  });

  const page = await rpc<KeyList>(net, {
    request_type: "view_access_key_list",
    finality: "final",
    account_id: accountId,
    limit: MAX_KEYS,
  });
  const seen = new Set<string>();
  const keys: ChainKey[] = [];
  for (const row of page.keys ?? []) {
    if (!row.public_key || seen.has(row.public_key)) continue;
    seen.add(row.public_key);
    keys.push({
      publicKey: row.public_key,
      nonce: String(row.access_key?.nonce ?? "0"),
      permission: parsePermission(row.access_key?.permission),
    });
  }
  const truncated = (page.keys?.length ?? 0) >= MAX_KEYS;

  return {
    accountId,
    balanceNear: formatYocto(String(account.amount ?? "0")),
    keys,
    truncated,
  };
}

function parsePermission(permission: KeyList["keys"][number]["access_key"]["permission"]): ChainPermission {
  if (!permission || permission === "FullAccess") return { kind: "full" };
  const call = permission.FunctionCall;
  if (!call) return { kind: "full" };
  return {
    kind: "function",
    receiverId: call.receiver_id,
    methodNames: call.method_names ?? [],
    allowanceNear: call.allowance == null ? null : formatYocto(String(call.allowance)),
  };
}

async function rpc<T>(net: NearNet, params: Record<string, unknown>): Promise<T> {
  let failed = false;
  for (const url of RPC[net]) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "keycage",
          method: "query",
          params,
        }),
      });
      if (!res.ok) {
        failed = true;
        continue;
      }
      const json = (await res.json()) as {
        result?: T;
        error?: { cause?: { name?: string } };
      };
      if (json.error) {
        const name = json.error.cause?.name;
        if (name === "UNKNOWN_ACCOUNT") throw new NearLookupError("missing");
        failed = true;
        continue;
      }
      if (json.result === undefined) {
        failed = true;
        continue;
      }
      return json.result;
    } catch (error) {
      if (error instanceof NearLookupError) throw error;
      failed = true;
    }
  }
  if (failed) throw new NearLookupError("rpc");
  throw new NearLookupError("rpc");
}
