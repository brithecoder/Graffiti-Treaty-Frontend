import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import MuralCanvas from '../CanvasPage/MuralCanvas';
import socket from '../../socket';

export default function MuralEnginePage() {
  const { wallCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. DATA EXTRACTION
  const artistName = location.state?.artistName || "Anonymous";
  const muralName = location.state?.muralName || "Joint Mission";
  const isAdmin = location.state?.isAdmin || false; 
  
  // 2. INITIALIZE IN SECONDS
  // If we have state, multiply by 60. If not, default to 60 seconds (1 min).
  const initialSeconds = location.state?.durationMinutes ? Number(location.state.durationMinutes)  : 60;
  const [syncedDuration, setSyncedDuration] = useState(initialSeconds);

  useEffect(() => {
    if (wallCode) {
      socket.emit("join_wall", { wallCode, artistName });

      // Handle server briefing for late joiners (Artists)
      const handleWallInfo = (data) => {
        if (data.durationSeconds) {
          console.log("Setting synced duration to:", data.durationSeconds);
          setSyncedDuration(Number(data.durationSeconds));
        }
      };

      socket.on("wall_info", handleWallInfo);

      return () => {
        socket.off("wall_info", handleWallInfo);
      };
    }
  }, [wallCode, artistName]);

  const handleExit = () => {
    socket.emit("leave_wall", { wallCode });
    navigate('/');
  };

  const handleFinish = () => {
    navigate(`/reveal/${wallCode}`);
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <MuralCanvas 
        wallCode={wallCode}
        artistName={artistName}
        muralName={muralName}
        isAdmin={isAdmin}
        socket={socket}
        durationSeconds={syncedDuration} // This is now always in seconds
        onExit={handleExit}
        onFinish={handleFinish}
      />
    </div>
  );
}