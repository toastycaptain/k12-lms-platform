"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome, {user.first_name} {user.last_name}
      </h1>
      <p className="mt-2 text-gray-600">Dashboard content coming soon.</p>
    </AppShell>
  );
}
