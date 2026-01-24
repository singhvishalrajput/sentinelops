import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

function Sidebar() {
  const location = useLocation();
  const savedEmail = localStorage.getItem('notificationEmail');
  const [email, setEmail] = useState(savedEmail || '');
  const [isRegistered, setIsRegistered] = useState(!!savedEmail);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleRegisterEmail = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      localStorage.setItem('notificationEmail', email);
      setIsRegistered(true);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleUnregister = () => {
    localStorage.removeItem('notificationEmail');
    setEmail('');
    setIsRegistered(false);
  };

  return (
    <aside className="relative z-50 w-20 lg:w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors">
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
          <span className="material-symbols-outlined !text-2xl">shield</span>
        </div>
        <h1 className="hidden lg:block text-xl font-bold tracking-tight text-slate-900 dark:text-white">SentinelOps</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-4">
        <Link 
          to="/" 
          className={`flex items-center gap-4 px-3 py-3 rounded-xl group transition-all ${
            isActive('/') ? 'sidebar-item-active' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="material-symbols-outlined">home</span>
          <span className="hidden lg:block font-semibold text-sm">Home</span>
        </Link>
        <Link 
          to="/dashboard" 
          className={`flex items-center gap-4 px-3 py-3 rounded-xl group transition-all ${
            isActive('/dashboard') ? 'sidebar-item-active' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="hidden lg:block font-semibold text-sm">Command Center</span>
        </Link>
        <Link 
          to="/vulnerabilities" 
          className={`flex items-center gap-4 px-3 py-3 rounded-xl group transition-all ${
            isActive('/vulnerabilities') ? 'sidebar-item-active' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <span className="material-symbols-outlined">analytics</span>
          <span className="hidden lg:block font-semibold text-sm">Vulnerabilities</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
        {/* Email Notification Registration */}
        <div className="hidden lg:block bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined !text-sm text-primary">notifications</span>
            <p className="text-[10px] font-bold text-primary uppercase tracking-wide">Security Alerts</p>
          </div>
          {!isRegistered ? (
            <form onSubmit={handleRegisterEmail} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition-all shadow-sm"
              >
                Enable Notifications
              </button>
            </form>
          ) : (
            <div className="space-y-2">
              {showSuccess && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <span className="material-symbols-outlined !text-sm text-emerald-600 dark:text-emerald-400">check_circle</span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Registered!</span>
                </div>
              )}
              <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">{email}</span>
                <span className="material-symbols-outlined !text-sm text-emerald-500">check_circle</span>
              </div>
              <button
                onClick={handleUnregister}
                className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg transition-all"
              >
                Unregister
              </button>
            </div>
          )}
        </div>

        <div className="hidden lg:block bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
          <p className="text-[10px] font-bold text-primary uppercase mb-1">AWS Connected</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">prod-us-east-1</span>
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center gap-3 px-2">
          <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-600 shadow-sm overflow-hidden">
            <div className="size-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
              AU
            </div>
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-bold text-slate-900 dark:text-white">Admin User</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Security Architect</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
