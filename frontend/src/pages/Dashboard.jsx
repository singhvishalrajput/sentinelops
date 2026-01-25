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
  const [scanId, setScanId] = useState(null); // Track scan ID for PDF download
  const [scanHistory, setScanHistory] = useState([]); // Track scan history for trends

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

  // Fetch last scan results on component mount
  useEffect(() => {
    const fetchLastScanResults = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/scan/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success && response.data.scans && response.data.scans.length > 0) {
          // Store all scans for historical trends
          setScanHistory(response.data.scans.slice(0, 10)); // Last 10 scans
          
          const latestScan = response.data.scans[0];
          if (latestScan.results) {
            console.log('📊 Loading last scan results:', latestScan.results);
            setScanResults(latestScan.results);
            // Set pythonScanId if available for PDF download
            if (latestScan.results.pythonScanId) {
              setScanId(latestScan.results.pythonScanId);
              console.log('🆔 Loaded scan ID:', latestScan.results.pythonScanId);
            }
            setShowResults(true);
          }
        }
      } catch (error) {
        console.error('Error fetching last scan:', error);
      }
    };

    fetchLastScanResults();
  }, []);

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
    const criticalSummary = criticalIssues.slice(0, 4).map(issue => `- ${issue.issue || issue.description || 'Security Issue'}`).join('\n');

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

  const downloadReport = async () => {
    if (!scanId) {
      alert('No scan available for download. Please run a scan first.');
      return;
    }

    try {
      console.log('📥 Downloading PDF report for scan ID:', scanId);
      
      // Request PDF from Python backend
      const response = await axios.get(
        `http://localhost:5001/api/scan/${scanId}/download`,
        {
          responseType: 'blob' // Important for file download
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `security_report_${scanId}_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      console.log('✅ PDF report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report: ' + (error.response?.data?.message || error.message));
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
        console.log('✅ Scan completed successfully!');
        console.log('📊 Scan response:', scanResponse.data);
        console.log('🆔 Scan ID (for PDF):', scanResponse.data.scan_id);
        console.log('🆔 Python Scan ID:', scanResponse.data.pythonScanId);
        
        setScanResults(scanResponse.data.results);
        setScanId(scanResponse.data.scan_id || scanResponse.data.pythonScanId); // Save scan ID for PDF download
        setShowResults(true);
        
        console.log('💾 State updated - scanId:', scanResponse.data.scan_id || scanResponse.data.pythonScanId);
        console.log('💾 State updated - scanResults:', !!scanResponse.data.results);
        
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
          
          {/* Download Report Button - Show after scan completes */}
          {(() => {
            console.log('🔍 Download button check:', { 
              hasScanResults: !!scanResults, 
              hasScanId: !!scanId,
              scanId: scanId,
              shouldShow: !!(scanResults && scanId)
            });
            return scanResults && scanId;
          })() && (
            <div className="flex justify-center">
              <button
                onClick={downloadReport}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all transform hover:scale-105"
              >
                <span className="material-symbols-outlined">download</span>
                Download Security Report (PDF)
              </button>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Vulnerability Trends</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {scanHistory.length > 0 ? `Showing last ${scanHistory.length} scans` : 'No scan history available'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded-full bg-red-500"></div>
                    <span className="text-[10px] font-bold text-slate-400">Critical</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded-full bg-amber-500"></div>
                    <span className="text-[10px] font-bold text-slate-400">High</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] font-bold text-slate-400">Medium</span>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full ">
                {scanHistory.length > 0 ? (
                  (() => {
                    // Calculate dynamic scaling based on max values
                    const scans = scanHistory.slice(0, 8).reverse();
                    const maxCritical = Math.max(...scans.map(s => s.results?.criticalCount || 0), 1);
                    const maxHigh = Math.max(...scans.map(s => s.results?.highCount || 0), 1);
                    const maxMedium = Math.max(...scans.map(s => s.results?.mediumCount || 0), 1);
                    const maxValue = Math.max(maxCritical, maxHigh, maxMedium, 5); // Minimum scale of 5
                    
                    // Dynamic scaling: spread data across 140px height
                    const scale = 140 / maxValue;
                    
                    return (
                      <svg className="w-full h-full" viewBox="0 0 800 220" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id="criticalGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2"></stop>
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0"></stop>
                          </linearGradient>
                          <linearGradient id="highGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15"></stop>
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"></stop>
                          </linearGradient>
                          <linearGradient id="mediumGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1"></stop>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"></stop>
                          </linearGradient>
                        </defs>
                        
                        {/* Grid lines */}
                        {[20, 60, 100, 140].map(y => (
                          <line key={y} x1="40" y1={20 + (140 - y)} x2="760" y2={20 + (140 - y)} stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-700" />
                        ))}
                        
                        {/* Calculate points */}
                        {(() => {
                          const getX = (i) => {
                            if (scans.length === 1) return 400; // Center single point
                            return 40 + (i * 720) / (scans.length - 1);
                          };
                          
                          const criticalPoints = scans.map((scan, i) => {
                            const x = getX(i);
                            const value = scan.results?.criticalCount || 0;
                            const y = 160 - (value * scale);
                            return { x, y: Math.max(20, Math.min(160, y)), value };
                          });
                          
                          const highPoints = scans.map((scan, i) => {
                            const x = getX(i);
                            const value = scan.results?.highCount || 0;
                            const y = 160 - (value * scale);
                            return { x, y: Math.max(20, Math.min(160, y)), value };
                          });
                          
                          const mediumPoints = scans.map((scan, i) => {
                            const x = getX(i);
                            const value = scan.results?.mediumCount || 0;
                            const y = 160 - (value * scale);
                            return { x, y: Math.max(20, Math.min(160, y)), value };
                          });
                          
                          return (
                            <>
                              {/* Critical line and area */}
                              <polyline
                                fill="none"
                                points={criticalPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                stroke="#ef4444"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {scans.length > 1 && (
                                <path
                                  d={`M${criticalPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')} L${criticalPoints[criticalPoints.length - 1].x},180 L${criticalPoints[0].x},180 Z`}
                                  fill="url(#criticalGradient)"
                                />
                              )}
                              
                              {/* High line and area */}
                              <polyline
                                fill="none"
                                points={highPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                stroke="#f59e0b"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              {scans.length > 1 && (
                                <path
                                  d={`M${highPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')} L${highPoints[highPoints.length - 1].x},180 L${highPoints[0].x},180 Z`}
                                  fill="url(#highGradient)"
                                />
                              )}
                              
                              {/* Medium line */}
                              <polyline
                                fill="none"
                                points={mediumPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                stroke="#3b82f6"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="5,5"
                              />
                              
                              {/* Data points and labels */}
                              {scans.map((scan, i) => (
                                <g key={i}>
                                  {/* Critical point */}
                                  <circle cx={criticalPoints[i].x} cy={criticalPoints[i].y} r="5" fill="#ef4444" stroke="#fff" strokeWidth="2" />
                                  <text x={criticalPoints[i].x} y={criticalPoints[i].y - 10} fontSize="10" fill="#ef4444" textAnchor="middle" fontWeight="bold">
                                    {criticalPoints[i].value}
                                  </text>
                                  
                                  {/* High point */}
                                  <circle cx={highPoints[i].x} cy={highPoints[i].y} r="4" fill="#f59e0b" />
                                  <text x={highPoints[i].x + 15} y={highPoints[i].y + 4} fontSize="9" fill="#f59e0b" fontWeight="bold">
                                    {highPoints[i].value}
                                  </text>
                                  
                                  {/* Medium point */}
                                  <circle cx={mediumPoints[i].x} cy={mediumPoints[i].y} r="4" fill="#3b82f6" />
                                  <text x={mediumPoints[i].x - 15} y={mediumPoints[i].y + 4} fontSize="9" fill="#3b82f6" fontWeight="bold">
                                    {mediumPoints[i].value}
                                  </text>
                                  
                                  {/* Date label */}
                                  <text x={criticalPoints[i].x} y="200" fontSize="9" fill="currentColor" textAnchor="middle" className="text-slate-400 dark:text-slate-500">
                                    {new Date(scan.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </text>
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    );
                  })()
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <span className="material-symbols-outlined !text-5xl mb-3 opacity-30">query_stats</span>
                    <p className="text-sm font-semibold">No trend data available</p>
                    <p className="text-xs mt-1">Run multiple scans to see vulnerability trends</p>
                  </div>
                )}
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
                  <p className="text-xs text-slate-400 dark:text-slate-500">Vulnerability density by AWS service</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded bg-red-500"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Critical</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded bg-amber-400"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">High</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded bg-blue-200"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Medium</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded bg-slate-100 dark:bg-slate-700"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Low</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
                {scanResults && scanResults.findings && scanResults.findings.length > 0 ? (
                  (() => {
                    // Calculate service risk scores
                    const serviceRisks = {};
                    scanResults.findings.forEach(finding => {
                      const service = finding.service || 'Unknown';
                      if (!serviceRisks[service]) {
                        serviceRisks[service] = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
                      }
                      serviceRisks[service][finding.severity.toLowerCase()]++;
                      serviceRisks[service].total++;
                    });

                    // Calculate risk score (weighted)
                    const services = Object.entries(serviceRisks).map(([name, counts]) => ({
                      name,
                      score: (counts.critical * 10) + (counts.high * 5) + (counts.medium * 2) + counts.low,
                      ...counts
                    })).sort((a, b) => b.score - a.score);

                    const maxScore = Math.max(...services.map(s => s.score), 1);

                    // Get color based on risk score
                    const getRiskColor = (score, max) => {
                      const normalized = score / max;
                      if (normalized > 0.7) return 'bg-red-500 text-white';
                      if (normalized > 0.5) return 'bg-red-400 text-white';
                      if (normalized > 0.4) return 'bg-amber-400 text-white';
                      if (normalized > 0.3) return 'bg-amber-300 text-slate-900';
                      if (normalized > 0.2) return 'bg-blue-300 text-slate-900';
                      if (normalized > 0.1) return 'bg-blue-200 text-slate-900';
                      return 'bg-slate-100 dark:bg-slate-700 text-slate-500';
                    };

                    return (
                      <div className="space-y-3">
                        {services.slice(0, 5).map((service) => (
                          <div key={service.name} className="flex items-center gap-3">
                            <div className="w-20 text-xs font-bold text-slate-900 dark:text-white truncate">
                              {service.name}
                            </div>
                            <div className="flex-1 flex items-center gap-1">
                              {/* Critical blocks */}
                              {[...Array(service.critical)].map((_, i) => (
                                <div key={`c-${i}`} className="h-10 flex-1 bg-red-500 rounded transition-all hover:scale-105 cursor-pointer" title={`Critical: ${service.critical}`}></div>
                              ))}
                              {/* High blocks */}
                              {[...Array(service.high)].map((_, i) => (
                                <div key={`h-${i}`} className="h-10 flex-1 bg-amber-400 rounded transition-all hover:scale-105 cursor-pointer" title={`High: ${service.high}`}></div>
                              ))}
                              {/* Medium blocks */}
                              {[...Array(service.medium)].map((_, i) => (
                                <div key={`m-${i}`} className="h-10 flex-1 bg-blue-300 rounded transition-all hover:scale-105 cursor-pointer" title={`Medium: ${service.medium}`}></div>
                              ))}
                              {/* Low blocks */}
                              {[...Array(service.low)].map((_, i) => (
                                <div key={`l-${i}`} className="h-10 flex-1 bg-slate-200 dark:bg-slate-700 rounded transition-all hover:scale-105 cursor-pointer" title={`Low: ${service.low}`}></div>
                              ))}
                            </div>
                            <div className="w-12 text-right">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{service.total}</span>
                              <span className="text-[10px] text-slate-400 block">issues</span>
                            </div>
                          </div>
                        ))}
                        {services.length === 0 && (
                          <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                            <p className="text-sm">No vulnerability data</p>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <span className="material-symbols-outlined !text-5xl mb-3 opacity-30">grid_on</span>
                    <p className="text-sm font-semibold">No heatmap data</p>
                    <p className="text-xs mt-1">Run a scan to visualize risk distribution</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
