import React from 'react';

function ToggleButton({ isActive, onToggle, ActiveIcon, InactiveIcon, activeColor = 'text-black dark:text-white', inactiveColor = 'text-red-500' }) {
  return (
    <button
      onClick={onToggle}
      className=" bg-neutral-200 dark:bg-neutral-800 p-4 rounded-md dark:hover:bg-neutral-700 focus:outline-none"
    >
      {isActive ? (
        <ActiveIcon className={`w-5 h-5 ${activeColor}`} />  // Active state icon
      ) : (
        <InactiveIcon className={`w-5 h-5 ${inactiveColor}`} />  // Inactive state icon
      )}
    </button>
  );
}

export default ToggleButton;