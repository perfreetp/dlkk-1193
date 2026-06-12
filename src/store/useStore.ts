import { create } from 'zustand';
import type { Project, ScanRecord, ScanSchedule, Issue, RuleConfig, ImprovementPlan, TeamRanking, TrendDataPoint } from '@/types';

const PROJECTS: Project[] = [
  { id: 'p1', name: 'NovaPay 支付网关', repoUrl: 'https://github.com/team/novapay-gateway', branch: 'main', lastScanTime: '2026-06-13T08:30:00', qualityScore: 87, totalIssues: 12, criticalIssues: 1, status: 'connected' },
  { id: 'p2', name: 'Atlas 数据平台', repoUrl: 'https://github.com/team/atlas-platform', branch: 'develop', lastScanTime: '2026-06-12T14:20:00', qualityScore: 72, totalIssues: 34, criticalIssues: 5, status: 'connected' },
  { id: 'p3', name: 'Meridian 用户中心', repoUrl: 'https://github.com/team/meridian-user', branch: 'main', lastScanTime: '2026-06-13T06:00:00', qualityScore: 91, totalIssues: 6, criticalIssues: 0, status: 'connected' },
  { id: 'p4', name: 'Horizon 运维工具', repoUrl: 'https://github.com/team/horizon-ops', branch: 'release/2.3', lastScanTime: '2026-06-11T20:15:00', qualityScore: 63, totalIssues: 48, criticalIssues: 8, status: 'connected' },
  { id: 'p5', name: 'Pulse 监控服务', repoUrl: 'https://github.com/team/pulse-monitor', branch: 'main', lastScanTime: null, qualityScore: 0, totalIssues: 0, criticalIssues: 0, status: 'disconnected' },
  { id: 'p6', name: 'Echo 消息队列', repoUrl: 'https://github.com/team/echo-mq', branch: 'develop', lastScanTime: '2026-06-13T10:45:00', qualityScore: 78, totalIssues: 19, criticalIssues: 3, status: 'scanning' },
];

const SCAN_RECORDS: ScanRecord[] = [
  { id: 's1', projectId: 'p1', startTime: '2026-06-13T08:30:00', endTime: '2026-06-13T08:35:00', status: 'completed', results: { duplicateCodeRate: 4.2, cyclomaticComplexity: 12, defectRiskCount: 3, dependencyVulnerabilities: 2, testCoverage: 82.5 } },
  { id: 's2', projectId: 'p2', startTime: '2026-06-12T14:20:00', endTime: '2026-06-12T14:28:00', status: 'completed', results: { duplicateCodeRate: 11.8, cyclomaticComplexity: 24, defectRiskCount: 12, dependencyVulnerabilities: 8, testCoverage: 56.3 } },
  { id: 's3', projectId: 'p3', startTime: '2026-06-13T06:00:00', endTime: '2026-06-13T06:04:00', status: 'completed', results: { duplicateCodeRate: 2.1, cyclomaticComplexity: 8, defectRiskCount: 1, dependencyVulnerabilities: 1, testCoverage: 93.7 } },
  { id: 's4', projectId: 'p4', startTime: '2026-06-11T20:15:00', endTime: '2026-06-11T20:25:00', status: 'completed', results: { duplicateCodeRate: 18.5, cyclomaticComplexity: 32, defectRiskCount: 18, dependencyVulnerabilities: 14, testCoverage: 41.2 } },
  { id: 's5', projectId: 'p6', startTime: '2026-06-13T10:45:00', endTime: null, status: 'running', results: null },
];

const SCAN_SCHEDULES: ScanSchedule[] = [
  { projectId: 'p1', enabled: true, cron: '0 8 * * 1-5', nextRun: '2026-06-14T08:00:00' },
  { projectId: 'p2', enabled: true, cron: '0 14 * * 1', nextRun: '2026-06-15T14:00:00' },
  { projectId: 'p3', enabled: true, cron: '0 6 * * 1-5', nextRun: '2026-06-14T06:00:00' },
  { projectId: 'p4', enabled: false, cron: '', nextRun: '' },
  { projectId: 'p6', enabled: true, cron: '0 10 * * 1-5', nextRun: '2026-06-14T10:00:00' },
];

