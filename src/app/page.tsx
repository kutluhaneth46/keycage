import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";

export const metadata: Metadata = {
  title: "KeyCage. I fence agent spending on NEAR",
  description:
    "I fence what an agent can spend on NEAR. I lock receivers, methods, a transaction cap, a daily budget, and a gas allowance.",
  alternates: {
    canonical: "https://keycage.kutluhaneth.com",
  },
};

export default function Page() {
  return <HomePage />;
}
