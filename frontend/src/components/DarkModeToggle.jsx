import { useDarkMode } from '../contexts/DarkModeContext';

function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      className="size-10 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      aria-label="Toggle dark mode"
    >
      <span className="material-symbols-outlined">
        {isDarkMode ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}

export default DarkModeToggle;
