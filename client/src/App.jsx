import Meeting from "./Meeting";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Home from "./Home";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/meet/:meeting_id" element={<Meeting />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;