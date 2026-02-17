import type { Metadata } from "next";
import SwrProvider from "@/components/SwrProvider";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

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
      <body className="antialiased">
        <SwrProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </SwrProvider>
      </body>
    </html>
  );
}
