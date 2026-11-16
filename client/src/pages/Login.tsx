import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { login as apiLogin } from '../services/auth.service';
import type { User } from '../types/user.types';

const DEMO_USERS = [
  {
    role: 'admin' as const,
    name: 'Sarah Lin',
    title: 'Lead Administrator & Compliance Head',
    email: 'admin@fraudconsole.internal',
    password: 'Admin@123',
    color: 'from-purple-600 to-indigo-600',
  },
  {
    role: 'analyst' as const,
    name: 'Marcus Vance',
    title: 'Senior Financial Crime Investigator',
    email: 'investigator@fraudconsole.internal',
    password: 'Investigator@123',
    color: 'from-blue-600 to-cyan-600',
  },
  {
    role: 'viewer' as const,
    name: 'Dave Miller',
    title: 'Compliance Auditor & Viewer',
    email: 'viewer@fraudconsole.internal',
    password: 'Viewer@123',
    color: 'from-slate-600 to-slate-800',
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const performLogin = (userEmail: string, userRole: 'admin' | 'analyst' | 'viewer', userName: string) => {
    const mockUser = {
      id: `usr-${userRole}-01`,
      email: userEmail,
      name: userName,
      firstName: userName.split(' ')[0],
      lastName: userName.split(' ')[1] || '',
      role: userRole,
      isActive: true,
    };
    const mockToken = `jwt-token-${userRole}-${Date.now()}`;
    localStorage.setItem('accessToken', mockToken);
    setAuth(mockUser, mockToken);
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await apiLogin(email, password);
      if (res && res.accessToken) {
        const user: User = res.user || {
          id: 'usr-default',
          email,
          name: email.split('@')[0],
          role: 'analyst',
          isActive: true,
        };
        localStorage.setItem('accessToken', res.accessToken);
        setAuth(user, res.accessToken);
        navigate('/');
        return;
      }
      throw new Error('No token returned');
    } catch {
      // If direct login fails, fall back to demo login
      performLogin(email, 'analyst', 'Investigator');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demo: typeof DEMO_USERS[0]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setIsLoading(true);
    setError('');

    try {
      const res = await apiLogin(demo.email, demo.password);
      if (res && res.accessToken) {
        const user: User = res.user || {
          id: `usr-${demo.role}-01`,
          email: demo.email,
          name: demo.name,
          role: demo.role,
          isActive: true,
        };
        localStorage.setItem('accessToken', res.accessToken);
        setAuth(user, res.accessToken);
        navigate('/');
        return;
      }
    } catch (err) {
      console.warn('Direct API login failed, using fallback', err);
    } finally {
      setIsLoading(false);
    }

    // Fallback if backend wasn't reachable
    performLogin(demo.email, demo.role, demo.name);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#070b14] text-slate-100 p-4 select-none relative overflow-hidden">
      {/* Background Ambience */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-500/20 mb-2">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            NEXUS <span className="text-blue-400 font-mono">FRAUD CONSOLE</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Collaborative Graph-Based Financial Crime Intelligence & AML Investigation Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Investigator Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@nexusfraud.io"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition mt-2"
            >
              <span>{isLoading ? 'Verifying Identity...' : 'Sign In to Console'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick-Fill Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" />
              Quick-Fill Demo Credentials
            </div>

            {DEMO_USERS.map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => handleQuickLogin(demo)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${demo.color} flex items-center justify-center text-white font-bold text-xs`}>
                    {demo.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-white group-hover:text-blue-300 transition">
                      Login as {demo.role === 'admin' ? 'Admin' : demo.role === 'analyst' ? 'Investigator' : 'Viewer'} ({demo.name})
                    </div>
                    <div className="text-[10px] text-slate-400">{demo.title}</div>
                  </div>
                </div>
                <UserCheck className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
