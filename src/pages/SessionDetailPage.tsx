import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AppLayout } from '../components/layout';
import type { HttpMethod } from '../types';

// ── Mock data ─────────────────────────────────────────────────
const SESSION = {
  id: 's1', name: 'Stripe Payment API', base_url: 'api.stripe.com',
  source_type: 'HAR', status: 'completed', created_at: '2024-12-01T10:00:00Z',
  endpoints_count: 47, transactions_count: 1280, duration_ms: 3200, coverage: 94,
};

const ENDPOINTS = [
  { id: 'e1', method: 'GET'  as HttpMethod, path: '/v1/payment_intents',        samples: 340, p95_ms: 82,  confidence: 98, status_codes: [200, 400, 401] },
  { id: 'e2', method: 'POST' as HttpMethod, path: '/v1/payment_intents',        samples: 128, p95_ms: 210, confidence: 96, status_codes: [200, 400, 402] },
  { id: 'e3', method: 'GET'  as HttpMethod, path: '/v1/payment_intents/{id}',   samples: 234, p95_ms: 65,  confidence: 99, status_codes: [200, 404]      },
  { id: 'e4', method: 'POST' as HttpMethod, path: '/v1/payment_intents/{id}/confirm', samples: 87, p95_ms: 340, confidence: 91, status_codes: [200, 400, 402] },
  { id: 'e5', method: 'GET'  as HttpMethod, path: '/v1/charges',                samples: 156, p95_ms: 94,  confidence: 97, status_codes: [200, 401]      },
  { id: 'e6', method: 'POST' as HttpMethod, path: '/v1/charges',                samples: 43,  p95_ms: 180, confidence: 88, status_codes: [200, 400]      },
  { id: 'e7', method: 'GET'  as HttpMethod, path: '/v1/customers',              samples: 201, p95_ms: 71,  confidence: 95, status_codes: [200, 401]      },
  { id: 'e8', method: 'POST' as HttpMethod, path: '/v1/customers',              samples: 61,  p95_ms: 145, confidence: 93, status_codes: [200, 400]      },
  { id: 'e9', method: 'DELETE' as HttpMethod, path: '/v1/customers/{id}',       samples: 14,  p95_ms: 120, confidence: 85, status_codes: [200, 404]      },
];

const SECURITY = [
  { id: 'f1', severity: 'critical', title: 'Broken Object Level Auth',    endpoint: 'GET /v1/payment_intents/{id}', owasp: 'API1:2023', cvss: 9.8, description: 'Insufficient object-level authorization allows access to any payment intent by ID.' },
  { id: 'f2', severity: 'high',     title: 'Missing Rate Limiting',       endpoint: 'POST /v1/charges',             owasp: 'API4:2023', cvss: 7.5, description: 'No rate limiting detected on charge creation endpoint. Brute-force and DoS risk.' },
  { id: 'f3', severity: 'medium',   title: 'Verbose Error Responses',     endpoint: 'POST /v1/payment_intents',     owasp: 'API8:2023', cvss: 5.3, description: 'Error messages expose internal stack traces and database identifiers.' },
  { id: 'f4', severity: 'low',      title: 'Missing Security Headers',    endpoint: 'GET /v1/customers',            owasp: 'API7:2023', cvss: 3.1, description: 'Strict-Transport-Security and Content-Security-Policy headers absent.' },
];

const RATE_DATA = [
  { t: '00:00', rps: 12 }, { t: '04:00', rps: 8  }, { t: '08:00', rps: 34 },
  { t: '12:00', rps: 67 }, { t: '16:00', rps: 88 }, { t: '20:00', rps: 45 }, { t: '23:59', rps: 20 },
];

const AI_INSIGHTS = [
  'Payment Intent lifecycle covers 5 state transitions with 94% observability.',
  'POST /v1/charges has 23% higher p95 latency than similar endpoints — possible N+1 query.',
  'DELETE operations are underrepresented (1% of traffic). Consider adding test coverage.',
  'Bearer token rotation observed every ~3600s, consistent with Stripe\'s token policy.',
];

const METHOD_STYLE: Record<HttpMethod, string> = {
  GET:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  POST:   'bg-blue-50 text-blue-700 border-blue-200',
  PUT:    'bg-violet-50 text-violet-700 border-violet-200',
  PATCH:  'bg-amber-50 text-amber-700 border-amber-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
};

const SEV_STYLE: Record<string, string> = {
  critical: 'bg-rose-500 text-white',
  high:     'bg-orange-500 text-white',
  medium:   'bg-amber-500 text-white',
  low:      'bg-slate-400 text-white',
  info:     'bg-blue-500 text-white',
};

