import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { 
  Button, 
  IconButton, 
  TextField, 
  Typography, 
  Box, 
  Paper,
  Snackbar,
  Tooltip,
  AppBar,
  Toolbar,
  Container,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import VideocamIcon from '@mui/icons-material/Videocam';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { AuthContext } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [newMeetingCode, setNewMeetingCode] = useState('');
  const [error, setError] = useState('');

  const { addToUserHistory } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    try {
      if (meetingCode.trim()) {
        await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      setError('Failed to join meeting. Please try again.');
    }
  };

  const handleCreateMeeting = async () => {
    try {
      const code = uuidv4().substring(0, 8);
      setNewMeetingCode(code);
      await addToUserHistory(code);
    } catch (error) {
      console.error('Error creating meeting:', error);
      setError('Failed to create meeting. Please try again.');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(newMeetingCode);
    setShowCopiedAlert(true);
  };

  const handleJoinNewMeeting = async () => {
    try {
      if (newMeetingCode) {
        await addToUserHistory(newMeetingCode);
        navigate(`/${newMeetingCode}`);
      }
    } catch (error) {
      console.error('Error joining new meeting:', error);
      setError('Failed to join meeting. Please try again.');
    }
  };

  return (
    <div className="homeContainer">
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
            WebMeet-AI
          </Typography>
          <Tooltip title="Meeting History">
            <IconButton onClick={() => navigate('/history')}>
              <RestoreIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton 
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/auth');
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {/* Join Meeting Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                Join a Meeting
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Enter a meeting code to join an existing meeting
              </Typography>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Meeting Code"
                  variant="outlined"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  placeholder="Enter meeting code"
                  sx={{ mb: 2 }}
                />
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={handleJoinVideoCall}
                  disabled={!meetingCode.trim()}
                  startIcon={<VideocamIcon />}
                >
                  Join Meeting
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Create Meeting Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                Create a Meeting
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Generate a new meeting code and invite others
              </Typography>
              <Box sx={{ mt: 2 }}>
                {newMeetingCode ? (
                  <>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        value={newMeetingCode}
                        variant="outlined"
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                      <IconButton onClick={handleCopyCode}>
                        <ContentCopyIcon />
                      </IconButton>
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleJoinNewMeeting}
                      startIcon={<VideocamIcon />}
                    >
                      Join Meeting
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleCreateMeeting}
                    startIcon={<VideocamIcon />}
                  >
                    Create Meeting
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Tips Section */}
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h6" gutterBottom>
                Quick Tips
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    • Create a meeting and share the code with participants
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    • Join meetings using the provided meeting code
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2">
                    • Check your meeting history to rejoin recent meetings
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={showCopiedAlert}
        autoHideDuration={3000}
        onClose={() => setShowCopiedAlert(false)}
        message="Meeting code copied to clipboard"
      />

      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError('')}
        message={error}
      />
    </div>
  );
}

export default withAuth(HomeComponent);
