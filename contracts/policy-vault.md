# PolicyVault

The Rust vault is `contracts/policy-vault`. The receiver methods are `contracts/receiver`. The deployed vault is `kcvault1rkmug.testnet`.

`pay` calls the named method on the receiver and attaches the amount as a deposit. It rejects a blocked receiver, a method that is not on the list, a payment over the transaction cap, and a payment that breaks the daily budget. The daily total resets at UTC midnight.

A payment above 4.5 NEAR, or a receiver that is neither approved nor blocked, is stored until I approve or reject it. `attacker.near` is blocked.

The contract does not meter gas. The agent function call key can call only `pay`, and its allowance is the gas budget.

The release wasm files in this folder are what `contracts/prove.mjs` deploys. Keys stay outside the repo.
