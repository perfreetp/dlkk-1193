import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, ChevronDown, Loader2, CheckCircle2, XCircle, Timer, Copy, GitBranch, Bug, Shield, TestTube, ListChecks } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ScoreRing from '@/components/ScoreRing';
import type { ScanResults } from '@/types';

interface ScanConsolePanelProps {
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onScanComplete?: (projectId: string) => void;
}

const CRON_OPTIONS = [
  { label: '每天 08:00', value: '0 8 * * *' },
  { label: '工作日 08:00', value: '0 8 * * 1-5' },
  { label: '每天 14:00', value: '0 14 * * *' },
  { label: '每周一 10:00', value: '0 10 * * 1' },
  { label: '每6小时', value: '0 */6 * * *' },
];

interface MiniMetricProps {
  icon: typeof Copy;
  label: string;
  value: string | number;
  color: string;
  exceeding?: boolean;
}

function MiniMetric({ icon: Icon, label, value, color, exceeding }: MiniMetricProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3" style={{ color: exceeding ? '#EF4444' : color }} />
      <span className="text-xs text-surface-400">{label}</span>
      <span
        className="text-xs font-semibold tabular-nums"
        style={{ color: exceeding ? '#EF4444' : color }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ScanConsolePanel({ selectedProjectId, onSelectProject, onScanComplete }: ScanConsolePanelProps) {
  const { projects, scanRecords, scanSchedules, triggerScan, updateScanSchedule, getOrCreateScanSchedule, getOrCreateRuleConfig } = useStore();
  const [cronDropdownOpen, setCronDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const schedule = getOrCreateScanSchedule(selectedProjectId);
  const ruleConfig = getOrCreateRuleConfig(selectedProjectId);

  const projectRecords = scanRecords
    .filter((r) => r.projectId === selectedProjectId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const latestCompleted = projectRecords.find((r) => r.status === 'completed' && r.results);

  useEffect(() => {
    if (projectRecords.length > 0 && projectRecords[0].status === 'running') {
      const timer = setTimeout(() => {
        // 强制重渲染以反映 store 的变化（setTimeout 在 store 内部已处理）
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [projectRecords]);

  useEffect(() => {
    if (projectRecords.length > 0 && projectRecords[0].status === 'completed' && onScanComplete) {
      // 如果刚刚完成，通知父组件
    }
  }, [projectRecords[0]?.status]);

  const handleTriggerScan = () => {
    if (selectedProjectId) {
      triggerScan(selectedProjectId);
      const checkComplete = setInterval(() => {
        const current = useStore.getState().scanRecords
          .filter((r) => r.projectId === selectedProjectId)
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
        if (current && current.status === 'completed') {
          clearInterval(checkComplete);
          onScanComplete?.(selectedProjectId);
        }
      }, 500);
      setTimeout(() => clearInterval(checkComplete), 15000);
    }
  };

  const handleToggleSchedule = () => {
    updateScanSchedule(selectedProjectId, { enabled: !schedule.enabled });
  };

  const handleCronChange = (cron: string) => {
    updateScanSchedule(selectedProjectId, { enabled: true, cron, nextRun: '' });
    setCronDropdownOpen(false);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return '进行中';
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
    if (diff < 60) return `${Math.round(diff)} 秒`;
    const mins = Math.floor(diff / 60);
    const secs = Math.round(diff % 60);
    return secs > 0 ? `${mins} 分 ${secs} 秒` : `${mins} 分钟`;
  };

  const isExceeding = (category: string, results: ScanResults, threshold: number): boolean => {
    const keyMap: Record<string, keyof ScanResults> = {
      duplicate: 'duplicateCodeRate',
      complexity: 'cyclomaticComplexity',
      defect: 'defectRiskCount',
      vulnerability: 'dependencyVulnerabilities',
      coverage: 'testCoverage',
    };
    const key = keyMap[category];
    if (!key || !results) return false;
    const val = results[key];
    if (key === 'testCoverage') return val < threshold;
    return val > threshold;
  };

  const getThreshold = (category: string) => {
    const check = ruleConfig.checks.find((c) => c.category === category);
    return check?.enabled ? check.threshold : null;
  };

  const goToIssues = (category: string) => {
    navigate(`/issues?project=${selectedProjectId}&category=${category}`);
  };

  const selectedProjectIdx = projects.findIndex((p) => p.id === selectedProjectId);
  const qualityLevel =
    selectedProject?.qualityScore >= 80 ? 'high' : selectedProject?.qualityScore >= 65 ? 'mid' : 'low';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-surface-100">扫描控制台</h2>
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

      {selectedProject && (
        <div className="card-glow rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-medium text-surface-100">{selectedProject.name}</h3>
              <p className="text-xs text-surface-500 mt-1 font-mono">{selectedProject.repoUrl} · {selectedProject.branch}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`badge ${selectedProject.status === 'scanning' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : selectedProject.status === 'connected' ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30' : 'bg-surface-700/30 text-surface-500 border border-surface-600/30'}`}>
                {selectedProject.status === 'scanning' && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                {selectedProject.status === 'scanning' ? '扫描中' : selectedProject.status === 'connected' ? '已连接' : '未连接'}
              </span>
              <button
                onClick={handleTriggerScan}
                disabled={selectedProject.status === 'scanning'}
                className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                触发扫描
              </button>
            </div>
          </div>

          {latestCompleted?.results && (
            <div className="grid grid-cols-5 gap-3 mb-4 p-3 bg-surface-900/50 rounded-lg border border-surface-700/30">
              <div className="flex flex-col items-center gap-1">
                <ScoreRing score={
                  Math.round(
                    latestCompleted.results.testCoverage * 0.3 +
                    Math.max(0, 100 - latestCompleted.results.duplicateCodeRate * 5) * 0.2 +
                    Math.max(0, 100 - latestCompleted.results.cyclomaticComplexity * 2) * 0.2 +
                    Math.max(0, 100 - latestCompleted.results.defectRiskCount * 5) * 0.15 +
                    Math.max(0, 100 - latestCompleted.results.dependencyVulnerabilities * 5) * 0.15
                  )
                } size={36} strokeWidth={3} />
                <span className="text-[10px] text-surface-500">质量评分</span>
              </div>
              <MiniMetric icon={Copy} label="重复" value={`${latestCompleted.results.duplicateCodeRate}%`} color="#F59E0B" exceeding={getThreshold('duplicate') ? isExceeding('duplicate', latestCompleted.results, getThreshold('duplicate')!) : false} />
              <MiniMetric icon={GitBranch} label="复杂度" value={latestCompleted.results.cyclomaticComplexity} color="#8B5CF6" exceeding={getThreshold('complexity') ? isExceeding('complexity', latestCompleted.results, getThreshold('complexity')!) : false} />
              <MiniMetric icon={Bug} label="缺陷" value={latestCompleted.results.defectRiskCount} color="#EF4444" exceeding={getThreshold('defect') ? isExceeding('defect', latestCompleted.results, getThreshold('defect')!) : false} />
              <MiniMetric icon={Shield} label="漏洞" value={latestCompleted.results.dependencyVulnerabilities} color="#F97316" exceeding={getThreshold('vulnerability') ? isExceeding('vulnerability', latestCompleted.results, getThreshold('vulnerability')!) : false} />
            </div>
          )}

          <div className="border-t border-surface-700/50 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-surface-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                定时扫描
              </span>
              <button onClick={handleToggleSchedule} className="text-brand-500 hover:text-brand-400 transition-colors">
                {schedule?.enabled ? (
                  <div className="w-11 h-6 rounded-full bg-brand-500 relative">
                    <span className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white shadow-md" />
                  </div>
                ) : (
                  <div className="w-11 h-6 rounded-full bg-surface-600 relative">
                    <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md" />
                  </div>
                )}
              </button>
            </div>
            {schedule?.enabled && (
              <div className="flex items-center gap-3 ml-6">
                <div className="relative">
                  <button
                    onClick={() => setCronDropdownOpen(!cronDropdownOpen)}
                    className="flex items-center gap-2 bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-1.5 text-sm text-surface-300 hover:border-brand-500/30 transition-colors"
                  >
                    <Timer className="w-3.5 h-3.5" />
                    {CRON_OPTIONS.find((o) => o.value === schedule.cron)?.label ?? schedule.cron}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {cronDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-surface-800 border border-surface-700/50 rounded-lg shadow-xl z-10 py-1 min-w-[160px]">
                      {CRON_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleCronChange(opt.value)}
                          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-surface-700/50 transition-colors ${schedule.cron === opt.value ? 'text-brand-400' : 'text-surface-300'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {schedule.nextRun && (
                  <span className="text-xs text-surface-500">下次执行：{formatTime(schedule.nextRun)}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-surface-300">扫描历史</h3>
          <span className="text-xs text-surface-500">共 {projectRecords.length} 次</span>
        </div>
        {projectRecords.length === 0 ? (
          <div className="card-glow rounded-xl p-8 text-center text-surface-500 text-sm">暂无扫描记录</div>
        ) : (
          <div className="space-y-2">
            {projectRecords.map((record) => {
              const isRunning = record.status === 'running';
              const isFailed = record.status === 'failed';
              const results = record.results;
              const score = results
                ? Math.round(
                    results.testCoverage * 0.3 +
                    Math.max(0, 100 - results.duplicateCodeRate * 5) * 0.2 +
                    Math.max(0, 100 - results.cyclomaticComplexity * 2) * 0.2 +
                    Math.max(0, 100 - results.defectRiskCount * 5) * 0.15 +
                    Math.max(0, 100 - results.dependencyVulnerabilities * 5) * 0.15
                  )
                : null;

              return (
                <div key={record.id} className="card-glow rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-amber-400 animate-pulse' : isFailed ? 'bg-red-400' : 'bg-brand-400'}`} />
                      <span className={`text-sm font-medium ${isRunning ? 'text-amber-400' : isFailed ? 'text-red-400' : 'text-surface-200'}`}>
                        {isRunning ? '扫描进行中' : isFailed ? '扫描失败' : '扫描完成'}
                      </span>
                      {score !== null && (
                        <span className="text-xs text-surface-500">
                          质量评分 <span className="font-semibold text-brand-400">{score}</span>
                        </span>
                      )}
                    </div>
                    <span className={`badge ${isRunning ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : isFailed ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-brand-500/15 text-brand-400 border border-brand-500/30'}`}>
                      {isRunning && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                      {isRunning ? '运行中' : isFailed ? '失败' : '完成'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-surface-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>开始：{formatTime(record.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>结束：{record.endTime ? formatTime(record.endTime) : '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-3 h-3" />
                      <span>耗时：{formatDuration(record.startTime, record.endTime)}</span>
                    </div>
                  </div>
                  {results && (
                    <div className="grid grid-cols-5 gap-2 pt-3 border-t border-surface-700/30">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-medium text-amber-400">{results.duplicateCodeRate}%</span>
                        <span className="text-[10px] text-surface-500">重复代码</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-medium text-purple-400">{results.cyclomaticComplexity}</span>
                        <span className="text-[10px] text-surface-500">复杂度</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-medium text-red-400">{results.defectRiskCount}</span>
                        <span className="text-[10px] text-surface-500">缺陷风险</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-medium text-orange-400">{results.dependencyVulnerabilities}</span>
                        <span className="text-[10px] text-surface-500">依赖漏洞</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-medium text-brand-400">{results.testCoverage}%</span>
                        <span className="text-[10px] text-surface-500">测试覆盖</span>
                      </div>
                    </div>
                  )}
                  {isRunning && (
                    <div className="mt-2 h-1 bg-surface-700 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full animate-shimmer" style={{ width: '60%', background: 'linear-gradient(90deg, #F59E0B, #FBBF24, #F59E0B)', backgroundSize: '200% 100%' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
