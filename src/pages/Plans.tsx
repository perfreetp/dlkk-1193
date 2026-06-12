import { useState } from 'react';
import { Plus, Calendar, ChevronDown, ChevronUp, CheckCircle2, Circle, Target } from 'lucide-react';
import { useStore } from '@/store/useStore';
import CreatePlanModal from '@/components/CreatePlanModal';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: '进行中', className: 'bg-brand-500/15 text-brand-500 border border-brand-500/30' },
  completed: { label: '已完成', className: 'bg-brand-400/15 text-brand-400 border border-brand-400/30' },
  overdue: { label: '已逾期', className: 'bg-red-400/15 text-red-400 border border-red-400/30' },
};

export default function Plans() {
  const { plans, issues, completePlanIssue } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const toggleExpand = (planId: string) => {
    setExpandedPlanId((prev) => (prev === planId ? null : planId));
  };

  const getIssue = (id: string) => issues.find((i) => i.id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-surface-100">改进计划</h1>
          <p className="text-surface-400 text-sm mt-1">管理和跟踪代码质量改进计划</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          创建计划
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="card-glow rounded-xl p-12 text-center">
          <Target className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400">暂无改进计划</p>
          <p className="text-surface-500 text-sm mt-1">点击「创建计划」开始制定改进方案</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const completedCount = plan.completedIssueIds.length;
            const totalCount = plan.issueIds.length;
            const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const status = STATUS_MAP[plan.status];
            const isExpanded = expandedPlanId === plan.id;

            return (
              <div key={plan.id} className="card-glow rounded-xl overflow-hidden">
                <div className="p-5 cursor-pointer" onClick={() => toggleExpand(plan.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-display font-semibold text-surface-100">{plan.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <p className="text-surface-400 text-sm mb-4 line-clamp-2">{plan.description}</p>

                  <div className="flex items-center gap-4 text-xs text-surface-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {plan.startDate} ~ {plan.endDate}
                    </span>
                    <span>{completedCount}/{totalCount} 问题</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-brand-400 tabular-nums">{percentage}%</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-surface-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-surface-500" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-surface-700/50 px-5 py-3">
                    {plan.issueIds.length === 0 ? (
                      <p className="text-surface-500 text-sm text-center py-2">暂无关联问题</p>
                    ) : (
                      <div className="space-y-1">
                        {plan.issueIds.map((issueId) => {
                          const issue = getIssue(issueId);
                          if (!issue) return null;
                          const isCompleted = plan.completedIssueIds.includes(issueId);

                          return (
                            <div
                              key={issueId}
                              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-700/30 transition-colors"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isCompleted) completePlanIssue(plan.id, issueId);
                                }}
                                className="flex-shrink-0"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-brand-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-surface-600 hover:text-surface-400 transition-colors" />
                                )}
                              </button>
                              <span className={`text-sm flex-1 ${isCompleted ? 'line-through text-surface-500' : 'text-surface-300'}`}>
                                {issue.title}
                              </span>
                              <span className={`badge-${issue.severity} text-[10px]`}>
                                {issue.severity}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreatePlanModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
