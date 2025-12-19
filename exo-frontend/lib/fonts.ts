// import { Inter, JetBrains_Mono } from "next/font/google";

// Mock fonts structure. Actual fonts are loaded via CDN in globals.css (Inter + JetBrains Mono)
// This mock ensures Next.js build doesn't fail in restricted environments while keeping var access
export const fontSans = {
  variable: "--font-sans",
  style: { fontFamily: 'ui-sans-serif, system-ui, sans-serif' },
};

export const fontMono = {
  variable: "--font-mono",
  style: { fontFamily: 'ui-monospace, SFMono-Regular, monospace' },
};

/*
export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});
*/
