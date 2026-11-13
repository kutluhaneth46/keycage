# KeyCage

I built KeyCage for the NEAR hackathon security track.

The live demo is at https://keycage.kutluhaneth.com.

I give an agent a wallet without handing over the whole account. I lock receivers, methods, a transaction cap, a daily budget, and a gas allowance. The agent holds only a function call key. A drain, a forbidden method, or a spend past the budget is denied, and I can read the reason.

The first screen shows a spend leaving the agent, hitting the cage, and coming back allowed or blocked.

## How I run it

```bash
npm install
npm run dev
```

I open http://127.0.0.1:43175.

`npm run build` then `npm run start` serves the production build on the same port.

I do not need an environment variable, a database, or a live NEAR network. The desk and `/api/attack` share one local rules engine.

## What I want a judge to see

1. I open the app. The treasury preset is already loaded.
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
3. `src/app/api/attack/route.ts` runs the same evaluation over HTTP for a judge.
4. `src/app/page.tsx` is the desk, the meters, the log, and the judge path.
5. The note in the contracts folder is how I would place the vault on chain.

## Who I am in public

I publish this as KutluhanETH.

https://kutluhaneth.com

https://x.com/kutluhaneth

## License

MIT
