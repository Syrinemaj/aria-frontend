import { type ReactNode, useState } from 'react';
import { NavLink, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// ── Icons ─────────────────────────────────────────────────────
function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const IC = {
  grid:    'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  layers:  'M2 12 12 2l10 10M2 12l10 10 10-10M2 12l10 4 10-4',
  shield:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  check:   'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  cpu:     'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18',
  bot:     'M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3V5.73A2 2 0 0 1 12 2zM9 14h.01M15 14h.01M9 18h6',
  logout:  'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  search:  'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  bell:    'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  chevron: 'M6 9l6 6 6-6',
  menu:    'M3 12h18M3 6h18M3 18h18',
  settings:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
};

// ── AriaLogo ──────────────────────────────────────────────────
function AriaLogoSidebar() {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
      <div className="relative w-9 h-9 shrink-0">
        <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9 drop-shadow-sm">
          <defs>
            <linearGradient id="sb-g" x1="4" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
            </linearGradient>
          </defs>
          <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="url(#sb-g)" stroke="white" strokeWidth="1"/>
          <path d="M10 22L16 12L18 16L20 10L26 22" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="10" cy="22" r="1.6" fill="#38BDF8"/>
          <circle cx="18" cy="16" r="1.6" fill="#C084FC"/>
          <circle cx="26" cy="22" r="1.6" fill="#34D399"/>
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">aria</span>
        <span className="text-[9px] uppercase tracking-[0.22em] text-slate-400 font-semibold mt-0.5">API Intelligence</span>
      </div>
    </div>
  );
}

// ── Nav items ─────────────────────────────────────────────────
const NAV = [
  { to: '/dashboard',  label: 'Dashboard',  icon: IC.grid    },
  { to: '/sessions',   label: 'Sessions',   icon: IC.layers  },
  { to: '/approvals',  label: 'Approvals',  icon: IC.check   },
  { to: '/security',   label: 'Security',   icon: IC.shield  },
  { to: '/mlops',      label: 'MLOps',      icon: IC.cpu     },
  { to: '/chatbot',    label: 'AI Chat',    icon: IC.bot     },
];

// ── Sidebar ───────────────────────────────────────────────────
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user, logout } = useAuth();

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-slate-100 shadow-sm transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      {collapsed ? (
        <div className="flex items-center justify-center py-4 border-b border-slate-100">
          <svg viewBox="0 0 36 36" fill="none" className="w-8 h-8">
            <defs>
              <linearGradient id="sb-g2" x1="4" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
              </linearGradient>
            </defs>
            <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="url(#sb-g2)" stroke="white" strokeWidth="1"/>
            <path d="M10 22L16 12L18 16L20 10L26 22" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <circle cx="10" cy="22" r="1.6" fill="#38BDF8"/>
            <circle cx="18" cy="16" r="1.6" fill="#C084FC"/>
            <circle cx="26" cy="22" r="1.6" fill="#34D399"/>
          </svg>
        </div>
      ) : (
        <AriaLogoSidebar />
      )}

      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 px-2">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}>
                  <Icon d={icon} size={18} />
                </span>
                {!collapsed && <span>{label}</span>}
                {!collapsed && isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3 space-y-2">
        {!collapsed && user && (
          <div className="px-2 py-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.workspace}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <Icon d={IC.logout} size={16} />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <Icon d={IC.menu} size={15} />
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </div>
    </aside>
  );
}

// ── Topbar ────────────────────────────────────────────────────
export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-slate-100 gap-4">
      <div className="min-w-0">
        {subtitle ? (
          <>
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
            <h1 className="text-base font-bold text-slate-900 truncate">{title}</h1>
          </>
        ) : (
          <h1 className="text-base font-bold text-slate-900">{title || `${greeting}, ${user?.name?.split(' ')[0] ?? 'there'}`}</h1>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="relative hidden sm:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon d={IC.search} size={15} />
          </span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-8 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 w-48 transition-all"
          />
        </div>

        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Icon d={IC.bell} size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
          {user?.name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  );
}

// ── AppLayout ─────────────────────────────────────────────────
export function AppLayout({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-56'}`}>
        <Topbar title={title ?? ''} subtitle={subtitle} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
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

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
