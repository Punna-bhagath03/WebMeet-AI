import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IconButton, CircularProgress } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import styles from '../styles/videoComponent.module.css';
import { client as apiClient } from '../contexts/AuthContext';

const AIChatPanel = React.memo(function AIChatPanel({ visible, onClose }) {
  const [aiMessage, setAIMessage] = useState('');
  const [aiChatHistory, setAIChatHistory] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (visible && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiChatHistory, visible]);

  const handleAIChat = useCallback(async () => {
    if (!aiMessage.trim()) return;

    const currentMessage = aiMessage.trim();
    setAIMessage('');

    try {
      setIsAILoading(true);
      setAIChatHistory((prev) => [...prev, { type: 'user', message: currentMessage }]);

      const response = await apiClient.post('/ai/chat', { message: currentMessage });

      setAIChatHistory((prev) => [...prev, { type: 'ai', message: response.data.response }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const serverError =
        error?.response?.data?.error ||
        'Failed to get AI response. Please try again.';
      setAIChatHistory((prev) => [
        ...prev,
        { type: 'error', message: serverError },
      ]);
    } finally {
      setIsAILoading(false);
    }
  }, [aiMessage]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAIChat();
      }
    },
    [handleAIChat]
  );

  return (
    <div className={`${styles.aiChatDrawer} ${visible ? styles.visible : ''}`}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SmartToyIcon sx={{ fontSize: 18, color: '#64748b' }} />
          <span className={styles.panelTitle}>AI Assistant</span>
        </div>
        <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      {/* Messages */}
      <div className={styles.aiChatMessages}>
        {aiChatHistory.length === 0 && (
          <div className={styles.noMessages}>Ask the AI anything about your meeting!</div>
        )}
        {aiChatHistory.map((chat, index) => (
          <div
            key={index}
            className={
              chat.type === 'user'
                ? styles.aiMsgBubbleUser
                : chat.type === 'error'
                ? styles.aiMsgBubbleError
                : styles.aiMsgBubbleAI
            }
          >
            {chat.message}
          </div>
        ))}
        {isAILoading && (
          <div className={styles.aiMsgBubbleAI} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CircularProgress size={14} sx={{ color: '#64748b' }} />
            <span style={{ fontSize: 13, color: '#64748b' }}>Thinking…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.aiChatInputArea}>
        <input
          className={styles.chatInputField}
          placeholder="Ask AI anything..."
          value={aiMessage}
          onChange={(e) => setAIMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isAILoading}
        />
        <button
          className={styles.chatSendBtn}
          onClick={handleAIChat}
          disabled={isAILoading || !aiMessage.trim()}
          type="button"
        >
          <SendIcon sx={{ fontSize: 16 }} />
        </button>
      </div>
    </div>
  );
});

export default AIChatPanel;

