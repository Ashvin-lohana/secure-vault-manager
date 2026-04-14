import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../components/AppLayout';
import AddPasswordModal from '../components/AddPasswordModal';
import { api } from '../api/index';
import { useToast } from '../hooks/useToast';
import { getStrengthColor, getStrengthBg } from '../lib/strength';
import { Search, Plus, Eye, EyeOff, Copy, Trash2, Globe, ShieldAlert, Loader2 } from 'lucide-react';

const CATEGORIES = ['All', 'Social', 'Banking', 'Work', 'Shopping', 'Gaming', 'Email', 'Finance', 'Other'];

export default function Vault() {
  const { toast } = useToast();
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [addOpen, setAddOpen] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  const fetchPasswords = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      const data = await api.getPasswords(params);
      setPasswords(data);
    } catch {
      toast({ title: 'Failed to load passwords', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { fetchPasswords(); }, [fetchPasswords]);

  async function handleDelete(id) {
    if (!confirm('Delete this password?')) return;
    try {
      await api.deletePassword(id);
      toast({ title: 'Deleted' });
      fetchPasswords();
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Your Vault</h1>
            <p className="text-slate-400 text-sm mt-1">All your stored credentials.</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-xl transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Password
          </button>
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search passwords..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : passwords.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl">
            <ShieldAlert className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="font-medium text-slate-300">No passwords found</p>
            <p className="text-sm text-slate-500 mt-1">Try a different search or add a new one</p>
            <button onClick={() => setAddOpen(true)} className="mt-4 px-4 py-2 text-sm border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors">
              Add your first password
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {passwords.map(pw => (
              <div key={pw.id} className="flex items-center gap-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 group transition-colors">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate">{pw.title}</p>
                  <p className="text-xs text-slate-500 truncate">{pw.username || 'No username'}</p>
                </div>
                <div className="hidden sm:flex flex-col items-end shrink-0">
                  <span className={`text-xs font-medium ${getStrengthColor(pw.strengthScore)}`}>{pw.strengthLabel}</span>
                  <div className="flex gap-0.5 mt-1">
                    {[0,1,2,3].map(i => (
                      <div key={i} className={`w-4 h-1 rounded-full ${i <= pw.strengthScore ? getStrengthBg(pw.strengthScore) : 'bg-slate-700'}`} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => setViewingId(pw.id)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(pw.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {addOpen && <AddPasswordModal onClose={() => setAddOpen(false)} onSaved={fetchPasswords} />}
      {viewingId && <ViewPasswordModal id={viewingId} onClose={() => setViewingId(null)} />}
    </AppLayout>
  );
}

function ViewPasswordModal({ id, onClose }) {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [breachLoading, setBreachLoading] = useState(false);

  useEffect(() => {
    api.getPassword(id).then(setData).catch(() => onClose());
  }, [id]);

  async function checkBreach() {
    setBreachLoading(true);
    try {
      const res = await api.checkBreach(id);
      if (res.breached) {
        toast({ title: 'Breach Detected!', description: res.message, variant: 'destructive' });
      } else {
        toast({ title: 'All clear', description: res.message });
      }
    } catch {
      toast({ title: 'Breach check failed', variant: 'destructive' });
    } finally {
      setBreachLoading(false);
    }
  }

  function copy(text, label = 'Copied') {
    navigator.clipboard.writeText(text);
    toast({ title: label });
  }

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-semibold text-lg">{data.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Username / Email</p>
            <div className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
              <span className="text-sm text-white">{data.username || 'N/A'}</span>
              {data.username && (
                <button onClick={() => copy(data.username)} className="text-slate-400 hover:text-white ml-2">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Password</p>
            <div className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2 font-mono">
              <span className="text-sm text-white">{showPw ? data.password : '••••••••••••'}</span>
              <div className="flex gap-1 ml-2">
                <button onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-white">
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => copy(data.password, 'Password copied')} className="text-slate-400 hover:text-white">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          {data.url && (
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">URL</p>
              <a href={data.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm">{data.url}</a>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className={`text-sm font-medium ${getStrengthColor(data.strengthScore)}`}>{data.strengthLabel}</span>
            <button
              onClick={checkBreach}
              disabled={breachLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {breachLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
              Check Breach
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
