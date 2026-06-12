import { useState } from 'react';
import { Play, Clock, ToggleLeft, ToggleRight, ChevronDown, Loader2, CheckCircle2, XCircle, Timer } from 'lucide-react';
import { useStore } from '@/store/useStore';

const CRON_OPTIONS = [
  { label: '每天 08:00', value: '0 8 * * *' },
  { label: '工作日 08:00', value: '0 8 * * 1-5' },
  { label: '每天 14:00', value: '0 14 * * *' },
  { label: '每周一 10:00', value: '0 10 * * 1' },
  { label: '每6小时', value: '0 */6 * * *' },
];

export default function ScanConsolePanel() {
  const { projects, scanRecords, scanSchedules, triggerScan, updateScanSchedule } = useStore();
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? '');
  const [cronDropdownOpen, setCronDropdownOpen] = useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const schedule = scanSchedules.find((s) => s.projectId === selectedProjectId);
  const projectRecords = scanRecords
    .filter((r) => r.projectId === selectedProjectId)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const handleTriggerScan = () => {
    if (selectedProjectId) triggerScan(selectedProjectId);
  };

  const handleToggleSchedule = () => {
    if (!schedule) return;
    updateScanSchedule(selectedProjectId, { enabled: !schedule.enabled });
  };

  const handleCronChange = (cron: string) => {
    updateScanSchedule(selectedProjectId, { enabled: true, cron, nextRun: '' });
    setCronDropdownOpen(false);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const duration = (start: string, end: string | null) => {
    if (!end) return '进行中';
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
    if (diff < 60) return `${Math.round(diff)}秒`;
    return `${Math.round(diff / 60)}分钟`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-surface-100">扫描控制台</h2>
        <div className="relative">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-surface-100">{selectedProject.name}</h3>
              <p className="text-xs text-surface-500 mt-1">{selectedProject.repoUrl} · {selectedProject.branch}</p>
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

          <div className="border-t border-surface-700/50 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-surface-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                定时扫描
              </span>
              <button onClick={handleToggleSchedule} className="text-brand-500 hover:text-brand-400 transition-colors">
                {schedule?.enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-surface-600" />}
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
        <h3 className="text-sm font-medium text-surface-300">扫描历史</h3>
        {projectRecords.length === 0 ? (
          <div className="card-glow rounded-xl p-8 text-center text-surface-500 text-sm">暂无扫描记录</div>
        ) : (
          <div className="relative pl-6 space-y-0">
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-surface-700/50" />
            {projectRecords.map((record) => {
              const isRunning = record.status === 'running';
              const isFailed = record.status === 'failed';
              return (
                <div key={record.id} className="relative flex items-start gap-4 py-3">
                  <div className={`absolute left-[-14px] top-4 w-3 h-3 rounded-full border-2 ${isRunning ? 'border-amber-400 bg-amber-400/30' : isFailed ? 'border-red-400 bg-red-400/30' : 'border-brand-400 bg-brand-400/30'}`} />
                  <div className="flex-1 card-glow rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-surface-200 flex items-center gap-2">
                        {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : isFailed ? <XCircle className="w-3.5 h-3.5 text-red-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
                        {formatTime(record.startTime)}
                      </span>
                      <span className={`badge ${isRunning ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : isFailed ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-brand-500/15 text-brand-400 border border-brand-500/30'}`}>
                        {isRunning ? '运行中' : isFailed ? '失败' : '完成'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-surface-500">
                      <span>耗时：{duration(record.startTime, record.endTime)}</span>
                      {record.results && (
                        <span>质量评分：{(() => {
                          const r = record.results;
                          return Math.round((r.testCoverage * 0.3 + (100 - r.duplicateCodeRate * 5) * 0.2 + (100 - r.cyclomaticComplexity * 2) * 0.2 + (100 - r.defectRiskCount * 5) * 0.15 + (100 - r.dependencyVulnerabilities * 5) * 0.15));
                        })()}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
