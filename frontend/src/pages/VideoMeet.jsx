import React, { useEffect, useRef, useState, useContext } from 'react';
import io from 'socket.io-client';
import { 
  Badge, 
  IconButton, 
  TextField, 
  Typography, 
  Paper, 
  Box,
  Drawer,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import styles from '../styles/videoComponent.module.css';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import server from '../environment';
import { AuthContext } from '../contexts/AuthContext';

const server_url = 'http://localhost:8000';

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoref = useRef();
  const { addToUserHistory } = useContext(AuthContext);

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState(true); // Default to true (video on)
  let [audio, setAudio] = useState(true); // Default to true (audio on)
  let [screen, setScreen] = useState(false);
  let [showModal, setModal] = useState(true);
  let [screenAvailable, setScreenAvailable] = useState(false);
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState('');
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState('');

  const videoRef = useRef([]);
  let [videos, setVideos] = useState([]);
  const [maximizedVideo, setMaximizedVideo] = useState(null);
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessage, setAIMessage] = useState('');
  const [aiChatHistory, setAIChatHistory] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    console.log('Initializing permissions');
    getPermissions();
  }, []);

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .catch((e) => console.log('Error getting display media:', e));
      }
    }
  };

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log('Video permission granted');
      } else {
        setVideoAvailable(false);
        console.log('Video permission denied');
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log('Audio permission granted');
      } else {
        setAudioAvailable(false);
        console.log('Audio permission denied');
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log('Error in getPermissions:', error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      console.log('Media state updated:', video, audio);
    }
  }, [video, audio]);

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => track.stop());
      }
    } catch (e) {
      console.log('Error stopping previous stream:', e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        console.log('Offer created:', description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              'signal',
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log('Error setting local description:', e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log('Error stopping tracks on end:', e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    'signal',
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log('Error in offer after end:', e));
            });
          }
        })
    );
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .catch((e) => console.log('Error getting user media:', e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {
        console.log('Error stopping tracks:', e);
      }
    }
  };

  let getDisplayMediaSuccess = (stream) => {
    console.log('Screen sharing started');
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log('Error stopping previous stream:', e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              'signal',
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log('Error setting local description:', e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log('Error stopping screen tracks:', e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          getUserMedia();
        })
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === 'offer') {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        'signal',
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) =>
                      console.log('Error setting local description:', e)
                    );
                })
                .catch((e) => console.log('Error creating answer:', e));
            }
          })
          .catch((e) => console.log('Error setting remote description:', e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log('Error adding ICE candidate:', e));
      }
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on('signal', gotMessageFromServer);

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-call', window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on('chat-message', addMessage);

      socketRef.current.on('user-left', (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on('user-joined', (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                'signal',
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          connections[socketListId].onaddstream = (event) => {
            console.log('New stream received:', event.stream);
            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            );

            if (videoExists) {
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    'signal',
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  );
                })
                .catch((e) => console.log('Error in offer:', e));
            });
          }
        }
      });
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement('canvas'), {
      width,
      height,
    });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  let handleVideo = async () => {
    if (window.localStream) {
      const videoTrack = window.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled; // Toggle video on/off
        setVideo(videoTrack.enabled); // Sync state
        console.log('Video toggled to:', videoTrack.enabled);

        // If turning video back on, ensure peers get the updated stream
        if (videoTrack.enabled) {
          for (let id in connections) {
            if (id === socketIdRef.current) continue;
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    'signal',
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log('Error renegotiating:', e));
            });
          }
        }
      } else {
        console.log('No video track available, reinitializing video');
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: audio, // Preserve current audio state
          });
          window.localStream = newStream;
          localVideoref.current.srcObject = newStream;
          setVideo(true);
          for (let id in connections) {
            if (id === socketIdRef.current) continue;
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    'signal',
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log('Error renegotiating:', e));
            });
          }
        } catch (e) {
          console.log('Error reinitializing video:', e);
        }
      }
    } else {
      console.log('No local stream, initializing video');
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: audio,
        });
        window.localStream = newStream;
        localVideoref.current.srcObject = newStream;
        setVideo(true);
        for (let id in connections) {
          if (id === socketIdRef.current) continue;
          connections[id].addStream(window.localStream);
          connections[id].createOffer().then((description) => {
            connections[id]
              .setLocalDescription(description)
              .then(() => {
                socketRef.current.emit(
                  'signal',
                  id,
                  JSON.stringify({ sdp: connections[id].localDescription })
                );
              })
              .catch((e) => console.log('Error renegotiating:', e));
          });
        }
      } catch (e) {
        console.log('Error initializing video:', e);
      }
    }
  };

  // Updated handleAudio to handle missing stream and ensure functionality
  let handleAudio = async () => {
    if (
      window.localStream &&
      typeof window.localStream.getAudioTracks === 'function'
    ) {
      const audioTrack = window.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled; // Toggle audio on/off
        setAudio(audioTrack.enabled); // Sync state with track
        console.log('Audio toggled to:', audioTrack.enabled);

        // Renegotiate with peers for both on and off states to ensure sync
        for (let id in connections) {
          if (id === socketIdRef.current) continue;
          connections[id].addStream(window.localStream);
          connections[id].createOffer().then((description) => {
            connections[id]
              .setLocalDescription(description)
              .then(() => {
                socketRef.current.emit(
                  'signal',
                  id,
                  JSON.stringify({ sdp: connections[id].localDescription })
                );
              })
              .catch((e) => console.log('Error renegotiating:', e));
          });
        }
      } else {
        console.log('No audio track available, reinitializing stream');
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: video, // Preserve current video state
            audio: true,
          });
          window.localStream = newStream;
          localVideoref.current.srcObject = newStream;
          setAudio(true);
          for (let id in connections) {
            if (id === socketIdRef.current) continue;
            connections[id].addStream(window.localStream);
            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    'signal',
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription })
                  );
                })
                .catch((e) => console.log('Error renegotiating:', e));
            });
          }
        } catch (e) {
          console.log('Error reinitializing audio:', e);
        }
      }
    } else {
      console.log('No valid local stream, initializing stream');
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: video,
          audio: true,
        });
        window.localStream = newStream;
        localVideoref.current.srcObject = newStream;
        setAudio(true);
        for (let id in connections) {
          if (id === socketIdRef.current) continue;
          connections[id].addStream(window.localStream);
          connections[id].createOffer().then((description) => {
            connections[id]
              .setLocalDescription(description)
              .then(() => {
                socketRef.current.emit(
                  'signal',
                  id,
                  JSON.stringify({ sdp: connections[id].localDescription })
                );
              })
              .catch((e) => console.log('Error renegotiating:', e));
          });
        }
      } catch (e) {
        console.log('Error initializing stream:', e);
      }
    }
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {
      console.log('Error ending call:', e);
    }
    window.location.href = '/home';
  };

  let openChat = () => {
    setShowChat(!showChat);
    setShowAIChat(false);
    setNewMessages(0);
  };

  let closeChat = () => {
    setShowChat(false);
  };

  const toggleAIChat = () => {
    setShowAIChat(!showAIChat);
    setShowChat(false);
  };

  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = () => {
    socketRef.current.emit('chat-message', message, username);
    setMessage('');
  };

  let connect = async () => {
    try {
      setAskForUsername(false);
      // Get the meeting code from the URL
      const meetingCode = window.location.pathname.substring(1);
      // Add to history when connecting
      if (meetingCode) {
        await addToUserHistory(meetingCode);
      }
      getMedia();
    } catch (error) {
      console.error('Error connecting to meeting:', error);
    }
  };

  const handleAIChat = async () => {
    if (!aiMessage.trim()) return;

    try {
      setIsAILoading(true);
      setAIChatHistory(prev => [...prev, { type: 'user', message: aiMessage }]);

      const response = await fetch('http://localhost:8000/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: aiMessage })
      });

      const data = await response.json();
      setAIChatHistory(prev => [...prev, { type: 'ai', message: data.response }]);
      setAIMessage('');
    } catch (error) {
      console.error('Error getting AI response:', error);
      setAIChatHistory(prev => [...prev, { 
        type: 'error', 
        message: 'Failed to get AI response. Please try again.' 
      }]);
    } finally {
      setIsAILoading(false);
    }
  };

  // Function to get conference view classes
  const getConferenceViewClasses = () => {
    const classes = [styles.conferenceView];
    if (maximizedVideo) classes.push(styles.maximizedLayout);
    if (showChat) classes.push(styles.chatOpen);
    if (showAIChat) classes.push(styles.aiOpen);
    return classes.join(' ');
  };

  // Function to render participants list
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
          <Typography variant="body2">
            {username} (You)
          </Typography>
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
    <div>
      {askForUsername === true ? (
        <div className={styles.lobbyContainer}>
          <Paper elevation={3} className={styles.lobbyCard}>
            <Box className={styles.lobbyVideoPreview}>
              <video ref={localVideoref} autoPlay muted></video>
              <div className={styles.lobbyControls}>
                <IconButton 
                  onClick={handleVideo} 
                  className={styles.lobbyButton}
                >
                  {video ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
                <IconButton 
                  onClick={handleAudio} 
                  className={styles.lobbyButton}
                >
                  {audio ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
              </div>
            </Box>

            <Box className={styles.lobbyForm}>
              <Typography variant="h5" gutterBottom>
                Join Meeting
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Preview your camera and microphone before joining
              </Typography>
              
              <Box className={styles.usernameInput}>
                <PersonIcon className={styles.userIcon} />
                <TextField
                  fullWidth
                  id="outlined-basic"
                  label="Enter your name"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="John Doe"
                />
              </Box>

              <Button 
                variant="contained" 
                onClick={connect}
                fullWidth
                size="large"
                disabled={!username.trim()}
                className={styles.joinButton}
              >
                Join Now
              </Button>
            </Box>
          </Paper>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {/* Main conference container */}
          <div className={getConferenceViewClasses()}>
            {/* Local video - always visible */}
            <div className={`${styles.videoWrapper} ${styles.localVideo}`}>
              <video
                className={styles.peerVideo}
                ref={localVideoref}
                autoPlay
                muted
              />
              <div className={styles.participantName}>
                {username} (You)
              </div>
            </div>

            {maximizedVideo ? (
              <>
                {/* Maximized remote video */}
                {videos.map((video) => 
                  video.socketId === maximizedVideo ? (
                    <div key={video.socketId} className={`${styles.videoWrapper} ${styles.maximizedVideo}`}>
                      <video
                        className={styles.peerVideo}
                        data-socket={video.socketId}
                        ref={(ref) => {
                          if (ref && video.stream) {
                            ref.srcObject = video.stream;
                          }
                        }}
                        autoPlay
                      />
                      <div className={styles.participantName}>
                        {`Participant ${video.socketId.slice(0, 4)}`}
                      </div>
                      <IconButton 
                        className={styles.maximizeButton}
                        onClick={() => setMaximizedVideo(null)}
                      >
                        <CloseFullscreenIcon />
                      </IconButton>
                    </div>
                  ) : null
                )}
              </>
            ) : (
              // Grid layout for other participants
              videos.map((video) => (
                <div 
                  key={video.socketId}
                  className={styles.videoWrapper}
                  onMouseEnter={() => setHoveredVideo(video.socketId)}
                  onMouseLeave={() => setHoveredVideo(null)}
                >
                  <video
                    className={styles.peerVideo}
                    data-socket={video.socketId}
                    ref={(ref) => {
                      if (ref && video.stream) {
                        ref.srcObject = video.stream;
                      }
                    }}
                    autoPlay
                  />
                  <div className={styles.participantName}>
                    {`Participant ${video.socketId.slice(0, 4)}`}
                  </div>
                  {hoveredVideo === video.socketId && (
                    <IconButton 
                      className={styles.maximizeButton}
                      onClick={() => setMaximizedVideo(video.socketId)}
                    >
                      <OpenInFullIcon />
                    </IconButton>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Participants list */}
          {renderParticipantsList()}

          {/* Chat Room */}
          <div className={`${styles.chatRoom} ${showChat ? styles.visible : ''}`}>
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
                <IconButton onClick={closeChat}>
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
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button variant="contained" onClick={sendMessage}>
                  Send
                </Button>
              </div>
            </div>
          </div>

          {/* AI Chat Drawer */}
          <Box className={`${styles.aiChatDrawer} ${showAIChat ? styles.visible : ''}`}>
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
                <IconButton onClick={() => setShowAIChat(false)}>
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
                  onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
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

          {/* Control buttons */}
          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: 'white' }}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: 'red' }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: 'white' }}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable && (
              <IconButton onClick={handleScreen} style={{ color: 'white' }}>
                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            )}

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton
                onClick={openChat}
                style={{ color: showChat ? '#4caf50' : 'white' }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>

            <IconButton
              onClick={toggleAIChat}
              style={{ color: showAIChat ? '#4caf50' : 'white' }}
            >
              <SmartToyIcon />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}
