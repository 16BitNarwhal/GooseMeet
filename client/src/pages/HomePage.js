import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button } from "../components";
import toast, { Toaster } from 'react-hot-toast';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const HomePage = () => {
  const [meetCode, setMeetCode] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="text-4xl font-bold mb-8">GooseMeet</h1>
      <div className="w-full max-w-md">
        <Input
          type="text"
          placeholder="Enter your username (required)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4"
        />
        <div className="flex space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Enter meeting code"
            value={meetCode}
            onChange={(e) => setMeetCode(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={handleJoinMeet}>Join</Button>
        </div>
        <Button onClick={handleCreateMeet} className="w-full">Create New Meeting</Button>
      </div>
    </div>
  );
};

export default HomePage;