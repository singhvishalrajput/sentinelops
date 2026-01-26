const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const ScanHistory = require('../models/ScanHistory');
const axios = require('axios');

const PYTHON_BACKEND_URL = 'http://localhost:5001/api';

// @route   GET /api/gcp/accounts
// @desc    Get all GCP accounts for current user
// @access  Private
router.get('/accounts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Return accounts without the sensitive service account JSON
    const accounts = user.gcpAccounts.map(account => ({
      _id: account._id,
      projectId: account.projectId,
      projectName: account.projectName,
      region: account.region,
      addedAt: account.addedAt
    }));

    res.status(200).json({
      success: true,
      accounts
    });
  } catch (error) {
    console.error('Error fetching GCP accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/gcp/connect
// @desc    Connect GCP account
// @access  Private
router.post('/connect', protect, async (req, res) => {
  try {
    const { projectId, projectName, serviceAccountJson, region } = req.body;

    // Validate required fields
    if (!projectId || !serviceAccountJson || !region) {
      return res.status(400).json({
        success: false,
        message: 'Please provide project ID, service account JSON, and region'
      });
    }

    // Parse service account JSON to validate it
    let parsedJson;
    try {
      parsedJson = typeof serviceAccountJson === 'string' 
        ? JSON.parse(serviceAccountJson) 
        : serviceAccountJson;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service account JSON format'
      });
    }

    // Test connection with Python backend
    try {
      const testResponse = await axios.post(`${PYTHON_BACKEND_URL}/gcp/test-connection`, {
        project_id: projectId,
        service_account_json: parsedJson,
        region
      });

      if (!testResponse.data.success) {
        return res.status(401).json({
          success: false,
          message: 'Invalid GCP credentials or insufficient permissions'
        });
      }
    } catch (error) {
      console.error('GCP connection test failed:', error.response?.data || error.message);
      return res.status(401).json({
        success: false,
        message: error.response?.data?.error || 'Failed to connect to GCP. Please check your credentials.'
      });
    }

    // Find user and add/update GCP account
    const user = await User.findById(req.user._id);

    // Check if account already exists
    const existingAccountIndex = user.gcpAccounts.findIndex(
      acc => acc.projectId === projectId
    );

    const gcpAccount = {
      projectId,
      projectName: projectName || projectId,
      serviceAccountJson: JSON.stringify(parsedJson), // Store as string
      region,
      addedAt: new Date()
    };

    if (existingAccountIndex > -1) {
      // Update existing account
      user.gcpAccounts[existingAccountIndex] = gcpAccount;
    } else {
      // Add new account
      user.gcpAccounts.push(gcpAccount);
    }

    await user.save();

    console.log(`✅ GCP account connected for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'GCP account connected successfully',
      account: {
        projectId,
        projectName: projectName || projectId,
        region
      }
    });

  } catch (error) {
    console.error('GCP connect error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while connecting GCP account',
      error: error.message
    });
  }
});

// @route   DELETE /api/gcp/disconnect/:projectId
// @desc    Disconnect GCP account
// @access  Private
router.delete('/disconnect/:projectId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.gcpAccounts = user.gcpAccounts.filter(
      acc => acc.projectId !== req.params.projectId
    );
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'GCP account disconnected successfully'
    });

  } catch (error) {
    console.error('GCP disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/gcp/scan
// @desc    Trigger GCP security scan
// @access  Private
router.post('/scan', protect, async (req, res) => {
  try {
    const { gcpAccountId } = req.body;

    if (!gcpAccountId) {
      return res.status(400).json({
        success: false,
        message: 'GCP account ID is required'
      });
    }

    // Get user's GCP account
    const user = await User.findById(req.user._id);
    const gcpAccount = user.gcpAccounts.id(gcpAccountId);

    if (!gcpAccount) {
      return res.status(404).json({
        success: false,
        message: 'GCP account not found'
      });
    }

    console.log('✅ GCP account found:', gcpAccount.projectName);

    // Create scan history record
    const scan = await ScanHistory.create({
      userId: req.user._id,
      scanType: 'full',
      cloudProvider: 'GCP',
      status: 'running',
      startedAt: Date.now()
    });

    // Call Python backend for scanning
    const scanResponse = await axios.post(`${PYTHON_BACKEND_URL}/gcp/scan`, {
      project_id: gcpAccount.projectId,
      service_account_json: JSON.parse(gcpAccount.serviceAccountJson),
      region: gcpAccount.region
    }, {
      timeout: 120000 // 2 minute timeout
    });

    if (scanResponse.data.success) {
      // Update scan history with results
      scan.status = 'completed';
      scan.completedAt = Date.now();
      scan.results = scanResponse.data.data;
      await scan.save();

      console.log('✅ GCP scan completed and saved to database');

      // Return the same structure as Python backend but wrap in results
      res.status(200).json({
        success: true,
        results: scanResponse.data.data,
        scan_id: scan._id,
        pythonScanId: scan._id
      });
    } else {
      // Update scan as failed
      scan.status = 'failed';
      scan.completedAt = Date.now();
      await scan.save();

      res.status(500).json({
        success: false,
        message: 'GCP scan failed',
        error: scanResponse.data.error
      });
    }

  } catch (error) {
    console.error('GCP scan error:', error);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'GCP scan timeout - scan is taking longer than expected'
      });
    }

    res.status(500).json({
      success: false,
      message: 'GCP scan failed - Python backend error',
      error: error.response?.data?.error || error.message
    });
  }
});

module.exports = router;
