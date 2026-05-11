import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthInput, AuthButton, AriaLogo } from '../components/auth';

function MailIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) { setError('Please enter a valid email'); return; }
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 space-y-6 stagger">
          <div className="flex flex-col items-center text-center space-y-3">
            <AriaLogo size="md" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Reset your password</h1>
              <p className="text-sm text-slate-500 mt-1">
                {sent
                  ? `We sent a reset link to ${email}`
                  : "Enter your email and we'll send you a reset link"}
              </p>
            </div>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 mx-auto">
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="text-sm text-slate-500 text-center">
                Check your inbox. If an account with that email exists, you&apos;ll receive a reset link within a few minutes.
              </p>
              <AuthButton type="button" variant="outline" onClick={() => setSent(false)}>
                Try another email
              </AuthButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthInput
                label="Email address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                icon={MailIcon}
                error={error}
                autoComplete="email"
                required
              />
              <AuthButton type="submit" loading={loading}>
                Send reset link
              </AuthButton>
            </form>
          )}

          <div className="flex items-center justify-center gap-1 text-sm text-slate-500">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
