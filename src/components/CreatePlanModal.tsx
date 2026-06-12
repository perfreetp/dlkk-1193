import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface CreatePlanModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreatePlanModal({ open, onClose }: CreatePlanModalProps) {
  const { issues, addPlan } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);

  const availableIssues = issues.filter(
    (issue) => issue.status !== 'resolved' && issue.status !== 'closed'
  );

  if (!open) return null;

  const toggleIssue = (issueId: string) => {
    setSelectedIssueIds((prev) =>
      prev.includes(issueId)
        ? prev.filter((id) => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || !startDate || !endDate) return;
    addPlan({
      name: name.trim(),
      description: description.trim(),
      startDate,
      endDate,
      status: 'active',
      issueIds: selectedIssueIds,
    });
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setSelectedIssueIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 card-glow rounded-xl p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg text-surface-100">创建改进计划</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-surface-300 mb-1.5">计划名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入计划名称"
              className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-surface-300 mb-1.5">目标描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述改进计划的目标"
              rows={3}
              className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-surface-300 mb-1.5">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-surface-300 mb-1.5">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2 text-surface-200 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-surface-300 mb-1.5">
              关联问题 <span className="text-surface-500">({selectedIssueIds.length} 已选)</span>
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1 bg-surface-900 border border-surface-700/50 rounded-lg p-2">
              {availableIssues.length === 0 ? (
                <div className="text-center text-surface-500 text-sm py-4">没有可选问题</div>
              ) : (
                availableIssues.map((issue) => (
                  <label
                    key={issue.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-700/50 cursor-pointer transition-colors"
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
                    <span className="text-sm text-surface-300 truncate">{issue.title}</span>
                    <span className={`badge-${issue.severity} ml-auto text-[10px]`}>{issue.severity}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn-ghost text-sm">取消</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !startDate || !endDate}
            className="btn-primary text-sm disabled:opacity-40 disabled:pointer-events-none"
          >
            创建计划
          </button>
        </div>
      </div>
    </div>
  );
}
