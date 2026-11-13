"use client";

import { useEffect, useRef, useState } from "react";
import type { StorageService, WalletSelector } from "@near-wallet-selector/core";
import { useI18n } from "@/lib/i18n";
import { accountUrl, callView, formatYocto, nearToYocto, txUrl, viewKeyAllowance } from "@/lib/near";
import {
  VAULT_ACCOUNT,
  VAULT_AGENT_KEY,
  VAULT_INVOICE,
  VAULT_PROOFS,
} from "@/lib/vaultProof";

type PolicyView = {
  paused: boolean;
  per_tx_max: string;
  daily_budget: string;
  gas_allowance: string;
  spent_today: string;
  allow_receivers: string[];
  allow_methods: string[];
};

type Bundle = {
  selector: WalletSelector;
  show: () => void;
};

export function VaultProof() {
  const { t } = useI18n();
  const [policy, setPolicy] = useState<PolicyView | null>(null);
  const [gasLeft, setGasLeft] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState("0.1");
  const [busy, setBusy] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const bundleRef = useRef<Bundle | null>(null);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      try {
        const [nextPolicy, allowance] = await Promise.all([
          callView<PolicyView>("testnet", VAULT_ACCOUNT, "get_policy"),
          viewKeyAllowance("testnet", VAULT_ACCOUNT, VAULT_AGENT_KEY),
        ]);
        if (cancel) return;
        setPolicy(nextPolicy);
        setGasLeft(allowance);
      } catch {
        if (!cancel) setErrorCode("rpc");
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  async function openSelector() {
    if (bundleRef.current) return bundleRef.current;
    const [{ setupWalletSelector }, { setupModal }, { setupMyNearWallet }, { setupMeteorWallet }, { setupHereWallet }, { setupIntearWallet }] =
      await Promise.all([
        import("@near-wallet-selector/core"),
        import("@near-wallet-selector/modal-ui"),
        import("@near-wallet-selector/my-near-wallet"),
        import("@near-wallet-selector/meteor-wallet"),
        import("@near-wallet-selector/here-wallet"),
        import("@near-wallet-selector/intear-wallet"),
      ]);
    await import("@near-wallet-selector/modal-ui/styles.css");
    const selector = await setupWalletSelector({
      network: "testnet",
      allowMultipleSelectors: true,
      storage: testnetStorage(),
      modules: [setupMyNearWallet(), setupMeteorWallet(), setupHereWallet(), setupIntearWallet()],
    });
    const modal = setupModal(selector, { theme: "dark" });
    selector.store.observable.subscribe((state) => {
      const active = state.accounts.find((account) => account.active) ?? state.accounts[0];
      setAccountId(active?.accountId ?? null);
    });
    const state = selector.store.getState();
    const active = state.accounts.find((account) => account.active) ?? state.accounts[0];
    setAccountId(active?.accountId ?? null);
    const bundle = { selector, show: () => modal.show() };
    bundleRef.current = bundle;
    return bundle;
  }

  async function connect() {
    setBusy("connect");
    setErrorCode(null);
    try {
      const bundle = await openSelector();
      bundle.show();
    } catch {
      setErrorCode("wallet");
    } finally {
      setBusy(null);
    }
  }

  async function pay() {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setErrorCode("amount");
      return;
    }
    if (!accountId) {
      setErrorCode("wallet");
      return;
    }
    setBusy("pay");
    setErrorCode(null);
    try {
      const bundle = await openSelector();
      const { actionCreators } = await import("@near-wallet-selector/core");
      const wallet = await bundle.selector.wallet();
      const outcome = await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: VAULT_ACCOUNT,
        actions: [
          actionCreators.functionCall(
            "pay",
            {
              receiver: VAULT_INVOICE,
              method: "pay_invoice",
              amount: nearToYocto(parsed).toString(),
            },
            BigInt("100000000000000"),
            BigInt(0),
          ),
        ],
      });
      const hash = outcome && typeof outcome === "object" ? outcome.transaction_outcome?.id : null;
      if (typeof hash === "string" && hash) setTxHash(hash);
      const nextPolicy = await callView<PolicyView>("testnet", VAULT_ACCOUNT, "get_policy");
      setPolicy(nextPolicy);
    } catch {
      setErrorCode("sign");
    } finally {
      setBusy(null);
    }
  }

  const errorText =
    errorCode === "rpc"
      ? t.vaultFail
      : errorCode === "wallet"
        ? t.needTestnet
        : errorCode === "amount"
          ? t.errNumbers
          : errorCode === "sign"
            ? t.signFail
            : null;

  return (
    <article className="card" id="vault">
      <div className="title-row">
        <span className="status-pill is-live">
          <i />
          {t.chainPill}
        </span>
      </div>
      <h2 className="section-title">{t.vaultTitle}</h2>
      <p className="section-copy">{t.vaultCopy}</p>
      <p className="chain-account">
        <a href={accountUrl("testnet", VAULT_ACCOUNT)} target="_blank" rel="noreferrer">
          {VAULT_ACCOUNT}
        </a>
      </p>
      {policy ? (
        <div className="stack">
          {policy.paused ? <p className="chain-error">{t.vaultPaused}</p> : null}
          <p className="chain-account">
            <span>
              {t.liveSpent} {formatYocto(policy.spent_today)} NEAR
            </span>
            <span>
              {t.liveBudget} {formatYocto(policy.daily_budget)} NEAR
            </span>
            <span>
              {t.liveCap} {formatYocto(policy.per_tx_max)} NEAR
            </span>
            <span>
              {t.liveGas} {gasLeft ?? formatYocto(policy.gas_allowance)} NEAR
            </span>
          </p>
          <p className="key-meta">
            <span>{t.liveReceivers}</span>
            <span className="mono">{policy.allow_receivers.join(", ")}</span>
          </p>
          <p className="key-meta">
            <span>{t.liveMethods}</span>
            <span className="mono">{policy.allow_methods.join(", ")}</span>
          </p>
        </div>
      ) : null}

      <h3 className="vault-sub">{t.proofTitle}</h3>
      <p className="section-copy">{t.proofCopy}</p>
      <ul className="key-list proof-list">
        {VAULT_PROOFS.map((row) => (
          <li className="key-row" key={row.hash}>
            <strong>{row.code}</strong>
            <p className="key-meta">
              <span>
                {row.amount} NEAR {row.method}
              </span>
              <span className="mono">{row.receiver}</span>
            </p>
            <p className="key-meta">
              <a href={txUrl("testnet", row.hash)} target="_blank" rel="noreferrer">
                {t.viewTx}
              </a>
              <span className="mono">{row.hash}</span>
            </p>
          </li>
        ))}
      </ul>

      <h3 className="vault-sub">{t.testPayTitle}</h3>
      <p className="section-copy">{t.testPayCopy}</p>
      <div className="actions">
        {accountId ? (
          <p className="chain-account">
            {t.connected}{" "}
            <a href={accountUrl("testnet", accountId)} target="_blank" rel="noreferrer">
              {accountId}
            </a>
          </p>
        ) : (
          <button className="btn btn-ghost" type="button" onClick={connect} disabled={busy === "connect"}>
            {busy === "connect" ? t.chainBusy : t.connectTestnet}
          </button>
        )}
      </div>
      <form
        className="lookup-row"
        onSubmit={(event) => {
          event.preventDefault();
          void pay();
        }}
      >
        <label className="field-label">
          {t.payAmount}
          <input
            className="field"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy === "pay" || !accountId}>
          {busy === "pay" ? t.chainBusy : t.testPayBtn}
        </button>
      </form>
      {txHash ? (
        <p className="chain-account">
          <a href={txUrl("testnet", txHash)} target="_blank" rel="noreferrer">
            {t.viewTx}
          </a>
          <span className="mono">{txHash}</span>
        </p>
      ) : null}
      {errorText ? (
        <p className="chain-error" role="alert">
          {errorText}
        </p>
      ) : null}
    </article>
  );
}

function testnetStorage(): StorageService {
  const prefix = "keycage-wallet:testnet:";
  return {
    async getItem(key) {
      return window.localStorage.getItem(prefix + key);
    },
    async setItem(key, value) {
      window.localStorage.setItem(prefix + key, value);
    },
    async removeItem(key) {
      window.localStorage.removeItem(prefix + key);
    },
  };
}
