import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../components/layout';
import type { Session, SourceType, SessionStatus } from '../types';

const SESSIONS: Session[] = [
  { id: 's1', name: 'Stripe Payment API',   base_url: 'api.stripe.com',       source_type: 'HAR',     status: 'completed', created_at: '2024-12-01T10:00:00Z', endpoints_count: 47,  transactions_count: 1280, duration_ms: 3200, coverage: 94, tags: ['payments','prod']   },
  { id: 's2', name: 'Acme Internal v2',     base_url: 'internal.acme.com',    source_type: 'OpenAPI', status: 'parsing',   created_at: '2024-12-01T09:30:00Z', endpoints_count: 23,  transactions_count: 340,  duration_ms: 1100, coverage: 71, tags: ['internal']           },
  { id: 's3', name: 'Auth Service',         base_url: 'auth.acme.com',        source_type: 'Live',    status: 'completed', created_at: '2024-11-30T15:20:00Z', endpoints_count: 12,  transactions_count: 892,  duration_ms: 540,  coverage: 100, tags: ['auth','critical']   },
  { id: 's4', name: 'Reporting API',        base_url: 'reports.acme.com',     source_type: 'Postman', status: 'failed',    created_at: '2024-11-29T08:00:00Z', endpoints_count: 0,   transactions_count: 0,    duration_ms: 0,    coverage: 0,   tags: []                    },
  { id: 's5', name: 'Mobile Gateway v3',    base_url: 'api.mobile.acme.com',  source_type: 'HAR',     status: 'completed', created_at: '2024-11-28T12:00:00Z', endpoints_count: 61,  transactions_count: 4200, duration_ms: 7800, coverage: 87, tags: ['mobile','prod']     },
  { id: 's6', name: 'Notifications API',    base_url: 'notify.acme.com',      source_type: 'OpenAPI', status: 'pending',   created_at: '2024-11-27T16:30:00Z', endpoints_count: 8,   transactions_count: 0,    duration_ms: 0,    coverage: 0,   tags: ['notifications']     },
  { id: 's7', name: 'Partner OAuth Flow',   base_url: 'oauth.partner.io',     source_type: 'HAR',     status: 'completed', created_at: '2024-11-26T09:00:00Z', endpoints_count: 6,   transactions_count: 234,  duration_ms: 420,  coverage: 100, tags: ['oauth','partner']   },
];

const STATUS_STYLE: Record<SessionStatus, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  parsing:   'bg-blue-50 text-blue-700 border-blue-100',
  pending:   'bg-amber-50 text-amber-700 border-amber-100',
  failed:    'bg-rose-50 text-rose-700 border-rose-100',
};

const SOURCE_STYLE: Record<SourceType, string> = {
  HAR:     'bg-indigo-50 text-indigo-700',
  OpenAPI: 'bg-violet-50 text-violet-700',
  Postman: 'bg-orange-50 text-orange-700',
  Live:    'bg-emerald-50 text-emerald-700',
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const h  = Math.floor(ms / 3_600_000);
  const d  = Math.floor(h / 24);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function fmtDuration(ms: number) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function SessionPage() {
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState<SessionStatus | 'all'>('all');
  const [source, setSource]     = useState<SourceType | 'all'>('all');
  const [view, setView]         = useState<'table' | 'grid'>('table');

  const filtered = SESSIONS.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q) || s.base_url.toLowerCase().includes(q);
    const matchS = status === 'all' || s.status === status;
    const matchT = source === 'all' || s.source_type === source;
    return matchQ && matchS && matchT;
  });

  return (
    <AppLayout title="Sessions">
      <div className="space-y-5 stagger">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Sessions</h1>
            <p className="text-sm text-slate-500 mt-0.5">{SESSIONS.length} sessions in workspace</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200/60 transition-all">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Session
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sessions…"
              className="w-full pl-9 pr-4 h-9 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value as SessionStatus | 'all')} className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 cursor-pointer">
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="parsing">Parsing</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select value={source} onChange={e => setSource(e.target.value as SourceType | 'all')} className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 cursor-pointer">
            <option value="all">All sources</option>
            <option value="HAR">HAR</option>
            <option value="OpenAPI">OpenAPI</option>
            <option value="Postman">Postman</option>
            <option value="Live">Live</option>
          </select>
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
            {(['table', 'grid'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`p-1.5 rounded-lg transition-colors ${view === v ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                {v === 'table' ? (
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                ) : (
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {view === 'table' ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 font-medium border-b border-slate-100">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-3 py-3 hidden md:table-cell">Source</th>
                  <th className="text-left px-3 py-3 hidden lg:table-cell">Endpoints</th>
                  <th className="text-left px-3 py-3 hidden lg:table-cell">Transactions</th>
                  <th className="text-left px-3 py-3 hidden xl:table-cell">Coverage</th>
                  <th className="text-left px-3 py-3 hidden sm:table-cell">Duration</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-left px-3 py-3 hidden md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/70 cursor-pointer group transition-colors">
                    <td className="px-5 py-3.5">
                      <Link to={`/sessions/${s.id}`} className="block">
                        <p className="font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">{s.name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{s.base_url}</p>
                      </Link>
                      {s.tags && s.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {s.tags.slice(0, 3).map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md font-medium">{t}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3.5 hidden md:table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${SOURCE_STYLE[s.source_type]}`}>{s.source_type}</span>
                    </td>
                    <td className="px-3 py-3.5 hidden lg:table-cell text-slate-700 font-mono text-xs">{s.endpoints_count || '—'}</td>
                    <td className="px-3 py-3.5 hidden lg:table-cell text-slate-700 font-mono text-xs">{s.transactions_count ? s.transactions_count.toLocaleString() : '—'}</td>
                    <td className="px-3 py-3.5 hidden xl:table-cell">
                      {s.coverage > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${s.coverage === 100 ? 'bg-emerald-400' : 'bg-indigo-400'}`} style={{ width: `${s.coverage}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{s.coverage}%</span>
                        </div>
                      )}
                      {s.coverage === 0 && <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-3.5 hidden sm:table-cell text-xs text-slate-500 font-mono">{fmtDuration(s.duration_ms)}</td>
                    <td className="px-3 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                    </td>
                    <td className="px-3 py-3.5 hidden md:table-cell text-xs text-slate-400">{timeAgo(s.created_at)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400">No sessions match your filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <Link key={s.id} to={`/sessions/${s.id}`} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all group space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">{s.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{s.base_url}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md shrink-0 ${SOURCE_STYLE[s.source_type]}`}>{s.source_type}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Endpoints', value: s.endpoints_count || '—' },
                    { label: 'Requests', value: s.transactions_count ? `${(s.transactions_count/1000).toFixed(1)}k` : '—' },
                    { label: 'Coverage', value: s.coverage ? `${s.coverage}%` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-2">
                      <p className="text-sm font-bold text-slate-700">{value}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                  <span className="text-xs text-slate-400">{timeAgo(s.created_at)}</span>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-slate-400">No sessions match your filters</div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
