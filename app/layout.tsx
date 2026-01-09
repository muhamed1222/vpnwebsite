import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/components/AuthProvider";

const gtWalsheimPro = localFont({
  src: "../public/fonts/GTWalsheimPro-Regular.woff",
  variable: "--font-gt-walsheim-pro",
  display: "swap",
  weight: "400",
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
  preload: true, // Предзагрузка шрифта
  adjustFontFallback: 'Arial', // Оптимизация fallback - в Next.js 16 должно быть строкой или false
});

// Using the same font for mono (no separate mono font available)
const geistMono = localFont({
  src: "../public/fonts/GTWalsheimPro-Regular.woff",
  variable: "--font-geist-mono",
  display: "swap",
  preload: false, // Не предзагружаем, так как это тот же шрифт
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
            <div className="app-viewport">
              {children}
            </div>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
