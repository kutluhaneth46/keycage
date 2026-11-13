import type { Policy } from "./policy";
import { createDefaultPolicy } from "./policy";

export type Preset = {
  id: string;
  title: string;
  blurb: string;
  policy: Policy;
};

export const PRESETS: Preset[] = [
  {
    id: "treasury",
    title: "Treasury agent",
    blurb: "I let it pay invoices and payroll. The transaction cap stays tight and the day stays wider.",
    policy: createDefaultPolicy(),
  },
  {
    id: "research",
    title: "Research buyer",
    blurb: "I let it call one data merchant. The caps stay small.",
    policy: {
      name: "Research buyer fence",
      perTxMaxNear: 0.5,
      dailyBudgetNear: 2,
      gasAllowanceNear: 0.5,
      allowReceivers: ["data.oracle.near"],
      allowMethods: ["buy_feed", "renew_seat"],
      windowStartIso: new Date().toISOString(),
    },
  },
  {
    id: "ops",
    title: "Ops runner",
    blurb: "I let it send stable transfers to one vendor.",
    policy: {
      name: "Ops runner fence",
      perTxMaxNear: 3,
      dailyBudgetNear: 9,
      gasAllowanceNear: 1,
      allowReceivers: ["vendor.acme.near"],
      allowMethods: ["transfer_stable"],
      windowStartIso: new Date().toISOString(),
    },
  },
];
