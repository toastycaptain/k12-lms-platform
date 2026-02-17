import { fireEvent, render, screen } from "@testing-library/react";
import AdminStandardsPage from "@/app/admin/standards/page";
import { ToastProvider } from "@k12/ui";
import { apiFetch } from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/admin/standards"),
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

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Admin Standards Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  function setupApi(frameworks: Array<Record<string, unknown>>) {
    mockedApiFetch.mockImplementation(async (path: string) => {
      if (path === "/api/v1/standard_frameworks") {
        return frameworks as never;
      }
      if (path === "/api/v1/standards?standard_framework_id=1") {
        return [{ id: 1 }] as never;
      }
      if (path === "/api/v1/standard_frameworks/1/tree") {
        return [
          {
            id: 1,
            code: "NGSS-1",
            description: "Understand cell structure",
            grade_band: "6-8",
            children: [],
          },
        ] as never;
      }
      return [] as never;
    });
  }

  beforeEach(() => {
    setupApi([
      {
        id: 1,
        name: "NGSS",
        jurisdiction: "US",
        subject: "Science",
        version: "2026",
      },
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders standards list", async () => {
    render(
      <ToastProvider>
        <AdminStandardsPage />
      </ToastProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /NGSS/i }));

    const codes = await screen.findAllByText("NGSS-1");
    expect(codes.length).toBeGreaterThan(0);
    expect(screen.getByText("Understand cell structure")).toBeInTheDocument();
  });

  it("shows import CSV button", async () => {
    render(
      <ToastProvider>
        <AdminStandardsPage />
      </ToastProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /NGSS/i }));

    expect(await screen.findByRole("button", { name: "Run Import" })).toBeInTheDocument();
    expect(screen.getByText("Bulk Import (CSV)")).toBeInTheDocument();
  });

  it("renders framework cards", async () => {
    render(
      <ToastProvider>
        <AdminStandardsPage />
      </ToastProvider>,
    );

    expect(await screen.findByRole("button", { name: /NGSS/i })).toBeInTheDocument();
  });

  it("handles empty standards list", async () => {
    setupApi([]);

    render(
      <ToastProvider>
        <AdminStandardsPage />
      </ToastProvider>,
    );

    expect(await screen.findByText("No standard frameworks found")).toBeInTheDocument();
  });
});
