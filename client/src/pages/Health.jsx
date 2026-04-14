import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/index';
import { getStrengthColor } from '../lib/strength';
import { AlertTriangle, ShieldAlert, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';

const TABS = [
  { key: 'weak', label: 'Weak', icon: AlertTriangle, color: 'text-orange-400', badge: 'bg-orange-500/10 text-orange-400' },
  { key: 'reused', label: 'Reused', icon: AlertTriangle, color: 'text-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400' },
  { key: 'breached', label: 'Breached', icon: ShieldAlert, color: 'text-red-400', badge: 'bg-red-500/10 text-red-400' },
  { key: 'strong', label: 'Strong', icon: ShieldCheck, color: 'text-green-400', badge: 'bg-green-500/10 text-green-400' },
];

const EMPTY_MSGS = {
  weak: 'No weak passwords. Nice work!',
  reused: 'All passwords are unique.',
  breached: 'None of your passwords appear in known breaches.',
  strong: "No strong passwords yet. Use the generator to create some.",
};

export default function Health() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('weak');

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!health) return null;

  const activeTab = TABS.find(t => t.key === tab);
  const items = health[tab] || [];

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Security Health</h1>
          <p className="text-slate-400 text-sm mt-1">Find and fix weak spots in your vault.</p>
        </div>

        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {TABS.map(({ key, label, icon: Icon, color, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${tab === key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="hidden sm:inline">{label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${badge}`}>{health[key]?.length || 0}</span>
            </button>
          ))}
        </div>

        <div className={`bg-slate-900 border rounded-xl overflow-hidden
          ${tab === 'weak' ? 'border-orange-500/20' : ''}
          ${tab === 'reused' ? 'border-yellow-500/20' : ''}
          ${tab === 'breached' ? 'border-red-500/20' : ''}
          ${tab === 'strong' ? 'border-green-500/20' : ''}
        `}>
          <div className="p-4 border-b border-slate-800">
            <h2 className={`font-semibold flex items-center gap-2 ${activeTab.color}`}>
              <activeTab.icon className="w-5 h-5" />
              {activeTab.label} Passwords
            </h2>
          </div>
          <div className="p-4">
            {items.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">{EMPTY_MSGS[tab]}</p>
            ) : (
              <div className="space-y-2">
                {items.map(pw => (
                  <div key={pw.id} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3 hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-700 p-2 rounded-lg">
                        <KeyRound className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{pw.title}</p>
                        <p className="text-xs text-slate-500">{pw.username || pw.url || 'No details'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{pw.category}</span>
                      <span className={`text-xs font-medium ${getStrengthColor(pw.strengthScore)}`}>{pw.strengthLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
