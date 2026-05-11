import { type ReactNode, useState, useMemo } from 'react';
import { NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// ── SVG Icon helper ───────────────────────────────────────────
function Ic({ d, size = 16, className = '' }: { d: string | string[]; size?: number; className?: string }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}

// ── ARIA Logo ─────────────────────────────────────────────────
function AriaLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-9 h-9 shrink-0">
        <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9 drop-shadow-sm">
          <defs>
            <linearGradient id="aria-grad" x1="4" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="url(#aria-grad)" stroke="white" strokeWidth="1" />
          <path d="M10 22L16 12L18 16L20 10L26 22" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="10" cy="22" r="1.6" fill="#38BDF8" />
          <circle cx="18" cy="16" r="1.6" fill="#C084FC" />
          <circle cx="26" cy="22" r="1.6" fill="#34D399" />
        </svg>
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">aria</span>
          <span className="text-[9px] uppercase tracking-[0.22em] text-slate-400 font-semibold mt-0.5">API Intelligence</span>
        </div>
      )}
    </div>
  );
}

// ── Nav definition ────────────────────────────────────────────
const NAV = [
  { to: '/dashboard',  label: 'Dashboard',        icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { to: '/sessions',   label: 'My Sessions',      icon: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zM2 12h20' },
  { to: '/breaking',   label: 'Breaking Changes', icon: 'M6 3v12M18 9v12M6 15H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2zM18 3h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z', badge: '7' },
  { to: '/simulation', label: 'Simulation',       icon: 'M22 12h-4l-3 9L9 3l-3 9H2', badge: 'NEW' },
  { to: '/tests',      label: 'Test Generation',  icon: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M13 2v7h7' },
  { to: '/explorer',   label: 'API Explorer',     icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4l3 3' },
  { to: '/sdk',        label: 'SDK Downloads',    icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3' },
  { to: '/chatbot',    label: 'AI Chat',          icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', badge: 'AI' },
  { to: '/settings',   label: 'Settings',         icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
];

// ── Sidebar ───────────────────────────────────────────────────
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();

  return (
    <>
      {open && (
        <div onClick={onClose} className="lg:hidden fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" />
      )}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0
        bg-white border-r border-slate-100
        flex flex-col
        transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-slate-100">
          <AriaLogo />
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
            <Ic d="M18 6 6 18M6 6l12 12" size={18} />
          </button>
        </div>

        {/* Workspace selector */}
        <div className="px-4 py-3 border-b border-slate-100">
          <button className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors text-left">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              AC
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">Acme Corp</div>
              <div className="text-[10px] text-slate-400 truncate">Production workspace</div>
            </div>
            <Ic d="M6 9l6 6 6-6" size={14} className="text-slate-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-400">
            Developer
          </div>
          {NAV.map(({ to, label, icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm shadow-indigo-100/70'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Ic d={icon} size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className="flex-1 text-left">{label}</span>
                  {badge && (
                    <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-white text-indigo-600' : 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
                    }`}>{badge}</span>
                  )}
                  {isActive && <Ic d="M9 18l6-6-6-6" size={14} className="text-indigo-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* AI credits + user */}
        <div className="border-t border-slate-100 p-4 space-y-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100/70 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-indigo-600">AI credits</span>
              <span className="text-xs font-mono font-semibold text-slate-700">4,238 / 10k</span>
            </div>
            <div className="h-1.5 rounded-full bg-white overflow-hidden border border-indigo-100/50">
              <div className="h-1.5 conf-bar rounded-full" style={{ width: '42%' }} />
            </div>
            <div className="text-[10px] text-slate-500 mt-2">Resets in 18 days</div>
          </div>

          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() ?? 'AM'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">{user?.name ?? 'Alex Morel'}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex px-1.5 py-px rounded text-[9px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  {user?.role ?? 'Developer'}
                </span>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
              <Ic d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Topbar ────────────────────────────────────────────────────
export function Topbar({
  onMenu,
  onChatbot,
  breadcrumb,
}: {
  onMenu: () => void;
  onChatbot: () => void;
  breadcrumb?: { parent: string; current: string };
}) {
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }, []);
  const dateStr = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    []
  );

  return (
    <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-xl border-b border-slate-100">
      <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
        <button onClick={onMenu} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600">
          <Ic d="M3 12h18M3 6h18M3 18h18" size={18} />
        </button>

        {/* Breadcrumb */}
        <nav className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-slate-400">{breadcrumb?.parent ?? 'My Sessions'}</span>
          <Ic d="M9 18l6-6-6-6" size={14} className="text-slate-300" />
          <span className="font-semibold text-slate-700">{breadcrumb?.current ?? 'acme-checkout-prod'}</span>
        </nav>

        <div className="flex-1" />

        {/* Search */}
        <div className="hidden md:flex relative">
          <Ic d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search endpoints, schemas…"
            className="w-72 pl-9 pr-16 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">⌘K</kbd>
        </div>

        {/* Greeting desktop */}
        <div className="hidden lg:flex flex-col items-end leading-tight mr-1">
          <div className="text-xs text-slate-400">{dateStr}</div>
          <div className="text-sm font-semibold text-slate-700">{greeting}, Alex</div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600">
          <Ic d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-50" />
        </button>

        {/* Ask Aria */}
        <button
          onClick={onChatbot}
          className="hidden md:inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 text-indigo-700 text-xs font-semibold transition-all"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="sparkle">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Ask Aria
        </button>
      </div>
    </header>
  );
}

// ── AppLayout ─────────────────────────────────────────────────
export function AppLayout({
  children,
  breadcrumb,
  onChatbot,
  title,
}: {
  children: ReactNode;
  breadcrumb?: { parent: string; current: string };
  onChatbot?: () => void;
  title?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          onMenu={() => setSidebarOpen(true)}
          onChatbot={onChatbot ?? (() => {})}
          breadcrumb={breadcrumb}
        />
        <main className="flex-1 overflow-auto px-4 lg:px-8 py-6">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

// ── ProtectedRoute ────────────────────────────────────────────
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
          </svg>
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}
