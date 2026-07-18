import { describe, expect, it } from "vitest";

import {
  employees,
  kpis,
  operationalSummary,
  projectEmployeeAssignments,
  qualityRecords,
  workItems,
  workforceSummary,
} from "@/lib/seed";

describe("client operational seed", () => {
  it("preserves the audited workforce totals", () => {
    expect(employees).toHaveLength(83);
    expect(workforceSummary).toMatchObject({ required: 92, available: 83, gap: 9, unit1: 27, unit2: 56 });
  });

  it("preserves quality and KPI findings without broken records", () => {
    expect(operationalSummary.auditFindings).toBe(83);
    expect(operationalSummary.majorNonconformities).toBe(22);
    expect(kpis).toHaveLength(26);
    expect(kpis.filter((kpi) => kpi.state === "Missing update")).toHaveLength(5);
  });

  it("keeps project staffing and work references consistent", () => {
    const linked = new Set(Object.values(projectEmployeeAssignments).flat());
    expect(Object.keys(projectEmployeeAssignments)).toHaveLength(7);
    expect(linked.size).toBe(31);
    expect(workItems.every((item) => employees.some((employee) => employee.name === item.owner))).toBe(true);
    expect(new Set(qualityRecords.map((record) => record.id)).size).toBe(qualityRecords.length);
  });
});
