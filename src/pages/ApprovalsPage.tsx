import { useState } from 'react';
import { AppLayout } from '../components/layout';
import type { Approval, ApprovalStatus } from '../types';

const APPROVALS: Approval[] = [
  { id: 'a1', type: 'session',  title: 'Analyse production HAR for Stripe v3',    requester: 'Léa Martin',    requester_email: 'lea@acme.com',    created_at: '2024-12-01T08:30:00Z', status: 'pending',  priority: 'high',   description: 'Need to analyse recent production traffic to identify breaking changes before v3 migration.' },
  { id: 'a2', type: 'export',   title: 'Export OpenAPI spec for partner portal',   requester: 'David Chen',    requester_email: 'dchen@acme.com',   created_at: '2024-12-01T07:00:00Z', status: 'pending',  priority: 'medium', description: 'Partner requires updated spec for their SDK generation pipeline.' },
  { id: 'a3', type: 'model',    title: 'Deploy anomaly detection model v2.4',      requester: 'Priya Nair',    requester_email: 'priya@acme.com',   created_at: '2024-11-30T16:45:00Z', status: 'approved', priority: 'high',   description: 'New model reduces false positives by 34%. Ready for staging deployment.' },
  { id: 'a4', type: 'access',   title: 'Viewer access for security audit team',    requester: 'Tom Bradley',   requester_email: 'tom@audit.io',     created_at: '2024-11-30T14:00:00Z', status: 'rejected', priority: 'low',    description: 'External audit team needs read-only access to session data for compliance review.' },
  { id: 'a5', type: 'session',  title: 'HAR capture for mobile app v4.2',          requester: 'Sara Okonkwo',  requester_email: 'sara@acme.com',    created_at: '2024-11-29T11:00:00Z', status: 'pending',  priority: 'medium', description: 'Mobile team needs API documentation for new checkout flow.' },
  { id: 'a6', type: 'export',   title: 'Bulk export: all sessions Q4 2024',        requester: 'Marc Dupont',   requester_email: 'marc@acme.com',    created_at: '2024-11-28T09:00:00Z', status: 'pending',  priority: 'low',    description: 'Quarterly compliance export for legal team archival.' },
];

const TYPE_STYLE: Record<string, string> = {
  session: 'bg-indigo-50 text-indigo-700',
  export:  'bg-violet-50 text-violet-700',
  model:   'bg-blue-50 text-blue-700',
  access:  'bg-slate-100 text-slate-600',
};

const PRIORITY_STYLE: Record<string, string> = {
  high:   'text-rose-600 bg-rose-50 border-rose-100',
  medium: 'text-amber-600 bg-amber-50 border-amber-100',
  low:    'text-slate-500 bg-slate-50 border-slate-200',
};

const STATUS_STYLE: Record<ApprovalStatus, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-700 border-rose-100',
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const h  = Math.floor(ms / 3_600_000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ApprovalsPage() {
  const [items, setItems]     = useState(APPROVALS);
  const [filter, setFilter]   = useState<ApprovalStatus | 'all'>('all');
  const [selected, setSelected] = useState<Approval | null>(null);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function act(id: string, status: 'approved' | 'rejected') {
    setItems(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setSelected(null);
    showToast(status === 'approved' ? 'Request approved' : 'Request rejected', status === 'approved');
  }

  const displayed = filter === 'all' ? items : items.filter(a => a.status === filter);
  const counts = {
    all:      items.length,
    pending:  items.filter(a => a.status === 'pending').length,
    approved: items.filter(a => a.status === 'approved').length,
    rejected: items.filter(a => a.status === 'rejected').length,
  };

  return (
    <AppLayout title="Approvals">
      <div className="space-y-5 stagger">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Approval Queue</h1>
            <p className="text-sm text-slate-500 mt-0.5">{counts.pending} pending request{counts.pending !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f} {counts[f] > 0 && <span className="ml-1 opacity-70">({counts[f]})</span>}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 font-medium border-b border-slate-100">
                <th className="text-left px-5 py-3">Request</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Type</th>
                <th className="text-left px-3 py-3 hidden lg:table-cell">Requester</th>
                <th className="text-left px-3 py-3 hidden sm:table-cell">Priority</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="text-left px-3 py-3 hidden md:table-cell">Submitted</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayed.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/60 cursor-pointer group transition-colors" onClick={() => setSelected(a)}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">{a.title}</p>
                  </td>
                  <td className="px-3 py-3.5 hidden md:table-cell">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${TYPE_STYLE[a.type]}`}>{a.type}</span>
                  </td>
                  <td className="px-3 py-3.5 hidden lg:table-cell">
                    <p className="text-slate-700">{a.requester}</p>
                    <p className="text-xs text-slate-400">{a.requester_email}</p>
                  </td>
                  <td className="px-3 py-3.5 hidden sm:table-cell">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${PRIORITY_STYLE[a.priority]}`}>{a.priority}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="px-3 py-3.5 hidden md:table-cell text-xs text-slate-400">{timeAgo(a.created_at)}</td>
                  <td className="px-3 py-3.5">
                    {a.status === 'pending' && (
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={() => act(a.id, 'approved')} className="px-2.5 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 transition-colors">Approve</button>
                        <button onClick={() => act(a.id, 'rejected')} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">No {filter} requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md capitalize ${TYPE_STYLE[selected.type]}`}>{selected.type}</span>
                <h2 className="text-base font-bold text-slate-900">{selected.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 font-medium">Requested by</p>
                <p className="text-slate-800 font-semibold mt-0.5">{selected.requester}</p>
                <p className="text-slate-400">{selected.requester_email}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-slate-400 font-medium">Priority</p>
                <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full border capitalize ${PRIORITY_STYLE[selected.priority]}`}>{selected.priority}</span>
              </div>
            </div>
            {selected.status === 'pending' && (
              <div className="flex gap-3 pt-1">
                <button onClick={() => act(selected.id, 'approved')} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">Approve</button>
                <button onClick={() => act(selected.id, 'rejected')} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-rose-50 hover:text-rose-700 transition-colors">Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.ok ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.msg}
        </div>
      )}
    </AppLayout>
  );
}
