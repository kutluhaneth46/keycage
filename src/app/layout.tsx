import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#00EC97",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://keycage.kutluhaneth.com"),
  title: "KeyCage. I fence agent spending on NEAR",
  description:
    "I fence what an agent can spend on NEAR. I lock receivers, methods, a transaction cap, a daily budget, and a gas allowance. I can replay every allow and every deny.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "KeyCage. I fence agent spending on NEAR",
    description:
      "I fence what an agent can spend on NEAR. I lock receivers, methods, a transaction cap, a daily budget, and a gas allowance.",
    url: "https://keycage.kutluhaneth.com",
    siteName: "KeyCage",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "KeyCage logo" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KeyCage. I fence agent spending on NEAR",
    description:
      "I fence what an agent can spend on NEAR. I lock receivers, methods, a transaction cap, a daily budget, and a gas allowance.",
    images: ["/og.png"],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
