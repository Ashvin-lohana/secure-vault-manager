import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/index';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Shield, Sun, Moon, Download, Loader2 } from 'lucide-react';

export default function Settings() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [theme, setThemeState] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const html = document.documentElement;

    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  async function toggleTwoFa() {
    setTwoFaLoading(true);
    try {
      const res = await api.setup2fa({ enable: !user?.twoFactorEnabled });
      toast({ title: res.message });
      const updated = await api.me();
      setUser(updated);
    } catch (err) {
      toast({ title: 'Failed to update 2FA', description: err?.error, variant: 'destructive' });
    } finally {
      setTwoFaLoading(false);
    }
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      const blob = await api.exportPdf();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vaultai-export-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-5 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account and preferences.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Name', value: user?.name },
              { label: 'Email', value: user?.email },
              { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-medium text-white">{value || '-'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Security</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-white mb-0.5">
                <Shield className="w-4 h-4 text-primary" />
                Two-Factor Authentication
              </div>
              <p className="text-xs text-slate-500">Require an OTP code on login</p>
            </div>
            <button
              onClick={toggleTwoFa}
              disabled={twoFaLoading}
              className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${user?.twoFactorEnabled ? 'bg-primary' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${user?.twoFactorEnabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white mb-0.5">Theme</p>
              <p className="text-xs text-slate-500">Currently using {theme} mode</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setThemeState('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${theme === 'light' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Sun className="w-4 h-4" /> Light
              </button>
              <button
                onClick={() => setThemeState('dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${theme === 'dark' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Moon className="w-4 h-4" /> Dark
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-1">Export Data</h2>
          <p className="text-xs text-slate-500 mb-4">Download a PDF copy of your vault. Keep it safe.</p>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors"
          >
            {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export as PDF
          </button>
        </div>
      </div>
    </AppLayout>
  );
}