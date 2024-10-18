import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/home/index';
import Classes from './pages/classes';
import VolunteerProfile from './pages/volunteerProfile';

function App() {

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/volunteer/classes" element={<Classes/>} />
          <Route path="/volunteer/my-profile" element={<VolunteerProfile/>} />
          <Route path="/volunteer/hours" element={<Home/>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
