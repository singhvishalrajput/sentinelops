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
