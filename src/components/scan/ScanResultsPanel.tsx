import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, GitBranch, Bug, Shield, TestTube, ChevronDown, Terminal, ArrowLeft, Check, X, BarChart3, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, ResponsiveContainer, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { useStore } from '@/store/useStore';
import type { ScanResults, IssueCategory } from '@/types';

interface ScanResultsPanelProps {
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onGoToConsole?: () => void;
}

interface MetricConfig {
  key: keyof ScanResults;
  label: string;
  unit: string;
  icon: typeof Copy;
  maxVal: number;
  invert: boolean;
  color: string;
  category: IssueCategory;
}

const METRICS: MetricConfig[] = [
  { key: 'duplicateCodeRate', label: '重复代码率', unit: '%', icon: Copy, maxVal: 25, invert: true, color: '#F59E0B', category: 'duplicate' },
  { key: 'cyclomaticComplexity', label: '圈复杂度', unit: '', icon: GitBranch, maxVal: 40, invert: true, color: '#8B5CF6', category: 'complexity' },
  { key: 'defectRiskCount', label: '缺陷风险数', unit: '个', icon: Bug, maxVal: 25, invert: true, color: '#EF4444', category: 'defect' },
  { key: 'dependencyVulnerabilities', label: '依赖漏洞数', unit: '个', icon: Shield, maxVal: 20, invert: true, color: '#F97316', category: 'vulnerability' },
  { key: 'testCoverage', label: '测试覆盖率', unit: '%', icon: TestTube, maxVal: 100, invert: false, color: '#06D6A0', category: 'coverage' },
];

