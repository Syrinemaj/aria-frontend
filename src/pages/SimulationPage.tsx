import { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AppLayout } from '../components/layout';

function I({ d, size = 16, className = '' }: { d: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-slate-700">{label}</span>
      <button onClick={() => onChange(!value)} aria-pressed={value}
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

function InsightRow({ kind, text, detail }: { kind: 'info' | 'warning' | 'success' | 'error'; text: string; detail?: string }) {
  const cfg = {
    info:    { d: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01', bg: 'bg-blue-50',    color: 'text-blue-600',   ring: 'ring-blue-100' },
    warning: { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01', bg: 'bg-amber-50',   color: 'text-amber-600',  ring: 'ring-amber-100' },
    success: { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',                                     bg: 'bg-emerald-50', color: 'text-emerald-600', ring: 'ring-emerald-100' },
    error:   { d: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6', bg: 'bg-rose-50',  color: 'text-rose-600',   ring: 'ring-rose-100' },
  }[kind];
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-lg ${cfg.bg} ${cfg.color} ring-1 ${cfg.ring} flex items-center justify-center`}>
        <I d={cfg.d} size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-800">{text}</div>
        {detail && <div className="text-xs text-slate-500 mt-0.5">{detail}</div>}
      </div>
    </div>
  );
}

export default function SimulationPage() {
  const [users, setUsers]                   = useState(1000);
  const [rateLimit, setRateLimit]           = useState(100);
  const [disableRefresh, setDisableRefresh] = useState(false);
  const [aggressiveRetry, setAggressiveRetry] = useState(true);
  const [endpoint, setEndpoint]             = useState('all');
  const [running, setRunning]               = useState(false);
  const [hasRun, setHasRun]                 = useState(true);
  const [toast, setToast]                   = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const run = () => {
    setRunning(true); setHasRun(false);
    showToast('Running simulation…');
    setTimeout(() => { setRunning(false); setHasRun(true); showToast('Simulation complete'); }, 1300);
  };

  const reqSeries = useMemo(() => {
    const arr = [];
    const peak = Math.min(users / 10, 250);
    for (let t = 0; t <= 60; t += 2) {
      const ramp = Math.min(t / 20, 1);
      const v = Math.round(peak * ramp + Math.sin(t / 4) * 8 + (Math.random() - 0.5) * 6);
      arr.push({ t, requests: Math.max(0, v), errors: Math.max(0, t > 30 ? Math.round((t - 30) * 1.4 + Math.random() * 4) : Math.round(Math.random() * 2)) });
    }
    return arr;
  }, [users]);

  const endpointPerf = useMemo(() => ([
    { name: '/products',   p95: 91  },
    { name: '/cart/items', p95: 256 },
    { name: '/orders',     p95: 421 },
    { name: '/auth/login', p95: 312 },
    { name: '/users/me',   p95: 124 },
  ]), []);

  const totalReq  = reqSeries.reduce((s, r) => s + r.requests, 0);
  const totalErr  = reqSeries.reduce((s, r) => s + r.errors, 0);
  const errorRate = totalReq > 0 ? ((totalErr / totalReq) * 100).toFixed(1) : '0.0';

  return (
    <AppLayout breadcrumb={{ parent: 'My Sessions', current: 'Simulation' }}>
      <div className="stagger space-y-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">
            <I d="M22 12h-4l-3 9L9 3l-3 9H2" size={11} /> Sandbox
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Simulation & What-If</h1>
          <p className="text-sm text-slate-500 mt-1">Test how your API behaves under different scenarios</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Builder */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">Scenario</div>
              <h3 className="text-lg font-semibold text-slate-900">Scenario Builder</h3>
              <p className="text-sm text-slate-500 mt-0.5">Tweak inputs and run the model</p>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400">Concurrent users</div>
                  <input type="number" value={users} onChange={e => setUsers(Math.max(1, +e.target.value || 0))}
                    className="w-24 px-2 py-1 text-sm font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-right" />
                </div>
                <input type="range" min={10} max={10000} step={10} value={users} onChange={e => setUsers(+e.target.value)}
                  className="w-full accent-indigo-500" />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1"><span>10</span><span>10,000</span></div>
              </div>

              <div>
                <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1.5">Rate limit override</div>
                <div className="relative">
                  <input type="number" value={rateLimit} onChange={e => setRateLimit(+e.target.value || 0)}
                    className="w-full px-3 py-2 pr-20 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">req/min</span>
                </div>
              </div>

              <Toggle label="Disable refresh token"  value={disableRefresh}   onChange={setDisableRefresh} />
              <Toggle label="Aggressive retry on 429" value={aggressiveRetry} onChange={setAggressiveRetry} />

              <div>
                <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1.5">Endpoint focus</div>
                <select value={endpoint} onChange={e => setEndpoint(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400">
                  <option value="all">All endpoints</option>
                  <option value="auth">{'  '}/auth/* only</option>
                  <option value="orders">{'  '}/orders/* only</option>
                  <option value="cart">{'  '}/cart/* only</option>
                </select>
              </div>

              <button onClick={run} disabled={running}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-60">
                <I d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" size={16} />
                {running ? 'Running simulation…' : 'Run Simulation'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-8 space-y-5">
            {!hasRun ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                <div className="animate-pulse space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-slate-100 rounded" />)}</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Error rate',       value: `${errorRate}%`, color: 'text-rose-600'   },
                    { label: 'Avg response',      value: '284ms',         color: 'text-indigo-600' },
                    { label: 'Failed requests',   value: '1,284',         color: 'text-amber-600'  },
                    { label: 'Rate limit hits',   value: '46',            color: 'text-violet-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                      <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400">{label}</div>
                      <div className={`text-2xl font-bold tabular-nums mt-1 ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Throughput', sub: 'Requests over time', key: 'requests' as const, color: '#6366f1' },
                    { title: 'Errors',     sub: 'Errors over time',   key: 'errors'   as const, color: '#f43f5e' },
                  ].map(({ title, sub, key, color }) => (
                    <div key={title} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-400">{title}</div>
                      <div className="text-base font-semibold text-slate-800 mb-3">{sub}</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={reqSeries} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="s" />
                          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                          <Line type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-400">Endpoints</div>
                  <div className="text-base font-semibold text-slate-800 mb-3">Performance under load (p95)</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={endpointPerf} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="ms" />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Bar dataKey="p95" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">What we detected</div>
                    <h3 className="text-base font-semibold text-slate-900 mb-4">AI Insights</h3>
                    <div className="rounded-xl bg-gradient-to-br from-indigo-50/40 to-violet-50/30 border border-indigo-100/60 p-3 divide-y divide-indigo-100/50">
                      <InsightRow kind="warning" text="High risk of 429 errors after 45s"         detail="Throughput exceeds /auth/login limit" />
                      <InsightRow kind="error"   text="Auth system fails without refresh token"   detail="100% of sessions drop after 15min" />
                      <InsightRow kind="warning" text="Latency increases by 230%"                 detail="On /orders under aggressive retry" />
                      <InsightRow kind="info"    text="Cart write throughput plateaus at 240 rps" detail="Bottleneck is payment validation step" />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">Suggested fixes</div>
                    <h3 className="text-base font-semibold text-slate-900 mb-4">Recommendations</h3>
                    <div className="space-y-2.5">
                      {[
                        { title: 'Increase /auth/login limit to 30 req/min', body: 'Matches observed retry behavior with 2× headroom.' },
                        { title: 'Add exponential backoff to retry policy',  body: 'Reduces thundering-herd on rate-limit recovery.' },
                        { title: 'Cache /products responses for 30s',         body: 'Estimated 38% reduction in /products load.' },
                      ].map((r, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 p-3 hover:border-indigo-200 transition-colors">
                          <div className="text-sm font-semibold text-slate-800">{r.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{r.body}</div>
                          <button className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700">Apply →</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg">{toast}</div>}
    </AppLayout>
  );
}
