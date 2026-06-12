import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, GitBranch, Bug, Shield, TestTube, ChevronDown, AlertTriangle, ArrowRight, Save, Layers, Trash2, Check, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { IssueCategory, RuleTemplate } from '@/types';

const CATEGORY_ICONS: Record<IssueCategory, typeof Copy> = {
  duplicate: Copy,
  complexity: GitBranch,
  defect: Bug,
  vulnerability: Shield,
  coverage: TestTube,
};

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  duplicate: '重复代码',
  complexity: '复杂度',
  defect: '缺陷风险',
  vulnerability: '依赖漏洞',
  coverage: '测试覆盖',
};

const THRESHOLD_RANGES: Record<IssueCategory, { min: number; max: number; step: number; unit: string }> = {
  duplicate: { min: 0, max: 30, step: 1, unit: '%' },
  complexity: { min: 1, max: 50, step: 1, unit: '' },
  defect: { min: 1, max: 30, step: 1, unit: '' },
  vulnerability: { min: 1, max: 20, step: 1, unit: '' },
  coverage: { min: 0, max: 100, step: 5, unit: '%' },
};

const SCAN_RESULT_KEY: Record<string, string> = {
  c1: 'duplicateCodeRate',
  c2: 'cyclomaticComplexity',
  c3: 'defectRiskCount',
  c4: 'dependencyVulnerabilities',
  c5: 'testCoverage',
};

