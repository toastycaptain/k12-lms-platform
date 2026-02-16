import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SamlIntegrationPage from "@/app/admin/integrations/saml/page";
import { ToastProvider } from "@/components/Toast";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { createMockUser } from "@/test/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/admin/integrations/saml"),
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
  getApiOrigin: vi.fn(() => "http://localhost:3001"),
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

describe("Admin SAML Page", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);

  function setupApi(configs: Array<Record<string, unknown>> = []) {
    mockedApiFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/api/v1/integration_configs" && (!options || !options.method)) {
        return configs as never;
      }
      if (path === "/api/v1/me") {
        return { tenant: { slug: "lincoln-high" } } as never;
      }
      if (path === "/api/v1/integration_configs" && options?.method === "POST") {
        return { id: 99, provider: "saml", status: "inactive", settings: {} } as never;
      }
      if (path.startsWith("/api/v1/integration_configs/") && options?.method === "PATCH") {
        return {} as never;
      }
      return [] as never;
    });
  }

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: createMockUser({ roles: ["admin"] }),
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });
    setupApi();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders SAML configuration form", async () => {
    render(
      <ToastProvider>
        <SamlIntegrationPage />
      </ToastProvider>,
    );

    expect(await screen.findByRole("heading", { name: "SAML SSO" })).toBeInTheDocument();
    expect(screen.getByLabelText("IdP SSO URL")).toBeInTheDocument();
    expect(screen.getByLabelText("IdP SLO URL")).toBeInTheDocument();
    expect(screen.getByLabelText("IdP Certificate")).toBeInTheDocument();
  });

  it("loads existing SAML config", async () => {
    setupApi([
      {
        id: 10,
        provider: "saml",
        status: "active",
        settings: {
          issuer: "https://idp.example.com",
          idp_sso_url: "https://idp.example.com/sso",
          idp_cert: "CERT_DATA",
        },
      },
    ]);

    render(
      <ToastProvider>
        <SamlIntegrationPage />
      </ToastProvider>,
    );

    expect(await screen.findByDisplayValue("https://idp.example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://idp.example.com/sso")).toBeInTheDocument();
    expect(screen.getByDisplayValue("CERT_DATA")).toBeInTheDocument();
  });

  it("submits SAML configuration", async () => {
    render(
      <ToastProvider>
        <SamlIntegrationPage />
      </ToastProvider>,
    );

    fireEvent.change(await screen.findByLabelText("IdP SSO URL"), {
      target: { value: "https://idp.example.com/sso" },
    });
    fireEvent.change(screen.getByLabelText("IdP Certificate"), {
      target: { value: "CERT_DATA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/api/v1/integration_configs",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("shows validation errors", async () => {
    render(
      <ToastProvider>
        <SamlIntegrationPage />
      </ToastProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Save" }));

    expect(await screen.findByText("IdP SSO URL is required.")).toBeInTheDocument();
  });
});
