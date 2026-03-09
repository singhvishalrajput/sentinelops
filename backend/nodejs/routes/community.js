const express = require('express');
const router = express.Router();
const CommunityMessage = require('../models/CommunityMessage');
const { protect } = require('../middleware/auth');
const axios = require('axios');

// Mistral LLM Configuration
const MISTRAL_API_URL = 'http://localhost:11434/api/generate';
const MISTRAL_TAGS_URL = 'http://localhost:11434/api/tags';
const AI_TRIGGER = '@sentinel';

// Check if Mistral/Ollama is available
async function isMistralAvailable() {
  try {
    await axios.get(MISTRAL_TAGS_URL, { timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
}

// System prompt to restrict AI to cloud security topics
const SYSTEM_PROMPT = `You are Sentinel, an AI assistant specialized in cloud security, AWS, Azure, and cloud infrastructure. 
You ONLY answer questions related to:
- Cloud security (AWS, Azure, GCP)
- Cloud infrastructure and architecture
- Security best practices for cloud platforms
- Compliance and governance in cloud environments
- Cloud vulnerabilities and threat detection
- IAM, network security, encryption in cloud
- Container security (Docker, Kubernetes)
- DevSecOps and CI/CD security

If a question is NOT related to these topics, politely respond: "I'm Sentinel, your cloud security assistant. I can only help with questions related to cloud security, AWS, Azure, and cloud infrastructure. Please ask me something about cloud security!"

Keep responses concise, professional, and focused on cloud security. Format responses in clear paragraphs.`;

// @route   GET /api/community/messages
// @desc    Get all community messages
// @access  Private
router.get('/messages', protect, async (req, res) => {
  try {
    const messages = await CommunityMessage.find()
      .populate('userId', 'name email')
      .sort({ createdAt: 1 }) // Oldest first for chat display
      .limit(100); // Limit to last 100 messages

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
});

// @route   POST /api/community/messages
// @desc    Create a new community message
// @access  Private
router.post('/messages', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === '' || content === '<p><br></p>') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Create user message
    const message = await CommunityMessage.create({
      userId: req.user._id,
      content: content.trim()
    });

    // Populate user info before sending response
    await message.populate('userId', 'name email');

    console.log('📨 New community message created by:', req.user.email);

    // Check if message mentions @sentinel (case-insensitive, and remove HTML tags for checking)
    const plainTextContent = content.replace(/<[^>]*>/g, '').toLowerCase();
    const mentionsSentinel = plainTextContent.includes(AI_TRIGGER.toLowerCase());

    // Send user message response first
    res.status(201).json({
      success: true,
      message
    });

    // If @sentinel is mentioned, generate AI response asynchronously
    if (mentionsSentinel) {
      console.log('🤖 @sentinel mentioned, generating AI response...');
      
      // Don't await - run in background
      generateAIResponse(content, req.user).catch(err => {
        console.error('AI response generation failed:', err);
      });
    }
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating message',
      error: error.message
    });
  }
});

// Helper function to generate AI response
async function generateAIResponse(userMessage, user) {
  try {
    // Extract the actual question (remove @sentinel and HTML tags)
    const plainText = userMessage.replace(/<[^>]*>/g, '');
    const question = plainText.replace(/@sentinel/gi, '').trim();

    console.log('🔍 Processing question:', question);

    // Check if Mistral is available first
    const isAvailable = await isMistralAvailable();
    if (!isAvailable) {
      throw new Error('MISTRAL_UNAVAILABLE');
    }

    // Call Mistral LLM with increased timeout
    const llmResponse = await axios.post(MISTRAL_API_URL, {
      model: 'mistral',
      prompt: `${SYSTEM_PROMPT}\n\nUser Question: ${question}\n\nAssistant:`,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 500 // Limit response length
      }
    }, {
      timeout: 60000 // 60 second timeout (increased from 30)
    });

    const aiResponseText = llmResponse.data.response.trim();
    console.log('✅ AI response generated');

    // Create AI message in database with special formatting
    const aiMessage = await CommunityMessage.create({
      userId: user._id, // Use same user ID but mark as AI
      content: `<div class="ai-response">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
          <span style="font-size: 20px;">🤖</span>
          <span style="color: white; font-weight: bold;">Sentinel AI-Pilot</span>
        </div>
        <div style="line-height: 1.6;">${aiResponseText.replace(/\n/g, '<br>')}</div>
      </div>`,
      isAIResponse: true
    });

    await aiMessage.populate('userId', 'name email');
    console.log('💬 AI message saved to database');

  } catch (error) {
    console.error('❌ Error generating AI response:', error.message);
    
    // Determine specific error message
    let errorMessage = 'Sorry, I\'m currently unavailable. Please try again later or ask the community!';
    
    if (error.message === 'MISTRAL_UNAVAILABLE') {
      errorMessage = '⚠️ <strong>Mistral AI is not running.</strong><br><br>Please ensure Ollama is installed and running with the Mistral model:<br><code>ollama run mistral</code><br><br>You can ask the community in the meantime!';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = '⚠️ <strong>Cannot connect to AI service.</strong><br><br>The Mistral server is not responding. Please check if Ollama is running on port 11434.';
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorMessage = '⏱️ <strong>AI response timed out.</strong><br><br>The model is taking too long to respond. Please try a simpler question or ask the community!';
    } else if (error.response?.status === 404) {
      errorMessage = '⚠️ <strong>Mistral model not found.</strong><br><br>Please install the Mistral model:<br><code>ollama pull mistral</code>';
    }
    
    // Create error message
    try {
      await CommunityMessage.create({
        userId: user._id,
        content: `<div class="ai-response">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 8px;">
            <span style="font-size: 20px;">🤖</span>
            <span style="color: white; font-weight: bold;">Sentinel AI-Pilot</span>
          </div>
          <div style="line-height: 1.6;">${errorMessage}</div>
        </div>`,
        isAIResponse: true
      });
    } catch (err) {
      console.error('Failed to create error message:', err);
    }
  }
}

// @route   DELETE /api/community/messages/:id
// @desc    Delete a community message (only own messages)
// @access  Private
router.delete('/messages/:id', protect, async (req, res) => {
  try {
    const message = await CommunityMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user owns the message
    if (message.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
});

module.exports = router;
