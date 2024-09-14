import React from 'react';

function Header({ eventName, timeLeft }) {
  return (
    <div className="d-flex flex-col pl-8">
      <div className="-mb-2 text-neutral-400 dark:text-neutral-400">Hack the North Meeting: {eventName}</div>
      <div className="text-black dark:text-white text-lg mt-0">User: {timeLeft}</div>
    </div>
  );
}

export default Header;