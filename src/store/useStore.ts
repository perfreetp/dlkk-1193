import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Project,
  ProjectGroup,
  ScanRecord,
  ScanSchedule,
  Issue,
  RuleConfig,
  ImprovementPlan,
  TeamRanking,
  TrendDataPoint,
  ScanResults,
  IssueCategory,
  SeverityLevel,
  RuleTemplate,
  PlanMilestone,
} from '@/types';

const STORAGE_KEY = 'code-quality-center-v1';

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

function calculateQualityScore(r: ScanResults): number {
  const score =
    r.testCoverage * 0.3 +
    Math.max(0, 100 - r.duplicateCodeRate * 5) * 0.2 +
    Math.max(0, 100 - r.cyclomaticComplexity * 2) * 0.2 +
    Math.max(0, 100 - r.defectRiskCount * 5) * 0.15 +
    Math.max(0, 100 - r.dependencyVulnerabilities * 5) * 0.15;
  return Math.round(Math.min(100, Math.max(0, score)));
}

function generateMockScanResults(qualityLevel: 'high' | 'mid' | 'low' = 'mid'): ScanResults {
  const ranges = {
    high: { dup: [1, 5], comp: [5, 12], defect: [0, 3], vuln: [0, 2], cov: [80, 95] },
    mid: { dup: [5, 12], comp: [10, 25], defect: [3, 10], vuln: [2, 6], cov: [55, 78] },
    low: { dup: [12, 22], comp: [20, 35], defect: [10, 20], vuln: [6, 15], cov: [30, 55] },
  };
  const r = ranges[qualityLevel];
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;
  const dup = +rand(r.dup[0], r.dup[1]).toFixed(1);
  const comp = Math.round(rand(r.comp[0], r.comp[1]));
  const defect = Math.round(rand(r.defect[0], r.defect[1]));
  const vuln = Math.round(rand(r.vuln[0], r.vuln[1]));
  const cov = +rand(r.cov[0], r.cov[1]).toFixed(1);
  return {
    duplicateCodeRate: dup,
    cyclomaticComplexity: comp,
    defectRiskCount: defect,
    dependencyVulnerabilities: vuln,
    testCoverage: cov,
  };
}

const ISSUE_TEMPLATES: Record<IssueCategory, { titles: string[]; descriptions: string[]; filePaths: string[] }> = {
  duplicate: {
    titles: ['模块存在重复代码', '工具函数重复实现', '格式转换逻辑重复', '配置解析代码重复', '错误处理逻辑重复'],
    descriptions: [
      '两个模块中存在高度相似的代码段，建议提取公共方法',
      '相似逻辑重复出现在多个文件中，应抽象为公共工具',
      '代码重复率超过阈值，影响可维护性',
    ],
    filePaths: ['src/utils/helpers.ts', 'src/services/common.ts', 'src/components/Shared.tsx', 'src/lib/format.ts'],
  },
  complexity: {
    titles: ['函数圈复杂度过高', '条件分支过多', '嵌套层级太深', '巨型函数需拆分', '状态机逻辑复杂'],
    descriptions: [
      '函数包含大量嵌套条件分支，建议使用策略模式重构',
      '圈复杂度远超阈值，增加测试和维护难度',
      '函数过长且分支复杂，应拆分为多个子函数',
    ],
    filePaths: ['src/core/engine.ts', 'src/parser/ConfigParser.ts', 'src/query/QueryBuilder.ts', 'src/handler/EventDispatcher.ts'],
  },
  defect: {
    titles: ['资源未正确释放', '空指针风险', '边界条件未处理', '并发安全问题', '异常被静默吞掉'],
    descriptions: [
      '异常路径下资源可能泄漏，需补充清理逻辑',
      '缺少空值检查，运行时存在崩溃风险',
      '边界条件考虑不周，可能导致越界或死循环',
    ],
    filePaths: ['src/db/ConnectionPool.ts', 'src/io/StreamReader.ts', 'src/concurrent/TaskQueue.ts', 'src/handler/RequestProcessor.ts'],
  },
  vulnerability: {
    titles: ['依赖存在已知漏洞', '输入校验不足', '敏感信息泄露', 'SQL注入风险', 'XSS攻击风险'],
    descriptions: [
      '第三方依赖版本存在安全漏洞，需及时升级',
      '外部输入未经过充分校验，存在安全隐患',
      '敏感数据可能在日志或错误信息中泄露',
    ],
    filePaths: ['package.json', 'src/auth/AuthService.ts', 'src/security/Sanitizer.ts', 'src/db/QueryBuilder.ts'],
  },
  coverage: {
    titles: ['核心模块测试覆盖率不足', '关键路径缺少测试', '异常分支未覆盖', '边界用例缺失', '集成测试缺失'],
    descriptions: [
      '核心业务逻辑测试覆盖率低于要求标准',
      '关键异常路径缺少单元测试',
      '边界条件和错误处理场景未被测试覆盖',
    ],
    filePaths: ['src/core/', 'src/services/', 'src/domain/', 'src/infra/'],
  },
};

