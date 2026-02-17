import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

      enableFeature() {
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
        Feature: {
          MULTISELECT_ENABLED: "MULTISELECT_ENABLED",
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

    await act(async () => {
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
    });

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "file-1",
        name: "Doc 1",
        mimeType: "application/vnd.google-apps.document",
        url: "https://drive.google.com/doc/1",
      }),
    );
  });

  it("supports multi-select callbacks", async () => {
    const onSelect = vi.fn();
    const onSelectMany = vi.fn();
    render(
      <GoogleDrivePicker onSelect={onSelect} onSelectMany={onSelectMany}>
        Pick files
      </GoogleDrivePicker>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Pick files" }));

    await waitFor(() => {
      expect(typeof pickerCallback).toBe("function");
    });

    await act(async () => {
      pickerCallback?.({
        action: "picked",
        docs: [
          {
            id: "file-1",
            name: "Doc 1",
            mimeType: "application/vnd.google-apps.document",
            url: "https://drive.google.com/doc/1",
          },
          {
            id: "file-2",
            name: "Doc 2",
            mimeType: "application/vnd.google-apps.document",
            url: "https://drive.google.com/doc/2",
          },
        ],
      });
    });

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelectMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "file-1" }),
        expect.objectContaining({ id: "file-2" }),
      ]),
    );
  });

  it("creates a new file from the selected create option", async () => {
    const onSelect = vi.fn();
    mockedApiFetch.mockResolvedValueOnce({
      id: "created-1",
      title: "Untitled Sheet",
      mime_type: "application/vnd.google-apps.spreadsheet",
      url: "https://docs.google.com/spreadsheets/d/created-1",
    } as never);

    render(<GoogleDrivePicker onSelect={onSelect}>Pick a file</GoogleDrivePicker>);

    fireEvent.change(screen.getByLabelText("Create new"), { target: { value: "sheet" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith("/api/v1/drive/documents", {
        method: "POST",
        body: JSON.stringify({
          title: "Untitled Sheet",
          mime_type: "application/vnd.google-apps.spreadsheet",
        }),
      });
    });
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "created-1",
        name: "Untitled Sheet",
        mimeType: "application/vnd.google-apps.spreadsheet",
      }),
    );
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
