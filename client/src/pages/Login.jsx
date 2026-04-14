import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { api } from '../api/index';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [twoFaStep, setTwoFaStep] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [otp, setOtp] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.requiresTwoFactor) {
        setPendingUserId(res.userId);
        setTwoFaStep(true);
        toast({ title: '2FA Required', description: 'Enter your authenticator code.' });
      } else {
        login(res.token, res.user);
        navigate('/dashboard');
      }
    } catch (err) {
      toast({ title: 'Login failed', description: err?.error || 'Invalid credentials', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.register({ name, email, password });
      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err) {
      toast({ title: 'Registration failed', description: err?.error || 'Try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.verifyOtp({ userId: pendingUserId, otp });
      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err) {
      toast({ title: 'Wrong code', description: err?.error || 'Try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  if (twoFaStep) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="inline-flex bg-primary/20 p-3 rounded-2xl mb-3">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Two-Factor Auth</h2>
            <p className="text-slate-400 text-sm mt-1">Enter the 6-digit code from your app</p>
          </div>
          <form onSubmit={handleVerifyOtp} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Verification Code</label>
              <input
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                placeholder="000000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={otp.length !== 6 || loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Verify
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/25">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-bold tracking-tight">VaultAI</span>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-4">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors
              ${tab === 'login' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors
              ${tab === 'register' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Create Account
          </button>
        </div>

        {tab === 'login' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-1">Welcome back</h2>
            <p className="text-slate-400 text-sm mb-5">Enter your credentials to access your vault</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Master Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Unlock Vault
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-1">Create your vault</h2>
            <p className="text-slate-400 text-sm mb-5">Get started with secure password management</p>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Master Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">Min 8 chars — don't lose this!</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Account
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
