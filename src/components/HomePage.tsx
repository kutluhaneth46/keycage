"use client";

import Link from "next/link";
import { CountUp } from "@/components/CountUp";
import { DotField } from "@/components/DotField";
import { HeroCage } from "@/components/HeroCage";
import { FaqList, SiteFooter, SiteHeader, usePageTitle } from "@/components/SiteChrome";
import { useI18n } from "@/lib/i18n";
import { accountUrl, txUrl } from "@/lib/near";
import { VAULT_ACCOUNT, VAULT_INJECTION, VAULT_PROOFS } from "@/lib/vaultProof";

export function HomePage() {
  const { t } = useI18n();
  usePageTitle(t.pageTitle);

  return (
    <main className="shell" id="top">
      <a className="skip" href="#steps">
        {t.skipHome}
      </a>
      <SiteHeader />

      <section className="hero">
        <DotField />
        <div className="hero-type">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.hero}</h1>
          <p className="lede">{t.lede}</p>
          <p className="local-note">{t.localNote}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href="/panel">
              {t.openPanel}
            </Link>
          </div>
          <div className="stats" aria-label={t.statsLabel}>
            <p className="stat">
              <strong>
                <CountUp value={6} />
              </strong>
              <span>{t.statAttempts}</span>
            </p>
            <p className="stat is-allow">
              <strong>
                <CountUp value={2} />
              </strong>
              <span>{t.allowed}</span>
            </p>
            <p className="stat is-block">
              <strong>
                <CountUp value={4} />
              </strong>
              <span>{t.blocked}</span>
            </p>
          </div>
          <aside className="home-proof" aria-label={t.homeChain}>
            <p className="kicker">{t.homeChain}</p>
            <p>{t.homeChainCopy}</p>
            <p className="home-proof-links">
              <a href={accountUrl("testnet", VAULT_ACCOUNT)} target="_blank" rel="noreferrer">
                {VAULT_ACCOUNT}
              </a>
              <a href={txUrl("testnet", VAULT_PROOFS[0].hash)} target="_blank" rel="noreferrer">
                {VAULT_PROOFS[0].code}
              </a>
              <a href={txUrl("testnet", VAULT_INJECTION.hash)} target="_blank" rel="noreferrer">
                {VAULT_INJECTION.code}
              </a>
              <Link href="/panel#vault">{t.openProof}</Link>
            </p>
          </aside>
        </div>
        <div className="hero-visual">
          <HeroCage
            agent={t.visualAgent}
            cage={t.visualCage}
            near={t.visualNear}
            allow={t.visualAllow}
            block={t.visualBlock}
            caption={t.visualCaption}
            allowed={0}
            blocked={0}
            allowedWord={t.allowed}
            blockedWord={t.blocked}
            pulse={0}
          />
        </div>
      </section>

      <section className="section" id="steps" aria-labelledby="how-title">
        <div className="section-head">
          <h2 className="section-title" id="how-title">
            {t.howTitle}
          </h2>
          <p className="section-copy">{t.howCopy}</p>
        </div>
        <ol className="steps">
          <li className="step">
            <span className="card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 8h16M4 12h10M4 16h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <h2>{t.step1t}</h2>
              <p>{t.step1b}</p>
            </div>
          </li>
          <li className="step">
            <span className="card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="8" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M11 12h9M17 9v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <h2>{t.step2t}</h2>
              <p>{t.step2b}</p>
            </div>
          </li>
          <li className="step">
            <span className="card-icon is-block" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M6 12l4 4 8-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
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
          <article className="case case-treasury">
            <span className="card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </span>
            <p className="kicker">{t.example}</p>
            <h3>{t.caseTreasuryT}</h3>
            <p>{t.caseTreasuryB}</p>
            <p className="case-example">{t.exTreasury}</p>
            <div className="case-badges">
              <span className="badge tone-allow">ALLOWED</span>
            </div>
          </article>
          <article className="case case-payroll">
            <span className="card-icon is-block" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="8" cy="9" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="16" cy="9" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4 18c.6-2.4 2.4-3.5 4-3.5s3.4 1.1 4 3.5M12 18c.6-2.4 2.4-3.5 4-3.5s3.4 1.1 4 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <p className="kicker">{t.example}</p>
            <h3>{t.casePayrollT}</h3>
            <p>{t.casePayrollB}</p>
            <p className="case-example">{t.exPayroll}</p>
            <div className="case-badges">
              <span className="badge tone-allow">ALLOWED</span>
              <span className="badge tone-daily">DAILY_CAP</span>
            </div>
          </article>
          <article className="case case-research">
            <span className="card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M16 16l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <p className="kicker">{t.example}</p>
            <h3>{t.caseResearchT}</h3>
            <p>{t.caseResearchB}</p>
            <p className="case-example">{t.exResearch}</p>
            <div className="case-badges">
              <span className="badge tone-cap">0.5 NEAR</span>
            </div>
          </article>
        </div>
      </section>

      <section className="section" aria-labelledby="arch-title">
        <article className="arch">
          <h2 className="section-title" id="arch-title">
            {t.archTitle}
          </h2>
          <p className="section-copy">{t.archBody}</p>
        </article>
      </section>

      <FaqList />
      <SiteFooter />
    </main>
  );
}