const TABS = ['Overview', 'Endpoints', 'AI Analysis', 'Security', 'Raw Traffic'] as const;
type Tab = typeof TABS[number];

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab]         = useState<Tab>('Overview');
  const [epSearch, setEpSearch] = useState('');
  const [epMethod, setEpMethod] = useState<HttpMethod | 'ALL'>('ALL');

  void id; // session would be fetched by id in real app

  const filteredEps = ENDPOINTS.filter(e => {
    const q = epSearch.toLowerCase();
    return (!q || e.path.toLowerCase().includes(q)) && (epMethod === 'ALL' || e.method === epMethod);
  });

  return (
    <AppLayout title={SESSION.name} subtitle="Session Detail">
      <div className="space-y-5 stagger">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link to="/sessions" className="hover:text-indigo-600 transition-colors">Sessions</Link>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="text-slate-800 font-medium">{SESSION.name}</span>
        </div>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-slate-900">{SESSION.name}</h1>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">completed</span>
              </div>
              <p className="text-sm text-slate-500 font-mono">{SESSION.base_url}</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">Export spec</button>
              <button className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl hover:opacity-90 transition-opacity">AI Analysis</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            {[
              { label: 'Endpoints', value: SESSION.endpoints_count },
              { label: 'Transactions', value: SESSION.transactions_count.toLocaleString() },
              { label: 'Duration', value: `${(SESSION.duration_ms/1000).toFixed(1)}s` },
              { label: 'AI Coverage', value: `${SESSION.coverage}%` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center bg-slate-50 rounded-xl p-3">
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${tab === t ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Request Rate (24h)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={RATE_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15}/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="rps" stroke="#6366f1" strokeWidth={2} fill="url(#rg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800">Method Distribution</h3>
              {(['GET','POST','DELETE'] as HttpMethod[]).map(m => {
                const count = ENDPOINTS.filter(e => e.method === m).length;
                const pct   = Math.round((count / ENDPOINTS.length) * 100);
                return (
                  <div key={m} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-bold px-2 py-0.5 rounded border ${METHOD_STYLE[m]}`}>{m}</span>
                      <span className="text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'Endpoints' && (
          <div className="space-y-3">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input value={epSearch} onChange={e => setEpSearch(e.target.value)} placeholder="Filter paths…" className="w-full pl-9 pr-4 h-9 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
              </div>
              <select value={epMethod} onChange={e => setEpMethod(e.target.value as HttpMethod | 'ALL')} className="h-9 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value="ALL">All methods</option>
                {(['GET','POST','PUT','PATCH','DELETE'] as HttpMethod[]).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 font-medium border-b border-slate-100">
                    <th className="text-left px-5 py-3">Endpoint</th>
                    <th className="text-left px-3 py-3 hidden sm:table-cell">Samples</th>
                    <th className="text-left px-3 py-3 hidden md:table-cell">P95 latency</th>
                    <th className="text-left px-3 py-3">Confidence</th>
                    <th className="text-left px-3 py-3 hidden lg:table-cell">Status codes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredEps.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/70 cursor-pointer transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border w-16 text-center shrink-0 ${METHOD_STYLE[e.method]}`}>{e.method}</span>
                          <span className="font-mono text-xs text-slate-700">{e.path}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell text-xs text-slate-500 font-mono">{e.samples}</td>
                      <td className="px-3 py-3 hidden md:table-cell text-xs text-slate-500 font-mono">{e.p95_ms}ms</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${e.confidence >= 95 ? 'bg-emerald-400' : e.confidence >= 80 ? 'bg-indigo-400' : 'bg-amber-400'}`} style={{ width: `${e.confidence}%` }} />
                          </div>
                          <span className="text-xs text-slate-500">{e.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <div className="flex gap-1">
                          {e.status_codes.map(c => (
                            <span key={c} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c < 300 ? 'bg-emerald-50 text-emerald-600' : c < 400 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>{c}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'AI Analysis' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3V5.73A2 2 0 0 1 12 2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-indigo-900">AI Summary</p>
                  <p className="text-xs text-indigo-600">Generated from 1,280 transactions</p>
                </div>
              </div>
              <ul className="space-y-2">
                {AI_INSIGHTS.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-indigo-800">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Predicted Endpoints', desc: 'Based on patterns, 3 endpoints may exist but were not observed.', badge: '3 predicted', color: 'violet' },
                { title: 'Schema Completeness', desc: 'Request/response schemas inferred for 94% of observed traffic.', badge: '94% complete', color: 'emerald' },
              ].map(({ title, desc, badge, color }) => (
                <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md bg-${color}-50 text-${color}-700`}>{badge}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Security' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Critical', count: 1, color: 'rose' },
                { label: 'High',     count: 1, color: 'orange' },
                { label: 'Medium',   count: 1, color: 'amber' },
                { label: 'Low',      count: 1, color: 'slate' },
              ].map(({ label, count, color }) => (
                <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold text-${color}-600`}>{count}</p>
                  <p className={`text-xs font-medium text-${color}-500 mt-0.5`}>{label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
              {SECURITY.map(f => (
                <div key={f.id} className="p-5 space-y-2 hover:bg-slate-50/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${SEV_STYLE[f.severity]}`}>{f.severity}</span>
                      <h3 className="text-sm font-semibold text-slate-800">{f.title}</h3>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <span className="text-xs text-slate-400 font-mono">{f.owasp}</span>
                      <span className="text-xs font-bold text-rose-600">CVSS {f.cvss}</span>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-slate-500">{f.endpoint}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Raw Traffic' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Transaction Log</h3>
              <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Download HAR</button>
            </div>
            <div className="font-mono text-xs divide-y divide-slate-50 max-h-96 overflow-y-auto">
              {Array.from({ length: 12 }, (_, i) => {
                const methods = ['GET','POST','GET','DELETE','GET','POST'] as const;
                const paths   = ['/v1/payment_intents','/v1/charges','/v1/customers','/v1/customers/cus_abc','/v1/payment_methods','/v1/payment_intents/pi_xyz/confirm'];
                const statuses = [200, 200, 201, 204, 200, 400];
                const m = methods[i % 6];
                const status = statuses[i % 6];
                return (
                  <div key={i} className={`flex items-center gap-4 px-5 py-2.5 hover:bg-slate-50/50 ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                    <span className={`w-10 text-center font-bold ${m === 'GET' ? 'text-emerald-600' : m === 'POST' ? 'text-blue-600' : 'text-rose-600'}`}>{m}</span>
                    <span className="flex-1 text-slate-600 truncate">{paths[i % 6]}</span>
                    <span className={`w-10 text-right ${status < 300 ? 'text-emerald-600' : 'text-rose-600'}`}>{status}</span>
                    <span className="w-16 text-right text-slate-400">{Math.floor(Math.random() * 300 + 40)}ms</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
