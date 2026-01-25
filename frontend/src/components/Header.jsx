import DarkModeToggle from './DarkModeToggle';

function Header({ title, subtitle, actionButton, onScan, isScanning, providerButtons, onDownloadReport, hasScanResults }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {providerButtons}
          {hasScanResults && onDownloadReport && (
            <button
              onClick={onDownloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
              title="Download PDF Report"
            >
              <span className="material-symbols-outlined !text-base">download</span>
              PDF Report
            </button>
          )}
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
      </div>
    </header>
  );
}

export default Header;
