import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Escape Master — Your next level starts here",
  description:
    "Explore a 100-level coding adventure. Solve bite-sized programming challenges, earn rewards, and level up your skills.",
  applicationName: "Code Escape Master",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const adsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        {adsenseEnabled && adsenseClientId && (
          <Script
            async
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
