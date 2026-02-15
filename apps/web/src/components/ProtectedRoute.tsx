"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  unauthorizedRedirect?: string;
}

export default function ProtectedRoute({
  children,
  requiredRoles,
  unauthorizedRedirect = "/not-authorized",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const roles = user?.roles ?? [];
  const hasRequiredRole =
    !requiredRoles || requiredRoles.length === 0 || requiredRoles.some((role) => roles.includes(role));

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!hasRequiredRole) {
      router.replace(unauthorizedRedirect);
    }
  }, [hasRequiredRole, loading, router, unauthorizedRedirect, user]);

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
