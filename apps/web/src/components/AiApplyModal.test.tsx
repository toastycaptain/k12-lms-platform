import { fireEvent, render, screen } from "@testing-library/react";
import AiApplyModal from "@/components/AiApplyModal";

describe("AiApplyModal", () => {
  it("renders field-level diffs and updates the selected field set", () => {
    const onSelectionChange = vi.fn();

    render(
      <AiApplyModal
        open
        changes={[
          {
            field: "Description",
            previous: "Current description",
            next: "Proposed description",
          },
          {
            field: "Essential Questions",
            previous: "What changed?",
            next: "Why did it change?",
          },
        ]}
        selectedFields={["Description"]}
        onSelectionChange={onSelectionChange}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("Current description")).toBeInTheDocument();
    expect(screen.getByText("Proposed description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apply Selected Changes" })).toBeEnabled();

    fireEvent.click(screen.getAllByRole("checkbox")[1]);

    expect(onSelectionChange).toHaveBeenCalledWith(["Description", "Essential Questions"]);
  });

  it("disables confirm when no fields are selected", () => {
    render(
      <AiApplyModal
        open
        changes={[
          {
            field: "Description",
            previous: "Current description",
            next: "Proposed description",
          },
        ]}
        selectedFields={[]}
        onSelectionChange={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Apply Selected Changes" })).toBeDisabled();
  });
});
