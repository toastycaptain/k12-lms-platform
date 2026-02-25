import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SwrProvider from "@/components/SwrProvider";
import WebVitalsReporter from "@/components/WebVitalsReporter";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@k12/ui";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "K-12 Planning + LMS",
  description: "K-12 curriculum planning and learning management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased [font-family:var(--font-inter)]`}>
        <SwrProvider>
          <AuthProvider>
            <ToastProvider>
              <WebVitalsReporter />
              {children}
            </ToastProvider>
          </AuthProvider>
        </SwrProvider>
      </body>
    </html>
  );
}