function generateIssuesFromResults(results: ScanResults, projectId: string, projectName: string): Issue[] {
  const issues: Issue[] = [];
  const categories: { cat: IssueCategory; count: number }[] = [
    { cat: 'defect', count: results.defectRiskCount },
    { cat: 'vulnerability', count: results.dependencyVulnerabilities },
    { cat: 'duplicate', count: Math.ceil(results.duplicateCodeRate / 2) },
    { cat: 'complexity', count: Math.ceil(results.cyclomaticComplexity / 5) },
    { cat: 'coverage', count: results.testCoverage < 70 ? 2 : results.testCoverage < 85 ? 1 : 0 },
  ];

  const now = new Date();
  let issueIdx = 0;

  categories.forEach(({ cat, count }) => {
    const templates = ISSUE_TEMPLATES[cat];
    for (let i = 0; i < count; i++) {
      const templateIdx = (issueIdx + i) % templates.titles.length;
      const fileIdx = (issueIdx + i) % templates.filePaths.length;
      const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

      const severityRoll = Math.random();
      let severity: SeverityLevel;
      if (cat === 'vulnerability' || cat === 'defect') {
        severity = severityRoll < 0.3 ? 'critical' : severityRoll < 0.7 ? 'high' : 'medium';
      } else if (cat === 'complexity') {
        severity = severityRoll < 0.15 ? 'high' : severityRoll < 0.6 ? 'medium' : 'low';
      } else {
        severity = severityRoll < 0.1 ? 'high' : severityRoll < 0.5 ? 'medium' : 'low';
      }

      const lineStart = rand(10, 150);
      const lineEnd = lineStart + rand(10, 50);

      issues.push({
        id: `i-${projectId}-${Date.now()}-${issueIdx}`,
        projectId,
        projectName,
        title: templates.titles[templateIdx],
        description: templates.descriptions[templateIdx % templates.descriptions.length],
        severity,
        status: 'open',
        filePath: templates.filePaths[fileIdx],
        lineStart,
        lineEnd,
        assignee: null,
        dueDate: null,
        resolution: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        category: cat,
      });
      issueIdx++;
    }
  });

  return issues;
}

function getDefaultRuleConfig(projectId: string): RuleConfig {
  return {
    projectId,
    checks: [
      { id: 'c1', name: '重复代码检测', category: 'duplicate', enabled: true, threshold: 8, description: '重复代码率上限（百分比）' },
      { id: 'c2', name: '圈复杂度检查', category: 'complexity', enabled: true, threshold: 20, description: '单函数最大圈复杂度' },
      { id: 'c3', name: '缺陷风险扫描', category: 'defect', enabled: true, threshold: 8, description: '缺陷风险最大数量' },
      { id: 'c4', name: '依赖漏洞检查', category: 'vulnerability', enabled: true, threshold: 5, description: '依赖漏洞最大数量' },
      { id: 'c5', name: '测试覆盖率检查', category: 'coverage', enabled: true, threshold: 70, description: '最低测试覆盖率（百分比）' },
    ],
  };
}

