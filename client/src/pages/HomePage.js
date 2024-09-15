import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import { MrGoose } from "../components/mrgoose/goose";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HomePage = () => {
  const [meetCode, setMeetCode] = useState('');
  const [username, setUsername] = useState('');
  const [isCreating, setIsCreating] = useState(false); // State to toggle between join/create
  const navigate = useNavigate();
  const [currentAnimation, setCurrentAnimation] = useState();

  const handleJoinMeet = () => {
    if (!username.trim()) {
      toast.error('Please enter a username before joining a meeting.');
      return;
    }
    if (!meetCode.trim()) {
      toast.error('Please enter a meeting code.');
      return;
    }

    fetch(`${apiUrl}/api/users/${meetCode}`).then((response) => {
      if (!response.ok) {
        toast.error('Meeting code not found. Please try again.');
        return;
      }
      return response.json();
    }).then((users) => {
      if (users.includes(username)) {
        toast.error(`User ${username} is already in this meeting.`);
        return;
      }
      navigate(`/meet/${meetCode}`, { state: { username } });
    });
  };

  const handleCreateMeet = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username before creating a meeting.');
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/create-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, meeting_name: meetCode }),
      });
      const code = (await response.json()).meeting_name;
      navigate(`/meet/${code}`, { state: { username } });
    } catch (error) {
      toast.error('Failed to create meeting. Please try again.');
    }
  };

  return (
    <div className="flex flex-row items-center justify-center min-h-screen bg-white dark:bg-neutral-900 p-8">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Goose Section */}
      <div className="w-1/2 h-[80vh] flex justify-center items-center bg-transparent rounded-md">
        <Canvas camera={{ position: [10, 20, 80], fov: 50 }}> 
          <OrbitControls />
          <ambientLight />
          <directionalLight position={[-30, 5, 5]} />
          <MrGoose.Model scale={[2, 2, 2]} currentAnimation={currentAnimation} spin={true}/>
        </Canvas>
      </div>

      {/* Right-Side Form Section */}
      <div className="w-1/2 h-full flex flex-col justify-center">
        <h1 className="text-4xl font-bold mb-8 dark:text-white">GooseMeet</h1>

        {/* Input for Username */}
        <div className="w-full max-w-md">
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="text-white w-full mb-4 px-3 py-2 bg-neutral-800 rounded"
          />

          {/* Toggle between Join and Create */}
          <div className="flex w-full space-x-2 mb-4">
            <button
              className={`w-1/2 px-4 py-2 rounded-md ${
                !isCreating
                  ? 'bg-neutral-800 text-white' // Active tab style
                  : 'bg-transparent text-gray-500 hover:bg-neutral-800 hover:text-white' // Inactive tab style with hover effect
              }`}
              onClick={() => setIsCreating(false)}
            >
              Join Meeting
            </button>
            <button
              className={`w-1/2 px-4 py-2 rounded-md ${
                isCreating
                  ? 'bg-neutral-800 text-white' // Active tab style
                  : 'bg-transparent text-gray-500 hover:bg-neutral-800 hover:text-white' // Inactive tab style with hover effect
              }`}
              onClick={() => setIsCreating(true)}
            >
              Create New Meeting
            </button>
          </div>

          {/* Show meeting code input only for "Join" */}
          {!isCreating && (
            <div className="mb-4">
              <label className="block mb-2 text-gray-600 dark:text-gray-400">Meeting Code</label>
              <input
                type="text"
                placeholder="Enter meeting code"
                value={meetCode}
                onChange={(e) => setMeetCode(e.target.value)}
                className="text-white w-full px-3 py-2 bg-neutral-800 rounded"
              />
              <button
                onClick={handleJoinMeet}
                className="bg-gray-200 text-black hover:bg-gray-400 mt-4 w-full px-4 py-2 rounded"
              >
                Join Meeting
              </button>
            </div>
          )}

          {/* For Create New Meeting */}
          {isCreating && (
            <div className="mb-4">
              <label className="block mb-2 text-gray-600 dark:text-gray-400">Meeting Code</label>
              <input
                type="text"
                placeholder="Enter meeting code"
                value={meetCode}
                onChange={(e) => setMeetCode(e.target.value)}
                className="text-white w-full px-3 py-2 bg-neutral-800 rounded"
              />
              <button
                onClick={handleCreateMeet}
                className="bg-green-500 hover:bg-green-600 text-white mt-4 w-full px-4 py-2 rounded"
              >
                Create and Join
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;