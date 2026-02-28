import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
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

function isTruthy(value: string | undefined): boolean {
  return Boolean(value && ["1", "true", "yes", "on"].includes(value.toLowerCase()));
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const runtimeDisableWelcomeTour = requestHeaders.get("x-k12-disable-welcome-tour") || undefined;
  const runtimeAuthBypassMode = requestHeaders.get("x-k12-auth-bypass") || undefined;
  const disableWelcomeTour =
    isTruthy(runtimeDisableWelcomeTour) ||
    isTruthy(process.env.DISABLE_WELCOME_TOUR) ||
    isTruthy(process.env.NEXT_PUBLIC_DISABLE_WELCOME_TOUR);
  const authBypassMode =
    isTruthy(runtimeAuthBypassMode) ||
    isTruthy(process.env.AUTH_BYPASS_MODE) ||
    isTruthy(process.env.NEXT_PUBLIC_AUTH_BYPASS_MODE);

  return (
    <html
      lang="en"
      data-disable-welcome-tour={disableWelcomeTour ? "1" : "0"}
      data-auth-bypass={authBypassMode ? "1" : "0"}
    >
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