function getDefaultScanSchedule(projectId: string): ScanSchedule {
  return {
    projectId,
    enabled: false,
    cron: '0 8 * * 1-5',
    nextRun: '',
  };
}

const INITIAL_PROJECT_GROUPS: ProjectGroup[] = [
  { id: 'g1', name: '金融业务线', description: '支付、交易、清结算相关系统', color: '#3B82F6' },
  { id: 'g2', name: '数据平台组', description: '数据采集、处理、分析平台', color: '#8B5CF6' },
  { id: 'g3', name: '用户与平台组', description: '用户中心、基础平台、运维工具', color: '#06D6A0' },
];

const INITIAL_PROJECTS: Project[] = [
  { id: 'p1', name: 'NovaPay 支付网关', repoUrl: 'https://github.com/team/novapay-gateway', branch: 'main', lastScanTime: '2026-06-13T08:30:00', qualityScore: 87, totalIssues: 12, criticalIssues: 1, status: 'connected', groupId: 'g1' },
  { id: 'p2', name: 'Atlas 数据平台', repoUrl: 'https://github.com/team/atlas-platform', branch: 'develop', lastScanTime: '2026-06-12T14:20:00', qualityScore: 72, totalIssues: 34, criticalIssues: 5, status: 'connected', groupId: 'g2' },
  { id: 'p3', name: 'Meridian 用户中心', repoUrl: 'https://github.com/team/meridian-user', branch: 'main', lastScanTime: '2026-06-13T06:00:00', qualityScore: 91, totalIssues: 6, criticalIssues: 0, status: 'connected', groupId: 'g3' },
  { id: 'p4', name: 'Horizon 运维工具', repoUrl: 'https://github.com/team/horizon-ops', branch: 'release/2.3', lastScanTime: '2026-06-11T20:15:00', qualityScore: 63, totalIssues: 48, criticalIssues: 8, status: 'connected', groupId: 'g3' },
  { id: 'p5', name: 'Pulse 监控服务', repoUrl: 'https://github.com/team/pulse-monitor', branch: 'main', lastScanTime: null, qualityScore: 0, totalIssues: 0, criticalIssues: 0, status: 'disconnected', groupId: 'g3' },
  { id: 'p6', name: 'Echo 消息队列', repoUrl: 'https://github.com/team/echo-mq', branch: 'develop', lastScanTime: '2026-06-13T10:45:00', qualityScore: 78, totalIssues: 19, criticalIssues: 3, status: 'connected', groupId: 'g1' },
];

