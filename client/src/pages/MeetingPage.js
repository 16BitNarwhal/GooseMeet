import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import RTCHandler from '../services/rtcHandler';
import Chat from '../components/Chat';
import ChatHandler from '../services/chatHandler';
import Header from '../components/Header';
import { FaUser } from 'react-icons/fa';

import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';  // FontAwesome icons
import { MdCallEnd } from 'react-icons/md';


import Button from '../components/Button';
import toast, { Toaster } from 'react-hot-toast';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const MeetingPage = () => {
  const [localStream, setLocalStream] = useState(null); // Store the local stream in state

  const { meeting_name } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef();
  const username = location.state?.username;

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

    console.log(`Joining meeting with ID: ${meeting_name}`);
    toast.success(`Joining the meeting...`);

    const newSocket = io(apiUrl);
    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Connected to server');
      newSocket.emit('join', { meeting_name: meeting_name, username: username });
    });

    // Fetch chat history manually
    try {
      const response = await fetch(`${apiUrl}/api/chat_history/${meeting_name}`);
      const history = await response.json();
      console.log('Fetched chat history:', history);
      setChatHistory(history); // Set the fetched chat history
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      toast.error('Failed to load chat history');
    }

    // Initialize the ChatHandler after fetching history
    chatHandler.current = new ChatHandler(meeting_name, username, socketRef.current, setChatHistory);
    chatHandler.current.initialize();

    rtcHandler.current = new RTCHandler(meeting_name, username, socketRef.current, setPeers, errorHandler);
    rtcHandler.current.initialize();
    // Set the local stream in state to trigger a re-render
    setLocalStream(rtcHandler.current.localStream);
  };

  useEffect(() => {
    initializeMeeting();

    return () => {
      rtcHandler.current.cleanup();
      socketRef.current.disconnect();
    };
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

  if (!username || !rtcHandler.current) {
    return null;
  }

  const VideoElement = React.memo(({ stream, muted, peerName, isLocal }) => {
    const videoRef = useRef();
    const [speaking, setSpeaking] = useState(false);
  
    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);
  
    // Detect speaking with AudioContext
    useEffect(() => {
      if (!stream || muted) return;
  
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 512;
  
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let speakingDetected = false;
  
      const detectSpeaking = () => {
        analyser.getByteFrequencyData(dataArray);
        const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
  
        // Set speaking state based on volume
        if (volume > 22 && !speakingDetected) {
          setSpeaking(true);
          speakingDetected = true;
        } else if (volume <= 20 && speakingDetected) {
          setSpeaking(false);
          speakingDetected = false;
        }
  
        requestAnimationFrame(detectSpeaking);
      };
  
      detectSpeaking();
  
      return () => {
        audioContext.close();
      };
    }, [stream, muted]);
  
    return (
      <div
        className={`relative rounded-md w-[450px] h-[250px] flex justify-center items-center text-white text-sm ${
          speaking ? 'outline outline-4 outline-green-500 rounded-md' : 'outline outline-4 outline-transparent rounded-md'
        }`}
      >
        {/* Video Element or Placeholder */}
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal ? true : muted}  // Always mute local stream
            className="w-full h-full rounded-md object-cover"
          />
        ) : (
          <div className="w-full h-full flex justify-center items-center bg-neutral-700 rounded-md">
            <FaUser size={40} className="text-white" />
          </div>
        )}
  
        {/* Bottom-left overlay for the username */}
        <div className="absolute bottom-2 left-2 z-10 backdrop-blur-md bg-gray-100 bg-opacity-60 text-md px-4 py-2 text-white rounded">
          <p className="video-username flex flex-row gap-2 align-center items-center">
            <FaUser size={10} />
            {peerName}
          </p>
        </div>
      </div>
    );
  });

return (
  <div className="relative h-screen flex bg-white dark:bg-neutral-900">
    {/* Main content: Header, Videos, Footer */}
    <div className="flex flex-col w-4/5 pt-8 h-full">
      <Header eventName={meeting_name} timeLeft={username} />
      <div className="flex-grow">
      <div className="flex flex-wrap gap-4 justify-center p-4 ml-4">
      {localStream && (
  <VideoElement stream={localStream} muted={true} peerName="You" />
)}
          {Object.entries(peers).map(([peerUsername, peer]) => (
            peerUsername !== username && (
              <VideoElement
              key={peerUsername}
              stream={peer.stream}
              muted={false}
              peerName={peerUsername === 'local' ? 'You' : peerUsername}  
            />
            )
          ))}
        </div>
      </div>
      <footer className="p-4 flex justify-center space-x-4 border-t border-neutral-700 dark:border-neutral-800">
        {/* Toggle Video Button */}
        <button
          onClick={toggleVideo}
          className="bg-neutral-200 dark:bg-neutral-800 p-4 rounded-md dark:hover:bg-neutral-700 focus:outline-none"
        >
          {isVideoOff ? (
            <FaVideoSlash className="w-5 h-5 text-red-500" />
          ) : (
            <FaVideo className="w-5 h-5 text-black dark:text-white" />
          )}
        </button>

        {/* Toggle Mute Button */}
        <button
          onClick={toggleMute}
          className="bg-neutral-200 dark:bg-neutral-800 p-4 rounded-md dark:hover:bg-neutral-700 focus:outline-none"
        >
          {isMuted ? (
            <FaMicrophoneSlash className="w-5 h-5 text-red-500" />
          ) : (
            <FaMicrophone className="w-5 h-5 text-black dark:text-white" />
          )}
        </button>

        {/* End Call Button */}
        <button
          onClick={() => navigate('/')}
          className="bg-red-500 text-white p-4 rounded-md"
        >
          <div className="flex flex-row gap-2">
            <MdCallEnd className="w-6 h-6" /> 
            <p className="font-medium">Leave</p>
          </div>
        </button>
    </footer>
    </div>

    {/* Chat Column using flex instead of absolute */}
    <div className="flex-shrink-0 w-1/5 h-full border-l border-neutral-800 p-4 dark:bg-neutral-900 overflow-y-auto">
      <Chat chatHandler={chatHandler.current} initialChatHistory={chatHistory} peers={peers} />
    </div>
  </div>
  );
};

export default MeetingPage;
