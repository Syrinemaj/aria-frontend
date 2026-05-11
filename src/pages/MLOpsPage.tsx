import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AppLayout } from '../components/layout';
import type { MLModel, ModelStatus } from '../types';

const MODELS: MLModel[] = [
  { id: 'm1', name: 'Anomaly Detector',    version: 'v3.2.1', status: 'active',     accuracy: 97.4, latency_ms: 12,  requests_per_day: 84320, last_trained: '2024-11-28', framework: 'PyTorch',    description: 'Detects anomalous API traffic patterns using isolation forest + transformer.' },
  { id: 'm2', name: 'Schema Inferer',      version: 'v2.1.0', status: 'active',     accuracy: 94.1, latency_ms: 34,  requests_per_day: 23100, last_trained: '2024-11-25', framework: 'scikit-learn', description: 'Infers JSON schemas and type annotations from raw request/response bodies.' },
  { id: 'm3', name: 'Endpoint Classifier', version: 'v1.8.3', status: 'training',   accuracy: 91.2, latency_ms: 8,   requests_per_day: 0,     last_trained: '2024-12-01', framework: 'TensorFlow', description: 'Classifies API endpoints by OWASP category and business domain.' },
  { id: 'm4', name: 'Rate Limit Predictor',version: 'v2.0.0', status: 'active',     accuracy: 88.9, latency_ms: 5,   requests_per_day: 41200, last_trained: '2024-11-20', framework: 'XGBoost',    description: 'Predicts optimal rate limit thresholds per endpoint based on historical usage.' },
  { id: 'm5', name: 'Threat Scorer',       version: 'v4.0.0', status: 'deprecated', accuracy: 82.3, latency_ms: 18,  requests_per_day: 1230,  last_trained: '2024-09-10', framework: 'PyTorch',    description: 'Legacy CVSS score predictor — replaced by v4.1 in staging.' },
  { id: 'm6', name: 'Auth Flow Analyser',  version: 'v1.0.2', status: 'failed',     accuracy: 0,    latency_ms: 0,   requests_per_day: 0,     last_trained: '2024-12-01', framework: 'ONNX',       description: 'Identifies authentication patterns across sessions. Training failed due to OOM.' },
];

const PERF_DATA = [
  { day: 'Nov 25', accuracy: 93.1, latency: 14 },
  { day: 'Nov 26', accuracy: 94.2, latency: 13 },
  { day: 'Nov 27', accuracy: 94.8, latency: 13 },
  { day: 'Nov 28', accuracy: 95.1, latency: 12 },
  { day: 'Nov 29', accuracy: 96.0, latency: 12 },
  { day: 'Nov 30', accuracy: 97.1, latency: 12 },
  { day: 'Dec 01', accuracy: 97.4, latency: 12 },
];

const USAGE_DATA = [
  { name: 'Anomaly', rps: 975 },
  { name: 'Schema',  rps: 267 },
  { name: 'Classifier', rps: 0 },
  { name: 'Rate',    rps: 477 },
  { name: 'Threat',  rps: 14  },
  { name: 'Auth',    rps: 0   },
];

const STATUS_STYLE: Record<ModelStatus, string> = {
  active:     'bg-emerald-50 text-emerald-700 border-emerald-100',
  training:   'bg-blue-50 text-blue-700 border-blue-100',
  deprecated: 'bg-slate-100 text-slate-500 border-slate-200',
  failed:     'bg-rose-50 text-rose-700 border-rose-100',
};

const STATUS_DOT: Record<ModelStatus, string> = {
  active:     'bg-emerald-400',
  training:   'bg-blue-400 animate-pulse',
  deprecated: 'bg-slate-300',
  failed:     'bg-rose-400',
};

export default function MLOpsPage() {
  const [selected, setSelected] = useState<MLModel | null>(null);
  const [filter, setFilter]     = useState<ModelStatus | 'all'>('all');

  const displayed = filter === 'all' ? MODELS : MODELS.filter(m => m.status === filter);

  return (
    <AppLayout title="MLOps">
      <div className="space-y-5 stagger">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Model Registry</h1>
            <p className="text-sm text-slate-500 mt-0.5">{MODELS.filter(m => m.status === 'active').length} models active</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200/60 transition-all">
            Deploy Model
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active models',    value: `${MODELS.filter(m => m.status === 'active').length}`,     color: 'text-emerald-600' },
            { label: 'Training',         value: `${MODELS.filter(m => m.status === 'training').length}`,   color: 'text-blue-600'    },
            { label: 'Avg accuracy',     value: `${(MODELS.filter(m=>m.status==='active').reduce((a,m)=>a+m.accuracy,0)/MODELS.filter(m=>m.status==='active').length).toFixed(1)}%`, color: 'text-indigo-600' },
            { label: 'Requests / day',   value: `${(MODELS.reduce((a,m)=>a+m.requests_per_day,0)/1000).toFixed(0)}k`, color: 'text-violet-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Anomaly Detector — 7-day trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Accuracy (%) & latency (ms)</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={PERF_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Line type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2} dot={false} name="Accuracy %" />
                <Line type="monotone" dataKey="latency"  stroke="#10b981" strokeWidth={2} dot={false} name="Latency ms" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Inference throughput</h3>
              <p className="text-xs text-slate-400 mt-0.5">Requests per second (avg today)</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={USAGE_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="rps" fill="#8b5cf6" radius={[4,4,0,0]} name="Req/s" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm">
          {(['all','active','training','deprecated','failed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{f}</button>
          ))}
        </div>

        {/* Model cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map(m => (
            <div key={m.id} onClick={() => setSelected(m)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[m.status]}`} />
                    <p className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">{m.name}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{m.version} · {m.framework}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize shrink-0 ${STATUS_STYLE[m.status]}`}>{m.status}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{m.description}</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-xl p-2">
                  <p className="text-sm font-bold text-slate-700">{m.accuracy > 0 ? `${m.accuracy}%` : '—'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Accuracy</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2">
                  <p className="text-sm font-bold text-slate-700">{m.latency_ms > 0 ? `${m.latency_ms}ms` : '—'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Latency</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2">
                  <p className="text-sm font-bold text-slate-700">{m.requests_per_day > 0 ? `${(m.requests_per_day/1000).toFixed(0)}k` : '—'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Req/day</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Trained {m.last_trained}</span>
                {m.status === 'active' && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[selected.status]}`} />
                  <h2 className="text-base font-bold text-slate-900">{selected.name}</h2>
                </div>
                <p className="text-xs text-slate-400 font-mono">{selected.version} · {selected.framework}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Accuracy',    value: selected.accuracy > 0 ? `${selected.accuracy}%` : 'N/A' },
                { label: 'Latency',     value: selected.latency_ms > 0 ? `${selected.latency_ms}ms` : 'N/A' },
                { label: 'Requests/day', value: selected.requests_per_day > 0 ? `${(selected.requests_per_day/1000).toFixed(1)}k` : 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-800">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              {selected.status === 'active' && <button className="flex-1 py-2.5 border border-rose-200 text-rose-600 text-sm font-semibold rounded-xl hover:bg-rose-50 transition-colors">Deprecate</button>}
              {selected.status === 'deprecated' && <button className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">Re-activate</button>}
              {selected.status === 'failed' && <button className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">Retry Training</button>}
              <button className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">View Logs</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
