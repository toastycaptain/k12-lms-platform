import { fireEvent, render, screen } from "@testing-library/react";
import { Badge, Button, Card, Input, Modal, Spinner } from "../index";

describe("UI primitives", () => {
  it("renders button/input/card/badge/spinner", () => {
    render(
      <div>
        <Button>Save</Button>
        <Input aria-label="Name" />
        <Card>Content</Card>
        <Badge>Draft</Badge>
        <Spinner />
      </div>,
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("opens and closes modal", () => {
    const onClose = vi.fn();

    render(
      <Modal open title="Curve grades" onClose={onClose}>
        Body
      </Modal>,
    );

    expect(screen.getByRole("dialog", { name: "Curve grades" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