const INITIAL_SCAN_RECORDS: ScanRecord[] = [
  { id: 's1', projectId: 'p1', startTime: '2026-06-13T08:30:00', endTime: '2026-06-13T08:35:00', status: 'completed', results: { duplicateCodeRate: 4.2, cyclomaticComplexity: 12, defectRiskCount: 3, dependencyVulnerabilities: 2, testCoverage: 82.5 } },
  { id: 's1h1', projectId: 'p1', startTime: '2026-06-11T08:30:00', endTime: '2026-06-11T08:34:00', status: 'completed', results: { duplicateCodeRate: 4.8, cyclomaticComplexity: 13, defectRiskCount: 4, dependencyVulnerabilities: 3, testCoverage: 80.2 } },
  { id: 's1h2', projectId: 'p1', startTime: '2026-06-09T08:30:00', endTime: '2026-06-09T08:36:00', status: 'completed', results: { duplicateCodeRate: 5.3, cyclomaticComplexity: 14, defectRiskCount: 5, dependencyVulnerabilities: 3, testCoverage: 78.5 } },
  { id: 's1h3', projectId: 'p1', startTime: '2026-06-07T08:30:00', endTime: '2026-06-07T08:35:00', status: 'completed', results: { duplicateCodeRate: 5.8, cyclomaticComplexity: 15, defectRiskCount: 6, dependencyVulnerabilities: 4, testCoverage: 76.0 } },
  { id: 's1h4', projectId: 'p1', startTime: '2026-06-05T08:30:00', endTime: '2026-06-05T08:37:00', status: 'completed', results: { duplicateCodeRate: 6.2, cyclomaticComplexity: 16, defectRiskCount: 7, dependencyVulnerabilities: 5, testCoverage: 74.3 } },

  { id: 's2', projectId: 'p2', startTime: '2026-06-12T14:20:00', endTime: '2026-06-12T14:28:00', status: 'completed', results: { duplicateCodeRate: 11.8, cyclomaticComplexity: 24, defectRiskCount: 12, dependencyVulnerabilities: 8, testCoverage: 56.3 } },
  { id: 's2h1', projectId: 'p2', startTime: '2026-06-09T14:00:00', endTime: '2026-06-09T14:09:00', status: 'completed', results: { duplicateCodeRate: 12.5, cyclomaticComplexity: 26, defectRiskCount: 14, dependencyVulnerabilities: 9, testCoverage: 54.1 } },
  { id: 's2h2', projectId: 'p2', startTime: '2026-06-05T14:00:00', endTime: '2026-06-05T14:10:00', status: 'completed', results: { duplicateCodeRate: 13.2, cyclomaticComplexity: 28, defectRiskCount: 16, dependencyVulnerabilities: 11, testCoverage: 51.8 } },

  { id: 's3', projectId: 'p3', startTime: '2026-06-13T06:00:00', endTime: '2026-06-13T06:04:00', status: 'completed', results: { duplicateCodeRate: 2.1, cyclomaticComplexity: 8, defectRiskCount: 1, dependencyVulnerabilities: 1, testCoverage: 93.7 } },
  { id: 's3h1', projectId: 'p3', startTime: '2026-06-10T06:00:00', endTime: '2026-06-10T06:04:00', status: 'completed', results: { duplicateCodeRate: 2.5, cyclomaticComplexity: 9, defectRiskCount: 2, dependencyVulnerabilities: 1, testCoverage: 92.1 } },
  { id: 's3h2', projectId: 'p3', startTime: '2026-06-07T06:00:00', endTime: '2026-06-07T06:03:00', status: 'completed', results: { duplicateCodeRate: 2.8, cyclomaticComplexity: 9, defectRiskCount: 2, dependencyVulnerabilities: 2, testCoverage: 91.0 } },

  { id: 's4', projectId: 'p4', startTime: '2026-06-11T20:15:00', endTime: '2026-06-11T20:25:00', status: 'completed', results: { duplicateCodeRate: 18.5, cyclomaticComplexity: 32, defectRiskCount: 18, dependencyVulnerabilities: 14, testCoverage: 41.2 } },
  { id: 's4h1', projectId: 'p4', startTime: '2026-06-08T20:00:00', endTime: '2026-06-08T20:12:00', status: 'completed', results: { duplicateCodeRate: 17.2, cyclomaticComplexity: 30, defectRiskCount: 16, dependencyVulnerabilities: 12, testCoverage: 43.5 } },

  { id: 's6', projectId: 'p6', startTime: '2026-06-13T10:45:00', endTime: '2026-06-13T10:52:00', status: 'completed', results: { duplicateCodeRate: 6.8, cyclomaticComplexity: 16, defectRiskCount: 5, dependencyVulnerabilities: 3, testCoverage: 72.4 } },
  { id: 's6h1', projectId: 'p6', startTime: '2026-06-10T10:00:00', endTime: '2026-06-10T10:08:00', status: 'completed', results: { duplicateCodeRate: 7.5, cyclomaticComplexity: 18, defectRiskCount: 7, dependencyVulnerabilities: 4, testCoverage: 70.1 } },
];

