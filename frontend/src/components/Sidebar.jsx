import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Shield, Home, LayoutDashboard, BarChart3, MessageSquare, Settings, Bell, CheckCircle, Menu, X } from 'lucide-react';

function Sidebar() {
  const location = useLocation();
  const savedEmail = localStorage.getItem('notificationEmail');
  const [email, setEmail] = useState(savedEmail || '');
  const [isRegistered, setIsRegistered] = useState(!!savedEmail);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="text-slate-700 dark:text-slate-300" size={20} /> : <Menu className="text-slate-700 dark:text-slate-300" size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:relative z-50 w-64 lg:w-20 xl:w-64 h-screen flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      <div className="p-4 lg:p-6 flex items-center gap-3">
        <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
          <Shield size={24} />
        </div>
        <h1 className="lg:hidden xl:block text-xl font-bold tracking-tight text-slate-900 dark:text-white">SentinelOps</h1>
      </div>
      <nav className="flex-1 px-3 lg:px-4 space-y-1 mt-4 overflow-y-auto">
        <Link 
          to="/" 
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center gap-4 px-4 py-3 min-h-[48px] rounded-xl group transition-all ${
            isActive('/') ? 'sidebar-item-active' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95'
          }`}
        >
          <Home size={20} className="shrink-0" />
          <span className="lg:hidden xl:block font-semibold text-sm">Home</span>
        </Link>
        <Link 
          to="/dashboard" 
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center gap-4 px-4 py-3 min-h-[48px] rounded-xl group transition-all ${
            isActive('/dashboard') ? 'sidebar-item-active' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95'
          }`}
        >
          <LayoutDashboard size={20} className="shrink-0" />
          <span className="lg:hidden xl:block font-semibold text-sm">Command Center</span>
        </Link>
        <Link 
          to="/vulnerabilities" 
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center gap-4 px-4 py-3 min-h-[48px] rounded-xl group transition-all ${
            isActive('/vulnerabilities') ? 'sidebar-item-active' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95'
          }`}
        >
          <BarChart3 size={20} className="shrink-0" />
          <span className="lg:hidden xl:block font-semibold text-sm">Vulnerabilities</span>
        </Link>
        <Link 
          to="/community" 
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center gap-4 px-4 py-3 min-h-[48px] rounded-xl group transition-all ${
            isActive('/community') ? 'sidebar-item-active' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95'
          }`}
        >
          <MessageSquare size={20} className="shrink-0" />
          <span className="lg:hidden xl:block font-semibold text-sm">Community</span>
        </Link>
        <Link 
          to="/settings" 
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center gap-4 px-4 py-3 min-h-[48px] rounded-xl group transition-all ${
            isActive('/settings') ? 'sidebar-item-active' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95'
          }`}
        >
          <Settings size={20} className="shrink-0" />
          <span className="lg:hidden xl:block font-semibold text-sm">Settings</span>
        </Link>
      </nav>
      <div className="p-3 lg:p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
        {/* Email Notification Registration */}
        <div className="lg:hidden xl:block bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={14} className="text-primary" />
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
                  <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Registered!</span>
                </div>
              )}
              <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate">{email}</span>
                <CheckCircle size={14} className="text-emerald-500" />
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

        <div className="lg:hidden xl:block bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
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
          <div className="lg:hidden xl:block">
            <p className="text-xs font-bold text-slate-900 dark:text-white">Admin User</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Security Architect</p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}

export default Sidebar;
