import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import DarkModeToggle from '../components/DarkModeToggle';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function Hero() {
  const navigate = useNavigate();
  const [showAWSModal, setShowAWSModal] = useState(false);
  const [awsFormData, setAwsFormData] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnectAWS = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      setShowAWSModal(true);
    }
  };

  const handleAWSSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/aws/connect`,
        awsFormData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setShowAWSModal(false);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect AWS account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-white dark:bg-slate-900 transition-colors">
      <div className="absolute inset-0 hero-grid opacity-60 dark:hidden pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-sky-100/40 dark:bg-sky-900/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <header className="relative z-50 flex items-center justify-between px-6 py-6 mx-auto w-full max-w-7xl">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined !text-xl">shield</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SentinelOps</h2>
        </div>
        <nav className="hidden md:flex items-center gap-10">
          <a className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors" href="#solutions">Solutions</a>
          <Link to="/dashboard" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors">Dashboard</Link>
          <a className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors" href="#pricing">Pricing</a>
        </nav>
        <div className="flex items-center gap-4">
          <DarkModeToggle />
          <button className="bg-primary hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/20">
            Get Started
          </button>
        </div>
      </header>
      
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 pt-12 pb-24 max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-8 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Series-A Enterprise Ready</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white">
              <span className="text-gradient">SentinelOps</span> — Real-Time Cloud Risk Intelligence
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Automate your cloud security posture with continuous monitoring, instant threat detection, and enterprise-grade remediation for complex AWS environments.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={handleConnectAWS}
                className="flex items-center gap-2 bg-primary hover:bg-blue-800 text-white px-8 py-4 rounded-xl text-base font-bold transition-all shadow-xl shadow-primary/25"
              >
                <span className="material-symbols-outlined">cloud_sync</span>
                Connect AWS Account
              </button>
              <button className="flex items-center gap-2 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-xl text-base font-bold transition-all">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">play_circle</span>
                View Live Demo
              </button>
            </div>
            <div className="flex items-center gap-6 pt-8 opacity-60">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trusted by leading enterprises</span>
              <div className="flex gap-8 items-center">
                <div className="h-6 w-24 bg-slate-200 rounded" data-alt="Monochrome technology partner logo"></div>
                <div className="h-6 w-20 bg-slate-200 rounded" data-alt="Cybersecurity company partner logo"></div>
                <div className="h-6 w-28 bg-slate-200 rounded" data-alt="Cloud infrastructure partner logo"></div>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100/0 to-white/0 "></div>
              <div className="glass-panel-light dark:bg-slate-800/50 rounded-2xl overflow-hidden shadow-2xl border border-white dark:border-slate-700">
              <div className="bg-white/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="size-3 rounded-full bg-red-400/30 border border-red-400/50"></div>
                    <div className="size-3 rounded-full bg-amber-400/30 border border-amber-400/50"></div>
                    <div className="size-3 rounded-full bg-emerald-400/30 border border-emerald-400/50"></div>
                  </div>
                  <div className="h-4 w-px bg-slate-200 mx-2"></div>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="material-symbols-outlined !text-sm">dashboard</span>
                    Production_Environment
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-black text-primary animate-pulse">
                  <span className="material-symbols-outlined !text-sm">radar</span>
                  SCANNING AWS...
                </div>
              </div>
              <div className="p-6 space-y-6 bg-white/30 dark:bg-slate-900/30">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1">Critical Risks</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">02</span>
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">-12%</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1">High Severity</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">14</span>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">+3</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold mb-1">Compliance Score</p>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">98%</span>
                      <span className="text-[10px] font-bold text-primary bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">↑ 2%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined !text-sm text-primary">analytics</span>
                      Threat Activity (24h)
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Live Feed</span>
                  </div>
                  <div className="h-32 w-full relative">
                    <svg className="w-full h-full" viewBox="0 0 400 100">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.1"></stop>
                          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0"></stop>
                        </linearGradient>
                      </defs>
                      <path d="M0,80 Q50,20 100,50 T200,30 T300,70 T400,10" fill="none" stroke="#1d4ed8" strokeWidth="2.5"></path>
                      <path d="M0,80 Q50,20 100,50 T200,30 T300,70 T400,10 V100 H0 Z" fill="url(#chartGradient)"></path>
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="size-8 rounded bg-red-50 dark:bg-red-900/30 flex items-center justify-center border border-red-100 dark:border-red-800">
                      <span className="material-symbols-outlined !text-sm text-red-600 dark:text-red-400">warning</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-slate-900 dark:text-white">S3 Bucket Exposed</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">us-east-1 • prod-logs-v3</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">2m ago</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-700 opacity-80">
                    <div className="size-8 rounded bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
                      <span className="material-symbols-outlined !text-sm text-emerald-600 dark:text-emerald-400">verified_user</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-slate-900 dark:text-white">IAM Policy Hardened</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">Auto-remediation success</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">14m ago</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-2xl animate-bounce duration-[3000ms]">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-800">
                  <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">gpp_good</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Environment Secure</p>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Compliant with SOC2</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* How SentinelOps Secures Your Cloud Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-white via-slate-50/30 to-white dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900 relative overflow-hidden">
        {/* Decorative Elements */}
        {/* <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-10 size-72 bg-blue-100/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-10 size-96 bg-sky-100/20 rounded-full blur-3xl"></div>
        </div> */}
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 mb-6">
              <span className="size-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">The Process</span>
            </div>
            <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-tight">
              How <span className="text-gradient">SentinelOps</span> Secures Your Cloud
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              Four seamless steps to achieve complete visibility and automated protection across your entire infrastructure.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Step 1 */}
            <div className="relative group">
              <div className=" relative h-full bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-primary/30 hover:shadow-xl transition-all duration-500">
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-sky-50/0 dark:from-blue-900/0 dark:to-sky-900/0 group-hover:from-blue-50/50 group-hover:to-sky-50/30 dark:group-hover:from-blue-900/20 dark:group-hover:to-sky-900/20 rounded-3xl transition-all duration-500"></div>
                
                {/* Icon Container */}
                <div className="relative">
                  <div className="size-16 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/30 shadow-lg border-2 border-white dark:border-slate-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/10 transition-all duration-500">
                    <span className="material-symbols-outlined text-primary !text-4xl group-hover:scale-110 transition-transform duration-500">cloud_sync</span>
                  </div>
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -right-2 size-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                    01
                  </div>
                </div>
                
                <h4 className="relative text-xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-primary transition-colors duration-300">
                  Connect Cloud
                </h4>
                <p className="relative text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Securely link your AWS, Azure, or GCP accounts using read-only IAM roles in seconds.
                </p>
                
                {/* Progress Indicator */}
                <div className="relative mt-6 h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-1000"></div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className=" relative h-full bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-primary/30 hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-sky-50/0 dark:from-blue-900/0 dark:to-sky-900/0 group-hover:from-blue-50/50 group-hover:to-sky-50/30 dark:group-hover:from-blue-900/20 dark:group-hover:to-sky-900/20 rounded-3xl transition-all duration-500"></div>
                
                <div className="relative">
                  <div className="size-16 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/30 shadow-lg border-2 border-white dark:border-slate-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/10 transition-all duration-500">
                    <span className="material-symbols-outlined text-primary !text-4xl group-hover:scale-110 transition-transform duration-500">radar</span>
                  </div>
                  
                  <div className="absolute -top-2 -right-2 size-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                    02
                  </div>
                </div>
                
                <h4 className="relative text-xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-primary transition-colors duration-300">
                  Deep Scan
                </h4>
                <p className="relative text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Our engine performs a comprehensive scan of all resources, permissions, and network configs.
                </p>
                
                <div className="relative mt-6 h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-1000"></div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="relative h-full bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-primary/30 hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-sky-50/0 dark:from-blue-900/0 dark:to-sky-900/0 group-hover:from-blue-50/50 group-hover:to-sky-50/30 dark:group-hover:from-blue-900/20 dark:group-hover:to-sky-900/20 rounded-3xl transition-all duration-500"></div>
                
                <div className="relative">
                  <div className="size-16 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/30 shadow-lg border-2 border-white dark:border-slate-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/10 transition-all duration-500">
                    <span className="material-symbols-outlined text-primary !text-4xl group-hover:scale-110 transition-transform duration-500">psychology</span>
                  </div>
                  
                  <div className="absolute -top-2 -right-2 size-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                    03
                  </div>
                </div>
                
                <h4 className="relative text-xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-primary transition-colors duration-300">
                  AI Analysis
                </h4>
                <p className="relative text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Advanced ML algorithms correlate data to identify complex attack paths and critical risks.
                </p>
                
                <div className="relative mt-6 h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-1000"></div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative group">
              <div className="relative h-full bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-700 hover:border-primary/30 hover:shadow-xl transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-sky-50/0 dark:from-blue-900/0 dark:to-sky-900/0 group-hover:from-blue-50/50 group-hover:to-sky-50/30 dark:group-hover:from-blue-900/20 dark:group-hover:to-sky-900/20 rounded-3xl transition-all duration-500"></div>
                
                <div className="relative">
                  <div className="size-16 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/30 shadow-lg border-2 border-white dark:border-slate-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/10 transition-all duration-500">
                    <span className="material-symbols-outlined text-primary !text-4xl group-hover:scale-110 transition-transform duration-500">verified_user</span>
                  </div>
                  
                  <div className="absolute -top-2 -right-2 size-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                    04
                  </div>
                </div>
                
                <h4 className="relative text-xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-primary transition-colors duration-300">
                  Compliance
                </h4>
                <p className="relative text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Instant mapping to SOC2, HIPAA, and GDPR frameworks with automated remediation.
                </p>
                
                <div className="relative mt-6 h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-400 transform origin-left scale-x-100 transition-transform duration-1000"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-white via-slate-50/30 to-white dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900 ">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="max-w-xl">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">Enterprise Features</h2>
              <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Key Capabilities</h3>
            </div>
            <button className="text-sm font-bold text-primary flex items-center gap-2 group">
              Explore all features
              <span className="material-symbols-outlined !text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-panel-light dark:bg-slate-700/50 p-8 rounded-2xl border border-white dark:border-slate-600 hover:shadow-xl transition-all group">
              <div className="size-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">shutter_speed</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Real-Time Detection</h4>
              <p className="text-slate-500 dark:text-slate-300 leading-relaxed">Identify threats within seconds of occurrence using our event-driven monitoring engine.</p>
            </div>
            <div className="glass-panel-light dark:bg-slate-700/50 p-8 rounded-2xl border border-white dark:border-slate-600 hover:shadow-xl transition-all group">
              <div className="size-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">grid_view</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Risk Heatmaps</h4>
              <p className="text-slate-500 dark:text-slate-300 leading-relaxed">Visual representation of vulnerability clusters across regions and account types.</p>
            </div>
            <div className="glass-panel-light dark:bg-slate-700/50 p-8 rounded-2xl border border-white dark:border-slate-600 hover:shadow-xl transition-all group">
              <div className="size-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">auto_fix</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Auto-Remediation</h4>
              <p className="text-slate-500 dark:text-slate-300 leading-relaxed">Automatically fix common misconfigurations before they can be exploited.</p>
            </div>
            <div className="glass-panel-light dark:bg-slate-700/50 p-8 rounded-2xl border border-white dark:border-slate-600 hover:shadow-xl transition-all group">
              <div className="size-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">account_tree</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Graph-Based Analysis</h4>
              <p className="text-slate-500 dark:text-slate-300 leading-relaxed">Uncover hidden relationships and permission chains that create security gaps.</p>
            </div>
            <div className="glass-panel-light dark:bg-slate-700/50 p-8 rounded-2xl border border-white dark:border-slate-600 hover:shadow-xl transition-all group">
              <div className="size-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">hub</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Multi-Cloud Support</h4>
              <p className="text-slate-500 dark:text-slate-300 leading-relaxed">A unified security pane for AWS, Azure, and Google Cloud environments.</p>
            </div>
            <div className="glass-panel-light dark:bg-slate-700/50 p-8 rounded-2xl border border-white dark:border-slate-600 hover:shadow-xl transition-all group">
              <div className="size-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <span className="material-symbols-outlined">description</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Audit Readiness</h4>
              <p className="text-slate-500 dark:text-slate-300 leading-relaxed">One-click compliance reports that satisfy even the most rigorous security audits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 w-fit mb-4 mx-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Transparent Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-6">Simple Pricing That Scales With You</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">Choose the plan that fits your current cloud infrastructure needs. Scale or switch anytime as your footprint grows.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Free Plan */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full hover:border-slate-300 dark:hover:border-slate-600 transition-all">
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Free</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">$0</span>
                <span className="text-slate-400 dark:text-slate-500 font-semibold text-sm">/mo</span>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Essential protection for solo developers and small projects.</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined !text-lg text-emerald-500">check_circle</span>
                1 AWS Account
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined !text-lg text-emerald-500">check_circle</span>
                24-hour scan intervals
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined !text-lg text-emerald-500">check_circle</span>
                Basic compliance reporting
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined !text-lg text-emerald-500">check_circle</span>
                Community support
              </li>
            </ul>
            <button className="w-full py-4 px-6 rounded-xl border-2 border-slate-100 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Get Started</button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border-2 border-primary relative pro-glow flex flex-col h-full transform scale-105 z-20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full">
              Most Popular
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">$49</span>
                <span className="text-slate-400 dark:text-slate-500 font-semibold text-sm">/mo</span>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Complete security automation for growing cloud-native teams.</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <span className="material-symbols-outlined !text-lg text-primary">check_circle</span>
                Unlimited AWS Accounts
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <span className="material-symbols-outlined !text-lg text-primary">check_circle</span>
                Real-time scanning
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <span className="material-symbols-outlined !text-lg text-primary">check_circle</span>
                AI severity classification
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <span className="material-symbols-outlined !text-lg text-primary">check_circle</span>
                Auto-remediation workflows
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
                <span className="material-symbols-outlined !text-lg text-primary">check_circle</span>
                Priority 1-hour support
              </li>
            </ul>
            <button className="w-full py-4 px-6 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-blue-800 transition-all">Start 14-Day Trial</button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full hover:border-slate-300 dark:hover:border-slate-600 transition-all">
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">Custom</span>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Bespoke solutions for global organizations with complex compliance needs.</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined !text-lg text-slate-400 dark:text-slate-500">check_circle</span>
                Multi-cloud (Azure & GCP)
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined !text-lg text-slate-400 dark:text-slate-500">check_circle</span>
                Custom SSO & IAM integration
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined !text-lg text-slate-400 dark:text-slate-500">check_circle</span>
                SOC2/HIPAA Readiness Vault
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined !text-lg text-slate-400 dark:text-slate-500">check_circle</span>
                Dedicated Account Manager
              </li>
            </ul>
            <button className="w-full py-4 px-6 rounded-xl border-2 border-slate-900 dark:border-slate-200 font-bold text-slate-900 dark:text-slate-200 hover:bg-slate-900 dark:hover:bg-slate-200 hover:text-white dark:hover:text-slate-900 transition-all">Contact Sales</button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-24 px-6 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Everything you need to know about SentinelOps and cloud security.</p>
        </div>
        <div className="space-y-4">
          <details className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors list-none">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Is my cloud data safe with SentinelOps?</h3>
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div className="px-6 pb-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Yes. SentinelOps uses read-only cross-account IAM roles for scanning. We never store your actual cloud data—only metadata and configuration settings required for security posture assessment.
            </div>
          </details>
          <details className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors list-none">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Which cloud platforms are supported?</h3>
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div className="px-6 pb-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Currently, we offer deep integration for Amazon Web Services (AWS). Support for Google Cloud Platform (GCP) and Microsoft Azure is available for our Enterprise customers and will be rolling out to Pro users soon.
            </div>
          </details>
          <details className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors list-none">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">How long does the initial scan take?</h3>
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div className="px-6 pb-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Most environments are fully indexed within 15 minutes of connecting your account. You'll receive your first risk assessment report almost immediately after the indexing is complete.
            </div>
          </details>
          <details className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors list-none">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Do you offer a free trial for Pro features?</h3>
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div className="px-6 pb-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Yes, every new account starts with a 14-day free trial of our Pro features. No credit card is required to start your trial and explore real-time scanning and AI classification.
            </div>
          </details>
          <details className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors list-none">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Can I export my compliance reports?</h3>
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div className="px-6 pb-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Absolutely. Reports can be exported in PDF, CSV, or JSON formats. Pro and Enterprise users can also set up automated weekly report deliveries to Slack or Email.
            </div>
          </details>
          <details className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors list-none">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Is there an API for automated remediations?</h3>
              <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div className="px-6 pb-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Yes, SentinelOps is built with an API-first philosophy. Our robust REST API allows you to trigger remediations, fetch risk data, and integrate security signals into your CI/CD pipelines.
            </div>
          </details>
        </div>
      </section>

      {/* Comprehensive Footer */}
      <footer className="relative z-10 w-full bg-background-light dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 pt-16 pb-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
            {/* Company Info */}
            <div className="md:col-span-12 lg:col-span-5 space-y-6">
              <div className="flex items-center gap-2">
                <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined !text-xl">shield</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SentinelOps</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
                SentinelOps — Automating Cloud Security for the Modern Internet. Continuous protection and risk intelligence for global enterprise infrastructure.
              </p>
              <div className="flex items-center gap-4">
                <a className="text-slate-400 dark:text-slate-500 hover:text-primary transition-colors" href="#" aria-label="GitHub">
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </a>
                <a className="text-slate-400 hover:text-primary transition-colors" href="#" aria-label="LinkedIn">
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a className="text-slate-400 hover:text-primary transition-colors" href="#" aria-label="Twitter">
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div className="md:col-span-4 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-6">Product</h3>
              <ul className="space-y-4">
                <li><a className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Infrastructure</a></li>
                <li><a className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Threat Detect</a></li>
                <li><a className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Automated Fix</a></li>
                <li><a className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Integrations</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div className="md:col-span-4 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-6">Company</h3>
              <ul className="space-y-4">
                <li><a className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">About Us</a></li>
                <li><a className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Careers</a></li>
                <li><a className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Newsroom</a></li>
                <li><a className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Contact</a></li>
              </ul>
            </div>

            {/* Legal & Trust Links */}
            <div className="md:col-span-4 lg:col-span-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white mb-6">Legal & Trust</h3>
              <ul className="space-y-4">
                <li><a className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Terms of Service</a></li>
                <li><a className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Security Center</a></li>
                <li><a className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors" href="#">Compliance Hub</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              © 2024 SentinelOps Technologies Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-6 opacity-40 grayscale contrast-125">
              <div className="h-6 w-12 bg-slate-300 rounded-md flex items-center justify-center text-[8px] font-black text-slate-600">SOC2</div>
              <div className="h-6 w-12 bg-slate-300 rounded-md flex items-center justify-center text-[8px] font-black text-slate-600">GDPR</div>
              <div className="h-6 w-12 bg-slate-300 rounded-md flex items-center justify-center text-[8px] font-black text-slate-600">HIPAA</div>
            </div>
          </div>
        </div>
      </footer>

      {/* AWS Connection Modal */}
      {showAWSModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Connect AWS Account</h3>
              <button
                onClick={() => setShowAWSModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAWSSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  AWS Access Key ID *
                </label>
                <input
                  type="text"
                  value={awsFormData.accessKeyId}
                  onChange={(e) => setAwsFormData({ ...awsFormData, accessKeyId: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  AWS Secret Access Key *
                </label>
                <input
                  type="password"
                  value={awsFormData.secretAccessKey}
                  onChange={(e) => setAwsFormData({ ...awsFormData, secretAccessKey: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  AWS Region *
                </label>
                <input
                  type="text"
                  value={awsFormData.region}
                  onChange={(e) => setAwsFormData({ ...awsFormData, region: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., us-east-1, ap-south-1, eu-west-1"
                  required
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Enter your AWS region (e.g., us-east-1, ap-south-1, eu-central-1)
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAWSModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-blue-800 text-white px-4 py-3 rounded-lg font-bold shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default Hero;
