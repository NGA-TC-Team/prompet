import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Prompet — local-first prompt manager",
  description:
    "Browser-local prompt manager with templates, tags, and shareable URLs. Inspired by knqyf263/pet. Powered by NextgenAI",
};

const THEME_INIT_SCRIPT = `
try {
  var t = localStorage.getItem('theme') || 'system';
  var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) document.documentElement.classList.add('dark');
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Inline theme init — runs before paint to avoid a light-mode flash.
            We use a plain <script dangerouslySetInnerHTML> instead of next/script
            because Next 16 emits a console error when <Script> is rendered as a
            React child inside the document body during client rendering. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeProvider>
          <NuqsAdapter>
            {children}
            <Toaster richColors position="bottom-right" theme="system" />
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
