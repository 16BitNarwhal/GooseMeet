import React from "react";

const Input = ({ className, ...props }) => (
  <input
    className={`px-2 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    {...props}
  />
);

export default Input;