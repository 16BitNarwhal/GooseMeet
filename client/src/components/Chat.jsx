import React, { useState } from 'react';
import EndCallButton from './EndCallButton';

function Footer() {
  const [activeTab, setActiveTab] = useState('chat'); // Manages which tab is active

  const handleEndCall = () => {
    console.log('Call ended');
  };

  // Function to handle tab switching
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="absolute right-0 top-0 h-full w-1/5 border-l px-4 pt-8 border-neutral-200 dark:border-neutral-800">
      {/* Tab Buttons */}
      <div className="flex justify-center gap-4 mb-4">
        {/* Chat Tab */}
        <button
          className={`px-8 py-2 rounded-md ${
            activeTab === 'chat' 
              ? 'bg-neutral-800 text-white'        // Active tab
              : 'bg-transparent text-gray-500 hover:bg-neutral-800 hover:text-white'  // Inactive tab with hover effect
          }`}
          onClick={() => handleTabSwitch('chat')}
        >
          Chat
        </button>

        {/* Participants Tab */}
        <button
          className={`px-8 py-2 rounded-md ${
            activeTab === 'participants'
              ? 'bg-neutral-800 text-white'        // Active tab
              : 'bg-transparent text-gray-500 hover:bg-neutral-800 hover:text-white'  // Inactive tab with hover effect
          }`}
          onClick={() => handleTabSwitch('participants')}
        >
          Participants
        </button>
      </div>

      {/* Conditionally render content based on active tab */}
      <div className="text-white p-4 rounded-md">
        {activeTab === 'chat' ? (
          <div>
            <h2>Chat Section</h2>
          </div>
        ) : (
          <div>
            <h2>Participants Section</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default Footer;