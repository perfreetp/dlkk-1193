import { useState } from 'react';
import { Copy, GitBranch, Bug, Shield, TestTube, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { IssueCategory } from '@/types';

const CATEGORY_ICONS: Record<IssueCategory, typeof Copy> = {
  duplicate: Copy,
  complexity: GitBranch,
  defect: Bug,
  vulnerability: Shield,
  coverage: TestTube,
};

const THRESHOLD_RANGES: Record<IssueCategory, { min: number; max: number; step: number }> = {
  duplicate: { min: 0, max: 30, step: 1 },
  complexity: { min: 1, max: 50, step: 1 },
  defect: { min: 1, max: 30, step: 1 },
  vulnerability: { min: 1, max: 20, step: 1 },
  coverage: { min: 0, max: 100, step: 5 },
};

const SCAN_RESULT_KEY: Record<string, string> = {
  c1: 'duplicateCodeRate',
  c2: 'cyclomaticComplexity',
  c3: 'defectRiskCount',
  c4: 'dependencyVulnerabilities',
  c5: 'testCoverage',
};

export default function Rules() {
  const { projects, ruleConfigs, updateRuleConfig, scanRecords } = useStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const availableProjects = projects.filter(
    (p) => p.status === 'connected' || p.status === 'scanning'
  );

  const activeProjectId = selectedProjectId || availableProjects[0]?.id || '';
  const config = ruleConfigs.find((c) => c.projectId === activeProjectId);

  const latestScan = scanRecords
    .filter((s) => s.projectId === activeProjectId && s.status === 'completed')
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

  const isExceeding = (checkId: string, threshold: number): boolean => {
    if (!latestScan?.results) return false;
    const key = SCAN_RESULT_KEY[checkId] as keyof typeof latestScan.results;
    const actual = latestScan.results[key];
    if (key === 'testCoverage') return actual < threshold;
    return actual > threshold;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-100">规则配置</h1>
          <p className="text-surface-400 text-sm mt-1">为项目配置质量检查规则和阈值</p>
        </div>
        <div className="relative">
          <select
            value={activeProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="appearance-none bg-surface-800 border border-surface-700/50 rounded-lg px-4 py-2.5 pr-10 text-sm text-surface-200 font-medium focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25 transition-all cursor-pointer"
          >
            {availableProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
        </div>
      </div>

      {config ? (
        <div className="space-y-4">
          {config.checks.map((check) => {
            const Icon = CATEGORY_ICONS[check.category];
            const range = THRESHOLD_RANGES[check.category];
            const exceeded = isExceeding(check.id, check.threshold);

            return (
              <div key={check.id} className="card-glow rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${check.enabled ? 'bg-brand-500/15' : 'bg-surface-700/50'}`}>
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${check.enabled ? 'text-brand-400' : 'text-surface-500'}`} />
                    </div>
                    <div>
                      <h3 className={`font-display font-semibold text-sm transition-colors duration-300 ${check.enabled ? 'text-surface-100' : 'text-surface-400'}`}>
                        {check.name}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => updateRuleConfig(activeProjectId, check.id, { enabled: !check.enabled })}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${check.enabled ? 'bg-brand-500' : 'bg-surface-600'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${check.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                {check.enabled && (
                  <div className="mt-4 pt-4 border-t border-surface-700/30 animate-fade-in-up">
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={range.min}
                        max={range.max}
                        step={range.step}
                        value={check.threshold}
                        onChange={(e) => updateRuleConfig(activeProjectId, check.id, { threshold: Number(e.target.value) })}
                        className="flex-1 h-1.5 rounded-full appearance-none bg-surface-700 cursor-pointer accent-[#06D6A0]"
                      />
                      <input
                        type="number"
                        min={range.min}
                        max={range.max}
                        value={check.threshold}
                        onChange={(e) => {
                          const val = Math.min(range.max, Math.max(range.min, Number(e.target.value)));
                          if (!isNaN(val)) updateRuleConfig(activeProjectId, check.id, { threshold: val });
                        }}
                        className={`w-20 px-3 py-1.5 rounded-lg border text-sm text-center font-mono focus:outline-none focus:ring-1 transition-colors ${
                          exceeded
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 focus:ring-red-500/50'
                            : 'bg-surface-800 border-surface-700/50 text-surface-200 focus:ring-brand-500/50'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-surface-500 mt-2">{check.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-glow rounded-xl p-12 text-center">
          <p className="text-surface-400">请选择一个已连接的项目</p>
        </div>
      )}
    </div>
  );
}