const PROJECT_COLORS = ['#06D6A0', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

function MetricRing({ value, maxVal, invert, color, size = 72 }: { value: number; maxVal: number; invert: boolean; color: string; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const normalizedValue = invert
    ? Math.max(0, 100 - (value / maxVal) * 100)
    : Math.min(100, (value / maxVal) * 100);
  const offset = circumference - (normalizedValue / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#334155" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeDasharray={circumference}
        strokeDashoffset={offset} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}40)`, transition: 'stroke-dashoffset 0.6s ease-out' }}
      />
    </svg>
  );
}

export default function ScanResultsPanel({ selectedProjectId, onSelectProject, onGoToConsole }: ScanResultsPanelProps) {
  const { projects, scanRecords, getOrCreateRuleConfig, issues } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<'single' | 'compare'>('single');

  const initialCompare = useMemo(() => {
    const compareParam = searchParams.get('compare');
    if (compareParam) {
      return compareParam.split(',').filter(Boolean);
    }
    return [];
  }, []);

  const [compareProjects, setCompareProjects] = useState<string[]>(initialCompare);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (compareProjects.length > 0) {
      params.set('compare', compareProjects.join(','));
    } else {
      params.delete('compare');
    }
    setSearchParams(params, { replace: true });
  }, [compareProjects]);

  const connectedProjects = projects.filter((p) => p.status === 'connected' || p.status === 'scanning');

  const toggleCompareProject = (projectId: string) => {
    setCompareProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, projectId];
    });
  };

  const getLatestScan = (projectId: string) => scanRecords
    .filter((r) => r.projectId === projectId && r.status === 'completed' && r.results)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const ruleConfig = getOrCreateRuleConfig(selectedProjectId);
  const latestRecord = getLatestScan(selectedProjectId);
  const results = latestRecord?.results ?? null;

  const projectCompletedRecords = useMemo(() =>
    scanRecords
      .filter((r) => r.projectId === selectedProjectId && r.status === 'completed' && r.results)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [scanRecords, selectedProjectId]
  );

  const trendData = useMemo(() =>
    projectCompletedRecords.slice(-10).map((r, i) => ({
      date: new Date(r.startTime).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      duplicateCodeRate: r.results?.duplicateCodeRate ?? 0,
      cyclomaticComplexity: r.results?.cyclomaticComplexity ?? 0,
      defectRiskCount: r.results?.defectRiskCount ?? 0,
      dependencyVulnerabilities: r.results?.dependencyVulnerabilities ?? 0,
      testCoverage: r.results?.testCoverage ?? 0,
    })),
    [projectCompletedRecords]
  );

  const compareData = useMemo(() => {
    const projectIds = compareProjects.length > 0 ? compareProjects : [selectedProjectId];
    return METRICS.map((metric) => {
      const row: Record<string, any> = { metric: metric.label, unit: metric.unit };
      projectIds.forEach((pid) => {
        const p = projects.find((pr) => pr.id === pid);
        const scan = getLatestScan(pid);
        if (p && scan?.results) {
          row[p.name] = scan.results[metric.key];
          row[`${p.name}_exceed`] = (() => {
            const rc = getOrCreateRuleConfig(pid);
            const check = rc.checks.find((c) => c.category === metric.category);
            if (!check?.enabled) return false;
            const val = scan.results![metric.key];
            if (metric.key === 'testCoverage') return val < check.threshold;
            return val > check.threshold;
          })();
        }
      });
      return row;
    });
  }, [compareProjects, selectedProjectId, projects, scanRecords, getOrCreateRuleConfig]);

  const compareSummary = useMemo(() => {
    const projectIds = compareProjects.length > 0 ? compareProjects : [selectedProjectId];
    return projectIds.map((pid) => {
      const p = projects.find((pr) => pr.id === pid);
      const scan = getLatestScan(pid);
      const projectIssues = issues.filter((i) => i.projectId === pid && i.status !== 'resolved' && i.status !== 'closed');
      const criticalCount = projectIssues.filter((i) => i.severity === 'critical').length;

      let exceedingCount = 0;
      const rc = getOrCreateRuleConfig(pid);
      METRICS.forEach((m) => {
        const check = rc.checks.find((c) => c.category === m.category);
        if (check?.enabled && scan?.results) {
          const val = scan.results[m.key];
          const exceed = m.key === 'testCoverage' ? val < check.threshold : val > check.threshold;
          if (exceed) exceedingCount++;
        }
      });

      const score = p?.qualityScore ?? 0;
      const compositeScore = criticalCount * 5 + exceedingCount * 2 + (100 - score) / 10 + projectIssues.length * 0.5;

      let advice: { text: string; color: string }[] = [];
      if (criticalCount > 0) {
        advice.push({ text: `存在 ${criticalCount} 个严重风险，需立即修复`, color: 'text-red-400' });
      }
      if (exceedingCount > 0) {
        advice.push({ text: `${exceedingCount} 项指标超出阈值，建议优先处理`, color: 'text-amber-400' });
      }
      if (score < 70) {
        advice.push({ text: `整体质量偏低（${score}分），需系统性改进`, color: 'text-yellow-400' });
      }
      if (advice.length === 0) {
        advice.push({ text: '当前状态良好', color: 'text-emerald-400' });
      }

      return {
        project: p,
        score,
        criticalCount,
        exceedingCount,
        issuesCount: projectIssues.length,
        compositeScore,
        advice,
      };
    }).sort((a, b) => b.compositeScore - a.compositeScore);
  }, [compareProjects, selectedProjectId, projects, scanRecords, issues, getOrCreateRuleConfig]);

  const isExceeding = (metric: MetricConfig): boolean => {
    if (!results) return false;
    const check = ruleConfig.checks.find((c) => c.category === metric.category);
    if (!check?.enabled) return false;
    const val = results[metric.key];
    if (metric.key === 'testCoverage') return val < check.threshold;
    return val > check.threshold;
  };

  const goToIssues = (projectId: string, category?: string, severity?: string) => {
    const params = new URLSearchParams();
    params.set('project', projectId);
    if (category) params.set('category', category);
    if (severity) params.set('severity', severity);
    if (compareProjects.length > 0) params.set('compare', compareProjects.join(','));
    navigate(`/issues?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-surface-100">扫描结果仪表盘</h2>
          <div className="flex bg-surface-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('single')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'single' ? 'bg-surface-700 text-surface-200' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              单项目
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'compare' ? 'bg-surface-700 text-surface-200' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              项目对比
            </button>
          </div>
          {onGoToConsole && (
            <button onClick={onGoToConsole} className="text-xs text-surface-500 hover:text-brand-400 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3 h-3" />
              返回控制台
            </button>
          )}
        </div>
        {viewMode === 'single' && (
          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => onSelectProject(e.target.value)}
              className="appearance-none bg-surface-800 border border-surface-700/50 rounded-lg px-4 py-2 pr-8 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
          </div>
        )}
      </div>

      {viewMode === 'compare' && (
        <div className="card-glow rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-surface-400 font-medium">选择对比项目（最多 3 个）</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {connectedProjects.map((p) => {
              const selected = compareProjects.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleCompareProject(p.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selected
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                      : 'bg-surface-800 text-surface-400 border border-surface-700/50 hover:border-surface-600'
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5" />}
                  {p.name}
                  <span className="text-xs opacity-60">({p.qualityScore}分)</span>
                </button>
              );
            })}
            {compareProjects.length > 0 && (
              <button
                onClick={() => setCompareProjects([])}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-surface-500 hover:text-surface-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                清空
              </button>
            )}
          </div>
        </div>
      )}

      {viewMode === 'compare' && compareSummary.length > 1 && (
        <div className="card-glow rounded-xl p-5 border-amber-500/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-display font-semibold text-amber-400">优先处理建议</h3>
          </div>
          <div className="space-y-3">
            {compareSummary.map(({ project, score, criticalCount, exceedingCount, issuesCount, advice }, idx) => (
              <div
                key={project?.id}
                className={`p-4 rounded-lg border ${
                  idx === 0
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-surface-800/50 border-surface-700/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-surface-500">#{idx + 1}</span>
                      <p className="text-sm font-medium text-surface-200">{project?.name}</p>
                    </div>
                    <p className="text-xs text-surface-500 mb-2">质量评分 {score} · {issuesCount} 未处理问题</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {advice.map((a, i) => (
                        <span key={i} className={`text-xs ${a.color} flex items-center gap-1`}>
                          {a.color.includes('red') && <AlertTriangle className="w-3 h-3" />}
                          {a.color.includes('amber') && <BarChart3 className="w-3 h-3" />}
                          {a.color.includes('yellow') && <TrendingDown className="w-3 h-3" />}
                          {a.color.includes('emerald') && <TrendingUp className="w-3 h-3" />}
                          {a.text}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {criticalCount} 严重
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <BarChart3 className="w-3.5 h-3.5" />
                        {exceedingCount} 项超标
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => goToIssues(project!.id, undefined, 'critical')}
                    className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap"
                  >
                    查看该项目严重问题
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'compare' && (
        <div className="card-glow rounded-xl p-5">
          <h3 className="font-display font-semibold text-surface-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            指标横向对比
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700/50">
                  <th className="text-left px-4 py-3 text-surface-400 font-medium">指标</th>
                  {(compareProjects.length > 0 ? compareProjects : [selectedProjectId]).map((pid, i) => {
                    const p = projects.find((pr) => pr.id === pid);
                    return (
                      <th key={pid} className="text-right px-4 py-3 font-medium" style={{ color: PROJECT_COLORS[i % PROJECT_COLORS.length] }}>
                        {p?.name}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {compareData.map((row, i) => (
                  <tr key={i} className="border-b border-surface-700/30 hover:bg-surface-800/30">
                    <td className="px-4 py-3 text-surface-300">{row.metric}</td>
                    {(compareProjects.length > 0 ? compareProjects : [selectedProjectId]).map((pid, j) => {
                      const p = projects.find((pr) => pr.id === pid);
                      const val = row[p?.name ?? ''];
                      const exceed = row[`${p?.name}_exceed`];
                      const metric = METRICS[i];
                      return (
                        <td
                          key={pid}
                          className={`px-4 py-3 text-right font-mono cursor-pointer transition-colors ${
                            exceed ? 'text-red-400' : ''
                          }`}
                          style={{ color: exceed ? undefined : PROJECT_COLORS[j % PROJECT_COLORS.length] }}
                          onClick={() => goToIssues(pid, metric.category, exceed ? 'critical' : undefined)}
                        >
                          <span className="flex items-center justify-end gap-1">
                            {val}{row.unit}
                            {exceed && <AlertTriangle className="w-3 h-3" />}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-b border-surface-700/30 bg-surface-800/20">
                  <td className="px-4 py-3 text-surface-300 font-medium">质量评分</td>
                  {(compareProjects.length > 0 ? compareProjects : [selectedProjectId]).map((pid, j) => {
                    const p = projects.find((pr) => pr.id === pid);
                    return (
                      <td key={pid} className="px-4 py-3 text-right font-semibold" style={{ color: PROJECT_COLORS[j % PROJECT_COLORS.length] }}>
                        {p?.qualityScore}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b border-surface-700/30 bg-surface-800/20 hover:bg-surface-800/40">
                  <td className="px-4 py-3 text-surface-300 font-medium">严重问题</td>
                  {(compareProjects.length > 0 ? compareProjects : [selectedProjectId]).map((pid, j) => {
                    const summary = compareSummary.find((s) => s.project?.id === pid);
                    return (
                      <td
                        key={pid}
                        className={`px-4 py-3 text-right font-semibold cursor-pointer transition-colors ${(summary?.criticalCount ?? 0) > 0 ? 'text-red-400' : ''}`}
                        style={{ color: (summary?.criticalCount ?? 0) > 0 ? undefined : PROJECT_COLORS[j % PROJECT_COLORS.length] }}
                        onClick={() => goToIssues(pid, undefined, 'critical')}
                      >
                        <span className="flex items-center justify-end gap-1">
                          {summary?.criticalCount ?? 0}
                          {(summary?.criticalCount ?? 0) > 0 && <AlertTriangle className="w-3 h-3" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="h-80 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.4} />
                <XAxis dataKey="metric" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                {(compareProjects.length > 0 ? compareProjects : [selectedProjectId]).map((pid, i) => {
                  const p = projects.find((pr) => pr.id === pid);
                  return (
                    <Bar
                      key={pid}
                      dataKey={p?.name ?? ''}
                      fill={PROJECT_COLORS[i % PROJECT_COLORS.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === 'single' && !results && (
        <div className="card-glow rounded-xl p-12 text-center space-y-4">
          <TestTube className="w-12 h-12 text-surface-600 mx-auto" />
          <p className="text-surface-500 text-sm">暂无扫描结果</p>
          {onGoToConsole && (
            <button onClick={onGoToConsole} className="btn-primary inline-flex items-center gap-2 text-sm">
              <Terminal className="w-4 h-4" />
              前往控制台发起扫描
            </button>
          )}
        </div>
      )}

      {viewMode === 'single' && results && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {METRICS.map((metric) => {
              const val = results[metric.key];
              const Icon = metric.icon;
              const exceeding = isExceeding(metric);
              return (
                <div
                  key={metric.key}
                  className={`card-glow rounded-xl p-4 flex flex-col items-center cursor-pointer transition-all ${
                    exceeding ? 'border-red-500/30' : ''
                  }`}
                  onClick={() => goToIssues(selectedProjectId, metric.category)}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <Icon className="w-3.5 h-3.5" style={{ color: exceeding ? '#EF4444' : metric.color }} />
                    <span className="text-xs text-surface-400">{metric.label}</span>
                  </div>
                  <div className="relative">
                    <MetricRing value={val} maxVal={metric.maxVal} invert={metric.invert} color={exceeding ? '#EF4444' : metric.color} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="stat-number text-base" style={{ color: exceeding ? '#EF4444' : metric.color }}>
                        {typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-surface-500 mt-2">{metric.unit}</span>
                  {exceeding && (
                    <span className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5" />
                      超出阈值
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card-glow rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-semibold text-surface-200">指标趋势</h3>
              <span className="text-xs text-surface-500">共 {trendData.length} 次扫描</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    {METRICS.map((m) => (
                      <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={m.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.4} />
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', fontSize: 12 }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  {METRICS.map((m) => (
                    <Area
                      key={m.key}
                      type="monotone"
                      dataKey={m.key}
                      stroke={m.color}
                      strokeWidth={2}
                      fill={`url(#grad-${m.key})`}
                      name={m.label}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-3">
              {METRICS.map((m) => (
                <span
                  key={m.key}
                  className="flex items-center gap-1.5 text-xs text-surface-400 cursor-pointer hover:text-surface-200 transition-colors"
                  onClick={() => goToIssues(selectedProjectId, m.category)}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
