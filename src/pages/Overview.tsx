import { Link } from 'react-router-dom';
import { FolderKanban, TrendingUp, AlertTriangle, ShieldAlert, ScanSearch, ListChecks, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ScoreRing from '@/components/ScoreRing';

export default function Overview() {
  const { projects, issues } = useStore();

  const totalProjects = projects.length;

  const scannedProjects = projects.filter((p) => p.qualityScore > 0);
  const avgQuality = scannedProjects.length
    ? Math.round(scannedProjects.reduce((s, p) => s + p.qualityScore, 0) / scannedProjects.length)
    : 0;

  const unresolvedIssues = issues.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length;

  const highRiskProjects = projects.filter((p) => p.criticalIssues > 0 || (p.qualityScore > 0 && p.qualityScore < 70)).length;

  const stats = [
    { label: '项目总数', value: totalProjects, icon: FolderKanban, color: '#06D6A0' },
    { label: '平均质量评分', value: avgQuality, icon: TrendingUp, color: '#06D6A0' },
    { label: '未处理问题', value: unresolvedIssues, icon: AlertTriangle, color: '#F59E0B' },
    { label: '高风险项目', value: highRiskProjects, icon: ShieldAlert, color: '#EF4444' },
  ];

  const getStatusLabel = (status: string) => {
    if (status === 'connected') return '已连接';
    if (status === 'scanning') return '扫描中';
    return '未连接';
  };

  const getStatusClass = (status: string) => {
    if (status === 'connected') return 'bg-brand-500/15 text-brand-400 border-brand-500/30';
    if (status === 'scanning') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-surface-500/15 text-surface-400 border-surface-500/30';
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className="card-glow rounded-xl p-5 animate-fade-in-up"
            style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'backwards' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-surface-400 text-sm font-body">{stat.label}</span>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <span className="stat-number text-3xl" style={{ color: stat.color }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((project, idx) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="card-glow rounded-xl p-5 block group animate-fade-in-up"
            style={{ animationDelay: `${300 + idx * 60}ms`, animationFillMode: 'backwards' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 flex-1 mr-3">
                <h3 className="font-display font-bold text-surface-100 text-base truncate group-hover:text-brand-400 transition-colors">
                  {project.name}
                </h3>
                <p className="text-surface-500 text-xs mt-1 truncate">{project.branch}</p>
              </div>
              <ScoreRing score={project.qualityScore} size={52} strokeWidth={4} />
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className={`badge border ${getStatusClass(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
              {project.criticalIssues > 0 && (
                <span className="badge-critical">
                  {project.criticalIssues} 严重
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-surface-500 pt-3 border-t border-surface-700/50">
              <span>问题 {project.totalIssues}</span>
              <span>上次扫描 {formatTime(project.lastScanTime)}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/scan"
          className="btn-primary inline-flex items-center gap-2"
        >
          <ScanSearch size={16} />
          发起扫描
        </Link>
        <Link
          to="/issues"
          className="btn-ghost inline-flex items-center gap-2 border border-surface-700/50"
        >
          <ListChecks size={16} />
          问题列表
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
