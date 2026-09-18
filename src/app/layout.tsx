import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "ネコのて — 途切れても、戻ればいい。",
    template: "%s | ネコのて",
  },
  description:
    "気持ち・お金・通院を、ひとつの場所に。あなたのペースで記録できる、暮らしの小さな居場所。",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "ネコのて — 途切れても、戻ればいい。",
    description: "猫の手も借りたい日に、猫が手を貸す。",
    locale: "ja_JP",
    type: "website",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f6f0",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" data-stimulus="2" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
