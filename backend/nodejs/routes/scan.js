const express = require('express');
const router = express.Router();
const ScanHistory = require('../models/ScanHistory');
const { protect } = require('../middleware/auth');

// @route   GET /api/scan/history
// @desc    Get scan history for user
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const scans = await ScanHistory.find({ userId: req.user._id })
      .sort({ startedAt: -1 })
      .limit(20);

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

// @route   POST /api/scan/start
// @desc    Start a new scan (this will communicate with Python backend)
// @access  Private
router.post('/start', protect, async (req, res) => {
  try {
    const { scanType, awsAccountId } = req.body;
    const axios = require('axios');
    const User = require('../models/User');

    // Find user's AWS account
    console.log('🔍 Looking for AWS account ID:', awsAccountId);
    const user = await User.findById(req.user._id);
    console.log('👤 User found:', user.email);
    console.log('📋 User has AWS accounts:', user.awsAccounts.length);
    
    const awsAccount = user.awsAccounts.find(acc => acc._id.toString() === awsAccountId);

    if (!awsAccount) {
      console.log('❌ AWS account not found in user accounts');
      console.log('Available account IDs:', user.awsAccounts.map(a => a._id.toString()));
      return res.status(404).json({
        success: false,
        message: 'AWS account not found'
      });
    }
    
    console.log('✅ AWS account found:', awsAccount.accountName);
    console.log('🔑 Has credentials:', {
      hasAccessKey: !!awsAccount.accessKeyId,
      hasSecretKey: !!awsAccount.secretAccessKey,
      region: awsAccount.region
    });

    // Create scan history record
    const scan = await ScanHistory.create({
      userId: req.user._id,
      scanType: scanType || 'full',
      awsAccountId,
      status: 'running',
      startedAt: Date.now()
    });

    // Call Python backend to perform scan
    try {
      console.log('🐍 Calling Python backend at http://localhost:5001/api/scan');
      console.log('📤 Sending credentials to Python (masked):', {
        accessKeyId: awsAccount.accessKeyId?.substring(0, 8) + '...',
        hasSecretKey: !!awsAccount.secretAccessKey,
        region: awsAccount.region || 'us-east-1',
        scanType: scanType || 'full'
      });
      
      const pythonResponse = await axios.post('http://localhost:5001/api/scan', {
        aws_access_key_id: awsAccount.accessKeyId,
        aws_secret_access_key: awsAccount.secretAccessKey,
        region: awsAccount.region || 'us-east-1'
      }, {
        timeout: 120000 // 2 minutes timeout
      });
      
      console.log('✅ Python backend responded successfully');
      console.log('📊 Scan results:', pythonResponse.data.data);

      // Update scan with results
      const scanData = pythonResponse.data.data;
      const pythonScanId = pythonResponse.data.scan_id; // Get Python backend's scan ID
      
      scan.status = 'completed';
      scan.completedAt = Date.now();
      scan.duration = Math.round((scan.completedAt - scan.startedAt) / 1000);
      scan.results = {
        riskScore: Math.min(100, (scanData.severity_breakdown.critical * 15) + 
                                  (scanData.severity_breakdown.high * 5) + 
                                  (scanData.severity_breakdown.medium * 2)),
        criticalCount: scanData.severity_breakdown.critical,
        highCount: scanData.severity_breakdown.high,
        mediumCount: scanData.severity_breakdown.medium,
        lowCount: scanData.severity_breakdown.low,
        totalAssets: scanData.findings.length,
        complianceScore: Math.max(0, 100 - (scanData.severity_breakdown.critical * 5) - 
                                           (scanData.severity_breakdown.high * 2)),
        findings: scanData.findings,
        pythonScanId: pythonScanId // Store Python scan ID for PDF download
      };
      await scan.save();

      res.status(201).json({
        success: true,
        message: 'Scan completed successfully',
        scanId: scan._id,
        scan_id: pythonScanId, // Add this for frontend compatibility
        pythonScanId: pythonScanId, // Python backend scan ID for PDF download
        results: scan.results
      });

    } catch (pythonError) {
      console.error('Python backend error:', pythonError.message);
      scan.status = 'failed';
      scan.completedAt = Date.now();
      await scan.save();

      return res.status(500).json({
        success: false,
        message: 'Scan failed - Python backend error',
        error: pythonError.response?.data?.error || pythonError.message
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
