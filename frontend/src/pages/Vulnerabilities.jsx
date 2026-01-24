import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

function Vulnerabilities() {
  const vulnerabilities = [
    {
      id: 1,
      title: "Public S3 Bucket Detected",
      severity: "CRITICAL",
      service: "S3",
      resource: "prod-storage-01",
      account: "821033442",
      region: "us-east-1",
      description: "S3 bucket is publicly accessible without proper access controls",
      remediation: "Enable Block Public Access and review bucket policies",
      detectedAt: "2 minutes ago",
      status: "open"
    },
    {
      id: 2,
      title: "Overprivileged IAM Policy",
      severity: "HIGH",
      service: "IAM",
      resource: "dev-lambda-role",
      account: "110229334",
      region: "us-west-2",
      description: "IAM role has excessive permissions including full S3 access",
      remediation: "Apply principle of least privilege and restrict permissions",
      detectedAt: "14 minutes ago",
      status: "open"
    },
    {
      id: 3,
      title: "Unencrypted RDS Instance",
      severity: "HIGH",
      service: "RDS",
      resource: "prod-database-01",
      account: "821033442",
      region: "us-east-1",
      description: "RDS instance is not encrypted at rest",
      remediation: "Enable encryption and create encrypted snapshot",
      detectedAt: "1 hour ago",
      status: "open"
    },
    {
      id: 4,
      title: "Open Security Group Port",
      severity: "MEDIUM",
      service: "EC2",
      resource: "sg-08221ad",
      account: "821033442",
      region: "us-east-1",
      description: "Security group allows SSH (22) from 0.0.0.0/0",
      remediation: "Restrict SSH access to specific IP ranges",
      detectedAt: "2 hours ago",
      status: "open"
    },
    {
      id: 5,
      title: "Missing CloudTrail Logging",
      severity: "MEDIUM",
      service: "CloudTrail",
      resource: "us-east-1-trail",
      account: "110229334",
      region: "us-east-1",
      description: "CloudTrail is not enabled for all regions",
      remediation: "Enable CloudTrail for all regions and enable log file validation",
      detectedAt: "3 hours ago",
      status: "open"
    }
  ];

  const getSeverityColor = (severity) => {
    switch(severity) {
      case "CRITICAL": return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      case "HIGH": return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30";
      case "MEDIUM": return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      default: return "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700";
    }
  };

  return (
    <div className="relative h-screen flex overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      <div className="absolute inset-0 hero-grid opacity-40 dark:hidden pointer-events-none"></div>
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header 
          title="Vulnerabilities" 
          subtitle="Detailed security findings and remediation guidance"
        />
        
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select className="text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2 outline-none">
                <option>All Severities</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              <select className="text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2 outline-none">
                <option>All Services</option>
                <option>S3</option>
                <option>IAM</option>
                <option>EC2</option>
                <option>RDS</option>
              </select>
            </div>
            <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-800 transition-all">
              <span className="material-symbols-outlined !text-sm">download</span>
              Export Report
            </button>
          </div>

          <div className="space-y-4">
            {vulnerabilities.map((vuln) => (
              <div key={vuln.id} className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`size-3 mt-1 rounded-full ${vuln.severity === 'CRITICAL' ? 'status-dot-critical' : vuln.severity === 'HIGH' ? 'status-dot-high' : 'bg-blue-400'}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{vuln.title}</h3>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getSeverityColor(vuln.severity)}`}>
                          {vuln.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                          {vuln.service}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{vuln.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 font-bold">Resource:</span>
                          <span className="text-slate-700 dark:text-slate-300 ml-2 font-semibold">{vuln.resource}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 font-bold">Account:</span>
                          <span className="text-slate-700 dark:text-slate-300 ml-2 font-semibold">{vuln.account}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 font-bold">Region:</span>
                          <span className="text-slate-700 dark:text-slate-300 ml-2 font-semibold">{vuln.region}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500 font-bold">Detected:</span>
                          <span className="text-slate-700 dark:text-slate-300 ml-2 font-semibold">{vuln.detectedAt}</span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <p className="text-xs font-bold text-primary mb-1">Recommended Remediation:</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{vuln.remediation}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-800 transition-all">
                      <span className="material-symbols-outlined !text-sm">check_circle</span>
                      Mark Resolved
                    </button>
                    <button className="flex items-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                      <span className="material-symbols-outlined !text-sm">info</span>
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Vulnerabilities;
