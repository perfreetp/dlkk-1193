import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ArrowLeft, GitBranch, Clock, AlertTriangle, Shield, Copy, TestTube, Bug, BarChart2, ListChecks, Settings, Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { useStore } from '@/store/useStore';
import ScoreRing from '@/components/ScoreRing';
import type { IssueCategory, ScanResults } from '@/types';

const CATEGORY_CONFIG: Record<IssueCategory, { label: string; icon: typeof Copy; color: string; key: keyof ScanResults }> = {
  duplicate: { label: '重复代码', icon: Copy, color: '#F59E0B', key: 'duplicateCodeRate' },
  complexity: { label: '复杂度', icon: GitBranch, color: '#8B5CF6', key: 'cyclomaticComplexity' },
  defect: { label: '缺陷风险', icon: Bug, color: '#EF4444', key: 'defectRiskCount' },
  vulnerability: { label: '依赖漏洞', icon: Shield, color: '#F97316', key: 'dependencyVulnerabilities' },
  coverage: { label: '测试覆盖', icon: TestTube, color: '#06D6A0', key: 'testCoverage' },
};

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'] as const;

function calculateQualityScore(r: ScanResults): number {
  const score =
    r.testCoverage * 0.3 +
    Math.max(0, 100 - r.duplicateCodeRate * 5) * 0.2 +
    Math.max(0, 100 - r.cyclomaticComplexity * 2) * 0.2 +
    Math.max(0, 100 - r.defectRiskCount * 5) * 0.15 +
    Math.max(0, 100 - r.dependencyVulnerabilities * 5) * 0.15;
  return Math.round(Math.min(100, Math.max(0, score)));
}

