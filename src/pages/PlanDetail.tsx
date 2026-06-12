import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ArrowLeft, Calendar, User, AlertTriangle, CheckCircle2, Clock, Target, BarChart3, ListChecks, X, Plus, Edit2, Trash2, Link2, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { PlanMilestone } from '@/types';

const MILESTONE_STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: '待开始', className: 'bg-surface-600/30 text-surface-400 border border-surface-600/30' },
  active: { label: '进行中', className: 'bg-brand-500/15 text-brand-500 border border-brand-500/30' },
  completed: { label: '已完成', className: 'bg-brand-400/15 text-brand-400 border border-brand-400/30' },
  overdue: { label: '已逾期', className: 'bg-red-400/15 text-red-400 border border-red-400/30' },
};

const ISSUE_STATUS_MAP: Record<string, { label: string; className: string }> = {
  open: { label: '待处理', className: 'bg-surface-600/50 text-surface-300' },
  assigned: { label: '已分派', className: 'bg-blue-500/15 text-blue-400' },
  in_progress: { label: '处理中', className: 'bg-amber-500/15 text-amber-400' },
  resolved: { label: '已解决', className: 'bg-emerald-500/15 text-emerald-400' },
  closed: { label: '已关闭', className: 'bg-surface-600/50 text-surface-400' },
};