const ISSUES: Issue[] = [
  { id: 'i1', projectId: 'p1', projectName: 'NovaPay 支付网关', title: '支付回调处理缺少幂等校验', description: 'PaymentCallbackHandler.process() 方法在处理重复回调时可能导致重复入账，需要增加幂等性检查。', severity: 'critical', status: 'assigned', filePath: 'src/services/PaymentCallbackHandler.ts', lineStart: 45, lineEnd: 67, assignee: '张明', dueDate: '2026-06-15', resolution: null, createdAt: '2026-06-10T10:00:00', updatedAt: '2026-06-11T09:00:00', category: 'defect' },
  { id: 'i2', projectId: 'p2', projectName: 'Atlas 数据平台', title: '数据导出模块重复代码率过高', description: 'CSVExport 和 ExcelExport 两个类有超过 60% 的重复代码，应抽象公共基类。', severity: 'high', status: 'open', filePath: 'src/export/CSVExportService.ts', lineStart: 12, lineEnd: 89, assignee: null, dueDate: null, resolution: null, createdAt: '2026-06-09T14:00:00', updatedAt: '2026-06-09T14:00:00', category: 'duplicate' },
  { id: 'i3', projectId: 'p4', projectName: 'Horizon 运维工具', title: '配置解析函数圈复杂度达 32', description: 'ConfigParser.parse() 方法圈复杂度远超阈值(15)，包含大量嵌套条件分支，严重影响可维护性。', severity: 'high', status: 'in_progress', filePath: 'src/parser/ConfigParser.ts', lineStart: 100, lineEnd: 245, assignee: '王磊', dueDate: '2026-06-18', resolution: null, createdAt: '2026-06-08T16:00:00', updatedAt: '2026-06-12T11:00:00', category: 'complexity' },
  { id: 'i4', projectId: 'p2', projectName: 'Atlas 数据平台', title: 'lodash 版本存在原型污染漏洞', description: '当前使用的 lodash@4.17.15 存在 CVE-2020-8203 原型污染漏洞，需升级至 4.17.21+。', severity: 'critical', status: 'assigned', filePath: 'package.json', lineStart: 34, lineEnd: 34, assignee: '李芳', dueDate: '2026-06-14', resolution: null, createdAt: '2026-06-11T08:00:00', updatedAt: '2026-06-12T10:00:00', category: 'vulnerability' },
  { id: 'i5', projectId: 'p4', projectName: 'Horizon 运维工具', title: '核心模块测试覆盖率仅 41%', description: '运维工具核心模块测试覆盖率远低于团队要求的 80% 最低标准，需补充单元测试和集成测试。', severity: 'high', status: 'open', filePath: 'src/core/', lineStart: 1, lineEnd: 1, assignee: null, dueDate: null, resolution: null, createdAt: '2026-06-10T09:00:00', updatedAt: '2026-06-10T09:00:00', category: 'coverage' },
  { id: 'i6', projectId: 'p6', projectName: 'Echo 消息队列', title: '消息重试机制存在死循环风险', description: '当消息持续处理失败时，重试逻辑可能导致无限循环，缺少最大重试次数限制。', severity: 'critical', status: 'open', filePath: 'src/retry/MessageRetryHandler.ts', lineStart: 23, lineEnd: 56, assignee: null, dueDate: null, resolution: null, createdAt: '2026-06-12T15:00:00', updatedAt: '2026-06-12T15:00:00', category: 'defect' },
  { id: 'i7', projectId: 'p1', projectName: 'NovaPay 支付网关', title: '日志模块存在重复的格式化代码', description: 'LogFormatter 和 AuditLogger 中有相似的日期格式化和字段拼接逻辑。', severity: 'low', status: 'resolved', filePath: 'src/logging/LogFormatter.ts', lineStart: 30, lineEnd: 52, assignee: '陈浩', dueDate: '2026-06-12', resolution: '已提取公共方法 formatLogEntry()，两个类共享同一实现', createdAt: '2026-06-08T11:00:00', updatedAt: '2026-06-12T16:00:00', category: 'duplicate' },
  { id: 'i8', projectId: 'p4', projectName: 'Horizon 运维工具', title: '依赖 axios 存在 SSRF 漏洞', description: 'axios@0.21.1 存在 CVE-2021-3749 SSRF 漏洞，需升级至 1.6.0+。', severity: 'critical', status: 'assigned', filePath: 'package.json', lineStart: 28, lineEnd: 28, assignee: '刘洋', dueDate: '2026-06-14', resolution: null, createdAt: '2026-06-11T10:00:00', updatedAt: '2026-06-12T09:00:00', category: 'vulnerability' },
  { id: 'i9', projectId: 'p2', projectName: 'Atlas 数据平台', title: '查询构建器圈复杂度 24', description: 'QueryBuilder.build() 方法包含过多条件分支，建议使用策略模式重构。', severity: 'medium', status: 'in_progress', filePath: 'src/query/QueryBuilder.ts', lineStart: 78, lineEnd: 156, assignee: '赵雪', dueDate: '2026-06-20', resolution: null, createdAt: '2026-06-09T16:00:00', updatedAt: '2026-06-13T09:00:00', category: 'complexity' },
  { id: 'i10', projectId: 'p3', projectName: 'Meridian 用户中心', title: '用户校验工具类轻微重复', description: 'UserValidator 和 ProfileValidator 中有部分字段校验逻辑重复，建议提取公共校验器。', severity: 'low', status: 'open', filePath: 'src/validation/UserValidator.ts', lineStart: 15, lineEnd: 35, assignee: null, dueDate: null, resolution: null, createdAt: '2026-06-12T10:00:00', updatedAt: '2026-06-12T10:00:00', category: 'duplicate' },
  { id: 'i11', projectId: 'p4', projectName: 'Horizon 运维工具', title: '部署脚本缺少错误处理', description: 'deploy.sh 中多处关键操作缺少错误检查，可能导致静默失败。', severity: 'medium', status: 'open', filePath: 'scripts/deploy.sh', lineStart: 10, lineEnd: 45, assignee: null, dueDate: null, resolution: null, createdAt: '2026-06-11T14:00:00', updatedAt: '2026-06-11T14:00:00', category: 'defect' },
  { id: 'i12', projectId: 'p6', projectName: 'Echo 消息队列', title: '消费者模块测试覆盖率 52%', description: '消费者模块测试覆盖率低于要求的 80%，核心消费逻辑缺少测试用例。', severity: 'medium', status: 'assigned', filePath: 'src/consumer/', lineStart: 1, lineEnd: 1, assignee: '孙强', dueDate: '2026-06-19', resolution: null, createdAt: '2026-06-12T11:00:00', updatedAt: '2026-06-13T08:00:00', category: 'coverage' },
  { id: 'i13', projectId: 'p2', projectName: 'Atlas 数据平台', title: '数据源连接池存在资源泄漏', description: 'ConnectionPool.release() 在异常路径上未正确释放连接，长期运行会导致连接耗尽。', severity: 'critical', status: 'in_progress', filePath: 'src/db/ConnectionPool.ts', lineStart: 89, lineEnd: 120, assignee: '张明', dueDate: '2026-06-15', resolution: null, createdAt: '2026-06-10T08:00:00', updatedAt: '2026-06-13T07:00:00', category: 'defect' },
  { id: 'i14', projectId: 'p4', projectName: 'Horizon 运维工具', title: 'API 网关模块重复路由定义', description: '多个路由文件中存在相似的路由定义和中间件配置模式。', severity: 'low', status: 'open', filePath: 'src/routes/apiRoutes.ts', lineStart: 20, lineEnd: 55, assignee: null, dueDate: null, resolution: null, createdAt: '2026-06-11T16:00:00', updatedAt: '2026-06-11T16:00:00', category: 'duplicate' },
  { id: 'i15', projectId: 'p1', projectName: 'NovaPay 支付网关', title: '签名验证模块测试覆盖率 68%', description: '支付签名验证模块测试覆盖率低于安全模块要求的 90%。', severity: 'medium', status: 'open', filePath: 'src/crypto/SignatureVerifier.ts', lineStart: 1, lineEnd: 1, assignee: null, dueDate: null, resolution: null, createdAt: '2026-06-11T13:00:00', updatedAt: '2026-06-11T13:00:00', category: 'coverage' },
];