const CHANGE_THRESHOLDS: Record<string, { better: 'up' | 'down'; significant: number }> = {
  duplicateCodeRate: { better: 'down', significant: 1 },
  cyclomaticComplexity: { better: 'down', significant: 2 },
  defectRiskCount: { better: 'down', significant: 1 },
  dependencyVulnerabilities: { better: 'down', significant: 1 },
  testCoverage: { better: 'up', significant: 2 },
};

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, issues, scanRecords, getOrCreateRuleConfig } = useStore();
  const [showTrend, setShowTrend] = useState(true);

  const project = projects.find((p) => p.id === projectId);
  const ruleConfig = getOrCreateRuleConfig(projectId ?? '');

  const projectIssues = issues.filter((i) => i.projectId === projectId);
  const unresolvedIssues = projectIssues.filter((i) => i.status !== 'resolved' && i.status !== 'closed');
  const criticalUnresolved = unresolvedIssues.filter((i) => i.severity === 'critical');

  const allScans = useMemo(() => scanRecords
    .filter((r) => r.projectId === projectId && r.status === 'completed' && r.results)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [scanRecords, projectId]
  );

  const latestScan = allScans[allScans.length - 1];
  const prevScan = allScans[allScans.length - 2];
  const results = latestScan?.results;
  const prevResults = prevScan?.results;

  const trendData = useMemo(() =>
    allScans.slice(-10).map((r) => ({
      date: new Date(r.startTime).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      score: calculateQualityScore(r.results!),
      duplicateCodeRate: r.results!.duplicateCodeRate,
      cyclomaticComplexity: r.results!.cyclomaticComplexity,
      defectRiskCount: r.results!.defectRiskCount,
      dependencyVulnerabilities: r.results!.dependencyVulnerabilities,
      testCoverage: r.results!.testCoverage,
    })),
    [allScans]
  );

  const getChangeInfo = (key: keyof ScanResults) => {
    if (!results || !prevResults) return null;
    const current = results[key];
    const previous = prevResults[key];
    const diff = current - previous;
    const config = CHANGE_THRESHOLDS[key];
    const absDiff = Math.abs(diff);
    const isSignificant = absDiff >= config.significant;
    const isBetter = (config.better === 'up' && diff > 0) || (config.better === 'down' && diff < 0);
    const isWorse = (config.better === 'up' && diff < 0) || (config.better === 'down' && diff > 0);
    return { diff, isSignificant, isBetter, isWorse };
  };

  const issuesByCategory = (() => {
    const map: Record<string, typeof unresolvedIssues> = {};
    Object.keys(CATEGORY_CONFIG).forEach((k) => { map[k] = []; });
    unresolvedIssues.forEach((i) => {
      if (map[i.category]) map[i.category].push(i);
    });
    return map;
  })();

  const getCategoryExceeding = (category: IssueCategory): boolean => {
    if (!results) return false;
    const check = ruleConfig.checks.find((c) => c.category === category);
    if (!check?.enabled) return false;
    const config = CATEGORY_CONFIG[category];
    const val = results[config.key];
    if (config.key === 'testCoverage') return val < check.threshold;
    return val > check.threshold;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const formatNumber = (val: number, key: string) => {
    const unit = key === 'duplicateCodeRate' || key === 'testCoverage' ? '%' : '';
    return val % 1 !== 0 ? `${val.toFixed(1)}${unit}` : `${val}${unit}`;
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
            <div className="flex items-baseline gap-2">
              <p className="font-display font-bold text-2xl text-brand-400">{project.qualityScore}</p>
              {prevScan && (
                <span className={`text-xs flex items-center gap-0.5 ${
                  project.qualityScore > calculateQualityScore(prevResults!) ? 'text-emerald-400' :
                  project.qualityScore < calculateQualityScore(prevResults!) ? 'text-red-400' :
                  'text-surface-500'
                }`}>
                  {project.qualityScore > calculateQualityScore(prevResults!) ? <TrendingUp className="w-3 h-3" /> :
                   project.qualityScore < calculateQualityScore(prevResults!) ? <TrendingDown className="w-3 h-3" /> :
                   <Minus className="w-3 h-3" />}
                  {Math.abs(project.qualityScore - calculateQualityScore(prevResults!))}
                </span>
              )}
            </div>
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
            <div className="flex items-center gap-2">
              <div className="flex bg-surface-800 rounded-lg p-0.5">
                <button
                  onClick={() => setShowTrend(false)}
                  className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                    !showTrend ? 'bg-surface-700 text-surface-200' : 'text-surface-400 hover:text-surface-200'
                  }`}
                >
                  指标卡片
                </button>
                <button
                  onClick={() => setShowTrend(true)}
                  className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                    showTrend ? 'bg-surface-700 text-surface-200' : 'text-surface-400 hover:text-surface-200'
                  }`}
                >
                  质量趋势
                </button>
              </div>
              <button onClick={() => goToScan('results')} className="text-xs text-surface-400 hover:text-brand-400 transition-colors">
                查看详情 →
              </button>
            </div>
          </div>

          {!showTrend ? (
            <div className="grid grid-cols-5 gap-3">
              {(Object.keys(CATEGORY_CONFIG) as IssueCategory[]).map((cat) => {
                const config = CATEGORY_CONFIG[cat];
                const Icon = config.icon;
                const val = results[config.key];
                const exceeding = getCategoryExceeding(cat);
                const change = getChangeInfo(config.key);

                return (
                  <div
                    key={cat}
                    className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                      exceeding ? 'border-red-500/30 bg-red-500/5' : 'border-surface-700/50 bg-surface-800/50'
                    } ${change?.isWorse && change.isSignificant ? 'ring-2 ring-red-500/20' : ''} ${change?.isBetter && change.isSignificant ? 'ring-2 ring-emerald-500/20' : ''}`}
                    onClick={() => goToIssues({ category: cat })}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" style={{ color: exceeding ? '#EF4444' : config.color }} />
                        <span className="text-xs text-surface-400">{config.label}</span>
                      </div>
                      {change && (
                        <span className={`text-[10px] flex items-center gap-0.5 ${
                          change.isBetter ? 'text-emerald-400' : change.isWorse ? 'text-red-400' : 'text-surface-500'
                        }`}>
                          {change.isBetter ? <TrendingUp className="w-3 h-3" /> :
                           change.isWorse ? <TrendingDown className="w-3 h-3" /> :
                           <Minus className="w-3 h-3" />}
                          {Math.abs(change.diff) % 1 !== 0 ? Math.abs(change.diff).toFixed(1) : Math.abs(change.diff)}
                        </span>
                      )}
                    </div>
                    <p className="stat-number text-xl" style={{ color: exceeding ? '#EF4444' : config.color }}>
                      {formatNumber(val, config.key)}
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
          ) : (
            <div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06D6A0" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06D6A0" stopOpacity={0} />
                      </linearGradient>
                      {(Object.keys(CATEGORY_CONFIG) as IssueCategory[]).map((cat) => {
                        const config = CATEGORY_CONFIG[cat];
                        return (
                          <linearGradient key={config.key} id={`trend-${config.key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={config.color} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.4} />
                    <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }}
                      labelStyle={{ color: '#94A3B8' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#06D6A0"
                      strokeWidth={2.5}
                      fill="url(#scoreGrad)"
                      name="质量评分"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-surface-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#06D6A0' }} />
                  质量评分
                </span>
                {(Object.keys(CATEGORY_CONFIG) as IssueCategory[]).map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const change = getChangeInfo(config.key);
                  return (
                    <button
                      key={config.key}
                      onClick={() => goToIssues({ category: cat })}
                      className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-200 transition-colors"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                      {config.label}
                      {change && (
                        <span className={`${
                          change.isBetter ? 'text-emerald-400' : change.isWorse ? 'text-red-400' : ''
                        }`}>
                          {change.diff > 0 ? '+' : ''}{change.diff % 1 !== 0 ? change.diff.toFixed(1) : change.diff}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
