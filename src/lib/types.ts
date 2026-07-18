export type ModuleId =
  | "command"
  | "work"
  | "projects"
  | "quality"
  | "maintenance"
  | "safety"
  | "workforce"
  | "kpis"
  | "documents"
  | "suppliers"
  | "settings";

export type UserRole = "Operator" | "Supervisor" | "HOD" | "Executive" | "Admin";
export type WorkState =
  | "Not started"
  | "In progress"
  | "Blocked"
  | "Awaiting verification"
  | "Closed";
export type Priority = "Critical" | "High" | "Medium" | "Low";
export type RiskLevel = "High" | "Medium" | "Low";
export type Trend = "Worsening" | "Flat" | "Improving";

export interface NavigationItem {
  id: ModuleId;
  label: string;
  badge?: number;
}

export interface WorkItem {
  id: string;
  title: string;
  type: "Production" | "Quality" | "Maintenance" | "Safety" | "Project" | "Document";
  priority: Priority;
  state: WorkState;
  owner: string;
  ownerRole: string;
  supervisor: string;
  station: string;
  unit: "Unit 1" | "Unit 2";
  shift: "Day" | "Night";
  due: string;
  overdueMinutes?: number;
  project?: string;
  asset?: string;
  evidenceCount: number;
  blocker?: string;
  checklistDone: number;
  checklistTotal: number;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  customer: string;
  owner: string;
  stage: string;
  completion: number;
  risk: RiskLevel;
  riskDriver: string;
  trend: Trend;
  nextMilestone: string;
  due: string;
  openActions: number;
}

export interface QualityRecord {
  id: string;
  title: string;
  kind: "Major NC" | "Minor NC" | "Observation" | "CAPA" | "Hold";
  source: string;
  owner: string;
  due: string;
  state: WorkState;
  ageDays: number;
  project?: string;
}

export interface AssetRecord {
  id: string;
  name: string;
  area: string;
  health: "Available" | "Attention" | "Down" | "Calibration hold";
  owner: string;
  nextService: string;
  openWork: number;
  runtimeHours: number;
}

export interface SafetyRecord {
  id: string;
  title: string;
  kind: "Incident" | "Near miss" | "Unsafe condition" | "Toolbox talk" | "Permit";
  area: string;
  owner: string;
  state: WorkState;
  due: string;
  severity: RiskLevel;
}

export interface EmployeeRecord {
  id: string;
  name: string;
  role: string;
  department: string;
  unit: "Unit 1" | "Unit 2";
  supervisor: string;
  shift: "Day" | "Night";
  status: "Present" | "Absent" | "On leave" | "Training";
  skillCoverage: number;
  assignedWork: number;
}

export interface KpiRecord {
  id: string;
  name: string;
  department: string;
  owner: string;
  target: string;
  actual: string;
  frequency: string;
  state: "On target" | "At risk" | "Off target" | "Missing update";
  actionCount: number;
  trend: Trend;
}

export interface DocumentRecord {
  id: string;
  title: string;
  code: string;
  revision: string;
  owner: string;
  area: string;
  state: "Effective" | "Review due" | "Draft" | "Superseded";
  effectiveDate: string;
  acknowledgements: string;
}

export interface SupplierRecord {
  id: string;
  name: string;
  category: string;
  owner: string;
  qualityScore: number;
  deliveryScore: number;
  openIssues: number;
  nextCommitment: string;
  risk: RiskLevel;
}

export interface ActivityRecord {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
}

export interface ToastMessage {
  id: number;
  title: string;
  message: string;
  actionLabel?: string;
}

export interface CreateWorkInput {
  title: string;
  type: WorkItem["type"];
  priority: Priority;
  owner: string;
  station: string;
  due: string;
  project?: string;
}
