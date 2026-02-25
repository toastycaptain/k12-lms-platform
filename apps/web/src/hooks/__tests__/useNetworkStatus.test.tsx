import { act, renderHook } from "@testing-library/react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

function setNavigatorOnline(online: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => online,
  });
}

describe("useNetworkStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    setNavigatorOnline(true);
  });

  it("defaults to online", () => {
    setNavigatorOnline(true);
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it("transitions to offline on offline events", () => {
    setNavigatorOnline(true);
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.wasOffline).toBe(false);
  });

  it("sets and clears wasOffline after reconnect", () => {
    setNavigatorOnline(true);
    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current.isOnline).toBe(false);

    act(() => {
      setNavigatorOnline(true);
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(true);
    expect(result.current.lastOnlineAt).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.wasOffline).toBe(false);
  });
});
