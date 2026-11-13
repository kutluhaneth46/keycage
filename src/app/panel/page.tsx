import type { Metadata } from "next";
import { PanelPage } from "@/components/PanelPage";

export const metadata: Metadata = {
  title: "KeyCage panel",
  description:
    "I run the attack suite, lock the fence, and read every allow and every block.",
  alternates: {
    canonical: "https://keycage.kutluhaneth.com/panel",
  },
};

export default function Page() {
  return <PanelPage />;
}
