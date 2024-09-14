import React, { useState } from 'react';

function VideoFeed() {
  const [videoDevices, setVideoDevices] = useState([1, 2, 3, 4, 5, 6, 7]); //temporary video input

  return (
    <div className="flex flex-wrap gap-2 pl-8 justify-center mt-4">
      {videoDevices.length > 0 ? (
        // Map over videoDevices (which is the placeholder for the real video input)
        videoDevices.map((device, index) => (
          <div
            key={index}
            className="camera-input dark:bg-neutral-800 bg-neutral-200 relative rounded-md w-96 h-52  flex justify-center items-center text-white text-sm"
          >
            <div className="ml-1 absolute bottom-0 left-0 backdrop-blur-md bg-opacity-60 text-md p-2 text-black dark:text-white">
              Camera {index + 1}
            </div>
          </div>
        ))
      ) : (
        // If no video input, render a placeholder
        <div className="w-96 h-52 camera-input"></div>
      )}
    </div>
  );
}

export default VideoFeed;