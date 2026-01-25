import { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function Community() {
  const [messages, setMessages] = useState([]);
  const [messageContent, setMessageContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const editorRef = useRef(null);

  // Format button handler
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // Get current user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    fetchUserInfo();
  }, []);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/community/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMessages();

    // Set up polling every 3 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 3000);

    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    const content = editorRef.current?.innerHTML || '';
    if (!content.trim() || content === '<br>') {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/community/messages`,
        { content },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (editorRef.current) {
          editorRef.current.innerHTML = '';
        }
        setMessageContent('');
        fetchMessages(); // Refresh messages immediately
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Community Q&A" subtitle="Ask questions and share knowledge with security professionals" />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col h-full w-full">
            {/* AI Assistant Info Banner */}
            <div className="flex-shrink-0 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-purple-100 dark:border-purple-800 px-8 py-4">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-xl">🤖</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Sentinel AI Assistant Available</h3>
                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-full">POWERED BY MISTRAL</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Need help with cloud security questions? Mention <code className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded font-mono text-[11px] font-bold">@sentinel</code> in your message to get instant AI-powered assistance on AWS, Azure, cloud infrastructure, and security best practices!
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Container - Scrollable */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 bg-slate-50 dark:bg-slate-950 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined !text-4xl text-slate-400 dark:text-slate-500">chat_bubble_outline</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No messages yet</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">Be the first to start a conversation! Ask questions or share your security insights.</p>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isOwnMessage = currentUser && message.userId._id === currentUser.id;
                    const isAIMessage = message.isAIResponse;
                    
                    // AI messages get special styling
                    if (isAIMessage) {
                      return (
                        <div key={message._id} className="flex justify-start">
                          <div className="flex gap-4 max-w-4xl">
                            {/* AI Avatar */}
                            <div className="size-11 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg border-2 border-white dark:border-slate-900">
                              🤖
                            </div>
                            
                            {/* AI Message Content */}
                            <div className="flex flex-col items-start flex-1">
                              <div className="w-full rounded-2xl px-5 py-4 shadow-md bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border-2 border-purple-200 dark:border-purple-800">
                                <div 
                                  className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 [&_strong]:text-purple-700 [&_strong]:dark:text-purple-300"
                                  dangerouslySetInnerHTML={{ __html: message.content }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 ml-2">
                                {formatTimestamp(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Regular user messages
                    return (
                      <div key={message._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-4 max-w-3xl ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Avatar */}
                          <div className="size-11 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-lg">
                            {message.userId.name?.charAt(0).toUpperCase() || message.userId.email?.charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Message Content */}
                          <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-2xl px-5 py-4 shadow-md ${
                              isOwnMessage 
                                ? 'bg-primary text-white' 
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-bold ${isOwnMessage ? 'text-blue-100' : 'text-slate-900 dark:text-white'}`}>
                                  {isOwnMessage ? 'You' : (message.userId.name || message.userId.email)}
                                </span>
                                <span className={`text-[10px] ${isOwnMessage ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'}`}>
                                  {formatTimestamp(message.createdAt)}
                                </span>
                              </div>
                              <div 
                                className={`text-sm leading-relaxed ${
                                  isOwnMessage 
                                    ? '[&>*]:text-white [&_strong]:text-white [&_a]:text-blue-200 [&_a]:underline [&_code]:bg-blue-600 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs' 
                                    : 'text-slate-700 dark:text-slate-300 [&_a]:text-primary [&_a]:underline [&_code]:bg-purple-100 [&_code]:dark:bg-purple-900/40 [&_code]:text-purple-700 [&_code]:dark:text-purple-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:font-bold'
                                }`}
                                dangerouslySetInnerHTML={{ __html: message.content }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Fixed Input Section at Bottom */}
            <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-4">
              <div className="space-y-3">
                {/* Rich Text Editor Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => formatText('bold')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Bold"
                  >
                    <span className="material-symbols-outlined !text-lg text-slate-600 dark:text-slate-400">format_bold</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('italic')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Italic"
                  >
                    <span className="material-symbols-outlined !text-lg text-slate-600 dark:text-slate-400">format_italic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('underline')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Underline"
                  >
                    <span className="material-symbols-outlined !text-lg text-slate-600 dark:text-slate-400">format_underlined</span>
                  </button>
                  <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
                  <button
                    type="button"
                    onClick={() => formatText('insertUnorderedList')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Bullet List"
                  >
                    <span className="material-symbols-outlined !text-lg text-slate-600 dark:text-slate-400">format_list_bulleted</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('insertOrderedList')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Numbered List"
                  >
                    <span className="material-symbols-outlined !text-lg text-slate-600 dark:text-slate-400">format_list_numbered</span>
                  </button>
                  <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Enter URL:');
                      if (url) formatText('createLink', url);
                    }}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Insert Link"
                  >
                    <span className="material-symbols-outlined !text-lg text-slate-600 dark:text-slate-400">link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('formatBlock', 'blockquote')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Quote"
                  >
                    <span className="material-symbols-outlined !text-lg text-slate-600 dark:text-slate-400">format_quote</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => formatText('formatBlock', 'pre')}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Code Block"
                  >
                    <span className="material-symbols-outlined !text-lg text-slate-600 dark:text-slate-400">code</span>
                  </button>
                </div>

                {/* Editor and Send Button */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <div
                      ref={editorRef}
                      contentEditable
                      className="min-h-[60px] max-h-[120px] overflow-y-auto p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary custom-scrollbar"
                      onInput={(e) => setMessageContent(e.currentTarget.innerHTML)}
                      placeholder="Type your message..."
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word'
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !messageContent.trim()}
                    className="flex items-center justify-center size-12 bg-primary hover:bg-blue-800 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    title="Send Message"
                  >
                    {isLoading ? (
                      <span className="material-symbols-outlined animate-spin">refresh</span>
                    ) : (
                      <span className="material-symbols-outlined">send</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Community;
