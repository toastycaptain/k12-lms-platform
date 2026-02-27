"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  unauthorizedRedirect?: string;
}

export default function ProtectedRoute({
  children,
  requiredRoles,
  unauthorizedRedirect = "/unauthorized",
}: ProtectedRouteProps) {
  const disableWelcomeTour = Boolean(
    process.env.NEXT_PUBLIC_DISABLE_WELCOME_TOUR &&
    ["1", "true", "yes", "on"].includes(process.env.NEXT_PUBLIC_DISABLE_WELCOME_TOUR.toLowerCase()),
  );
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

    if (isOnboardingIncomplete && !isExempt && !disableWelcomeTour) {
      router.replace("/setup");
      return;
    }

    if (disableWelcomeTour && pathname === "/setup") {
      router.replace("/dashboard");
      return;
    }

    if (user.onboarding_complete && pathname === "/setup") {
      router.replace("/dashboard");
    }
  }, [disableWelcomeTour, hasRequiredRole, loading, pathname, router, unauthorizedRedirect, user]);

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
