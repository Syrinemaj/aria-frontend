import { useState } from 'react';
import { AppLayout } from '../components/layout';
import type { Severity } from '../types';

const FINDINGS = [
  { id: 'f1', severity: 'critical' as Severity, title: 'Broken Object Level Auth',      endpoint: 'GET /v1/payment_intents/{id}', session: 'Stripe Payment API',  owasp: 'API1:2023', cvss: 9.8 },
  { id: 'f2', severity: 'critical' as Severity, title: 'Mass Assignment',               endpoint: 'PUT /api/users/{id}',          session: 'Acme Internal v2',    owasp: 'API6:2023', cvss: 9.1 },
  { id: 'f3', severity: 'high'     as Severity, title: 'Missing Rate Limiting',         endpoint: 'POST /auth/login',             session: 'Auth Service',         owasp: 'API4:2023', cvss: 7.5 },
  { id: 'f4', severity: 'high'     as Severity, title: 'Broken Function Level Auth',    endpoint: 'DELETE /api/admin/users',      session: 'Acme Internal v2',    owasp: 'API5:2023', cvss: 7.2 },
  { id: 'f5', severity: 'medium'   as Severity, title: 'Verbose Error Messages',        endpoint: 'POST /v1/payment_intents',     session: 'Stripe Payment API',  owasp: 'API8:2023', cvss: 5.3 },
  { id: 'f6', severity: 'medium'   as Severity, title: 'Unrestricted Resource Consumption', endpoint: 'GET /api/reports/export', session: 'Reporting API',        owasp: 'API4:2023', cvss: 5.0 },
  { id: 'f7', severity: 'low'      as Severity, title: 'Missing Security Headers',      endpoint: 'GET /v1/customers',            session: 'Stripe Payment API',  owasp: 'API7:2023', cvss: 3.1 },
  { id: 'f8', severity: 'low'      as Severity, title: 'Insecure Direct Object Reference', endpoint: 'GET /api/invoices/{id}',   session: 'Acme Internal v2',    owasp: 'API1:2023', cvss: 3.4 },
  { id: 'f9', severity: 'info'     as Severity, title: 'Outdated TLS Version',          endpoint: 'ALL endpoints',               session: 'Reporting API',        owasp: 'API7:2023', cvss: 0   },
];

const SEV_ORDER: Severity[] = ['critical','high','medium','low','info'];
const SEV_STYLE: Record<Severity, { badge: string; dot: string; card: string }> = {
  critical: { badge: 'bg-rose-500 text-white',    dot: 'bg-rose-500',    card: 'border-rose-100 bg-rose-50/30'    },
  high:     { badge: 'bg-orange-500 text-white',  dot: 'bg-orange-500',  card: 'border-orange-100 bg-orange-50/30'},
  medium:   { badge: 'bg-amber-500 text-white',   dot: 'bg-amber-400',   card: 'border-amber-100 bg-amber-50/30'  },
  low:      { badge: 'bg-slate-400 text-white',   dot: 'bg-slate-300',   card: 'border-slate-200 bg-slate-50/30'  },
  info:     { badge: 'bg-blue-500 text-white',    dot: 'bg-blue-400',    card: 'border-blue-100 bg-blue-50/30'    },
};

export default function SecurityPage() {
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [search, setSearch] = useState('');

  const displayed = FINDINGS.filter(f => {
    const q = search.toLowerCase();
    return (filter === 'all' || f.severity === filter) &&
           (!q || f.title.toLowerCase().includes(q) || f.endpoint.toLowerCase().includes(q) || f.session.toLowerCase().includes(q));
  });

  const counts = SEV_ORDER.reduce((acc, s) => ({ ...acc, [s]: FINDINGS.filter(f => f.severity === s).length }), {} as Record<Severity, number>);

  return (
    <AppLayout title="Security">
      <div className="space-y-5 stagger">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Security Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">{FINDINGS.length} findings across {[...new Set(FINDINGS.map(f => f.session))].length} sessions</p>
        </div>

        {/* Severity summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {SEV_ORDER.map(s => (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? 'all' : s)}
              className={`rounded-2xl border p-4 text-center transition-all hover:shadow-md ${filter === s ? SEV_STYLE[s].card + ' ring-2 ring-offset-1 ring-current' : 'bg-white border-slate-100'}`}
            >
              <p className={`text-2xl font-bold ${s === 'critical' ? 'text-rose-600' : s === 'high' ? 'text-orange-600' : s === 'medium' ? 'text-amber-600' : s === 'low' ? 'text-slate-500' : 'text-blue-600'}`}>{counts[s]}</p>
              <p className="text-xs font-medium text-slate-500 capitalize mt-0.5">{s}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search findings…" className="w-full pl-9 pr-4 h-9 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
          </div>
        </div>

        {/* Findings list */}
        <div className="space-y-3">
          {SEV_ORDER.filter(s => filter === 'all' || filter === s).map(sev => {
            const items = displayed.filter(f => f.severity === sev);
            if (!items.length) return null;
            return (
              <div key={sev}>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${SEV_STYLE[sev].dot}`} />
                  {sev} ({items.length})
                </h3>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                  {items.map(f => (
                    <div key={f.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 cursor-pointer group transition-colors">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase shrink-0 ${SEV_STYLE[f.severity].badge}`}>{f.severity}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">{f.title}</p>
                        <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">{f.endpoint}</p>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-xs text-slate-500">{f.session}</p>
                        <p className="text-xs font-mono text-slate-400 mt-0.5">{f.owasp}</p>
                      </div>
                      {f.cvss > 0 && (
                        <div className={`shrink-0 text-xs font-bold px-2 py-1 rounded-lg ${f.cvss >= 9 ? 'bg-rose-100 text-rose-700' : f.cvss >= 7 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                          {f.cvss}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {displayed.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-100">
              No findings match your filters
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
