import { render, screen } from "@testing-library/react";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

vi.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: vi.fn(),
}));

describe("ConnectionBanner", () => {
  const mockedUseNetworkStatus = vi.mocked(useNetworkStatus);

  it("renders nothing when online and stable", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: true,
      wasOffline: false,
      lastOnlineAt: null,
    });

    const { container } = render(<ConnectionBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows offline warning when disconnected", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: false,
      wasOffline: false,
      lastOnlineAt: null,
    });

    render(<ConnectionBanner />);
    expect(screen.getByRole("alert")).toHaveTextContent("You are offline");
  });

  it("shows reconnect message after connectivity returns", () => {
    mockedUseNetworkStatus.mockReturnValue({
      isOnline: true,
      wasOffline: true,
      lastOnlineAt: new Date(),
    });

    render(<ConnectionBanner />);
    expect(screen.getByRole("status")).toHaveTextContent("Connection restored");
  });
});
