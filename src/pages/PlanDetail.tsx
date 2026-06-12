import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, AlertTriangle, CheckCircle2, Clock, Target, BarChart3 } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function PlanDetail() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { plans, issues, completePlanIssue, projects, teamMembers } = useStore();

  const plan = plans.find((p) => p.id === planId);

  const planIssues = plan
    ? plan.issueIds
        .map((id) => issues.find((i) => i.id === id))
        .filter((i): i is NonNullable<typeof i> => i !== undefined)
    : [];

  const completedCount = plan?.completedIssueIds.length ?? 0;
  const totalCount = plan?.issueIds.length ?? 0;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const issuesByProject = (() => {
    const map: Record<string, typeof planIssues> = {};
    planIssues.forEach((issue) => {
      if (!map[issue.projectId]) map[issue.projectId] = [];
      map[issue.projectId].push(issue);
    });
    return map;
  })();

  const issuesByAssignee = (() => {
    const map: Record<string, typeof planIssues> = { unassigned: [] };
    planIssues.forEach((issue) => {
      const key = issue.assignee || 'unassigned';
      if (!map[key]) map[key] = [];
      map[key].push(issue);
    });
    return map;
  })();

  const atRiskIssues = planIssues.filter((i) => {
    if (plan?.completedIssueIds.includes(i.id)) return false;
    if (!plan?.endDate || !i.dueDate) return false;
    const issueDue = new Date(i.dueDate);
    const planEnd = new Date(plan.endDate);
    return issueDue > planEnd || i.severity === 'critical';
  });

  const overdueIssues = planIssues.filter((i) => {
    if (plan?.completedIssueIds.includes(i.id)) return false;
    if (!i.dueDate) return false;
    return new Date(i.dueDate) < new Date() && i.status !== 'resolved' && i.status !== 'closed';
  });

  const isCompleted = (issueId: string) => plan?.completedIssueIds.includes(issueId) ?? false;

  const getProjectName = (projectId: string) => projects.find((p) => p.id === projectId)?.name ?? projectId;

  const severityLabel = (s: string) => ({ critical: '严重', high: '高', medium: '中', low: '低' } as Record<string, string>)[s] ?? s;
  const statusLabel = (s: string) => ({ open: '待处理', assigned: '已分派', in_progress: '处理中', resolved: '已解决', closed: '已关闭' } as Record<string, string>)[s] ?? s;

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-surface-500 mb-4">计划不存在</p>
        <button onClick={() => navigate('/plans')} className="btn-primary text-sm">返回计划列表</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-surface-400 hover:text-surface-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-surface-100">{plan.name}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              plan.status === 'active' ? 'bg-brand-500/15 text-brand-500 border border-brand-500/30'
              : plan.status === 'completed' ? 'bg-brand-400/15 text-brand-400 border border-brand-400/30'
              : 'bg-red-400/15 text-red-400 border border-red-400/30'
            }`}>
              {plan.status === 'active' ? '进行中' : plan.status === 'completed' ? '已完成' : '已逾期'}
            </span>
          </div>
          <p className="text-surface-400 text-sm mt-1">{plan.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-brand-400" />
            <span className="text-sm text-surface-400">完成进度</span>
          </div>
          <p className="stat-number text-2xl text-brand-400">{percentage}%</p>
          <p className="text-xs text-surface-500 mt-1">{completedCount} / {totalCount} 问题</p>
          <div className="mt-2 h-2 bg-surface-700 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
          </div>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-surface-400">计划周期</span>
          </div>
          <p className="text-surface-200 text-sm font-medium">{plan.startDate}</p>
          <p className="text-surface-400 text-xs">至 {plan.endDate}</p>
          <p className="text-xs text-surface-500 mt-2">
            {Math.ceil((new Date(plan.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) > 0
              ? `剩余 ${Math.ceil((new Date(plan.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} 天`
              : '已到期'}
          </p>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-surface-400">参与人数</span>
          </div>
          <p className="stat-number text-2xl text-blue-400">{Object.keys(issuesByAssignee).filter(k => k !== 'unassigned').length}</p>
          <p className="text-xs text-surface-500 mt-1">
            {issuesByAssignee.unassigned?.length ?? 0} 个问题未分派
          </p>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-surface-400">逾期风险</span>
          </div>
          <p className={`stat-number text-2xl ${atRiskIssues.length > 0 ? 'text-red-400' : 'text-brand-400'}`}>
            {atRiskIssues.length}
          </p>
          <p className="text-xs text-surface-500 mt-1">
            {overdueIssues.length} 个已逾期
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card-glow rounded-xl p-5">
          <h3 className="font-display font-semibold text-surface-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            按项目分布
          </h3>
          <div className="space-y-3">
            {Object.entries(issuesByProject).map(([projectId, projectIssues]) => {
              const completed = projectIssues.filter((i) => isCompleted(i.id)).length;
              const total = projectIssues.length;
              const pct = total > 0 ? (completed / total) * 100 : 0;

              return (
                <div key={projectId} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-surface-300">{getProjectName(projectId)}</span>
                    <span className="text-xs text-surface-500 tabular-nums">{completed} / {total}</span>
                  </div>
                  <div className="h-2 bg-surface-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(issuesByProject).length === 0 && (
              <p className="text-sm text-surface-500 text-center py-4">暂无关联问题</p>
            )}
          </div>
        </div>

        <div className="card-glow rounded-xl p-5">
          <h3 className="font-display font-semibold text-surface-100 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            负责人分布
          </h3>
          <div className="space-y-3">
            {Object.entries(issuesByAssignee).map(([assignee, assigneeIssues]) => {
              const completed = assigneeIssues.filter((i) => isCompleted(i.id)).length;
              const total = assigneeIssues.length;
              const pct = total > 0 ? (completed / total) * 100 : 0;
              const displayName = assignee === 'unassigned' ? '未分派' : assignee;

              return (
                <div key={assignee} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-[9px] font-bold text-brand-400">
                        {displayName.slice(0, 2)}
                      </div>
                      <span className="text-sm text-surface-300">{displayName}</span>
                    </div>
                    <span className="text-xs text-surface-500 tabular-nums">{completed} / {total}</span>
                  </div>
                  <div className="h-2 bg-surface-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card-glow rounded-xl p-5">
        <h3 className="font-display font-semibold text-surface-100 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand-400" />
          问题清单
        </h3>
        {planIssues.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-8">暂无关联问题</p>
        ) : (
          <div className="space-y-2">
            {planIssues.map((issue) => {
              const done = isCompleted(issue.id);
              return (
                <div
                  key={issue.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${done ? 'bg-surface-800/30' : 'bg-surface-800/60 hover:bg-surface-700/40'}`}
                >
                  <button
                    onClick={() => { if (!done && plan) completePlanIssue(plan.id, issue.id); }}
                    className="flex-shrink-0"
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-brand-500" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-surface-600 hover:border-brand-400 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${done ? 'line-through text-surface-500' : 'text-surface-200'}`}>
                      {issue.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-surface-500">
                      <span className={`badge-${issue.severity} text-[10px]`}>{severityLabel(issue.severity)}</span>
                      <span>{issue.projectName}</span>
                      <span className="font-mono truncate">{issue.filePath}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {issue.assignee && (
                      <p className="text-xs text-surface-400 flex items-center gap-1 justify-end">
                        <User className="w-3 h-3" />
                        {issue.assignee}
                      </p>
                    )}
                    {issue.dueDate && (
                      <p className={`text-xs mt-0.5 flex items-center gap-1 justify-end ${
                        !done && new Date(issue.dueDate) < new Date() ? 'text-red-400' : 'text-surface-500'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {issue.dueDate}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {atRiskIssues.length > 0 && (
        <div className="card-glow rounded-xl p-5 border-red-500/30">
          <h3 className="font-display font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            风险预警
          </h3>
          <div className="space-y-2">
            {atRiskIssues.slice(0, 5).map((issue) => (
              <div key={issue.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-200 truncate">{issue.title}</p>
                  <p className="text-xs text-surface-500">{issue.projectName} · {issue.assignee || '未分派'}</p>
                </div>
                <span className="badge-critical text-[10px]">{severityLabel(issue.severity)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
