import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, FolderGit2, Users, Layers, ChevronRight } from 'lucide-react';
import { useStore } from '@/store/useStore';

const SEVERITY_MAP: Record<string, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
};

const STATUS_MAP: Record<string, string> = {
  open: '待处理',
  assigned: '已分派',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export default function TeamGroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { issues, projects, projectGroups, teamRankings } = useStore();

  const group = projectGroups.find((g) => g.id === groupId);
  const groupProjects = projects.filter((p) => p.groupId === groupId);
  const groupIssues = issues.filter((i) => groupProjects.some((p) => p.id === i.projectId));

  const activeIssues = groupIssues.filter((i) => i.status !== 'resolved' && i.status !== 'closed');
  const resolvedIssues = groupIssues.filter((i) => i.status === 'resolved' || i.status === 'closed');
  const overdueIssues = activeIssues.filter((i) => i.dueDate && new Date(i.dueDate) < new Date());
  const criticalIssues = activeIssues.filter((i) => i.severity === 'critical');

  const avgScore = groupProjects.length > 0
    ? Math.round(groupProjects.reduce((sum, p) => sum + p.qualityScore, 0) / groupProjects.length)
    : 0;

  const membersInGroup = useMemo(() => {
    const map: Record<string, { name: string; issues: typeof activeIssues }> = {};
    activeIssues.forEach((issue) => {
      if (issue.assignee) {
        if (!map[issue.assignee]) {
          map[issue.assignee] = { name: issue.assignee, issues: [] };
        }
        map[issue.assignee].issues.push(issue);
      }
    });
    return Object.entries(map).map(([name, data]) => ({
      name,
      issues: data.issues,
      ranking: teamRankings.find((r) => r.member === name),
    }));
  }, [activeIssues, teamRankings]);

  const recentResolved = resolvedIssues
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getDaysOverdue = (dueDate: string | null) => {
    if (!dueDate) return 0;
    return Math.ceil((new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-surface-500 mb-4">项目组不存在</p>
        <button onClick={() => navigate(-1)} className="btn-primary text-sm">返回团队看板</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-surface-400 hover:text-surface-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: `${group.color}20`, color: group.color }}
          >
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-100">{group.name}</h1>
            <p className="text-surface-400 text-sm mt-0.5">
              {group.description} · {groupProjects.length} 个项目 · 平均 {avgScore} 分
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <FolderGit2 className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-surface-400">项目数</span>
          </div>
          <p className="stat-number text-2xl text-purple-400">{groupProjects.length}</p>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-surface-400">未处理问题</span>
          </div>
          <p className="stat-number text-2xl text-amber-400">{activeIssues.length}</p>
          <p className="text-xs text-surface-500 mt-1">其中严重 {criticalIssues.length} 个</p>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-red-400" />
            <span className="text-sm text-surface-400">已逾期</span>
          </div>
          <p className={`stat-number text-2xl ${overdueIssues.length > 0 ? 'text-red-400' : 'text-brand-400'}`}>
            {overdueIssues.length}
          </p>
          <p className="text-xs text-surface-500 mt-1">
            {overdueIssues.length > 0 ? `最长逾期 ${Math.max(...overdueIssues.map((i) => getDaysOverdue(i.dueDate)))} 天` : '无逾期'}
          </p>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-surface-400">已修复</span>
          </div>
          <p className="stat-number text-2xl text-emerald-400">{resolvedIssues.length}</p>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-surface-400">参与成员</span>
          </div>
          <p className="stat-number text-2xl text-blue-400">{membersInGroup.length}</p>
        </div>
      </div>

      <div className="card-glow rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-surface-100 flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-brand-400" />
            组内项目
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {groupProjects.map((project) => {
            const projectIssues = activeIssues.filter((i) => i.projectId === project.id);
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="p-4 rounded-lg border border-surface-700/50 bg-surface-800/50 hover:border-brand-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-surface-200 group-hover:text-brand-400 transition-colors">
                    {project.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-surface-600 group-hover:text-brand-400 transition-colors" />
                </div>
                <div className="flex items-center gap-3 text-xs text-surface-500">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    {projectIssues.length} 问题
                  </span>
                  <span>{project.qualityScore} 分</span>
                  <span className={`px-1.5 py-0.5 rounded ${
                    project.status === 'scanning' ? 'bg-amber-500/15 text-amber-400' :
                    project.status === 'connected' ? 'bg-brand-500/15 text-brand-400' :
                    'bg-surface-600/30 text-surface-400'
                  }`}>
                    {project.status === 'scanning' ? '扫描中' : project.status === 'connected' ? '正常' : '未连接'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-glow rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-surface-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-400" />
            参与成员
          </h3>
        </div>
        {membersInGroup.length === 0 ? (
          <p className="text-center py-6 text-sm text-surface-500">暂无参与成员</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {membersInGroup.map(({ name, issues: memberIssues, ranking }) => (
              <div
                key={name}
                onClick={() => navigate(`/team/${encodeURIComponent(name)}`)}
                className="p-4 rounded-lg border border-surface-700/50 bg-surface-800/50 hover:border-brand-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-semibold">
                    {ranking?.avatar || name.slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-200 group-hover:text-brand-400 transition-colors">
                      {name}
                    </p>
                    <p className="text-xs text-surface-500">
                      {ranking ? `${ranking.qualityScore} 分` : '暂无评分'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-surface-500">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    {memberIssues.length} 未处理
                  </span>
                  <span>
                    {memberIssues.filter((i) => i.severity === 'critical').length} 严重
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-glow rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-surface-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            未处理问题
          </h3>
          <Link
            to={`/issues?group=${groupId}`}
            className="text-xs text-surface-400 hover:text-brand-400 transition-colors"
          >
            查看全部 →
          </Link>
        </div>
        {activeIssues.length === 0 ? (
          <p className="text-center py-8 text-sm text-surface-500">太棒了！没有待处理问题</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {activeIssues.slice(0, 10).map((issue) => (
              <div
                key={issue.id}
                onClick={() => navigate(`/issues?group=${groupId}&id=${issue.id}`)}
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50 hover:bg-surface-700/40 transition-colors cursor-pointer"
              >
                <span className={`badge-${issue.severity} flex-shrink-0`}>
                  {SEVERITY_MAP[issue.severity]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-200 truncate">{issue.title}</p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {issue.projectName} · {STATUS_MAP[issue.status]}
                    {issue.assignee && ` · ${issue.assignee}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {issue.dueDate && (
                    <p className={`text-xs flex items-center gap-1 justify-end ${isOverdue(issue.dueDate) ? 'text-red-400' : 'text-surface-500'}`}>
                      <Clock className="w-3 h-3" />
                      {issue.dueDate}
                      {isOverdue(issue.dueDate) && <span>({getDaysOverdue(issue.dueDate)}天)</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-glow rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-surface-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            最近修复记录
          </h3>
        </div>
        {recentResolved.length === 0 ? (
          <p className="text-center py-8 text-sm text-surface-500">暂无修复记录</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentResolved.map((issue) => (
              <div
                key={issue.id}
                onClick={() => navigate(`/issues?group=${groupId}&id=${issue.id}`)}
                className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-200 truncate">{issue.title}</p>
                  <p className="text-xs text-surface-500 mt-0.5">
                    {issue.projectName} · {issue.filePath}
                    {issue.assignee && ` · ${issue.assignee}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-surface-500">{formatTime(issue.updatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
