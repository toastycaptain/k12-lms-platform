import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import AppShell from "@/components/AppShell";
import GlobalSearch from "@/components/GlobalSearch";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      email: "admin@example.com",
      first_name: "Admin",
      last_name: "User",
      tenant_id: 1,
      roles: ["admin"],
      google_connected: false,
      onboarding_complete: true,
      preferences: {},
    },
    signOut: vi.fn(),
  }),
}));

vi.mock("@/components/NotificationBell", () => ({
  default: () => <button type="button">Notifications</button>,
}));

vi.mock("@/components/SchoolSelector", () => ({
  default: () => <div>School Selector</div>,
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    apiFetch: vi.fn().mockResolvedValue({ results: [] }),
  };
});

describe("Accessibility", () => {
  it("AppShell has no violations", async () => {
    const { container } = render(
      <AppShell>
        <div>Content</div>
      </AppShell>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("GlobalSearch has no violations", async () => {
    const { container } = render(<GlobalSearch />);

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
