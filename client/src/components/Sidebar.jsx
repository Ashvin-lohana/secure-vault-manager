import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Key, Zap, Activity, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/index';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vault', label: 'Vault', icon: Key },
  { to: '/generator', label: 'Generator', icon: Zap },
  { to: '/health', label: 'Health', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ onClose }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  async function handleLogout() {
        try { 
          await 
          api.logout(); 
        } catch {}
    logout();
    navigate('/login');
  }

  return (
 <aside className="flex flex-col h-full w-64 bg-slate-900 border-r border-slate-800">
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary p-2 rounded-lg">
            <Shield className="w-4 h-4 text-white" />
          </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        )}
        </div>
        <span className="font-bold text-lg">VaultAI</span>
      </div>

    <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => {
                   const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${active
                        ? 'bg-primary/20 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
            <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'text-slate-500'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

         <div className="p-3 border-t border-slate-800 shrink-0">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
        <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
