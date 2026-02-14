"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function formatError(errorParam: string | null): string {
  if (!errorParam) return "Authentication failed.";

  try {
    return decodeURIComponent(errorParam).replaceAll("_", " ");
  } catch {
    return errorParam.replaceAll("_", " ");
  }
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, refresh } = useAuth();
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam) return;
    void refresh();
  }, [errorParam, refresh]);

  useEffect(() => {
    if (errorParam) return;
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [errorParam, loading, router, user]);

  if (loading && !errorParam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Finishing sign-in...</p>
      </div>
    );
  }

  if (errorParam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Sign-in failed</h1>
          <p className="mt-2 text-sm text-gray-600">{formatError(errorParam)}</p>
          <div className="mt-4 flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back to login
            </Link>
            <a
              href={getAuthUrl()}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Try Google sign-in again
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Sign-in incomplete</h1>
          <p className="mt-2 text-sm text-gray-600">
            We could not verify your session. Please sign in again.
          </p>
          <div className="mt-4">
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Return to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Sign-in successful. Redirecting...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-500">Finishing sign-in...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
