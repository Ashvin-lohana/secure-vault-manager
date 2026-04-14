import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/index';
import { KeyRound, ShieldCheck, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#6366f1', '#0ea5e9', '#eab308', '#f43f5e', '#a855f7', '#22c55e', '#f97316', '#64748b'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!stats) return <AppLayout><p className="text-slate-400">Failed to load stats.</p></AppLayout>;

  const r = 80;
  const circ = r * 2 * Math.PI;
  const offset = circ - (stats.healthScore / 100) * circ;

  const statCards = [
    { label: 'Total Passwords', value: stats.totalPasswords, icon: KeyRound, color: 'text-slate-300' },
    { label: 'Strong', value: stats.strongPasswords, icon: ShieldCheck, color: 'text-green-400' },
    { label: 'Weak / Reused', value: stats.weakPasswords + stats.reusedPasswords, icon: AlertTriangle, color: 'text-orange-400',
      sub: `${stats.weakPasswords} weak · ${stats.reusedPasswords} reused` },
    { label: 'Breached', value: stats.breachedPasswords, icon: ShieldAlert, color: 'text-red-400' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Overview of your vault security.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">{label}</p>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold mb-1">Health Score</h2>
            <p className="text-sm text-slate-400 mb-4">Overall strength of your vault</p>
            <div className="flex items-center justify-center">
              <div className="relative w-44 h-44">
                <svg className="w-full h-full -rotate-90">
                  <circle stroke="#1e293b" strokeWidth="12" fill="transparent" r={r} cx="88" cy="88" />
                  <circle
                    stroke="#6366f1"
                    strokeWidth="12"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={r}
                    cx="88"
                    cy="88"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{stats.healthScore}</span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold mb-1">Categories</h2>
            <p className="text-sm text-slate-400 mb-4">Breakdown by type</p>
            <div className="h-48">
              {stats.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="count" nameKey="category">
                      {stats.categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                  No passwords yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
