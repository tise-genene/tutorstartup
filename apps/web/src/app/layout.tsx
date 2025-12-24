import type { Metadata } from "next";
import {
  Space_Grotesk,
  Chivo_Mono,
  Noto_Sans_Ethiopic,
} from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const preHydrationInitScript = `(() => {
  try {
    const theme = localStorage.getItem('tutorstartup.theme');
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    }
    const locale = localStorage.getItem('tutorstartup.locale');
    if (locale === 'en' || locale === 'am') {
      document.documentElement.lang = locale;
    }
  } catch {
    // ignore
  }
})();`;

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const mono = Chivo_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const ethiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  variable: "--font-ethiopic",
});

export const metadata: Metadata = {
  title: "Tutorstartup",
  description: "Tutor marketplace playground",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preHydrationInitScript }} />
      </head>
      <body
        className={`${display.variable} ${mono.variable} ${ethiopic.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
