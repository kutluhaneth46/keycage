import type { Metadata } from "next";
import { PanelPage } from "@/components/PanelPage";

export const metadata: Metadata = {
  title: "KeyCage panel",
  description:
    "I run the simulated attack suite, lock the fence, and read a public NEAR account.",
  alternates: {
    canonical: "https://keycage.kutluhaneth.com/panel",
  },
};

export default function Page() {
  return <PanelPage />;
}
