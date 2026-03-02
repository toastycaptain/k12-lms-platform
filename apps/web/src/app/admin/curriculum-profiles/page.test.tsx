import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminCurriculumProfilesPage from "@/app/admin/curriculum-profiles/page";
import { apiFetch } from "@/lib/api";

const addToast = vi.fn();

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  ApiError: class extends Error {
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

vi.mock("@k12/ui", async () => {
  const actual = await vi.importActual<typeof import("@k12/ui")>("@k12/ui");
  return {
    ...actual,
    useToast: () => ({ addToast }),
  };
});

describe("AdminCurriculumProfilesPage", () => {
  const mockedApiFetch = vi.mocked(apiFetch);

  beforeEach(() => {
    mockedApiFetch.mockImplementation(async (path: string, options?: RequestInit) => {
      if (path === "/api/v1/curriculum_profiles") {
        return [
          {
            key: "american_common_core_v1",
            label: "American (Common Core + NGSS)",
            version: "v1",
            description: "Default US profile",
            jurisdiction: "US",
            planner_taxonomy: {
              subject_label: "Course Subject",
              grade_label: "Grade Level",
              unit_label: "Unit",
            },
            subject_options: ["Math", "Science"],
            grade_or_stage_options: ["6", "7"],
            framework_defaults: ["Common Core"],
            status: "active",
          },
          {
            key: "ib_continuum_v1",
            label: "IB Continuum",
            version: "v1",
            description: "IB profile",
            jurisdiction: "International",
            planner_taxonomy: {
              subject_label: "Subject Group",
              grade_label: "Year Group",
              unit_label: "Unit of Inquiry",
            },
            subject_options: ["Sciences"],
            grade_or_stage_options: ["MYP 1"],
            framework_defaults: ["IB MYP"],
            status: "active",
          },
        ] as never;
      }

      if (path === "/api/v1/admin/curriculum_settings" && options?.method === "PUT") {
        return {
          tenant_default_profile_key: "ib_continuum_v1",
          available_profile_keys: ["american_common_core_v1", "ib_continuum_v1"],
          school_overrides: [
            {
              school_id: 1,
              school_name: "North Campus",
              curriculum_profile_key: "ib_continuum_v1",
              effective_curriculum_profile_key: "ib_continuum_v1",
              effective_curriculum_source: "school",
            },
          ],
        } as never;
      }

      if (path === "/api/v1/admin/curriculum_settings") {
        return {
          tenant_default_profile_key: "american_common_core_v1",
          available_profile_keys: ["american_common_core_v1", "ib_continuum_v1"],
          school_overrides: [
            {
              school_id: 1,
              school_name: "North Campus",
              curriculum_profile_key: null,
              effective_curriculum_profile_key: "american_common_core_v1",
              effective_curriculum_source: "tenant",
            },
          ],
        } as never;
      }

      throw new Error(`Unexpected apiFetch call: ${path}`);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders admin curriculum controls and school override context", async () => {
    render(<AdminCurriculumProfilesPage />);

    expect(await screen.findByText("Tenant Default Profile")).toBeInTheDocument();
    expect(screen.getByText("School Overrides")).toBeInTheDocument();
    expect(screen.getByText("North Campus")).toBeInTheDocument();
    expect(screen.getByText("tenant")).toBeInTheDocument();
  });

  it("saves tenant default and school overrides", async () => {
    render(<AdminCurriculumProfilesPage />);

    await screen.findByText("Tenant Default Profile");

    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "ib_continuum_v1" },
    });
    fireEvent.change(screen.getAllByRole("combobox")[1], {
      target: { value: "ib_continuum_v1" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Curriculum Settings" }));

    await waitFor(() => {
      expect(mockedApiFetch).toHaveBeenCalledWith(
        "/api/v1/admin/curriculum_settings",
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });
    expect(addToast).toHaveBeenCalledWith("success", "Curriculum settings saved.");
  });
});
