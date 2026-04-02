import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vote100games.com"),
  title: {
    default: "Vote 100 Games",
    template: "%s | Vote 100 Games",
  },
  description:
    "Vote for your Top 10 games of all time and help Bandit Banks build the internet's Top 100 Games list.",
  applicationName: "Vote 100 Games",
  keywords: [
    "Vote 100 Games",
    "vote100games",
    "top 100 games",
    "best video games",
    "greatest games of all time",
    "video game voting",
    "top 10 games",
    "Bandit Banks",
  ],
  authors: [{ name: "Bandit Banks" }],
  creator: "Bandit Banks",
  publisher: "Vote 100 Games",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Vote 100 Games",
    description:
      "Bandit Banks is building a Top 100 Games list where the internet decides. Submit your Top 10 and help shape the final video.",
    url: "https://vote100games.com",
    siteName: "Vote 100 Games",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vote 100 Games",
    description:
      "Submit your Top 10 games and help Bandit Banks build the internet's Top 100 Games list.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}