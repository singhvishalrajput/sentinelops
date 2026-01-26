import DarkModeToggle from './DarkModeToggle';
import { Download, RefreshCw, Loader } from 'lucide-react';

function Header({ title, subtitle, actionButton, onScan, isScanning, providerButtons, onDownloadReport, hasScanResults }) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-auto ml-12 sm:ml-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {providerButtons}
          {hasScanResults && onDownloadReport && (
            <button
              onClick={onDownloadReport}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs sm:text-sm whitespace-nowrap active:scale-95"
              title="Download PDF Report"
            >
              <Download size={16} />
              <span className="hidden sm:inline">PDF Report</span>
              <span className="sm:hidden">PDF</span>
            </button>
          )}
          <DarkModeToggle />
          {actionButton || (
            <button 
              onClick={onScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 sm:gap-2 bg-primary text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap active:scale-95"
            >
              {isScanning ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              )}
              <span className="hidden sm:inline">{isScanning ? 'Scanning...' : 'Trigger Full Scan'}</span>
              <span className="sm:hidden">{isScanning ? 'Scan...' : 'Scan'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
