import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

function Automation() {
  return (
    <div className="relative h-screen flex overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      <div className="absolute inset-0 hero-grid opacity-40 dark:hidden pointer-events-none"></div>
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header 
          title="Automation Hub" 
          subtitle="Automated remediation and security playbooks"
        />
        
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Active Playbooks</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">24</p>
              <p className="text-xs text-emerald-600 mt-2">12 running now</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Auto-Remediated</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">156</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">This month</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Success Rate</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">98.5%</p>
              <p className="text-xs text-emerald-600 mt-2">+2.3% vs last month</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Time Saved</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">142h</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Manual work avoided</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security Playbooks</h3>
              <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-800 transition-all">
                <span className="material-symbols-outlined !text-sm">add</span>
                Create Playbook
              </button>
            </div>
            <div className="space-y-3">
              {[
                { 
                  name: "Auto-Encrypt S3 Buckets", 
                  status: "active", 
                  triggers: "New S3 bucket detected",
                  executions: 42,
                  lastRun: "2 minutes ago"
                },
                { 
                  name: "Remediate Public RDS", 
                  status: "active", 
                  triggers: "Public RDS instance found",
                  executions: 8,
                  lastRun: "1 hour ago"
                },
                { 
                  name: "Enable CloudTrail", 
                  status: "active", 
                  triggers: "CloudTrail disabled",
                  executions: 3,
                  lastRun: "5 hours ago"
                },
                { 
                  name: "Rotate IAM Keys", 
                  status: "paused", 
                  triggers: "IAM key older than 90 days",
                  executions: 124,
                  lastRun: "1 day ago"
                },
                { 
                  name: "Patch EC2 Instances", 
                  status: "active", 
                  triggers: "Critical CVE detected",
                  executions: 67,
                  lastRun: "3 hours ago"
                }
              ].map((playbook, index) => (
                <div key={index} className="flex items-center gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{playbook.name}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        playbook.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                      }`}>
                        {playbook.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Trigger: {playbook.triggers}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{playbook.executions} runs</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Last: {playbook.lastRun}</p>
                  </div>
                  <button className="text-slate-400 hover:text-primary">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Executions</h3>
              <div className="space-y-3">
                {[
                  { action: "S3 Bucket Encrypted", resource: "prod-data-01", status: "success", time: "2 min ago" },
                  { action: "Security Group Updated", resource: "sg-0821a", status: "success", time: "15 min ago" },
                  { action: "CloudTrail Enabled", resource: "us-east-1", status: "success", time: "1 hour ago" },
                  { action: "IAM Policy Restricted", resource: "dev-role", status: "failed", time: "2 hours ago" }
                ].map((execution, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`size-2 rounded-full ${
                        execution.status === "success" ? "bg-emerald-500" : "bg-red-500"
                      }`}></div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{execution.action}</p>
                        <p className="text-xs text-slate-500">{execution.resource}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{execution.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl bg-white border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Automation Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-600">Success Rate</span>
                    <span className="text-sm font-bold text-slate-900">98.5%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '98.5%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-600">Avg Response Time</span>
                    <span className="text-sm font-bold text-slate-900">2.3s</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-600">Coverage</span>
                    <span className="text-sm font-bold text-slate-900">87%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: '87%' }}></div>
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

export default Automation;