const INITIAL_SCAN_SCHEDULES: ScanSchedule[] = [
  { projectId: 'p1', enabled: true, cron: '0 8 * * 1-5', nextRun: '2026-06-14T08:00:00' },
  { projectId: 'p2', enabled: true, cron: '0 14 * * 1', nextRun: '2026-06-15T14:00:00' },
  { projectId: 'p3', enabled: true, cron: '0 6 * * 1-5', nextRun: '2026-06-14T06:00:00' },
  { projectId: 'p4', enabled: false, cron: '', nextRun: '' },
  { projectId: 'p5', enabled: false, cron: '', nextRun: '' },
  { projectId: 'p6', enabled: true, cron: '0 10 * * 1-5', nextRun: '2026-06-14T10:00:00' },
];

const INITIAL_ISSUES: Issue[] = [
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

const INITIAL_RULE_CONFIGS: RuleConfig[] = [
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
    projectId: 'p5',
    checks: [
      { id: 'c1', name: '重复代码检测', category: 'duplicate', enabled: true, threshold: 8, description: '重复代码率上限（百分比）' },
      { id: 'c2', name: '圈复杂度检查', category: 'complexity', enabled: true, threshold: 20, description: '单函数最大圈复杂度' },
      { id: 'c3', name: '缺陷风险扫描', category: 'defect', enabled: true, threshold: 8, description: '缺陷风险最大数量' },
      { id: 'c4', name: '依赖漏洞检查', category: 'vulnerability', enabled: true, threshold: 5, description: '依赖漏洞最大数量' },
      { id: 'c5', name: '测试覆盖率检查', category: 'coverage', enabled: true, threshold: 70, description: '最低测试覆盖率（百分比）' },
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

const INITIAL_PLANS: ImprovementPlan[] = [
  {
    id: 'pl1', name: 'Sprint 23 安全加固', description: '修复所有严重依赖漏洞和关键缺陷风险问题', startDate: '2026-06-10', endDate: '2026-06-20', status: 'active',
    issueIds: ['i1', 'i4', 'i6', 'i8', 'i13'], completedIssueIds: [],
    createdAt: '2026-06-09T10:00:00',
    milestones: [
      { id: 'm1', name: '第一阶段：依赖升级', description: '升级存在漏洞的第三方依赖', startDate: '2026-06-10', endDate: '2026-06-14', issueIds: ['i4', 'i8'], status: 'active' },
      { id: 'm2', name: '第二阶段：缺陷修复', description: '修复关键业务逻辑缺陷', startDate: '2026-06-15', endDate: '2026-06-18', issueIds: ['i1', 'i6', 'i13'], status: 'pending' },
      { id: 'm3', name: '第三阶段：回归验证', description: '全面回归测试和安全审计', startDate: '2026-06-19', endDate: '2026-06-20', issueIds: [], status: 'pending' },
    ],
  },
  {
    id: 'pl2', name: '技术债务清理 第一阶段', description: '降低 Atlas 和 Horizon 的重复代码率和圈复杂度', startDate: '2026-06-15', endDate: '2026-07-05', status: 'active',
    issueIds: ['i2', 'i3', 'i9', 'i14'], completedIssueIds: [],
    createdAt: '2026-06-12T14:00:00',
    milestones: [
      { id: 'm4', name: '重复代码清理', description: '提取公共方法，消除重复代码', startDate: '2026-06-15', endDate: '2026-06-22', issueIds: ['i2', 'i14'], status: 'pending' },
      { id: 'm5', name: '复杂度优化', description: '重构高复杂度函数，使用设计模式优化', startDate: '2026-06-23', endDate: '2026-07-02', issueIds: ['i3', 'i9'], status: 'pending' },
      { id: 'm6', name: '代码评审', description: '团队代码评审和最佳实践总结', startDate: '2026-07-03', endDate: '2026-07-05', issueIds: [], status: 'pending' },
    ],
  },
  {
    id: 'pl3', name: '测试覆盖率提升', description: '将所有项目核心模块测试覆盖率提升至 80% 以上', startDate: '2026-06-01', endDate: '2026-06-15', status: 'overdue',
    issueIds: ['i5', 'i12', 'i15'], completedIssueIds: [],
    createdAt: '2026-05-30T09:00:00',
    milestones: [
      { id: 'm7', name: '单元测试补充', description: '为核心模块补充单元测试用例', startDate: '2026-06-01', endDate: '2026-06-08', issueIds: ['i5', 'i15'], status: 'completed' },
      { id: 'm8', name: '集成测试', description: '补充关键业务流程集成测试', startDate: '2026-06-09', endDate: '2026-06-15', issueIds: ['i12'], status: 'overdue' },
    ],
  },
];

interface PersistedState {
  projects: Project[];
  projectGroups: ProjectGroup[];
  scanRecords: ScanRecord[];
  scanSchedules: ScanSchedule[];
  issues: Issue[];
  ruleConfigs: RuleConfig[];
  plans: ImprovementPlan[];
  ruleTemplates: RuleTemplate[];
}

interface AppState extends PersistedState {
  teamMembers: string[];
  teamRankings: TeamRanking[];
  qualityTrend: TrendDataPoint[];
  issueTrend: TrendDataPoint[];

  addProject: (project: Omit<Project, 'id' | 'qualityScore' | 'totalIssues' | 'criticalIssues'>) => void;
  triggerScan: (projectId: string) => void;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  updateRuleConfig: (projectId: string, checkId: string, updates: Partial<{ enabled: boolean; threshold: number }>) => void;
  addPlan: (plan: Omit<ImprovementPlan, 'id' | 'createdAt' | 'completedIssueIds'> & { milestones?: PlanMilestone[] }) => void;
  completePlanIssue: (planId: string, issueId: string) => void;
  updateScanSchedule: (projectId: string, updates: Partial<ScanSchedule>) => void;
  getOrCreateRuleConfig: (projectId: string) => RuleConfig;
  getOrCreateScanSchedule: (projectId: string) => ScanSchedule;
  saveRuleTemplate: (name: string, description: string, projectId: string, projectName: string) => void;
  applyRuleTemplate: (templateId: string, targetProjectId: string) => void;
  deleteRuleTemplate: (templateId: string) => void;
  addPlanMilestone: (planId: string, milestone: Omit<PlanMilestone, 'id'>) => void;
  updatePlanMilestone: (planId: string, milestoneId: string, updates: Partial<PlanMilestone>) => void;
  deletePlanMilestone: (planId: string, milestoneId: string) => void;
  addIssueToMilestone: (planId: string, milestoneId: string, issueId: string) => void;
  removeIssueFromMilestone: (planId: string, milestoneId: string, issueId: string) => void;
}

const initialState: PersistedState = {
  projects: INITIAL_PROJECTS,
  projectGroups: INITIAL_PROJECT_GROUPS,
  scanRecords: INITIAL_SCAN_RECORDS,
  scanSchedules: INITIAL_SCAN_SCHEDULES,
  issues: INITIAL_ISSUES,
  ruleConfigs: INITIAL_RULE_CONFIGS,
  plans: INITIAL_PLANS,
  ruleTemplates: [],
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      teamMembers: TEAM_MEMBERS,
      teamRankings: TEAM_RANKINGS,
      qualityTrend: QUALITY_TREND,
      issueTrend: ISSUE_TREND,

      getOrCreateRuleConfig: (projectId: string) => {
        const existing = get().ruleConfigs.find((c) => c.projectId === projectId);
        if (existing) return existing;
        const config = getDefaultRuleConfig(projectId);
        set((state) => ({ ruleConfigs: [...state.ruleConfigs, config] }));
        return config;
      },

      getOrCreateScanSchedule: (projectId: string) => {
        const existing = get().scanSchedules.find((s) => s.projectId === projectId);
        if (existing) return existing;
        const schedule = getDefaultScanSchedule(projectId);
        set((state) => ({ scanSchedules: [...state.scanSchedules, schedule] }));
        return schedule;
      },

      addProject: (project) => {
        const id = `p${Date.now()}`;
        const newProject: Project = {
          ...project,
          id,
          qualityScore: 0,
          totalIssues: 0,
          criticalIssues: 0,
          groupId: project.groupId || 'g3',
        };
        set((state) => ({
          projects: [...state.projects, newProject],
          ruleConfigs: [...state.ruleConfigs, getDefaultRuleConfig(id)],
          scanSchedules: [...state.scanSchedules, getDefaultScanSchedule(id)],
        }));
      },

      triggerScan: (projectId) => {
        const state = get();
        const project = state.projects.find((p) => p.id === projectId);
        if (!project) return;

        const scanId = `s${Date.now()}`;
        const startTime = new Date().toISOString();
        const newRecord: ScanRecord = {
          id: scanId,
          projectId,
          startTime,
          endTime: null,
          status: 'running',
          results: null,
        };

        set({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, status: 'scanning' as const } : p
          ),
          scanRecords: [newRecord, ...state.scanRecords],
        });

        const scanDuration = 3000 + Math.random() * 4000;
        setTimeout(() => {
          const s = get();
          const proj = s.projects.find((p) => p.id === projectId);
          const qualityLevel: 'high' | 'mid' | 'low' =
            proj?.qualityScore >= 80 ? 'high' : proj?.qualityScore >= 65 ? 'mid' : 'low';

          const results = generateMockScanResults(qualityLevel);
          const score = calculateQualityScore(results);
          const newIssues = generateIssuesFromResults(results, projectId, proj?.name ?? '');

          const existingIssueIds = new Set(s.issues.filter((i) => i.projectId === projectId).map((i) => i.id));
          const freshIssues = newIssues.filter((i) => !existingIssueIds.has(i.id));
          const criticalCount = freshIssues.filter((i) => i.severity === 'critical').length;

          set({
            projects: s.projects.map((p) =>
              p.id === projectId
                ? {
                    ...p,
                    status: 'connected' as const,
                    lastScanTime: new Date().toISOString(),
                    qualityScore: score,
                    totalIssues: freshIssues.length,
                    criticalIssues: criticalCount,
                  }
                : p
            ),
            scanRecords: s.scanRecords.map((r) =>
              r.id === scanId
                ? { ...r, status: 'completed' as const, endTime: new Date().toISOString(), results }
                : r
            ),
            issues: [
              ...freshIssues,
              ...s.issues.filter((i) => i.projectId !== projectId),
            ],
          });
        }, scanDuration);
      },

      updateIssue: (id, updates) => set((state) => ({
        issues: state.issues.map((issue) =>
          issue.id === id ? { ...issue, ...updates, updatedAt: new Date().toISOString() } : issue
        ),
      })),

      updateRuleConfig: (projectId, checkId, updates) => {
        const state = get();
        let configs = state.ruleConfigs;
        if (!configs.find((c) => c.projectId === projectId)) {
          configs = [...configs, getDefaultRuleConfig(projectId)];
        }
        set({
          ruleConfigs: configs.map((config) =>
            config.projectId === projectId
              ? {
                  ...config,
                  checks: config.checks.map((check) =>
                    check.id === checkId ? { ...check, ...updates } : check
                  ),
                }
              : config
          ),
        });
      },

      addPlan: (plan) => set((state) => ({
        plans: [...state.plans, {
          ...plan,
          id: `pl${Date.now()}`,
          completedIssueIds: [],
          createdAt: new Date().toISOString(),
          milestones: plan.milestones || [],
        }],
      })),

      completePlanIssue: (planId, issueId) => set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === planId && !plan.completedIssueIds.includes(issueId)
            ? { ...plan, completedIssueIds: [...plan.completedIssueIds, issueId] }
            : plan
        ),
        issues: state.issues.map((issue) =>
          issue.id === issueId ? { ...issue, status: 'resolved' as const, updatedAt: new Date().toISOString() } : issue
        ),
      })),

      updateScanSchedule: (projectId, updates) => {
        const state = get();
        let schedules = state.scanSchedules;
        if (!schedules.find((s) => s.projectId === projectId)) {
          schedules = [...schedules, getDefaultScanSchedule(projectId)];
        }
        set({
          scanSchedules: schedules.map((schedule) =>
            schedule.projectId === projectId ? { ...schedule, ...updates } : schedule
          ),
        });
      },

      saveRuleTemplate: (name, description, projectId, projectName) => {
        const state = get();
        const config = state.ruleConfigs.find((c) => c.projectId === projectId);
        if (!config) return;
        const template: RuleTemplate = {
          id: `tpl${Date.now()}`,
          name,
          description,
          checks: JSON.parse(JSON.stringify(config.checks)),
          createdAt: new Date().toISOString(),
          sourceProjectId: projectId,
          sourceProjectName: projectName,
        };
        set({ ruleTemplates: [...state.ruleTemplates, template] });
      },

      applyRuleTemplate: (templateId, targetProjectId) => {
        const state = get();
        const template = state.ruleTemplates.find((t) => t.id === templateId);
        if (!template) return;
        const existingConfig = state.ruleConfigs.find((c) => c.projectId === targetProjectId);
        const newChecks = template.checks.map((c) => ({ ...c }));
        if (existingConfig) {
          set({
            ruleConfigs: state.ruleConfigs.map((c) =>
              c.projectId === targetProjectId ? { ...c, checks: newChecks } : c
            ),
          });
        } else {
          set({
            ruleConfigs: [...state.ruleConfigs, { projectId: targetProjectId, checks: newChecks }],
          });
        }
      },

      deleteRuleTemplate: (templateId) => set((state) => ({
        ruleTemplates: state.ruleTemplates.filter((t) => t.id !== templateId),
      })),

      addPlanMilestone: (planId, milestone) => set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                milestones: [...plan.milestones, { ...milestone, id: `m${Date.now()}` }],
              }
            : plan
        ),
      })),

      updatePlanMilestone: (planId, milestoneId, updates) => set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                milestones: plan.milestones.map((m) =>
                  m.id === milestoneId ? { ...m, ...updates } : m
                ),
              }
            : plan
        ),
      })),

      deletePlanMilestone: (planId, milestoneId) => set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                milestones: plan.milestones.filter((m) => m.id !== milestoneId),
              }
            : plan
        ),
      })),

      addIssueToMilestone: (planId, milestoneId, issueId) => set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                milestones: plan.milestones.map((m) =>
                  m.id === milestoneId && !m.issueIds.includes(issueId)
                    ? { ...m, issueIds: [...m.issueIds, issueId] }
                    : m
                ),
              }
            : plan
        ),
      })),

      removeIssueFromMilestone: (planId, milestoneId, issueId) => set((state) => ({
        plans: state.plans.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                milestones: plan.milestones.map((m) =>
                  m.id === milestoneId
                    ? { ...m, issueIds: m.issueIds.filter((id) => id !== issueId) }
                    : m
                ),
              }
            : plan
        ),
      })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        projectGroups: state.projectGroups,
        scanRecords: state.scanRecords,
        scanSchedules: state.scanSchedules,
        issues: state.issues,
        ruleConfigs: state.ruleConfigs,
        plans: state.plans,
        ruleTemplates: state.ruleTemplates,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.projectGroups || state.projectGroups.length === 0) {
          state.projectGroups = INITIAL_PROJECT_GROUPS;
        }
        if (state.projects) {
          const defaultGroupForName = (name: string): string => {
            if (/支付|交易|清结算|NovaPay|Echo/i.test(name)) return 'g1';
            if (/数据|Atlas/i.test(name)) return 'g2';
            return 'g3';
          };
          (state.projects as Project[]).forEach((p) => {
            if (!(p as any).groupId) {
              (p as any).groupId = defaultGroupForName(p.name);
            }
          });
        }
      },
    }
  )
);
