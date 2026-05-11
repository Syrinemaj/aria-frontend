import {
  useState, useEffect, useCallback, useMemo,
  createContext, useContext,
  type ReactNode, type FC,
} from 'react';
import type { Tone, ToastMessage, TableColumn } from '../../types';

// ── Icons (inline stroke) ─────────────────────────────────────
type IconProps = { size?: number; className?: string; strokeWidth?: number };
const Ic = (paths: ReactNode) => ({ size = 16, className = '', strokeWidth = 1.8 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    className={className} aria-hidden="true">{paths}</svg>
);
export const Icons = {
  LayoutDashboard: Ic(<><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>),
  Folder:     Ic(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>),
  Layers:     Ic(<><path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/></>),
  Activity:   Ic(<path d="M22 12h-4l-3 9-6-18-3 9H2"/>),
  Sparkles:   Ic(<><path d="M12 3v3"/><path d="M12 18v3"/><path d="M5 12H2"/><path d="M22 12h-3"/><path d="m6 6 1.8 1.8"/><path d="m16.2 16.2 1.8 1.8"/><path d="m6 18 1.8-1.8"/><path d="m16.2 7.8 1.8-1.8"/></>),
  Shield:     Ic(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>),
  ShieldAlert:Ic(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 8v4"/><path d="M12 16h.01"/></>),
  Settings:   Ic(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>),
  Bell:       Ic(<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>),
  Search:     Ic(<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>),
  ChevronRight: Ic(<path d="m9 6 6 6-6 6"/>),
  ChevronDown:  Ic(<path d="m6 9 6 6 6-6"/>),
  ArrowRight:   Ic(<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>),
  Plus:     Ic(<><path d="M12 5v14"/><path d="M5 12h14"/></>),
  X:        Ic(<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>),
  Check:    Ic(<path d="M5 13l4 4L19 7"/>),
  CheckCircle: Ic(<><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></>),
  AlertCircle: Ic(<><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></>),
  AlertTriangle: Ic(<><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>),
  Info:     Ic(<><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>),
  Clock:    Ic(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  Copy:     Ic(<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>),
  Download: Ic(<><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>),
  Upload:   Ic(<><path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/></>),
  Eye:      Ic(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>),
  GitBranch:Ic(<><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></>),
  Zap:      Ic(<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/>),
  Bot:      Ic(<><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 4v4"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M9 18h6"/><path d="M2 14v2"/><path d="M22 14v2"/></>),
  Brain:    Ic(<><path d="M9.5 2A3.5 3.5 0 0 0 6 5.5V6a3 3 0 0 0-2 5.6 3 3 0 0 0 2 5.4v.5A3.5 3.5 0 0 0 9.5 21H10V2h-.5Z"/><path d="M14.5 2A3.5 3.5 0 0 1 18 5.5V6a3 3 0 0 1 2 5.6 3 3 0 0 1-2 5.4v.5A3.5 3.5 0 0 1 14.5 21H14V2h.5Z"/></>),
  Database: Ic(<><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>),
  TrendingUp:   Ic(<><path d="m22 7-9.5 9.5-5-5L2 17"/><path d="M16 7h6v6"/></>),
  TrendingDown: Ic(<><path d="m22 17-9.5-9.5-5 5L2 7"/><path d="M16 17h6v-6"/></>),
  Filter:   Ic(<path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z"/>),
  Send:     Ic(<><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="m22 2-11 11"/></>),
  Globe:    Ic(<><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18Z"/></>),
  RefreshCw:Ic(<><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 21v-5h5"/><path d="M21 3v5h-5"/></>),
  LogOut:   Ic(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>),
  PanelLeft:Ic(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></>),
  Compass:  Ic(<><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/></>),
  Code:     Ic(<><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></>),
  Lock:     Ic(<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>),
  Mail:     Ic(<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>),
  User:     Ic(<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>),
  Cpu:      Ic(<><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/></>),
};

// ── Button ────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'soft';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: FC<IconProps>;
  iconRight?: FC<IconProps>;
  loading?: boolean;
}

const btnBase = 'inline-flex items-center gap-2 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none';
const btnSize: Record<ButtonSize, string> = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2', lg: 'px-5 py-2.5' };
const btnVariants: Record<ButtonVariant, string> = {
  primary:   'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200',
  secondary: 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50',
  ghost:     'text-slate-600 hover:bg-slate-100',
  danger:    'bg-gradient-to-r from-red-500 to-red-600 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-200',
  success:   'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-200',
  soft:      'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
};

export function Button({ variant = 'primary', size = 'md', icon: Icon, iconRight: IconR, loading, children, className = '', ...rest }: ButtonProps) {
  return (
    <button className={`${btnBase} ${btnSize[size]} ${btnVariants[variant]} ${className}`} {...rest}>
      {loading ? <Icons.RefreshCw size={14} className="animate-spin" /> : Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
      {IconR && <IconR size={size === 'sm' ? 14 : 16} />}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────
interface CardProps { children: ReactNode; className?: string; padding?: string; gradient?: boolean }
export function Card({ children, className = '', padding = 'p-6', gradient = false }: CardProps) {
  if (gradient) return <div className={`card-grad-border shadow-sm shadow-slate-200/40 ${padding} ${className}`}>{children}</div>;
  return <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/60 ${padding} ${className}`}>{children}</div>;
}

// ── Badge ─────────────────────────────────────────────────────
const badgeBase = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap';
const badgeTones: Record<Tone, string> = {
  slate:   'bg-slate-50 text-slate-600 border border-slate-200',
  indigo:  'bg-indigo-50 text-indigo-700 border border-indigo-200',
  violet:  'bg-violet-50 text-violet-700 border border-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  amber:   'bg-amber-50 text-amber-700 border border-amber-200',
  rose:    'bg-rose-50 text-rose-700 border border-rose-200',
  blue:    'bg-blue-50 text-blue-700 border border-blue-200',
};

interface BadgeProps { tone?: Tone; children: ReactNode; icon?: FC<IconProps>; dot?: boolean; className?: string }
export function Badge({ tone = 'slate', children, icon: Icon, dot, className = '' }: BadgeProps) {
  return (
    <span className={`${badgeBase} ${badgeTones[tone]} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

const methodColors: Record<string, string> = {
  GET:    'bg-blue-50 text-blue-700 border border-blue-200',
  POST:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PUT:    'bg-amber-50 text-amber-700 border border-amber-200',
  DELETE: 'bg-red-50 text-red-700 border border-red-200',
  PATCH:  'bg-violet-50 text-violet-700 border border-violet-200',
};
export function MethodBadge({ method, className = '' }: { method: string; className?: string }) {
  return <span className={`${badgeBase} ${methodColors[method] ?? badgeTones.slate} font-mono font-semibold tracking-wide ${className}`}>{method}</span>;
}

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  parsing:   'bg-blue-50 text-blue-700 border border-blue-200',
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  failed:    'bg-red-50 text-red-700 border border-red-200',
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  approved:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected:  'bg-red-50 text-red-700 border border-red-200',
  training:  'bg-blue-50 text-blue-700 border border-blue-200',
  deprecated:'bg-slate-50 text-slate-600 border border-slate-200',
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`${badgeBase} ${statusColors[status] ?? badgeTones.slate} capitalize`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border border-red-300 font-semibold',
  high:     'bg-orange-50 text-orange-700 border border-orange-200',
  medium:   'bg-amber-50 text-amber-700 border border-amber-200',
  low:      'bg-yellow-50 text-yellow-700 border border-yellow-200',
  info:     'bg-blue-50 text-blue-700 border border-blue-200',
};
export function SeverityBadge({ level }: { level: string }) {
  return <span className={`${badgeBase} ${severityColors[level] ?? badgeTones.slate} uppercase tracking-wider text-[10px]`}>{level}</span>;
}

// ── StatCard ──────────────────────────────────────────────────
interface StatCardProps {
  label: string; value: string | number; sublabel?: string;
  icon?: FC<IconProps>; accent?: string; trend?: string; trendUp?: boolean; alert?: boolean;
}
const accentMap: Record<string, [string, string]> = {
  indigo:  ['text-indigo-600',  'bg-indigo-50'],
  violet:  ['text-violet-600',  'bg-violet-50'],
  emerald: ['text-emerald-600', 'bg-emerald-50'],
  amber:   ['text-amber-600',   'bg-amber-50'],
  rose:    ['text-rose-600',    'bg-rose-50'],
  blue:    ['text-blue-600',    'bg-blue-50'],
};
export function StatCard({ label, value, sublabel, icon: Icon, accent = 'indigo', trend, trendUp, alert = false }: StatCardProps) {
  const [iconColor, iconBg] = accentMap[accent] ?? accentMap.indigo;
  return (
    <Card padding="p-5" className={alert ? 'ring-1 ring-amber-200 animate-pulse-glow' : ''}>
      <div className="flex items-start justify-between">
        <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400">{label}</div>
        {Icon && <div className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}><Icon size={14} /></div>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</div>
        {sublabel && <div className="text-xs text-slate-400 font-mono">{sublabel}</div>}
      </div>
      {trend && (
        <div className={`mt-2 inline-flex items-center gap-1 text-xs ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trendUp ? <Icons.TrendingUp size={12} /> : <Icons.TrendingDown size={12} />}
          {trend}
        </div>
      )}
    </Card>
  );
}

// ── Table ─────────────────────────────────────────────────────
interface TableProps<T> { columns: TableColumn<T>[]; rows: T[]; onRowClick?: (row: T) => void; emptyLabel?: string }
export function Table<T extends object>({ columns, rows, onRowClick, emptyLabel = 'No data' }: TableProps<T>) {
  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
      <div className="grid overflow-x-auto">
        <div className={`grid px-4 py-2.5 bg-slate-50/60 border-b border-slate-100 text-[10px] font-semibold tracking-[0.16em] uppercase text-slate-400`}
          style={{ gridTemplateColumns: columns.map(c => c.width ?? '1fr').join(' ') }}>
          {columns.map(c => <div key={String(c.key)}>{c.label}</div>)}
        </div>
        {rows.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-400">{emptyLabel}</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((row, i) => (
              <div key={i}
                onClick={() => onRowClick?.(row)}
                className={`grid px-4 py-3 items-center text-sm ${onRowClick ? 'cursor-pointer hover:bg-indigo-50/30' : ''} transition-colors`}
                style={{ gridTemplateColumns: columns.map(c => c.width ?? '1fr').join(' ') }}>
                {columns.map(c => (
                  <div key={String(c.key)}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[String(c.key)] ?? '')}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }
export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-xl', lg: 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${widths[size]} bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col animate-fade-up max-h-[90vh]`}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"><Icons.X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────
const ToastCtx = createContext<{ success:(m:string)=>void; error:(m:string)=>void; info:(m:string)=>void; warning:(m:string)=>void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const push = useCallback((type: ToastMessage['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), type === 'error' ? 5000 : 3000);
  }, []);
  const api = useMemo(() => ({
    success: (m: string) => push('success', m),
    error:   (m: string) => push('error',   m),
    info:    (m: string) => push('info',    m),
    warning: (m: string) => push('warning', m),
  }), [push]);

  const icons = { success: Icons.CheckCircle, error: Icons.AlertCircle, info: Icons.Info, warning: Icons.AlertTriangle };
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    info:    'bg-indigo-50 border-indigo-200 text-indigo-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(t => {
          const TIcon = icons[t.type];
          return (
            <div key={t.id} className={`animate-fade-up flex items-start gap-2 ${styles[t.type]} border rounded-xl px-3.5 py-2.5 shadow-md pointer-events-auto`}>
              <TIcon size={16} className="mt-0.5 shrink-0" />
              <div className="text-sm font-medium">{t.message}</div>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast outside ToastProvider');
  return ctx;
};

// ── SectionHeader ─────────────────────────────────────────────
interface SectionHeaderProps { icon?: FC<IconProps>; eyebrow?: string; title: string; description?: string; accent?: string; actions?: ReactNode }
const accentBgMap: Record<string, string> = {
  indigo: 'bg-indigo-50 text-indigo-600', violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600', emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600',
};
export function SectionHeader({ icon: Icon, eyebrow, title, description, accent = 'indigo', actions }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-4 mb-5">
      {Icon && <div className={`shrink-0 w-10 h-10 rounded-xl ${accentBgMap[accent] ?? accentBgMap.indigo} flex items-center justify-center`}><Icon size={18} /></div>}
      <div className="flex-1 min-w-0">
        {eyebrow && <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400 mb-1">{eyebrow}</div>}
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── ConfidenceBar ─────────────────────────────────────────────
export function ConfidenceBar({ value, showLabel = true }: { value: number; showLabel?: boolean }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-1.5 conf-bar rounded-full transition-all duration-700" style={{ width: `${value}%` }} />
      </div>
      {showLabel && <span className="text-xs font-mono text-slate-500 tabular-nums">{value}%</span>}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ icon: Icon = Icons.Database, title, description, action }: { icon?: FC<IconProps>; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mb-4"><Icon size={26} strokeWidth={1.6} /></div>
      <div className="text-base font-semibold text-slate-700">{title}</div>
      {description && <div className="text-sm text-slate-500 mt-1 max-w-sm">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`relative overflow-hidden bg-slate-100 rounded-md ${className}`}><div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" /></div>;
}
