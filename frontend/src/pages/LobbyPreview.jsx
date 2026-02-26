import React from 'react';
import { IconButton, Box } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import styles from '../styles/videoComponent.module.css';

/**
 * Memoised lobby camera preview.
 *
 * Re-renders ONLY when video/audio toggle state changes — typing in the
 * username field (which lives in the parent) does NOT reach this component.
 *
 * The callback ref (`setLocalVideoRef`) must be wrapped in useCallback in
 * the parent so its identity is stable across renders.
 */
const LobbyPreview = React.memo(function LobbyPreview({
  setLocalVideoRef,
  video,
  audio,
  onToggleVideo,
  onToggleAudio,
}) {
  return (

    <Box className={styles.lobbyVideoContainer}>
      <video ref={setLocalVideoRef} autoPlay muted playsInline className={styles.lobbyVideoPreview} />
      <div className={styles.lobbyControls}>
        <IconButton
          onClick={onToggleVideo}
          className={`${styles.lobbyControlBtn} ${!video ? styles.lobbyControlBtnOff : ''}`}
        >
          {video ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
        <IconButton
          onClick={onToggleAudio}
          className={`${styles.lobbyControlBtn} ${!audio ? styles.lobbyControlBtnOff : ''}`}
        >
          {audio ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
      </div>
    </Box>
  );
});

export default LobbyPreview;
