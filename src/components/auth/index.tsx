import { type InputHTMLAttributes, type ReactNode, type FC } from 'react';

// ── AuthInput ─────────────────────────────────────────────────
interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: FC<{ size?: number; className?: string }>;
  error?: string;
  rightElement?: ReactNode;
}
export function AuthInput({ label, icon: Icon, error, rightElement, className = '', ...rest }: AuthInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${rightElement ? 'pr-12' : 'pr-4'} py-2.5 bg-white border ${error ? 'border-rose-400 focus:ring-rose-500/30 focus:border-rose-400' : 'border-slate-200 focus:ring-indigo-500/30 focus:border-indigo-400'} rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${className}`}
          {...rest}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

// ── AuthButton ────────────────────────────────────────────────
interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'outline';
}
export function AuthButton({ loading, variant = 'primary', children, className = '', ...rest }: AuthButtonProps) {
  const base = 'w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed';
  const styles = {
    primary: 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-200/60',
    outline: 'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50',
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// ── AriaLogo ──────────────────────────────────────────────────
export function AriaLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const logoSize = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14' }[size];
  const textSize = { sm: 'text-lg', md: 'text-xl', lg: 'text-3xl' }[size];
  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${logoSize} shrink-0`}>
        <svg viewBox="0 0 36 36" fill="none" className={`${logoSize} drop-shadow-sm`}>
          <defs>
            <linearGradient id="aria-g" x1="4" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
            </linearGradient>
          </defs>
          <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="url(#aria-g)" stroke="white" strokeWidth="1"/>
          <path d="M10 22L16 12L18 16L20 10L26 22" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="10" cy="22" r="1.6" fill="#38BDF8"/>
          <circle cx="18" cy="16" r="1.6" fill="#C084FC"/>
          <circle cx="26" cy="22" r="1.6" fill="#34D399"/>
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${textSize} font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent`}>aria</span>
        <span className="text-[9px] uppercase tracking-[0.22em] text-slate-400 font-semibold mt-0.5">API Intelligence</span>
      </div>
    </div>
  );
}
