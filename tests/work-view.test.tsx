import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { WorkView } from "@/components/work-view";
import { workItems } from "@/lib/seed";

describe("WorkView", () => {
  it("filters work and exposes a useful empty state", async () => {
    const user = userEvent.setup();
    render(
      <WorkView
        items={workItems}
        role="Supervisor"
        currentPerson="Arjun Patil"
        onCreateWork={vi.fn()}
        onOpenWork={vi.fn()}
      />,
    );

    const search = screen.getByRole("textbox", { name: "Search work" });
    await user.type(search, "value-that-cannot-match");
    expect(screen.getByRole("heading", { name: "No work matches these filters" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show all work" }));
    expect(screen.getByRole("table", { name: "Work register" })).toBeInTheDocument();
  });

  it("switches to the state board and opens a work record", async () => {
    const user = userEvent.setup();
    const onOpenWork = vi.fn();
    render(
      <WorkView
        items={workItems}
        role="Supervisor"
        currentPerson="Arjun Patil"
        onCreateWork={vi.fn()}
        onOpenWork={onOpenWork}
      />,
    );

    await user.click(screen.getByLabelText("Board"));
    expect(screen.getByRole("region", { name: "Work by state" })).toBeInTheDocument();
    const visibleItem = workItems.find((item) => item.state !== "Closed")!;
    await user.click(screen.getByRole("button", { name: new RegExp(visibleItem.title) }));
    expect(onOpenWork).toHaveBeenCalledWith(visibleItem);
  });
});
