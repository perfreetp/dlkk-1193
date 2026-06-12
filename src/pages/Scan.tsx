import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { GitMerge, Terminal, BarChart3 } from 'lucide-react';
import RepoAccessPanel from '@/components/scan/RepoAccessPanel';
import ScanConsolePanel from '@/components/scan/ScanConsolePanel';
import ScanResultsPanel from '@/components/scan/ScanResultsPanel';
import { useStore } from '@/store/useStore';

const TABS = [
  { key: 'repo', label: '仓库接入', icon: GitMerge },
  { key: 'console', label: '扫描控制台', icon: Terminal },
  { key: 'results', label: '扫描结果', icon: BarChart3 },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function Scan() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>((searchParams.get('tab') as TabKey) || 'repo');
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get('project') || '');
  const { projects } = useStore();

  const location = useLocation();

  useEffect(() => {
    const tab = searchParams.get('tab') as TabKey;
    if (tab && (tab === 'repo' || tab === 'console' || tab === 'results')) {
      setActiveTab(tab);
    }
    const proj = searchParams.get('project');
    if (proj) {
      setSelectedProjectId(proj);
    }
  }, [location.search]);

  useEffect(() => {
    const params: Record<string, string> = {};
    params.tab = activeTab;
    if (selectedProjectId && activeTab !== 'repo') params.project = selectedProjectId;
    setSearchParams(params, { replace: true });
  }, [activeTab, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const handleScanComplete = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveTab('results');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-100">质量扫描</h1>
        <p className="text-surface-400 text-sm mt-1">管理仓库接入、执行代码扫描、查看扫描结果</p>
      </div>

      <div className="flex items-center gap-1 bg-surface-800/60 rounded-xl p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500/15 text-brand-400 shadow-sm'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div key={activeTab} className="animate-fade-in-up">
        {activeTab === 'repo' && (
          <RepoAccessPanel onGoToConsole={(projectId) => {
            if (projectId) setSelectedProjectId(projectId);
            setActiveTab('console');
          }} />
        )}
        {activeTab === 'console' && (
          <ScanConsolePanel
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            onScanComplete={handleScanComplete}
          />
        )}
        {activeTab === 'results' && (
          <ScanResultsPanel
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            onGoToConsole={() => setActiveTab('console')}
          />
        )}
      </div>
    </div>
  );
}
