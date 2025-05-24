import React, { useState } from 'react';
import styles from './videoComponent.module.css';
import { FaExpand } from 'react-icons/fa';

export const VideoConference = ({ participants }) => {
  const [maximizedIndex, setMaximizedIndex] = useState(null);

  return (
    <>
      <div className={styles.conferenceView}>
        {participants.map((participant, index) => {
          const isMaximized = maximizedIndex === index;

          return (
            <div
              key={index}
              className={
                isMaximized
                  ? styles.maximizedVideo
                  : `${styles.videoWrapper} ${
                      maximizedIndex !== null ? styles.miniVideo : ''
                    }`
              }
            >
              {/* Maximize Icon */}
              {maximizedIndex === null && (
                <FaExpand
                  className={styles.maximizeIcon}
                  onClick={() => setMaximizedIndex(index)}
                />
              )}

              {/* Minimize/Close Button */}
              {isMaximized && (
                <button
                  onClick={() => setMaximizedIndex(null)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '5px',
                  }}
                >
                  ✕
                </button>
              )}

              {/* Video Element */}
              <video
                ref={participant.videoRef}
                autoPlay
                playsInline
                muted={participant.isLocal}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 'inherit',
                  objectFit: 'cover',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Mini Video Bar */}
      {maximizedIndex !== null && (
        <div className={styles.miniVideosBar}>
          {participants.map((participant, index) =>
            index !== maximizedIndex ? (
              <video
                key={index}
                ref={participant.videoRef}
                autoPlay
                playsInline
                muted={participant.isLocal}
                className={styles.miniVideo}
              />
            ) : null
          )}
        </div>
      )}
    </>
  );
};

export default VideoConference;
