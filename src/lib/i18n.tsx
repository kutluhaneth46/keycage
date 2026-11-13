"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LedgerEntry, Policy } from "@/lib/policy";

export type Lang = "en" | "tr";

const copy = {
  en: {
    langLabel: "Language",
    security: "Security track",
    brief: "Hackathon note",
    eyebrow: "NEAR agents",
    hero: "I fence agent spending on NEAR.",
    pageTitle: "KeyCage. I fence agent spending on NEAR",
    lede: "The account stays with me. I give the agent a function call key, and that key can spend only inside the fence I set.",
    runSuite: "Run the attack suite",
    runServer: "Test on the server",
    runServerHint: "/api/attack",
    openDesk: "Open the desk",
    judgeLink: "Show the judge list",
    openPanel: "Open the panel",
    backHome: "Back to the homepage",
    panelTitle: "Panel",
    panelPageTitle: "KeyCage panel",
    panelNav: "Panel sections",
    tabAttack: "Attack suite",
    tabFence: "Fence",
    tabSpend: "Try a spend",
    tabLog: "Log",
    tabJudge: "Judge list",
    tabDraft: "Key draft",
    skipHome: "Skip to the steps",
    skipPanel: "Skip to the panel",
    step1t: "Set the fence",
    step1b: "I pick the receivers, the methods, the transaction cap, the daily budget, and the gas allowance.",
    step2t: "Hand out the key",
    step2b: "The agent can call only what I allow. It never gets the full account.",
    step3t: "Read every verdict",
    step3b: "Each spend is allowed or blocked. I can read the reason here or at /api/attack.",
    desk: "Policy desk",
    deskCopy: "These fields are the fence. I lock them, then I run the attack suite.",
    presets: "Presets",
    fenceName: "Fence name",
    txCap: "Transaction cap, NEAR",
    daily: "Daily budget, NEAR",
    gas: "Gas allowance, NEAR",
    receivers: "Allowed receivers, one account per line",
    methods: "Allowed methods, one name per line",
    lock: "Lock the policy",
    reset: "Reset the day",
    live: "Live fence",
    active: "Active policy",
    dailyLeft: "Left today",
    gasLeft: "Gas left",
    nearLeft: "NEAR left",
    nearUsed: "NEAR used",
    of: "of",
    allowed: "Allowed",
    blocked: "Blocked",
    allowedInline: "allowed",
    blockedInline: "blocked",
    tryTitle: "Try one spend",
    tryCopy: "I send one call through the fence I locked.",
    spendLabel: "Spend name",
    labelPh: "Name",
    receiverPh: "Receiver account",
    methodPh: "Method name",
    amountPh: "Amount, NEAR",
    gasPh: "Gas, NEAR",
    tryBtn: "Try this spend",
    serverPath: "API result",
    log: "Decision log",
    logCopy: "Newest first. What I allow and what I block has to match the fence I locked.",
    events: "events",
    empty: "No attempts yet.",
    draft: "Access key draft",
    draftCopy: "This is the function call key the fence would issue. One receiver, the methods I allow, and the gas allowance.",
    why1t: "Built on NEAR",
    why1b: "A function call key already names one receiver, a method list, and a gas allowance. I add the daily budget and the transaction cap.",
    why2t: "One run for judges",
    why2b: "The run covers one allowed payment, one unknown receiver, one forbidden method, the transaction cap, and the daily budget. /api/attack returns the same run.",
    why3t: "I keep the keys",
    why3b: "I set the fence. The agent never gets the full account. A drain or an overspend stops at the fence, and I can read the reason.",
    errNumbers: "Amount and gas have to be numbers.",
    errApi: "The attack API failed.",
    errNet: "The network call failed.",
    custom: "Custom spend",
    gasWord: "gas",
    skip: "Skip to the desk",
    judgeTitle: "Judge list",
    judgeCopy: "I run the attack suite. These six rows have to show up in the log.",
    seen: "Matched",
    waiting: "Not yet",
    hitPay: "ALLOWED for invoices.demo.near pay_invoice",
    hitReceiver: "RECEIVER_DENIED for attacker.near",
    hitMethod: "METHOD_DENIED for delete_account",
    hitCap: "PER_TX_CAP for the 12 NEAR transfer",
    hitPayroll: "ALLOWED for payroll.demo.near run_payroll",
    hitDaily: "DAILY_CAP for the 5 NEAR transfer after payroll",
    archTitle: "How I place this on NEAR",
    archBody: "A NEAR function call key can name only one receiver. I put one vault in that slot. The receiver list, the transaction cap, and the daily budget live in the vault. The allowance on the key is the gas budget. At zero, the key is dead until I issue a new one.",
    faqTitle: "What judges ask",
    faqIntro: "Four answers I keep ready before a judge runs the suite.",
    faq1q: "What does one attack run prove?",
    faq1a: "Six spends, in a fixed order. I allow one invoice. I block an unknown receiver. I block a forbidden method. I block a transfer over the transaction cap. I allow a payroll that still fits the daily budget. I block the next transfer because it breaks the day. /api/attack returns the same six.",
    faq2q: "Why can the key name only one receiver?",
    faq2a: "That limit comes from NEAR. I put the vault in the single slot. The receiver list, the method list, the transaction cap, and the daily budget live in the vault.",
    faq3q: "Does KeyCage talk to a live NEAR network?",
    faq3a: "No. This page and /api/attack run the same rules on this machine. The access key draft is the shape I would submit. I use no network, no database, and no secret.",
    faq4q: "How do I share a result?",
    faq4a: "After a run I copy the result. It lists how many I allowed, how many I blocked, and the codes.",
    copyResult: "Copy result",
    copied: "Copied",
    share: "Share",
    copyFail: "I could not copy the result.",
    running: "Running",
    footerLine: "I publish this as KutluhanETH.",
    homeLink: "Back to the desk",
    missingTitle: "I cannot find this page.",
    missingBody: "That address is not part of KeyCage.",
    localNote: "This page is a local simulator. I do not touch a live network.",
    chipsLabel: "The five rules of the fence",
    chipReceivers: "Receiver list",
    chipMethods: "Method list",
    chipTx: "Transaction cap",
    chipDaily: "Daily budget",
    chipGas: "Gas allowance",
    visualAgent: "Agent",
    visualCage: "Fence",
    visualNear: "NEAR",
    visualAllow: "ALLOWED",
    visualBlock: "BLOCKED",
    visualCaption: "A spend that fits goes through. A spend that breaks a rule bounces back.",
    railEmpty: "Run the attack suite. Six spends hit the fence.",
    railLive: "Verdicts from this run",
    flowTitle: "Who holds what",
    flowCopy: "I keep the account. I give the agent only a key. The fence sits between them.",
    flowOwnerT: "I hold the account",
    flowOwnerB: "The full key stays with me. I set the fence, and I can take the agent key back.",
    flowOwnerHolds: "The full account",
    flowFenceT: "Fence and vault",
    flowFenceB: "I put a vault contract in the single receiver slot of the key. The lists and the caps live there.",
    flowFenceHolds: "The rules",
    flowKeyT: "Agent key",
    flowKeyB: "The agent can call only the methods I allow. It never sees the full account.",
    flowKeyHolds: "One function call key",
    flowNearT: "NEAR",
    flowNearB: "A spend that clears the fence can move. A blocked spend never leaves the fence.",
    flowNearHolds: "Allowed spends",
    holdsLabel: "Holds",
    casesTitle: "Where I use it",
    casesCopy: "Three jobs. The same fence. Different limits.",
    caseTreasuryT: "Treasury agent",
    caseTreasuryB: "I let it pay invoices and payroll. A transfer to an unknown account stops at the fence. The attack suite uses this fence.",
    casePayrollT: "Payroll",
    casePayrollB: "A payroll run can pass while it still fits today. The next transfer that breaks the day is blocked.",
    caseResearchT: "Research buyer",
    caseResearchB: "I send the research buyer to one data merchant. The transaction cap and the daily budget stay small.",
    caseLoad: "Load this fence",
    caseSee: "See it in the suite",
    example: "Example",
    exTreasury: "An invoice of 2.5 NEAR to invoices.demo.near",
    exPayroll: "Payroll of 4 NEAR, then a 5 NEAR transfer that breaks the day",
    exResearch: "A data buy with a 0.5 NEAR cap",
    siteLabel: "My site",
    xLabel: "My X profile",
    gitLabel: "KeyCage on GitHub",
  },
  tr: {
    langLabel: "Dil",
    security: "Güvenlik kulvarı",
    brief: "Hackathon notu",
    eyebrow: "NEAR ajanları",
    hero: "NEAR'da ajan harcamasını çitle çeviririm.",
    pageTitle: "KeyCage. NEAR'da ajan harcamasını çitle çeviririm.",
    lede: "Hesap bende kalır. Ajana bir fonksiyon çağrı anahtarı veririm. Bu anahtar yalnızca çitin içinde harcar.",
    runSuite: "Saldırı turunu başlat",
    runServer: "Sunucuda test et",
    runServerHint: "/api/attack",
    openDesk: "Masayı aç",
    judgeLink: "Hakem listesini göster",
    openPanel: "Paneli aç",
    backHome: "Ana sayfaya dön",
    panelTitle: "Panel",
    panelPageTitle: "KeyCage paneli",
    panelNav: "Panel bölümleri",
    tabAttack: "Saldırı turu",
    tabFence: "Çit",
    tabSpend: "Harcama dene",
    tabLog: "Kayıt",
    tabJudge: "Hakem listesi",
    tabDraft: "Anahtar taslağı",
    skipHome: "Adımlara atla",
    skipPanel: "Panele atla",
    step1t: "Çiti kur",
    step1b: "İzinli receiver hesaplarını, method adlarını, işlem tavanını, günlük bütçeyi ve gaz hakkını ben seçerim.",
    step2t: "Anahtarı ver",
    step2b: "Ajan yalnızca izin verdiğim çağrıları yapar. Tam hesabı hiç alamaz.",
    step3t: "Her kararı oku",
    step3b: "Her harcama ya izin alır ya da engellenir. Gerekçeyi burada ve /api/attack üzerinde yeniden okurum.",
    desk: "Politika masası",
    deskCopy: "Bu alanlar çitin kendisidir. Önce kilitlerim, sonra saldırı turunu başlatırım.",
    presets: "Hazır politikalar",
    fenceName: "Çitin adı",
    txCap: "İşlem tavanı, NEAR",
    daily: "Günlük bütçe, NEAR",
    gas: "Gaz hakkı, NEAR",
    receivers: "İzinli receiver hesapları, her satıra bir tane",
    methods: "İzinli method adları, her satıra bir tane",
    lock: "Politikayı kilitle",
    reset: "Günü sıfırla",
    live: "Canlı çit",
    active: "Etkin politika",
    dailyLeft: "Bugün kalan",
    gasLeft: "Kalan gaz",
    nearLeft: "NEAR kaldı",
    nearUsed: "NEAR harcandı",
    of: "/",
    allowed: "İzinli",
    blocked: "Engelli",
    allowedInline: "izinli",
    blockedInline: "engelli",
    tryTitle: "Tek harcama dene",
    tryCopy: "Kilitlediğim çitten tek bir çağrı geçiririm.",
    spendLabel: "Harcama adı",
    labelPh: "Ad",
    receiverPh: "Receiver hesabı",
    methodPh: "Method adı",
    amountPh: "Tutar, NEAR",
    gasPh: "Gaz, NEAR",
    tryBtn: "Bu harcamayı dene",
    serverPath: "API sonucu",
    log: "Karar kaydı",
    logCopy: "En yeni kayıt üsttedir. İzin ve engel, kilitlediğim çitle aynı olmalıdır.",
    events: "olay",
    empty: "Henüz deneme yok.",
    draft: "Erişim anahtarı taslağı",
    draftCopy: "Çitin vereceği fonksiyon çağrı anahtarı budur. Tek receiver, izin verdiğim method adları ve gaz hakkı burada durur.",
    why1t: "NEAR anahtarının sınırı",
    why1b: "Fonksiyon çağrı anahtarı zaten tek bir receiver, bir method listesi ve bir gaz hakkı taşır. Günlük bütçeyi ve işlem tavanını ben eklerim.",
    why2t: "Hakem için tek tur",
    why2b: "Turda izinli bir ödeme, listede olmayan bir receiver, yasak bir method, işlem tavanı ve günlük bütçe vardır. /api/attack aynı turu verir.",
    why3t: "Anahtarlar bende",
    why3b: "Çiti ben kurarım. Ajan tam hesabı alamaz. Boşaltma veya aşım çitte durur ve gerekçeyi okurum.",
    errNumbers: "Tutar ve gaz birer sayı olmalıdır.",
    errApi: "Saldırı servisi yanıt vermedi.",
    errNet: "Ağ çağrısı tamamlanamadı.",
    custom: "Özel harcama",
    gasWord: "gaz",
    skip: "Politikaya atla",
    judgeTitle: "Hakem listesi",
    judgeCopy: "Saldırı turunu başlatırım. Kayıtta şu altı satır görünmelidir.",
    seen: "Eşleşti",
    waiting: "Henüz yok",
    hitPay: "ALLOWED, invoices.demo.near pay_invoice",
    hitReceiver: "RECEIVER_DENIED, attacker.near",
    hitMethod: "METHOD_DENIED, delete_account",
    hitCap: "PER_TX_CAP, 12 NEAR",
    hitPayroll: "ALLOWED, payroll.demo.near run_payroll",
    hitDaily: "DAILY_CAP, maaştan sonra 5 NEAR",
    archTitle: "Bunu NEAR üzerinde nasıl kurarım",
    archBody: "Fonksiyon çağrı anahtarı tek bir receiver adlandırır. O yere kasayı koyarım. Receiver listesi, işlem tavanı ve günlük bütçe kasada durur. Anahtarın üzerindeki hak gaz bütçesidir. Sıfıra inince anahtar ölür. Yenisini ben veririm.",
    faqTitle: "Hakemin soruları",
    faqIntro: "Turu başlatmadan önce hazır tuttuğum dört yanıt.",
    faq1q: "Bir saldırı turu neyi kanıtlar?",
    faq1a: "Sıra sabittir ve altı harcama vardır. Bir faturaya izin veririm. Listede olmayan bir receiver hesabını engellerim. Yasak bir methodu engellerim. İşlem tavanını aşan aktarımı engellerim. Günlük bütçeye sığan maaşa izin veririm. Günü bozan sonraki aktarımı engellerim. /api/attack aynı altı sonucu verir.",
    faq2q: "Anahtar neden tek bir receiver taşır?",
    faq2a: "Bu sınır NEAR'dan gelir. Tek yuvaya kasayı koyarım. Receiver listesi, method listesi, işlem tavanı ve günlük bütçe kasada durur.",
    faq3q: "KeyCage canlı bir NEAR ağına bağlanır mı?",
    faq3a: "Hayır. Bu sayfa ve /api/attack aynı kuralları bu makinede çalıştırır. Erişim anahtarı taslağı, göndereceğim biçimdir. Ağ, veritabanı veya gizli bilgi kullanmam.",
    faq4q: "Sonucu nasıl paylaşırım?",
    faq4a: "Tur bitince sonucu kopyalarım. Kaç harcamaya izin verdiğim, kaçını engellediğim ve kodlar yazılır.",
    copyResult: "Sonucu kopyala",
    copied: "Kopyalandı",
    share: "Paylaş",
    copyFail: "Sonucu kopyalayamadım.",
    running: "Çalışıyor",
    footerLine: "Bunu KutluhanETH adıyla yayımlıyorum.",
    homeLink: "Politikaya dön",
    missingTitle: "Bu sayfayı bulamıyorum.",
    missingBody: "Bu adres KeyCage'de yok.",
    localNote: "Bu sayfa yerel bir simülatördür. Canlı ağa bağlanmam.",
    chipsLabel: "Çitin beş kuralı",
    chipReceivers: "Receiver listesi",
    chipMethods: "Method listesi",
    chipTx: "İşlem tavanı",
    chipDaily: "Günlük bütçe",
    chipGas: "Gaz hakkı",
    visualAgent: "Ajan",
    visualCage: "Çit",
    visualNear: "NEAR",
    visualAllow: "ALLOWED",
    visualBlock: "BLOCKED",
    visualCaption: "Sığan harcama geçer. Kuralı bozan harcama geri seker.",
    railEmpty: "Saldırı turunu başlat. Altı harcama çite çarpar.",
    railLive: "Bu turun kararları",
    flowTitle: "Kim neyi tutar",
    flowCopy: "Hesap bende kalır. Ajana yalnızca bir anahtar veririm. Çit, hesabın ve anahtarın arasında durur.",
    flowOwnerT: "Hesap bende",
    flowOwnerB: "Tam anahtar bende kalır. Çiti ben kurarım ve ajan anahtarını geri alabilirim.",
    flowOwnerHolds: "Tam hesap",
    flowFenceT: "Çit ve kasa",
    flowFenceB: "Anahtarın tek receiver yerine bir kasa kontratı koyarım. Listeler ve tavanlar orada durur.",
    flowFenceHolds: "Kurallar",
    flowKeyT: "Ajan anahtarı",
    flowKeyB: "Ajan yalnızca izin verdiğim methodları çağırır. Tam hesabı hiç görmez.",
    flowKeyHolds: "Tek function call key",
    flowNearT: "NEAR",
    flowNearB: "Çiti geçen harcama hareket eder. Engellenen harcama çitten çıkmaz.",
    flowNearHolds: "İzinli harcama",
    holdsLabel: "Tuttuğu şey",
    casesTitle: "Nerede kullanırım",
    casesCopy: "Üç iş vardır. Çit aynıdır. Sınırlar farklıdır.",
    caseTreasuryT: "Hazine ajanı",
    caseTreasuryB: "Faturaları ve maaşı bu ajana ödetirim. Bilinmeyen bir hesaba giden aktarım çitte durur. Saldırı turu bu çiti kullanır.",
    casePayrollT: "Maaş",
    casePayrollB: "Maaş bugünkü bütçeye sığarsa izin veririm. Günü aşan sonraki aktarımı engellerim.",
    caseResearchT: "Araştırma ajanı",
    caseResearchB: "Araştırma ajanını tek bir veri satıcısına bağlarım. İşlem tavanı ve günlük bütçe küçük kalır.",
    caseLoad: "Bu çiti yükle",
    caseSee: "Turda gör",
    example: "Örnek",
    exTreasury: "invoices.demo.near hesabına 2.5 NEAR fatura",
    exPayroll: "4 NEAR maaş, ardından günü aşan 5 NEAR aktarım",
    exResearch: "0.5 NEAR tavanlı bir veri alımı",
    siteLabel: "Sitem",
    xLabel: "X profilim",
    gitLabel: "KeyCage GitHub deposu",
  },
} as const;

