import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import ChatInput from './ChatInput';

const Chat = ({ chatHandler, initialChatHistory, peers, aiHandler }) => {
  const [chatHistory, setChatHistory] = useState(initialChatHistory || []);
  const [activeTab, setActiveTab] = useState('chat'); // Manages which tab is active

  useEffect(() => {
    if (chatHandler) {
      chatHandler.setChatHistoryListener(setChatHistory);
    }
  }, [chatHandler]);

  const handleSendMessage = useCallback((message) => {
    if (!message.trim()) {
      toast.error('Please enter a message before sending.');
      return;
    }

    chatHandler.sendMessage(message);
    setChatHistory((prevHistory) => [
      ...prevHistory,
      { sender: chatHandler.username, text: message },
    ]);

    // Process the message through AIHandler
    if (aiHandler) {
      aiHandler.processUserMessage(message);
    }
  }, [chatHandler, aiHandler]);

  const getProfilePicture = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="h-full flex flex-col  dark:border-neutral-800">
      {/* Tab Buttons */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          className={`px-8 py-2 rounded-md ${
            activeTab === 'chat'
              ? 'bg-neutral-800 text-white'
              : 'bg-transparent text-gray-500 hover:bg-neutral-800 hover:text-white'
          }`}
          onClick={() => handleTabSwitch('chat')}
        >
          Chat
        </button>

        <button
          className={`px-8 py-2 rounded-md ${
            activeTab === 'participants'
              ? 'bg-neutral-800 text-white'
              : 'bg-transparent text-gray-500 hover:bg-neutral-800 hover:text-white'
          }`}
          onClick={() => handleTabSwitch('participants')}
        >
          Participants
        </button>
      </div>

      {/* Conditionally render content based on active tab */}
      <div className="flex flex-col flex-grow p-4">
        {activeTab === 'chat' ? (
          <>
            {/* Chat messages with scroll */}
            <div className="flex-grow overflow-y-auto mb-2">
            {chatHistory.map((msg, index) => (
              <div key={index} className="mb-2 flex items-center">
                <img
                  src={getProfilePicture(msg.sender)}
                  alt={`${msg.sender}'s avatar`}
                  className="w-8 h-8 rounded-md mr-2"
                />
                <div className="text-white">  {/* Explicitly set text color to white */}
                  <strong>{msg.sender}:</strong> {msg.text}
                </div>
              </div>
            ))}
          </div>

            {/* Chat input fixed at the bottom */}
            <div className="sticky bottom-0">
              <ChatInput onSend={handleSendMessage} />
            </div>
          </>
        ) : (
          <div>
            <ul>
              {/* Real participants from the 'peers' prop */}
              {Object.keys(peers).map((peerName, index) => (
                <li key={index} className="mb-2">
                  {peerName}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

Chat.propTypes = {
  chatHandler: PropTypes.object.isRequired,
  initialChatHistory: PropTypes.array.isRequired,
  peers: PropTypes.object.isRequired,  // Pass peers for Participants tab
};

export default Chat;