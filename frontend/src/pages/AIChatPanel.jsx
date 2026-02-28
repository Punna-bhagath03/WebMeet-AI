import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IconButton, CircularProgress } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import styles from '../styles/videoComponent.module.css';
import { client as apiClient } from '../contexts/AuthContext';

/**
 * Lightweight inline markdown → React elements renderer.
 * Handles: headings (##/###), bold (**), italic (*), inline code (`),
 * unordered lists (- / *), ordered lists (1.), horizontal rules (---),
 * and plain line breaks. No external dependency required.
 */
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  const inlineFormat = (str, key) => {
    // Split str by bold, italic, code markers and return spans
    const parts = [];
    // Regex: matches **bold**, *italic*, `code`
    const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIdx = 0;
    let m;
    let pid = 0;
    while ((m = pattern.exec(str)) !== null) {
      if (m.index > lastIdx) {
        parts.push(<span key={`${key}-t${pid++}`}>{str.slice(lastIdx, m.index)}</span>);
      }
      if (m[2] !== undefined) {
        parts.push(<strong key={`${key}-b${pid++}`}>{m[2]}</strong>);
      } else if (m[3] !== undefined) {
        parts.push(<em key={`${key}-i${pid++}`}>{m[3]}</em>);
      } else if (m[4] !== undefined) {
        parts.push(
          <code key={`${key}-c${pid++}`} style={{
            background: '#f1f5f9', borderRadius: 4, padding: '1px 5px',
            fontFamily: 'monospace', fontSize: '0.88em', color: '#0f172a',
          }}>
            {m[4]}
          </code>
        );
      }
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < str.length) {
      parts.push(<span key={`${key}-t${pid++}`}>{str.slice(lastIdx)}</span>);
    }
    return parts.length > 0 ? parts : str;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^-{3,}$|^\*{3,}$/.test(line.trim())) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />);
      i++; continue;
    }

    // H2 heading
    if (/^## /.test(line)) {
      elements.push(
        <p key={i} style={{ fontWeight: 700, fontSize: '0.97em', color: '#0f172a', margin: '10px 0 4px 0' }}>
          {inlineFormat(line.replace(/^## /, ''), `h2-${i}`)}
        </p>
      );
      i++; continue;
    }

    // H3 heading
    if (/^### /.test(line)) {
      elements.push(
        <p key={i} style={{ fontWeight: 700, fontSize: '0.92em', color: '#334155', margin: '8px 0 3px 0' }}>
          {inlineFormat(line.replace(/^### /, ''), `h3-${i}`)}
        </p>
      );
      i++; continue;
    }

    // H1 heading
    if (/^# /.test(line)) {
      elements.push(
        <p key={i} style={{ fontWeight: 700, fontSize: '1em', color: '#0f172a', margin: '10px 0 4px 0' }}>
          {inlineFormat(line.replace(/^# /, ''), `h1-${i}`)}
        </p>
      );
      i++; continue;
    }

    // Collect unordered list block
    if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(
          <li key={i} style={{ marginBottom: 3 }}>
            {inlineFormat(lines[i].replace(/^[-*] /, ''), `ul-${i}`)}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '4px 0', paddingLeft: 18 }}>
          {items}
        </ul>
      );
      continue;
    }

    // Collect ordered list block
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(
          <li key={i} style={{ marginBottom: 3 }}>
            {inlineFormat(lines[i].replace(/^\d+\. /, ''), `ol-${i}`)}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: '4px 0', paddingLeft: 18 }}>
          {items}
        </ol>
      );
      continue;
    }

    // Empty line → small gap
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />);
      i++; continue;
    }

    // Plain paragraph
    elements.push(
      <p key={i} style={{ margin: '3px 0', lineHeight: 1.6 }}>
        {inlineFormat(line, `p-${i}`)}
      </p>
    );
    i++;
  }

  return elements;
}

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
            {chat.type === 'ai'
              ? renderMarkdown(chat.message)
              : chat.message}
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

