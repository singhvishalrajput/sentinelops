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
      issue: String,
      description: String,
      resource: String,
      service: String,
      region: String,
      remediation: String,
      timestamp: String,
      detailed_remediation: String,
      business_impact: String,
      prevention_tips: String,
      ai_enhanced: Boolean
    }],
    pythonScanId: Number,
    executive_summary: String,
    ai_enhanced_count: Number,
    service_breakdown: mongoose.Schema.Types.Mixed,
    severity_breakdown: mongoose.Schema.Types.Mixed,
    cloudProvider: String
  },
  awsAccountId: String,
  azureAccountId: String,
  cloudProvider: {
    type: String,
    enum: ['AWS', 'Azure', 'GCP'],
    default: 'AWS'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  duration: Number, // in seconds
  errorMessage: String
});

module.exports = mongoose.model('ScanHistory', ScanHistorySchema);
