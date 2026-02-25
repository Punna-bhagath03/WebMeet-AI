import React, { useState, useCallback } from 'react';
import {
  IconButton,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import { Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import styles from '../styles/videoComponent.module.css';

const ChatPanel = React.memo(function ChatPanel({ visible, messages, onClose, onSend }) {
  const [message, setMessage] = useState('');

  const handleSend = useCallback(() => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  }, [message, onSend]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className={`${styles.chatRoom} ${visible ? styles.visible : ''}`}>
      <div className={styles.chatContainer}>
        <Box sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'white'
        }}>
          <Typography variant="h6">Chat</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <div className={styles.chattingDisplay}>
          {messages.length !== 0 ? (
            messages.map((item, index) => (
              <div style={{ marginBottom: '20px' }} key={index}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{item.sender}</Typography>
                <Typography variant="body2">{item.data}</Typography>
              </div>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 2 }}>
              No Messages Yet
            </Typography>
          )}
        </div>
        <div className={styles.chattingArea}>
          <TextField
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            variant="outlined"
            size="small"
            onKeyPress={handleKeyPress}
          />
          <Button variant="contained" onClick={handleSend}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
});

export default ChatPanel;
