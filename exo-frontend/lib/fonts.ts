// import { Inter, JetBrains_Mono } from "next/font/google";

// Mock fonts to avoid build errors in restricted environments (Google Fonts unreachable)
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
