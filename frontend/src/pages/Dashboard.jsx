import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function Dashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [awsAccounts, setAwsAccounts] = useState([]);
  const [scanResults, setScanResults] = useState(null);

  const scanSteps = [
    { message: 'Initializing scan engine...', duration: 1000 },
    { message: 'Connecting to AWS infrastructure...', duration: 1500 },
    { message: 'Performing deep security scan...', duration: 2000 },
    { message: 'Identifying vulnerabilities...', duration: 1800 },
    { message: 'Analyzing IAM policies...', duration: 1500 },
    { message: 'Checking S3 bucket permissions...', duration: 1200 },
    { message: 'Evaluating network configurations...', duration: 1400 },
    { message: 'Generating risk assessment report...', duration: 1600 },
    { message: 'Finalizing results...', duration: 1000 }
  ];

  // Fetch AWS accounts on component mount
  useEffect(() => {
    const fetchAWSAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/aws/accounts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAwsAccounts(response.data.accounts || []);
      } catch (error) {
        console.error('Error fetching AWS accounts:', error);
      }
    };
    fetchAWSAccounts();
  }, []);

  const sendEmailNotification = async (results) => {
    const notificationEmail = localStorage.getItem('notificationEmail');
    if (!notificationEmail) {
      console.log('No email registered for notifications');
      return;
    }

    const criticalIssues = results?.findings?.filter(f => f.severity === 'CRITICAL') || [];
    const criticalSummary = criticalIssues.slice(0, 4).map(issue => `- ${issue.title}`).join('\n');

    const templateParams = {
      to_email: notificationEmail,
      risk_score: String(results?.riskScore || 0),
      critical_count: String(results?.criticalCount || 0).padStart(2, '0'),
      summary: `Security scan completed for your AWS infrastructure.

Key Findings:
• ${results?.criticalCount || 0} Critical security issues detected requiring immediate attention
• ${results?.highCount || 0} High severity vulnerabilities identified
• ${results?.complianceScore || 0}% compliance score
• ${results?.totalAssets || 0} total cloud assets scanned

Critical Issues:
${criticalSummary || '- No critical issues found'}

Recommendations:
1. Immediate remediation of critical exposures
2. Review and tighten IAM policy permissions
3. Enable encryption for all storage resources
4. Implement stricter network security group rules

All identified issues have been prioritized by severity. Please review the full report and take immediate action on critical findings.`,
      report_url: window.location.origin + '/dashboard'
    };

    console.log('Sending email to:', notificationEmail);
    console.log('Template params:', templateParams);

    try {
      const response = await emailjs.send(
        'service_9vpbnc9',
        'template_iez0xt1',
        templateParams,
        '-KWGtk7EXHzDcOHsF'
      );
      console.log('Email sent successfully:', response);
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  };

  const handleScan = async () => {
    if (awsAccounts.length === 0) {
      alert('No AWS accounts connected. Please connect an AWS account first.');
      return;
    }

    console.log('🚀 Starting scan...');
    console.log('📋 AWS Accounts available:', awsAccounts.length);
    console.log('🎯 Using account:', awsAccounts[0].accountName, '(ID:', awsAccounts[0].id, ')');

    setIsScanning(true);
    setShowResults(false);
    setScanResults(null);

    try {
      const token = localStorage.getItem('token');
      
      console.log('📤 Sending scan request to backend...');
      console.log('Request payload:', {
        scanType: 'full',
        awsAccountId: awsAccounts[0].id
      });
      
      // Start scan with first AWS account
      const scanPromise = axios.post(
        `${API_URL}/scan/start`,
        {
          scanType: 'full',
          awsAccountId: awsAccounts[0].id  // ✅ Use "id" not "_id"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Show progress animation while scanning
      const progressPromise = (async () => {
        for (let i = 0; i < scanSteps.length; i++) {
          setScanProgress(scanSteps[i].message);
          await new Promise(resolve => setTimeout(resolve, scanSteps[i].duration));
        }
      })();

      // Wait for both to complete
      const [scanResponse] = await Promise.all([scanPromise, progressPromise]);

      // Set scan results
      if (scanResponse.data.success) {
        setScanResults(scanResponse.data.results);
        setShowResults(true);
        await sendEmailNotification(scanResponse.data.results);
      }

    } catch (error) {
      console.error('Scan error:', error);
      alert('Scan failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="relative h-screen flex overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      <div className="absolute inset-0 hero-grid opacity-40 dark:hidden pointer-events-none"></div>
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header 
          title="Security Command Center" 
          subtitle="Global cloud infrastructure real-time monitoring"
          onScan={handleScan}
          isScanning={isScanning}
        />
        
        {/* Scanning Overlay */}
        {isScanning && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="max-w-md w-full mx-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col items-center space-y-6">
                  {/* Animated Scanner Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                    <div className="relative size-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                      <span className="material-symbols-outlined !text-4xl text-white animate-pulse">radar</span>
                    </div>
                  </div>
                  
                  {/* Progress Text */}
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Security Scan in Progress</h3>
                    <p className="text-sm text-primary font-semibold animate-pulse">{scanProgress}</p>
                  </div>
                  
                  {/* Loading Bar */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full animate-progress"></div>
                  </div>
                  
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Analyzing your cloud infrastructure for security vulnerabilities...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-red-500">dangerous</span>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                  {scanResults ? 'Updated' : 'Waiting'}
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {scanResults ? String(scanResults.criticalCount).padStart(2, '0') : '--'}
              </p>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Critical Risks</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-amber-500">warning</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                  {scanResults ? 'Updated' : 'Waiting'}
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {scanResults ? scanResults.highCount : '--'}
              </p>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">High Severity</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-primary">verified</span>
                <span className="text-[10px] font-bold text-primary bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                  {scanResults ? 'Updated' : 'Waiting'}
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {scanResults ? `${scanResults.complianceScore}%` : '--'}
              </p>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Compliance Score</p>
            </div>
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">inventory_2</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                  AWS
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                {scanResults ? scanResults.totalAssets : '--'}
              </p>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Assets</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Vulnerability Trends</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Detected vulnerabilities over the last 30 days</p>
                </div>
                <select className="text-xs font-bold bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg px-2 py-1 outline-none">
                  <option>Last 30 Days</option>
                  <option>Last 7 Days</option>
                </select>
              </div>
              <div className="h-64 w-full">
                <svg className="w-full h-full" viewBox="0 0 800 200">
                  <defs>
                    <linearGradient id="mainChartGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.1"></stop>
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <polyline fill="none" points="0,150 100,120 200,140 300,80 400,100 500,40 600,60 700,20 800,50" stroke="#1d4ed8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></polyline>
                  <path d="M0,150 L100,120 L200,140 L300,80 L400,100 L500,40 L600,60 L700,20 L800,50 V200 H0 Z" fill="url(#mainChartGradient)"></path>
                  <circle cx="300" cy="80" fill="#1d4ed8" r="4"></circle>
                  <circle cx="500" cy="40" fill="#1d4ed8" r="4"></circle>
                  <circle cx="700" cy="20" fill="#1d4ed8" r="4"></circle>
                </svg>
              </div>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex flex-col">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6">Cloud Asset Inventory</h3>
              <div className="flex-1 flex flex-col items-center justify-center">
                {scanResults ? (
                  <>
                    <div className="relative size-44">
                      <svg className="size-full" viewBox="0 0 36 36">
                        <path className="text-blue-100 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                        <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeLinecap="round" strokeWidth="4"></path>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          {scanResults.totalAssets < 1000 ? scanResults.totalAssets : `${(scanResults.totalAssets / 1000).toFixed(1)}k`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Assets</span>
                      </div>
                    </div>
                    <div className="mt-8 w-full">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">AWS</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">100%</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <span className="material-symbols-outlined !text-4xl mb-2">inventory_2</span>
                    <p className="text-sm font-semibold">No asset data</p>
                    <p className="text-xs mt-1">Run a scan to view assets</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white">Real-time Findings Feed</h3>
                <button className="text-xs font-bold text-primary hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {scanResults && scanResults.findings && scanResults.findings.length > 0 ? (
                  scanResults.findings.slice(0, 3).map((finding, index) => {
                    const severityColors = {
                      CRITICAL: { dot: 'status-dot-critical', badge: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
                      HIGH: { dot: 'status-dot-high', badge: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
                      MEDIUM: { dot: 'bg-blue-400', badge: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
                      LOW: { dot: 'bg-slate-400', badge: 'text-slate-600 bg-slate-100 dark:bg-slate-700' }
                    };
                    const colors = severityColors[finding.severity] || severityColors.LOW;
                    
                    return (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 transition-hover hover:border-blue-200 dark:hover:border-blue-700">
                        <div className={`size-2 mt-2 rounded-full ${colors.dot}`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{finding.title}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                              {finding.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Resource: {finding.resource} • Service: {finding.service}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Just now</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <span className="material-symbols-outlined !text-4xl mb-2">cloud_off</span>
                    <p className="text-sm font-semibold">No scan results yet</p>
                    <p className="text-xs mt-1">Click "Trigger Full Scan" to analyze your AWS infrastructure</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Risk Heatmap</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Vulnerability density by resource type</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded bg-red-500"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Severe</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded bg-blue-100"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Low</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 h-64">
                <div className="heatmap-cell bg-red-500 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">EC2</div>
                <div className="heatmap-cell bg-red-400 rounded-lg"></div>
                <div className="heatmap-cell bg-red-300 rounded-lg"></div>
                <div className="heatmap-cell bg-amber-200 rounded-lg"></div>
                <div className="heatmap-cell bg-blue-50 rounded-lg"></div>
                <div className="heatmap-cell bg-red-400 rounded-lg"></div>
                <div className="heatmap-cell bg-amber-400 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">S3</div>
                <div className="heatmap-cell bg-amber-300 rounded-lg"></div>
                <div className="heatmap-cell bg-blue-100 rounded-lg"></div>
                <div className="heatmap-cell bg-blue-50 rounded-lg"></div>
                <div className="heatmap-cell bg-amber-400 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">IAM</div>
                <div className="heatmap-cell bg-amber-300 rounded-lg"></div>
                <div className="heatmap-cell bg-blue-200 rounded-lg"></div>
                <div className="heatmap-cell bg-blue-100 rounded-lg"></div>
                <div className="heatmap-cell bg-blue-50 rounded-lg"></div>
                <div className="heatmap-cell bg-blue-200 rounded-lg"></div>
                <div className="heatmap-cell bg-blue-100 rounded-lg"></div>
                <div className="heatmap-cell bg-blue-50 rounded-lg flex items-center justify-center text-slate-400 text-[10px] font-bold">RDS</div>
                <div className="heatmap-cell bg-blue-50 rounded-lg"></div>
                <div className="heatmap-cell bg-blue-50 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <aside className="relative z-50 w-80 flex-shrink-0 bg-slate-50/50 dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-700 overflow-y-auto hidden xl:flex flex-col">
        <div className="p-6 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Compliance Snapshot</h3>
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 !text-sm">verified</span>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">SOC2 Type II</span>
                  <span className="text-primary">100%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">ISO 27001</span>
                  <span className="text-primary">82%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[82%]"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">HIPAA Baseline</span>
                  <span className="text-primary">94%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[94%]"></div>
                </div>
              </div>
            </div>
          </section>
          <hr className="border-slate-200 dark:border-slate-700"/>
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Activity Logs</h3>
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 !text-sm">history</span>
            </div>
            <div className="space-y-6">
              <div className="relative pl-6 pb-6 border-l-2 border-slate-200 dark:border-slate-700">
                <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-white dark:bg-slate-800 border-2 border-primary"></div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Automation Triggered</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Remediated S3 public access on bucket 'backup-vault-01'</p>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-2 block">12:44 PM • 14 Mar</span>
              </div>
              <div className="relative pl-6 pb-6 border-l-2 border-slate-200 dark:border-slate-700">
                <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600"></div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Scan Completed</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Scheduled weekly compliance scan for AWS Production completed.</p>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-2 block">10:15 AM • 14 Mar</span>
              </div>
              <div className="relative pl-6 border-l-2 border-transparent">
                <div className="absolute -left-[9px] top-0 size-4 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600"></div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">API Key Created</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">User 'admin_js' created a new read-only API key.</p>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-2 block">09:30 AM • 14 Mar</span>
              </div>
            </div>
            <button className="w-full mt-8 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all">
              View Audit Trail
            </button>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default Dashboard;