const RULE_CONFIGS: RuleConfig[] = [
  {
    projectId: 'p1',
    checks: [
      { id: 'c1', name: '重复代码检测', category: 'duplicate', enabled: true, threshold: 5, description: '重复代码率上限（百分比）' },
      { id: 'c2', name: '圈复杂度检查', category: 'complexity', enabled: true, threshold: 15, description: '单函数最大圈复杂度' },
      { id: 'c3', name: '缺陷风险扫描', category: 'defect', enabled: true, threshold: 5, description: '缺陷风险最大数量' },
      { id: 'c4', name: '依赖漏洞检查', category: 'vulnerability', enabled: true, threshold: 3, description: '依赖漏洞最大数量' },
      { id: 'c5', name: '测试覆盖率检查', category: 'coverage', enabled: true, threshold: 80, description: '最低测试覆盖率（百分比）' },
    ],
  },
  {
    projectId: 'p2',
    checks: [
      { id: 'c1', name: '重复代码检测', category: 'duplicate', enabled: true, threshold: 8, description: '重复代码率上限（百分比）' },
      { id: 'c2', name: '圈复杂度检查', category: 'complexity', enabled: true, threshold: 20, description: '单函数最大圈复杂度' },
      { id: 'c3', name: '缺陷风险扫描', category: 'defect', enabled: true, threshold: 10, description: '缺陷风险最大数量' },
      { id: 'c4', name: '依赖漏洞检查', category: 'vulnerability', enabled: true, threshold: 5, description: '依赖漏洞最大数量' },
      { id: 'c5', name: '测试覆盖率检查', category: 'coverage', enabled: false, threshold: 70, description: '最低测试覆盖率（百分比）' },
    ],
  },
  {
    projectId: 'p3',
    checks: [
      { id: 'c1', name: '重复代码检测', category: 'duplicate', enabled: true, threshold: 5, description: '重复代码率上限（百分比）' },
      { id: 'c2', name: '圈复杂度检查', category: 'complexity', enabled: true, threshold: 12, description: '单函数最大圈复杂度' },
      { id: 'c3', name: '缺陷风险扫描', category: 'defect', enabled: true, threshold: 3, description: '缺陷风险最大数量' },
      { id: 'c4', name: '依赖漏洞检查', category: 'vulnerability', enabled: true, threshold: 2, description: '依赖漏洞最大数量' },
      { id: 'c5', name: '测试覆盖率检查', category: 'coverage', enabled: true, threshold: 90, description: '最低测试覆盖率（百分比）' },
    ],
  },
  {
    projectId: 'p4',
    checks: [
      { id: 'c1', name: '重复代码检测', category: 'duplicate', enabled: true, threshold: 10, description: '重复代码率上限（百分比）' },
      { id: 'c2', name: '圈复杂度检查', category: 'complexity', enabled: true, threshold: 25, description: '单函数最大圈复杂度' },
      { id: 'c3', name: '缺陷风险扫描', category: 'defect', enabled: false, threshold: 15, description: '缺陷风险最大数量' },
      { id: 'c4', name: '依赖漏洞检查', category: 'vulnerability', enabled: true, threshold: 8, description: '依赖漏洞最大数量' },
      { id: 'c5', name: '测试覆盖率检查', category: 'coverage', enabled: false, threshold: 60, description: '最低测试覆盖率（百分比）' },
    ],
  },
  {
    projectId: 'p6',
    checks: [
      { id: 'c1', name: '重复代码检测', category: 'duplicate', enabled: true, threshold: 7, description: '重复代码率上限（百分比）' },
      { id: 'c2', name: '圈复杂度检查', category: 'complexity', enabled: true, threshold: 18, description: '单函数最大圈复杂度' },
      { id: 'c3', name: '缺陷风险扫描', category: 'defect', enabled: true, threshold: 5, description: '缺陷风险最大数量' },
      { id: 'c4', name: '依赖漏洞检查', category: 'vulnerability', enabled: true, threshold: 3, description: '依赖漏洞最大数量' },
      { id: 'c5', name: '测试覆盖率检查', category: 'coverage', enabled: true, threshold: 80, description: '最低测试覆盖率（百分比）' },
    ],
  },
];

