import { render, screen, fireEvent } from "@testing-library/react";
import { ResponsiveTable } from "../ResponsiveTable";

interface TestRow {
  id: number;
  name: string;
  score: number;
}

const columns = [
  { key: "name", header: "Name", render: (row: TestRow) => row.name, primary: true },
  { key: "score", header: "Score", render: (row: TestRow) => row.score },
];

const data: TestRow[] = [
  { id: 1, name: "Alice", score: 95 },
  { id: 2, name: "Bob", score: 87 },
];

describe("ResponsiveTable", () => {
  it("renders column headers", () => {
    render(<ResponsiveTable columns={columns} data={data} keyExtractor={(r) => r.id} />);
    // Desktop and mobile both render headers, so expect multiple matches
    expect(screen.getAllByText("Name").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Score").length).toBeGreaterThanOrEqual(1);
  });

  it("renders row data", () => {
    render(<ResponsiveTable columns={columns} data={data} keyExtractor={(r) => r.id} />);
    // Desktop table + mobile cards both render data
    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bob").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("95").length).toBeGreaterThanOrEqual(1);
  });

  it("renders caption as sr-only when provided", () => {
    render(
      <ResponsiveTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        caption="Student grades"
      />,
    );
    expect(screen.getByText("Student grades")).toHaveClass("sr-only");
  });

  it("calls onRowClick when a row is clicked", () => {
    const onRowClick = vi.fn();
    render(
      <ResponsiveTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        onRowClick={onRowClick}
      />,
    );
    // Click in the desktop table (first occurrence of Alice)
    const aliceCells = screen.getAllByText("Alice");
    fireEvent.click(aliceCells[0].closest("tr")!);
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it("supports keyboard Enter on clickable rows", () => {
    const onRowClick = vi.fn();
    render(
      <ResponsiveTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        onRowClick={onRowClick}
      />,
    );
    const rows = screen.getAllByRole("button");
    fireEvent.keyDown(rows[0], { key: "Enter" });
    expect(onRowClick).toHaveBeenCalled();
  });

  it("renders empty table when data is empty", () => {
    render(<ResponsiveTable columns={columns} data={[]} keyExtractor={(r: TestRow) => r.id} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("renders mobile card layout with dl/dt/dd", () => {
    render(<ResponsiveTable columns={columns} data={data} keyExtractor={(r) => r.id} />);
    // Mobile layout has role="list"
    expect(screen.getByRole("list")).toBeInTheDocument();
  });
});
