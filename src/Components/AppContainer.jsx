import React from 'react'
import FrontPage from '../Components/Lobby/FrontPage'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MuralEnginePage from './Mural/MuralEnginePage'; // You'll create this
import MuralReveal from './Mural/MuralReveal';
export default function AppContainer() {
  return (
    <Router>
      <Routes>
{/* The Lobby / Splash Screen */}
        <Route path="/" element={<FrontPage />} />

        {/* The Drawing Board */}
        <Route path="/draw/:wallCode" element={<MuralEnginePage />} />

        {/* The Reveal Playback */}
        <Route path="/reveal/:wallCode" element={<MuralReveal />} />
 </Routes>
    </Router>

  )
}
