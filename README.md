# KeyCage

Live demo: https://keycage.kutluhaneth.com

## What it is

I keep a NEAR account and I give an agent one function call key. That key can call only `pay` on my PolicyVault contract. The vault calls an allowed method on an allowed receiver and attaches the payment as a deposit.

## Problem

A function call key can name one receiver, a method list, and a gas allowance. It cannot name several merchants, a cap on one payment, or a daily budget that resets. A full access key in an agent process can be drained by a bad instruction.

## Try it

1. Clone https://github.com/kutluhaneth46/keycage and enter that directory.
2. Run `npm install`, then `npm run dev`.
3. Open http://127.0.0.1:43175/panel and click Run the attack suite. See 2 allowed and 4 blocked.
4. Run this and see `allowed` 2 and `blocked` 4:

```bash
curl -sS -X POST http://127.0.0.1:43175/api/attack \
  -H 'Content-Type: application/json' \
  -d '{}'
```

5. Run `cargo test --features unit-testing --manifest-path contracts/policy-vault/Cargo.toml`. See 12 passed.
6. Run `cargo test --features unit-testing --manifest-path contracts/receiver/Cargo.toml`. See 1 passed.
7. Read the live policy. `spent_today` is the yoctoNEAR already used today:

```bash
curl -sS https://rpc.testnet.near.org \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":"1","method":"query","params":{"request_type":"call_function","finality":"final","account_id":"kcvault1rkmug.testnet","method_name":"get_policy","args_base64":"e30="}}'
```

8. Read one successful payment and one rejected drain. The success status has no `Failure`. The drain status contains `RECEIVER_DENIED`.

```bash
curl -sS https://rpc.testnet.near.org \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":"1","method":"tx","params":["DXi4R1dNpU9YNzGPJbnP6UhxhwKjpDKAJ4MKTMAitxSL","kcvault1rkmug.testnet"]}'
```

```bash
curl -sS https://rpc.testnet.near.org \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":"1","method":"tx","params":["4yQ5W2DjhCxmSf8378ystJsbAbkUegw9PEPnwgSXwH5J","kcvault1rkmug.testnet"]}'
```

## Libraries

I use Next.js, React, and Tailwind CSS. Wallet connection uses `@near-wallet-selector/core`, `@near-wallet-selector/modal-ui`, `@near-wallet-selector/my-near-wallet`, `@near-wallet-selector/meteor-wallet`, `@near-wallet-selector/here-wallet`, and `@near-wallet-selector/intear-wallet`. Chain calls use `near-api-js` plus `@near-js/crypto` and `@near-js/transactions`. The contracts use `near-sdk` 5.11.0. I started the app with the Next.js starter. I do not use a paid service, a database, or an environment variable.

## Simulated and on chain

The homepage counts and the panel attack suite are simulated. `POST /api/attack` runs that same suite. It does not spend NEAR.

The vault `kcvault1rkmug.testnet` is on NEAR testnet. `pay` checks the method list, the blocked list, the transaction cap, and the daily budget. If those pass and the receiver is approved and the amount is at most 4.5 NEAR, the vault calls that method on the receiver and attaches the amount as a deposit. The invoice, payroll, and vendor accounts are `kcinvoicezoffwz.testnet`, `kcpayroll020exf.testnet`, and `kcvendoryowfk9.testnet`. Each one runs the receiver contract.

The contract does not meter gas. The agent key `ed25519:7z2H58eQ7tLM3jaQnsXrEpkdqVt3fj8KFyRswWLHACen` can call only `pay`, and its allowance is the gas budget.

The daily budget resets at UTC midnight. A new day clears the spent total and any payment still waiting.

A payment above 4.5 NEAR that otherwise fits is held until I approve or reject it. A receiver that is not approved and not blocked is held the same way. `attacker.near` is blocked, so that call fails with `RECEIVER_DENIED`.

Proof transactions, signed by the agent key:

1. `ALLOWED` 2.5 NEAR `pay_invoice`. https://testnet.nearblocks.io/txns/DXi4R1dNpU9YNzGPJbnP6UhxhwKjpDKAJ4MKTMAitxSL
2. `RECEIVER_DENIED` for `attacker.near`. https://testnet.nearblocks.io/txns/EYsx9zLz5F8mkGtf8JED1NmP8taRFid49UjNMZJKrGYC
3. `METHOD_DENIED` for `delete_account`. https://testnet.nearblocks.io/txns/2k1WeEPn4Xa2PqjSGY3ZYRGj8EHFV1EumfSo1VujV6AB
4. `PER_TX_CAP` for 12 NEAR. https://testnet.nearblocks.io/txns/CyinXzULsAmXDSYJStUeUrGdjAtz9h3s5uJ1zrMsn5Bn
5. `ALLOWED` 4 NEAR `run_payroll`. https://testnet.nearblocks.io/txns/UbB4QVR6y6u8vYhRFEQVhag7Ud3zBZWg83bWy3q57dP
6. `DAILY_CAP` for 5 NEAR. https://testnet.nearblocks.io/txns/5jEQvLEyyVG1PJvsJKZgzrWUnqndXtGdML45i1JhthUd

`WARN_AMOUNT` held 4.8 NEAR and I rejected it, so nothing was paid. https://testnet.nearblocks.io/txns/3VsguWWVHp1M6TtihEg8jxTn7F4QhGxyW9v7hj1qNyEq and https://testnet.nearblocks.io/txns/FxGqCkQBYiAaiB841GNrQPiq7vv6MX2Xa4wkK4MwY7CL

`WARN_NEW_RECEIVER` held 1 NEAR for `kcnew0xzjwi.testnet`. I approved it, and the vault then called `pay_invoice`. https://testnet.nearblocks.io/txns/95vpTLMPpjaM22NMwRzBsYwougNVckFD1WDow59b4kzN and https://testnet.nearblocks.io/txns/3i8HZ37CzEcB3WoVdkSrsoxeNfTm9byfXiTeeeNBPwYF

The scripted agent in `src/lib/agent.ts` is told to pay the invoice, then told to pay `attacker.near`. It follows the second line. The vault returns `RECEIVER_DENIED`. https://testnet.nearblocks.io/txns/4yQ5W2DjhCxmSf8378ystJsbAbkUegw9PEPnwgSXwH5J

## Build and deploy

```bash
rustup target add wasm32-unknown-unknown
cargo test --features unit-testing --manifest-path contracts/policy-vault/Cargo.toml
cargo build --target wasm32-unknown-unknown --release --manifest-path contracts/policy-vault/Cargo.toml
cargo build --target wasm32-unknown-unknown --release --manifest-path contracts/receiver/Cargo.toml
```

I commit the release files `contracts/policy-vault/policy_vault.wasm` and `contracts/receiver/receiver.wasm`. `node contracts/prove.mjs` deploys those files, creates fresh testnet accounts with the public faucet, and runs the proofs. It writes keys only under `/tmp/keycage-near`. I do not commit keys.

The owner of the deployed vault is `kcownerubd7dn.testnet`. Only that account can change policy, pause, approve, reject, or withdraw.

`npm test` checks the simulated suite and the injected choice. `npm run lint` and `npm run build` check the app.
