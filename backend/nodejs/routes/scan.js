const express = require('express');
const router = express.Router();
const ScanHistory = require('../models/ScanHistory');
const { protect } = require('../middleware/auth');
const { sendSlackNotification } = require('../utils/slackNotifier');

// @route   GET /api/scan/history
// @desc    Get scan history for user
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const scans = await ScanHistory.find({ userId: req.user._id })
      .sort({ startedAt: -1 })
      .limit(20);

    console.log(`📜 Fetching scan history: Found ${scans.length} scans`);
    if (scans.length > 0) {
      const latestScan = scans[0];
      console.log('🆕 Latest scan findings count:', latestScan.results?.findings?.length || 0);
      console.log('🤖 Latest scan AI enhanced:', latestScan.results?.ai_enhanced_count || 0);
    }

    res.status(200).json({
      success: true,
      count: scans.length,
      scans
    });
  } catch (error) {
    console.error('Get scan history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scan history',
      error: error.message
    });
  }
});

// @route   DELETE /api/scan/history/clear
// @desc    Clear all scan history for user (for testing)
// @access  Private
router.delete('/history/clear', protect, async (req, res) => {
  try {
    const result = await ScanHistory.deleteMany({ userId: req.user._id });
    console.log(`🗑️ Cleared ${result.deletedCount} scans for user`);
    
    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} scans`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear scan history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing scan history',
      error: error.message
    });
  }
});

// @route   POST /api/scan/start
// @desc    Start a new scan (AWS or Azure)
// @access  Private
router.post('/start', protect, async (req, res) => {
  try {
    const { scanType, awsAccountId, azureAccountId, cloudProvider = 'aws' } = req.body;
    const axios = require('axios');
    const User = require('../models/User');

    const user = await User.findById(req.user._id);
    console.log('👤 User found:', user.email);

    let scanData, pythonScanId, accountInfo;

    // Handle AWS scan
    if (cloudProvider === 'aws' || awsAccountId) {
      console.log('☁️ Starting AWS scan...');
      console.log('🔍 Looking for AWS account ID:', awsAccountId);
      console.log('📋 User has AWS accounts:', user.awsAccounts.length);
      
      const awsAccount = user.awsAccounts.find(acc => acc._id.toString() === awsAccountId);

      if (!awsAccount) {
        console.log('❌ AWS account not found');
        return res.status(404).json({
          success: false,
          message: 'AWS account not found'
        });
      }
      
      console.log('✅ AWS account found:', awsAccount.accountName);

      // Create scan history record
      const scan = await ScanHistory.create({
        userId: req.user._id,
        scanType: scanType || 'full',
        awsAccountId,
        cloudProvider: 'AWS',
        status: 'running',
        startedAt: Date.now()
      });

      // Call Python backend for AWS scan
      try {
        console.log('🐍 Calling Python backend for AWS scan');
        const pythonResponse = await axios.post('http://localhost:5001/api/scan', {
          aws_access_key_id: awsAccount.accessKeyId,
          aws_secret_access_key: awsAccount.secretAccessKey,
          region: awsAccount.region || 'us-east-1'
        }, { timeout: 120000 });
        
        console.log('✅ AWS scan completed successfully');
        scanData = pythonResponse.data.data;
        pythonScanId = pythonResponse.data.scan_id;
        accountInfo = { accountName: awsAccount.accountName };

        await processScanResults(scan, scanData, pythonScanId, user, scanType);
        
        return res.status(201).json({
          success: true,
          message: 'AWS scan completed successfully',
          scanId: scan._id,
          scan_id: pythonScanId,
          pythonScanId: pythonScanId,
          results: scan.results
        });

      } catch (pythonError) {
        console.error('Python backend error:', pythonError.message);
        scan.status = 'failed';
        scan.completedAt = Date.now();
        await scan.save();

        return res.status(500).json({
          success: false,
          message: 'AWS scan failed - Python backend error',
          error: pythonError.response?.data?.error || pythonError.message
        });
      }
    }
    
    // Handle Azure scan
    else if (cloudProvider === 'azure' || azureAccountId) {
      console.log('☁️ Starting Azure scan...');
      console.log('🔍 Looking for Azure account ID:', azureAccountId);
      console.log('📋 User has Azure accounts:', user.azureAccounts.length);
      
      const azureAccount = user.azureAccounts.find(acc => acc._id.toString() === azureAccountId);

      if (!azureAccount) {
        console.log('❌ Azure account not found');
        return res.status(404).json({
          success: false,
          message: 'Azure account not found'
        });
      }
      
      console.log('✅ Azure account found:', azureAccount.subscriptionName);

      // Create scan history record
      const scan = await ScanHistory.create({
        userId: req.user._id,
        scanType: scanType || 'full',
        azureAccountId,
        cloudProvider: 'Azure',
        status: 'running',
        startedAt: Date.now()
      });

      // Call Python backend for Azure scan
      try {
        console.log('🐍 Calling Python backend for Azure scan');
        const pythonResponse = await axios.post('http://localhost:5001/api/azure/scan', {
          subscription_id: azureAccount.subscriptionId,
          client_id: azureAccount.clientId,
          tenant_id: azureAccount.tenantId,
          client_secret: azureAccount.clientSecret
        }, { timeout: 120000 });
        
        console.log('✅ Azure scan completed successfully');
        scanData = pythonResponse.data.data;
        pythonScanId = pythonResponse.data.scan_id;
        accountInfo = { subscriptionName: azureAccount.subscriptionName };

        await processScanResults(scan, scanData, pythonScanId, user, scanType);
        
        return res.status(201).json({
          success: true,
          message: 'Azure scan completed successfully',
          scanId: scan._id,
          scan_id: pythonScanId,
          pythonScanId: pythonScanId,
          results: scan.results
        });

      } catch (pythonError) {
        console.error('Python backend error:', pythonError.message);
        scan.status = 'failed';
        scan.completedAt = Date.now();
        await scan.save();

        return res.status(500).json({
          success: false,
          message: 'Azure scan failed - Python backend error',
          error: pythonError.response?.data?.error || pythonError.message
        });
      }
    }
    
    else {
      return res.status(400).json({
        success: false,
        message: 'Please specify either AWS or Azure account'
      });
    }

  } catch (error) {
    console.error('Start scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting scan',
      error: error.message
    });
  }
});

// Helper function to process scan results
async function processScanResults(scan, scanData, pythonScanId, user, scanType) {
  scan.status = 'completed';
  scan.completedAt = Date.now();
  scan.duration = Math.round((scan.completedAt - scan.startedAt) / 1000);
  
  // Convert array fields to strings if they exist
  const processedFindings = scanData.findings?.map(finding => {
    const processed = { ...finding };
    
    // Convert detailed_remediation from array to string
    if (Array.isArray(processed.detailed_remediation)) {
      processed.detailed_remediation = processed.detailed_remediation
        .map((step, index) => `${index + 1}. ${step}`)
        .join('\n');
    }
    
    // Convert business_impact from array to string
    if (Array.isArray(processed.business_impact)) {
      processed.business_impact = processed.business_impact.join('\n');
    }
    
    // Convert prevention_tips from array to string
    if (Array.isArray(processed.prevention_tips)) {
      processed.prevention_tips = processed.prevention_tips
        .map((tip, index) => `${index + 1}. ${tip}`)
        .join('\n');
    }
    
    return processed;
  }) || [];
  
  // Extract counts from severity_breakdown (Python backend returns this structure)
  const criticalCount = scanData.criticalCount || scanData.severity_breakdown?.critical || 0;
  const highCount = scanData.highCount || scanData.severity_breakdown?.high || 0;
  const mediumCount = scanData.mediumCount || scanData.severity_breakdown?.medium || 0;
  const lowCount = scanData.lowCount || scanData.severity_breakdown?.low || 0;
  
  // Calculate risk score with safe defaults
  const calculatedRiskScore = Math.min(100, (criticalCount * 15) + (highCount * 5) + (mediumCount * 2));
  const riskScore = scanData.riskScore !== undefined && !isNaN(scanData.riskScore) 
    ? scanData.riskScore 
    : calculatedRiskScore;
  
  // Calculate compliance score with safe defaults
  const calculatedComplianceScore = Math.max(0, 100 - (criticalCount * 5) - (highCount * 2));
  const complianceScore = scanData.complianceScore !== undefined && !isNaN(scanData.complianceScore)
    ? scanData.complianceScore
    : calculatedComplianceScore;
  
  scan.results = {
    riskScore: riskScore,
    criticalCount: criticalCount,
    highCount: highCount,
    mediumCount: mediumCount,
    lowCount: lowCount,
    totalAssets: scanData.totalAssets || scanData.findings?.length || 0,
    complianceScore: complianceScore,
    findings: processedFindings,
    pythonScanId: pythonScanId,
    executive_summary: scanData.executive_summary,
    ai_enhanced_count: scanData.ai_enhanced_count || 0,
    service_breakdown: scanData.service_breakdown,
    severity_breakdown: scanData.severity_breakdown || {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount
    },
    cloudProvider: scanData.cloudProvider
  };
  
  console.log('💾 Saving scan with', scanData.findings?.length || 0, 'findings');
  console.log('🤖 AI enhanced:', scanData.ai_enhanced_count || 0, 'findings');
  
  await scan.save();

  // Send Slack notification (non-blocking)
  sendSlackNotification({
    results: scan.results,
    duration: scan.duration,
    scanType: scanType
  }, user).catch(err => {
    console.error('Slack notification failed (non-critical):', err.message);
  });
}

// @route   GET /api/scan/:id
// @desc    Get scan details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const scan = await ScanHistory.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Scan not found'
      });
    }

    res.status(200).json({
      success: true,
      scan
    });
  } catch (error) {
    console.error('Get scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scan details',
      error: error.message
    });
  }
});

module.exports = router;
