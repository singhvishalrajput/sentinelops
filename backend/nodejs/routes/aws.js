const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /api/aws/connect
// @desc    Add AWS account credentials (3 fields only)
// @access  Private
router.post('/connect', protect, [
  body('accessKeyId').notEmpty().withMessage('Access Key ID is required'),
  body('secretAccessKey').notEmpty().withMessage('Secret Access Key is required'),
  body('region').notEmpty().withMessage('Region is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { accessKeyId, secretAccessKey, region } = req.body;

    const user = await User.findById(req.user._id);

    // Auto-generate account name from region and timestamp
    const accountName = `AWS Account (${region}) - ${new Date().toLocaleDateString()}`;

    // Add AWS account
    user.awsAccounts.push({
      accountId: '',  // Optional field, leave empty
      accountName,
      accessKeyId,
      secretAccessKey, // In production, encrypt this!
      region
    });

    await user.save();

    console.log('✅ AWS account connected successfully');
    console.log('📋 Account name:', accountName);
    console.log('🌍 Region:', region);

    res.status(200).json({
      success: true,
      message: 'AWS account connected successfully',
      awsAccount: {
        accountName,
        region,
        addedAt: new Date()
      }
    });
  } catch (error) {
    console.error('AWS connect error:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting AWS account',
      error: error.message
    });
  }
});

// @route   GET /api/aws/accounts
// @desc    Get all AWS accounts for user
// @access  Private
router.get('/accounts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const accounts = user.awsAccounts.map(account => ({
      id: account._id,
      accountName: account.accountName,
      accountId: account.accountId,
      region: account.region,
      addedAt: account.addedAt
    }));

    res.status(200).json({
      success: true,
      count: accounts.length,
      accounts
    });
  } catch (error) {
    console.error('Get AWS accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AWS accounts',
      error: error.message
    });
  }
});

// @route   DELETE /api/aws/accounts/:id
// @desc    Remove AWS account
// @access  Private
router.delete('/accounts/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.awsAccounts = user.awsAccounts.filter(
      account => account._id.toString() !== req.params.id
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: 'AWS account removed successfully'
    });
  } catch (error) {
    console.error('Remove AWS account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing AWS account',
      error: error.message
    });
  }
});

module.exports = router;