export default function PlanDetail() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const {
    plans,
    issues,
    completePlanIssue,
    projects,
    teamMembers,
    updatePlanMilestone,
    addPlanMilestone,
    deletePlanMilestone,
    addIssueToMilestone,
    removeIssueFromMilestone,
  } = useStore();

  const [viewMode, setViewMode] = useState<'overview' | 'milestones'>('overview');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLinkIssuesModal, setShowLinkIssuesModal] = useState(false);

  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'pending' as PlanMilestone['status'],
  });

  const [editMilestone, setEditMilestone] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);

  const plan = plans.find((p) => p.id === planId);

  const planIssues = plan
    ? plan.issueIds
        .map((id) => issues.find((i) => i.id === id))
        .filter((i): i is NonNullable<typeof i> => i !== undefined)
    : [];

  const completedCount = plan?.completedIssueIds.length ?? 0;
  const totalCount = plan?.issueIds.length ?? 0;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const issuesByProject = useMemo(() => {
    const map: Record<string, typeof planIssues> = {};
    planIssues.forEach((issue) => {
      if (!map[issue.projectId]) map[issue.projectId] = [];
      map[issue.projectId].push(issue);
    });
    return map;
  }, [planIssues]);

  const issuesByAssignee = useMemo(() => {
    const map: Record<string, typeof planIssues> = { unassigned: [] };
    planIssues.forEach((issue) => {
      const key = issue.assignee || 'unassigned';
      if (!map[key]) map[key] = [];
      map[key].push(issue);
    });
    return map;
  }, [planIssues]);

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

  const selectedMilestone = plan?.milestones.find((m) => m.id === selectedMilestoneId);
  const milestoneIssues = selectedMilestone
    ? selectedMilestone.issueIds
        .map((id) => issues.find((i) => i.id === id))
        .filter((i): i is NonNullable<typeof i> => i !== undefined)
    : [];

  const availableIssues = issues.filter(
    (issue) => issue.status !== 'resolved' && issue.status !== 'closed'
  );

  const openCreateModal = () => {
    setNewMilestone({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      status: 'pending',
    });
    setShowCreateModal(true);
  };

  const handleCreateMilestone = () => {
    if (!plan || !newMilestone.name.trim() || !newMilestone.startDate || !newMilestone.endDate) return;
    addPlanMilestone(plan.id, {
      name: newMilestone.name.trim(),
      description: newMilestone.description.trim(),
      startDate: newMilestone.startDate,
      endDate: newMilestone.endDate,
      status: newMilestone.status,
      issueIds: [],
    });
    setShowCreateModal(false);
  };

  const openEditModal = (milestone: PlanMilestone) => {
    setEditMilestone({
      name: milestone.name,
      description: milestone.description,
      startDate: milestone.startDate,
      endDate: milestone.endDate,
    });
    setShowEditModal(true);
  };

  const handleEditMilestone = () => {
    if (!plan || !selectedMilestoneId || !editMilestone.name.trim() || !editMilestone.startDate || !editMilestone.endDate) return;
    updatePlanMilestone(plan.id, selectedMilestoneId, {
      name: editMilestone.name.trim(),
      description: editMilestone.description.trim(),
      startDate: editMilestone.startDate,
      endDate: editMilestone.endDate,
    });
    setShowEditModal(false);
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    if (!plan) return;
    if (!confirm('确定要删除该里程碑吗？')) return;
    deletePlanMilestone(plan.id, milestoneId);
    if (selectedMilestoneId === milestoneId) {
      setSelectedMilestoneId(null);
    }
  };

  const openLinkIssuesModal = () => {
    if (!selectedMilestone) return;
    setSelectedIssueIds([...selectedMilestone.issueIds]);
    setShowLinkIssuesModal(true);
  };

  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssueIds((prev) =>
      prev.includes(issueId)
        ? prev.filter((id) => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleLinkIssues = () => {
    if (!plan || !selectedMilestone) return;
    const currentIds = new Set(selectedMilestone.issueIds);
    const newIds = new Set(selectedIssueIds);

    newIds.forEach((id) => {
      if (!currentIds.has(id)) {
        addIssueToMilestone(plan.id, selectedMilestone.id, id);
      }
    });

    currentIds.forEach((id) => {
      if (!newIds.has(id)) {
        removeIssueFromMilestone(plan.id, selectedMilestone.id, id);
      }
    });

    setShowLinkIssuesModal(false);
  };

  const handleRemoveIssue = (issueId: string) => {
    if (!plan || !selectedMilestone) return;
    removeIssueFromMilestone(plan.id, selectedMilestone.id, issueId);
  };

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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-surface-100">{plan.name}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              plan.status === 'active' ? 'bg-brand-500/15 text-brand-500 border border-brand-500/30'
              : plan.status === 'completed' ? 'bg-brand-400/15 text-brand-400 border border-brand-400/30'
              : 'bg-red-400/15 text-red-400 border border-red-400/30'
            }`}>
              {plan.status === 'active' ? '进行中' : plan.status === 'completed' ? '已完成' : '已逾期'}
            </span>
            <div className="flex bg-surface-800 rounded-lg p-0.5 ml-auto">
              <button
                onClick={() => setViewMode('overview')}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                  viewMode === 'overview' ? 'bg-surface-700 text-surface-200' : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                总览
              </button>
              <button
                onClick={() => setViewMode('milestones')}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                  viewMode === 'milestones' ? 'bg-surface-700 text-surface-200' : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                阶段里程碑
              </button>
            </div>
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

      {viewMode === 'overview' && (
        <>
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
                    <Link
                      key={projectId}
                      to={`/projects/${projectId}`}
                      className="group block"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-surface-300 group-hover:text-brand-400 transition-colors">
                          {getProjectName(projectId)}
                        </span>
                        <span className="text-xs text-surface-500 tabular-nums">{completed} / {total}</span>
                      </div>
                      <div className="h-2 bg-surface-700/50 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </Link>
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
              <div className="space-y-2 max-h-96 overflow-y-auto">
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
                          <span className={`badge ${ISSUE_STATUS_MAP[issue.status]?.className ?? ''} text-[10px]`}>
                            {ISSUE_STATUS_MAP[issue.status]?.label ?? issue.status}
                          </span>
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
                    <span className={`badge-${issue.severity} text-[10px]`}>{severityLabel(issue.severity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === 'milestones' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-surface-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-400" />
              阶段里程碑
            </h2>
            <button
              onClick={openCreateModal}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              新增阶段
            </button>
          </div>

          {plan.milestones.length === 0 ? (
            <div className="card-glow rounded-xl p-12 text-center">
              <ListChecks className="w-12 h-12 text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400">暂无里程碑</p>
              <p className="text-surface-500 text-sm mt-1">该计划尚未创建里程碑</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {plan.milestones.map((milestone) => {
                  const mIssues = milestone.issueIds
                    .map((id) => issues.find((i) => i.id === id))
                    .filter(Boolean);
                  const mCompleted = mIssues.filter((i) => i && plan.completedIssueIds.includes(i.id)).length;
                  const mTotal = mIssues.length;
                  const mPct = mTotal > 0 ? (mCompleted / mTotal) * 100 : 0;
                  const statusInfo = MILESTONE_STATUS_MAP[milestone.status];
                  const selected = selectedMilestoneId === milestone.id;

                  return (
                    <div
                      key={milestone.id}
                      className={`flex-1 min-w-[240px] rounded-xl border transition-all ${
                        selected
                          ? 'border-brand-500/50 bg-brand-500/10'
                          : 'border-surface-700/50 bg-surface-800/50 hover:border-surface-600'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0 pr-2">
                            <div
                              className="flex items-center gap-1.5 group cursor-pointer"
                              onDoubleClick={() => openEditModal(milestone)}
                            >
                              <h4 className="font-medium text-surface-200 text-sm truncate">{milestone.name}</h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(milestone);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-surface-500 hover:text-brand-400 transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMilestone(milestone.id);
                            }}
                            className="text-surface-500 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded border inline-block mb-2 ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                        <p className="text-xs text-surface-500 mb-3 line-clamp-1">{milestone.description}</p>
                        <div className="flex items-center gap-2 text-xs text-surface-500 mb-3">
                          <Calendar className="w-3 h-3" />
                          {milestone.startDate} ~ {milestone.endDate}
                        </div>
                        <button
                          onClick={() => setSelectedMilestoneId(selected ? null : milestone.id)}
                          className="w-full"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-500 rounded-full transition-all"
                                style={{ width: `${mPct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-brand-400 tabular-nums">{Math.round(mPct)}%</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedMilestone && (
                <div className="card-glow rounded-xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 group">
                        <h3
                          className="font-display font-semibold text-surface-100 flex items-center gap-2 cursor-pointer"
                          onDoubleClick={() => openEditModal(selectedMilestone)}
                        >
                          <Target className="w-4 h-4 text-brand-400" />
                          {selectedMilestone.name}
                        </h3>
                        <button
                          onClick={() => openEditModal(selectedMilestone)}
                          className="opacity-0 group-hover:opacity-100 text-surface-500 hover:text-brand-400 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-surface-500 mt-1">{selectedMilestone.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={openLinkIssuesModal}
                        className="btn-ghost text-xs flex items-center gap-1.5"
                      >
                        <Link2 className="w-4 h-4" />
                        关联问题
                      </button>
                      <span className="text-xs text-surface-400">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {selectedMilestone.startDate} ~ {selectedMilestone.endDate}
                      </span>
                      <select
                        value={selectedMilestone.status}
                        onChange={(e) => updatePlanMilestone(plan.id, selectedMilestone.id, { status: e.target.value as PlanMilestone['status'] })}
                        className="text-xs bg-surface-800 border border-surface-700 rounded px-2 py-1 text-surface-200 focus:outline-none focus:border-brand-500/50"
                      >
                        <option value="pending">待开始</option>
                        <option value="active">进行中</option>
                        <option value="completed">已完成</option>
                        <option value="overdue">已逾期</option>
                      </select>
                    </div>
                  </div>

                  {milestoneIssues.length === 0 ? (
                    <p className="text-sm text-surface-500 text-center py-8">该里程碑暂无关联问题</p>
                  ) : (
                    <div className="space-y-2">
                      {milestoneIssues.map((issue) => {
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
                                <span className={`badge ${ISSUE_STATUS_MAP[issue.status]?.className ?? ''} text-[10px]`}>
                                  {ISSUE_STATUS_MAP[issue.status]?.label}
                                </span>
                                <span>{issue.projectName}</span>
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
                            <button
                              onClick={() => handleRemoveIssue(issue.id)}
                              className="flex-shrink-0 text-surface-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-surface-700/50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-lg mx-4 card-glow rounded-xl p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg text-surface-100">新建阶段里程碑</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-surface-400 hover:text-surface-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-surface-300 mb-1.5">阶段名称</label>
                <input
                  type="text"
                  value={newMilestone.name}
                  onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                  placeholder="输入阶段名称"
                  className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-surface-300 mb-1.5">阶段描述</label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  placeholder="描述该阶段的目标"
                  rows={3}
                  className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-surface-300 mb-1.5">开始日期</label>
                  <input
                    type="date"
                    value={newMilestone.startDate}
                    onChange={(e) => setNewMilestone({ ...newMilestone, startDate: e.target.value })}
                    className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-surface-300 mb-1.5">结束日期</label>
                  <input
                    type="date"
                    value={newMilestone.endDate}
                    onChange={(e) => setNewMilestone({ ...newMilestone, endDate: e.target.value })}
                    className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-surface-300 mb-1.5">状态</label>
                <select
                  value={newMilestone.status}
                  onChange={(e) => setNewMilestone({ ...newMilestone, status: e.target.value as PlanMilestone['status'] })}
                  className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
                >
                  <option value="pending">待开始</option>
                  <option value="active">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="overdue">已逾期</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-ghost text-sm">取消</button>
              <button
                onClick={handleCreateMilestone}
                disabled={!newMilestone.name.trim() || !newMilestone.startDate || !newMilestone.endDate}
                className="btn-primary text-sm disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                创建阶段
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-lg mx-4 card-glow rounded-xl p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg text-surface-100">编辑阶段里程碑</h2>
              <button onClick={() => setShowEditModal(false)} className="text-surface-400 hover:text-surface-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-surface-300 mb-1.5">阶段名称</label>
                <input
                  type="text"
                  value={editMilestone.name}
                  onChange={(e) => setEditMilestone({ ...editMilestone, name: e.target.value })}
                  placeholder="输入阶段名称"
                  className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-surface-300 mb-1.5">阶段描述</label>
                <textarea
                  value={editMilestone.description}
                  onChange={(e) => setEditMilestone({ ...editMilestone, description: e.target.value })}
                  placeholder="描述该阶段的目标"
                  rows={3}
                  className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-surface-300 mb-1.5">开始日期</label>
                  <input
                    type="date"
                    value={editMilestone.startDate}
                    onChange={(e) => setEditMilestone({ ...editMilestone, startDate: e.target.value })}
                    className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-surface-300 mb-1.5">结束日期</label>
                  <input
                    type="date"
                    value={editMilestone.endDate}
                    onChange={(e) => setEditMilestone({ ...editMilestone, endDate: e.target.value })}
                    className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="btn-ghost text-sm">取消</button>
              <button
                onClick={handleEditMilestone}
                disabled={!editMilestone.name.trim() || !editMilestone.startDate || !editMilestone.endDate}
                className="btn-primary text-sm disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showLinkIssuesModal && selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLinkIssuesModal(false)} />
          <div className="relative w-full max-w-lg mx-4 card-glow rounded-xl p-6 animate-fade-in-up max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-surface-100 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-brand-400" />
                关联问题
              </h2>
              <button onClick={() => setShowLinkIssuesModal(false)} className="text-surface-400 hover:text-surface-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 bg-surface-900 border border-surface-700/50 rounded-lg p-2">
              {availableIssues.length === 0 ? (
                <div className="text-center text-surface-500 text-sm py-8">没有可选的未解决问题</div>
              ) : (
                availableIssues.map((issue) => (
                  <label
                    key={issue.id}
                    className="flex items-center gap-2 px-2 py-2 rounded hover:bg-surface-700/50 cursor-pointer transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedIssueIds.includes(issue.id)
                          ? 'bg-brand-500 border-brand-500'
                          : 'border-surface-600'
                      }`}
                    >
                      {selectedIssueIds.includes(issue.id) && <Check className="w-3 h-3 text-surface-900" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedIssueIds.includes(issue.id)}
                      onChange={() => toggleIssueSelection(issue.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-surface-300 truncate block">{issue.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`badge-${issue.severity} text-[10px]`}>{severityLabel(issue.severity)}</span>
                        <span className={`badge ${ISSUE_STATUS_MAP[issue.status]?.className ?? ''} text-[10px]`}>
                          {ISSUE_STATUS_MAP[issue.status]?.label}
                        </span>
                        <span className="text-[10px] text-surface-500">{issue.projectName}</span>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-surface-500">已选择 {selectedIssueIds.length} 个问题</span>
              <div className="flex gap-3">
                <button onClick={() => setShowLinkIssuesModal(false)} className="btn-ghost text-sm">取消</button>
                <button
                  onClick={handleLinkIssues}
                  className="btn-primary text-sm disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
                >
                  <Link2 className="w-4 h-4" />
                  确认关联
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
