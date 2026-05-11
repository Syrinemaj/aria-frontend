import { useState, useEffect } from 'react';
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

const TEST_TYPES = [
  { id: 'postman', name: 'Postman', desc: 'Importable collection with environments and tests' },
  { id: 'jest',    name: 'Jest',    desc: 'Supertest-based suite for CI integration' },
  { id: 'k6',      name: 'k6',      desc: 'Load testing scripts with thresholds' },
];

const GENERATED_CODE: Record<string, string> = {
  postman: `{
  "info": {
    "name": "acme-checkout-prod",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth · Login",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/v1/auth/login",
        "header": [{ "key": "Content-Type", "value": "application/json" }],
        "body": {
          "mode": "raw",
          "raw": "{ \\"email\\": \\"{{email}}\\", \\"password\\": \\"{{password}}\\" }"
        }
      },
      "event": [{
        "listen": "test",
        "script": {
          "exec": [
            "pm.test('200 OK', () => pm.response.to.have.status(200));",
            "pm.test('access_token returned', () =>",
            "  pm.expect(pm.response.json()).to.have.property('access_token'));"
          ]
        }
      }]
    }
  ]
}`,

  jest: `import request from 'supertest';
const api = request('https://api.acme-shop.com');

describe('Auth flow', () => {
  let token: string;

  it('logs in with valid credentials', async () => {
    const res = await api
      .post('/api/v1/auth/login')
      .send({ email: process.env.EMAIL, password: process.env.PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
    token = res.body.access_token;
  });

  it('refreshes the access token', async () => {
    const res = await api
      .post('/api/v1/auth/refresh')
      .set('Authorization', \`Bearer \${token}\`);
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
  });

  it('rejects requests without bearer token', async () => {
    const res = await api.get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });
});`,

  k6: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50  },
    { duration: '1m',  target: 200 },
    { duration: '30s', target: 0   },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.02'],
  },
};

export default function () {
  const r = http.get('https://api.acme-shop.com/api/v1/products');
  check(r, {
    'status is 200':     (res) => res.status === 200,
    'response < 200ms':  (res) => res.timings.duration < 200,
  });
  sleep(1);
}`,
};

const SESSION_OPTS = [
  { value: 'acme',    label: 'acme-checkout-prod · 47 endpoints' },
  { value: 'staging', label: 'acme-checkout-staging · 44 endpoints' },
  { value: 'finance', label: 'finance-api-prod · 23 endpoints' },
];

export default function TestGenerationPage() {
  const [session, setSession]         = useState('acme');
  const [picked, setPicked]           = useState({ postman: true, jest: true, k6: false });
  const [includeAuth, setIncludeAuth] = useState(true);
  const [includeEdge, setIncludeEdge] = useState(true);
  const [includeLoad, setIncludeLoad] = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [generated, setGenerated]     = useState(true);
  const [activeTab, setActiveTab]     = useState('postman');
  const [toast, setToast]             = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const visibleTabs = TEST_TYPES.filter(t => picked[t.id as keyof typeof picked]);

  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.find(t => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [picked]);

  const generate = () => {
    const enabledCount = Object.values(picked).filter(Boolean).length;
    if (!enabledCount) return;
    setGenerating(true); setGenerated(false);
    setTimeout(() => { setGenerating(false); setGenerated(true); showToast('Tests generated successfully'); }, 1100);
  };

  const [copied, setCopied] = useState(false);
  const copyCode = () => {
    navigator.clipboard.writeText(GENERATED_CODE[activeTab] ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppLayout breadcrumb={{ parent: 'My Sessions', current: 'Test Generation' }}>
      <div className="stagger space-y-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">
            <I d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z" size={11} /> Generation
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Test Generation</h1>
          <p className="text-sm text-slate-500 mt-1">Automatically generate tests from real API traffic</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Config panel */}
          <div className="lg:col-span-5 space-y-4">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">Step 01</div>
              <h3 className="text-base font-semibold text-slate-900 mb-3">Source session</h3>
              <select value={session} onChange={e => setSession(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400">
                {SESSION_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">Step 02</div>
              <h3 className="text-base font-semibold text-slate-900 mb-3">Output formats</h3>
              <div className="grid grid-cols-3 gap-2.5">
                {TEST_TYPES.map(tt => {
                  const on = picked[tt.id as keyof typeof picked];
                  return (
                    <button key={tt.id} onClick={() => setPicked(p => ({ ...p, [tt.id]: !p[tt.id as keyof typeof p] }))}
                      className={`text-left rounded-xl border p-3 transition-all ${on ? 'border-indigo-300 bg-indigo-50/40 shadow-sm shadow-indigo-100' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${on ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white' : 'bg-slate-50 text-slate-500'}`}>
                          <span className="text-xs font-bold">{tt.name[0]}</span>
                        </div>
                        <span className={`w-4 h-4 rounded border flex items-center justify-center ${on ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 bg-white'}`}>
                          {on && <I d="M20 6 9 17l-5-5" size={10} className="text-white" />}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-800">{tt.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{tt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">Step 03</div>
              <h3 className="text-base font-semibold text-slate-900 mb-3">Configuration</h3>
              <div className="space-y-1">
                <Toggle label="Include auth flows"     value={includeAuth} onChange={setIncludeAuth} />
                <Toggle label="Include edge cases"     value={includeEdge} onChange={setIncludeEdge} />
                <Toggle label="Include load scenarios" value={includeLoad} onChange={setIncludeLoad} />
              </div>
              <button onClick={generate} disabled={generating || !Object.values(picked).some(Boolean)}
                className="w-full flex items-center justify-center gap-2 py-2.5 mt-4 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-60">
                <I d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" size={16} />
                {generating ? 'Generating tests…' : 'Generate Tests'}
              </button>
            </div>

            {/* Preview coverage */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">What you&apos;ll get</div>
              <h3 className="text-base font-semibold text-slate-900 mb-3">Preview coverage</h3>
              <div className="grid grid-cols-3 gap-3">
                {[['Endpoints', '47'], ['Assertions', '186'], ['Coverage', '92%']].map(([label, value]) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-slate-800">{value}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Output panel */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full">
              {/* Tab bar */}
              {visibleTabs.length > 0 && (
                <div className="flex items-center gap-1 px-4 pt-4 border-b border-slate-100">
                  {visibleTabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                        activeTab === t.id ? 'border-indigo-500 text-indigo-700 bg-indigo-50/60' : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}>
                      {t.name}
                    </button>
                  ))}
                  <div className="ml-auto pb-2">
                    <button onClick={copyCode}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <I d={copied ? 'M20 6 9 17l-5-5' : 'M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z'} size={13} />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {!generated ? (
                <div className="p-8">
                  <div className="animate-pulse space-y-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-4 bg-slate-100 rounded" />)}</div>
                </div>
              ) : visibleTabs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <I d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M13 2v7h7" size={40} className="mb-3 opacity-20" />
                  <p className="text-sm">Select at least one output format</p>
                </div>
              ) : (
                <pre className="p-5 text-xs font-mono text-slate-700 overflow-auto bg-slate-50/30 h-[calc(100%-3rem)] leading-relaxed">
                  {GENERATED_CODE[activeTab] ?? ''}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-500 text-white text-sm font-medium rounded-xl shadow-lg">{toast}</div>}
    </AppLayout>
  );
}