export default function Rules() {
  const { projects, getOrCreateRuleConfig, scanRecords, issues, updateRuleConfig, ruleTemplates, saveRuleTemplate, applyRuleTemplate, deleteRuleTemplate } = useStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [applyTargetProjectId, setApplyTargetProjectId] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const navigate = useNavigate();

  const availableProjects = projects.filter(
    (p) => p.status === 'connected' || p.status === 'scanning'
  );

  const activeProjectId = selectedProjectId || availableProjects[0]?.id || '';
  const config = getOrCreateRuleConfig(activeProjectId);

  const latestScan = useMemo(() => scanRecords
    .filter((s) => s.projectId === activeProjectId && s.status === 'completed' && s.results)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0],
    [scanRecords, activeProjectId]
  );

  const isExceeding = (checkId: string, threshold: number): boolean => {
    if (!latestScan?.results) return false;
    const key = SCAN_RESULT_KEY[checkId] as keyof typeof latestScan.results;
    const actual = latestScan.results[key];
    if (key === 'testCoverage') return actual < threshold;
    return actual > threshold;
  };

  const getActualValue = (checkId: string): number | null => {
    if (!latestScan?.results) return null;
    const key = SCAN_RESULT_KEY[checkId] as keyof typeof latestScan.results;
    return latestScan.results[key] ?? null;
  };

  const goToIssues = (category: IssueCategory) => {
    navigate(`/issues?project=${activeProjectId}&category=${category}`);
  };

  const exceedingCount = config?.checks.filter((c) => c.enabled && isExceeding(c.id, c.threshold)).length ?? 0;

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleSaveTemplate = () => {
    if (!templateName.trim() || !activeProjectId) return;
    saveRuleTemplate(templateName.trim(), templateDescription.trim(), activeProjectId, activeProject?.name || '');
    setTemplateName('');
    setTemplateDescription('');
    setShowSaveModal(false);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate || !applyTargetProjectId) return;
    applyRuleTemplate(selectedTemplate.id, applyTargetProjectId);
    setSelectedTemplate(null);
    setApplyTargetProjectId('');
    setShowApplyModal(false);
  };

  const openApplyModal = (template: RuleTemplate) => {
    setSelectedTemplate(template);
    setApplyTargetProjectId('');
    setShowApplyModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-100">规则配置</h1>
          <p className="text-surface-400 text-sm mt-1">为项目配置质量检查规则和阈值</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`btn-secondary flex items-center gap-2 ${showTemplates ? 'bg-brand-500/15 border-brand-500/30 text-brand-400' : ''}`}
          >
            <Layers className="w-4 h-4" />
            规则模板
            {ruleTemplates.length > 0 && (
              <span className="bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded text-xs font-medium">
                {ruleTemplates.length}
              </span>
            )}
          </button>
          {activeProjectId && (
            <button
              onClick={() => {
                setTemplateName(`${activeProject?.name || '项目'}规则模板`);
                setTemplateDescription('');
                setShowSaveModal(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存为模板
            </button>
          )}
          <div className="relative">
            <select
              value={activeProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="appearance-none bg-surface-800 border border-surface-700/50 rounded-lg px-4 py-2.5 pr-10 text-sm text-surface-200 font-medium focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25 transition-all cursor-pointer"
            >
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {showTemplates && (
        <div className="card-glow rounded-xl p-5 border border-brand-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-surface-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-400" />
              规则模板库
            </h3>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-surface-400 hover:text-surface-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {ruleTemplates.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="w-10 h-10 text-surface-600 mx-auto mb-2" />
              <p className="text-surface-400 text-sm">暂无规则模板</p>
              <p className="text-surface-500 text-xs mt-1">点击「保存为模板」将当前项目规则保存为模板</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {ruleTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-surface-800/50 rounded-lg p-4 border border-surface-700/30 hover:border-surface-600/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-surface-100 text-sm">{template.name}</h4>
                        <span className="text-xs bg-surface-700/50 text-surface-400 px-1.5 py-0.5 rounded">
                          来自 {template.sourceProjectName}
                        </span>
                      </div>
                      {template.description && (
                        <p className="text-xs text-surface-500 mt-1">{template.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
                        <span>{template.checks.filter((c) => c.enabled).length}/{template.checks.length} 项已启用</span>
                        <span>创建于 {new Date(template.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => openApplyModal(template)}
                        className="text-xs bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        应用
                      </button>
                      <button
                        onClick={() => deleteRuleTemplate(template.id)}
                        className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        删除
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-surface-700/30">
                    {template.checks.map((check) => {
                      const Icon = CATEGORY_ICONS[check.category];
                      return (
                        <div
                          key={check.id}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                            check.enabled
                              ? 'bg-brand-500/10 text-brand-400'
                              : 'bg-surface-700/30 text-surface-500'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{check.name}</span>
                          {check.enabled && (
                            <span className="font-mono text-[10px] opacity-70">
                              ≤{check.threshold}{THRESHOLD_RANGES[check.category].unit}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {exceedingCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-400 text-sm">
                风险提示
              </h3>
              <p className="text-xs text-surface-400 mt-1">
                当前有 {exceedingCount} 项指标超过阈值，建议尽快处理相关问题。
              </p>
            </div>
            <button
              onClick={() => navigate(`/issues?project=${activeProjectId}&severity=high`)}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              查看问题
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {config ? (
        <div className="space-y-4">
          {config.checks.map((check) => {
            const Icon = CATEGORY_ICONS[check.category];
            const range = THRESHOLD_RANGES[check.category];
            const exceeded = check.enabled && isExceeding(check.id, check.threshold);
            const actualValue = getActualValue(check.id);

            return (
              <div
                key={check.id}
                className={`card-glow rounded-xl p-5 transition-all ${
                  exceeded ? 'border-red-500/30' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 ${check.enabled ? 'bg-brand-500/15' : 'bg-surface-700/50'}`}>
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${check.enabled ? 'text-brand-400' : 'text-surface-500'}`} />
                    </div>
                    <div>
                      <h3 className={`font-display font-semibold text-sm transition-colors duration-300 ${check.enabled ? 'text-surface-100' : 'text-surface-400'}`}>
                        {check.name}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => updateRuleConfig(activeProjectId, check.id, { enabled: !check.enabled })}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${check.enabled ? 'bg-brand-500' : 'bg-surface-600'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${check.enabled ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                {check.enabled && (
                  <div className="mt-4 pt-4 border-t border-surface-700/30">
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={range.min}
                        max={range.max}
                        step={range.step}
                        value={check.threshold}
                        onChange={(e) => updateRuleConfig(activeProjectId, check.id, { threshold: Number(e.target.value) })}
                        className="flex-1 h-1.5 rounded-full appearance-none bg-surface-700 cursor-pointer accent-[#06D6A0]"
                      />
                      <input
                        type="number"
                        min={range.min}
                        max={range.max}
                        value={check.threshold}
                        onChange={(e) => {
                          const val = Math.min(range.max, Math.max(range.min, Number(e.target.value)));
                          if (!isNaN(val)) {
                            updateRuleConfig(activeProjectId, check.id, { threshold: val });
                          }
                        }}
                        className={`w-20 px-3 py-1.5 rounded-lg border text-sm text-center font-mono focus:outline-none focus:ring-1 transition-colors ${
                          exceeded
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 focus:ring-red-500/50'
                            : 'bg-surface-800 border-surface-700/50 text-surface-200 focus:ring-brand-500/50'
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-surface-500">{check.description}</p>
                      {actualValue !== null && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-surface-500">当前值:</span>
                          <span
                            className={`text-xs font-mono font-medium ${
                              exceeded ? 'text-red-400' : 'text-brand-400'}`}
                          >
                            {actualValue % 1 !== 0 ? actualValue.toFixed(1) : actualValue}{range.unit}
                          </span>
                          {exceeded && (
                            <span className="text-xs text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              超出
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {exceeded && (
                      <button
                        onClick={() => goToIssues(check.category)}
                        className="mt-3 w-full py-2.5 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-medium hover:bg-red-500/10 hover:border-red-500/40 transition-colors flex items-center justify-center gap-1.5"
                      >
                        查看相关问题
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-glow rounded-xl p-12 text-center">
          <p className="text-surface-400">请选择一个已连接的项目</p>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />
          <div className="relative card-glow rounded-xl p-6 w-full max-w-md border border-surface-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-surface-100 text-lg">保存为规则模板</h3>
              <button onClick={() => setShowSaveModal(false)} className="text-surface-400 hover:text-surface-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-surface-300 mb-1.5">模板名称</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="输入模板名称"
                  className="w-full bg-surface-800 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25"
                />
              </div>

              <div>
                <label className="block text-sm text-surface-300 mb-1.5">模板描述</label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="可选：描述模板的适用场景"
                  rows={3}
                  className="w-full bg-surface-800 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25 resize-none"
                />
              </div>

              <div className="bg-surface-800/50 rounded-lg p-3">
                <p className="text-xs text-surface-400">
                  来源项目: <span className="text-surface-200 font-medium">{activeProject?.name}</span>
                </p>
                <p className="text-xs text-surface-500 mt-1">
                  将保存当前项目的 {config?.checks.filter((c) => c.enabled).length || 0} 项已启用规则配置
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  保存模板
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApplyModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowApplyModal(false)} />
          <div className="relative card-glow rounded-xl p-6 w-full max-w-md border border-surface-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-surface-100 text-lg">应用规则模板</h3>
              <button onClick={() => setShowApplyModal(false)} className="text-surface-400 hover:text-surface-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-surface-800/50 rounded-lg p-3">
                <p className="text-sm text-surface-200 font-medium">{selectedTemplate.name}</p>
                {selectedTemplate.description && (
                  <p className="text-xs text-surface-500 mt-1">{selectedTemplate.description}</p>
                )}
                <p className="text-xs text-surface-400 mt-2">
                  包含 {selectedTemplate.checks.filter((c) => c.enabled).length}/{selectedTemplate.checks.length} 项规则
                </p>
              </div>

              <div>
                <label className="block text-sm text-surface-300 mb-1.5">应用到项目</label>
                <div className="relative">
                  <select
                    value={applyTargetProjectId}
                    onChange={(e) => setApplyTargetProjectId(e.target.value)}
                    className="w-full appearance-none bg-surface-800 border border-surface-700/50 rounded-lg px-3 py-2 pr-10 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/25"
                  >
                    <option value="">选择目标项目</option>
                    {availableProjects
                      .filter((p) => p.id !== selectedTemplate.sourceProjectId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                </div>
                {availableProjects.filter((p) => p.id !== selectedTemplate.sourceProjectId).length === 0 && (
                  <p className="text-xs text-surface-500 mt-1">没有其他可用项目</p>
                )}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs text-amber-400">
                  注意：应用模板将覆盖目标项目的现有规则配置，此操作不可撤销。
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleApplyTemplate}
                  disabled={!applyTargetProjectId}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认应用
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
