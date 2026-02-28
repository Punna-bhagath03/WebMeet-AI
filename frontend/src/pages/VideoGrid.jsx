import React, { useRef, useEffect, useState } from 'react';
import { IconButton } from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import MicOffIcon from '@mui/icons-material/MicOff';
import styles from '../styles/videoComponent.module.css';

/** Get initials from a name string */
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

/**
 * Individual remote video — attaches srcObject only when the stream
 * reference actually changes, NOT on every parent render.
 */
const RemoteVideo = React.memo(function RemoteVideo({
  socketId,
  username,
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

  const participantLabel = username || `Participant ${socketId.slice(0, 4).toUpperCase()}`;

  return (
    <div
      className={wrapperClass}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Avatar background (visible if video is off/black) */}
      <div className={styles.videoAvatarBg}>
        <div className={styles.videoAvatarCircle}>
          {username ? getInitials(username) : 'P'}
        </div>
      </div>

      <video
        className={styles.peerVideo}
        data-socket={socketId}
        ref={videoEl}
        autoPlay
        playsInline
      />

      <div className={styles.participantName}>{participantLabel}</div>

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

const HiddenRemoteAudio = React.memo(function HiddenRemoteAudio({ stream }) {
  const audioEl = useRef(null);

  useEffect(() => {
    if (audioEl.current && stream && audioEl.current.srcObject !== stream) {
      audioEl.current.srcObject = stream;
      audioEl.current.play().catch(() => {});
    }
  }, [stream]);

  return <audio ref={audioEl} autoPlay playsInline style={{ display: 'none' }} />;
});

/**
 * The entire video grid including the local preview and all remote tiles.
 */
const VideoGrid = React.memo(function VideoGrid({
  username,
  videos,
  setLocalVideoRef,
  maximizedVideo,
  setMaximizedVideo,
  showChat,
  showAIChat,
  showParticipants,
  localVideoEnabled,
  localAudioEnabled,
}) {
  const [hoveredVideo, setHoveredVideo] = useState(null);

  const maxVisibleRemoteTiles = 6;
  const visibleVideos = maximizedVideo
    ? videos.filter((video) => video.socketId === maximizedVideo)
    : videos.slice(0, maxVisibleRemoteTiles);
  const hiddenVideos = maximizedVideo
    ? videos.filter((video) => video.socketId !== maximizedVideo)
    : videos.slice(maxVisibleRemoteTiles);
  const visibleCountClass = styles[`tileCount${Math.min(visibleVideos.length, 6)}`] || '';

  const getConferenceViewClasses = () => {
    const classes = [styles.conferenceView];
    if (maximizedVideo) classes.push(styles.maximizedLayout);
    if (showChat) classes.push(styles.chatOpen);
    if (showAIChat) classes.push(styles.aiOpen);
    if (showParticipants) classes.push(styles.participantsOpen);
    if (!maximizedVideo && visibleCountClass) classes.push(visibleCountClass);
    return classes.join(' ');
  };

  const renderParticipantsList = () => {
    if (!maximizedVideo) return null;
    return (
      <div className={styles.participantsList}>
        <h6 style={{ margin: 0, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #e2e8f0', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <GroupIcon sx={{ fontSize: 18 }} />
          Participants ({videos.length + 1})
        </h6>
        <div className={styles.participantItem}>
          <PersonIcon />
          <span>{username} (You)</span>
        </div>
        {videos.map((video) => (
          <div key={video.socketId} className={styles.participantItem}>
            <PersonIcon />
            <span>{video.username || `Participant ${video.socketId.slice(0, 4).toUpperCase()}`}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={getConferenceViewClasses()}>
        {/* Local video tile */}
        <div className={`${styles.videoWrapper} ${styles.localVideo}`}>
          {/* Avatar shown when camera is off */}
          <div className={styles.videoAvatarBg}>
            <div className={styles.videoAvatarCircle}>{getInitials(username)}</div>
          </div>

          <video
            className={styles.peerVideo}
            ref={setLocalVideoRef}
            autoPlay
            muted
            playsInline
            style={localVideoEnabled === false ? { display: 'none' } : {}}
          />

          {/* Mute indicator */}
          {localAudioEnabled === false && (
            <div className={styles.videoMuteIndicator}>
              <MicOffIcon sx={{ fontSize: 14, color: 'white' }} />
            </div>
          )}

          <div className={styles.participantName}>{username} (You)</div>
        </div>

        {maximizedVideo
          ? visibleVideos.map((video) =>
              video.socketId === maximizedVideo ? (
                <RemoteVideo
                  key={video.socketId}
                  socketId={video.socketId}                  username={video.username}                  stream={video.stream}
                  isMaximized
                  isHovered={false}
                  onMouseEnter={undefined}
                  onMouseLeave={undefined}
                  onMaximize={undefined}
                  onMinimize={() => setMaximizedVideo(null)}
                />
              ) : null
            )
          : visibleVideos.map((video) => (
              <RemoteVideo
                key={video.socketId}
                socketId={video.socketId}
                username={video.username}
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

      {hiddenVideos.map((video) => (
        <HiddenRemoteAudio key={`audio-${video.socketId}`} stream={video.stream} />
      ))}

      {renderParticipantsList()}
    </>
  );
});

export default VideoGrid;
