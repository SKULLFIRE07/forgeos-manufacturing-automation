import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ForgeApp } from "@/components/forge-app";

describe("ForgeApp", () => {
  it("loads the command center and navigates to work", async () => {
    const user = userEvent.setup();
    render(<ForgeApp />);

    expect(screen.getByRole("status", { name: "Preparing the operations workspace" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("command-center")).toBeInTheDocument(), { timeout: 2000 });
    await user.click(screen.getAllByRole("button", { name: "Work" })[0]);
    expect(screen.getByTestId("work-view")).toBeInTheDocument();
  });

  it("opens global search from the keyboard shortcut", async () => {
    const user = userEvent.setup();
    render(<ForgeApp />);
    await waitFor(() => expect(screen.getByTestId("command-center")).toBeInTheDocument(), { timeout: 2000 });
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("dialog", { name: "Search ForgeOS" })).toBeInTheDocument();
    const search = screen.getByRole("textbox", { name: "Search all operations" });
    await user.type(search, "CIWS");
    expect(screen.getAllByText(/CIWS/i).length).toBeGreaterThan(0);
  });
});
