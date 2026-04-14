import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/index';
import { useToast } from '../hooks/useToast';
import { getStrengthColor, getStrengthBg } from '../lib/strength';
import { Copy, RefreshCw, Save, Zap, Loader2 } from 'lucide-react';

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}

export default function Generator() {
  const { toast } = useToast();

  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(true);

  const [generated, setGenerated] = useState('');
  const [strength, setStrength] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  async function generate() {
    setGenLoading(true);
    try {
      const res = await api.generate({ length, uppercase, lowercase, numbers, symbols, excludeAmbiguous });
      setGenerated(res.password);
      setStrength(res.strength);
    } catch {
      toast({ title: 'Generation failed', variant: 'destructive' });
    } finally {
      setGenLoading(false);
    }
  }

  function copyPassword() {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    toast({ title: 'Copied to clipboard' });
  }

  async function saveToVault() {
    if (!generated) return;
    setSaveLoading(true);
    try {
      await api.createPassword({ title: 'Generated Password', password: generated, category: 'Other' });
      toast({ title: 'Saved to vault!' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-5 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Password Generator</h1>
          <p className="text-slate-400 text-sm mt-1">Create strong, random passwords instantly.</p>
        </div>

        <div className="bg-slate-900 border border-primary/20 rounded-2xl p-5 space-y-4">
          <div className="relative">
            <input
              readOnly
              value={generated}
              placeholder="Click Generate to create a password"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-center text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none"
            />
            <div className="absolute right-2 top-2 flex gap-1">
              <button onClick={copyPassword} disabled={!generated} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-30">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={generate} disabled={genLoading} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                <RefreshCw className={`w-4 h-4 ${genLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {strength && (
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-2 border border-slate-700">
              <div className="flex justify-between text-sm">
                <span>Strength: <span className={`font-semibold ${getStrengthColor(strength.score)}`}>{strength.label}</span></span>
                <span className="text-slate-500 text-xs">Crack time: {strength.crackTime}</span>
              </div>
              <div className="flex gap-1 h-1.5">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`flex-1 rounded-full ${i <= strength.score ? getStrengthBg(strength.score) : 'bg-slate-700'}`} />
                ))}
              </div>
              {strength.feedback?.filter(f => f !== 'Looks good!').length > 0 && (
                <ul className="text-xs text-slate-500 space-y-0.5 list-disc pl-4">
                  {strength.feedback.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button onClick={generate} disabled={genLoading} className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {genLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Generate
            </button>
            <button onClick={saveToVault} disabled={!generated || saveLoading} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors">
              {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save to Vault
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <h2 className="font-semibold">Options</h2>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Length</span>
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-white">{length}</span>
            </div>
            <input
              type="range"
              min={8} max={64} step={1}
              value={length}
              onChange={e => setLength(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Toggle label="Uppercase (A-Z)" checked={uppercase} onChange={setUppercase} />
            <Toggle label="Lowercase (a-z)" checked={lowercase} onChange={setLowercase} />
            <Toggle label="Numbers (0-9)" checked={numbers} onChange={setNumbers} />
            <Toggle label="Symbols (!@#$)" checked={symbols} onChange={setSymbols} />
            <div className="sm:col-span-2 bg-slate-800/50 rounded-xl p-3">
              <Toggle label="Exclude Ambiguous (0, O, l, 1, I...)" checked={excludeAmbiguous} onChange={setExcludeAmbiguous} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
