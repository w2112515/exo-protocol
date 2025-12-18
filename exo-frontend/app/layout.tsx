import type { Metadata } from "next";
import { fontSans, fontMono } from "@/lib/fonts";
import { QueryProvider } from "@/components/providers/query-provider";
import { SolanaWalletProvider } from "@/components/providers/solana-wallet-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exo Protocol",
  description: "Skill-Native PayFi for the Agent Economy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${fontSans.variable} ${fontMono.variable} antialiased bg-background text-foreground`}
      >
        <SolanaWalletProvider>
          <QueryProvider>{children}</QueryProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}

