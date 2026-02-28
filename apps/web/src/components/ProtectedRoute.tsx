"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  unauthorizedRedirect?: string;
}

function isTruthy(value: string | undefined): boolean {
  return Boolean(value && ["1", "true", "yes", "on"].includes(value.toLowerCase()));
}

function readRuntimeFlag(name: "disableWelcomeTour" | "authBypass"): boolean {
  if (typeof document === "undefined") return false;
  const raw =
    name === "disableWelcomeTour"
      ? document.documentElement.dataset.disableWelcomeTour
      : document.documentElement.dataset.authBypass;
  return raw === "1" || raw === "true";
}

export default function ProtectedRoute({
  children,
  requiredRoles,
  unauthorizedRedirect = "/unauthorized",
}: ProtectedRouteProps) {
  const disableWelcomeTour =
    isTruthy(process.env.NEXT_PUBLIC_DISABLE_WELCOME_TOUR) || readRuntimeFlag("disableWelcomeTour");
  const bypassAuthMode =
    isTruthy(process.env.NEXT_PUBLIC_AUTH_BYPASS_MODE) || readRuntimeFlag("authBypass");
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const roles = user?.roles ?? [];
  const hasRequiredRole =
    !requiredRoles ||
    requiredRoles.length === 0 ||
    requiredRoles.some((role) => roles.includes(role));

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!hasRequiredRole) {
      router.replace(unauthorizedRedirect);
      return;
    }

    const isOnboardingIncomplete = user.onboarding_complete === false;
    const setupExemptPaths = [
      "/setup",
      "/login",
      "/auth/callback",
      "/unauthorized",
      "/not-authorized",
    ];
    const isExempt = setupExemptPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );

    if (isOnboardingIncomplete && !isExempt && !disableWelcomeTour && !bypassAuthMode) {
      router.replace("/setup");
      return;
    }

    if ((disableWelcomeTour || bypassAuthMode) && pathname === "/setup") {
      router.replace("/dashboard");
      return;
    }

    if (user.onboarding_complete && pathname === "/setup") {
      router.replace("/dashboard");
    }
  }, [
    bypassAuthMode,
    disableWelcomeTour,
    hasRequiredRole,
    loading,
    pathname,
    router,
    unauthorizedRedirect,
    user,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!hasRequiredRole) {
    return null;
  }

  return <>{children}</>;
}
