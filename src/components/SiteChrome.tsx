"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";

export function SiteHeader() {
  const { lang, setLang, t } = useI18n();
  return (
    <header className="topbar">
      <Link href="/" className="brand">
        <Logo className="brand-logo" title="KeyCage" />
        <div>
          <p className="brand-name">KeyCage</p>
          <p className="brand-meta">{t.security}</p>
        </div>
      </Link>
      <div className="header-tools">
        <div className="lang" role="group" aria-label={t.langLabel}>
          <button
            type="button"
            className={lang === "en" ? "is-on" : ""}
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
          <button
            type="button"
            className={lang === "tr" ? "is-on" : ""}
            onClick={() => setLang("tr")}
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
  );
}

export function SiteFooter() {
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

export function FaqList() {
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

export function usePageTitle(title: string) {
  useEffect(() => {
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
  }, [title]);
}
