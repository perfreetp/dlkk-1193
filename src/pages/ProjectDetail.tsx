import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Clock, AlertTriangle, Shield, Copy, TestTube, Bug, BarChart2, ListChecks, Settings, Target } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ScoreRing from '@/components/ScoreRing';
import type { IssueCategory } from '@/types';

const CATEGORY_CONFIG: Record<IssueCategory, { label: string; icon: typeof Copy; color: string }> = {
  duplicate: { label: '重复代码', icon: Copy, color: '#F59E0B' },
  complexity: { label: '复杂度', icon: GitBranch, color: '#8B5CF6' },
  defect: { label: '缺陷风险', icon: Bug, color: '#EF4444' },
  vulnerability: { label: '依赖漏洞', icon: Shield, color: '#F97316' },
  coverage: { label: '测试覆盖', icon: TestTube, color: '#06D6A0' },
};

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'] as const;

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, issues, scanRecords, getOrCreateRuleConfig } = useStore();

  const project = projects.find((p) => p.id === projectId);
  const ruleConfig = getOrCreateRuleConfig(projectId ?? '');

  const projectIssues = issues.filter((i) => i.projectId === projectId);
  const unresolvedIssues = projectIssues.filter((i) => i.status !== 'resolved' && i.status !== 'closed');
  const criticalUnresolved = unresolvedIssues.filter((i) => i.severity === 'critical');

  const latestScan = scanRecords
    .filter((r) => r.projectId === projectId && r.status === 'completed' && r.results)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

  const results = latestScan?.results;

  const issuesByCategory = (() => {
    const map: Record<string, typeof unresolvedIssues> = {};
    Object.keys(CATEGORY_CONFIG).forEach((k) => { map[k] = []; });
    unresolvedIssues.forEach((i) => {
      if (map[i.category]) map[i.category].push(i);
    });
    return map;
  })();

  const issuesBySeverity = (() => {
    const map: Record<string, typeof unresolvedIssues> = {};
    SEVERITY_ORDER.forEach((k) => { map[k] = []; });
    unresolvedIssues.forEach((i) => {
      if (map[i.severity]) map[i.severity].push(i);
    });
    return map;
  })();

  const getCategoryExceeding = (category: IssueCategory): boolean => {
    if (!results) return false;
    const check = ruleConfig.checks.find((c) => c.category === category);
    if (!check?.enabled) return false;
    const keyMap: Record<string, keyof typeof results> = {
      duplicate: 'duplicateCodeRate',
      complexity: 'cyclomaticComplexity',
      defect: 'defectRiskCount',
      vulnerability: 'dependencyVulnerabilities',
      coverage: 'testCoverage',
    };
    const key = keyMap[category];
    if (!key) return false;
    const val = results[key];
    if (key === 'testCoverage') return val < check.threshold;
    return val > check.threshold;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const goToIssues = (filters: Record<string, string>) => {
    const params = new URLSearchParams();
    params.set('project', projectId ?? '');
    Object.entries(filters).forEach(([k, v]) => params.set(k, v));
    navigate(`/issues?${params.toString()}`);
  };

  const goToScan = (tab: string) => {
    navigate(`/scan?tab=${tab}&project=${projectId}`);
  };

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-surface-500 mb-4">项目不存在</p>
        <Link to="/" className="btn-primary text-sm">返回总览</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-surface-400 hover:text-surface-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-100">{project.name}</h1>
          <p className="text-surface-400 text-sm mt-0.5 font-mono">{project.repoUrl} · {project.branch}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="card-glow rounded-xl p-5 flex items-center gap-4">
          <ScoreRing score={project.qualityScore} size={64} strokeWidth={5} />
          <div>
            <p className="text-surface-400 text-xs">质量评分</p>
            <p className="font-display font-bold text-2xl text-brand-400 mt-0.5">{project.qualityScore}</p>
            <span className={`badge text-[10px] ${project.status === 'scanning' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : project.status === 'connected' ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30' : 'bg-surface-700/30 text-surface-500 border border-surface-600/30'}`}>
              {project.status === 'scanning' ? '扫描中' : project.status === 'connected' ? '已连接' : '未连接'}
            </span>
          </div>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-surface-400">未处理问题</span>
          </div>
          <p className="stat-number text-2xl text-amber-400">{unresolvedIssues.length}</p>
          <p className="text-xs text-surface-500 mt-1">共 {projectIssues.length} 个问题历史</p>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-surface-400">严重风险</span>
          </div>
          <p className="stat-number text-2xl text-red-400">{criticalUnresolved.length}</p>
          <p className="text-xs text-surface-500 mt-1">需优先处理</p>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-surface-400">最近扫描</span>
          </div>
          <p className="text-surface-200 text-sm font-medium">
            {project.lastScanTime ? formatTime(project.lastScanTime) : '从未扫描'}
          </p>
          <button onClick={() => goToScan('console')} className="text-xs text-brand-400 hover:text-brand-300 mt-1 flex items-center gap-1">
            前往扫描
            <GitBranch className="w-3 h-3" />
          </button>
        </div>
      </div>

      {results && (
        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-surface-100 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-brand-400" />
              最近扫描结果
            </h2>
            <button onClick={() => goToScan('results')} className="text-xs text-surface-400 hover:text-brand-400 transition-colors">
              查看详情 →
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {(Object.keys(CATEGORY_CONFIG) as IssueCategory[]).map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const Icon = config.icon;
              const keyMap: Record<string, keyof typeof results> = {
                duplicate: 'duplicateCodeRate',
                complexity: 'cyclomaticComplexity',
                defect: 'defectRiskCount',
                vulnerability: 'dependencyVulnerabilities',
                coverage: 'testCoverage',
              };
              const key = keyMap[cat];
              const val = results[key];
              const exceeding = getCategoryExceeding(cat);
              const unit = cat === 'duplicate' || cat === 'coverage' ? '%' : '';

              return (
                <div
                  key={cat}
                  className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                    exceeding ? 'border-red-500/30 bg-red-500/5' : 'border-surface-700/50 bg-surface-800/50'
                  }`}
                  onClick={() => goToIssues({ category: cat })}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-3.5 h-3.5" style={{ color: exceeding ? '#EF4444' : config.color }} />
                    <span className="text-xs text-surface-400">{config.label}</span>
                  </div>
                  <p className="stat-number text-xl" style={{ color: exceeding ? '#EF4444' : config.color }}>
                    {typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val}{unit}
                  </p>
                  {exceeding && (
                    <span className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                      <Shield className="w-2.5 h-2.5" />
                      超出阈值
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-surface-100 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-brand-400" />
              问题分布
            </h3>
            <button onClick={() => goToIssues({})} className="text-xs text-surface-400 hover:text-brand-400">
              全部问题 →
            </button>
          </div>
          <div className="space-y-3">
            {(Object.keys(CATEGORY_CONFIG) as IssueCategory[]).map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const Icon = config.icon;
              const count = issuesByCategory[cat]?.length ?? 0;
              const maxCount = Math.max(...Object.values(issuesByCategory).map((arr) => arr?.length ?? 0), 1);
              const percentage = (count / maxCount) * 100;

              return (
                <div key={cat} className="group cursor-pointer" onClick={() => goToIssues({ category: cat })}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                      <span className="text-sm text-surface-300">{config.label}</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums" style={{ color: config.color }}>
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                      style={{ width: `${percentage}%`, backgroundColor: config.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-surface-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              严重风险
            </h3>
            <button onClick={() => goToIssues({ severity: 'critical' })} className="text-xs text-surface-400 hover:text-red-400">
              查看全部 →
            </button>
          </div>
          {criticalUnresolved.length === 0 ? (
            <div className="py-6 text-center">
              <Shield className="w-8 h-8 text-brand-500/30 mx-auto mb-2" />
              <p className="text-sm text-surface-500">暂无严重风险</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {criticalUnresolved.slice(0, 6).map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer"
                  onClick={() => navigate(`/issues?project=${projectId}&id=${issue.id}`)}
                >
                  <div className="flex items-start gap-2">
                    <span className="badge-critical shrink-0">严重</span>
                    <span className="text-sm text-surface-200 line-clamp-1">{issue.title}</span>
                  </div>
                  <p className="text-xs text-surface-500 mt-1.5 font-mono truncate">
                    {issue.filePath}:{issue.lineStart}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <button
          onClick={() => goToScan('console')}
          className="card-glow rounded-xl p-4 text-left hover:border-brand-500/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
              <GitBranch className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <p className="font-medium text-surface-200 text-sm">扫描控制台</p>
              <p className="text-xs text-surface-500">手动或定时发起扫描</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => goToIssues({})}
          className="card-glow rounded-xl p-4 text-left hover:border-amber-500/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <ListChecks className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-medium text-surface-200 text-sm">问题列表</p>
              <p className="text-xs text-surface-500">查看和处理所有问题</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate(`/rules`)}
          className="card-glow rounded-xl p-4 text-left hover:border-purple-500/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-surface-200 text-sm">规则配置</p>
              <p className="text-xs text-surface-500">配置检查项和阈值</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
