import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Radar, ListChecks, Settings, Target, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/', label: '项目总览', icon: LayoutDashboard },
  { to: '/scan', label: '质量扫描', icon: Radar },
  { to: '/issues', label: '问题列表', icon: ListChecks },
  { to: '/rules', label: '规则配置', icon: Settings },
  { to: '/plans', label: '改进计划', icon: Target },
  { to: '/dashboard', label: '团队看板', icon: BarChart3 },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-surface-900 border-r border-surface-700/50 flex flex-col z-50 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className={`flex items-center h-16 px-4 border-b border-surface-700/50 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center flex-shrink-0">
          <Radar className="w-5 h-5 text-brand-500" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-display font-bold text-sm text-surface-100 whitespace-nowrap">代码质量中心</h1>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-brand-500/10 text-brand-400'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-surface-500 group-hover:text-surface-300'}`} />
              {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
              {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-surface-700/50 text-surface-500 hover:text-surface-300 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
