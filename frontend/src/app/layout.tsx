import type { Metadata } from "next";
import { Geist_Mono, Hind_Siliguri, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import ClientOnly from "@/components/ClientOnly";
import ErrorBoundary from "@/components/ErrorBoundary";
import { FeedbackProvider } from "@/components/ui/Feedback";
import "@/lib/chunkErrorHandler";

// Same pairing as adsyclub.com so the two products read as one brand:
// Inter carries the Latin and the figures, Hind Siliguri the Bangla.
// Loaded through next/font, which self-hosts the files and injects the
// metrics — so there is no request to Google and no layout shift, unlike
// AdsyClub's @import.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Geist Sans was dropped — nothing referenced --font-geist-sans once Inter
// took over, so it was a font download for nothing. Mono stays: `font-mono`
// is still used for codes and references.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // `template` gives every page "<page> | OxyManager" without each route
  // repeating the brand, while `default` covers the ones that set no title.
  title: {
    default: "Oxymanager | Your Smart Assistant",
    template: "%s | Oxymanager",
  },
  description:
    "দোকান আর ব্যবসার হিসাব এক জায়গায় — প্রোডাক্ট, বিক্রি, বাকি, কর্মচারী আর অ্যানালিটিক্স।",
  applicationName: "Oxymanager",
  icons: {
    icon: "/favicon-32.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Oxymanager | Your Smart Assistant",
    description:
      "দোকান আর ব্যবসার হিসাব এক জায়গায় — প্রোডাক্ট, বিক্রি, বাকি, কর্মচারী আর অ্যানালিটিক্স।",
    siteName: "Oxymanager",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* The whole UI is Bangla; `lang` drives font selection, shaping and
       screen-reader pronunciation, so it must say so. */
    /* The font variables MUST sit on <html>, not <body>. `--font-app` in
       globals.css is declared on :root and references them; a var() inside a
       custom property is resolved on the element that DECLARES it, so with
       the classes on <body> those lookups failed at :root and --font-app
       collapsed to invalid — every screen silently fell back to the Tailwind
       default stack. */
    <html
      lang="bn"
      className={`${inter.variable} ${hindSiliguri.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased overflow-x-clip"
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ClientOnly
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            <AuthProvider>
              <CurrencyProvider>
                <FeedbackProvider>{children}</FeedbackProvider>
              </CurrencyProvider>
            </AuthProvider>
          </ClientOnly>
        </ErrorBoundary>
      </body>
    </html>
  );
}
