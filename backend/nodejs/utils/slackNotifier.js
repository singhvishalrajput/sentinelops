const axios = require('axios');

/**
 * Send notification to Slack webhook
 * @param {Object} scanData - The scan results data
 * @param {Object} user - The user who initiated the scan
 * @returns {Promise<boolean>} - Success status
 */
async function sendSlackNotification(scanData, user) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  // Skip if webhook URL is not configured
  if (!webhookUrl) {
    console.log('⚠️  Slack webhook URL not configured - skipping notification');
    return false;
  }

  try {
    const { results, duration, scanType } = scanData;
    const { criticalCount, highCount, mediumCount, lowCount, riskScore, findings } = results;

    // Get severity emoji
    const getSeverityEmoji = (count, type) => {
      if (count === 0) return '✅';
      if (type === 'critical') return '🔴';
      if (type === 'high') return '🟠';
      if (type === 'medium') return '🟡';
      return '🟢';
    };

    // Get risk level
    const getRiskLevel = (score) => {
      if (score >= 80) return '🚨 CRITICAL';
      if (score >= 60) return '⚠️ HIGH';
      if (score >= 40) return '⚡ MEDIUM';
      return '✅ LOW';
    };

    // Get top 5 critical issues
    const criticalIssues = findings
      .filter(f => f.severity === 'critical')
      .slice(0, 5)
      .map(issue => `   • ${issue.issue || issue.description}`)
      .join('\n');

    // Build the message with Slack Block Kit for rich formatting
    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🛡️ SentinelOps Security Scan Complete",
            emoji: true
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*User:*\n${user.name || user.email}`
            },
            {
              type: "mrkdwn",
              text: `*Scan Type:*\n${scanType || 'Full Scan'}`
            },
            {
              type: "mrkdwn",
              text: `*Duration:*\n${duration}s`
            },
            {
              type: "mrkdwn",
              text: `*Risk Level:*\n${getRiskLevel(riskScore)}`
            }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Risk Score:* \`${riskScore}/100\`\n\n*Vulnerability Summary:*\n${getSeverityEmoji(criticalCount, 'critical')} Critical: *${criticalCount}*\n${getSeverityEmoji(highCount, 'high')} High: *${highCount}*\n${getSeverityEmoji(mediumCount, 'medium')} Medium: *${mediumCount}*\n${getSeverityEmoji(lowCount, 'low')} Low: *${lowCount}*`
          }
        }
      ]
    };

    // Add critical issues section if there are any
    if (criticalCount > 0 && criticalIssues) {
      message.blocks.push(
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*🔴 Top Critical Issues:*\n${criticalIssues}`
          }
        }
      );
    }

    // Add AI enhancement info if available
    if (results.ai_enhanced_count > 0) {
      message.blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `🤖 ${results.ai_enhanced_count} findings enhanced with AI-powered recommendations`
          }
        ]
      });
    }

    // Add footer with timestamp
    message.blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `⏰ Completed at ${new Date().toLocaleString()} | 📊 Total Assets Scanned: ${findings.length}`
        }
      ]
    });

    // Send to Slack
    await axios.post(webhookUrl, message, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Slack notification sent successfully');
    return true;

  } catch (error) {
    console.error('❌ Error sending Slack notification:', error.message);
    if (error.response) {
      console.error('Slack API response:', error.response.data);
    }
    return false;
  }
}

module.exports = { sendSlackNotification };
