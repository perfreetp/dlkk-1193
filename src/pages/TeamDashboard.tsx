import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Trophy, TrendingUp, TrendingDown, Users, Layers, ChevronRight, FolderGit2, CheckCircle2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-surface-400 text-xs mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name === 'value' && entry.color === '#06D6A0' ? '质量评分' : '问题数量'}：{entry.value}
        </p>
      ))}
    </div>
  );
};

const medalIcons = ['🥇', '🥈', '🥉'];

function getScoreColor(score: number) {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number) {
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
}

type ViewMode = 'members' | 'groups';

export default function TeamDashboard() {
  const { qualityTrend, issueTrend, teamRankings, issues, projects, projectGroups } = useStore();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('members');

  const criticalIssues = issues.filter(
    (i) => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed'
  );

  const getGroupStats = (groupId: string) => {
    const groupProjects = projects.filter((p) => p.groupId === groupId);
    const groupIssues = issues.filter((i) => groupProjects.some((p) => p.id === i.projectId));
    const activeIssues = groupIssues.filter((i) => i.status !== 'resolved' && i.status !== 'closed');
    const overdueIssues = activeIssues.filter((i) => i.dueDate && new Date(i.dueDate) < new Date());
    const resolvedIssues = groupIssues.filter((i) => i.status === 'resolved' || i.status === 'closed');
    const avgScore = groupProjects.length > 0
      ? Math.round(groupProjects.reduce((sum, p) => sum + p.qualityScore, 0) / groupProjects.length)
      : 0;

    return {
      projects: groupProjects,
      totalIssues: activeIssues.length,
      criticalIssues: activeIssues.filter((i) => i.severity === 'critical').length,
      overdueIssues: overdueIssues.length,
      resolvedCount: resolvedIssues.length,
      avgScore,
      assignees: [...new Set(activeIssues.map((i) => i.assignee).filter(Boolean))],
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-surface-100">团队看板</h1>
        <div className="flex items-center gap-1 bg-surface-800 rounded-lg p-1 border border-surface-700/50">
          <button
            onClick={() => setViewMode('members')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'members'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <Users className="w-4 h-4" />
            负责人视角
          </button>
          <button
            onClick={() => setViewMode('groups')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'groups'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            项目组视角
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            <h2 className="font-display text-lg font-semibold text-surface-200">质量评分趋势</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={qualityTrend}>
              <defs>
                <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06D6A0" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06D6A0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#1E293B' }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#1E293B' }} domain={[60, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#06D6A0" strokeWidth={2} fill="url(#qualityGrad)" dot={{ r: 3, fill: '#06D6A0', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#06D6A0', stroke: '#0F172A', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-blue-400" />
            <h2 className="font-display text-lg font-semibold text-surface-200">问题数量趋势</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={issueTrend}>
              <defs>
                <linearGradient id="issueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#1E293B' }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#1E293B' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fill="url(#issueGrad)" dot={{ r: 3, fill: '#3B82F6', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#3B82F6', stroke: '#0F172A', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {viewMode === 'members' ? (
        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5 text-brand-500" />
            <h2 className="font-display text-lg font-semibold text-surface-200">团队排行榜</h2>
          </div>
          <div className="space-y-3">
            {teamRankings.map((member, index) => (
              <div
                key={member.member}
                onClick={() => navigate(`/team/${encodeURIComponent(member.member)}`)}
                className="flex items-center gap-4 bg-surface-900/50 rounded-lg px-4 py-3 hover:bg-surface-700/30 transition-colors cursor-pointer group"
              >
                <div className="w-8 text-center font-display font-bold text-surface-400">
                  {index < 3 ? <span className="text-lg">{medalIcons[index]}</span> : <span>{index + 1}</span>}
                </div>
                <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-semibold flex-shrink-0">
                  {member.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-surface-200 font-medium text-sm">{member.member}</span>
                    <span className={`text-sm font-display font-bold ${getScoreTextColor(member.qualityScore)}`}>
                      {member.qualityScore}
                    </span>
                    <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getScoreColor(member.qualityScore)} transition-all`}
                        style={{ width: `${member.qualityScore}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-xs text-surface-400 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-emerald-400 font-display font-semibold text-sm">{member.resolvedCount}</div>
                    <div>已修复</div>
                  </div>
                  <div className="text-center">
                    <div className="text-amber-400 font-display font-semibold text-sm">{member.openIssueCount}</div>
                    <div>未处理</div>
                  </div>
                  <div className="text-center">
                    <div className="text-surface-300 font-display font-semibold text-sm">{member.avgResolutionDays}</div>
                    <div>平均天</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-surface-600 group-hover:text-brand-400 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Layers className="w-5 h-5 text-brand-500" />
            <h2 className="font-display text-lg font-semibold text-surface-200">项目组概览</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projectGroups.map((group) => {
              const stats = getGroupStats(group.id);
              return (
                <div
                  key={group.id}
                  onClick={() => navigate(`/group/${group.id}`)}
                  className="rounded-xl p-5 border border-surface-700/50 bg-surface-900/50 hover:border-brand-500/30 hover:bg-surface-800/50 transition-all cursor-pointer group"
                  style={{ borderLeftWidth: 3, borderLeftColor: group.color }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display font-semibold text-surface-100 group-hover:text-brand-400 transition-colors">
                        {group.name}
                      </h3>
                      <p className="text-xs text-surface-500 mt-1">{group.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-surface-600 group-hover:text-brand-400 transition-colors" />
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div>
                      <p className={`text-2xl font-display font-bold ${getScoreTextColor(stats.avgScore)}`}>
                        {stats.avgScore}
                      </p>
                      <p className="text-xs text-surface-500">平均质量分</p>
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold text-amber-400">{stats.totalIssues}</p>
                      <p className="text-xs text-surface-500">未处理问题</p>
                    </div>
                    <div>
                      <p className={`text-2xl font-display font-bold ${stats.overdueIssues > 0 ? 'text-red-400' : 'text-brand-400'}`}>
                        {stats.overdueIssues}
                      </p>
                      <p className="text-xs text-surface-500">已逾期</p>
                    </div>
                    <div>
                      <p className="text-2xl font-display font-bold text-emerald-400">{stats.resolvedCount}</p>
                      <p className="text-xs text-surface-500">已修复</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-surface-700/30">
                    <div className="flex items-center gap-1.5 text-xs text-surface-400">
                      <FolderGit2 className="w-3.5 h-3.5" />
                      {stats.projects.length} 个项目
                    </div>
                    {stats.criticalIssues > 0 && (
                      <span className="text-xs text-red-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {stats.criticalIssues} 个严重风险
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border border-red-500/30 rounded-xl p-5 bg-surface-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="font-display text-lg font-semibold text-red-400">未处理严重风险</h2>
          <span className="ml-auto badge-critical">{criticalIssues.length} 项</span>
        </div>
        {criticalIssues.length === 0 ? (
          <p className="text-surface-500 text-sm py-4 text-center">暂无未处理的严重风险</p>
        ) : (
          <div className="space-y-3">
            {criticalIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => navigate(`/issues?project=${issue.projectId}&severity=critical&id=${issue.id}`)}
                className="border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3 cursor-pointer hover:bg-red-500/10 hover:border-red-500/40 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-surface-200 text-sm font-medium truncate">{issue.title}</p>
                    <p className="text-surface-500 text-xs mt-1">
                      {issue.projectName}
                      {issue.assignee && <span> · 负责人: {issue.assignee}</span>}
                    </p>
                  </div>
                  <span className="badge-critical flex-shrink-0">严重</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
