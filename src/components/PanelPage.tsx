"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ChainKeys } from "@/components/ChainKeys";
import { VaultProof } from "@/components/VaultProof";
import { CountUp } from "@/components/CountUp";
import { SiteFooter, SiteHeader, usePageTitle } from "@/components/SiteChrome";
import {
  displayLabel,
  displayReason,
  presetLabel,
  useI18n,
} from "@/lib/i18n";
import {
  applyAttempt,
  attackSuite,
  createCage,
  createDefaultPolicy,
  resetWindow,
  toNearAccessKeyDraft,
  type CageState,
  type LedgerEntry,
  type Policy,
  type SpendAttempt,
} from "@/lib/policy";
import { PRESETS } from "@/lib/presets";

type Tab = "attack" | "fence" | "spend" | "log" | "judge" | "draft";

type AttackApi = {
  ok: boolean;
  summary?: {
    allowed: number;
    blocked: number;
    spentTodayNear: number;
    gasUsedNear: number;
  };
  ledger?: LedgerEntry[];
  error?: string;
};

const DEFAULT_LABELS = new Set(["Custom spend", "Özel harcama"]);

const JUDGE_TONE = {
  pay: "tone-allow",
  receiver: "tone-receiver",
  method: "tone-method",
  cap: "tone-cap",
  payroll: "tone-allow",
  daily: "tone-daily",
} as const;

function codeTone(code: string) {
  if (code === "ALLOWED") return "tone-allow";
  if (code === "RECEIVER_DENIED") return "tone-receiver";
  if (code === "METHOD_DENIED") return "tone-method";
  if (code === "PER_TX_CAP") return "tone-cap";
  if (code === "DAILY_CAP") return "tone-daily";
  return "tone-gas";
}

