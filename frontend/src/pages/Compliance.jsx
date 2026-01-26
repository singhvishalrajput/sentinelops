import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { ShieldCheck, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

function Compliance() {
  return (
    <div className="relative h-screen flex overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      <div className="absolute inset-0 hero-grid opacity-40 dark:hidden pointer-events-none"></div>
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header 
          title="Compliance Center" 
          subtitle="Monitor compliance across regulatory frameworks and standards"
        />
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Compliance Score</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">98.5%</p>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '98.5%' }}></div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-12 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="text-amber-500" size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Failed Checks</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">12</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">4 critical, 8 medium severity</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-emerald-500" size={24} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Passed Checks</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">428</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Across all frameworks</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Framework Coverage</h3>
            <div className="space-y-4">
              {[
                { name: "SOC 2 Type II", score: 100, checks: "42/42" },
                { name: "ISO 27001", score: 98, checks: "68/70" },
                { name: "GDPR", score: 96, checks: "88/92" },
                { name: "HIPAA", score: 100, checks: "124/124" },
                { name: "PCI DSS", score: 95, checks: "102/108" }
              ].map((framework) => (
                <div key={framework.name} className="flex items-center gap-4">
                  <div className="w-32">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{framework.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{framework.checks} passed</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full" 
                        style={{ width: `${framework.score}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white w-16 text-right">
                    {framework.score}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Failed Checks</h3>
              <div className="space-y-3">
                {[
                  { id: 1, check: "CloudTrail Multi-Region", severity: "CRITICAL", framework: "SOC 2" },
                  { id: 2, check: "S3 Bucket Versioning", severity: "HIGH", framework: "ISO 27001" },
                  { id: 3, check: "RDS Backup Retention", severity: "MEDIUM", framework: "HIPAA" },
                  { id: 4, check: "VPC Flow Logs", severity: "MEDIUM", framework: "PCI DSS" }
                ].map((check) => (
                  <div key={check.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{check.check}</p>
                      <p className="text-xs text-slate-500">{check.framework}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      check.severity === "CRITICAL" ? "bg-red-100 text-red-600" :
                      check.severity === "HIGH" ? "bg-amber-100 text-amber-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {check.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Compliance Trends</h3>
              <div className="h-48 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <TrendingUp size={60} className="mb-2 mx-auto" />
                  <p className="text-sm">Compliance score improving</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Compliance;
