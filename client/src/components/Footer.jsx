import React, { useState } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';  // FontAwesome icons
import ToggleButton from './ToggleButton';
import EndCallButton from './EndCallButton';

function Footer() {
  // State for microphone
  const [isMuted, setIsMuted] = useState(false);
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  // State for video
  const [isVideoOn, setIsVideoOn] = useState(true);
  const handleToggleVideo = () => {
    setIsVideoOn(!isVideoOn);
  };
  const handleEndCall = () => {
    console.log('Call ended');
  };

  return (
    <footer className="text-white p-4 mt-4 border-t border-neutral-800">
      {/* Thin line above the footer with `border-t` */}
      <div className="flex justify-center gap-2">
        <ToggleButton
          isActive={isVideoOn}
          onToggle={handleToggleVideo}
          ActiveIcon={FaVideo}
          InactiveIcon={FaVideoSlash}
        />
        <ToggleButton
          isActive={!isMuted}
          onToggle={handleToggleMute}
          ActiveIcon={FaMicrophone}
          InactiveIcon={FaMicrophoneSlash}
        />
        <EndCallButton onEndCall={handleEndCall} />
      </div>
    </footer>
  );
}

export default Footer;