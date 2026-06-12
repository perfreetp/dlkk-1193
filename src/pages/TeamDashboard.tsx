import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Trophy, TrendingUp, TrendingDown } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-surface-400 text-xs mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name === 'value' && entry.color === '#06D6A0' ? '质量评分' : '问题数量'}：{entry.value}
        </p>
      ))}
    </div>
  );
};

const medalIcons = ['🥇', '🥈', '🥉'];

function getScoreColor(score: number) {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number) {
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-amber-400';
  return 'text-red-400';
}

export default function TeamDashboard() {
  const { qualityTrend, issueTrend, teamRankings, issues } = useStore();
  const navigate = useNavigate();

  const criticalIssues = issues.filter(
    (i) => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed'
  );

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-surface-100">团队看板</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            <h2 className="font-display text-lg font-semibold text-surface-200">质量评分趋势</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={qualityTrend}>
              <defs>
                <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06D6A0" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06D6A0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#1E293B' }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#1E293B' }} domain={[60, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#06D6A0" strokeWidth={2} fill="url(#qualityGrad)" dot={{ r: 3, fill: '#06D6A0', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#06D6A0', stroke: '#0F172A', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-glow rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-blue-400" />
            <h2 className="font-display text-lg font-semibold text-surface-200">问题数量趋势</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={issueTrend}>
              <defs>
                <linearGradient id="issueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#1E293B' }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#1E293B' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fill="url(#issueGrad)" dot={{ r: 3, fill: '#3B82F6', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#3B82F6', stroke: '#0F172A', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-glow rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Trophy className="w-5 h-5 text-brand-500" />
          <h2 className="font-display text-lg font-semibold text-surface-200">团队排行榜</h2>
        </div>
        <div className="space-y-3">
          {teamRankings.map((member, index) => (
            <div
              key={member.member}
              className="flex items-center gap-4 bg-surface-900/50 rounded-lg px-4 py-3 hover:bg-surface-700/30 transition-colors"
            >
              <div className="w-8 text-center font-display font-bold text-surface-400">
                {index < 3 ? <span className="text-lg">{medalIcons[index]}</span> : <span>{index + 1}</span>}
              </div>
              <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-semibold flex-shrink-0">
                {member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-surface-200 font-medium text-sm">{member.member}</span>
                  <span className={`text-sm font-display font-bold ${getScoreTextColor(member.qualityScore)}`}>
                    {member.qualityScore}
                  </span>
                  <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getScoreColor(member.qualityScore)} transition-all`}
                      style={{ width: `${member.qualityScore}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-5 text-xs text-surface-400 flex-shrink-0">
                <div className="text-center">
                  <div className="text-emerald-400 font-display font-semibold text-sm">{member.resolvedCount}</div>
                  <div>已修复</div>
                </div>
                <div className="text-center">
                  <div className="text-amber-400 font-display font-semibold text-sm">{member.openIssueCount}</div>
                  <div>未处理</div>
                </div>
                <div className="text-center">
                  <div className="text-surface-300 font-display font-semibold text-sm">{member.avgResolutionDays}</div>
                  <div>平均天</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-red-500/30 rounded-xl p-5 bg-surface-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h2 className="font-display text-lg font-semibold text-red-400">未处理严重风险</h2>
          <span className="ml-auto badge-critical">{criticalIssues.length} 项</span>
        </div>
        {criticalIssues.length === 0 ? (
          <p className="text-surface-500 text-sm py-4 text-center">暂无未处理的严重风险</p>
        ) : (
          <div className="space-y-3">
            {criticalIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() => navigate('/issues')}
                className="border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3 cursor-pointer hover:bg-red-500/10 hover:border-red-500/40 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-surface-200 text-sm font-medium truncate">{issue.title}</p>
                    <p className="text-surface-500 text-xs mt-1">{issue.projectName}</p>
                  </div>
                  <span className="badge-critical flex-shrink-0">严重</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
