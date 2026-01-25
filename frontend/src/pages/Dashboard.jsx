import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:5000/api';

function Dashboard() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [awsAccounts, setAwsAccounts] = useState([]);
  const [azureAccounts, setAzureAccounts] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('aws'); // 'aws' or 'azure'
  const [scanResults, setScanResults] = useState(null);
  const [scanId, setScanId] = useState(null); // Track scan ID for PDF download
  const [scanHistory, setScanHistory] = useState([]); // Track scan history for trends

  const scanSteps = [
    { message: 'Initializing scan engine...', duration: 1000 },
    { message: `Connecting to ${selectedProvider === 'aws' ? 'AWS' : 'Azure'} infrastructure...`, duration: 1500 },
    { message: 'Performing deep security scan...', duration: 2000 },
    { message: 'Identifying vulnerabilities...', duration: 1800 },
    { message: selectedProvider === 'aws' ? 'Analyzing IAM policies...' : 'Analyzing role assignments...', duration: 1500 },
    { message: selectedProvider === 'aws' ? 'Checking S3 bucket permissions...' : 'Checking storage account permissions...', duration: 1200 },
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
          // Filter scans by selected provider
          const providerScans = response.data.scans.filter(scan => {
            const cloudProvider = scan.results?.cloudProvider?.toLowerCase();
            return cloudProvider === selectedProvider;
          });

          // Store filtered scans for historical trends
          setScanHistory(providerScans.slice(0, 10)); // Last 10 scans for selected provider
          
          if (providerScans.length > 0) {
            const latestScan = providerScans[0];
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
          } else {
            // No scans for this provider, clear results
            setScanResults(null);
            setShowResults(false);
            setScanHistory([]);
          }
        }
      } catch (error) {
        console.error('Error fetching last scan:', error);
      }
    };

    fetchLastScanResults();
  }, [selectedProvider]); // Re-fetch when provider changes

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

  // Fetch Azure accounts on component mount
  useEffect(() => {
    const fetchAzureAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/azure/accounts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAzureAccounts(response.data.accounts || []);
      } catch (error) {
        console.error('Error fetching Azure accounts:', error);
      }
    };
    fetchAzureAccounts();
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
    if (!scanResults) {
      toast.error('No scan results available. Please run a scan first.', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      console.log('📥 Generating PDF report for', selectedProvider.toUpperCase());
      console.log('📊 Current scan results:', scanResults);
      
      toast.info('Generating PDF report...', {
        position: "top-right",
        autoClose: 2000,
      });

      // Send current scan results to Python backend for PDF generation
      const response = await axios.post(
        'http://localhost:5001/api/generate-pdf',
        {
          scanResults: scanResults,
          cloudProvider: selectedProvider,
          timestamp: new Date().toISOString()
        },
        {
          responseType: 'blob' // Important for file download
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `${selectedProvider}_security_report_${new Date().toISOString().split('T')[0]}_${new Date().getTime()}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      console.log('✅ PDF report downloaded successfully');
      toast.success('PDF report downloaded successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report: ' + (error.response?.data?.message || error.message), {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleScan = async () => {
    const accounts = selectedProvider === 'aws' ? awsAccounts : azureAccounts;
    
    if (accounts.length === 0) {
      toast.error(`${selectedProvider.toUpperCase()} account not connected. Please connect in Settings.`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    console.log(`🚀 Starting ${selectedProvider.toUpperCase()} scan...`);
    console.log(`📋 ${selectedProvider.toUpperCase()} Accounts available:`, accounts.length);
    console.log('🎯 Using account:', accounts[0].accountName || accounts[0].subscriptionName);

    setIsScanning(true);
    setShowResults(false);
    setScanResults(null);

    try {
      const token = localStorage.getItem('token');
      
      console.log('📤 Sending scan request to backend...');
      
      // Different endpoints and payloads for AWS vs Azure
      const scanPromise = selectedProvider === 'aws'
        ? axios.post(
            `${API_URL}/scan/start`,
            {
              scanType: 'full',
              awsAccountId: accounts[0].id
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        : axios.post(
            `${API_URL}/scan/start`,
            {
              scanType: 'full',
              azureAccountId: accounts[0]._id,
              cloudProvider: 'azure'
            },
            { headers: { Authorization: `Bearer ${token}` } }
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
        
        setScanResults(scanResponse.data.results);
        setScanId(scanResponse.data.scan_id || scanResponse.data.pythonScanId);
        setShowResults(true);
        
        toast.success('Security scan completed successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        
        await sendEmailNotification(scanResponse.data.results);
      }

    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Scan failed: ' + (error.response?.data?.message || error.message), {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="relative h-screen flex overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      <ToastContainer />
      <div className="absolute inset-0 hero-grid opacity-40 dark:hidden pointer-events-none"></div>
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header 
          title="Security Command Center" 
          subtitle="Global cloud infrastructure real-time monitoring"
          onScan={handleScan}
          isScanning={isScanning}
          hasScanResults={!!scanResults}
          onDownloadReport={downloadReport}
          providerButtons={
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedProvider('aws')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedProvider === 'aws'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 304 182" fill="currentColor">
                  <path d="M86.4 66.4c0 3.7.4 6.7 1.1 8.9.8 2.2 1.8 4.6 3.2 7.2.5.8.7 1.6.7 2.3 0 1-.6 2-1.9 3l-6.3 4.2c-.9.6-1.8.9-2.6.9-1 0-2-.5-3-1.4-1.4-1.5-2.6-3.1-3.6-4.7-1-1.7-2-3.6-3.1-5.9-7.8 9.2-17.6 13.8-29.4 13.8-8.4 0-15.1-2.4-20-7.2-4.9-4.8-7.4-11.2-7.4-19.2 0-8.5 3-15.4 9.1-20.6s14.2-7.8 24.5-7.8c3.4 0 6.9.3 10.6.8 3.7.5 7.5 1.3 11.5 2.2v-7.3c0-7.6-1.6-12.9-4.7-16-3.2-3.1-8.6-4.6-16.3-4.6-3.5 0-7.1.4-10.8 1.3-3.7.9-7.3 2-10.8 3.4-1.6.7-2.8 1.1-3.5 1.3-.7.2-1.2.3-1.6.3-1.4 0-2.1-1-2.1-3.1v-4.9c0-1.6.2-2.8.7-3.5.5-.7 1.4-1.4 2.8-2.1 3.5-1.8 7.7-3.3 12.6-4.5 4.9-1.3 10.1-1.9 15.6-1.9 11.9 0 20.6 2.7 26.2 8.1 5.5 5.4 8.3 13.6 8.3 24.6v32.4zm-40.6 15.2c3.3 0 6.7-.6 10.3-1.8 3.6-1.2 6.8-3.4 9.5-6.4 1.6-1.9 2.8-4 3.4-6.4.6-2.4 1-5.3 1-8.7v-4.2c-2.9-.7-6-1.3-9.2-1.7-3.2-.4-6.3-.6-9.4-.6-6.7 0-11.6 1.3-14.9 4-3.3 2.7-4.9 6.5-4.9 11.5 0 4.7 1.2 8.2 3.7 10.6 2.4 2.5 5.9 3.7 10.5 3.7zm80.3 10.8c-1.8 0-3-.3-3.8-.9-.8-.6-1.5-2-2.1-3.9L96.7 10.2c-.6-2-.9-3.3-.9-4 0-1.6.8-2.5 2.4-2.5h9.8c1.9 0 3.2.3 3.9.9.8.6 1.4 2 2 3.9l16.8 66.2 15.6-66.2c.5-2 1.1-3.3 1.9-3.9s2.2-.9 4-.9h8c1.9 0 3.2.3 4 .9.8.6 1.5 2 1.9 3.9l15.8 67 17.3-67c.6-2 1.3-3.3 2-3.9.8-.6 2.1-.9 3.9-.9h9.3c1.6 0 2.5.8 2.5 2.5 0 .5-.1 1-.2 1.6-.1.6-.3 1.4-.7 2.5l-24.1 77.3c-.6 2-1.3 3.3-2.1 3.9-.8.6-2.1.9-3.8.9h-8.6c-1.9 0-3.2-.3-4-.9-.8-.6-1.5-2-1.9-4L156 23l-15.4 64.4c-.5 2-1.1 3.3-1.9 4-.8.6-2.2.9-4 .9h-8.6zm128.5 2.7c-5.2 0-10.4-.6-15.4-1.8-5-1.2-8.9-2.5-11.5-4-1.6-.9-2.7-1.9-3.1-2.8-.4-.9-.6-1.9-.6-2.8v-5.1c0-2.1.8-3.1 2.3-3.1.6 0 1.2.1 1.8.3.6.2 1.5.6 2.5 1 3.4 1.5 7.1 2.7 11 3.5 4 .8 7.9 1.2 11.9 1.2 6.3 0 11.2-1.1 14.6-3.3 3.4-2.2 5.2-5.4 5.2-9.5 0-2.8-.9-5.1-2.7-7-1.8-1.9-5.2-3.6-10.1-5.2L246 52c-7.3-2.3-12.7-5.7-16-10.2-3.3-4.4-5-9.3-5-14.5 0-4.2.9-7.9 2.7-11.1 1.8-3.2 4.2-6 7.2-8.2 3-2.3 6.4-4 10.4-5.2 4-1.2 8.2-1.7 12.6-1.7 2.2 0 4.5.1 6.7.4 2.3.3 4.4.7 6.5 1.1 2 .5 3.9 1 5.7 1.6 1.8.6 3.2 1.2 4.2 1.8 1.4.8 2.4 1.6 3 2.5.6.8.9 1.9.9 3.3v4.7c0 2.1-.8 3.2-2.3 3.2-.8 0-2.1-.4-3.8-1.2-5.7-2.6-12.1-3.9-19.2-3.9-5.7 0-10.2.9-13.3 2.8-3.1 1.9-4.7 4.8-4.7 8.9 0 2.8 1 5.2 3 7.1 2 1.9 5.7 3.8 11 5.5l14.2 4.5c7.2 2.3 12.4 5.5 15.5 9.6 3.1 4.1 4.6 8.8 4.6 14 0 4.3-.9 8.2-2.6 11.6-1.8 3.4-4.2 6.4-7.3 8.8-3.1 2.5-6.8 4.3-11.1 5.6-4.5 1.4-9.2 2.1-14.3 2.1z"/>
                </svg>
                AWS
              </button>
              <button
                onClick={() => setSelectedProvider('azure')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedProvider === 'azure'
                    ? 'bg-[#0078D4] text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 96 96" fill="currentColor">
                  <path d="M25.8 66.4L47.5 9.7h19.2L42.2 66.4zm18.3 0L66.6 23l17.9 43.4h-23l-7.2 18.7L29.4 81z"/>
                </svg>
                Azure
              </button>
            </div>
          }
        />
        
        {/* Scanning Toast Notification - Bottom Right */}
        {isScanning && (
          <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xl border-2 border-primary/20 dark:border-primary/30 max-w-sm">
              <div className="flex items-start gap-4">
                {/* Animated Scanner Icon */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                  <div className="relative size-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                    <span className="material-symbols-outlined !text-2xl text-white animate-pulse">radar</span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Progress Text */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security Scan Running</h3>
                    <p className="text-xs text-primary font-semibold animate-pulse truncate">{scanProgress}</p>
                  </div>
                  
                  {/* Loading Bar */}
                  <div className="mt-3 w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full animate-progress"></div>
                  </div>
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