const presetNames: Record<string, Record<Lang, string>> = {
  treasury: { en: "Treasury agent", tr: "Hazine ajanı" },
  research: { en: "Research buyer", tr: "Araştırma ajanı" },
  ops: { en: "Ops runner", tr: "Operasyon ajanı" },
};

const labels: Record<Lang, Record<string, string>> = {
  en: {
    "Normal invoice pay": "Normal invoice pay",
    "Drain to unknown wallet": "Drain to unknown wallet",
    "Forbidden method": "Forbidden method",
    "Over per-tx cap": "Over the transaction cap",
    "Second payroll (still in budget)": "Second payroll still in the budget",
    "Blow daily budget": "Over the daily budget",
    "Custom spend": "Custom spend",
  },
  tr: {
    "Normal invoice pay": "Normal fatura ödemesi",
    "Drain to unknown wallet": "Bilinmeyen cüzdana aktarım",
    "Forbidden method": "İzin verilmeyen method",
    "Over per-tx cap": "İşlem tavanını aşan tutar",
    "Second payroll (still in budget)": "Bütçe içindeki ikinci maaş",
    "Blow daily budget": "Günlük bütçeyi aşan tutar",
    "Custom spend": "Özel harcama",
    "Özel harcama": "Özel harcama",
  },
};

