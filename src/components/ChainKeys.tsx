"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { KeyPair, PublicKey } from "@near-js/crypto";
import type { FinalExecutionOutcome } from "@near-js/types";
import type { StorageService, WalletSelector } from "@near-wallet-selector/core";
import { useI18n } from "@/lib/i18n";
import {
  accountUrl,
  lookupAccount,
  NearLookupError,
  nearToYocto,
  txUrl,
  type ChainAccount,
  type NearNet,
} from "@/lib/near";
import type { Policy } from "@/lib/policy";

type PreparedKey = {
  publicKey: string;
  secret: string;
  receiver: string;
  methods: string[];
  allowance: number;
};

type Bundle = {
  net: NearNet;
  selector: WalletSelector;
  show: () => void;
  sub: { unsubscribe: () => void };
};

const SECRET_KEY = "keycage-pending-secret";
const NET_KEY = "keycage-net";

export function ChainKeys({ policy }: { policy: Policy }) {
  const { t } = useI18n();
  const [net, setNet] = useState<NearNet>("mainnet");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [mine, setMine] = useState<ChainAccount | null>(null);
  const [lookupId, setLookupId] = useState("near");
  const [lookup, setLookup] = useState<ChainAccount | null>(null);
  const [prepared, setPrepared] = useState<PreparedKey | null>(null);
  const [txHashes, setTxHashes] = useState<string[]>([]);
  const [txNet, setTxNet] = useState<NearNet>("mainnet");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const bundleRef = useRef<Bundle | null>(null);
  const genRef = useRef(0);
  const netRef = useRef(net);
  netRef.current = net;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.sessionStorage.getItem(NET_KEY);
      if (stored === "mainnet" || stored === "testnet") setNet(stored);
      const params = new URLSearchParams(window.location.search);
      const hashes = params.get("transactionHashes");
      const walletError = params.get("errorMessage");
      if (hashes) {
        setTxHashes(hashes.split(",").map((hash) => hash.trim()).filter(Boolean));
        setTxNet(stored === "testnet" ? "testnet" : "mainnet");
      }
      if (walletError) setErrorCode("sign");
      const raw = window.sessionStorage.getItem(SECRET_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as PreparedKey;
          if (parsed.publicKey && parsed.secret) setPrepared(parsed);
        } catch {
          window.sessionStorage.removeItem(SECRET_KEY);
        }
      }
      if (hashes || walletError) {
        const url = new URL(window.location.href);
        url.searchParams.delete("transactionHashes");
        url.searchParams.delete("errorCode");
        url.searchParams.delete("errorMessage");
        url.searchParams.delete("account_id");
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void openBundle(net, true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [net]);

  useEffect(() => {
    if (!accountId) {
      const timer = window.setTimeout(() => setMine(null), 0);
      return () => window.clearTimeout(timer);
    }
    const current = accountId;
    let cancel = false;
    void lookupAccount(net, current)
      .then((view) => {
        if (!cancel) setMine(view);
      })
      .catch(() => {
        if (!cancel) setMine(null);
      });
    return () => {
      cancel = true;
    };
  }, [accountId, net]);

  async function openBundle(nextNet: NearNet, quiet: boolean) {
    const current = bundleRef.current;
    if (current?.net === nextNet) return current;
    const gen = ++genRef.current;
    current?.sub.unsubscribe();
    bundleRef.current = null;
    if (!quiet) setBusy("connect");
    try {
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
        network: nextNet,
        allowMultipleSelectors: true,
        storage: prefixedStorage(nextNet),
        modules: [setupMyNearWallet(), setupMeteorWallet(), setupHereWallet(), setupIntearWallet()],
      });
      const modal = setupModal(selector, { theme: "dark" });
      const sub = selector.store.observable.subscribe((state) => {
        if (netRef.current !== nextNet) return;
        const active = state.accounts.find((account) => account.active) ?? state.accounts[0];
        setAccountId(active?.accountId ?? null);
      });
      if (gen !== genRef.current || netRef.current !== nextNet) {
        sub.unsubscribe();
        return null;
      }
      const bundle: Bundle = { net: nextNet, selector, show: () => modal.show(), sub };
      bundleRef.current = bundle;
      const state = selector.store.getState();
      const active = state.accounts.find((account) => account.active) ?? state.accounts[0];
      if (netRef.current === nextNet) setAccountId(active?.accountId ?? null);
      return bundle;
    } catch {
      if (!quiet) setErrorCode("wallet");
      return null;
    } finally {
      if (!quiet) setBusy(null);
    }
  }

  function chooseNet(next: NearNet) {
    window.sessionStorage.setItem(NET_KEY, next);
    setErrorCode(null);
    setAccountId(null);
    setMine(null);
    setNet(next);
  }

  async function onLookup(event: FormEvent) {
    event.preventDefault();
    setBusy("lookup");
    setErrorCode(null);
    try {
      setLookup(await lookupAccount(net, lookupId));
    } catch (error) {
      setLookup(null);
      setErrorCode(error instanceof NearLookupError ? error.code : "rpc");
    } finally {
      setBusy(null);
    }
  }

  async function connect() {
    setErrorCode(null);
    const bundle = await openBundle(net, false);
    bundle?.show();
  }

  async function disconnect() {
    const bundle = bundleRef.current;
    if (!bundle || bundle.net !== net) {
      setAccountId(null);
      return;
    }
    setBusy("disconnect");
    try {
      const wallet = await bundle.selector.wallet();
      await wallet.signOut();
      setAccountId(null);
      setMine(null);
    } catch {
      setErrorCode("sign");
    } finally {
      setBusy(null);
    }
  }

  function prepare() {
    const receiver = policy.allowReceivers[0]?.trim().toLowerCase() ?? "";
    const methods = policy.allowMethods.map((method) => method.trim()).filter(Boolean);
    if (!receiver) {
      setErrorCode("receiver");
      return;
    }
    if (methods.length === 0) {
      setErrorCode("methods");
      return;
    }
    const pair = KeyPair.fromRandom("ed25519");
    const next: PreparedKey = {
      publicKey: pair.getPublicKey().toString(),
      secret: pair.toString(),
      receiver,
      methods,
      allowance: policy.gasAllowanceNear,
    };
    window.sessionStorage.setItem(SECRET_KEY, JSON.stringify(next));
    setPrepared(next);
    setCopied(false);
    setErrorCode(null);
  }

  async function copySecret() {
    if (!prepared) return;
    try {
      await navigator.clipboard.writeText(prepared.secret);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function clearSecret() {
    window.sessionStorage.removeItem(SECRET_KEY);
    setPrepared(null);
    setCopied(false);
  }

  async function signAdd() {
    if (!prepared) return;
    if (!accountId) {
      setErrorCode("wallet");
      return;
    }
    setBusy("add");
    setErrorCode(null);
    try {
      const bundle = await openBundle(net, true);
      if (!bundle) {
        setErrorCode("wallet");
        return;
      }
      const { actionCreators } = await import("@near-wallet-selector/core");
      const wallet = await bundle.selector.wallet();
      const outcome = await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: accountId,
        actions: [
          actionCreators.addKey(
            PublicKey.from(prepared.publicKey),
            actionCreators.functionCallAccessKey(prepared.receiver, prepared.methods, nearToYocto(prepared.allowance)),
          ),
        ],
      });
      const hash = readHash(outcome);
      if (hash) {
        setTxHashes([hash]);
        setTxNet(net);
      }
      setMine(await lookupAccount(net, accountId));
    } catch {
      setErrorCode("sign");
    } finally {
      setBusy(null);
    }
  }

  async function signDelete(publicKey: string) {
    if (!accountId) {
      setErrorCode("wallet");
      return;
    }
    setBusy("delete");
    setErrorCode(null);
    try {
      const bundle = await openBundle(net, true);
      if (!bundle) {
        setErrorCode("wallet");
        return;
      }
      const { actionCreators } = await import("@near-wallet-selector/core");
      const wallet = await bundle.selector.wallet();
      const outcome = await wallet.signAndSendTransaction({
        signerId: accountId,
        receiverId: accountId,
        actions: [actionCreators.deleteKey(PublicKey.from(publicKey))],
      });
      const hash = readHash(outcome);
      if (hash) {
        setTxHashes([hash]);
        setTxNet(net);
      }
      setDeleteTarget(null);
      setMine(await lookupAccount(net, accountId));
    } catch {
      setErrorCode("sign");
    } finally {
      setBusy(null);
    }
  }

  const errorText =
    errorCode === "missing"
      ? t.accountMissing
      : errorCode === "invalid"
        ? t.invalidAccount
        : errorCode === "receiver"
          ? t.noReceiver
          : errorCode === "methods"
            ? t.noMethods
            : errorCode === "wallet"
              ? t.needWallet
              : errorCode === "sign"
                ? t.signFail
                : errorCode === "rpc"
                  ? t.rpcFail
                  : null;

  return (
    <article className="card" id="chain">
      <div className="title-row">
        <span className="status-pill is-live">
          <i />
          {t.chainPill}
        </span>
      </div>
      <h2 className="section-title">{t.chainTitle}</h2>
      <p className="section-copy">{t.chainCopy}</p>

      <div className="net-switch" role="radiogroup" aria-label={t.netLabel}>
        <button type="button" role="radio" aria-checked={net === "mainnet"} onClick={() => chooseNet("mainnet")}>
          {t.mainnet}
        </button>
        <button type="button" role="radio" aria-checked={net === "testnet"} onClick={() => chooseNet("testnet")}>
          {t.testnet}
        </button>
      </div>

      <form className="lookup-row" onSubmit={onLookup}>
        <label className="field-label">
          {t.checkLabel}
          <input
            className="field"
            value={lookupId}
            onChange={(event) => setLookupId(event.target.value)}
            placeholder={t.checkPh}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby="chain-error"
          />
        </label>
        <button className="btn btn-ghost" type="submit" disabled={busy === "lookup"}>
          {busy === "lookup" ? t.checking : t.checkBtn}
        </button>
      </form>

      {lookup ? (
        <AccountBlock
          title={t.lookupTitle}
          view={lookup}
          net={net}
          labels={t}
          listId="public-keys"
        />
      ) : null}

      <div className="actions">
        {accountId ? (
          <button className="btn btn-ghost" type="button" onClick={disconnect} disabled={busy === "disconnect"}>
            {t.disconnect}
          </button>
        ) : (
          <button className="btn btn-primary" type="button" onClick={connect} disabled={busy === "connect"}>
            {busy === "connect" ? t.chainBusy : t.connect}
          </button>
        )}
      </div>

      {accountId ? (
        <div className="stack">
          <p className="chain-account">
            {t.connected}{" "}
            <a href={accountUrl(net, accountId)} target="_blank" rel="noreferrer">
              {accountId}
            </a>
          </p>
          {mine ? (
            <p className="chain-account">
              {t.balance} <strong className="mono">{mine.balanceNear} NEAR</strong>
            </p>
          ) : null}
          {mine ? (
            <AccountBlock
              title={t.mineTitle}
              view={mine}
              net={net}
              labels={t}
              deleteTarget={deleteTarget}
              onAskDelete={setDeleteTarget}
              onCancelDelete={() => setDeleteTarget(null)}
              onConfirmDelete={signDelete}
              deleteBusy={busy === "delete"}
            />
          ) : null}
        </div>
      ) : null}

      <div className="actions">
        <button className="btn btn-primary" type="button" onClick={prepare}>
          {t.prepareKey}
        </button>
      </div>
      {policy.gasAllowanceNear <= 0 ? <p className="section-copy">{t.zeroAllowance}</p> : null}

      {prepared ? (
        <div className="secret-box">
          <p>{t.secretNote}</p>
          <p className="key-meta">
            <span>{t.publicKey}</span>
            <span className="mono">{prepared.publicKey}</span>
          </p>
          <p className="key-meta">
            <span>{t.receiverLabel}</span>
            <span className="mono">{prepared.receiver}</span>
          </p>
          <p className="key-meta">
            <span>{t.methodsLabel}</span>
            <span className="mono">{prepared.methods.join(", ")}</span>
          </p>
          <label className="field-label">
            {t.secretLabel}
            <textarea className="field" readOnly value={prepared.secret} rows={3} spellCheck={false} />
          </label>
          <div className="actions">
            <button className="btn btn-ghost" type="button" onClick={copySecret}>
              {copied ? t.copied : t.copySecret}
            </button>
            <button className="btn btn-primary" type="button" onClick={signAdd} disabled={busy === "add"}>
              {busy === "add" ? t.chainBusy : t.signReady}
            </button>
            <button className="btn btn-ghost" type="button" onClick={clearSecret}>
              {t.savedSecret}
            </button>
          </div>
        </div>
      ) : null}

      {txHashes.length > 0 ? (
        <ul className="tx-list">
          {txHashes.map((hash) => (
            <li key={hash}>
              <span>{t.txLabel}</span>{" "}
              <a href={txUrl(txNet, hash)} target="_blank" rel="noreferrer">
                {t.viewTx}
              </a>
              <span className="mono">{hash}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {errorText ? (
        <p id="chain-error" className="chain-error" role="alert">
          {errorText}
        </p>
      ) : null}
    </article>
  );
}

function prefixedStorage(net: NearNet): StorageService {
  const prefix = `keycage-wallet:${net}:`;
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

function readHash(outcome: void | FinalExecutionOutcome | null | undefined): string | null {
  if (!outcome || typeof outcome !== "object") return null;
  const id = outcome.transaction_outcome?.id;
  if (typeof id === "string" && id) return id;
  const hash = outcome.transaction?.hash;
  return typeof hash === "string" && hash ? hash : null;
}

function AccountBlock({
  title,
  view,
  net,
  labels,
  listId,
  deleteTarget,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  deleteBusy,
}: {
  title: string;
  view: ChainAccount;
  net: NearNet;
  labels: ReturnType<typeof useI18n>["t"];
  listId?: string;
  deleteTarget?: string | null;
  onAskDelete?: (publicKey: string) => void;
  onCancelDelete?: () => void;
  onConfirmDelete?: (publicKey: string) => void;
  deleteBusy?: boolean;
}) {
  return (
    <section className="chain-block" id={listId} aria-label={title} data-chain-list={title}>
      <h3>{title}</h3>
      <p className="chain-account">
        <a href={accountUrl(net, view.accountId)} target="_blank" rel="noreferrer">
          {view.accountId}
        </a>
        <span className="mono">{view.balanceNear} NEAR</span>
      </p>
      {view.truncated ? <p className="section-copy">{labels.moreKeys}</p> : null}
      {view.keys.length === 0 ? (
        <p className="section-copy">{labels.noKeys}</p>
      ) : (
        <ul className="key-list">
          {view.keys.map((key, index) => {
            const call = key.permission.kind === "function" ? key.permission : null;
            const pending = deleteTarget === key.publicKey;
            return (
              <li className="key-row" key={`${key.publicKey}-${index}`}>
                <strong>{call ? labels.functionCall : labels.fullAccess}</strong>
                <p className="mono key-pub">{key.publicKey}</p>
                {call ? (
                  <p className="key-meta">
                    <span>
                      {labels.receiverLabel} {call.receiverId}
                    </span>
                    <span>
                      {labels.methodsLabel} {call.methodNames.length ? call.methodNames.join(", ") : labels.everyMethod}
                    </span>
                    <span>
                      {labels.allowanceLabel} {call.allowanceNear == null ? labels.unlimited : `${call.allowanceNear} NEAR`}
                    </span>
                  </p>
                ) : null}
                {call && onAskDelete ? (
                  pending ? (
                    <div className="actions">
                      <button className="btn btn-primary" type="button" onClick={() => onConfirmDelete?.(key.publicKey)} disabled={deleteBusy}>
                        {deleteBusy ? labels.chainBusy : labels.confirmDelete}
                      </button>
                      <button className="btn btn-ghost" type="button" onClick={onCancelDelete}>
                        {labels.cancel}
                      </button>
                    </div>
                  ) : (
                    <div className="actions">
                      <button className="btn btn-ghost" type="button" onClick={() => onAskDelete(key.publicKey)}>
                        {labels.deleteKey}
                      </button>
                    </div>
                  )
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
