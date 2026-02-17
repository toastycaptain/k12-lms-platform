import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type ReactNode } from "react";
import { SWRConfig } from "swr";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { apiFetch, fetchCurrentUser, type CurrentUser } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  fetchCurrentUser: vi.fn(),
}));

function renderWithSWR(ui: ReactNode) {
  return render(<SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>);
}

function Probe() {
  const { user, loading, error, signOut, refresh } = useAuth();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="user">{user ? user.email : "none"}</div>
      <div data-testid="error">{error || ""}</div>
      <button type="button" onClick={() => void signOut()}>
        Sign Out
      </button>
      <button type="button" onClick={() => void refresh()}>
        Refresh
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  const mockedApiFetch = vi.mocked(apiFetch);
  const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);

  const teacher: CurrentUser = {
    id: 12,
    email: "teacher@example.com",
    first_name: "Tina",
    last_name: "Teacher",
    tenant_id: 3,
    roles: ["teacher"],
    google_connected: false,
    onboarding_complete: true,
    preferences: {},
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads and exposes the authenticated user", async () => {
    mockedFetchCurrentUser.mockResolvedValue(teacher);

    renderWithSWR(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("true");
    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("teacher@example.com"),
    );
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("");
  });

  it("handles unauthenticated fetch failures and clears user", async () => {
    mockedFetchCurrentUser.mockRejectedValue(new Error("No active session"));

    renderWithSWR(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(screen.getByTestId("error")).toHaveTextContent("No active session");
  });

  it("signs out and clears user state", async () => {
    mockedFetchCurrentUser.mockResolvedValue({
      id: 5,
      email: "admin@example.com",
      first_name: "Ada",
      last_name: "Admin",
      tenant_id: 1,
      roles: ["admin"],
      google_connected: true,
      onboarding_complete: true,
      preferences: {},
    });
    mockedApiFetch.mockResolvedValueOnce(undefined);

    renderWithSWR(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("admin@example.com"));
    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("none"));
    expect(mockedApiFetch).toHaveBeenCalledWith(
      "/api/v1/session",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("refresh reloads the user", async () => {
    const teacherOne: CurrentUser = {
      id: 1,
      email: "teacher1@example.com",
      first_name: "Taylor",
      last_name: "Teacher",
      tenant_id: 1,
      roles: ["teacher"],
      google_connected: false,
      onboarding_complete: true,
      preferences: {},
    };
    const teacherTwo: CurrentUser = { ...teacherOne, email: "teacher2@example.com" };
    let currentUser = teacherOne;

    mockedFetchCurrentUser.mockImplementation(async () => currentUser);

    renderWithSWR(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText("teacher1@example.com")).toBeInTheDocument();

    currentUser = teacherTwo;
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("teacher2@example.com"),
    );
    expect(mockedFetchCurrentUser.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("handles refresh failure and preserves error state", async () => {
    let shouldFail = false;

    mockedFetchCurrentUser.mockImplementation(async () => {
      if (shouldFail) {
        throw new Error("Unable to fetch current user");
      }

      return teacher;
    });

    renderWithSWR(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText("teacher@example.com")).toBeInTheDocument();
    shouldFail = true;
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("teacher@example.com"),
    );
    expect(screen.getByTestId("error")).toHaveTextContent("Unable to fetch current user");
  });
});
