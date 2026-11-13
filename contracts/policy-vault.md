# PolicyVault

I designed this vault for NEAR. The engine in this repo already decides each spend. A chain deploy on testnet is the step after this demo.

## The limit I work around

A NEAR function call access key can bind:

- one `receiver_id`
- optional `method_names`
- optional gas `allowance`

It cannot encode:

- more than one merchant
- a cap on each transaction
- a daily budget that resets

An agent needs those rules. A full access key inside an agent process is unsafe.

## The shape

1. I deploy or initialize `policy.<owner>.near` (PolicyVault).
2. I deposit spendable NEAR or NEP-141 into the vault.
3. I set policy storage:
   - `per_tx_max`
   - `daily_budget`
   - `spent_today` and `window_start`
   - `allow_receivers[]`
   - `set_policy` and `reset_window`, for me only
4. I add a function call key on my account, or on an account I make for the agent, with:
   - `receiver_id = policy.<owner>.near`
   - `method_names = ["pay"]`
   - `allowance = gas budget`
5. The agent calls `pay(receiver, amount, memo)`.
6. The vault checks the allowlist and the caps, then transfers. A failure reverts with the same codes as this demo: `RECEIVER_DENIED`, `PER_TX_CAP`, `DAILY_CAP`.

## Why I route through the vault

If the agent key pointed at `vendor.acme.near` directly, the agent could call any allowed method on that vendor with no daily rule. The vault keeps one clipped key and one place I can audit.

## How this maps to the demo

`src/lib/policy.ts` is the same decision table the vault has to enforce. `/api/attack` is the check I want a judge to run before a testnet deploy.
