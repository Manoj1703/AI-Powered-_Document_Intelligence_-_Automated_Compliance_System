import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Documents from "./Documents";

const docs = [
  { id: "1", filename: "alpha.pdf", title: "Alpha", document_type: "Contract", overall_risk_level: "low" },
  { id: "2", filename: "beta.pdf", title: "Beta", document_type: "Policy", overall_risk_level: "medium" },
  { id: "3", filename: "gamma.pdf", title: "Gamma", document_type: "Invoice", overall_risk_level: "high" },
];

describe("Documents page", () => {
  it("filters by query and risk", () => {
    render(<Documents documents={docs} loading={false} onView={vi.fn()} onDelete={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/Search documents/i), { target: { value: "beta" } });
    expect(screen.getByText("beta.pdf")).toBeInTheDocument();
    expect(screen.queryByText("alpha.pdf")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Filter by risk/i), { target: { value: "High" } });
    expect(screen.getByText("No documents found.")).toBeInTheDocument();
  });
});