const PLANS: ImprovementPlan[] = [
  {
    id: 'pl1', name: 'Sprint 23 安全加固', description: '修复所有严重依赖漏洞和关键缺陷风险问题', startDate: '2026-06-10', endDate: '2026-06-20', status: 'active',
    issueIds: ['i1', 'i4', 'i6', 'i8', 'i13'], completedIssueIds: [],
    createdAt: '2026-06-09T10:00:00',
  },
  {
    id: 'pl2', name: '技术债务清理 第一阶段', description: '降低 Atlas 和 Horizon 的重复代码率和圈复杂度', startDate: '2026-06-15', endDate: '2026-07-05', status: 'active',
    issueIds: ['i2', 'i3', 'i9', 'i14'], completedIssueIds: [],
    createdAt: '2026-06-12T14:00:00',
  },
  {
    id: 'pl3', name: '测试覆盖率提升', description: '将所有项目核心模块测试覆盖率提升至 80% 以上', startDate: '2026-06-01', endDate: '2026-06-15', status: 'active',
    issueIds: ['i5', 'i12', 'i15'], completedIssueIds: [],
    createdAt: '2026-05-30T09:00:00',
  },
];

const TEAM_MEMBERS = ['张明', '李芳', '王磊', '赵雪', '陈浩', '刘洋', '孙强', '周婷'];

