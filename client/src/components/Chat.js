import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import ChatInput from './ChatInput';

const Chat = ({ chatHandler, initialChatHistory }) => {
  const [chatHistory, setChatHistory] = useState(initialChatHistory);

  useEffect(() => {
    // Setting the listener so that chatHandler can update chatHistory when new messages arrive
    chatHandler.setChatHistoryListener(setChatHistory);
  }, [chatHandler]);

  const handleSendMessage = useCallback((message) => {
    if (!message.trim()) {
      toast.error('Please enter a message before sending.');
      return;
    }
  
    chatHandler.sendMessage(message);
    setChatHistory(prevHistory => [...prevHistory, { sender: chatHandler.username, text: message }]);
  }, [chatHandler]);

  const getProfilePicture = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  return (
    <div className="w-1/4 bg-white p-4 flex flex-col">
      <h2 className="text-xl mb-4">Chat</h2>
      <div className="flex-1 overflow-y-auto mb-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className="mb-2 flex items-center">
            <img 
              src={getProfilePicture(msg.sender)} 
              alt={`${msg.sender}'s avatar`} 
              className="w-8 h-8 rounded-full mr-2"
            />
            <div>
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          </div>
        ))}
      </div>
      <ChatInput onSend={handleSendMessage} />
    </div>
  );
};

Chat.propTypes = {
  chatHandler: PropTypes.object.isRequired,
  initialChatHistory: PropTypes.array.isRequired,
};

export default Chat;
