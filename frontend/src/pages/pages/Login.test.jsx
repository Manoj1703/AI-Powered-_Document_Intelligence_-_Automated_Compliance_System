import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Login from "./Login";

describe("Login form", () => {
  it("submits a login request", async () => {
    const onLogin = vi.fn().mockResolvedValue({ justRegistered: false });

    render(<Login onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText(/Email or Username/i), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: "Admin@123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Login$/i }));

    await screen.findByText(/Use organization-approved credentials/i);
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "admin@example.com",
        password: "Admin@123",
        mode: "login",
      }),
    );
  });
});
