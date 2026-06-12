import { useState, useEffect } from 'react';
import { X, FileCode, User, Calendar, MessageSquare, Save } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Issue } from '@/types';

interface IssueDrawerProps {
  issue: Issue | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_MAP: Record<string, string> = {
  open: '待处理',
  assigned: '已分派',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

const SEVERITY_MAP: Record<string, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
};

export default function IssueDrawer({ issue, open, onClose }: IssueDrawerProps) {
  const { teamMembers, updateIssue } = useStore();
  const [assignee, setAssignee] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [resolution, setResolution] = useState<string>('');

  useEffect(() => {
    if (issue) {
      setAssignee(issue.assignee ?? '');
      setDueDate(issue.dueDate ?? '');
      setResolution(issue.resolution ?? '');
    }
  }, [issue]);

  if (!open || !issue) return null;

  const handleSave = () => {
    const updates: Partial<Issue> = {};
    if (assignee !== (issue.assignee ?? '')) {
      updates.assignee = assignee || null;
      if (assignee && issue.status === 'open') updates.status = 'assigned';
    }
    if (dueDate !== (issue.dueDate ?? '')) updates.dueDate = dueDate || null;
    if (resolution !== (issue.resolution ?? '')) {
      updates.resolution = resolution || null;
      if (resolution && issue.status !== 'resolved' && issue.status !== 'closed') {
        updates.status = 'resolved';
      }
    }
    if (Object.keys(updates).length > 0) updateIssue(issue.id, updates);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[480px] bg-surface-900 border-l border-surface-700/50 z-50 animate-slide-in-right overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-surface-700/50">
          <h2 className="font-display font-bold text-lg text-surface-100">问题详情</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-surface-100 font-semibold text-base mb-2">{issue.title}</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className={`badge-${issue.severity}`}>{SEVERITY_MAP[issue.severity]}</span>
              <span className="badge bg-surface-700/50 text-surface-300 border border-surface-600/50">
                {STATUS_MAP[issue.status]}
              </span>
            </div>
            <p className="text-surface-400 text-sm leading-relaxed">{issue.description}</p>
          </div>

          <div className="card-glow rounded-lg p-4">
            <div className="flex items-start gap-2">
              <FileCode className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-mono text-xs text-brand-400">{issue.filePath}</p>
                <p className="text-surface-500 text-xs mt-1">
                  行 {issue.lineStart}{issue.lineEnd !== issue.lineStart ? ` - ${issue.lineEnd}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-surface-300 mb-2">
                <User className="w-4 h-4" />
                分派处理人
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full bg-surface-800 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 transition-colors"
              >
                <option value="">未分派</option>
                {teamMembers.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-surface-300 mb-2">
                <Calendar className="w-4 h-4" />
                截止时间
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-surface-800 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-surface-300 mb-2">
                <MessageSquare className="w-4 h-4" />
                修复说明
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
                placeholder="记录修复说明..."
                className="w-full bg-surface-800 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
              />
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary w-full flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </>
  );
}
