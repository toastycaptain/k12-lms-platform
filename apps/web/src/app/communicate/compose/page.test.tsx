import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ComposeMessagePage from "@/app/communicate/compose/page";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { announce } from "@/components/LiveRegion";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(() => "/communicate/compose"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/AppShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ProtectedRoute", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/Toast", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/components/LiveRegion", () => ({
  announce: vi.fn(),
}));

describe("Messaging Compose Flow", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedUseAuth = vi.mocked(useAuth);
  const mockedUseRouter = vi.mocked(useRouter);
  const mockedUseToast = vi.mocked(useToast);
  const mockedAnnounce = vi.mocked(announce);

  const push = vi.fn();
  const addToast = vi.fn();

  beforeEach(() => {
    mockedUseRouter.mockReturnValue({ push } as never);
    mockedUseToast.mockReturnValue({ addToast });
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
        preferences: {},
      },
      loading: false,
      error: null,
      signOut: vi.fn(async () => {}),
      refresh: vi.fn(async () => {}),
    });

    mockedApiFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path.startsWith("/api/v1/users?q=")) {
        return [
          {
            id: 2,
            first_name: "Alicia",
            last_name: "Admin",
            email: "alicia@example.com",
          },
        ] as never;
      }

      if (path === "/api/v1/message_threads" && options?.method === "POST") {
        return { id: 77 } as never;
      }

      if (path === "/api/v1/message_threads/77/messages" && options?.method === "POST") {
        return { id: 1 } as never;
      }

      throw new Error(`Unexpected apiFetch call: ${path}`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("searches recipients and sends a message thread", async () => {
    render(<ComposeMessagePage />);

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Family update" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "We are reviewing fractions this week." },
    });
    fireEvent.change(screen.getByLabelText("Recipients"), {
      target: { value: "ali" },
    });

    const recipientOption = await screen.findByRole("button", { name: /Alicia Admin/i });
    fireEvent.click(recipientOption);

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/api/v1/message_threads",
        expect.objectContaining({ method: "POST" }),
      );
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/api/v1/message_threads/77/messages",
        expect.objectContaining({ method: "POST" }),
      );
      expect(push).toHaveBeenCalledWith("/communicate/threads/77");
    });

    expect(mockedAnnounce).toHaveBeenCalledWith("Message sent");
  });

  it("surfaces send errors", async () => {
    mockedApiFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path.startsWith("/api/v1/users?q=")) {
        return [
          {
            id: 2,
            first_name: "Alicia",
            last_name: "Admin",
            email: "alicia@example.com",
          },
        ] as never;
      }

      if (path === "/api/v1/message_threads" && options?.method === "POST") {
        return { id: 77 } as never;
      }

      if (path === "/api/v1/message_threads/77/messages" && options?.method === "POST") {
        throw new ApiError(422, "Message body required");
      }

      throw new Error(`Unexpected apiFetch call: ${path}`);
    });

    render(<ComposeMessagePage />);

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Family update" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "We are reviewing fractions this week." },
    });
    fireEvent.change(screen.getByLabelText("Recipients"), {
      target: { value: "ali" },
    });

    fireEvent.click(await screen.findByRole("button", { name: /Alicia Admin/i }));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(addToast).toHaveBeenCalledWith("error", "Message body required");
      expect(mockedAnnounce).toHaveBeenCalledWith("Failed to send message");
    });
  });
});
