import { describe, expect, it } from "vitest";

import {
  rankProjectsByExposure,
  selectCommandWork,
  selectShiftWorkforce,
} from "@/lib/metrics";
import { employees, projects, workItems } from "@/lib/seed";

describe("command metrics", () => {
  it("scopes work truth to the selected unit and shift", () => {
    const command = selectCommandWork(workItems, "Unit 2", "Day");

    expect(command.scopedItems).toHaveLength(9);
    expect(command.activeItems).toHaveLength(7);
    expect(command.metrics).toMatchObject({
      activeCount: 7,
      exceptionCount: 4,
      escalationCount: 3,
      blockedCount: 2,
      overdueBlockedCount: 2,
      awaitingVerificationCount: 2,
    });
    expect(command.scopedItems.every(
      (item) => item.unit === "Unit 2" && item.shift === "Day",
    )).toBe(true);
  });

  it("orders decisions by operational exposure", () => {
    const command = selectCommandWork(workItems, "Unit 2", "Day");

    expect(command.decisionQueue.map((item) => item.id)).toEqual([
      "WK-001",
      "WK-014",
      "WK-002",
      "WK-007",
    ]);
    expect(rankProjectsByExposure(projects).slice(0, 3).map((project) => project.id)).toEqual([
      "S010088",
      "CIWS-26",
      "S010067",
    ]);
  });

  it("derives present workforce from the same scope", () => {
    expect(selectShiftWorkforce(employees, "Unit 2", "Day")).toEqual({
      total: 28,
      present: 25,
      unavailable: 3,
    });
  });
});
