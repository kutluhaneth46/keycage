"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = `KeyCage. ${t.missingTitle}`;
  }, [t.missingTitle]);

  return (
    <main className="shell missing">
      <Logo className="brand-logo" title="KeyCage" />
      <h1>{t.missingTitle}</h1>
      <p className="section-copy">{t.missingBody}</p>
      <Link className="btn btn-primary" href="/">
        {t.homeLink}
      </Link>
    </main>
  );
}
