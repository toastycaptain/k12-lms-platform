import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  UiPreferencesProvider,
  useUiPreferences,
} from "@/features/curriculum/runtime/ui-preferences";

function PreferenceHarness() {
  const { theme, density, resolvedTheme, setTheme, setDensity } = useUiPreferences();

  return (
    <div>
      <p>theme:{theme}</p>
      <p>resolved:{resolvedTheme}</p>
      <p>density:{density}</p>
      <button type="button" onClick={() => setTheme("light")}>
        Set Light
      </button>
      <button type="button" onClick={() => setDensity("comfortable")}>
        Set Comfortable
      </button>
    </div>
  );
}

describe("UiPreferencesProvider", () => {
  const originalMatchMedia = window.matchMedia;
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    const storage = new Map<string, string>();

    Object.defineProperty(window, "localStorage", {
      writable: true,
      value: {
        getItem: vi.fn((key: string) => storage.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storage.set(key, value);
        }),
      },
    });
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.density = "comfortable";
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("dark"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      writable: true,
      value: originalLocalStorage,
    });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: originalMatchMedia,
    });
  });

  it("hydrates from storage and persists theme and density updates", async () => {
    window.localStorage.setItem("k12.ui.theme", "dark");
    window.localStorage.setItem("k12.ui.density", "compact");

    render(
      <UiPreferencesProvider>
        <PreferenceHarness />
      </UiPreferencesProvider>,
    );

    expect(screen.getByText("theme:dark")).toBeInTheDocument();
    expect(screen.getByText("density:compact")).toBeInTheDocument();

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("dark");
      expect(document.documentElement.dataset.density).toBe("compact");
    });

    fireEvent.click(screen.getByRole("button", { name: "Set Light" }));
    fireEvent.click(screen.getByRole("button", { name: "Set Comfortable" }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("light");
      expect(document.documentElement.dataset.density).toBe("comfortable");
    });

    expect(window.localStorage.getItem("k12.ui.theme")).toBe("light");
    expect(window.localStorage.getItem("k12.ui.density")).toBe("comfortable");
  });
});
