import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AppLayout } from '../components/layout';
import { useAuth } from '../hooks/useAuth';
import type { Session } from '../types';

const SESSIONS: Session[] = [
  { id: 's1', name: 'Stripe Payment API', base_url: 'api.stripe.com', source_type: 'HAR', status: 'completed', created_at: '2024-12-01T10:00:00Z', endpoints_count: 47, transactions_count: 1280, duration_ms: 3200, coverage: 94, tags: ['payments','prod'] },
  { id: 's2', name: 'Acme Internal v2', base_url: 'internal.acme.com', source_type: 'OpenAPI', status: 'parsing', created_at: '2024-12-01T09:30:00Z', endpoints_count: 23, transactions_count: 340, duration_ms: 1100, coverage: 71, tags: ['internal'] },
  { id: 's3', name: 'Auth Service', base_url: 'auth.acme.com', source_type: 'Live', status: 'completed', created_at: '2024-11-30T15:20:00Z', endpoints_count: 12, transactions_count: 892, duration_ms: 540, coverage: 100, tags: ['auth','critical'] },
  { id: 's4', name: 'Reporting API', base_url: 'reports.acme.com', source_type: 'Postman', status: 'failed', created_at: '2024-11-29T08:00:00Z', endpoints_count: 0, transactions_count: 0, duration_ms: 0, coverage: 0, tags: [] },
];

const ACTIVITY = [
  { day: 'Mon', sessions: 3, issues: 1 },
  { day: 'Tue', sessions: 7, issues: 4 },
  { day: 'Wed', sessions: 5, issues: 2 },
  { day: 'Thu', sessions: 11, issues: 6 },
  { day: 'Fri', sessions: 8, issues: 3 },
  { day: 'Sat', sessions: 2, issues: 1 },
  { day: 'Sun', sessions: 4, issues: 2 },
];

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  parsing:   'bg-blue-50 text-blue-700 border-blue-100',
  pending:   'bg-amber-50 text-amber-700 border-amber-100',
  failed:    'bg-rose-50 text-rose-700 border-rose-100',
};

const SOURCE_STYLE: Record<string, string> = {
  HAR:     'bg-indigo-50 text-indigo-700',
  OpenAPI: 'bg-violet-50 text-violet-700',
  Postman: 'bg-orange-50 text-orange-700',
  Live:    'bg-emerald-50 text-emerald-700',
};

function StatCard({ label, value, delta, color }: { label: string; value: string; delta?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {delta && <p className="text-xs text-slate-400 mt-1">{delta}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const [activeTab, setActiveTab] = useState<'sessions' | 'security'>('sessions');

  return (
    <AppLayout>
      <div className="space-y-6 stagger">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-sm text-slate-500 mt-0.5">Here&apos;s what&apos;s happening in your workspace today.</p>
          </div>
          <Link
            to="/sessions"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200/60 transition-all"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Session
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Sessions"    value="1,284"  delta="↑ 12% this week"   color="text-indigo-600" />
          <StatCard label="Endpoints Found"   value="38.4k"  delta="across all sessions" color="text-violet-600" />
          <StatCard label="Security Issues"   value="97"     delta="14 critical"          color="text-rose-600"   />
          <StatCard label="AI Coverage"       value="88%"    delta="avg across sessions"  color="text-emerald-600"/>
        </div>

        {/* Chart + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Weekly Activity</h2>
                <p className="text-xs text-slate-400 mt-0.5">Sessions analysed this week</p>
              </div>
              <div className="flex gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" />Sessions</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />Issues</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={ACTIVITY} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gIssues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={2} fill="url(#gSessions)" />
                <Area type="monotone" dataKey="issues"   stroke="#f43f5e" strokeWidth={2} fill="url(#gIssues)"   />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Source breakdown</h2>
            {[
              { label: 'HAR files', pct: 52, color: 'bg-indigo-400' },
              { label: 'OpenAPI',   pct: 28, color: 'bg-violet-400' },
              { label: 'Live capture', pct: 14, color: 'bg-emerald-400' },
              { label: 'Postman',   pct: 6,  color: 'bg-orange-400' },
            ].map(({ label, pct, color }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{label}</span><span className="font-medium">{pct}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent sessions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex gap-1">
              {(['sessions', 'security'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tab === 'sessions' ? 'Recent Sessions' : 'Security Alerts'}
                </button>
              ))}
            </div>
            <Link to="/sessions" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View all →</Link>
          </div>

          {activeTab === 'sessions' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 font-medium">
                  <th className="text-left px-5 py-3">Session</th>
                  <th className="text-left px-3 py-3 hidden md:table-cell">Source</th>
                  <th className="text-left px-3 py-3 hidden lg:table-cell">Endpoints</th>
                  <th className="text-left px-3 py-3 hidden lg:table-cell">Coverage</th>
                  <th className="text-left px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {SESSIONS.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/60 cursor-pointer transition-colors group">
                    <td className="px-5 py-3.5">
                      <Link to={`/sessions/${s.id}`} className="group-hover:text-indigo-600 font-medium text-slate-800 transition-colors block">{s.name}</Link>
                      <span className="text-xs text-slate-400">{s.base_url}</span>
                    </td>
                    <td className="px-3 py-3.5 hidden md:table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${SOURCE_STYLE[s.source_type]}`}>{s.source_type}</span>
                    </td>
                    <td className="px-3 py-3.5 hidden lg:table-cell text-slate-700">{s.endpoints_count}</td>
                    <td className="px-3 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-20">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${s.coverage}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{s.coverage}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'security' && (
            <div className="divide-y divide-slate-50">
              {[
                { severity: 'critical', title: 'Broken Object Level Auth', endpoint: 'GET /api/users/{id}', session: 'Stripe Payment API' },
                { severity: 'high',     title: 'Missing Rate Limiting',    endpoint: 'POST /auth/login',    session: 'Auth Service'        },
                { severity: 'medium',   title: 'Verbose Error Messages',   endpoint: 'GET /api/orders',     session: 'Acme Internal v2'    },
              ].map(({ severity, title, endpoint, session }) => (
                <div key={title} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${severity === 'critical' ? 'bg-rose-500' : severity === 'high' ? 'bg-orange-500' : 'bg-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{title}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{endpoint}</p>
                  </div>
                  <span className="text-xs text-slate-400 hidden md:block">{session}</span>
                  <span className={`text-xs font-bold uppercase ${severity === 'critical' ? 'text-rose-600' : severity === 'high' ? 'text-orange-600' : 'text-amber-600'}`}>{severity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
