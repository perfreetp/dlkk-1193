import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, GitBranch, Bug, Shield, TestTube, ChevronDown, Terminal, ArrowLeft } from 'lucide-react';
import { AreaChart, ResponsiveContainer, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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
  const { projects, scanRecords, getOrCreateRuleConfig } = useStore();
  const navigate = useNavigate();

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const ruleConfig = getOrCreateRuleConfig(selectedProjectId);

  const projectCompletedRecords = useMemo(() =>
    scanRecords
      .filter((r) => r.projectId === selectedProjectId && r.status === 'completed' && r.results)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [scanRecords, selectedProjectId]
  );

  const latestRecord = projectCompletedRecords[projectCompletedRecords.length - 1];
  const results = latestRecord?.results ?? null;

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

  const isExceeding = (metric: MetricConfig): boolean => {
    if (!results) return false;
    const check = ruleConfig.checks.find((c) => c.category === metric.category);
    if (!check?.enabled) return false;
    const val = results[metric.key];
    if (metric.key === 'testCoverage') return val < check.threshold;
    return val > check.threshold;
  };

  const goToIssues = (category: string) => {
    navigate(`/issues?project=${selectedProjectId}&category=${category}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-semibold text-surface-100">扫描结果仪表盘</h2>
          {onGoToConsole && (
            <button onClick={onGoToConsole} className="text-xs text-surface-500 hover:text-brand-400 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3 h-3" />
              返回控制台
            </button>
          )}
        </div>
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
      </div>

      {!results ? (
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
      ) : (
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
                  onClick={() => goToIssues(metric.category)}
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
                <span key={m.key} className="flex items-center gap-1.5 text-xs text-surface-400">
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
