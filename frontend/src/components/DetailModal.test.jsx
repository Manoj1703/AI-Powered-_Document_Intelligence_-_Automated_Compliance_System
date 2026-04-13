import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import DetailModal from "./DetailModal";

const baseDoc = {
  title: "Demo Contract",
  document_type: "Agreement",
  overall_risk_level: "medium",
  confidence: 87,
  filename: "demo.pdf",
  author: "Alice",
  date: "2026-03-01",
  uploaded_at: 1700000000,
  content_length: 1200,
  summary: "Summary",
  detailed_summary: "Detailed",
  key_clauses: ["Clause 1"],
  risk_types: ["Compliance"],
  key_topics: ["Liability"],
  obligations: ["Notify in writing"],
  compliance_issues: ["Missing jurisdiction"],
  risks: [{ risk_type: "Compliance", severity: "medium", description: "Potential issue" }],
};

describe("DetailModal", () => {
  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<DetailModal open loading={false} error="" document={baseDoc} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders as accessible dialog", () => {
    const onClose = vi.fn();
    render(<DetailModal open loading={false} error="" document={baseDoc} onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: /Document Insights/i })).toBeInTheDocument();
  });
});
