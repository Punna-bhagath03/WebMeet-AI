import React from 'react';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import PeopleIcon from '@mui/icons-material/People';
import styles from '../styles/videoComponent.module.css';

const ParticipantsPanel = React.memo(function ParticipantsPanel({
  visible,
  onClose,
  username,
  videos,
  localAudio,
  localVideo,
}) {
  const totalCount = videos.length + 1;

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className={`${styles.participantsPanel} ${visible ? styles.visible : ''}`}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PeopleIcon sx={{ fontSize: 18, color: '#64748b' }} />
          <span className={styles.panelTitle}>Participants</span>
        </div>
        <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      {/* Body */}
      <div className={styles.participantsPanelBody}>
        <div className={styles.participantSectionLabel}>
          In Meeting ({totalCount})
        </div>

        {/* Local user */}
        <div className={styles.participantRow}>
          <div className={styles.participantAvatar} style={{ background: '#2563eb' }}>
            {getInitials(username)}
          </div>
          <div className={styles.participantInfo}>
            <span className={styles.participantRowName}>
              {username || 'You'}
            </span>
            <span className={styles.participantRoleBadge}>You · Host</span>
          </div>
          <div className={styles.participantMediaIcons}>
            {localAudio ? (
              <MicIcon sx={{ fontSize: 16, color: '#64748b' }} />
            ) : (
              <MicOffIcon sx={{ fontSize: 16, color: '#ef4444' }} />
            )}
            {localVideo ? (
              <VideocamIcon sx={{ fontSize: 16, color: '#64748b' }} />
            ) : (
              <VideocamOffIcon sx={{ fontSize: 16, color: '#ef4444' }} />
            )}
          </div>
        </div>

        {/* Remote participants */}
        {videos.map((v, idx) => {
          const name = v.username || `Participant ${v.socketId.slice(0, 4).toUpperCase()}`;
          const avatarColors = ['#7c3aed', '#059669', '#d97706', '#e11d48', '#0891b2'];
          const color = avatarColors[idx % avatarColors.length];
          return (
            <div key={v.socketId} className={styles.participantRow}>
              <div className={styles.participantAvatar} style={{ background: color }}>
                {getInitials(name)}
              </div>
              <div className={styles.participantInfo}>
                <span className={styles.participantRowName}>{name}</span>
                <span className={styles.participantRoleBadge}>Guest</span>
              </div>
              <div className={styles.participantMediaIcons}>
                <MicIcon sx={{ fontSize: 16, color: '#64748b' }} />
                <VideocamIcon sx={{ fontSize: 16, color: '#64748b' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default ParticipantsPanel;
