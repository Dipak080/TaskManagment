import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { AuthApi } from '../api/auth';
import { IconLogo } from '../components/Icons';
import { apiError } from '../utils/apiError';
import DevFillButton from '../components/DevFillButton';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  return (
    <div className="login-wrap">
      {mode === 'login'
        ? <LoginForm onRegister={() => setMode('register')} />
        : <RegisterForm onBack={() => setMode('login')} />}
    </div>
  );
}

function LoginForm({ onRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(apiError(err, 'Login failed. Check your credentials.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="login-card" style={{ position: 'relative' }} onSubmit={submit}>
      <DevFillButton onFill={() => {
        setEmail('admin@ajaychemicals.com');
        setPassword('Company@123');
      }} />
      <div className="login-brand">
        <div className="brand-icon"><IconLogo /></div>
        <div>
          <div className="brand-name" style={{ fontSize: 16 }}>TaskOps</div>
          <div className="brand-sub">MULTI-TENANT TASK MANAGEMENT</div>
        </div>
      </div>

      <h1 className="login-title">Sign in</h1>
      <p className="login-sub">Enter your credentials to access your workspace.</p>

      {error && <div className="login-error">{error}</div>}

      <div className="form-group">
        <label>Email</label>
        <input
          className="form-input" type="email" autoComplete="username"
          value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com" required
        />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input
          className="form-input" type="password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" required
        />
      </div>

      <button className="btn btn-primary login-btn" type="submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in →'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text2)' }}>New here?</span>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <button
        type="button"
        onClick={onRegister}
        style={{
          width: '100%',
          padding: '11px 16px',
          background: 'transparent',
          border: '1px solid var(--blue)',
          borderRadius: 8,
          color: 'var(--blue)',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          transition: 'background 0.15s ease, color 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--blue)'; }}
      >
        Create a new account
      </button>
    </form>
  );
}

function RegisterForm({ onBack }) {
  const { register } = useAuth();
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [form, setForm] = useState({ name: '', company_name: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const sendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.company_name.trim() || !form.email.trim() || form.password.length < 6) {
      setError('Name, company, email and a password of at least 6 characters are required');
      return;
    }
    setBusy(true);
    try {
      const res = await AuthApi.requestRegisterOtp(form.email.trim());
      if (res?.dev_otp) setDevOtp(res.dev_otp);
      setStep('otp');
    } catch (err) {
      setError(apiError(err, 'Could not send OTP. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) { setError('Enter the OTP to continue'); return; }
    setBusy(true);
    try {
      await register({ ...form, email: form.email.trim(), otp: otp.trim() });
      // On success the auth state flips and Root renders the app.
    } catch (err) {
      setError(apiError(err, 'Registration failed.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="login-card" onSubmit={step === 'details' ? sendOtp : submitRegister}>
      <div className="login-brand">
        <div className="brand-icon"><IconLogo /></div>
        <div>
          <div className="brand-name" style={{ fontSize: 16 }}>TaskOps</div>
          <div className="brand-sub">CREATE YOUR WORKSPACE</div>
        </div>
      </div>

      <h1 className="login-title">{step === 'details' ? 'Register' : 'Verify OTP'}</h1>
      <p className="login-sub">
        {step === 'details'
          ? 'Create a new company workspace. You’ll be its admin.'
          : `We sent a code to ${form.email}. Enter it to finish.`}
      </p>

      {error && <div className="login-error">{error}</div>}

      {step === 'details' ? (
        <>
          <div className="form-group">
            <label>Your Name</label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="Jane Doe" required />
          </div>
          <div className="form-group">
            <label>Company Name</label>
            <input className="form-input" value={form.company_name} onChange={set('company_name')} placeholder="Acme Pvt Ltd" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" required />
          </div>
          <div className="form-group">
            <label>Phone (optional)</label>
            <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="9999999999" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" value={form.password} onChange={set('password')} placeholder="min 6 characters" required />
          </div>

          <button className="btn btn-primary login-btn" type="submit" disabled={busy}>
            {busy ? 'Sending OTP…' : 'Send OTP →'}
          </button>
        </>
      ) : (
        <>
          <div className="form-group">
            <label>OTP Code</label>
            <input
              className="form-input" value={otp} onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code" inputMode="numeric" maxLength={6} autoFocus required
            />
          </div>
          {devOtp && (
            <div className="login-hint" style={{ textAlign: 'center' }}>
              Dev mode — your OTP is <strong>{devOtp}</strong>
            </div>
          )}

          <button className="btn btn-primary login-btn" type="submit" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account →'}
          </button>
          <p className="login-sub" style={{ textAlign: 'center', marginTop: 10 }}>
            <button type="button" className="btn btn-ghost" style={{ padding: 0, color: 'var(--text2)' }} onClick={() => { setStep('details'); setError(''); }}>
              ← Edit details
            </button>
          </p>
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text2)' }}>Already a member?</span>
        <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <button
        type="button"
        onClick={onBack}
        style={{
          width: '100%',
          padding: '11px 16px',
          background: 'transparent',
          border: '1px solid var(--blue)',
          borderRadius: 8,
          color: 'var(--blue)',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          transition: 'background 0.15s ease, color 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--blue)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--blue)'; }}
      >
        Back to sign in
      </button>
    </form>
  );
}
