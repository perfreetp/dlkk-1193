import { useState } from 'react';
import { GitBranch, Link2, Lock, Plus, Wifi, WifiOff, Loader2, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface RepoAccessPanelProps {
  onGoToConsole?: (projectId?: string) => void;
}

const STATUS_MAP = {
  connected: { label: '已连接', icon: Wifi, color: 'text-brand-400' },
  disconnected: { label: '未连接', icon: WifiOff, color: 'text-surface-500' },
  scanning: { label: '扫描中', icon: Loader2, color: 'text-amber-400' },
} as const;

export default function RepoAccessPanel({ onGoToConsole }: RepoAccessPanelProps) {
  const { projects, addProject } = useStore();
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [credential, setCredential] = useState('');
  const [repoName, setRepoName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (!repoUrl.trim() || !repoName.trim()) return;
    const newProjectId = `p${Date.now()}`;
    addProject({
      name: repoName.trim(),
      repoUrl: repoUrl.trim(),
      branch: branch.trim() || 'main',
      lastScanTime: null,
      status: 'disconnected',
    });
    setRepoUrl('');
    setBranch('main');
    setCredential('');
    setRepoName('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-surface-100">仓库接入管理</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          添加仓库
        </button>
      </div>

      {showForm && (
        <div className="card-glow rounded-xl p-5 space-y-4 animate-fade-in-up">
          <h3 className="text-sm font-medium text-surface-300">新增仓库</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-surface-400">仓库名称</label>
              <input
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="例：NovaPay 支付网关"
                className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-brand-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-surface-400 flex items-center gap-1"><Link2 className="w-3 h-3" />仓库地址</label>
              <input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/team/repo"
                className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-brand-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-surface-400 flex items-center gap-1"><GitBranch className="w-3 h-3" />分支名</label>
              <input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-brand-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-surface-400 flex items-center gap-1"><Lock className="w-3 h-3" />访问凭据</label>
              <input
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                type="password"
                placeholder="Personal Access Token"
                className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-brand-500/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="btn-ghost text-sm">取消</button>
            <button onClick={handleAdd} className="btn-primary text-sm">确认添加</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-surface-300">已接入仓库</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => {
            const statusInfo = STATUS_MAP[project.status];
            const StatusIcon = statusInfo.icon;
            return (
              <div key={project.id} className="card-glow rounded-xl p-4 flex items-start gap-4 group">
                <div className={`mt-0.5 p-2 rounded-lg ${project.status === 'connected' ? 'bg-brand-500/10' : project.status === 'scanning' ? 'bg-amber-500/10' : 'bg-surface-700/30'}`}>
                  <GitBranch className={`w-4 h-4 ${statusInfo.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-surface-100 truncate">{project.name}</span>
                    <span className={`inline-flex items-center gap-1 text-xs ${statusInfo.color}`}>
                      <StatusIcon className={`w-3 h-3 ${project.status === 'scanning' ? 'animate-spin' : ''}`} />
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-1 truncate font-mono">{project.repoUrl}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{project.branch}</span>
                    {project.lastScanTime && (
                      <span>最近扫描：{new Date(project.lastScanTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
                {onGoToConsole && (
                  <button
                    onClick={() => onGoToConsole(project.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
                  >
                    控制台
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
