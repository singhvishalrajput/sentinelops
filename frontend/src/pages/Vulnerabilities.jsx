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
  const [selectedProvider, setSelectedProvider] = useState('aws'); // 'aws' or 'azure'

  useEffect(() => {
    const fetchScanHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/scan/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success && response.data.scans && response.data.scans.length > 0) {
          // Filter scans by selected provider
          const providerScans = response.data.scans.filter(scan => {
            const cloudProvider = scan.results?.cloudProvider?.toLowerCase();
            return cloudProvider === selectedProvider;
          });

          if (providerScans.length > 0) {
            const latestScan = providerScans[0];
            if (latestScan.results && latestScan.results.findings) {
              setVulnerabilities(latestScan.results.findings);
            }
          } else {
            setVulnerabilities([]);
          }
        }
      } catch (error) {
        console.error('Error fetching scan history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScanHistory();
  }, [selectedProvider]); // Re-fetch when provider changes

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
          {/* Cloud Provider Selector */}
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Cloud Provider:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedProvider('aws')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  selectedProvider === 'aws'
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 304 182" fill="currentColor">
                  <path d="M86.4 66.4c0 3.7.4 6.7 1.1 8.9.8 2.2 1.8 4.6 3.2 7.2.5.8.7 1.6.7 2.3 0 1-.6 2-1.9 3l-6.3 4.2c-.9.6-1.8.9-2.6.9-1 0-2-.5-3-1.4-1.4-1.5-2.6-3.1-3.6-4.7-1-1.7-2-3.6-3.1-5.9-7.8 9.2-17.6 13.8-29.4 13.8-8.4 0-15.1-2.4-20-7.2-4.9-4.8-7.4-11.2-7.4-19.2 0-8.5 3-15.4 9.1-20.6s14.2-7.8 24.5-7.8c3.4 0 6.9.3 10.6.8 3.7.5 7.5 1.3 11.5 2.2v-7.3c0-7.6-1.6-12.9-4.7-16-3.2-3.1-8.6-4.6-16.3-4.6-3.5 0-7.1.4-10.8 1.3-3.7.9-7.3 2-10.8 3.4-1.6.7-2.8 1.1-3.5 1.3-.7.2-1.2.3-1.6.3-1.4 0-2.1-1-2.1-3.1v-4.9c0-1.6.2-2.8.7-3.5.5-.7 1.4-1.4 2.8-2.1 3.5-1.8 7.7-3.3 12.6-4.5 4.9-1.3 10.1-1.9 15.6-1.9 11.9 0 20.6 2.7 26.2 8.1 5.5 5.4 8.3 13.6 8.3 24.6v32.4zm-40.6 15.2c3.3 0 6.7-.6 10.3-1.8 3.6-1.2 6.8-3.4 9.5-6.4 1.6-1.9 2.8-4 3.4-6.4.6-2.4 1-5.3 1-8.7v-4.2c-2.9-.7-6-1.3-9.2-1.7-3.2-.4-6.3-.6-9.4-.6-6.7 0-11.6 1.3-14.9 4-3.3 2.7-4.9 6.5-4.9 11.5 0 4.7 1.2 8.2 3.7 10.6 2.4 2.5 5.9 3.7 10.5 3.7zm80.3 10.8c-1.8 0-3-.3-3.8-.9-.8-.6-1.5-2-2.1-3.9L96.7 10.2c-.6-2-.9-3.3-.9-4 0-1.6.8-2.5 2.4-2.5h9.8c1.9 0 3.2.3 3.9.9.8.6 1.4 2 2 3.9l16.8 66.2 15.6-66.2c.5-2 1.1-3.3 1.9-3.9s2.2-.9 4-.9h8c1.9 0 3.2.3 4 .9.8.6 1.5 2 1.9 3.9l15.8 67 17.3-67c.6-2 1.3-3.3 2-3.9.8-.6 2.1-.9 3.9-.9h9.3c1.6 0 2.5.8 2.5 2.5 0 .5-.1 1-.2 1.6-.1.6-.3 1.4-.7 2.5l-24.1 77.3c-.6 2-1.3 3.3-2.1 3.9-.8.6-2.1.9-3.8.9h-8.6c-1.9 0-3.2-.3-4-.9-.8-.6-1.5-2-1.9-4L156 23l-15.4 64.4c-.5 2-1.1 3.3-1.9 4-.8.6-2.2.9-4 .9h-8.6zm128.5 2.7c-5.2 0-10.4-.6-15.4-1.8-5-1.2-8.9-2.5-11.5-4-1.6-.9-2.7-1.9-3.1-2.8-.4-.9-.6-1.9-.6-2.8v-5.1c0-2.1.8-3.1 2.3-3.1.6 0 1.2.1 1.8.3.6.2 1.5.6 2.5 1 3.4 1.5 7.1 2.7 11 3.5 4 .8 7.9 1.2 11.9 1.2 6.3 0 11.2-1.1 14.6-3.3 3.4-2.2 5.2-5.4 5.2-9.5 0-2.8-.9-5.1-2.7-7-1.8-1.9-5.2-3.6-10.1-5.2L246 52c-7.3-2.3-12.7-5.7-16-10.2-3.3-4.4-5-9.3-5-14.5 0-4.2.9-7.9 2.7-11.1 1.8-3.2 4.2-6 7.2-8.2 3-2.3 6.4-4 10.4-5.2 4-1.2 8.2-1.7 12.6-1.7 2.2 0 4.5.1 6.7.4 2.3.3 4.4.7 6.5 1.1 2 .5 3.9 1 5.7 1.6 1.8.6 3.2 1.2 4.2 1.8 1.4.8 2.4 1.6 3 2.5.6.8.9 1.9.9 3.3v4.7c0 2.1-.8 3.2-2.3 3.2-.8 0-2.1-.4-3.8-1.2-5.7-2.6-12.1-3.9-19.2-3.9-5.7 0-10.2.9-13.3 2.8-3.1 1.9-4.7 4.8-4.7 8.9 0 2.8 1 5.2 3 7.1 2 1.9 5.7 3.8 11 5.5l14.2 4.5c7.2 2.3 12.4 5.5 15.5 9.6 3.1 4.1 4.6 8.8 4.6 14 0 4.3-.9 8.2-2.6 11.6-1.8 3.4-4.2 6.4-7.3 8.8-3.1 2.5-6.8 4.3-11.1 5.6-4.5 1.4-9.2 2.1-14.3 2.1z"/>
                </svg>
                AWS
              </button>
              <button
                onClick={() => setSelectedProvider('azure')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  selectedProvider === 'azure'
                    ? 'bg-[#0078D4] text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 96 96" fill="currentColor">
                  <path d="M25.8 66.4L47.5 9.7h19.2L42.2 66.4zm18.3 0L66.6 23l17.9 43.4h-23l-7.2 18.7L29.4 81z"/>
                </svg>
                Azure
              </button>
            </div>
          </div>

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
