import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NewUnitPlanPage from "@/app/plan/units/new/page";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

describe("New Unit Plan Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);
  const mockedUseRouter = vi.mocked(useRouter);
  const pushMock = vi.fn();
  const refreshMock = vi.fn(async () => {});

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ push: pushMock } as never);
    mockedUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "teacher@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        tenant_id: 1,
        roles: ["teacher"],
        google_connected: false,
        onboarding_complete: true,
        preferences: {
          subjects: ["Science"],
          grade_levels: ["7"],
        },
      },
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: refreshMock,
    });

    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/courses") {
        return [{ id: 11, name: "Biology 7", code: "BIO-7" }] as never;
      }
      if (path === "/api/v1/me") {
        return {} as never;
      }
      if (path === "/api/v1/unit_plans") {
        return { id: 42 } as never;
      }
      throw new Error(`Unexpected apiFetch call: ${path}`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("requires grade level and subject before creating", async () => {
    render(<NewUnitPlanPage />);

    fireEvent.change(await screen.findByLabelText("Unit Title"), {
      target: { value: "Ecosystems and Biodiversity" },
    });
    fireEvent.change(screen.getByLabelText("Course"), {
      target: { value: "11" },
    });
    fireEvent.change(screen.getByLabelText("Grade Level"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Course Subject"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Unit Plan" }));

    expect(
      await screen.findByText("Please select a grade level and subject before creating material."),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("creates a unit plan and routes to the plan editor", async () => {
    render(<NewUnitPlanPage />);

    fireEvent.change(await screen.findByLabelText("Grade Level"), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Course Subject"), {
      target: { value: "Science" },
    });
    fireEvent.change(screen.getByLabelText("Unit Title"), {
      target: { value: "Ecosystems and Biodiversity" },
    });
    fireEvent.change(screen.getByLabelText("Course"), {
      target: { value: "11" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Unit Plan" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/api/v1/unit_plans",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/v1/me",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(refreshMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/plan/units/42");
  });

  it("derives planner labels and options from the effective course curriculum context", async () => {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/courses") {
        return [
          {
            id: 11,
            name: "MYP Integrated Sciences",
            code: "MYP-SCI-1",
            effective_curriculum_profile_key: "ib_continuum_v1",
            effective_curriculum_source: "school",
            curriculum_context: {
              grade_label: "Year Group",
              subject_label: "Subject Area",
              unit_label: "Learning Unit",
              grade_or_stage_options: ["MYP 1", "MYP 2"],
              subject_options: ["Sciences", "Language and Literature"],
            },
          },
        ] as never;
      }
      if (path === "/api/v1/me") {
        return {} as never;
      }
      if (path === "/api/v1/unit_plans") {
        return { id: 42 } as never;
      }
      throw new Error(`Unexpected apiFetch call: ${path}`);
    });

    render(<NewUnitPlanPage />);

    expect(await screen.findByText(/Using curriculum profile:/)).toBeInTheDocument();
    expect(screen.getByLabelText("Year Group")).toBeInTheDocument();
    expect(screen.getByLabelText("Subject Area")).toBeInTheDocument();
    expect(screen.getByLabelText("Learning Unit Title")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "MYP 1" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Language and Literature" })).toBeInTheDocument();
  });
});
