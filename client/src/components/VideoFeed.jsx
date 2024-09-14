import React, { useState, useRef, useEffect} from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import RTCHandler from '../services/RTCHandler.js';
import toast from 'react-hot-toast';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function VideoFeed() {
  const { meeting_name } = useParams();
  const socketRef = useRef();
  const location = useLocation();
  const username = location.state?.username;
  const navigate = useNavigate();

  const rtcHandler = useRef(null);
  const [peers, setPeers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const chatHandler = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);

  const errorHandler = (error) => {
    console.error(error);
    navigate('/');
    toast.error(error.message);
  }

  const initializeMeeting = async () => {
    if (!username) {
      toast.error('Please enter a username before joining a meeting.');
      navigate('/');
      return;
    }

    console.log(`Joining meeting ${meeting_name}`);
    toast.success(`Joining the meeting...`);

    const newSocket = io(apiUrl);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Connected');
      newSocket.emit('join', { meeting_name: meeting_name, username: username });
    });

    // Fetch chat history manually
    try {
      const response = await fetch(`${apiUrl}/api/messages/${meeting_name}`);
      const history = await response.json();
      console.log('Fetched chat history:', history);
      setChatHistory(history); // set the fetched chat history
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      toast.error('Failed to load chat history');
    }

    rtcHandler.current = new RTCHandler(meeting_name, username, socketRef.current, setPeers, errorHandler);
    rtcHandler.current.initialize();
  };

  useEffect(() => {
    initializeMeeting();
  }, []);

  const toggleMute = () => {
    setIsMuted(prevState => {
      const newMutedState = !prevState;
      if (rtcHandler.current && rtcHandler.current.localStream) {
        rtcHandler.current.localStream.getAudioTracks().forEach(track => {
          track.enabled = !newMutedState;
        });
      }
      return newMutedState;
    });
  };

  const toggleVideo = () => {
    setIsVideoOff(prevState => {
      const newVideoState = !prevState;
      if (rtcHandler.current && rtcHandler.current.localStream) {
        rtcHandler.current.localStream.getVideoTracks().forEach(track => {
          track.enabled = !newVideoState;
        });
      }
      return newVideoState;
    });
  };

  const VideoElement = React.memo(({ stream, muted, peerName }) => {
    const videoRef = useRef();

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    return (
      <div
        className="camera-input dark:bg-neutral-800 bg-neutral-200 relative rounded-md w-96 h-52  flex justify-center items-center text-white text-sm"
      >
        <div className="ml-1 absolute bottom-0 left-0 backdrop-blur-md bg-opacity-60 text-md p-2 text-black dark:text-white">
          <video ref={videoRef} autoPlay playsInline muted={muted} className="video-element" />
          <p className="video-username">{peerName}</p>
        </div>
      </div>
    );
  });

  if (!username || !rtcHandler.current) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 pl-8 justify-center mt-4">
      <VideoElement
        key={username}
        stream={rtcHandler.current.localStream}
        muted={isMuted}
        peerName={username}
      />
      {Object.entries(peers).map(([peerUsername, peer]) => (
        peerUsername !== username && (
          <VideoElement
            key={peerUsername}
            stream={peer.stream}
            muted={isMuted}
            peerName={peerUsername}
          />
        )
        // If no video input, render a placeholder
        // <div className="w-96 h-52 camera-input"></div>
      ))}
    </div>
  );
}

export default VideoFeed;