const TEAM_RANKINGS: TeamRanking[] = [
  { member: '张明', avatar: 'ZM', qualityScore: 92, resolvedCount: 18, openIssueCount: 2, avgResolutionDays: 2.3 },
  { member: '赵雪', avatar: 'ZX', qualityScore: 88, resolvedCount: 14, openIssueCount: 3, avgResolutionDays: 3.1 },
  { member: '陈浩', avatar: 'CH', qualityScore: 85, resolvedCount: 12, openIssueCount: 1, avgResolutionDays: 2.8 },
  { member: '李芳', avatar: 'LF', qualityScore: 82, resolvedCount: 10, openIssueCount: 4, avgResolutionDays: 3.5 },
  { member: '王磊', avatar: 'WL', qualityScore: 78, resolvedCount: 8, openIssueCount: 5, avgResolutionDays: 4.2 },
  { member: '刘洋', avatar: 'LY', qualityScore: 75, resolvedCount: 6, openIssueCount: 3, avgResolutionDays: 5.0 },
  { member: '孙强', avatar: 'SQ', qualityScore: 71, resolvedCount: 5, openIssueCount: 4, avgResolutionDays: 5.8 },
  { member: '周婷', avatar: 'ZT', qualityScore: 68, resolvedCount: 3, openIssueCount: 6, avgResolutionDays: 7.2 },
];

const QUALITY_TREND: TrendDataPoint[] = [
  { date: '05-19', value: 71 }, { date: '05-22', value: 73 }, { date: '05-25', value: 72 },
  { date: '05-28', value: 75 }, { date: '05-31', value: 77 }, { date: '06-03', value: 76 },
  { date: '06-06', value: 79 }, { date: '06-09', value: 78 }, { date: '06-12', value: 80 },
  { date: '06-13', value: 81 },
];

