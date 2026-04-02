import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";   // если у тебя пресет Nova
import "./globals.css";
import { Toaster } from "sonner";                       // ← добавили

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SplitPay — Дели расходы легко",
  description: "Разделение трат с друзьями без головной боли",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster position="top-center" richColors closeButton />   {/* ← главное */}
      </body>
    </html>
  );
}