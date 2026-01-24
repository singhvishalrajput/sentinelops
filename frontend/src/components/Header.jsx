import DarkModeToggle from './DarkModeToggle';

function Header({ title, subtitle, actionButton, onScan, isScanning }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between transition-colors">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <DarkModeToggle />
        <div className="relative">
          <span className="absolute right-0 top-0 size-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          <button className="size-10 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
        {actionButton || (
          <button 
            onClick={onScan}
            disabled={isScanning}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="material-symbols-outlined !text-sm group-hover:rotate-180 transition-transform duration-500">{isScanning ? 'hourglass_empty' : 'sync'}</span>
            {isScanning ? 'Scanning...' : 'Trigger Full Scan'}
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
