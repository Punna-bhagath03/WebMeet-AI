import React, { useState, useCallback } from 'react';
import {
  IconButton,
  TextField,
  Typography,
  Paper,
  Box,
  CircularProgress,
  List,
  ListItem,
} from '@mui/material';
import { Button } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import styles from '../styles/videoComponent.module.css';
import { client as apiClient } from '../contexts/AuthContext';

const AIChatPanel = React.memo(function AIChatPanel({ visible, onClose }) {
  const [aiMessage, setAIMessage] = useState('');
  const [aiChatHistory, setAIChatHistory] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);

  const handleAIChat = useCallback(async () => {
    if (!aiMessage.trim()) return;

    const currentMessage = aiMessage;
    setAIMessage('');

    try {
      setIsAILoading(true);
      setAIChatHistory(prev => [...prev, { type: 'user', message: currentMessage }]);

      const response = await apiClient.post('/ai/chat', { message: currentMessage });

      setAIChatHistory(prev => [...prev, { type: 'ai', message: response.data.response }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setAIChatHistory(prev => [...prev, {
        type: 'error',
        message: 'Failed to get AI response. Please try again.'
      }]);
    } finally {
      setIsAILoading(false);
    }
  }, [aiMessage]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleAIChat();
    }
  }, [handleAIChat]);

  return (
    <Box className={`${styles.aiChatDrawer} ${visible ? styles.visible : ''}`}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'white'
        }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToyIcon /> AI Assistant
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: '#f8f9fa'
        }}>
          <List>
            {aiChatHistory.map((chat, index) => (
              <ListItem key={index} sx={{
                flexDirection: 'column',
                alignItems: chat.type === 'user' ? 'flex-end' : 'flex-start',
                px: 0
              }}>
                <Paper elevation={1} sx={{
                  p: 2,
                  bgcolor: chat.type === 'user' ? 'primary.light' : 'white',
                  color: chat.type === 'user' ? 'white' : 'text.primary',
                  maxWidth: '80%',
                  borderRadius: 2
                }}>
                  <Typography variant="body2">{chat.message}</Typography>
                </Paper>
              </ListItem>
            ))}
            {isAILoading && (
              <ListItem sx={{ justifyContent: 'center' }}>
                <CircularProgress size={24} />
              </ListItem>
            )}
          </List>
        </Box>

        <Box sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'white'
        }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask AI anything..."
            value={aiMessage}
            onChange={(e) => setAIMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isAILoading}
            size="small"
            sx={{ mb: 1 }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleAIChat}
            disabled={isAILoading || !aiMessage.trim()}
          >
            {isAILoading ? 'Processing...' : 'Ask AI'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
});

export default AIChatPanel;
