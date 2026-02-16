import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { fetchCurrentUser, getSignOutUrl } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  fetchCurrentUser: vi.fn(),
  getSignOutUrl: vi.fn(() => "http://localhost:3001/api/v1/session"),
}));

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
  const mockedFetchCurrentUser = vi.mocked(fetchCurrentUser);
  const mockedGetSignOutUrl = vi.mocked(getSignOutUrl);
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("loads and exposes the authenticated user", async () => {
    mockedFetchCurrentUser.mockResolvedValueOnce({
      id: 12,
      email: "teacher@example.com",
      first_name: "Tina",
      last_name: "Teacher",
      tenant_id: 3,
      roles: ["teacher"],
      google_connected: false,
      onboarding_complete: true,
      preferences: {},
    });

    render(
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
    mockedFetchCurrentUser.mockRejectedValueOnce(new Error("No active session"));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(screen.getByTestId("error")).toHaveTextContent("No active session");
  });

  it("signs out and clears user state", async () => {
    mockedFetchCurrentUser.mockResolvedValueOnce({
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
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("admin@example.com"));
    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("none"));
    expect(mockedGetSignOutUrl).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/session",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });

  it("refresh reloads the user", async () => {
    mockedFetchCurrentUser
      .mockResolvedValueOnce({
        id: 1,
        email: "teacher1@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        tenant_id: 1,
        roles: ["teacher"],
        google_connected: false,
        onboarding_complete: true,
        preferences: {},
      })
      .mockResolvedValueOnce({
        id: 1,
        email: "teacher2@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        tenant_id: 1,
        roles: ["teacher"],
        google_connected: false,
        onboarding_complete: true,
        preferences: {},
      });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText("teacher1@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() =>
      expect(screen.getByTestId("user")).toHaveTextContent("teacher2@example.com"),
    );
    expect(mockedFetchCurrentUser).toHaveBeenCalledTimes(2);
  });

  it("handles non-Error rejection in refresh", async () => {
    mockedFetchCurrentUser
      .mockResolvedValueOnce({
        id: 3,
        email: "teacher@example.com",
        first_name: "Taylor",
        last_name: "Teacher",
        tenant_id: 1,
        roles: ["teacher"],
        google_connected: false,
        onboarding_complete: true,
        preferences: {},
      })
      .mockRejectedValueOnce("network down");

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText("teacher@example.com")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("none"));
    expect(screen.getByTestId("error")).toHaveTextContent("Unable to fetch current user");
  });
});
