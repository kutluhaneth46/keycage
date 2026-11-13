# KeyCage

I built KeyCage for the NEAR hackathon security track.

I give an agent a wallet without handing over the whole account. I lock receivers, methods, a transaction cap, a daily budget, and a gas allowance. The agent holds only a function call key. A drain, a forbidden method, or a spend past the budget is blocked, and I can read the reason.

The homepage shows a spend leaving the agent, hitting the cage, and coming back allowed or blocked. The attack suite lives on the panel.

The code is at https://github.com/kutluhaneth46/keycage

## How I run it

```bash
cd keycage
npm install
npm run dev
```

I open http://127.0.0.1:43175.

`npm run build` then `npm run start` serves the production build on the same port.

I do not need an environment variable, a database, or a backend secret.

## What is simulated

The homepage and the attack suite never spend NEAR. The panel and `POST /api/attack` share one local rules engine.

1. I open the panel. The treasury preset is already loaded.
2. I click Run the attack suite.
3. The judge path and the decision log show six rows.
   1. `ALLOWED` for `invoices.demo.near` `pay_invoice`
   2. `RECEIVER_DENIED` for `attacker.near`
   3. `METHOD_DENIED` for `delete_account`
   4. `PER_TX_CAP` for the 12 NEAR transfer
   5. `ALLOWED` for payroll still inside the budget
   6. `DAILY_CAP` for the final 5 NEAR transfer
4. The counts are 2 allowed and 4 blocked. `POST /api/attack` with an empty JSON body returns the same counts.

```bash
curl -sS -X POST http://127.0.0.1:43175/api/attack \
  -H 'Content-Type: application/json' \
  -d '{}'
```

The page can switch between English and Turkish. I store that choice in the browser.

## What is on chain

On the key draft tab I can look up any public account without a wallet. I call the public NEAR RPC. I show the balance and the access keys. A function call key shows its receiver, its methods, and its allowance.

If I connect a wallet I can sign two transactions on my own account.

1. AddKey builds a function call access key from the fence I locked. The receiver is the first account on the allowlist. The methods are the method list. The allowance is the gas allowance. I create the secret in the browser and I copy it before the wallet opens. I do not store it.
2. DeleteKey removes a function call key I pick from the list.

Mainnet is the default. I can switch to testnet. A finished transaction links to NearBlocks.

The wallets are MyNearWallet, Meteor, HERE, and Intear. I use `@near-wallet-selector`. No environment variable is required.

## PolicyVault on testnet

`contracts/policy-vault` is a Rust contract. It holds NEAR and it pays a receiver only when the method is allowed, the amount is inside the transaction cap, and the amount still fits the daily budget. The budget resets at the start of the next UTC day. Only the owner can change the policy, pause the vault, or withdraw. The agent function call key can call only `pay`. Its allowance is the gas budget.

```bash
cd keycage/contracts/policy-vault
cargo test --features unit-testing
cargo build --target wasm32-unknown-unknown --release
```

The wasm lands at `target/wasm32-unknown-unknown/release/policy_vault.wasm`.

`node contracts/prove.mjs` from the `keycage` folder creates a fresh testnet vault with the public faucet, deploys that wasm, and runs the six spends. It writes keys only under `/tmp/keycage-near`. I do not commit those keys.

The vault I already deployed is `kcvaultu7vylu.testnet`.

https://testnet.nearblocks.io/address/kcvaultu7vylu.testnet

The owner account is `kcownerwprb69.testnet`. The invoice, payroll, and vendor receivers are `kcinvoicevq0sat.testnet`, `kcpayrolll0lko3.testnet`, and `kcvendorb3jwhe.testnet`. The agent key is `ed25519:7CCF5HziPcVuUG8XSivCy3WWLmweWEKw21CX1LvoC6cM`. It can call only `pay` on the vault, with a 2 NEAR gas allowance.

I ran the same six spends as the suite. Two succeeded. Four failed inside the contract.

1. `ALLOWED` for 2.5 NEAR `pay_invoice`. https://testnet.nearblocks.io/txns/6CPPr9AYvzg5JBxAmWQZnPdPpQJ5VA6xFNNkmELs2oZQ
2. `RECEIVER_DENIED` for `attacker.near`. https://testnet.nearblocks.io/txns/3Hbz9FarD8U8o48VxvV3S2ZB6ZBQxUw12dwZiKdgMctq
3. `METHOD_DENIED` for `delete_account`. https://testnet.nearblocks.io/txns/AxEDQsSvLMqYQFGQNP8wbyFRHo1nNDbUSKo3D6wHJaF7
4. `PER_TX_CAP` for 12 NEAR. https://testnet.nearblocks.io/txns/6duKuRDr91JjBth746EmabWYLi1SmXvnc9Zh68V3FWY6
5. `ALLOWED` for 4 NEAR `run_payroll`. https://testnet.nearblocks.io/txns/6eisLmYfTHSBjHBKRCnVWGBX2tQmaKWKbh14u1E4uKzT
6. `DAILY_CAP` for 5 NEAR. https://testnet.nearblocks.io/txns/EDTM7xgmbxGmJn7KYv9RUbmKy2PqLWPJSPKNi3BfHDoT

The panel reads `get_policy` from that account and lists these hashes next to the simulated suite. A connected testnet wallet can sign another `pay` to the invoice receiver. The homepage attack suite and `POST /api/attack` stay simulated.

## Policy model

`src/lib/policy.ts` is the fence.

A spend is allowed only when every check passes:

1. The receiver is on the allowlist.
2. The method is on the allowlist.
3. The amount is within the transaction cap.
4. The amount still fits in the daily budget.
5. The gas still fits in the allowance.

`toNearAccessKeyDraft` maps the fence to a NEAR `AddKey` function call permission. A protocol key names one `receiver_id`, a method list, and an allowance. I put a vault contract in that single receiver slot. The vault holds the merchant allowlist, the transaction cap, and the daily budget, because the protocol key does not encode those. The allowance on the key is the gas budget. When it hits zero, the key is dead until I issue a new one.

1. `src/lib/policy.ts` holds the fence rules, the attack suite, and the key draft.
2. `src/lib/presets.ts` holds the treasury, research, and ops starting policies.
3. `src/lib/near.ts` reads public account and access key data.
4. `contracts/policy-vault` is the testnet contract that enforces the fence.
5. `src/app/api/attack/route.ts` runs the same evaluation over HTTP for a judge.
6. `src/app/page.tsx` is the homepage. `src/app/panel/page.tsx` is the panel.

## License

MIT
