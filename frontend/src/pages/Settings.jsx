import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import axios from 'axios';
import { Cloud, Trash2, PlusCircle, Info } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function Settings() {
  const [awsAccounts, setAwsAccounts] = useState([]);
  const [azureAccounts, setAzureAccounts] = useState([]);
  const [gcpAccounts, setGcpAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('aws'); // 'aws', 'azure', or 'gcp'
  
  // AWS Form
  const [awsForm, setAwsForm] = useState({
    accountName: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1'
  });
  
  // Azure Form
  const [azureForm, setAzureForm] = useState({
    subscriptionName: '',
    subscriptionId: '',
    clientId: '',
    tenantId: '',
    clientSecret: ''
  });
  
  // GCP Form
  const [gcpForm, setGcpForm] = useState({
    projectName: '',
    projectId: '',
    serviceAccountJson: '',
    region: ''
  });

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch AWS accounts
      const awsResponse = await axios.get(`${API_URL}/aws/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAwsAccounts(awsResponse.data.accounts || []);
      
      // Fetch Azure accounts
      const azureResponse = await axios.get(`${API_URL}/azure/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAzureAccounts(azureResponse.data.accounts || []);
      
      // Fetch GCP accounts
      const gcpResponse = await axios.get(`${API_URL}/gcp/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGcpAccounts(gcpResponse.data.accounts || []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAWSAccount = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/aws/accounts`,
        awsForm,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        alert('AWS account connected successfully!');
        setAwsForm({ accountName: '', accessKeyId: '', secretAccessKey: '', region: 'us-east-1' });
        fetchAccounts();
      }
    } catch (error) {
      alert('Failed to connect AWS account: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddAzureAccount = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/azure/accounts`,
        azureForm,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        alert('Azure subscription connected successfully!');
        setAzureForm({ subscriptionName: '', subscriptionId: '', clientId: '', tenantId: '', clientSecret: '' });
        fetchAccounts();
      }
    } catch (error) {
      alert('Failed to connect Azure subscription: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteAWSAccount = async (accountId) => {
    if (!confirm('Are you sure you want to remove this AWS account?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/aws/accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('AWS account removed successfully');
      fetchAccounts();
    } catch (error) {
      alert('Failed to remove AWS account: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteAzureAccount = async (accountId) => {
    if (!confirm('Are you sure you want to remove this Azure subscription?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/azure/accounts/${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Azure subscription removed successfully');
      fetchAccounts();
    } catch (error) {
      alert('Failed to remove Azure subscription: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddGCPAccount = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/gcp/connect`,
        gcpForm,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (response.data.success) {
        alert('GCP project connected successfully!');
        setGcpForm({ projectName: '', projectId: '', serviceAccountJson: '', region: '' });
        fetchAccounts();
      }
    } catch (error) {
      alert('Failed to connect GCP project: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteGCPAccount = async (projectId) => {
    if (!confirm('Are you sure you want to remove this GCP project?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/gcp/disconnect/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('GCP project removed successfully');
      fetchAccounts();
    } catch (error) {
      alert('Failed to remove GCP project: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Settings" subtitle="Manage your cloud provider accounts" />
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Tab Selector */}
            <div className="flex gap-3 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('aws')}
                className={`flex items-center gap-2 px-6 py-3 font-bold transition-all relative ${
                  activeTab === 'aws'
                    ? 'text-primary'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 304 182" fill="currentColor">
                  <path d="M86.4 66.4c0 3.7.4 6.7 1.1 8.9.8 2.2 1.8 4.6 3.2 7.2.5.8.7 1.6.7 2.3 0 1-.6 2-1.9 3l-6.3 4.2c-.9.6-1.8.9-2.6.9-1 0-2-.5-3-1.4-1.4-1.5-2.6-3.1-3.6-4.7-1-1.7-2-3.6-3.1-5.9-7.8 9.2-17.6 13.8-29.4 13.8-8.4 0-15.1-2.4-20-7.2-4.9-4.8-7.4-11.2-7.4-19.2 0-8.5 3-15.4 9.1-20.6s14.2-7.8 24.5-7.8c3.4 0 6.9.3 10.6.8 3.7.5 7.5 1.3 11.5 2.2v-7.3c0-7.6-1.6-12.9-4.7-16-3.2-3.1-8.6-4.6-16.3-4.6-3.5 0-7.1.4-10.8 1.3-3.7.9-7.3 2-10.8 3.4-1.6.7-2.8 1.1-3.5 1.3-.7.2-1.2.3-1.6.3-1.4 0-2.1-1-2.1-3.1v-4.9c0-1.6.2-2.8.7-3.5.5-.7 1.4-1.4 2.8-2.1 3.5-1.8 7.7-3.3 12.6-4.5 4.9-1.3 10.1-1.9 15.6-1.9 11.9 0 20.6 2.7 26.2 8.1 5.5 5.4 8.3 13.6 8.3 24.6v32.4zm-40.6 15.2c3.3 0 6.7-.6 10.3-1.8 3.6-1.2 6.8-3.4 9.5-6.4 1.6-1.9 2.8-4 3.4-6.4.6-2.4 1-5.3 1-8.7v-4.2c-2.9-.7-6-1.3-9.2-1.7-3.2-.4-6.3-.6-9.4-.6-6.7 0-11.6 1.3-14.9 4-3.3 2.7-4.9 6.5-4.9 11.5 0 4.7 1.2 8.2 3.7 10.6 2.4 2.5 5.9 3.7 10.5 3.7zm80.3 10.8c-1.8 0-3-.3-3.8-.9-.8-.6-1.5-2-2.1-3.9L96.7 10.2c-.6-2-.9-3.3-.9-4 0-1.6.8-2.5 2.4-2.5h9.8c1.9 0 3.2.3 3.9.9.8.6 1.4 2 2 3.9l16.8 66.2 15.6-66.2c.5-2 1.1-3.3 1.9-3.9s2.2-.9 4-.9h8c1.9 0 3.2.3 4 .9.8.6 1.5 2 1.9 3.9l15.8 67 17.3-67c.6-2 1.3-3.3 2-3.9.8-.6 2.1-.9 3.9-.9h9.3c1.6 0 2.5.8 2.5 2.5 0 .5-.1 1-.2 1.6-.1.6-.3 1.4-.7 2.5l-24.1 77.3c-.6 2-1.3 3.3-2.1 3.9-.8.6-2.1.9-3.8.9h-8.6c-1.9 0-3.2-.3-4-.9-.8-.6-1.5-2-1.9-4L156 23l-15.4 64.4c-.5 2-1.1 3.3-1.9 4-.8.6-2.2.9-4 .9h-8.6zm128.5 2.7c-5.2 0-10.4-.6-15.4-1.8-5-1.2-8.9-2.5-11.5-4-1.6-.9-2.7-1.9-3.1-2.8-.4-.9-.6-1.9-.6-2.8v-5.1c0-2.1.8-3.1 2.3-3.1.6 0 1.2.1 1.8.3.6.2 1.5.6 2.5 1 3.4 1.5 7.1 2.7 11 3.5 4 .8 7.9 1.2 11.9 1.2 6.3 0 11.2-1.1 14.6-3.3 3.4-2.2 5.2-5.4 5.2-9.5 0-2.8-.9-5.1-2.7-7-1.8-1.9-5.2-3.6-10.1-5.2L246 52c-7.3-2.3-12.7-5.7-16-10.2-3.3-4.4-5-9.3-5-14.5 0-4.2.9-7.9 2.7-11.1 1.8-3.2 4.2-6 7.2-8.2 3-2.3 6.4-4 10.4-5.2 4-1.2 8.2-1.7 12.6-1.7 2.2 0 4.5.1 6.7.4 2.3.3 4.4.7 6.5 1.1 2 .5 3.9 1 5.7 1.6 1.8.6 3.2 1.2 4.2 1.8 1.4.8 2.4 1.6 3 2.5.6.8.9 1.9.9 3.3v4.7c0 2.1-.8 3.2-2.3 3.2-.8 0-2.1-.4-3.8-1.2-5.7-2.6-12.1-3.9-19.2-3.9-5.7 0-10.2.9-13.3 2.8-3.1 1.9-4.7 4.8-4.7 8.9 0 2.8 1 5.2 3 7.1 2 1.9 5.7 3.8 11 5.5l14.2 4.5c7.2 2.3 12.4 5.5 15.5 9.6 3.1 4.1 4.6 8.8 4.6 14 0 4.3-.9 8.2-2.6 11.6-1.8 3.4-4.2 6.4-7.3 8.8-3.1 2.5-6.8 4.3-11.1 5.6-4.5 1.4-9.2 2.1-14.3 2.1z"/>
                </svg>
                <span>AWS Accounts</span>
                {awsAccounts.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">
                    {awsAccounts.length}
                  </span>
                )}
                {activeTab === 'aws' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('azure')}
                className={`flex items-center gap-2 px-6 py-3 font-bold transition-all relative ${
                  activeTab === 'azure'
                    ? 'text-[#0078D4]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 96 96" fill="currentColor">
                  <path d="M25.8 66.4L47.5 9.7h19.2L42.2 66.4zm18.3 0L66.6 23l17.9 43.4h-23l-7.2 18.7L29.4 81z"/>
                </svg>
                <span>Azure Subscriptions</span>
                {azureAccounts.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-[#0078D4]/10 text-[#0078D4] rounded-full text-xs font-bold">
                    {azureAccounts.length}
                  </span>
                )}
                {activeTab === 'azure' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0078D4]"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('gcp')}
                className={`flex items-center gap-2 px-6 py-3 font-bold transition-all relative ${
                  activeTab === 'gcp'
                    ? 'text-[#4285F4]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.19 2.38a9.344 9.344 0 0 1 9.431 9.431 9.31 9.31 0 0 1-2.828 6.746 9.31 9.31 0 0 1-6.603 2.685h-.03a9.343 9.343 0 0 1-6.649-2.73 9.31 9.31 0 0 1-2.744-6.702 9.345 9.345 0 0 1 9.423-9.43zm-.238 2.757a6.585 6.585 0 0 0-6.588 6.588c0 1.773.701 3.385 1.84 4.552l1.208-1.208a4.877 4.877 0 0 1-1.404-3.344 4.882 4.882 0 0 1 4.883-4.883c1.296 0 2.46.511 3.344 1.346l1.209-1.209a6.584 6.584 0 0 0-4.492-1.842zm.06 2.61a3.894 3.894 0 0 0-2.771 1.15 3.921 3.921 0 0 0-1.145 2.776 3.938 3.938 0 0 0 3.916 3.915c1.047 0 2.003-.421 2.713-1.098l-1.122-1.122a2.31 2.31 0 0 1-1.591.575 2.277 2.277 0 0 1-2.273-2.272c0-.62.258-1.195.656-1.613a2.276 2.276 0 0 1 1.617-.657c.828 0 1.425.31 1.77.73.269.333.45.722.45 1.235v.11h-2.22v1.643h3.862c.06-.27.06-.54.06-.81 0-1.074-.3-2.392-1.234-3.296-.93-.9-2.122-1.266-3.188-1.266z"/>
                </svg>
                <span>GCP Projects</span>
                {gcpAccounts.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-[#4285F4]/10 text-[#4285F4] rounded-full text-xs font-bold">
                    {gcpAccounts.length}
                  </span>
                )}
                {activeTab === 'gcp' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4285F4]"></div>
                )}
              </button>
            </div>

            {/* Tab Content Container */}
            <>
              {/* AWS Tab Content */}
              {activeTab === 'aws' && (
              <div className="space-y-6">
                {/* Connected AWS Accounts */}
                {awsAccounts.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Connected AWS Accounts</h3>
                    <div className="space-y-3">
                      {awsAccounts.map((account) => (
                        <div key={account._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                          <div className="flex items-center gap-3">
                            <div className="size-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white">
                              <Cloud size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{account.accountName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                ID: {account.accountId} • Region: {account.region}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteAWSAccount(account._id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove account"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add AWS Account Form */}
                {awsAccounts.length === 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add AWS Account</h3>
                          <form onSubmit={handleAddAWSAccount} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Account Name
                        </label>
                        <input
                          type="text"
                          value={awsForm.accountName}
                          onChange={(e) => setAwsForm({...awsForm, accountName: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Production AWS"
                          required
                        />
                            </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Access Key ID
                        </label>
                        <input
                          type="text"
                          value={awsForm.accessKeyId}
                          onChange={(e) => setAwsForm({...awsForm, accessKeyId: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                          placeholder="AKIAIOSFODNN7EXAMPLE"
                          required
                        />
                            </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Secret Access Key
                        </label>
                        <input
                          type="password"
                          value={awsForm.secretAccessKey}
                          onChange={(e) => setAwsForm({...awsForm, secretAccessKey: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                          required
                        />
                            </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Region
                        </label>
                        <input
                          type="text"
                          value={awsForm.region}
                          onChange={(e) => setAwsForm({...awsForm, region: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="us-east-1, us-west-2, eu-west-1, ap-south-1, etc."
                          required
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Enter your preferred AWS region (e.g., us-east-1, us-west-2, eu-west-1)
                        </p>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-primary/20"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <PlusCircle size={20} />
                          Connect AWS Account
                        </span>
                      </button>
                    </form>
                  </div>
                    )}
              </div>
            )}

              {/* Azure Tab Content */}
              {activeTab === 'azure' && (
              <div className="space-y-6">
                {/* Connected Azure Subscriptions */}
                {azureAccounts.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Connected Azure Subscriptions</h3>
                    <div className="space-y-3">
                      {azureAccounts.map((account) => (
                        <div key={account._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                          <div className="flex items-center gap-3">
                            <div className="size-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white">
                                <Cloud size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{account.subscriptionName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                ID: {account.subscriptionId?.substring(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteAzureAccount(account._id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove subscription"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Azure Subscription Form */}
                {azureAccounts.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Azure Subscription</h3>
                    <form onSubmit={handleAddAzureAccount} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Subscription Name
                        </label>
                        <input
                          type="text"
                          value={azureForm.subscriptionName}
                          onChange={(e) => setAzureForm({...azureForm, subscriptionName: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0078D4]"
                          placeholder="Production Azure"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Subscription ID
                        </label>
                        <input
                          type="text"
                          value={azureForm.subscriptionId}
                          onChange={(e) => setAzureForm({...azureForm, subscriptionId: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0078D4] font-mono text-sm"
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Client ID (Application ID)
                        </label>
                        <input
                          type="text"
                          value={azureForm.clientId}
                          onChange={(e) => setAzureForm({...azureForm, clientId: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0078D4] font-mono text-sm"
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Tenant ID (Directory ID)
                        </label>
                        <input
                          type="text"
                          value={azureForm.tenantId}
                          onChange={(e) => setAzureForm({...azureForm, tenantId: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0078D4] font-mono text-sm"
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Client Secret
                        </label>
                        <input
                          type="password"
                          value={azureForm.clientSecret}
                          onChange={(e) => setAzureForm({...azureForm, clientSecret: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0078D4] font-mono text-sm"
                          placeholder="Your client secret value"
                          required
                        />
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-[#0078D4] hover:bg-[#005a9e] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <PlusCircle size={20} />
                          Connect Azure Subscription
                        </span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <Info className="text-[#0078D4]" size={24} />
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">Azure Subscription Connected</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">You can only connect one Azure subscription. To add a different subscription, please remove the existing one first.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* GCP Tab Content */}
            {activeTab === 'gcp' && (
              <div className="space-y-6">
                {/* Connected GCP Projects */}
                {gcpAccounts.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Connected GCP Projects</h3>
                    <div className="space-y-3">
                      {gcpAccounts.map((account) => (
                        <div key={account._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                          <div className="flex items-center gap-3">
                            <div className="size-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white">
                              <Cloud size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{account.projectName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Project ID: {account.projectId} • Region: {account.region}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteGCPAccount(account.projectId)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove project"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add GCP Project Form */}
                {gcpAccounts.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add GCP Project</h3>
                    <form onSubmit={handleAddGCPAccount} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Project Name
                        </label>
                        <input
                          type="text"
                          value={gcpForm.projectName}
                          onChange={(e) => setGcpForm({...gcpForm, projectName: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
                          placeholder="Production GCP"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Project ID
                        </label>
                        <input
                          type="text"
                          value={gcpForm.projectId}
                          onChange={(e) => setGcpForm({...gcpForm, projectId: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4285F4] font-mono text-sm"
                          placeholder="my-project-id"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Service Account JSON
                        </label>
                        <textarea
                          value={gcpForm.serviceAccountJson}
                          onChange={(e) => setGcpForm({...gcpForm, serviceAccountJson: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4285F4] font-mono text-xs"
                          placeholder='{"type": "service_account", "project_id": "...", ...}'
                          rows="6"
                          required
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Paste the contents of your service account JSON key file
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          Region
                        </label>
                        <input
                          type="text"
                          value={gcpForm.region}
                          onChange={(e) => setGcpForm({...gcpForm, region: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
                          placeholder="us-central1, europe-west1, asia-east1, etc."
                          required
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Enter your preferred GCP region (e.g., us-central1, us-east1, europe-west1)
                        </p>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <PlusCircle size={20} />
                          Connect GCP Project
                        </span>
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <Info className="text-[#4285F4]" size={24} />
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">GCP Project Connected</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">You can only connect one GCP project. To add a different project, please remove the existing one first.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            </>
            
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;
