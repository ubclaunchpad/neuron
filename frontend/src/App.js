import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Classes from './pages/classes';
import VolunteerProfile from './pages/volunteerProfile';
import VolunteerDash from './pages/volunteerDash';

function App() {

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<VolunteerDash/>} />
          <Route path="/volunteer/classes" element={<Classes/>} />
          <Route path="/volunteer/my-profile" element={<VolunteerProfile/>} />
          <Route path="/volunteer/schedule" element={<VolunteerDash/>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
