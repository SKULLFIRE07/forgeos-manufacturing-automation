import type {
  EmployeeRecord,
  Priority,
  Project,
  Trend,
  WorkItem,
  WorkState,
} from "./types";

export type WorkUnit = WorkItem["unit"];
export type WorkShift = WorkItem["shift"];

export const WORK_STATE_ORDER: readonly WorkState[] = [
  "Not started",
  "In progress",
  "Blocked",
  "Awaiting verification",
  "Closed",
];

export const ESCALATION_THRESHOLD_MINUTES = 240;

const priorityWeight: Record<Priority, number> = {
  Critical: 800,
  High: 400,
  Medium: 150,
  Low: 0,
};

const stateWeight: Record<WorkState, number> = {
  Blocked: 10_000,
  "Awaiting verification": 4_000,
  "In progress": 500,
  "Not started": 250,
  Closed: 0,
};

const riskWeight: Record<Project["risk"], number> = {
  High: 3_000,
  Medium: 2_000,
  Low: 1_000,
};

const trendWeight: Record<Trend, number> = {
  Worsening: 600,
  Flat: 300,
  Improving: 0,
};

function decisionScore(item: WorkItem) {
  const overdueWeight = item.overdueMinutes
    ? 3_000 + Math.min(item.overdueMinutes, 1_500)
    : 0;

  return stateWeight[item.state] + priorityWeight[item.priority] + overdueWeight;
}

function projectExposureScore(project: Project) {
  return (
    riskWeight[project.risk] +
    trendWeight[project.trend] +
    project.openActions * 20 +
    (100 - project.completion) * 5
  );
}

export function selectScopedWorkItems(
  items: readonly WorkItem[],
  unit: WorkUnit,
  shift: WorkShift,
) {
  return items.filter((item) => item.unit === unit && item.shift === shift);
}

export function isOpenWork(item: WorkItem) {
  return item.state !== "Closed";
}

export function isWorkException(item: WorkItem) {
  return (
    item.state === "Blocked" ||
    item.state === "Awaiting verification" ||
    (item.overdueMinutes ?? 0) > 0
  );
}

export function needsEscalation(item: WorkItem) {
  return (
    item.state === "Blocked" ||
    (item.overdueMinutes ?? 0) >= ESCALATION_THRESHOLD_MINUTES
  );
}

export function rankWorkItemsForDecision(items: readonly WorkItem[]) {
  return [...items].sort((left, right) => {
    const scoreDifference = decisionScore(right) - decisionScore(left);
    if (scoreDifference !== 0) return scoreDifference;

    const dueDifference = Date.parse(left.due) - Date.parse(right.due);
    if (dueDifference !== 0) return dueDifference;

    return left.id.localeCompare(right.id);
  });
}

export function selectCommandWork(
  items: readonly WorkItem[],
  unit: WorkUnit,
  shift: WorkShift,
) {
  const scopedItems = selectScopedWorkItems(items, unit, shift);
  const activeItems = scopedItems.filter(isOpenWork);
  const rankedActiveItems = rankWorkItemsForDecision(activeItems);
  const decisionQueue = rankedActiveItems.filter(isWorkException);
  const blockedItems = activeItems.filter((item) => item.state === "Blocked");

  const stateCounts = WORK_STATE_ORDER.map((state) => ({
    state,
    count: scopedItems.filter((item) => item.state === state).length,
  }));

  return {
    scopedItems,
    activeItems,
    rankedActiveItems,
    decisionQueue,
    stateCounts,
    metrics: {
      activeCount: activeItems.length,
      exceptionCount: decisionQueue.length,
      escalationCount: activeItems.filter(needsEscalation).length,
      blockedCount: blockedItems.length,
      overdueBlockedCount: blockedItems.filter(
        (item) => (item.overdueMinutes ?? 0) > 0,
      ).length,
      awaitingVerificationCount: activeItems.filter(
        (item) => item.state === "Awaiting verification",
      ).length,
    },
  };
}

export function selectShiftWorkforce(
  employees: readonly EmployeeRecord[],
  unit: WorkUnit,
  shift: WorkShift,
) {
  const people = employees.filter(
    (employee) => employee.unit === unit && employee.shift === shift,
  );
  const present = people.filter((employee) => employee.status === "Present");

  return {
    total: people.length,
    present: present.length,
    unavailable: people.length - present.length,
  };
}

export function rankProjectsByExposure(projects: readonly Project[]) {
  return [...projects].sort((left, right) => {
    const scoreDifference = projectExposureScore(right) - projectExposureScore(left);
    if (scoreDifference !== 0) return scoreDifference;

    const dueDifference = Date.parse(left.due) - Date.parse(right.due);
    if (dueDifference !== 0) return dueDifference;

    return left.id.localeCompare(right.id);
  });
}