export function PanelPage() {
  const { lang, t } = useI18n();
  usePageTitle(t.panelPageTitle);
  const [tab, setTab] = useState<Tab>("attack");
  const [cage, setCage] = useState<CageState>(() => createCage());
  const [draft, setDraft] = useState<Policy>(() => createDefaultPolicy());
  const [customAttempt, setCustomAttempt] = useState({
    label: "Custom spend",
    receiverId: "vendor.acme.near",
    methodName: "transfer_stable",
    amountNear: "3",
    gasNear: "0.05",
  });
  const [apiResult, setApiResult] = useState<AttackApi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [burst, setBurst] = useState(0);
  const [serverBusy, setServerBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const keyDraft = useMemo(() => toNearAccessKeyDraft(cage.policy), [cage.policy]);
  const ordered = useMemo(() => [...cage.ledger].reverse(), [cage.ledger]);
  const allowedCount = cage.ledger.filter((entry) => entry.decision.ok).length;
  const blockedCount = cage.ledger.length - allowedCount;
  const remainingDaily = Math.max(
    0,
    Number((cage.policy.dailyBudgetNear - cage.spentTodayNear).toFixed(2)),
  );
  const remainingGas = Math.max(
    0,
    Number((cage.policy.gasAllowanceNear - cage.gasUsedNear).toFixed(2)),
  );

  const shownError =
    error === "numbers"
      ? t.errNumbers
      : error === "api"
        ? t.errApi
        : error === "network"
          ? t.errNet
          : error === "copy"
            ? t.copyFail
            : error;

  const judgeHits = {
    pay: cage.ledger.some(
      (entry) =>
        entry.decision.code === "ALLOWED" &&
        entry.attempt.receiverId === "invoices.demo.near",
    ),
    receiver: cage.ledger.some((entry) => entry.decision.code === "RECEIVER_DENIED"),
    method: cage.ledger.some((entry) => entry.decision.code === "METHOD_DENIED"),
    cap: cage.ledger.some((entry) => entry.decision.code === "PER_TX_CAP"),
    payroll: cage.ledger.some(
      (entry) =>
        entry.decision.code === "ALLOWED" &&
        entry.attempt.receiverId === "payroll.demo.near",
    ),
    daily: cage.ledger.some((entry) => entry.decision.code === "DAILY_CAP"),
  };

  function loadPreset(id: string) {
    const preset = PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setDraft(preset.policy);
    setCage(createCage(preset.policy));
    setApiResult(null);
    setError(null);
    setTab("fence");
  }

  function runLocalSuite() {
    setError(null);
    startTransition(() => {
      let next = createCage(cage.policy);
      for (const attempt of attackSuite()) next = applyAttempt(next, attempt);
      setCage(next);
      setBurst((n) => n + 1);
      setTab("attack");
    });
  }

  async function runServerSuite() {
    setError(null);
    setServerBusy(true);
    try {
      const res = await fetch("/api/attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy: cage.policy }),
      });
      const data = (await res.json()) as AttackApi;
      if (!data.ok) {
        setError("api");
        return;
      }
      setApiResult(data);
      if (data.ledger) {
        setCage((prev) => ({
          ...prev,
          spentTodayNear: data.summary?.spentTodayNear ?? prev.spentTodayNear,
          gasUsedNear: data.summary?.gasUsedNear ?? prev.gasUsedNear,
          ledger: data.ledger || prev.ledger,
        }));
        setBurst((n) => n + 1);
      }
    } catch {
      setError("network");
    } finally {
      setServerBusy(false);
    }
  }

  function tryCustom() {
    setError(null);
    const amountNear = Number(customAttempt.amountNear);
    const gasNear = Number(customAttempt.gasNear);
    if (!Number.isFinite(amountNear) || !Number.isFinite(gasNear)) {
      setError("numbers");
      return;
    }
    const attempt: SpendAttempt = {
      id: `custom-${Date.now()}`,
      label: customAttempt.label || "Custom spend",
      receiverId: customAttempt.receiverId,
      methodName: customAttempt.methodName,
      amountNear,
      gasNear,
      atIso: new Date().toISOString(),
    };
    setCage((prev) => applyAttempt(prev, attempt));
    setBurst((n) => n + 1);
    setTab("log");
  }

  const spendLabel = DEFAULT_LABELS.has(customAttempt.label)
    ? lang === "tr"
      ? "Özel harcama"
      : "Custom spend"
    : customAttempt.label;

  function resultText() {
    return [
      "KeyCage",
      `${t.allowed} ${allowedCount}`,
      `${t.blocked} ${blockedCount}`,
      cage.ledger.map((entry) => entry.decision.code).join("\n"),
      "https://keycage.kutluhaneth.com",
    ].join("\n");
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(resultText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("copy");
    }
  }

  async function shareResult() {
    const text = resultText();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "KeyCage", text });
        return;
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      }
    }
    await copyResult();
  }

  const tabs = [
    ["attack", t.tabAttack],
    ["fence", t.tabFence],
    ["spend", t.tabSpend],
    ["log", t.tabLog],
    ["judge", t.tabJudge],
    ["draft", t.tabDraft],
  ] as const;

  return (
    <main className="shell" id="top">
      <a className="skip" href="#panel">
        {t.skipPanel}
      </a>
      <SiteHeader />
      <p className="back-row">
        <Link href="/">{t.backHome}</Link>
      </p>
      <div className="panel" id="panel">
        <nav className="panel-nav" aria-label={t.panelNav}>
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "is-on" : ""}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
            >
              <NavIcon id={id} />
              {label}
            </button>
          ))}
        </nav>
        <div className="panel-main">
          {tab === "attack" ? (
            <div className="stack">
            <article className="card">
              <div className="title-row">
                <p className="kicker">{t.panelTitle}</p>
                <span className={`status-pill${cage.ledger.length ? " is-live" : ""}`}>
                  <i />
                  {cage.ledger.length ? t.statusLive : t.statusReady}
                </span>
              </div>
              <h1 className="section-title">{t.tabAttack}</h1>
              <p className="section-copy">{t.simRun}</p>
              <p className="section-copy">{t.judgeCopy}</p>
              <div className="actions">
                <button className="btn btn-primary" type="button" onClick={runLocalSuite} disabled={pending || serverBusy}>
                  {pending ? t.running : t.runSuite}
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={runServerSuite}
                  disabled={serverBusy || pending}
                  aria-busy={serverBusy}
                  aria-describedby="server-hint"
                >
                  {serverBusy ? t.running : t.runServer}
                </button>
              </div>
              <p id="server-hint" className="btn-hint mono">
                {t.runServerHint}
              </p>
              {apiResult?.summary ? (
                <p className="api-note">
                  {t.serverPath}: {apiResult.summary.allowed} {t.allowedInline}, {apiResult.summary.blocked} {t.blockedInline}.
                </p>
              ) : null}
              <div className="meters" style={{ marginTop: 24 }}>
                <Meter label={t.daily} used={cage.spentTodayNear} total={cage.policy.dailyBudgetNear} leftWord={t.nearLeft} usedWord={t.nearUsed} ofWord={t.of} />
                <Meter label={t.gas} used={cage.gasUsedNear} total={cage.policy.gasAllowanceNear} leftWord={t.nearLeft} usedWord={t.nearUsed} ofWord={t.of} />
              </div>
              <div className="counts" style={{ marginTop: 16 }}>
                <div className="count ok">
                  <p>{t.allowed}</p>
                  <strong>
                    <CountUp value={allowedCount} />
                  </strong>
                </div>
                <div className="count deny">
                  <p>{t.blocked}</p>
                  <strong>
                    <CountUp value={blockedCount} />
                  </strong>
                </div>
              </div>
              <p className="section-copy">
                {t.active}: {cage.policy.name}. {t.dailyLeft} {remainingDaily} NEAR. {t.gasLeft} {remainingGas} NEAR.
              </p>
              {ordered.length > 0 ? (
                <ol className="verdict-rail" key={burst} style={{ marginTop: 16 }}>
                  {ordered.map((entry) => (
                    <li key={entry.attempt.id} className={`verdict ${codeTone(entry.decision.code)}`}>
                      <span className="badge">{entry.decision.code}</span>
                      <span className="verdict-name">{displayLabel(lang, entry.attempt.label)}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="empty-log">
                  <span className="empty-mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M8 10h8M8 14h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <p>{t.railEmpty}</p>
                </div>
              )}
            </article>
            <VaultProof />
            </div>
          ) : null}

          {tab === "fence" ? (
            <article className="card">
              <div className="card-head">
                <div>
                  <h1 className="section-title">{t.desk}</h1>
                  <p className="section-copy">{t.deskCopy}</p>
                </div>
                <div className="presets" role="group" aria-label={t.presets}>
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      className={`preset${draft.name === preset.policy.name ? " is-on" : ""}`}
                      onClick={() => loadPreset(preset.id)}
                      type="button"
                      aria-pressed={draft.name === preset.policy.name}
                    >
                      {presetLabel(lang, preset.id, preset.title)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-grid">
                <label className="field-label">
                  <span>{t.fenceName}</span>
                  <input className="field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </label>
                <label className="field-label">
                  <span>{t.txCap}</span>
                  <input className="field mono" type="number" min={0} step="0.1" value={draft.perTxMaxNear} onChange={(e) => setDraft({ ...draft, perTxMaxNear: Number(e.target.value) })} />
                </label>
                <label className="field-label">
                  <span>{t.daily}</span>
                  <input className="field mono" type="number" min={0} step="0.1" value={draft.dailyBudgetNear} onChange={(e) => setDraft({ ...draft, dailyBudgetNear: Number(e.target.value) })} />
                </label>
                <label className="field-label">
                  <span>{t.gas}</span>
                  <input className="field mono" type="number" min={0} step="0.1" value={draft.gasAllowanceNear} onChange={(e) => setDraft({ ...draft, gasAllowanceNear: Number(e.target.value) })} />
                </label>
                <label className="field-label span-2">
                  <span>{t.receivers}</span>
                  <textarea className="field mono" value={draft.allowReceivers.join("\n")} onChange={(e) => setDraft({ ...draft, allowReceivers: splitList(e.target.value) })} />
                </label>
                <label className="field-label span-2">
                  <span>{t.methods}</span>
                  <textarea className="field mono" value={draft.allowMethods.join("\n")} onChange={(e) => setDraft({ ...draft, allowMethods: splitList(e.target.value) })} />
                </label>
              </div>
              <div className="actions">
                <button className="btn btn-primary" type="button" onClick={() => { setCage(createCage(draft)); setApiResult(null); }}>
                  {t.lock}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setCage((current) => resetWindow(current))}>
                  {t.reset}
                </button>
              </div>
            </article>
          ) : null}

          {tab === "spend" ? (
            <article className="card">
              <h1 className="section-title">{t.tryTitle}</h1>
              <p className="section-copy">{t.tryCopy}</p>
              <div className="stack" style={{ marginTop: 18 }}>
                <input className="field" aria-label={t.spendLabel} placeholder={t.labelPh} value={spendLabel} onChange={(e) => setCustomAttempt({ ...customAttempt, label: e.target.value })} />
                <input className="field mono" aria-label={t.receiverPh} placeholder="receiver_id" value={customAttempt.receiverId} onChange={(e) => setCustomAttempt({ ...customAttempt, receiverId: e.target.value })} />
                <input className="field mono" aria-label={t.methodPh} placeholder="method_name" value={customAttempt.methodName} onChange={(e) => setCustomAttempt({ ...customAttempt, methodName: e.target.value })} />
                <div className="counts">
                  <input className="field mono" aria-label={t.amountPh} placeholder={t.amountPh} value={customAttempt.amountNear} onChange={(e) => setCustomAttempt({ ...customAttempt, amountNear: e.target.value })} />
                  <input className="field mono" aria-label={t.gasPh} placeholder={t.gasPh} value={customAttempt.gasNear} onChange={(e) => setCustomAttempt({ ...customAttempt, gasNear: e.target.value })} />
                </div>
                <button className="btn btn-primary" type="button" onClick={tryCustom}>
                  {t.tryBtn}
                </button>
              </div>
              {shownError ? <p className="notice" role="alert">{shownError}</p> : null}
            </article>
          ) : null}

          {tab === "log" ? (
            <article className="card" id="log">
              <div className="card-head">
                <div>
                  <h1 className="section-title">{t.log}</h1>
                  <p className="section-copy">{t.logCopy}</p>
                </div>
                <div className="log-tools">
                  <button className="btn btn-ghost" type="button" onClick={copyResult}>
                    {copied ? t.copied : t.copyResult}
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={shareResult}>
                    {t.share}
                  </button>
                  <span className="event-count mono">
                    {cage.ledger.length} {t.events}
                  </span>
                </div>
              </div>
              <div className="log-list" aria-live="polite" aria-busy={serverBusy || pending}>
                {cage.ledger.length === 0 ? (
                  <div className="empty-log">
                    <span className="empty-mark" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M5 7h14v11H5z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M8 7V5h8v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </span>
                    <p>{t.empty}</p>
                  </div>
                ) : (
                  cage.ledger.map((entry, index) => (
                    <LogRow key={entry.attempt.id} entry={entry} policy={cage.policy} index={index} />
                  ))
                )}
              </div>
            </article>
          ) : null}

          {tab === "judge" ? (
            <article className="card">
              <h1 className="section-title">{t.judgeTitle}</h1>
              <p className="section-copy">{t.judgeCopy}</p>
              <ul className="checks">
                {(
                  [
                    ["pay", t.hitPay],
                    ["receiver", t.hitReceiver],
                    ["method", t.hitMethod],
                    ["cap", t.hitCap],
                    ["payroll", t.hitPayroll],
                    ["daily", t.hitDaily],
                  ] as const
                ).map(([key, label]) => {
                  const hit = judgeHits[key];
                  return (
                    <li key={key} className={`check ${JUDGE_TONE[key]}${hit ? " is-hit" : ""}`}>
                      <span className="check-mark" aria-hidden>{hit ? "✓" : ""}</span>
                      <span>
                        <strong className="mono">{label}</strong>
                        <span className="check-state">{hit ? t.seen : t.waiting}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </article>
          ) : null}

          {tab === "draft" ? (
            <div className="stack">
              <article className="card draft">
                <span className="status-pill">
                  <i />
                  {t.simPill}
                </span>
                <h1 className="section-title">{t.draft}</h1>
                <p className="section-copy">{t.draftCopy}</p>
                <pre className="mono">{JSON.stringify(keyDraft, null, 2)}</pre>
              </article>
              <ChainKeys policy={cage.policy} />
            </div>
          ) : null}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}

function Meter({
  label,
  used,
  total,
  leftWord,
  usedWord,
  ofWord,
}: {
  label: string;
  used: number;
  total: number;
  leftWord: string;
  usedWord: string;
  ofWord: string;
}) {
  const safeTotal = total > 0 ? total : 0;
  const ratio = safeTotal === 0 ? 0 : Math.min(1, Math.max(0, used / safeTotal));
  const left = Math.max(0, Number((safeTotal - used).toFixed(2)));
  return (
    <div className="meter">
      <div className="meter-top">
        <strong>{label}</strong>
        <span className="mono">{left} {leftWord}</span>
      </div>
      <div className="track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={safeTotal} aria-valuenow={used}>
        <div className={`fill${ratio >= 0.85 ? " is-hot" : ""}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <p className="meter-note mono">{used} {ofWord} {safeTotal} {usedWord}</p>
    </div>
  );
}

function LogRow({ entry, policy, index }: { entry: LedgerEntry; policy: Policy; index: number }) {
  const { lang, t } = useI18n();
  return (
    <article className={`log-row ${codeTone(entry.decision.code)}`} style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <div className="log-top">
        <span className="badge">{entry.decision.code}</span>
        <span className="log-label">{displayLabel(lang, entry.attempt.label)}</span>
        <span className="log-amount mono">{entry.attempt.amountNear} NEAR, {t.gasWord} {entry.attempt.gasNear}</span>
      </div>
      <p className="log-call mono">
        <span>{entry.attempt.receiverId}</span>
        <span>::{entry.attempt.methodName}</span>
      </p>
      <p className="log-reason">{displayReason(lang, entry, policy)}</p>
    </article>
  );
}

function NavIcon({ id }: { id: Tab }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (id === "attack") {
    return (
      <svg {...common}>
        <path d="M5 19V10M12 19V5M19 19v-7" />
      </svg>
    );
  }
  if (id === "fence") {
    return (
      <svg {...common}>
        <path d="M5 4v16M10 4v16M15 4v16M19 4v16M4 8h16M4 14h16" />
      </svg>
    );
  }
  if (id === "spend") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7" />
        <path d="M12 8v8M9 11h6" />
      </svg>
    );
  }
  if (id === "log") {
    return (
      <svg {...common}>
        <path d="M7 4h10v16H7zM10 8h4M10 12h4M10 16h3" />
      </svg>
    );
  }
  if (id === "judge") {
    return (
      <svg {...common}>
        <path d="M6 8l6-4 6 4v5c0 4-2.5 6.5-6 8-3.5-1.5-6-4-6-8V8z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="8" cy="12" r="3" />
      <path d="M11 12h9M17 9v6" />
    </svg>
  );
}

function splitList(raw: string) {
  return raw.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
}
