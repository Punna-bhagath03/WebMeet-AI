import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import io from 'socket.io-client';
import { 
  Badge, 
  IconButton, 
  TextField, 
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
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SERVER_URL from '../environment';
import {
  AuthContext,
  getAccessToken,
  registerSocket,
  unregisterSocket,
  refreshAccessToken,
} from '../contexts/AuthContext';
import ChatPanel from './ChatPanel';
import AIChatPanel from './AIChatPanel';
import VideoGrid from './VideoGrid';
import LobbyPreview from './LobbyPreview';

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoref = useRef();
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const hasInitializedLocalMediaRef = useRef(false);
  const isInitializingLocalMediaRef = useRef(false);
  const { addToUserHistory } = useContext(AuthContext);

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState(true); // Default to true (video on)
  let [audio, setAudio] = useState(true); // Default to true (audio on)
  let [screen, setScreen] = useState(false);
  let [screenAvailable, setScreenAvailable] = useState(false);
  let [messages, setMessages] = useState([]);
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState('');

  const videoRef = useRef([]);
  let [videos, setVideos] = useState([]);
  const [maximizedVideo, setMaximizedVideo] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const setLocalStream = (stream) => {
    localStreamRef.current = stream;
  };

  const attachLocalStreamToVideo = (stream) => {
    if (!localVideoref.current || !stream) return;

    // Guard: skip if the stream is already attached (prevents flicker on re-render)
    if (localVideoref.current.srcObject === stream) return;

    localVideoref.current.srcObject = stream;
    localVideoref.current.muted = true;
    localVideoref.current.playsInline = true;

    const playPromise = localVideoref.current.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((error) => {
        console.log('Local video play interrupted:', error);
      });
    }
  };

  const setLocalVideoRef = useCallback((element) => {
    localVideoref.current = element;
    if (!element) return;
    if (!localStreamRef.current) return;
    // Skip if already attached — prevents flicker on parent re-render
    if (element.srcObject === localStreamRef.current) return;
    attachLocalStreamToVideo(localStreamRef.current);
  }, []);

  const logLocalAudioState = (context) => {
    const audioTracks = localStreamRef.current?.getAudioTracks?.() || [];
    console.log(`[${context}] Audio tracks count:`, audioTracks.length);

    if (audioTracks[0]) {
      console.log(`[${context}] LOCAL AUDIO TRACK:`, {
        exists: true,
        id: audioTracks[0].id,
        readyState: audioTracks[0].readyState,
        enabled: audioTracks[0].enabled,
        muted: audioTracks[0].muted,
      });
    } else {
      console.warn(`[${context}] LOCAL AUDIO TRACK: MISSING — no audio tracks on localStreamRef`);
    }
  };

  const logTransceivers = (pc, label) => {
    if (!pc || typeof pc.getTransceivers !== 'function') return;
    pc.getTransceivers().forEach((t, i) => {
      console.log(`[TRANSCEIVER:${label}:${i}]`, {
        mid: t.mid,
        kind: t.sender?.track?.kind || t.receiver?.track?.kind,
        direction: t.direction,
        currentDirection: t.currentDirection,
        senderTrackId: t.sender?.track?.id,
        senderTrackState: t.sender?.track?.readyState,
        senderTrackEnabled: t.sender?.track?.enabled,
      });
    });
  };

  const logSDP = (label, sdp) => {
    const hasAudio = sdp && sdp.includes('m=audio');
    const hasVideo = sdp && sdp.includes('m=video');
    console.log(`[SDP:${label}] m=audio: ${hasAudio}, m=video: ${hasVideo}`);
    if (!hasAudio) {
      console.error(`[SDP:${label}] *** CRITICAL: m=audio MISSING from SDP ***`);
      console.log(`[SDP:${label}] Full SDP:\n`, sdp);
    }
  };

  const startRTPStatsMonitor = (pc, peerId) => {
    const interval = setInterval(() => {
      if (!pc || pc.connectionState === 'closed') {
        clearInterval(interval);
        return;
      }
      pc.getStats(null).then((stats) => {
        stats.forEach((report) => {
          if (report.type === 'outbound-rtp' && report.kind === 'audio') {
            console.log(`[RTP-AUDIO:${peerId}]`, {
              packetsSent: report.packetsSent,
              bytesSent: report.bytesSent,
              timestamp: report.timestamp,
            });
          }
        });
      });
    }, 3000);
  };

  const ensurePeerConnectionTracks = (
    peerConnection,
    peerId,
    kinds = ['audio', 'video']
  ) => {
    if (!peerConnection || !localStreamRef.current) {
      console.warn(`[ensurePeerConnectionTracks:${peerId}] SKIP — pc: ${!!peerConnection}, stream: ${!!localStreamRef.current}`);
      return;
    }

    const localStream = localStreamRef.current;
    const localTracks = localStream
      .getTracks()
      .filter((track) => kinds.includes(track.kind));

    console.log(`[ensurePeerConnectionTracks:${peerId}] tracks to attach:`,
      localTracks.map((t) => ({ kind: t.kind, id: t.id, readyState: t.readyState, enabled: t.enabled })));

    localTracks.forEach((track) => {
      // Re-read senders on every iteration so we never see stale state
      const senders =
        typeof peerConnection.getSenders === 'function'
          ? peerConnection.getSenders()
          : [];

      const sender = senders.find(
        (s) => s.track && s.track.kind === track.kind
      );

      if (!sender) {
        try {
          if (typeof peerConnection.addTrack === 'function') {
            peerConnection.addTrack(track, localStream);
            console.log(`[ensurePeerConnectionTracks:${peerId}] addTrack OK — ${track.kind} (${track.id})`);
          } else if (typeof peerConnection.addStream === 'function') {
            peerConnection.addStream(localStream);
            console.log(`[ensurePeerConnectionTracks:${peerId}] addStream fallback used`);
          }
        } catch (error) {
          console.error(`[ensurePeerConnectionTracks:${peerId}] addTrack FAILED for ${track.kind}:`, error);
        }
      } else if (sender.track !== track) {
        sender
          .replaceTrack(track)
          .then(() =>
            console.log(`[ensurePeerConnectionTracks:${peerId}] replaceTrack OK — ${track.kind}`)
          )
          .catch((error) =>
            console.error(`[ensurePeerConnectionTracks:${peerId}] replaceTrack FAILED for ${track.kind}:`, error)
          );
      } else {
        console.log(`[ensurePeerConnectionTracks:${peerId}] sender already correct for ${track.kind}`);
      }
    });

    // Final sender audit
    const finalSenders =
      typeof peerConnection.getSenders === 'function'
        ? peerConnection.getSenders()
        : [];
    const hasAudioSender = finalSenders.some((s) => s.track?.kind === 'audio');
    const hasVideoSender = finalSenders.some((s) => s.track?.kind === 'video');
    console.log(
      `[ensurePeerConnectionTracks:${peerId}] FINAL — audioSender: ${hasAudioSender}, videoSender: ${hasVideoSender}, senders:`,
      finalSenders.map((s) => ({
        kind: s.track?.kind,
        id: s.track?.id,
        readyState: s.track?.readyState,
        enabled: s.track?.enabled,
      }))
    );
    if (!hasAudioSender && kinds.includes('audio')) {
      console.error(`[ensurePeerConnectionTracks:${peerId}] *** CRITICAL: NO AUDIO SENDER after track setup ***`);
    }
  };

  useEffect(() => {
    if (hasInitializedLocalMediaRef.current) {
      return;
    }
    hasInitializedLocalMediaRef.current = true;
    console.log('Initializing local media');
    initializeLocalMedia();
  }, []);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      unregisterSocket();
    };
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

  const initializeLocalMedia = async () => {
    try {
      if (localStreamRef.current) {
        attachLocalStreamToVideo(localStreamRef.current);
        logLocalAudioState('initializeLocalMedia:reuse');
        return;
      }

      if (isInitializingLocalMediaRef.current) {
        return;
      }

      isInitializingLocalMediaRef.current = true;

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      const userMediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const hasVideoTrack = userMediaStream.getVideoTracks().length > 0;
      const hasAudioTrack = userMediaStream.getAudioTracks().length > 0;

      userMediaStream.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });
      userMediaStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });

      setVideoAvailable(hasVideoTrack);
      setAudioAvailable(hasAudioTrack);
      setVideo(hasVideoTrack);
      setAudio(hasAudioTrack);

      setLocalStream(userMediaStream);
      attachLocalStreamToVideo(userMediaStream);
      logLocalAudioState('initializeLocalMedia:new');
    } catch (error) {
      console.log('Error initializing local media:', error);
      setVideoAvailable(false);
      setAudioAvailable(false);
      setVideo(false);
      setAudio(false);
    } finally {
      isInitializingLocalMediaRef.current = false;
    }
  };

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const replacePeerVideoTrack = (peerConnection, videoTrack, peerId) => {
    if (!peerConnection || !videoTrack) return;

    const videoSender = peerConnection
      .getSenders()
      .find((sender) => sender.track && sender.track.kind === 'video');

    if (videoSender) {
      videoSender
        .replaceTrack(videoTrack)
        .catch((error) =>
          console.log(`Error replacing video track for ${peerId}:`, error)
        );
      return;
    }

    peerConnection.addTrack(videoTrack, screenStreamRef.current || localStreamRef.current);
  };

  let getDisplayMediaSuccess = (stream) => {
    console.log('Screen sharing started');
    screenStreamRef.current = stream;
    attachLocalStreamToVideo(stream);

    const screenVideoTrack = stream.getVideoTracks()[0];

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      replacePeerVideoTrack(connections[id], screenVideoTrack, id);
      ensurePeerConnectionTracks(connections[id], id, ['audio']);

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
            let tracks = screenStreamRef.current?.getTracks() || [];
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log('Error stopping screen tracks:', e);
          }

          screenStreamRef.current = null;

          if (localStreamRef.current) {
            attachLocalStreamToVideo(localStreamRef.current);
            const localVideoTrack = localStreamRef.current.getVideoTracks()[0];

            for (let id in connections) {
              if (id === socketIdRef.current) continue;
              replacePeerVideoTrack(connections[id], localVideoTrack, id);
              ensurePeerConnectionTracks(connections[id], id, ['audio']);
            }
          }
        })
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        logSDP(`REMOTE-${signal.sdp.type}:from:${fromId}`, signal.sdp.sdp);
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === 'offer') {
              // Ensure our tracks are on this PC before answering
              ensurePeerConnectionTracks(connections[fromId], fromId);
              logLocalAudioState(`preAnswer:${fromId}`);

              connections[fromId]
                .createAnswer()
                .then((description) => {
                  logSDP(`LOCAL-answer:to:${fromId}`, description.sdp);
                  logTransceivers(connections[fromId], `answer:${fromId}`);
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
    socketRef.current = io.connect(SERVER_URL, {
      auth: { token: getAccessToken() },
    });

    registerSocket(socketRef.current);

    socketRef.current.on('reconnect_attempt', () => {
      socketRef.current.auth = { token: getAccessToken() };
    });

    socketRef.current.on('connect_error', async (err) => {
      if (err.message === 'Unauthorized') {
        try {
          const newToken = await refreshAccessToken();
          socketRef.current.auth = { token: newToken };
          if (!socketRef.current.connected) {
            socketRef.current.connect();
          }
        } catch {
          // refreshAccessToken failed → authFailureHandler already
          // clears state and redirects to /auth via the interceptor cascade
        }
      }
    });

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

          // Phase 6: RTP stats + connection diagnostics
          connections[socketListId].onconnectionstatechange = () => {
            const state = connections[socketListId].connectionState;
            console.log(`[PC:${socketListId}] connectionState: ${state}`);
            if (state === 'connected') {
              logTransceivers(connections[socketListId], `connected:${socketListId}`);
              startRTPStatsMonitor(connections[socketListId], socketListId);
            }
          };

          // Phase 4: Remote track reception diagnostic
          connections[socketListId].ontrack = (event) => {
            console.log(`[REMOTE-TRACK:${socketListId}]`, {
              kind: event.track.kind,
              id: event.track.id,
              readyState: event.track.readyState,
              enabled: event.track.enabled,
              muted: event.track.muted,
              streamsCount: event.streams?.length,
            });
            const remoteStream = event.streams && event.streams[0];
            if (!remoteStream) {
              console.warn(`[REMOTE-TRACK:${socketListId}] event.streams is empty — audio will NOT reach <video> element`);
              return;
            }

            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            );

            if (videoExists) {
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: remoteStream }
                    : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              let newVideo = {
                socketId: socketListId,
                stream: remoteStream,
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

          if (
            localStreamRef.current !== undefined &&
            localStreamRef.current !== null
          ) {
            ensurePeerConnectionTracks(connections[socketListId], socketListId);
          } else {
            console.log(
              'Local stream missing during peer setup, skipping track attach for:',
              socketListId
            );
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              ensurePeerConnectionTracks(connections[id2], id2);
            } catch (e) {
              console.error(`[user-joined] ensurePeerConnectionTracks threw for ${id2}:`, e);
            }

            // Phase 1: audio track state right before offer
            logLocalAudioState(`preOffer:${id2}`);

            connections[id2].createOffer().then((description) => {
              // Phase 3: verify offer SDP contains m=audio
              logSDP(`LOCAL-offer:to:${id2}`, description.sdp);
              // Phase 5: transceiver directions
              logTransceivers(connections[id2], `offer:${id2}`);

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

  let handleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideo(videoTrack.enabled);
        console.log('Video toggled to:', videoTrack.enabled);
      } else {
        console.log('No video track available to toggle');
      }
    } else {
      console.log('No local stream available for video toggle');
    }
  }, []);

  let handleAudio = useCallback(() => {
    if (
      localStreamRef.current &&
      typeof localStreamRef.current.getAudioTracks === 'function'
    ) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudio(audioTrack.enabled);
        console.log('Audio toggled to:', audioTrack.enabled);
        logLocalAudioState('handleAudio:toggle');
      } else {
        console.log('No audio track available to toggle');
      }
    } else {
      console.log('No local stream available for audio toggle');
    }
  }, []);

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
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log('Error ending call:', e);
    }
    window.location.href = '/home';
  };

  let openChat = useCallback(() => {
    setShowChat(prev => !prev);
    setShowAIChat(false);
    setNewMessages(0);
  }, []);

  let closeChat = useCallback(() => {
    setShowChat(false);
  }, []);

  const toggleAIChat = useCallback(() => {
    setShowAIChat(prev => !prev);
    setShowChat(false);
  }, []);

  const closeAIChat = useCallback(() => {
    setShowAIChat(false);
  }, []);

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = useCallback((msg) => {
    socketRef.current.emit('chat-message', msg, username);
  }, [username]);

  let connect = async () => {
    try {
      if (!localStreamRef.current) {
        await initializeLocalMedia();
      }

      if (!localStreamRef.current) {
        throw new Error('Local media stream is unavailable during join');
      }

      logLocalAudioState('connect:beforeJoin');
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

  return (

    <div>
      {askForUsername === true ? (
        <div className={styles.lobbyContainer}>
          <div className={styles.lobbyCard}>
            <div className={styles.lobbyLeft}>
              <LobbyPreview
                setLocalVideoRef={setLocalVideoRef}
                video={video}
                audio={audio}
                onToggleVideo={handleVideo}
                onToggleAudio={handleAudio}
              />
            </div>

            <div className={styles.lobbyRight}>
              <div className={styles.lobbyBrand}>
                <VideocamIcon className={styles.lobbyBrandIcon} />
                <span>WebMeet AI</span>
              </div>

              <p className={styles.lobbyTitle}>
                Ready to join?
              </p>
              <p className={styles.lobbySubtitle}>
                Configure your settings and join the room.
              </p>

              <div className={styles.lobbyFormGroup}>
                <label className={styles.lobbyLabel}>Meeting ID or Link</label>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={window.location.pathname.substring(1)}
                  InputProps={{
                    readOnly: true,
                  }}
                  className={styles.lobbyInput}
                />
              </div>

              <div className={styles.lobbyFormGroup}>
                <label className={styles.lobbyLabel}>Your Name</label>
                <TextField
                  fullWidth
                  id="username-input"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={styles.lobbyInput}
                />
              </div>

              <Button
                variant="contained"
                onClick={connect}
                fullWidth
                size="medium"
                disabled={!username.trim()}
                className={styles.joinButton}
              >
                Join Now
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {/* Video grid (local + remote) */}
          <VideoGrid
            username={username}
            videos={videos}
            setLocalVideoRef={setLocalVideoRef}
            maximizedVideo={maximizedVideo}
            setMaximizedVideo={setMaximizedVideo}
            showChat={showChat}
            showAIChat={showAIChat}
          />

          {/* Chat Room */}
          <ChatPanel
            visible={showChat}
            messages={messages}
            onClose={closeChat}
            onSend={sendMessage}
          />

          {/* AI Chat Drawer */}
          <AIChatPanel
            visible={showAIChat}
            onClose={closeAIChat}
          />

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
