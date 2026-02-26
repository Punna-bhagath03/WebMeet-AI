import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import {
  Button,
  IconButton,
  TextField,
  Snackbar,
  Tooltip
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import VideocamIcon from '@mui/icons-material/Videocam';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import { AuthContext } from '../contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);
  const [newMeetingCode, setNewMeetingCode] = useState('');
  const [error, setError] = useState('');

  const { addToUserHistory, handleLogout } = useContext(AuthContext);

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
      <header className="homeHeader">
        <button
          type="button"
          className="landingBrand homeBrandButton"
          onClick={() => navigate('/')}
        >
          <div className="landingBrandIcon">
            <VideocamOutlinedIcon fontSize="small" />
          </div>
          <h2>WebMeet AI</h2>
        </button>

        <div className="homeHeaderActions">
          <Tooltip title="Meeting History">
            <IconButton
              aria-label="meeting history"
              onClick={() => navigate('/history')}
              className="homeHeaderIconButton"
            >
              <RestoreIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton
              aria-label="logout"
              onClick={handleLogout}
              className="homeHeaderIconButton"
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </div>
      </header>

      <main className="homeMain">
        <section className="homeCardsRow">
          <div className="homeCard">
            <h2 className="homeCardTitle">Join a Meeting</h2>
            <p className="homeCardDescription">
              Enter a meeting code to hop into an existing call.
            </p>
            <TextField
              fullWidth
              label="Meeting Code"
              variant="outlined"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              placeholder="Meeting code"
              className="homeInput homeJoinInput"
            />
            <Button
              type="button"
              variant="contained"
              fullWidth
              disableElevation
              onClick={handleJoinVideoCall}
              disabled={!meetingCode.trim()}
              startIcon={<VideocamIcon />}
              className="homeActionButton"
            >
              Join Meeting
            </Button>
          </div>

          <div className="homeCard">
            <h2 className="homeCardTitle">Create a Meeting</h2>
            <p className="homeCardDescription">
              Generate a fresh code and invite teammates in seconds.
            </p>
            {newMeetingCode ? (
              <>
                <div className="homeCodeRow">
                  <TextField
                    fullWidth
                    value={newMeetingCode}
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                    className="homeInput homeGeneratedCodeInput"
                  />
                  <Tooltip title="Copy code">
                    <IconButton
                      aria-label="copy meeting code"
                      onClick={handleCopyCode}
                      className="homeCopyButton"
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
                <Button
                  type="button"
                  variant="contained"
                  fullWidth
                  disableElevation
                  onClick={handleJoinNewMeeting}
                  startIcon={<VideocamIcon />}
                  className="homeActionButton"
                >
                  Join Meeting
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="contained"
                fullWidth
                disableElevation
                onClick={handleCreateMeeting}
                startIcon={<VideocamIcon />}
                className="homeActionButton"
              >
                Create Meeting
              </Button>
            )}
          </div>
        </section>

        <section className="homeTipsCard">
          <h3>Quick Tips</h3>
          <ul className="homeTipsList">
            <li>Create a meeting and share the code with participants.</li>
            <li>Join meetings instantly using the provided code.</li>
            <li>Check your meeting history to hop back into recent calls.</li>
          </ul>
        </section>
      </main>

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
