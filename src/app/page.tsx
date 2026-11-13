"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { DotField } from "@/components/DotField";
import { HeroCage } from "@/components/HeroCage";
import { Logo } from "@/components/Logo";
import { ScrambleBadge } from "@/components/ScrambleBadge";
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

type AttackApi = {
  ok: boolean;
  summary?: {
    attempts: number;
    allowed: number;
    blocked: number;
    spentTodayNear: number;
    gasUsedNear: number;
    remainingDailyNear: number;
    remainingGasNear: number;
  };
  ledger?: LedgerEntry[];
  nearAccessKeyDraft?: unknown;
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

function reveal(id: string) {
  const node = document.getElementById(id);
  if (!node) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrow = window.matchMedia("(max-width: 979px)").matches;
  if (!narrow && id === "verdicts") return;
  node.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: id === "verdicts" ? "center" : "start",
  });
}

export default function Home() {
  const { lang, setLang, t } = useI18n();
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

  useEffect(() => {
    const title = t.pageTitle;
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    const timer = window.setTimeout(apply, 50);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [t.pageTitle]);

  const keyDraft = useMemo(() => toNearAccessKeyDraft(cage.policy), [cage.policy]);
  const remainingDaily = Math.max(
    0,
    Number((cage.policy.dailyBudgetNear - cage.spentTodayNear).toFixed(2)),
  );
  const remainingGas = Math.max(
    0,
    Number((cage.policy.gasAllowanceNear - cage.gasUsedNear).toFixed(2)),
  );
  const allowedCount = cage.ledger.filter((e) => e.decision.ok).length;
  const blockedCount = cage.ledger.length - allowedCount;
  const ordered = useMemo(() => [...cage.ledger].reverse(), [cage.ledger]);

  function loadPreset(id: string, scroll = false) {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setDraft(preset.policy);
    setCage(createCage(preset.policy));
    setApiResult(null);
    setError(null);
    if (scroll) reveal("desk");
  }

  function runLocalSuite() {
    setError(null);
    startTransition(() => {
      let next = createCage(cage.policy);
      for (const attempt of attackSuite()) {
        next = applyAttempt(next, attempt);
      }
      setCage(next);
      setBurst((n) => n + 1);
      reveal("verdicts");
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
        reveal("verdicts");
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
  }

  function switchLang(next: "en" | "tr") {
    setLang(next);
    setCustomAttempt((prev) =>
      DEFAULT_LABELS.has(prev.label)
        ? { ...prev, label: next === "tr" ? "Özel harcama" : "Custom spend" }
        : prev,
    );
  }

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

  function resultText() {
    const codes = cage.ledger.map((entry) => entry.decision.code).join("\n");
    return [
      "KeyCage",
      `${t.allowed} ${allowedCount}`,
      `${t.blocked} ${blockedCount}`,
      codes,
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
        if (shareError instanceof DOMException && shareError.name === "AbortError") {
          return;
        }
      }
    }
    await copyResult();
  }

  return (
    <main className="shell" id="top">
      <a className="skip" href="#desk">
        {t.skip}
      </a>
      <header className="topbar">
        <div className="brand">
          <Logo className="brand-logo" title="KeyCage" />
          <div>
            <p className="brand-name">KeyCage</p>
            <p className="brand-meta">{t.security}</p>
          </div>
        </div>
        <div className="header-tools">
          <div className="lang" role="group" aria-label={t.langLabel}>
            <button
              type="button"
              className={lang === "en" ? "is-on" : ""}
              onClick={() => switchLang("en")}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
            <button
              type="button"
              className={lang === "tr" ? "is-on" : ""}
              onClick={() => switchLang("tr")}
              aria-pressed={lang === "tr"}
            >
              TR
            </button>
          </div>
          <a
            className="track-link"
            href="https://nearhackathon.com/HACKATHON.md"
            target="_blank"
            rel="noreferrer"
          >
            {t.brief}
          </a>
        </div>
      </header>

      <section className="hero">
        <DotField />
        <div className="hero-type">
          <ScrambleBadge text={t.eyebrow} />
          <h1>{t.hero}</h1>
          <p className="lede">{t.lede}</p>
          <p className="local-note">{t.localNote}</p>
          <div className="hero-actions">
            <div className="hero-pair">
              <button
                className="btn btn-primary"
                onClick={runLocalSuite}
                disabled={pending || serverBusy}
                type="button"
              >
                {pending ? t.running : t.runSuite}
              </button>
              <button
                className="btn btn-ghost"
                onClick={runServerSuite}
                disabled={serverBusy || pending}
                type="button"
                aria-busy={serverBusy}
                aria-describedby="server-hint"
              >
                {serverBusy ? t.running : t.runServer}
              </button>
            </div>
            <p id="server-hint" className="btn-hint mono">
              {t.runServerHint}
            </p>
            <div className="hero-links">
              <a href="#desk">{t.openDesk}</a>
              <a href="#judge">{t.judgeLink}</a>
            </div>
          </div>
          <ul className="chips" aria-label={t.chipsLabel}>
            <li>{t.chipReceivers}</li>
            <li>{t.chipMethods}</li>
            <li>{t.chipTx}</li>
            <li>{t.chipDaily}</li>
            <li>{t.chipGas}</li>
          </ul>
        </div>
        <div className="hero-visual">
            <HeroCage
              agent={t.visualAgent}
              cage={t.visualCage}
              near={t.visualNear}
              allow={t.visualAllow}
              block={t.visualBlock}
              caption={t.visualCaption}
              allowed={allowedCount}
              blocked={blockedCount}
              allowedWord={t.allowed}
              blockedWord={t.blocked}
              pulse={burst}
            />
            <div id="verdicts">
              {ordered.length === 0 ? (
                <p className="verdict-empty">{t.railEmpty}</p>
              ) : (
                <>
                  <p className="verdict-label">{t.railLive}</p>
                  <ol className="verdict-rail" key={burst}>
                    {ordered.map((entry, index) => (
                      <li
                        key={entry.attempt.id}
                        className={`verdict ${codeTone(entry.decision.code)}`}
                        style={{ animationDelay: `${index * 70}ms` }}
                      >
                        <span className="badge">{entry.decision.code}</span>
                        <span className="verdict-name">
                          {displayLabel(lang, entry.attempt.label)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          </div>
      </section>

      <section className="section">
        <ol className="steps">
          <li className="step">
            <span className="step-index">01</span>
            <div>
              <h2>{t.step1t}</h2>
              <p>{t.step1b}</p>
            </div>
          </li>
          <li className="step">
            <span className="step-index">02</span>
            <div>
              <h2>{t.step2t}</h2>
              <p>{t.step2b}</p>
            </div>
          </li>
          <li className="step">
            <span className="step-index">03</span>
            <div>
              <h2>{t.step3t}</h2>
              <p>{t.step3b}</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="section" id="flow" aria-labelledby="flow-title">
        <div className="section-head">
          <h2 className="section-title" id="flow-title">
            {t.flowTitle}
          </h2>
          <p className="section-copy">{t.flowCopy}</p>
        </div>
        <ol className="flow">
          {(
            [
              [t.flowOwnerT, t.flowOwnerB, t.flowOwnerHolds],
              [t.flowFenceT, t.flowFenceB, t.flowFenceHolds],
              [t.flowKeyT, t.flowKeyB, t.flowKeyHolds],
              [t.flowNearT, t.flowNearB, t.flowNearHolds],
            ] as const
          ).map(([title, body, holds], index) => (
            <li key={title}>
              <span className="flow-index">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
              <p className="holds">
                {t.holdsLabel}
                <strong>{holds}</strong>
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" id="cases" aria-labelledby="cases-title">
        <div className="section-head">
          <h2 className="section-title" id="cases-title">
            {t.casesTitle}
          </h2>
          <p className="section-copy">{t.casesCopy}</p>
        </div>
        <div className="cases">
          <article
            className={`case case-treasury${draft.name === "Treasury agent fence" ? " is-on" : ""}`}
          >
            <p className="kicker">{t.example}</p>
            <h3>{t.caseTreasuryT}</h3>
            <p>{t.caseTreasuryB}</p>
            <p className="case-example">{t.exTreasury}</p>
            <div className="case-badges">
              <span className="badge tone-allow">ALLOWED</span>
            </div>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => loadPreset("treasury", true)}
              aria-pressed={draft.name === "Treasury agent fence"}
            >
              {t.caseLoad}
            </button>
          </article>
          <article className="case case-payroll">
            <p className="kicker">{t.example}</p>
            <h3>{t.casePayrollT}</h3>
            <p>{t.casePayrollB}</p>
            <p className="case-example">{t.exPayroll}</p>
            <div className="case-badges">
              <span className="badge tone-allow">ALLOWED</span>
              <span className="badge tone-daily">DAILY_CAP</span>
            </div>
            <a className="btn btn-ghost" href="#judge">
              {t.caseSee}
            </a>
          </article>
          <article
            className={`case case-research${draft.name === "Research buyer fence" ? " is-on" : ""}`}
          >
            <p className="kicker">{t.example}</p>
            <h3>{t.caseResearchT}</h3>
            <p>{t.caseResearchB}</p>
            <p className="case-example">{t.exResearch}</p>
            <div className="case-badges">
              <span className="badge tone-cap">0.5 NEAR</span>
            </div>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => loadPreset("research", true)}
              aria-pressed={draft.name === "Research buyer fence"}
            >
              {t.caseLoad}
            </button>
          </article>
        </div>
      </section>

      <section className="section" id="judge" aria-labelledby="judge-title">
        <article className="card">
          <p className="kicker">00</p>
          <h2 className="section-title" id="judge-title">
            {t.judgeTitle}
          </h2>
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
                <li
                  key={key}
                  className={`check ${JUDGE_TONE[key]}${hit ? " is-hit" : ""}`}
                >
                  <span className="check-mark" aria-hidden>
                    {hit ? "✓" : ""}
                  </span>
                  <span>
                    <strong className="mono">{label}</strong>
                    <span className="check-state">{hit ? t.seen : t.waiting}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <section className="section" id="desk">
        <article className="card">
          <div className="card-head">
            <div>
              <p className="kicker">01</p>
              <h2 className="section-title">{t.desk}</h2>
              <p className="section-copy">{t.deskCopy}</p>
            </div>
            <div className="presets" role="group" aria-label={t.presets}>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={`preset${draft.name === p.policy.name ? " is-on" : ""}`}
                  onClick={() => loadPreset(p.id)}
                  type="button"
                  aria-pressed={draft.name === p.policy.name}
                >
                  {presetLabel(lang, p.id, p.title)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <label className="field-label">
              <span>{t.fenceName}</span>
              <input
                className="field"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label className="field-label">
              <span>{t.txCap}</span>
              <input
                className="field mono"
                type="number"
                min={0}
                step="0.1"
                value={draft.perTxMaxNear}
                onChange={(e) =>
                  setDraft({ ...draft, perTxMaxNear: Number(e.target.value) })
                }
              />
            </label>
            <label className="field-label">
              <span>{t.daily}</span>
              <input
                className="field mono"
                type="number"
                min={0}
                step="0.1"
                value={draft.dailyBudgetNear}
                onChange={(e) =>
                  setDraft({ ...draft, dailyBudgetNear: Number(e.target.value) })
                }
              />
            </label>
            <label className="field-label">
              <span>{t.gas}</span>
              <input
                className="field mono"
                type="number"
                min={0}
                step="0.1"
                value={draft.gasAllowanceNear}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    gasAllowanceNear: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="field-label span-2">
              <span>{t.receivers}</span>
              <textarea
                className="field mono"
                value={draft.allowReceivers.join("\n")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    allowReceivers: splitList(e.target.value),
                  })
                }
              />
            </label>
            <label className="field-label span-2">
              <span>{t.methods}</span>
              <textarea
                className="field mono"
                value={draft.allowMethods.join("\n")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    allowMethods: splitList(e.target.value),
                  })
                }
              />
            </label>
          </div>

          <div className="actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setCage(createCage(draft));
                setApiResult(null);
              }}
            >
              {t.lock}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setCage((c) => resetWindow(c))}
            >
              {t.reset}
            </button>
          </div>
        </article>
      </section>

      <section className="section" id="fence">
        <article className="card">
          <div className="card-head">
            <div>
              <p className="kicker">02</p>
              <h2 className="section-title">{t.live}</h2>
              <p className="section-copy">
                {t.active}: {cage.policy.name}. {t.dailyLeft} {remainingDaily} NEAR.{" "}
                {t.gasLeft} {remainingGas} NEAR.
              </p>
            </div>
          </div>
          <div className="meters">
            <Meter
              label={t.daily}
              used={cage.spentTodayNear}
              total={cage.policy.dailyBudgetNear}
              leftWord={t.nearLeft}
              usedWord={t.nearUsed}
              ofWord={t.of}
            />
            <Meter
              label={t.gas}
              used={cage.gasUsedNear}
              total={cage.policy.gasAllowanceNear}
              leftWord={t.nearLeft}
              usedWord={t.nearUsed}
              ofWord={t.of}
            />
          </div>
          <div className="counts" style={{ marginTop: 16 }}>
            <div className="count ok">
              <p>{t.allowed}</p>
              <strong>{allowedCount}</strong>
            </div>
            <div className={`count deny${burst ? " is-live" : ""}`}>
              <p>{t.blocked}</p>
              <strong>{blockedCount}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="section split" id="suite">
        <article className="card">
          <p className="kicker">03</p>
          <h2 className="section-title">{t.tryTitle}</h2>
          <p className="section-copy">{t.tryCopy}</p>
          <div className="stack" style={{ marginTop: 18 }}>
            <input
              className="field"
              aria-label={t.spendLabel}
              placeholder={t.labelPh}
              value={customAttempt.label}
              onChange={(e) =>
                setCustomAttempt({ ...customAttempt, label: e.target.value })
              }
            />
            <input
              className="field mono"
              aria-label={t.receiverPh}
              placeholder="receiver_id"
              value={customAttempt.receiverId}
              onChange={(e) =>
                setCustomAttempt({
                  ...customAttempt,
                  receiverId: e.target.value,
                })
              }
            />
            <input
              className="field mono"
              aria-label={t.methodPh}
              placeholder="method_name"
              value={customAttempt.methodName}
              onChange={(e) =>
                setCustomAttempt({
                  ...customAttempt,
                  methodName: e.target.value,
                })
              }
            />
            <div className="counts">
              <input
                className="field mono"
                aria-label={t.amountPh}
                placeholder={t.amountPh}
                value={customAttempt.amountNear}
                onChange={(e) =>
                  setCustomAttempt({
                    ...customAttempt,
                    amountNear: e.target.value,
                  })
                }
              />
              <input
                className="field mono"
                aria-label={t.gasPh}
                placeholder={t.gasPh}
                value={customAttempt.gasNear}
                onChange={(e) =>
                  setCustomAttempt({ ...customAttempt, gasNear: e.target.value })
                }
              />
            </div>
            <button className="btn btn-primary" type="button" onClick={tryCustom}>
              {t.tryBtn}
            </button>
          </div>
          {shownError ? (
            <p className="notice" role="alert">
              {shownError}
            </p>
          ) : null}
          {apiResult?.summary ? (
            <p className="api-note">
              {t.serverPath}: {apiResult.summary.allowed} {t.allowedInline},{" "}
              {apiResult.summary.blocked} {t.blockedInline}.
            </p>
          ) : null}
        </article>

        <article className="card" id="log">
          <div className="card-head">
            <div>
              <p className="kicker">04</p>
              <h2 className="section-title">{t.log}</h2>
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
          <div
            className="log-list"
            key={burst}
            aria-live="polite"
            aria-busy={serverBusy || pending}
          >
            {cage.ledger.length === 0 ? (
              <div className="empty-log">{t.empty}</div>
            ) : (
              cage.ledger.map((entry, index) => (
                <LogRow
                  key={entry.attempt.id}
                  entry={entry}
                  policy={cage.policy}
                  index={index}
                />
              ))
            )}
          </div>
        </article>
      </section>

      <section className="section" id="draft">
        <article className="card draft">
          <p className="kicker">05</p>
          <h2 className="section-title">{t.draft}</h2>
          <p className="section-copy">{t.draftCopy}</p>
          <pre className="mono">{JSON.stringify(keyDraft, null, 2)}</pre>
        </article>
      </section>

      <section className="section" aria-labelledby="arch-title">
        <article className="arch">
          <h2 className="section-title" id="arch-title">
            {t.archTitle}
          </h2>
          <p className="section-copy">{t.archBody}</p>
        </article>
      </section>

      <section className="section">
        <div className="reasons">
          <article className="card reason">
            <h3>{t.why1t}</h3>
            <p>{t.why1b}</p>
          </article>
          <article className="card reason">
            <h3>{t.why2t}</h3>
            <p>{t.why2b}</p>
          </article>
          <article className="card reason">
            <h3>{t.why3t}</h3>
            <p>{t.why3b}</p>
          </article>
        </div>
      </section>

      <FaqList />

      <SiteFooter />
    </main>
  );
}

function FaqList() {
  const { t } = useI18n();
  const [open, setOpen] = useState(0);
  const items = [
    ["01", t.faq1q, t.faq1a],
    ["02", t.faq2q, t.faq2a],
    ["03", t.faq3q, t.faq3a],
    ["04", t.faq4q, t.faq4a],
  ] as const;

  return (
    <section className="section" id="faq" aria-labelledby="faq-title">
      <div className="section-head">
        <h2 className="section-title" id="faq-title">
          {t.faqTitle}
        </h2>
        <p className="section-copy">{t.faqIntro}</p>
      </div>
      <div className="faq">
        {items.map(([num, question, answer], index) => {
          const isOpen = open === index;
          return (
            <div className={`faq-item${isOpen ? " is-open" : ""}`} key={num}>
              <button
                type="button"
                className="faq-summary"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : index)}
              >
                <span className="faq-num">{num}</span>
                <span className="faq-q">{question}</span>
                <svg className="faq-chevron" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="faq-panel" aria-hidden={!isOpen}>
                <p>{answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <p>{t.footerLine}</p>
      <nav className="footer-links" aria-label="KutluhanETH">
        <a href="https://kutluhaneth.com" target="_blank" rel="noreferrer" aria-label={t.siteLabel}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M3 12h18M12 3c2.4 2.7 3.6 5.7 3.6 9s-1.2 6.3-3.6 9c-2.4-2.7-3.6-5.7-3.6-9s1.2-6.3 3.6-9z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
        </a>
        <a href="https://x.com/kutluhaneth" target="_blank" rel="noreferrer" aria-label={t.xLabel}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            />
          </svg>
        </a>
        <a
          href="https://github.com/kutluhaneth46/keycage"
          target="_blank"
          rel="noreferrer"
          aria-label={t.gitLabel}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 .5C5.73.5.5 5.73.5 12.02c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"
            />
          </svg>
        </a>
      </nav>
    </footer>
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
        <span className="mono">
          {left} {leftWord}
        </span>
      </div>
      <div
        className="track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={used}
      >
        <div
          className={`fill${ratio >= 0.85 ? " is-hot" : ""}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <p className="meter-note mono">
        {used} {ofWord} {safeTotal} {usedWord}
      </p>
    </div>
  );
}

function LogRow({
  entry,
  policy,
  index,
}: {
  entry: LedgerEntry;
  policy: Policy;
  index: number;
}) {
  const { lang, t } = useI18n();
  return (
    <article
      className={`log-row is-fresh ${codeTone(entry.decision.code)}`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="log-top">
        <span className="badge">{entry.decision.code}</span>
        <span className="log-label">{displayLabel(lang, entry.attempt.label)}</span>
        <span className="log-amount mono">
          {entry.attempt.amountNear} NEAR, {t.gasWord} {entry.attempt.gasNear}
        </span>
      </div>
      <p className="log-call mono">
        <span>{entry.attempt.receiverId}</span>
        <span>::{entry.attempt.methodName}</span>
      </p>
      <p className="log-reason">{displayReason(lang, entry, policy)}</p>
    </article>
  );
}

function splitList(raw: string | string[]) {
  const text = Array.isArray(raw) ? raw.join("\n") : raw;
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
