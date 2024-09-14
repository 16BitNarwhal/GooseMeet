import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import MeetingPage from './pages/MeetingPage';

const App = () => {
  console.log(process.env.REACT_APP_API_URL);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/meet/:meeting_name" element={<MeetingPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
