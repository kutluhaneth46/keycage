# PolicyVault

I deployed this vault on NEAR testnet. The Rust source is in `contracts/policy-vault`. The account is `kcvaultu7vylu.testnet`.

A NEAR function call key can name one receiver, a method list, and a gas allowance. It cannot name several merchants, a transaction cap, or a daily budget. I put the vault in the single receiver slot. The agent key can call only `pay`. The vault checks the receiver, the method, the transaction cap, and the daily budget, then it transfers NEAR. A rejection comes back as `RECEIVER_DENIED`, `METHOD_DENIED`, `PER_TX_CAP`, or `DAILY_CAP`.

The gas allowance is the allowance on that function call key. When it hits zero, the key is dead until I add a new one.

Only the owner can change the policy, pause the vault, or withdraw. The attack suite in the app stays on this machine. The six proof transactions are the same spends, sent on testnet.
