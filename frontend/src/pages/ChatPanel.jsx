import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import styles from '../styles/videoComponent.module.css';

const ChatPanel = React.memo(function ChatPanel({ visible, messages, onClose, onSend }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (visible && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, visible]);

  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage('');
  }, [message, onSend]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`${styles.chatRoom} ${visible ? styles.visible : ''}`}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChatIcon sx={{ fontSize: 18, color: '#64748b' }} />
          <span className={styles.panelTitle}>In-Call Messages</span>
        </div>
        <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      {/* Messages */}
      <div className={styles.chattingDisplay}>
        {messages.length === 0 ? (
          <div className={styles.noMessages}>No messages yet. Say hi! 👋</div>
        ) : (
          messages.map((item, index) => (
            <div key={index} className={styles.chatMsgRow}>
              <div className={styles.chatMsgSenderLine}>
                <span className={styles.chatMsgSender}>{item.sender}</span>
                {item.timestamp && (
                  <span className={styles.chatMsgTime}>{formatTime(item.timestamp)}</span>
                )}
              </div>
              <div className={styles.chatMsgText}>{item.data}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.chattingArea}>
        <input
          className={styles.chatInputField}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className={styles.chatSendBtn}
          onClick={handleSend}
          disabled={!message.trim()}
          type="button"
        >
          <SendIcon sx={{ fontSize: 16 }} />
        </button>
      </div>
    </div>
  );
});

export default ChatPanel;

