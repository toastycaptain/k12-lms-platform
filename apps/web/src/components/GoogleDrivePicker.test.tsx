import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import GoogleDrivePicker from "@/components/GoogleDrivePicker";
import { apiFetch } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

describe("GoogleDrivePicker", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  let pickerCallback:
    | ((data: {
        action: string;
        docs?: Array<{ id: string; name: string; mimeType: string; url: string }>;
      }) => void)
    | undefined;

  beforeEach(() => {
    pickerCallback = undefined;

    class PickerBuilder {
      setOAuthToken() {
        return this;
      }

      setAppId() {
        return this;
      }

      addView() {
        return this;
      }

      setCallback(
        callback: (data: {
          action: string;
          docs?: Array<{ id: string; name: string; mimeType: string; url: string }>;
        }) => void,
      ) {
        pickerCallback = callback;
        return this;
      }

      build() {
        return {
          setVisible: vi.fn(),
        };
      }
    }

    (window as Window & typeof globalThis).google = {
      picker: {
        PickerBuilder: PickerBuilder as never,
        ViewId: {
          DOCS: "DOCS",
          PRESENTATIONS: "PRESENTATIONS",
          SPREADSHEETS: "SPREADSHEETS",
        },
      },
    } as never;

    (window as Window & typeof globalThis).gapi = {
      load: (_api: string, callback: () => void) => callback(),
    } as never;

    mockedApiFetch.mockResolvedValue({ access_token: "token", expires_in: 3600 } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders children as button content", () => {
    render(<GoogleDrivePicker onSelect={vi.fn()}>Pick a file</GoogleDrivePicker>);

    expect(screen.getByRole("button", { name: "Pick a file" })).toBeInTheDocument();
  });

  it("shows loading state while picker loads", async () => {
    mockedApiFetch.mockImplementation(() => new Promise(() => {}) as Promise<never>);

    render(<GoogleDrivePicker onSelect={vi.fn()}>Pick a file</GoogleDrivePicker>);

    fireEvent.click(screen.getByRole("button", { name: "Pick a file" }));

    expect(screen.getByRole("button", { name: "Loading..." })).toBeInTheDocument();
  });

  it("fetches picker token on click", async () => {
    render(<GoogleDrivePicker onSelect={vi.fn()}>Pick a file</GoogleDrivePicker>);

    fireEvent.click(screen.getByRole("button", { name: "Pick a file" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/drive/picker_token");
    });
  });

  it("calls onSelect with file data when user picks a file", async () => {
    const onSelect = vi.fn();
    render(<GoogleDrivePicker onSelect={onSelect}>Pick a file</GoogleDrivePicker>);

    fireEvent.click(screen.getByRole("button", { name: "Pick a file" }));

    await waitFor(() => {
      expect(typeof pickerCallback).toBe("function");
    });

    pickerCallback?.({
      action: "picked",
      docs: [
        {
          id: "file-1",
          name: "Doc 1",
          mimeType: "application/vnd.google-apps.document",
          url: "https://drive.google.com/doc/1",
        },
      ],
    });

    expect(onSelect).toHaveBeenCalledWith({
      id: "file-1",
      name: "Doc 1",
      mimeType: "application/vnd.google-apps.document",
      url: "https://drive.google.com/doc/1",
    });
  });

  it("handles API error gracefully", async () => {
    mockedApiFetch.mockRejectedValue(new Error("boom"));

    render(<GoogleDrivePicker onSelect={vi.fn()}>Pick a file</GoogleDrivePicker>);

    fireEvent.click(screen.getByRole("button", { name: "Pick a file" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Pick a file" })).toBeInTheDocument();
    });
  });
});
