import React, { useRef, useEffect, useState, useCallback } from 'react';
import { IconButton, Typography } from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import styles from '../styles/videoComponent.module.css';

/**
 * Individual remote video — attaches srcObject only when the stream
 * reference actually changes, NOT on every parent render.
 */
const RemoteVideo = React.memo(function RemoteVideo({
  socketId,
  stream,
  isMaximized,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onMaximize,
  onMinimize,
}) {
  const videoEl = useRef(null);

  useEffect(() => {
    if (videoEl.current && stream) {
      if (videoEl.current.srcObject !== stream) {
        videoEl.current.srcObject = stream;
        videoEl.current.play().catch(() => {});
      }
    }
  }, [stream]);

  const wrapperClass = isMaximized
    ? `${styles.videoWrapper} ${styles.maximizedVideo}`
    : styles.videoWrapper;

  return (
    <div
      className={wrapperClass}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <video
        className={styles.peerVideo}
        data-socket={socketId}
        ref={videoEl}
        autoPlay
        playsInline
      />
      <div className={styles.participantName}>
        {`Participant ${socketId.slice(0, 4)}`}
      </div>
      {isMaximized ? (
        <IconButton className={styles.maximizeButton} onClick={onMinimize}>
          <CloseFullscreenIcon />
        </IconButton>
      ) : (
        isHovered && (
          <IconButton className={styles.maximizeButton} onClick={onMaximize}>
            <OpenInFullIcon />
          </IconButton>
        )
      )}
    </div>
  );
});

/**
 * The entire video grid including the local preview and all remote tiles.
 * Wrapped in React.memo so it only re-renders when its props truly change.
 */
const VideoGrid = React.memo(function VideoGrid({
  username,
  videos,
  setLocalVideoRef,
  maximizedVideo,
  setMaximizedVideo,
  showChat,
  showAIChat,
}) {
  const [hoveredVideo, setHoveredVideo] = useState(null);

  const getConferenceViewClasses = () => {
    const classes = [styles.conferenceView];
    if (maximizedVideo) classes.push(styles.maximizedLayout);
    if (showChat) classes.push(styles.chatOpen);
    if (showAIChat) classes.push(styles.aiOpen);
    return classes.join(' ');
  };

  const renderParticipantsList = () => {
    if (!maximizedVideo) return null;
    return (
      <div className={styles.participantsList}>
        <Typography variant="h6">
          <GroupIcon sx={{ fontSize: 20 }} />
          Participants ({videos.length + 1})
        </Typography>
        <div className={styles.participantItem}>
          <PersonIcon />
          <Typography variant="body2">{username} (You)</Typography>
        </div>
        {videos.map((video) => (
          <div key={video.socketId} className={styles.participantItem}>
            <PersonIcon />
            <Typography variant="body2">
              {`Participant ${video.socketId.slice(0, 4)}`}
            </Typography>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={getConferenceViewClasses()}>
        {/* Local video — always visible */}
        <div className={`${styles.videoWrapper} ${styles.localVideo}`}>
          <video
            className={styles.peerVideo}
            ref={setLocalVideoRef}
            autoPlay
            muted
            playsInline
          />
          <div className={styles.participantName}>{username} (You)</div>
        </div>

        {maximizedVideo
          ? videos.map((video) =>
              video.socketId === maximizedVideo ? (
                <RemoteVideo
                  key={video.socketId}
                  socketId={video.socketId}
                  stream={video.stream}
                  isMaximized
                  isHovered={false}
                  onMouseEnter={undefined}
                  onMouseLeave={undefined}
                  onMaximize={undefined}
                  onMinimize={() => setMaximizedVideo(null)}
                />
              ) : null
            )
          : videos.map((video) => (
              <RemoteVideo
                key={video.socketId}
                socketId={video.socketId}
                stream={video.stream}
                isMaximized={false}
                isHovered={hoveredVideo === video.socketId}
                onMouseEnter={() => setHoveredVideo(video.socketId)}
                onMouseLeave={() => setHoveredVideo(null)}
                onMaximize={() => setMaximizedVideo(video.socketId)}
                onMinimize={undefined}
              />
            ))}
      </div>

      {renderParticipantsList()}
    </>
  );
});

export default VideoGrid;
