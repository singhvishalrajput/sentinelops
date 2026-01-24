import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

function AssetInventory() {
  const assets = [
    { service: "S3", count: 124, critical: 2, high: 8, medium: 15 },
    { service: "EC2", count: 89, critical: 1, high: 5, medium: 12 },
    { service: "IAM", count: 156, critical: 3, high: 12, medium: 8 },
    { service: "RDS", count: 23, critical: 0, high: 2, medium: 4 },
    { service: "Lambda", count: 67, critical: 0, high: 3, medium: 6 },
    { service: "VPC", count: 12, critical: 0, high: 1, medium: 2 },
    { service: "CloudFront", count: 34, critical: 0, high: 0, medium: 3 },
    { service: "SNS", count: 18, critical: 0, high: 0, medium: 1 }
  ];

  return (
    <div className="relative h-screen flex overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      <div className="absolute inset-0 hero-grid opacity-40 dark:hidden pointer-events-none"></div>
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header 
          title="Asset Inventory" 
          subtitle="Complete inventory of cloud resources across all accounts"
        />
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Total Assets</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">2,481</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">AWS Resources</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">1,488</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Azure Resources</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">620</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">GCP Resources</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">373</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Service Breakdown</h3>
              <button className="text-sm font-bold text-primary hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {assets.map((asset) => (
                <div key={asset.service} className="flex items-center gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 transition-all">
                  <div className="w-32">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{asset.service}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{asset.count} resources</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {asset.critical > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="size-2 rounded-full bg-red-500"></div>
                          <span className="text-xs font-bold text-red-600">{asset.critical} Critical</span>
                        </div>
                      )}
                      {asset.high > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="size-2 rounded-full bg-amber-500"></div>
                          <span className="text-xs font-bold text-amber-600">{asset.high} High</span>
                        </div>
                      )}
                      {asset.medium > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="size-2 rounded-full bg-blue-500"></div>
                          <span className="text-xs font-bold text-blue-600">{asset.medium} Medium</span>
                        </div>
                      )}
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-blue-500" 
                           style={{ width: `${((asset.critical + asset.high + asset.medium) / asset.count) * 100}%` }}></div>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-primary hover:underline">View Details</button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Resource Distribution</h3>
              <div className="h-64 flex items-center justify-center">
                <div className="relative size-48">
                  <svg className="size-full" viewBox="0 0 36 36">
                    <path className="text-blue-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                    <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="60, 100" strokeLinecap="round" strokeWidth="4"></path>
                    <path className="text-sky-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="25, 100" strokeDashoffset="-60" strokeLinecap="round" strokeWidth="4"></path>
                    <path className="text-emerald-400" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="15, 100" strokeDashoffset="-85" strokeLinecap="round" strokeWidth="4"></path>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">2.4k</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">AWS</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">60%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Azure</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">25%</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">GCP</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">15%</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Discoveries</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                  <div className="size-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">storage</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">New S3 Bucket</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">prod-backup-2024 • 5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                  <div className="size-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-600">functions</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Lambda Function Created</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">data-processor-v2 • 12 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                  <div className="size-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600">account_tree</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">IAM Role Updated</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">api-gateway-role • 1 hour ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AssetInventory;
