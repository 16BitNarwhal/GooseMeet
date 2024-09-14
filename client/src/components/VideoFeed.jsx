import React, { useState, useRef, useEffect} from 'react';
import toast from 'react-hot-toast';

const apiUrl = 'http://localhost:5000';

function VideoFeed() {
  const meeting_name = 'test'; // TODO: temp
  const [videoDevices, setVideoDevices] = useState([1, 2, 3, 4, 5, 6, 7]); //temporary video input
  const socketRef = useRef();

  const initializeMeeting = async () => {
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

    return () => {
      rtcHandler.current.cleanup();
      socketRef.current.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-wrap gap-2 pl-8 justify-center mt-4">
      {Object.entries(peers).map(([peerUsername, peer]) => (
        peerUsername !== username && (
          <div
            key={index}
            className="camera-input dark:bg-neutral-800 bg-neutral-200 relative rounded-md w-96 h-52  flex justify-center items-center text-white text-sm"
          >
            <div className="ml-1 absolute bottom-0 left-0 backdrop-blur-md bg-opacity-60 text-md p-2 text-black dark:text-white">

  {/* {Object.entries(peers).map(([peerUsername, peer]) => (
    peerUsername !== username && (
      <VideoElement
        key={peerUsername}
        stream={peer.stream}
        muted={false}
        peerName={peerUsername}
      />
    )
  ))} */}
            <VideoElement
              key={peerUsername}
              stream={peer.stream}
              muted={false}
              peerName={peerUsername}
            />

            </div>
          </div>
        )
        // If no video input, render a placeholder
        // <div className="w-96 h-52 camera-input"></div>
      ))}
    </div>
  );
}

export default VideoFeed;