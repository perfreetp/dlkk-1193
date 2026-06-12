import { useState } from 'react';
import { GitMerge, Terminal, BarChart3 } from 'lucide-react';
import RepoAccessPanel from '@/components/scan/RepoAccessPanel';
import ScanConsolePanel from '@/components/scan/ScanConsolePanel';
import ScanResultsPanel from '@/components/scan/ScanResultsPanel';

const TABS = [
  { key: 'repo', label: '仓库接入', icon: GitMerge },
  { key: 'console', label: '扫描控制台', icon: Terminal },
  { key: 'results', label: '扫描结果', icon: BarChart3 },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function Scan() {
  const [activeTab, setActiveTab] = useState<TabKey>('repo');

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

      <div className="animate-fade-in-up">
        {activeTab === 'repo' && <RepoAccessPanel />}
        {activeTab === 'console' && <ScanConsolePanel />}
        {activeTab === 'results' && <ScanResultsPanel />}
      </div>
    </div>
  );
}