type Copy = { [K in keyof (typeof copy)["en"]]: string };

type Ctx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Copy;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("keycage-lang");
    const next: Lang = saved === "tr" || saved === "en" ? saved : "en";
    const timer = window.setTimeout(() => {
      setLangState(next);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    if (!ready) return;
    window.localStorage.setItem("keycage-lang", lang);
  }, [lang, ready]);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang: setLangState,
      t: copy[lang],
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("Missing language provider");
  return ctx;
}

export function presetLabel(lang: Lang, id: string, fallback: string) {
  return presetNames[id]?.[lang] ?? fallback;
}

export function displayLabel(lang: Lang, label: string) {
  return labels[lang][label] ?? label;
}

export function displayReason(lang: Lang, entry: LedgerEntry, policy: Policy) {
  const receiver = entry.attempt.receiverId;
  const method = entry.attempt.methodName;
  const amount = entry.attempt.amountNear;
  const gas = entry.attempt.gasNear;
  const cap = policy.perTxMaxNear;
  const leftDay = entry.decision.remainingDailyNear;
  const leftGas = entry.decision.remainingGasNear;
  const code = entry.decision.code;

  if (lang === "tr") {
    if (code === "ALLOWED") {
      return "Receiver, method, işlem tavanı, günlük bütçe ve gaz hakkı uygundur.";
    }
    if (code === "RECEIVER_DENIED") {
      return `${receiver} receiver listesinde yok. Fonksiyon çağrı anahtarı yalnızca onaylı tek bir hesaba gider.`;
    }
    if (code === "METHOD_DENIED") {
      return `${method} bu çitin method listesinde yok.`;
    }
    if (code === "PER_TX_CAP") {
      return `${amount} NEAR, işlem tavanı ${cap} NEAR'ın üstünde.`;
    }
    if (code === "DAILY_CAP") {
      return `${amount} NEAR bugünkü bütçeyi aşıyor. Kalan ${leftDay} NEAR.`;
    }
    return `${gas} NEAR gaz, kalan gaz hakkını aşıyor. Kalan ${leftGas} NEAR.`;
  }

  if (code === "ALLOWED") {
    return "The receiver, the method, the transaction cap, the daily budget, and the gas allowance all pass.";
  }
  if (code === "RECEIVER_DENIED") {
    return `${receiver} is not on the receiver list. A function call key can name only one approved receiver.`;
  }
  if (code === "METHOD_DENIED") {
    return `${method} is not on the method list.`;
  }
  if (code === "PER_TX_CAP") {
    return `${amount} NEAR is over the ${cap} NEAR transaction cap.`;
  }
  if (code === "DAILY_CAP") {
    return `${amount} NEAR does not fit in today's budget. ${leftDay} NEAR is left.`;
  }
  return `${gas} NEAR of gas is over the ${leftGas} NEAR still left.`;
}
