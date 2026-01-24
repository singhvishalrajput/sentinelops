import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function AssetInventory() {
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScanHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/scan/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success && response.data.scans && response.data.scans.length > 0) {
          const latestScan = response.data.scans[0];
          if (latestScan.results) {
            setScanData(latestScan.results);
          }
        }
      } catch (error) {
        console.error('Error fetching scan history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScanHistory();
  }, []);

  // Build asset breakdown from findings
  const getAssetBreakdown = () => {
    if (!scanData || !scanData.findings) return [];

    const services = {};
    scanData.findings.forEach(finding => {
      const service = finding.service;
      if (!services[service]) {
        services[service] = { service, count: 0, critical: 0, high: 0, medium: 0, low: 0 };
      }
      services[service].count++;
      const severity = finding.severity.toLowerCase();
      if (severity === 'critical') services[service].critical++;
      else if (severity === 'high') services[service].high++;
      else if (severity === 'medium') services[service].medium++;
      else services[service].low++;
    });

    return Object.values(services);
  };

  const assets = getAssetBreakdown();
  const totalIssues = scanData?.total_issues || 0;
  const totalAssets = scanData?.findings?.length || 0;

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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <span className="material-symbols-outlined !text-4xl text-slate-400 animate-spin mb-4">sync</span>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading assets...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Total Assets</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{totalAssets}</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Security Issues</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{totalIssues}</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Critical</p>
                  <p className="text-3xl font-black text-red-600">{scanData?.severity_breakdown?.critical || 0}</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">High Risk</p>
                  <p className="text-3xl font-black text-amber-600">{scanData?.severity_breakdown?.high || 0}</p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Service Breakdown</h3>
                  <button className="text-sm font-bold text-primary hover:underline">View All</button>
                </div>
                {assets.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <span className="material-symbols-outlined !text-4xl mb-2">cloud_off</span>
                    <p className="text-sm font-semibold">No asset data available</p>
                    <p className="text-xs mt-1">Run a security scan to analyze your AWS resources</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assets.map((asset) => (
                      <div key={asset.service} className="flex items-center gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 transition-all">
                        <div className="w-32">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{asset.service}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{asset.count} resource{asset.count !== 1 ? 's' : ''}</p>
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
                            {asset.low > 0 && (
                              <div className="flex items-center gap-1">
                                <div className="size-2 rounded-full bg-slate-400"></div>
                                <span className="text-xs font-bold text-slate-600">{asset.low} Low</span>
                              </div>
                            )}
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-blue-500" 
                                 style={{ width: `${Math.min(100, ((asset.critical * 4 + asset.high * 2 + asset.medium) / asset.count) * 100)}%` }}></div>
                          </div>
                        </div>
                        <button className="text-xs font-bold text-primary hover:underline">View Details</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Security Distribution</h3>
                  <div className="h-64 flex items-center justify-center">
                    {assets.length === 0 ? (
                      <div className="text-center text-slate-400 dark:text-slate-500">
                        <p className="text-sm font-semibold">No data to display</p>
                      </div>
                    ) : (
                      <div className="relative size-48">
                        <svg className="size-full" viewBox="0 0 36 36">
                          <path className="text-blue-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                          {assets.length > 0 && (
                            <>
                              <path className="text-red-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${(scanData?.severity_breakdown?.critical || 0) * 10}, 100`} strokeLinecap="round" strokeWidth="4"></path>
                            </>
                          )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">{assets.length}</span>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Services</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 mt-6">
                    {assets.length > 0 ? (
                      assets.map(asset => (
                        <div key={asset.service} className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{asset.service}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{asset.count} resources</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 dark:text-slate-500 text-sm">No service data</p>
                    )}
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Findings</h3>
                  <div className="space-y-4">
                    {scanData?.findings?.slice(0, 3).map((finding, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                        <div className={`size-12 rounded-lg flex items-center justify-center ${
                          finding.severity === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/30' : 
                          finding.severity === 'HIGH' ? 'bg-amber-100 dark:bg-amber-900/30' :
                          'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          <span className={`material-symbols-outlined ${
                            finding.severity === 'CRITICAL' ? 'text-red-600' : 
                            finding.severity === 'HIGH' ? 'text-amber-600' :
                            'text-blue-600'
                          }`}>warning_amber</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{finding.issue || finding.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{finding.service} • {finding.severity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AssetInventory;
