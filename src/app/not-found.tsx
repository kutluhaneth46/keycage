"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = `KeyCage. ${t.missingTitle}`;
  }, [t.missingTitle]);

  return (
    <main className="shell">
      <SiteHeader />
      <div className="missing">
        <h1>{t.missingTitle}</h1>
        <p className="section-copy">{t.missingBody}</p>
        <Link className="btn btn-primary" href="/">
          {t.backHome}
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
