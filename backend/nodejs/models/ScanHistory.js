const mongoose = require('mongoose');

const ScanHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scanType: {
    type: String,
    enum: ['full', 'quick', 'compliance', 'vulnerability'],
    default: 'full'
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  results: {
    riskScore: Number,
    criticalCount: Number,
    highCount: Number,
    mediumCount: Number,
    lowCount: Number,
    totalAssets: Number,
    complianceScore: Number,
    findings: [{
      severity: String,
      title: String,
      description: String,
      resource: String,
      service: String,
      region: String
    }]
  },
  awsAccountId: String,
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  duration: Number, // in seconds
  errorMessage: String
});

module.exports = mongoose.model('ScanHistory', ScanHistorySchema);
