import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function Vulnerabilities() {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');

  useEffect(() => {
    const fetchScanHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/scan/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success && response.data.scans && response.data.scans.length > 0) {
          const latestScan = response.data.scans[0];
          if (latestScan.results && latestScan.results.findings) {
            setVulnerabilities(latestScan.results.findings);
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

  const filteredVulnerabilities = vulnerabilities.filter(vuln => {
    const severityMatch = severityFilter === 'All' || vuln.severity === severityFilter;
    const serviceMatch = serviceFilter === 'All' || vuln.service === serviceFilter;
    return severityMatch && serviceMatch;
  });

  const getSeverityColor = (severity) => {
    switch(severity) {
      case "CRITICAL": return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      case "HIGH": return "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30";
      case "MEDIUM": return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      case "LOW": return "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700";
      default: return "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700";
    }
  };

  const getSeverityDot = (severity) => {
    switch(severity) {
      case "CRITICAL": return "status-dot-critical";
      case "HIGH": return "status-dot-high";
      case "MEDIUM": return "bg-blue-400";
      case "LOW": return "bg-slate-400";
      default: return "bg-slate-400";
    }
  };

  const services = ['All', ...new Set(vulnerabilities.map(v => v.service))];
  const severities = ['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div className="relative h-screen flex overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      <div className="absolute inset-0 hero-grid opacity-40 dark:hidden pointer-events-none"></div>
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header 
          title="Vulnerabilities" 
          subtitle="Detailed security findings and remediation guidance"
          actionButton={<div></div>}
        />
        
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select 
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2 outline-none">
                {severities.map(sev => (
                  <option key={sev} value={sev}>{sev === 'All' ? 'All Severities' : sev}</option>
                ))}
              </select>
              <select 
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-2 outline-none">
                {services.map(service => (
                  <option key={service} value={service}>{service === 'All' ? 'All Services' : service}</option>
                ))}
              </select>
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {filteredVulnerabilities.length} finding{filteredVulnerabilities.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <span className="material-symbols-outlined !text-4xl text-slate-400 animate-spin mb-4">sync</span>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading vulnerabilities...</p>
              </div>
            </div>
          ) : filteredVulnerabilities.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <span className="material-symbols-outlined !text-4xl text-slate-400 mb-4">check_circle</span>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No vulnerabilities found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Run a security scan to identify potential vulnerabilities</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVulnerabilities.map((vuln, index) => (
                <div key={index} className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`size-3 mt-1 rounded-full ${getSeverityDot(vuln.severity)}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{vuln.issue || vuln.title || 'Security Issue'}</h3>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${getSeverityColor(vuln.severity)}`}>
                            {vuln.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                            {vuln.service}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                          {vuln.description || 'Security vulnerability detected. Review the details below for more information.'}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 font-bold">Resource:</span>
                            <span className="text-slate-700 dark:text-slate-300 ml-2 font-semibold">{vuln.resource || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 font-bold">Service:</span>
                            <span className="text-slate-700 dark:text-slate-300 ml-2 font-semibold">{vuln.service}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 font-bold">Timestamp:</span>
                            <span className="text-slate-700 dark:text-slate-300 ml-2 font-semibold">
                              {vuln.timestamp ? new Date(vuln.timestamp).toLocaleDateString() : 'Recently'}
                            </span>
                          </div>
                        </div>
                        {/* Remediation Section */}
                        <div className="mt-4 space-y-3">
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p className="text-xs font-bold text-primary mb-2">Recommended Remediation:</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                              {vuln.detailed_remediation || vuln.remediation || 'No remediation information available'}
                            </p>
                          </div>
                          
                          {/* AI-Enhanced Business Impact */}
                          {vuln.business_impact && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">Business Impact:</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{vuln.business_impact}</p>
                            </div>
                          )}
                          
                          {/* AI-Enhanced Prevention Tips */}
                          {vuln.prevention_tips && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                              <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-2">Prevention Tips:</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{vuln.prevention_tips}</p>
                            </div>
                          )}
                          
                          {/* AI Enhanced Badge */}
                          {vuln.ai_enhanced && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="material-symbols-outlined !text-sm">auto_awesome</span>
                              <span className="font-semibold">Enhanced with AI</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Vulnerabilities;
