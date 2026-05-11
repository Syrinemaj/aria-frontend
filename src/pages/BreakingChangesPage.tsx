import { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout';
import type { HttpMethod, Severity } from '../types';

function I({ d, size = 16, className = '' }: { d: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

const METHOD_BADGE: Record<HttpMethod, string> = {
  GET:    'bg-blue-50 text-blue-700 border-blue-200',
  POST:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  PUT:    'bg-amber-50 text-amber-700 border-amber-200',
  DELETE: 'bg-red-50 text-red-700 border-red-200',
  PATCH:  'bg-violet-50 text-violet-700 border-violet-200',
};
const SEV_BADGE: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-300 font-semibold',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  medium:   'bg-amber-50 text-amber-700 border-amber-200',
  low:      'bg-yellow-50 text-yellow-700 border-yellow-200',
  info:     'bg-blue-50 text-blue-700 border-blue-200',
};

interface Change {
  id: number; type: string; severity: Severity;
  method: HttpMethod; path: string; description: string; impact: string;
  status: 'new' | 'removed' | 'modified';
}

const breakingChanges: Change[] = [
  { id: 1, type: 'endpoint', severity: 'critical', method: 'DELETE', path: '/api/v1/users/{id}',      description: 'Endpoint removed from new version',              impact: 'Clients calling this endpoint will receive 404',        status: 'removed'  },
  { id: 2, type: 'schema',   severity: 'high',     method: 'GET',    path: '/api/v1/products/{id}',   description: 'Field "price" type changed: number → string',    impact: 'Numeric parsers will fail at runtime',                 status: 'modified' },
  { id: 3, type: 'auth',     severity: 'high',     method: 'POST',   path: '/api/v1/auth/login',      description: 'Required new field: device_fingerprint',          impact: 'All login attempts without field will return 400',      status: 'modified' },
  { id: 4, type: 'schema',   severity: 'medium',   method: 'GET',    path: '/api/v1/orders',          description: 'Pagination shape changed: offset → cursor',       impact: 'Client-side pagination logic must be updated',          status: 'modified' },
  { id: 5, type: 'endpoint', severity: 'medium',   method: 'PATCH',  path: '/api/v1/products/{id}',   description: 'Rate limit reduced 100 → 30 req/min',             impact: 'Bulk update flows may hit 429',                         status: 'modified' },
  { id: 6, type: 'endpoint', severity: 'low',      method: 'GET',    path: '/api/v1/health',          description: 'Response now includes deprecated fields',         impact: 'No breaking impact, informational',                     status: 'new'      },
  { id: 7, type: 'schema',   severity: 'low',      method: 'POST',   path: '/api/v1/cart/items',      description: 'Optional field "notes" added',                   impact: 'Backward compatible',                                   status: 'new'      },
];

const SESSION_OPTS = [
  { value: 'v1.4.2',   label: 'acme-checkout-prod · v1.4.2 (baseline)' },
  { value: 'v1.4.5',   label: 'acme-checkout-prod · v1.4.5' },
  { value: 'v1.5.0',   label: 'acme-checkout-prod · v1.5.0' },
  { value: 'v1.5.1-rc',label: 'acme-checkout-prod · v1.5.1-rc' },
];

const STATUS_TONE: Record<string, string> = {
  new:      'bg-emerald-50 text-emerald-700 border-emerald-100',
  removed:  'bg-rose-50 text-rose-700 border-rose-100',
  modified: 'bg-amber-50 text-amber-700 border-amber-100',
};

function ChangeDetailModal({ change, onClose, baseline, target }: { change: Change; onClose: () => void; baseline: string; target: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const before = change.type === 'schema'
    ? `{\n  "id": "p_2391",\n  "name": "Linen Shirt",\n  "price": 49.99,\n  "currency": "EUR",\n  "stock": 142\n}`
    : `${change.method} ${change.path}\n200 OK\n\n{ ... }`;

  const after = change.type === 'schema'
    ? `{\n  "id": "p_2391",\n  "name": "Linen Shirt",\n  "price": "49.99",\n  "currency": "EUR",\n  "stock": 142\n}`
    : change.status === 'removed'
      ? `${change.method} ${change.path}\n404 Not Found`
      : `${change.method} ${change.path}\n400 Bad Request\n\n{ "error": "device_fingerprint required" }`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <I d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${SEV_BADGE[change.severity]}`}>{change.severity}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold tracking-wide border ${METHOD_BADGE[change.method]}`}>{change.method}</span>
              <code className="font-mono text-sm text-slate-800">{change.path}</code>
            </div>
            <div className="mt-1 font-semibold text-slate-900">{change.description}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
            <I d="M18 6 6 18M6 6l12 12" size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">Baseline · {baseline}</span>
              </div>
              <pre className="text-xs font-mono p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 overflow-x-auto whitespace-pre">{before}</pre>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">New · {target}</span>
              </div>
              <pre className="text-xs font-mono p-4 rounded-xl bg-rose-50/60 border border-rose-200 text-slate-800 overflow-x-auto whitespace-pre">{after}</pre>
            </div>
          </div>
          <div className="rounded-xl bg-amber-50/60 border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <I d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" size={16} className="text-amber-600 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-900">Impact</div>
                <div className="text-sm text-amber-800 mt-0.5">{change.impact}</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-indigo-50/40 border border-indigo-100 p-4">
            <div className="flex items-start gap-3">
              <I d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01L12 2z" size={16} className="text-indigo-600 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-indigo-900">Recommendation</div>
                <ul className="text-sm text-slate-700 mt-1 space-y-1 list-disc pl-4">
                  <li>Bump major version and document this change in the migration guide.</li>
                  <li>Notify consumers via the deprecation channel at least one release ahead.</li>
                  <li>Add a contract test that asserts the old behavior to catch regressions.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Close</button>
          <button className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition-colors">Copy diff</button>
          <button className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl hover:opacity-90 transition-opacity">Open in compare view</button>
        </div>
      </div>
    </div>
  );
}

export default function BreakingChangesPage() {
  const [baseline, setBaseline] = useState('v1.4.2');
  const [target, setTarget]     = useState('v1.5.0');
  const [running, setRunning]   = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [selected, setSelected] = useState<Change | null>(null);
  const [toast, setToast]       = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const runComparison = () => {
    setRunning(true); setShowResults(false);
    setTimeout(() => {
      setRunning(false); setShowResults(true);
      showToast(`Comparison complete · ${breakingChanges.length} changes detected`);
    }, 1100);
  };

  const counts = {
    total:    breakingChanges.length,
    critical: breakingChanges.filter(c => c.severity === 'critical').length,
    schema:   breakingChanges.filter(c => c.type === 'schema').length,
    endpoint: breakingChanges.filter(c => c.type === 'endpoint').length,
  };

  return (
    <AppLayout breadcrumb={{ parent: 'My Sessions', current: 'Breaking Changes' }}>
      <div className="stagger space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">
              <I d="M6 3v12M18 9v12M6 15H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2zM18 3h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" size={11} /> Compare
            </div>
            <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Breaking Changes Analysis</h1>
            <p className="text-sm text-slate-500 mt-1">Compare API behavior across sessions and detect critical changes</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
            <I d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={16} />Export report
          </button>
        </div>

        {/* Session selector */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-5">
              <label className="block text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1.5">Baseline session</label>
              <select value={baseline} onChange={e => setBaseline(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400">
                {SESSION_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="lg:col-span-1 flex justify-center pb-2 text-slate-300">
              <I d="M5 12h14M12 5l7 7-7 7" size={18} />
            </div>
            <div className="lg:col-span-4">
              <label className="block text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1.5">New session</label>
              <select value={target} onChange={e => setTarget(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400">
                {SESSION_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="lg:col-span-2">
              <button onClick={runComparison} disabled={running}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-60">
                <I d="M6 3v12M18 9v12M6 15H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2zM18 3h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" size={16} />
                {running ? 'Comparing…' : 'Run Comparison'}
              </button>
            </div>
          </div>
        </div>

        {!showResults ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
            <div className="animate-pulse space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-slate-100 rounded" />)}</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Changes', value: counts.total,    color: 'text-indigo-600' },
                { label: 'Critical',      value: counts.critical, color: 'text-rose-600'   },
                { label: 'Schema',        value: counts.schema,   color: 'text-violet-600' },
                { label: 'Endpoint',      value: counts.endpoint, color: 'text-amber-600'  },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400">{label}</div>
                  <div className={`text-2xl font-bold tabular-nums mt-1 ${color}`}>{value}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{baseline} → {target}</span>
                <span className="text-xs text-slate-400">Click a row to see the diff</span>
              </div>
              <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50/60 border-b border-slate-100 text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400">
                <div className="col-span-1">Type</div><div className="col-span-1">Severity</div>
                <div className="col-span-3">Endpoint</div><div className="col-span-3">Description</div>
                <div className="col-span-3">Impact</div><div className="col-span-1">Status</div>
              </div>
              <div className="divide-y divide-slate-100">
                {breakingChanges.map(c => (
                  <button key={c.id} onClick={() => setSelected(c)}
                    className="w-full grid grid-cols-12 gap-3 px-4 py-3 items-center text-left hover:bg-indigo-50/30 transition-colors">
                    <div className="col-span-1 capitalize text-xs font-medium text-slate-700">{c.type}</div>
                    <div className="col-span-1"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${SEV_BADGE[c.severity]}`}>{c.severity}</span></div>
                    <div className="col-span-3 flex items-center gap-2 min-w-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold border ${METHOD_BADGE[c.method]}`}>{c.method}</span>
                      <code className="font-mono text-xs text-slate-700 truncate">{c.path}</code>
                    </div>
                    <div className="col-span-3 text-sm text-slate-700">{c.description}</div>
                    <div className="col-span-3 text-xs text-slate-500">{c.impact}</div>
                    <div className="col-span-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_TONE[c.status]}`}>{c.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {selected && <ChangeDetailModal change={selected} onClose={() => setSelected(null)} baseline={baseline} target={target} />}
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg">{toast}</div>}
    </AppLayout>
  );
}
