export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type IssueStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
export type IssueCategory = 'duplicate' | 'complexity' | 'defect' | 'vulnerability' | 'coverage';
export type PlanStatus = 'active' | 'completed' | 'overdue';
export type ProjectStatus = 'connected' | 'disconnected' | 'scanning';

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  lastScanTime: string | null;
  qualityScore: number;
  totalIssues: number;
  criticalIssues: number;
  status: ProjectStatus;
}

export interface ScanRecord {
  id: string;
  projectId: string;
  startTime: string;
  endTime: string | null;
  status: 'running' | 'completed' | 'failed';
  results: ScanResults | null;
}

export interface ScanResults {
  duplicateCodeRate: number;
  cyclomaticComplexity: number;
  defectRiskCount: number;
  dependencyVulnerabilities: number;
  testCoverage: number;
}

export interface ScanSchedule {
  projectId: string;
  enabled: boolean;
  cron: string;
  nextRun: string;
}

export interface Issue {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  status: IssueStatus;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  assignee: string | null;
  dueDate: string | null;
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  category: IssueCategory;
}

export interface CheckConfig {
  id: string;
  name: string;
  category: IssueCategory;
  enabled: boolean;
  threshold: number;
  description: string;
}

export interface RuleConfig {
  projectId: string;
  checks: CheckConfig[];
}

export interface ImprovementPlan {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: PlanStatus;
  issueIds: string[];
  completedIssueIds: string[];
  createdAt: string;
  milestones: PlanMilestone[];
}

export interface PlanMilestone {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  issueIds: string[];
  status: 'pending' | 'active' | 'completed' | 'overdue';
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  checks: CheckConfig[];
  createdAt: string;
  sourceProjectId: string;
  sourceProjectName: string;
}

export interface TeamRanking {
  member: string;
  avatar: string;
  qualityScore: number;
  resolvedCount: number;
  openIssueCount: number;
  avgResolutionDays: number;
}

export interface TrendDataPoint {
  date: string;
  value: number;
}
