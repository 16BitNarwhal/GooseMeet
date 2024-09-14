import React, { useRef } from 'react';
import { FaPaperPlane } from 'react-icons/fa';  // Importing the paper plane icon from React Icons
import PropTypes from 'prop-types';

const ChatInput = ({ onSend }) => {
  const inputRef = useRef();

  const handleSendMessage = (e) => {
    e.preventDefault(); // Prevent the form from causing a page reload
    const message = inputRef.current.value.trim();
    if (message) {
      onSend(message);
      inputRef.current.value = ''; // Clear the input after sending
    }
  };

  return (
    <form onSubmit={handleSendMessage} className="flex w-full">
      <input
        ref={inputRef}
        type="text"
        className="flex-1 px-4 py-2 text-white bg-neutral-800 rounded-l focus:outline-none"
        placeholder="Type a message..."
      />
      <button
        type="submit"
        className="bg-neutral-200 dark:bg-neutral-800 p-4 rounded-r dark:hover:bg-neutral-700 focus:outline-none"
      >
        <FaPaperPlane className="w-5 h-5 text-black dark:text-white" /> {/* Icon for Send */}
      </button>
    </form>
  );
};

ChatInput.propTypes = {
  onSend: PropTypes.func.isRequired,
};

export default ChatInput;