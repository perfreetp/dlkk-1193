import { useState } from 'react';
import { X, Check, Trash2, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { PlanMilestone } from '@/types';

interface CreatePlanModalProps {
  open: boolean;
  onClose: () => void;
}

interface NewMilestoneForm {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export default function CreatePlanModal({ open, onClose }: CreatePlanModalProps) {
  const { issues, addPlan } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<PlanMilestone[]>([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState<NewMilestoneForm>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

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

  const resetForm = () => {
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setSelectedIssueIds([]);
    setMilestones([]);
    setShowMilestoneForm(false);
    setNewMilestone({ name: '', description: '', startDate: '', endDate: '' });
  };

  const handleAddMilestone = () => {
    if (!newMilestone.name.trim() || !newMilestone.startDate || !newMilestone.endDate) return;
    const milestone: PlanMilestone = {
      id: Date.now().toString(),
      name: newMilestone.name.trim(),
      description: newMilestone.description.trim(),
      startDate: newMilestone.startDate,
      endDate: newMilestone.endDate,
      issueIds: [],
      status: 'pending',
    };
    setMilestones((prev) => [...prev, milestone]);
    setNewMilestone({ name: '', description: '', startDate: '', endDate: '' });
    setShowMilestoneForm(false);
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
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
      milestones,
    });
    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative w-full max-w-lg mx-4 card-glow rounded-xl p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg text-surface-100">创建改进计划</h2>
          <button onClick={handleCancel} className="text-surface-400 hover:text-surface-200 transition-colors">
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm text-surface-300">
                阶段里程碑 <span className="text-surface-500">({milestones.length} 已添加)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowMilestoneForm(true)}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加阶段
              </button>
            </div>

            <div className="space-y-2">
              {milestones.length > 0 && (
                <div className="space-y-1.5">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-3 bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-surface-200 font-medium truncate">{milestone.name}</div>
                        <div className="text-xs text-surface-500 mt-0.5">
                          {milestone.startDate} ~ {milestone.endDate}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        className="text-surface-500 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showMilestoneForm && (
                <div className="bg-surface-900 border border-brand-500/30 rounded-lg p-3 space-y-3">
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">阶段名称</label>
                    <input
                      type="text"
                      value={newMilestone.name}
                      onChange={(e) => setNewMilestone((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="输入阶段名称"
                      className="w-full bg-surface-800 border border-surface-700/50 rounded-md px-2.5 py-1.5 text-surface-200 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-surface-400 mb-1">阶段描述</label>
                    <textarea
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="描述本阶段目标"
                      rows={2}
                      className="w-full bg-surface-800 border border-surface-700/50 rounded-md px-2.5 py-1.5 text-surface-200 text-sm placeholder-surface-500 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-surface-400 mb-1">开始日期</label>
                      <input
                        type="date"
                        value={newMilestone.startDate}
                        onChange={(e) => setNewMilestone((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="w-full bg-surface-800 border border-surface-700/50 rounded-md px-2.5 py-1.5 text-surface-200 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-surface-400 mb-1">结束日期</label>
                      <input
                        type="date"
                        value={newMilestone.endDate}
                        onChange={(e) => setNewMilestone((prev) => ({ ...prev, endDate: e.target.value }))}
                        className="w-full bg-surface-800 border border-surface-700/50 rounded-md px-2.5 py-1.5 text-surface-200 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMilestoneForm(false);
                        setNewMilestone({ name: '', description: '', startDate: '', endDate: '' });
                      }}
                      className="btn-ghost text-xs px-3 py-1.5"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      disabled={!newMilestone.name.trim() || !newMilestone.startDate || !newMilestone.endDate}
                      className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      确认添加
                    </button>
                  </div>
                </div>
              )}

              {milestones.length === 0 && !showMilestoneForm && (
                <div className="bg-surface-900 border border-dashed border-surface-700/50 rounded-lg py-6 text-center">
                  <p className="text-sm text-surface-500">暂无阶段，点击上方"添加阶段"按钮创建</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={handleCancel} className="btn-ghost text-sm">取消</button>
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
