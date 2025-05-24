import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import withAuth from '../utils/withAuth';
import { AuthContext } from '../contexts/AuthContext';
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  AppBar,
  Toolbar,
  Box,
  Tooltip,
  Divider,
  Button,
  Snackbar,
  ListItemSecondary,
  Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VideocamIcon from '@mui/icons-material/Videocam';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';

function History() {
  const navigate = useNavigate();
  const { getHistoryOfUser, addToUserHistory } = useContext(AuthContext);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [meetings, setMeetings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const historyData = await getHistoryOfUser();
        if (Array.isArray(historyData)) {
          // Format meetings with dates and sort by most recent
          const formattedMeetings = historyData.map(meeting => ({
            ...meeting,
            date: new Date(meeting.timestamp || Date.now())
          })).sort((a, b) => b.date - a.date);

          // Group meetings by date
          const groupedMeetings = formattedMeetings.reduce((groups, meeting) => {
            const date = meeting.date.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });
            if (!groups[date]) {
              groups[date] = [];
            }
            groups[date].push(meeting);
            return groups;
          }, {});

          setMeetings(groupedMeetings);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
        setMeetings({});
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [getHistoryOfUser]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setShowCopiedAlert(true);
  };

  const handleJoinMeeting = (code) => {
    navigate(`/${code}`);
  };

  const handleDelete = async (code) => {
    try {
      // Implement delete functionality if available in the backend
      // For now, just refresh the history
      const historyData = await getHistoryOfUser();
      if (Array.isArray(historyData)) {
        const formattedMeetings = historyData
          .filter(meeting => meeting.code !== code)
          .map(meeting => ({
            ...meeting,
            date: new Date(meeting.timestamp || Date.now())
          }))
          .sort((a, b) => b.date - a.date);

        const groupedMeetings = formattedMeetings.reduce((groups, meeting) => {
          const date = meeting.date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          });
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(meeting);
          return groups;
        }, {});

        setMeetings(groupedMeetings);
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Loading history...</Typography>
      </Container>
    );
  }

  return (
    <div className="historyContainer">
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate('/home')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
            Meeting History
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        {Object.keys(meetings).length > 0 ? (
          Object.entries(meetings).map(([date, dayMeetings]) => (
            <Paper key={date} elevation={3} sx={{ mb: 3, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: 'primary.light', color: 'white', p: 2 }}>
                <Typography variant="h6">
                  {date}
                </Typography>
              </Box>
              <List>
                {dayMeetings.map((meeting, index) => (
                  <React.Fragment key={meeting.code || index}>
                    <ListItem
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Copy Meeting Code">
                            <IconButton edge="end" onClick={() => handleCopyCode(meeting.code)}>
                              <ContentCopyIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Join Meeting">
                            <IconButton edge="end" onClick={() => handleJoinMeeting(meeting.code)}>
                              <VideocamIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton edge="end" onClick={() => handleDelete(meeting.code)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={`Meeting Code: ${meeting.code || 'N/A'}`}
                        secondary={meeting.date.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: 'numeric',
                          hour12: true
                        })}
                      />
                    </ListItem>
                    {index < dayMeetings.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ))
        ) : (
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Meeting History
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Your recent meetings will appear here
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/home')}
              startIcon={<VideocamIcon />}
            >
              Start a Meeting
            </Button>
          </Paper>
        )}
      </Container>

      <Snackbar
        open={showCopiedAlert}
        autoHideDuration={3000}
        onClose={() => setShowCopiedAlert(false)}
        message="Meeting code copied to clipboard"
      />
    </div>
  );
}

export default withAuth(History);
