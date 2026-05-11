import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { AppLayout } from '../components/layout';
import {
  session, oauthFlow, oauthInsights, schemaResource,
  predictedEndpoints, rateLimitSeries, rateLimitInsights,
  summaryBullets, endpointsList, securityFindings, rawTraffic,
} from '../data';
import type { HttpMethod, Severity } from '../types';

// ── Tiny icon helper ──────────────────────────────────────────
function I({ d, size = 16, className = '' }: { d: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

// ── Badges ────────────────────────────────────────────────────
const METHOD_BADGE: Record<HttpMethod, string> = {
  GET:    'bg-blue-50   text-blue-700   border-blue-200',
  POST:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  PUT:    'bg-amber-50  text-amber-700  border-amber-200',
  DELETE: 'bg-red-50    text-red-700    border-red-200',
  PATCH:  'bg-violet-50 text-violet-700 border-violet-200',
};
const SEV_BADGE: Record<Severity, string> = {
  critical: 'bg-red-100  text-red-800  border-red-300   font-semibold',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  medium:   'bg-amber-50 text-amber-700  border-amber-200',
  low:      'bg-yellow-50 text-yellow-700 border-yellow-200',
  info:     'bg-blue-50  text-blue-700  border-blue-200',
};

function MethodBadge({ method, className = '' }: { method: HttpMethod; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold tracking-wide border ${METHOD_BADGE[method]} ${className}`}>
      {method}
    </span>
  );
}
function SevBadge({ level }: { level: Severity }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${SEV_BADGE[level]}`}>
      {level}
    </span>
  );
}

function ConfBar({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const color = value >= 95 ? 'from-emerald-500 to-teal-500' : value >= 80 ? 'from-indigo-500 to-violet-500' : 'from-amber-400 to-orange-400';
  return (
    <div className="flex items-center gap-2">
      <div className={`${size === 'sm' ? 'h-1' : 'h-1.5'} flex-1 bg-slate-100 rounded-full overflow-hidden`}>
        <div className={`h-full bg-gradient-to-r ${color} rounded-full conf-bar`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-500 tabular-nums w-8 text-right">{value}%</span>
    </div>
  );
}

function Card({ children, className = '', padding = 'p-6', gradient = false }: {
  children: React.ReactNode; className?: string; padding?: string; gradient?: boolean;
}) {
  if (gradient) {
    return <div className={`card-grad-border shadow-sm shadow-slate-200/40 ${padding} ${className}`}>{children}</div>;
  }
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/60 ${padding} ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: iconD, eyebrow, title, description, accent = 'indigo', actions, confidence }: {
  icon: string; eyebrow?: string; title: string; description?: string;
  accent?: string; actions?: React.ReactNode; confidence?: number;
}) {
  const accentBg: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600', violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="flex items-start gap-4 mb-5">
      <div className={`shrink-0 w-10 h-10 rounded-xl ${accentBg[accent] ?? accentBg.indigo} flex items-center justify-center`}>
        <I d={iconD} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        {eyebrow && <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">{eyebrow}</div>}
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {confidence != null && (
        <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{confidence}% confidence</span>
      )}
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function StatCard({ label, value, sublabel, accent = 'indigo', alert = false }: {
  label: string; value: string | number; sublabel?: string; accent?: string; alert?: boolean;
}) {
  const accentColors: Record<string, string> = {
    indigo: 'text-indigo-600', violet: 'text-violet-600',
    emerald: 'text-emerald-600', amber: 'text-amber-600', rose: 'text-rose-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400">{label}</div>
      <div className={`text-2xl font-bold tabular-nums mt-1 ${alert ? 'text-amber-600' : accentColors[accent]}`}>{value}</div>
      {sublabel && <div className="text-xs text-slate-400 mt-0.5">{sublabel}</div>}
    </div>
  );
}

// ── Insight row ───────────────────────────────────────────────
function InsightRow({ kind, text, detail }: { kind: 'info' | 'warning' | 'success' | 'error'; text: string; detail?: string }) {
  const cfg = {
    info:    { d: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01', bg: 'bg-blue-50',    color: 'text-blue-600',   ring: 'ring-blue-100' },
    warning: { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',   bg: 'bg-amber-50',   color: 'text-amber-600',  ring: 'ring-amber-100' },
    success: { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3',                                                           bg: 'bg-emerald-50', color: 'text-emerald-600', ring: 'ring-emerald-100' },
    error:   { d: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6',                     bg: 'bg-rose-50',    color: 'text-rose-600',   ring: 'ring-rose-100' },
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

// ══════════════════════════════════════════════════════════════
// TAB: AI Analysis
// ══════════════════════════════════════════════════════════════

function AiSummaryCard() {
  return (
    <Card padding="p-0" className="overflow-hidden">
      <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 text-white overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-violet-400/30 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="shrink-0 w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
            <I d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2zM14.5 2a2.5 2.5 0 0 0-2.5 2.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z" size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.22em] uppercase text-indigo-100">
              <I d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01L12 2z" size={11} className="sparkle" />
              AI Executive Summary
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight">acme-checkout-prod · Analysis complete</h2>
          </div>
          <div className="hidden sm:flex flex-col items-end shrink-0">
            <div className="text-[10px] uppercase tracking-widest text-indigo-100 font-semibold">Overall confidence</div>
            <div className="text-2xl font-bold tabular-nums leading-tight">91<span className="text-base font-semibold opacity-80">%</span></div>
          </div>
        </div>
        <p className="relative mt-4 text-[15px] leading-relaxed text-indigo-50 max-w-3xl">
          This API uses <span className="font-semibold text-white">OAuth 2.0 with automatic token refresh</span>.
          Several endpoints are missing from the captured traffic, likely due to incomplete session coverage.
          <span className="font-semibold text-white"> Rate limiting is enforced globally</span> and more strictly
          on authentication endpoints. Cursor-based pagination is used throughout the platform.
        </p>
      </div>
      <div className="p-6">
        <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-3">Key findings</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {summaryBullets.map((b, i) => {
            const tones: Record<string, [string, string, string]> = {
              indigo:  ['bg-indigo-50',  'text-indigo-600',  'border-indigo-100'],
              violet:  ['bg-violet-50',  'text-violet-600',  'border-violet-100'],
              amber:   ['bg-amber-50',   'text-amber-600',   'border-amber-100'],
              emerald: ['bg-emerald-50', 'text-emerald-600', 'border-emerald-100'],
              rose:    ['bg-rose-50',    'text-rose-600',    'border-rose-100'],
            };
            const [bg, color, border] = tones[b.tone];
            return (
              <div key={i} className={`flex items-start gap-3 rounded-xl border ${border} bg-white p-3.5`}>
                <div className={`shrink-0 w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center`}>
                  <I d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01L12 2z" size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{b.text}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{b.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex items-center flex-wrap gap-3 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <I d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4l4 2" size={12} />
            Enriched <span className="font-semibold text-slate-700 ml-1">2m ago</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <I d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zM2 12h20" size={12} />
            <span className="font-semibold text-slate-700">{session.endpoints_count}</span> endpoints analyzed
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <I d="M22 12h-4l-3 9L9 3l-3 9H2" size={12} />
            <span className="font-semibold text-slate-700">{session.transactions_count.toLocaleString()}</span> transactions
          </div>
        </div>
      </div>
    </Card>
  );
}

function OAuthFlowCard() {
  return (
    <Card>
      <SectionHeader
        icon="M7 18a4.6 4.4 0 0 1 0-9 4.6 4.4 0 0 1 4.33 3H14l1 1-1 1h-1v2h-2v2H7zM20.33 12H22l-4 4-4-4h2.04A5 5 0 1 0 12 17h-2a7 7 0 1 1 10.33-5z"
        eyebrow="Section 01 · Authentication"
        title="Authentication Flow Detection"
        description="AI reconstructed authentication sequences from traffic patterns"
        accent="indigo"
        confidence={94}
      />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-3">
            Reconstructed sequence · 4 steps
          </div>
          <ol className="relative">
            {oauthFlow.map((step, i) => {
              const last = i === oauthFlow.length - 1;
              const failed = step.status >= 400;
              return (
                <li key={i} className="relative pl-12 pb-5 last:pb-0">
                  <div className={`absolute left-0 top-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 z-10 ${
                    failed ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-white text-indigo-600 border-indigo-200 shadow-sm'
                  }`}>{i + 1}</div>
                  {!last && <div className="absolute left-[18px] top-9 bottom-0 w-px border-l-2 border-dashed border-slate-200" />}
                  <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 hover:border-indigo-200 hover:shadow-sm hover:shadow-indigo-100/50 transition-all">
                    <div className="flex items-center flex-wrap gap-2">
                      <MethodBadge method={step.method} />
                      <code className="text-sm font-mono text-slate-800 font-medium">{step.path}</code>
                      <span className="ml-auto flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-mono font-semibold ${failed ? 'text-rose-600' : 'text-emerald-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${failed ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          {step.status} {step.statusText}
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <I d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4l4 2" size={11} />
                        {step.timing}ms
                      </span>
                      {step.note && <span>· {step.note}</span>}
                    </div>
                  </div>
                  {!last && (
                    <div className="ml-3 mt-1 mb-1 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      <I d="M12 5v14M5 12l7 7 7-7" size={10} />
                      &lt; {(oauthFlow[i + 1].timing + step.timing)}ms
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        <div className="lg:col-span-2">
          <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-3">AI Insights</div>
          <div className="rounded-xl bg-gradient-to-br from-indigo-50/40 to-violet-50/30 border border-indigo-100/60 p-3 divide-y divide-indigo-100/50">
            {oauthInsights.map((ins, i) => <InsightRow key={i} {...ins} />)}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 p-3">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Auth scheme</div>
              <div className="mt-1 font-semibold text-slate-800 text-sm">OAuth 2.0 + PKCE</div>
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Token type</div>
              <div className="mt-1 font-semibold text-slate-800 text-sm">JWT (HS256)</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SchemaInsightsCard() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <Card>
      <SectionHeader
        icon="M4 6h16M4 10h16M4 14h16M4 18h16"
        eyebrow="Section 02 · Schemas"
        title="Schema Intelligence"
        description="Type, range, and constraint inference across captured response bodies"
        accent="violet"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">{schemaResource.fields.length} fields</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">{schemaResource.samples} samples</span>
          </div>
        }
      />
      <div className="flex items-center flex-wrap gap-3 mb-4 px-3.5 py-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">{schemaResource.resource}</span>
        <code className="text-xs font-mono text-slate-700">{schemaResource.endpoint}</code>
        <div className="ml-auto flex items-center gap-2">
          {schemaResource.patterns.map((p, i) => (
            <span key={i} className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{p.label}</span>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50/60 border-b border-slate-100 text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400">
          <div className="col-span-3">Field</div><div className="col-span-3">Type</div>
          <div className="col-span-3">Range / Values</div><div className="col-span-1 text-center">Req</div><div className="col-span-2">Confidence</div>
        </div>
        <div className="divide-y divide-slate-100">
          {schemaResource.fields.map((f, i) => {
            const open = expanded === i;
            return (
              <div key={f.name}>
                <button onClick={() => setExpanded(open ? null : i)}
                  className="w-full grid grid-cols-12 gap-3 px-4 py-3 items-center text-left hover:bg-indigo-50/30 transition-colors">
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <I d="M9 18l6-6-6-6" size={12} className={`text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
                    <code className="font-mono font-semibold text-sm text-slate-800 truncate">{f.name}</code>
                    {f.nullable && <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200">nullable</span>}
                  </div>
                  <div className="col-span-3 text-xs font-mono text-violet-700 truncate">{f.type}</div>
                  <div className="col-span-3 text-xs text-slate-600 truncate">{f.range}</div>
                  <div className="col-span-1 flex justify-center">
                    {f.required
                      ? <I d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" size={14} className="text-emerald-500" />
                      : <span className="text-slate-300 text-xs">—</span>}
                  </div>
                  <div className="col-span-2"><ConfBar value={f.confidence} size="sm" /></div>
                </button>
                {open && (
                  <div className="px-4 pb-4 pt-1 bg-slate-50/40 border-t border-slate-100/80">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {[['Observations', `${f.samples} samples`], ['Required', f.required ? 'true' : 'false'], ['Nullable', f.nullable ? 'true' : 'false'], ['Confidence', `${f.confidence}%`]].map(([k, v]) => (
                        <div key={k}>
                          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">{k}</div>
                          <div className="font-mono text-slate-800">{v}</div>
                        </div>
                      ))}
                    </div>
                    {f.notes && <div className="mt-3 text-xs text-slate-600 italic">{f.notes}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function PredictedEndpointsCard() {
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState('');
  const addToSpec = (path: string) => {
    setAdded(prev => new Set(prev).add(path));
    setToast(`Added ${path} to spec`);
    setTimeout(() => setToast(''), 2000);
  };
  return (
    <Card gradient>
      <SectionHeader
        icon="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01L12 2z"
        eyebrow="Section 03 · Inference engine"
        title="Predicted Endpoints"
        description="Endpoints not observed in traffic but inferred from REST patterns"
        accent="indigo"
        actions={<span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{predictedEndpoints.length} predictions</span>}
      />
      <div className="space-y-2">
        {predictedEndpoints.map((p, i) => {
          const isAdded = added.has(p.path);
          const confColor = p.confidence >= 90 ? 'bg-emerald-50 text-emerald-700' : p.confidence >= 75 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600';
          return (
            <div key={i} className="group rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm hover:shadow-indigo-100/40 transition-all">
              <div className="flex items-center gap-3 p-3.5">
                <MethodBadge method={p.method} />
                <code className="font-mono text-sm font-medium text-slate-800 truncate">{p.path}</code>
                <div className="ml-auto flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${confColor}`}>{p.confidence}%</span>
                  {isAdded ? (
                    <button disabled className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg opacity-70">✓ Added</button>
                  ) : (
                    <button onClick={() => addToSpec(p.path)} className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                      + Add to spec
                    </button>
                  )}
                </div>
              </div>
              <div className="px-3.5 pb-3.5 flex items-start gap-2 text-xs text-slate-500">
                <span className="mt-0.5 shrink-0 text-indigo-400">◎</span>
                <div className="flex-1">
                  <span className="font-medium text-slate-700">Reason · </span>{p.reason}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {p.evidence.map((e, j) => (
                      <span key={j} className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-slate-500">◎ {e}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-emerald-500 text-white text-sm font-medium rounded-xl shadow-lg">{toast}</div>
      )}
    </Card>
  );
}

function RateLimitCard() {
  const remaining = rateLimitSeries[rateLimitSeries.length - 1].remaining;
  return (
    <Card>
      <SectionHeader
        icon="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        eyebrow="Section 04 · Throttling"
        title="Rate Limiting Analysis"
        description="Window detection, retry behavior, and per-endpoint throttle inference"
        accent="amber"
        actions={<span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">1 strict endpoint</span>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard label="Per Window" value="100" sublabel="requests" accent="indigo" />
        <StatCard label="Window"     value="60s"  sublabel="rolling"  accent="violet" />
        <StatCard label="Remaining"  value={remaining} sublabel="/ 100"   accent="emerald" />
        <StatCard label="Strict caps" value="1"   sublabel="endpoint" accent="amber" alert />
      </div>
      <div className="rounded-xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-400">Remaining requests</div>
            <div className="text-sm font-semibold text-slate-700 mt-0.5">Sliding 60-second window</div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-indigo-500 to-violet-500" />Remaining</span>
            <span className="inline-flex items-center gap-1.5 text-slate-500"><span className="w-2.5 h-px bg-rose-400 inline-block" />Window reset</span>
          </div>
        </div>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <AreaChart data={rateLimitSeries} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="rl-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="s" />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 10px 30px -10px rgba(15,23,42,0.15)' }}
                formatter={(v) => [v, 'remaining']} labelFormatter={(l) => `t = ${l}s`} />
              <ReferenceLine x={38} stroke="#fb7185" strokeDasharray="4 4" label={{ value: 'reset', position: 'top', fill: '#fb7185', fontSize: 10 }} />
              <Area type="monotone" dataKey="remaining" stroke="#6366f1" strokeWidth={2} fill="url(#rl-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-5 rounded-xl bg-gradient-to-br from-amber-50/60 to-rose-50/40 border border-amber-100 p-3 divide-y divide-amber-100/60">
        {rateLimitInsights.map((ins, i) => <InsightRow key={i} {...ins} />)}
      </div>
    </Card>
  );
}

function AiAnalysisTab({ loading }: { loading: boolean }) {
  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <Card key={i}><div className="animate-pulse space-y-3">{[1,2,3,4].map(j => <div key={j} className="h-4 bg-slate-100 rounded" />)}</div></Card>)}
    </div>
  );
  return (
    <div className="stagger space-y-5">
      <AiSummaryCard />
      <OAuthFlowCard />
      <SchemaInsightsCard />
      <PredictedEndpointsCard />
      <RateLimitCard />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: Overview
// ══════════════════════════════════════════════════════════════
function OverviewTab() {
  const series = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 24; i++) {
      arr.push({ h: i, v: Math.round(50 + Math.sin(i / 3) * 30 + Math.random() * 20) });
    }
    return arr;
  }, []);

  return (
    <div className="stagger space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Endpoints"    value={session.endpoints_count} sublabel="reconstructed" accent="indigo" />
        <StatCard label="Transactions" value={session.transactions_count.toLocaleString()} sublabel="captured" accent="violet" />
        <StatCard label="Coverage"     value={`${session.coverage}%`} sublabel="estimated" accent="emerald" />
        <StatCard label="Findings"     value="7" sublabel="2 high" accent="amber" alert />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2" padding="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-400">Request volume</div>
              <div className="text-base font-semibold text-slate-800">Last 24 hours</div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">+18% wow</span>
          </div>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <AreaChart data={series} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="ov-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="h" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="h" />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#8b5cf6" strokeWidth={2} fill="url(#ov-grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card padding="p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-slate-400">Methods</div>
          <div className="text-base font-semibold text-slate-800 mb-4">HTTP distribution</div>
          <div className="space-y-3">
            {([['GET', 64], ['POST', 22], ['PUT', 7], ['PATCH', 4], ['DELETE', 3]] as const).map(([m, pct]) => (
              <div key={m} className="flex items-center gap-3">
                <MethodBadge method={m as HttpMethod} className="w-16 justify-center" />
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-1.5 conf-bar rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-mono text-slate-500 tabular-nums w-8 text-right">{pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: Endpoints
// ══════════════════════════════════════════════════════════════
function EndpointsTab() {
  const [filter, setFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const methods = ['All', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  const filtered = endpointsList.filter(e =>
    (methodFilter === 'All' || e.method === methodFilter) &&
    (!filter || e.path.toLowerCase().includes(filter.toLowerCase()))
  );
  return (
    <div className="stagger space-y-4">
      <Card padding="p-4">
        <div className="flex items-center flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <I d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Filter by path…" value={filter} onChange={e => setFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {methods.map(m => (
              <button key={m} onClick={() => setMethodFilter(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${methodFilter === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </Card>
      <Card padding="p-0">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50/60 border-b border-slate-100 text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400">
          <div className="col-span-1">Method</div><div className="col-span-5">Path</div>
          <div className="col-span-2">Samples</div><div className="col-span-2">p95</div><div className="col-span-2">Confidence</div>
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No matching endpoints</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((e, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-indigo-50/30 transition-colors cursor-pointer">
                <div className="col-span-1"><MethodBadge method={e.method} /></div>
                <div className="col-span-5"><code className="font-mono text-sm text-slate-800">{e.path}</code></div>
                <div className="col-span-2 text-sm font-mono text-slate-600 tabular-nums">{e.samples}</div>
                <div className="col-span-2 text-sm font-mono text-slate-600 tabular-nums">{e.p95}ms</div>
                <div className="col-span-2"><ConfBar value={e.conf} size="sm" /></div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: Security
// ══════════════════════════════════════════════════════════════
function SecurityTab() {
  const counts = securityFindings.reduce((a, f) => ({ ...a, [f.severity]: (a[f.severity as keyof typeof a] ?? 0) + 1 }), {} as Record<string, number>);
  return (
    <div className="stagger space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(['critical', 'high', 'medium', 'low', 'info'] as Severity[]).map(k => (
          <Card key={k} padding="p-4">
            <div className="flex items-center justify-between">
              <SevBadge level={k} />
              <span className="text-2xl font-bold tabular-nums text-slate-800">{counts[k] ?? 0}</span>
            </div>
          </Card>
        ))}
      </div>
      <Card padding="p-0">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50/60 border-b border-slate-100 text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400">
          <div className="col-span-1">Severity</div><div className="col-span-5">Finding</div>
          <div className="col-span-3">Endpoint</div><div className="col-span-2">OWASP</div><div className="col-span-1 text-right">CVSS</div>
        </div>
        <div className="divide-y divide-slate-100">
          {securityFindings.map((f, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-rose-50/20 transition-colors">
              <div className="col-span-1"><SevBadge level={f.severity} /></div>
              <div className="col-span-5 text-sm font-medium text-slate-800">{f.title}</div>
              <div className="col-span-3"><code className="font-mono text-xs text-slate-600">{f.endpoint}</code></div>
              <div className="col-span-2 font-mono text-xs text-slate-500">{f.owasp}</div>
              <div className="col-span-1 text-right text-sm font-mono font-semibold text-slate-700 tabular-nums">{f.cvss}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB: Raw Traffic
// ══════════════════════════════════════════════════════════════
function RawTrafficTab() {
  return (
    <div className="stagger space-y-4">
      <Card padding="p-0">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">{rawTraffic.length} requests shown</span>
          <span className="text-xs text-slate-400 font-mono">acme-checkout-prod.har · 187s capture</span>
          <div className="ml-auto">
            <button className="text-xs text-slate-500 hover:text-slate-700 font-medium">Export HAR</button>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50/60 border-b border-slate-100 text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400 font-mono">
          <div className="col-span-2">Time</div><div className="col-span-1">Method</div>
          <div className="col-span-6">Path</div><div className="col-span-1">Status</div><div className="col-span-2 text-right">Duration</div>
        </div>
        <div className="divide-y divide-slate-100 font-mono text-xs">
          {rawTraffic.map((r, i) => {
            const fail = r.status >= 400;
            return (
              <div key={i} className="grid grid-cols-12 gap-3 px-4 py-2.5 items-center hover:bg-indigo-50/30 transition-colors">
                <div className="col-span-2 text-slate-500">{r.ts}</div>
                <div className="col-span-1"><MethodBadge method={r.method} /></div>
                <div className="col-span-6 text-slate-800">{r.path}</div>
                <div className={`col-span-1 font-semibold ${fail ? 'text-rose-600' : 'text-emerald-600'}`}>{r.status}</div>
                <div className="col-span-2 text-right text-slate-600 tabular-nums">{r.ms}ms</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Main SessionDetailPage
// ══════════════════════════════════════════════════════════════
const TABS = [
  { id: 'overview',  label: 'Overview',    icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { id: 'endpoints', label: 'Endpoints',   icon: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zM2 12h20', count: 47 },
  { id: 'ai',        label: 'AI Analysis', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01L12 2z', primary: true },
  { id: 'security',  label: 'Security',    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', count: 7, alert: true },
  { id: 'raw',       label: 'Raw Traffic', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
] as const;
type TabId = typeof TABS[number]['id'];

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>('ai');
  const [enriching, setEnriching] = useState(false);
  const [enriched, setEnriched] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  void id;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }, []);

  const handleEnrich = useCallback(async () => {
    setEnriching(true);
    showToast('AI enrichment started…');
    await new Promise(r => setTimeout(r, 1800));
    setEnriching(false);
    setEnriched(true);
    showToast('AI enrichment complete · 91% overall confidence');
  }, [showToast]);

  const ago = useMemo(() => {
    const ms = Date.now() - new Date(session.created_at).getTime();
    const m = Math.floor(ms / 60000);
    return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
  }, []);

  // Preload the page to 'ai' tab only after simulated load
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  const tabContent = (() => {
    if (loading) return <Card><div className="animate-pulse space-y-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-4 bg-slate-100 rounded" />)}</div></Card>;
    if (activeTab === 'overview')  return <OverviewTab />;
    if (activeTab === 'endpoints') return <EndpointsTab />;
    if (activeTab === 'security')  return <SecurityTab />;
    if (activeTab === 'raw')       return <RawTrafficTab />;
    return <AiAnalysisTab loading={enriching} />;
  })();

  return (
    <AppLayout breadcrumb={{ parent: 'My Sessions', current: session.name }}>
      <div className="flex flex-col gap-5">
        {/* ── Page header ── */}
        <div className="animate-fade-up">
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-200/30 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-violet-200/30 blur-3xl" />
              <div className="absolute inset-0 dot-grid opacity-[0.07]" />
            </div>
            <div className="relative p-6 lg:p-7">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                <Link to="/sessions" className="hover:text-indigo-600 transition-colors">My Sessions</Link>
                <I d="M9 18l6-6-6-6" size={11} className="text-slate-300" />
                <span className="font-medium text-slate-700">{session.name}</span>
              </div>
              <div className="flex items-start gap-5 flex-wrap">
                <div className="flex-1 min-w-[280px]">
                  <div className="flex items-center flex-wrap gap-3">
                    <h1 className="text-[28px] font-bold tracking-tight text-slate-900 leading-tight">{session.name}</h1>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />completed
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">HAR</span>
                    {enriched && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                        <I d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01L12 2z" size={11} className="sparkle" />
                        AI Enriched
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <I d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" size={13} />
                      <code className="font-mono text-slate-700">{session.base_url}</code>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <I d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4l4 2" size={13} />
                      Captured {ago}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <I d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zM2 12h20" size={13} />
                      <span className="font-semibold text-slate-700">{session.endpoints_count}</span> endpoints
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <I d="M22 12h-4l-3 9L9 3l-3 9H2" size={13} />
                      <span className="font-semibold text-slate-700">{session.transactions_count.toLocaleString()}</span> transactions
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all">
                    <I d="M6 3v12M18 9v12M6 15H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2zM18 3h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" size={16} />
                    Compare
                  </button>
                  <button onClick={handleEnrich} disabled={enriching}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-60">
                    <I d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01L12 2z" size={16} className="sparkle" />
                    {enriching ? 'Enriching…' : enriched ? 'Re-run AI Enrichment' : 'Run AI Enrichment'}
                  </button>
                  <button onClick={() => showToast('OpenAPI 3.1 spec downloaded')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200 transition-all">
                    <I d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={16} />
                    Export OpenAPI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="animate-fade-up border-b border-slate-200" style={{ animationDelay: '60ms' }}>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {TABS.map(t => {
              const isActive = activeTab === t.id;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`relative px-4 py-3 inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? 'text-indigo-600 tab-active' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {'primary' in t && t.primary && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                  )}
                  <I d={t.icon} size={15} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  {t.label}
                  {'count' in t && t.count != null && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      'alert' in t && t.alert
                        ? 'bg-amber-100 text-amber-700'
                        : isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}>{t.count}</span>
                  )}
                  {'primary' in t && t.primary && isActive && (
                    <I d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01L12 2z" size={11} className="sparkle text-violet-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div key={activeTab} className="animate-fade-in">{tabContent}</div>

        <footer className="pt-4 pb-2 text-center text-xs text-slate-400">
          ARIA · API Intelligence · Session <code className="font-mono">{session.id}</code>
        </footer>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl shadow-lg animate-fade-up">
          {toastMsg}
        </div>
      )}
    </AppLayout>
  );
}
