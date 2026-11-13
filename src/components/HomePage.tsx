"use client";

import Link from "next/link";
import { DotField } from "@/components/DotField";
import { HeroCage } from "@/components/HeroCage";
import { FaqList, SiteFooter, SiteHeader, usePageTitle } from "@/components/SiteChrome";
import { useI18n } from "@/lib/i18n";

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
            allowed={0}
            blocked={0}
            allowedWord={t.allowed}
            blockedWord={t.blocked}
            pulse={0}
          />
        </div>
      </section>

      <section className="section" id="steps">
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
          <article className="case case-treasury">
            <p className="kicker">{t.example}</p>
            <h3>{t.caseTreasuryT}</h3>
            <p>{t.caseTreasuryB}</p>
            <p className="case-example">{t.exTreasury}</p>
            <div className="case-badges">
              <span className="badge tone-allow">ALLOWED</span>
            </div>
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
          </article>
          <article className="case case-research">
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
