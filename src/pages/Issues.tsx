import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, ChevronLeft, ChevronRight, X, ListChecks } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Issue, SeverityLevel } from '@/types';
import IssueDrawer from '@/components/IssueDrawer';

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

const CATEGORY_MAP: Record<string, string> = {
  duplicate: '重复代码',
  complexity: '复杂度',
  defect: '缺陷风险',
  vulnerability: '依赖漏洞',
  coverage: '测试覆盖',
};

const SEVERITY_OPTIONS: { value: SeverityLevel; label: string }[] = [
  { value: 'critical', label: '严重' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
];

const PAGE_SIZE = 10;

export default function Issues() {
  const { issues, projects, teamMembers } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlProject = searchParams.get('project') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlSeverity = searchParams.get('severity') || '';
  const urlId = searchParams.get('id') || '';

  const [projectFilter, setProjectFilter] = useState(urlProject);
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState(urlSeverity);
  const [categoryFilter, setCategoryFilter] = useState(urlCategory);
  const [filePathFilter, setFilePathFilter] = useState('');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    setProjectFilter(urlProject);
    setSeverityFilter(urlSeverity);
    setCategoryFilter(urlCategory);
    setPage(1);
  }, [urlProject, urlSeverity, urlCategory]);

  useEffect(() => {
    if (urlId) {
      const issue = issues.find((i) => i.id === urlId);
      if (issue) {
        setSelectedIssue(issue);
        setDrawerOpen(true);
      }
    }
  }, [urlId, issues]);

  const updateUrlParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (projectFilter && issue.projectId !== projectFilter) return false;
      if (assigneeFilter && issue.assignee !== assigneeFilter) return false;
      if (severityFilter && issue.severity !== severityFilter) return false;
      if (categoryFilter && issue.category !== categoryFilter) return false;
      if (filePathFilter && !issue.filePath.toLowerCase().includes(filePathFilter.toLowerCase())) return false;
      return true;
    });
  }, [issues, projectFilter, assigneeFilter, severityFilter, categoryFilter, filePathFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeFilters = [
    {
      key: 'project',
      label: projectFilter ? projects.find((p) => p.id === projectFilter)?.name ?? '' : '',
      clear: () => { setProjectFilter(''); updateUrlParam('project', ''); setPage(1); },
    },
    {
      key: 'category',
      label: categoryFilter ? `分类: ${CATEGORY_MAP[categoryFilter] ?? categoryFilter}` : '',
      clear: () => { setCategoryFilter(''); updateUrlParam('category', ''); setPage(1); },
    },
    {
      key: 'assignee',
      label: assigneeFilter ? `负责人: ${assigneeFilter}` : '',
      clear: () => { setAssigneeFilter(''); setPage(1); },
    },
    {
      key: 'severity',
      label: severityFilter ? `级别: ${SEVERITY_MAP[severityFilter]}` : '',
      clear: () => { setSeverityFilter(''); updateUrlParam('severity', ''); setPage(1); },
    },
    {
      key: 'filePath',
      label: filePathFilter ? `路径: ${filePathFilter}` : '',
      clear: () => { setFilePathFilter(''); setPage(1); },
    },
  ].filter((f) => f.label);

  const openDrawer = (issue: Issue) => {
    setSelectedIssue(issue);
    setDrawerOpen(true);
    updateUrlParam('id', issue.id);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedIssue(null);
    updateUrlParam('id', '');
  };

  const selectCls =
    'bg-surface-800 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-200 focus:outline-none focus:border-brand-500/50 transition-colors appearance-none cursor-pointer';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
          <ListChecks className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-surface-100">问题列表</h1>
          <p className="text-surface-500 text-sm">管理和跟踪代码质量问题</p>
        </div>
      </div>

      <div className="card-glow rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-surface-500" />
          <span className="text-sm text-surface-400 font-medium">筛选条件</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={projectFilter}
            onChange={(e) => { setProjectFilter(e.target.value); updateUrlParam('project', e.target.value); setPage(1); }}
            className={selectCls}
          >
            <option value="">全部项目</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); updateUrlParam('category', e.target.value); setPage(1); }}
            className={selectCls}
          >
            <option value="">全部分类</option>
            {Object.entries(CATEGORY_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => { setAssigneeFilter(e.target.value); setPage(1); }}
            className={selectCls}
          >
            <option value="">全部负责人</option>
            {teamMembers.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); updateUrlParam('severity', e.target.value); setPage(1); }}
            className={selectCls}
          >
            <option value="">全部级别</option>
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              value={filePathFilter}
              onChange={(e) => { setFilePathFilter(e.target.value); setPage(1); }}
              placeholder="搜索文件路径..."
              className="w-full bg-surface-800 border border-surface-700/50 rounded-lg pl-9 pr-3 py-2 text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-surface-700/30">
            {activeFilters.map((f) => (
              <span
                key={f.key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-400 text-xs font-medium border border-brand-500/20"
              >
                {f.label}
                <button onClick={f.clear} className="hover:text-brand-300 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => {
                setProjectFilter('');
                setAssigneeFilter('');
                setSeverityFilter('');
                setCategoryFilter('');
                setFilePathFilter('');
                setPage(1);
                setSearchParams({});
              }}
              className="text-xs text-surface-500 hover:text-surface-300 transition-colors ml-1"
            >
              清除全部
            </button>
          </div>
        )}
      </div>

      <div className="card-glow rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700/50">
                <th className="text-left px-4 py-3 text-surface-400 font-medium">问题描述</th>
                <th className="text-left px-4 py-3 text-surface-400 font-medium">分类</th>
                <th className="text-left px-4 py-3 text-surface-400 font-medium">所属项目</th>
                <th className="text-left px-4 py-3 text-surface-400 font-medium">文件位置</th>
                <th className="text-left px-4 py-3 text-surface-400 font-medium">严重级别</th>
                <th className="text-left px-4 py-3 text-surface-400 font-medium">状态</th>
                <th className="text-left px-4 py-3 text-surface-400 font-medium">处理人</th>
                <th className="text-left px-4 py-3 text-surface-400 font-medium">截止时间</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((issue, idx) => (
                <tr
                  key={issue.id}
                  onClick={() => openDrawer(issue)}
                  className={`border-b border-surface-700/30 cursor-pointer transition-colors hover:bg-surface-800/60 ${
                    idx % 2 === 0 ? 'bg-surface-800/20' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="text-surface-100 font-medium">{issue.title}</span>
                  </td>
                  <td className="px-4 py-3 text-surface-400">{CATEGORY_MAP[issue.category] ?? issue.category}</td>
                  <td className="px-4 py-3 text-surface-400">{issue.projectName}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-brand-400">{issue.filePath}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge-${issue.severity}`}>{SEVERITY_MAP[issue.severity]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-surface-700/50 text-surface-300 border border-surface-600/50">
                      {STATUS_MAP[issue.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-surface-400">{issue.assignee ?? '-'}</td>
                  <td className="px-4 py-3 text-surface-400">{issue.dueDate ?? '-'}</td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-surface-500">
                    暂无匹配的问题记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-700/50">
            <span className="text-sm text-surface-500">
              共 {filtered.length} 条记录，第 {currentPage}/{totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  typeof p === 'string' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-surface-600">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                        p === currentPage
                          ? 'bg-brand-500/20 text-brand-400 font-medium'
                          : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700/50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-700/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <IssueDrawer issue={selectedIssue} open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}
