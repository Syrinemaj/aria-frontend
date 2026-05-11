import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthInput, AuthButton, AriaLogo } from '../components/auth';

function UserIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

export default function SignUpPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.includes('@')) e.email = 'Valid email required';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    return e;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Sign up failed' });
    } finally {
      setLoading(false);
    }
  }

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3 : 2;
  const strengthColors = ['bg-slate-200', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400'];
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950 flex-col items-center justify-center p-12">
        <div className="dot-grid absolute inset-0 opacity-20" />
        <div className="relative z-10 max-w-sm text-center space-y-6">
          <AriaLogo size="lg" />
          <div className="space-y-3 pt-4">
            <h2 className="text-2xl font-bold text-white">Start analysing your APIs</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Join teams who trust ARIA to make sense of their API traffic, security, and AI model behaviour.
            </p>
          </div>
          <ul className="space-y-3 text-left pt-2">
            {[
              'Automatic endpoint discovery',
              'AI-powered security scanning',
              'Real-time traffic analysis',
              'One-click OpenAPI export',
            ].map(f => (
              <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="absolute top-1/4 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-24 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-sm space-y-6 stagger">
          <div className="space-y-1">
            <div className="lg:hidden mb-6"><AriaLogo size="md" /></div>
            <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
            <p className="text-sm text-slate-500">Get started with your free ARIA workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{errors.form}</div>
            )}

            <AuthInput
              label="Full name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Alex Morel"
              icon={UserIcon}
              error={errors.name}
              autoComplete="name"
              required
            />
            <AuthInput
              label="Work email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              icon={MailIcon}
              error={errors.email}
              autoComplete="email"
              required
            />
            <div className="space-y-1.5">
              <AuthInput
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                icon={LockIcon}
                error={errors.password}
                autoComplete="new-password"
                required
              />
              {password.length > 0 && (
                <div className="flex items-center gap-2 px-0.5">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${['', 'text-rose-500', 'text-amber-500', 'text-emerald-500'][strength]}`}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>
            <AuthInput
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              icon={LockIcon}
              error={errors.confirm}
              autoComplete="new-password"
              required
            />

            <p className="text-xs text-slate-500">
              By creating an account you agree to our{' '}
              <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and{' '}
              <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
            </p>

            <AuthButton type="submit" loading={loading}>
              Create account
            </AuthButton>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