const ISSUE_TREND: TrendDataPoint[] = [
  { date: '05-19', value: 45 }, { date: '05-22', value: 52 }, { date: '05-25', value: 48 },
  { date: '05-28', value: 55 }, { date: '05-31', value: 50 }, { date: '06-03', value: 47 },
  { date: '06-06', value: 43 }, { date: '06-09', value: 38 }, { date: '06-12', value: 35 },
  { date: '06-13', value: 32 },
];

interface AppState {
  projects: Project[];
  scanRecords: ScanRecord[];
  scanSchedules: ScanSchedule[];
  issues: Issue[];
  ruleConfigs: RuleConfig[];
  plans: ImprovementPlan[];
  teamMembers: string[];
  teamRankings: TeamRanking[];
  qualityTrend: TrendDataPoint[];
  issueTrend: TrendDataPoint[];

  addProject: (project: Omit<Project, 'id' | 'qualityScore' | 'totalIssues' | 'criticalIssues'>) => void;
  triggerScan: (projectId: string) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  updateRuleConfig: (projectId: string, checkId: string, updates: Partial<{ enabled: boolean; threshold: number }>) => void;
  addPlan: (plan: Omit<ImprovementPlan, 'id' | 'createdAt' | 'completedIssueIds'>) => void;
  completePlanIssue: (planId: string, issueId: string) => void;
  updateScanSchedule: (projectId: string, updates: Partial<ScanSchedule>) => void;
}

export const useStore = create<AppState>((set) => ({
  projects: PROJECTS,
  scanRecords: SCAN_RECORDS,
  scanSchedules: SCAN_SCHEDULES,
  issues: ISSUES,
  ruleConfigs: RULE_CONFIGS,
  plans: PLANS,
  teamMembers: TEAM_MEMBERS,
  teamRankings: TEAM_RANKINGS,
  qualityTrend: QUALITY_TREND,
  issueTrend: ISSUE_TREND,

  addProject: (project) => set((state) => ({
    projects: [...state.projects, {
      ...project,
      id: `p${Date.now()}`,
      qualityScore: 0,
      totalIssues: 0,
      criticalIssues: 0,
    }],
  })),

  triggerScan: (projectId) => set((state) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return state;
    const scanId = `s${Date.now()}`;
    const newRecord: ScanRecord = {
      id: scanId,
      projectId,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'running',
      results: null,
    };
    return {
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, status: 'scanning' as const } : p
      ),
      scanRecords: [newRecord, ...state.scanRecords],
    };
  }),

  updateIssue: (id, updates) => set((state) => ({
    issues: state.issues.map((issue) =>
      issue.id === id ? { ...issue, ...updates, updatedAt: new Date().toISOString() } : issue
    ),
  })),

  updateRuleConfig: (projectId, checkId, updates) => set((state) => ({
    ruleConfigs: state.ruleConfigs.map((config) =>
      config.projectId === projectId
        ? {
            ...config,
            checks: config.checks.map((check) =>
              check.id === checkId ? { ...check, ...updates } : check
            ),
          }
        : config
    ),
  })),

  addPlan: (plan) => set((state) => ({
    plans: [...state.plans, {
      ...plan,
      id: `pl${Date.now()}`,
      completedIssueIds: [],
      createdAt: new Date().toISOString(),
    }],
  })),

  completePlanIssue: (planId, issueId) => set((state) => ({
    plans: state.plans.map((plan) =>
      plan.id === planId
        ? { ...plan, completedIssueIds: [...plan.completedIssueIds, issueId] }
        : plan
    ),
    issues: state.issues.map((issue) =>
      issue.id === issueId ? { ...issue, status: 'resolved' as const, updatedAt: new Date().toISOString() } : issue
    ),
  })),

  updateScanSchedule: (projectId, updates) => set((state) => ({
    scanSchedules: state.scanSchedules.map((schedule) =>
      schedule.projectId === projectId ? { ...schedule, ...updates } : schedule
    ),
  })),
}));
