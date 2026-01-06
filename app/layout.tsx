import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/components/AuthProvider";

const gtWalsheimPro = localFont({
  src: "../fonts/GTWalsheimPro-Regular.woff",
  variable: "--font-gt-walsheim-pro",
  display: "swap",
  weight: "400",
  fallback: ['system-ui', 'sans-serif'],
});

const geistMono = localFont({
  src: "../fonts/GTWalsheimPro-Regular.woff",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Outlivion VPN - Безопасный и быстрый VPN",
  description: "Безопасный и быстрый VPN сервис для защиты вашей приватности в интернете. Поддержка до 5 устройств одновременно.",
  keywords: ["VPN", "безопасность", "приватность", "интернет", "защита данных"],
  openGraph: {
    title: "Outlivion VPN - Безопасный и быстрый VPN",
    description: "Безопасный и быстрый VPN сервис для защиты вашей приватности",
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary",
    title: "Outlivion VPN",
    description: "Безопасный и быстрый VPN сервис",
  },
  robots: {
    index: false, // Telegram Mini Apps обычно не индексируются
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${gtWalsheimPro.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
