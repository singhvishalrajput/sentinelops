const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/azure/accounts
// @desc    Get all Azure accounts for current user
// @access  Private
router.get('/accounts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Return accounts without sensitive data (client secret)
    const accounts = user.azureAccounts.map(account => ({
      _id: account._id,
      subscriptionId: account.subscriptionId,
      subscriptionName: account.subscriptionName,
      clientId: account.clientId,
      tenantId: account.tenantId,
      addedAt: account.addedAt
    }));
    
    res.json({
      success: true,
      accounts
    });
  } catch (error) {
    console.error('Error fetching Azure accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Azure accounts'
    });
  }
});

// @route   POST /api/azure/accounts
// @desc    Add new Azure account
// @access  Private
router.post('/accounts', protect, async (req, res) => {
  try {
    const { subscriptionId, subscriptionName, clientId, tenantId, clientSecret } = req.body;
    
    // Validate required fields
    if (!subscriptionId || !clientId || !tenantId || !clientSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required Azure credentials'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Check if subscription already exists
    const exists = user.azureAccounts.some(
      account => account.subscriptionId === subscriptionId
    );
    
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'This Azure subscription is already added'
      });
    }
    
    // Add new account
    user.azureAccounts.push({
      subscriptionId,
      subscriptionName: subscriptionName || `Subscription ${subscriptionId.substring(0, 8)}`,
      clientId,
      tenantId,
      clientSecret,
      addedAt: new Date()
    });
    
    await user.save();
    
    // Return without sensitive data
    const newAccount = user.azureAccounts[user.azureAccounts.length - 1];
    
    res.status(201).json({
      success: true,
      message: 'Azure account added successfully',
      account: {
        _id: newAccount._id,
        subscriptionId: newAccount.subscriptionId,
        subscriptionName: newAccount.subscriptionName,
        clientId: newAccount.clientId,
        tenantId: newAccount.tenantId,
        addedAt: newAccount.addedAt
      }
    });
  } catch (error) {
    console.error('Error adding Azure account:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding Azure account'
    });
  }
});

// @route   DELETE /api/azure/accounts/:id
// @desc    Delete Azure account
// @access  Private
router.delete('/accounts/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Find account index
    const accountIndex = user.azureAccounts.findIndex(
      account => account._id.toString() === req.params.id
    );
    
    if (accountIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Azure account not found'
      });
    }
    
    // Remove account
    user.azureAccounts.splice(accountIndex, 1);
    await user.save();
    
    res.json({
      success: true,
      message: 'Azure account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Azure account:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting Azure account'
    });
  }
});

// @route   GET /api/azure/accounts/:id
// @desc    Get specific Azure account with credentials (for scanning)
// @access  Private
router.get('/accounts/:id/credentials', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const account = user.azureAccounts.find(
      acc => acc._id.toString() === req.params.id
    );
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Azure account not found'
      });
    }
    
    res.json({
      success: true,
      credentials: {
        subscriptionId: account.subscriptionId,
        clientId: account.clientId,
        tenantId: account.tenantId,
        clientSecret: account.clientSecret
      }
    });
  } catch (error) {
    console.error('Error fetching Azure credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Azure credentials'
    });
  }
});

module.exports = router;
