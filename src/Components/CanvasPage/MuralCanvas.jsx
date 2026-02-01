import React, { useEffect, useCallback, useRef, useState } from "react";
import { useMuralEngine } from "../../CustomHooks/useMuralEngine";
import colors from "../../constants/colors";
import SessionHUD from "./SessionHUD";
import Toolbelt from "./Toolbelt";
import MuralReveal from '../Mural/MuralReveal'
import AdminOverlay from '../Lobby/AdminOverlay'

export default function MuralCanvas({
  muralName,
  crewCount,
  artistName,
  wallCode,
  isStarted: propIsStarted,
  socket,
  durationSeconds, // Make sure this is passed from your wall data
  onExit,
  onFinish,
  isAdmin,
}) {
  const renderRef = useRef(null);
  const [activeColor, setActiveColor] = useState(colors[0].hex);
  const [brushSize, setBrushSize] = useState(15);
  const [isEraser, setIsEraser] = useState(false);
  const [capType, setCapType] = useState("standard");
  const [bgType, setBgType] = useState("none");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [timeLeft, setTimeLeft] = useState(durationSeconds || 0);
  const [isFinished, setIsFinished] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const [started, setStarted] = useState(propIsStarted || false);
  const [currentCrewCount, setCurrentCrewCount] = useState(crewCount || 0);


  const engine = useMuralEngine({
    renderRef,
    artistName,
    wallCode,
    activeColor,
    brushSize,
    isEraser,
    capType,
    bgType,
    setMousePos,
  });
  const { clearCanvas } = engine;

  const getTimerDisplay = () => {
    // If we haven't started, trust the prop (which the server/admin provides)
    // If we have started, trust the local ticker state (timeLeft)
    const total = started ? Number(timeLeft) : Number(durationSeconds);
    
    const validTotal = isNaN(total) ? 0 : total;
    const mins = Math.floor(validTotal / 60);
    const secs = validTotal % 60;

    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

useEffect(() => {
  if (!socket) return;

  const handleCrewUpdate = (count) => {
    console.log("Artists in room:", count);
    setCurrentCrewCount(Number(count));
  };

  // 1. Change 'room_data' to 'room_count_update' to match the backend
  socket.on("room_count_update", handleCrewUpdate);

  // 2. Ask the server for the current count immediately (for late joiners)
  socket.emit("request_room_update", { wallCode });

  return () => {
    socket.off("room_count_update", handleCrewUpdate);
  };
}, [socket, wallCode]); // Added wallCode to dependencies

 const rattleSound = useRef(new Audio("/sounds/sprayCanShake.wav"));

  const handleRattle = useCallback(() => {
    if (rattleSound.current) {
      rattleSound.current.currentTime = 0;
      rattleSound.current
        .play()
        .catch((e) => console.log("Audio play blocked:", e));
    }
  }, []);

  const isActive = started && !isFinished;
  // 1. Listen for the Global Start signal
  useEffect(() => {
    if (!socket) return;

    const handleStart = (data) => {
      console.log("Mural Started Data Received:", data);
      // Use the finishAt timestamp from the server
      setStarted(true);
      if (data.finishAt) {
        setEndTime(data.finishAt);
      }
    };
    socket.on("mission_start_confirmed", handleStart);
    return () => socket.off("mission_start_confirmed", handleStart);
  }, [socket]);

  // 2. The Synced Ticker
  useEffect(() => {
    if (!started || !endTime || isFinished) return;

    const timer = setInterval(() => {
      const now = Date.now();
      // Calculate remaining seconds based on the SERVER'S end time
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        setIsFinished(true);
        console.log("WALL LOCKED: Time is up.");
      }
    }, 250); // 250ms keeps the UI responsive

    return () => clearInterval(timer);
  }, [started, endTime, isFinished]);



useEffect(() => {
  if (!socket) return;

  socket.on("mission_ended", () => {
    setIsFinished(true);
    console.log("Mission ended signal received.");

    // 1. Wait 2 seconds for dramatic effect 
    // 2. Then trigger the navigation to the Reveal page
    setTimeout(() => {
      if (onFinish) {
        onFinish(); // This calls navigate(`/reveal/${wallCode}`) in your wrapper!
      }
    }, 2000);
  });

  return () => socket.off("mission_ended");
}, [socket, onFinish]);



const startMission = () => {
    if (!socket) return;
    
    console.log("Admin is starting mission...");
    
    // Tell the server to start the countdown for everyone in the room
    socket.emit("start_mission", {
      wallCode: wallCode,
      muralName: muralName,
      durationSeconds: durationSeconds, // This uses the prop you already have
    });
  }
  
  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col z-50 overflow-hidden">
      {/* HUD: Top Bar */}
      <div className="relative z-[110]">
        <SessionHUD
          muralName={muralName}
          wallCode={wallCode}
          artistName={artistName}
          crewCount={currentCrewCount}
          onClear={isActive ? clearCanvas : null} // Lock clear button when time is up
          onExit={onExit}
          timerDisplay={getTimerDisplay()}
          isFinished={isFinished}
          isExpiring={started && timeLeft <= 10 && timeLeft > 0}
        />
      </div>

      {/* THE WALL (Canvas Area) */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 pt-24 pb-12">
        <div
          className={`relative w-full max-w-5xl aspect-video md:h-[65vh] border-2 border-white/5 bg-[#0a0a0a] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transition-opacity duration-500
         ${!isActive ? "pointer-events-none" : "pointer-events-auto"}
          ${isFinished ? "grayscale-0 contrast-125" : ""}`}
        >
          <div ref={renderRef} className="relative w-full h-full cursor-crosshair z-[60]" />

          {/* MISSION OVERLAY*/}
          {isFinished && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-[50] animate-in fade-in duration-1000">
              <h2 className="text-6xl font-black italic text-white tracking-tighter mb-2">
                MISSION COMPLETE
              </h2>
              <p className="font-mono text-zinc-400 text-sm tracking-[0.3em]">
                THE WALL IS LOCKED
              </p>
            </div>
          )}
          {/* 5. ADD ADMIN OVERLAY (Waiting for start) */}
          {!started && (
            <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-auto">
              <AdminOverlay
                wallCode={wallCode}
                isAdmin={isAdmin}
                crewCount={crewCount}
                onStart={startMission}
              />
            </div>
          )}
    

          {started && (
            <div
              style={{
                position: "absolute",
                top: mousePos.y,
                left: mousePos.x,
                width: "500px",
                height: "500px",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                mixBlendMode: "screen",
                zIndex: 10,
              }}
            />
          )}
        </div>

        {/* Instructions underneath the canvas */}
        <p className="mt-6 pb-24 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse">
          Click and Drag to Tag
        </p>
      </div>

      {/* TOOLBELT: Control Panel */}
      <div
        className={!isActive ? "opacity-20 pointer-events-none" : "opacity-100"}
      >
        <Toolbelt
          colors={colors}
          activeColor={activeColor}
          setActiveColor={setActiveColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          capType={capType}
          setCapType={setCapType}
          isEraser={isEraser}
          setIsEraser={setIsEraser}
          bgType={bgType}
          setBgType={setBgType}
          onRattle={handleRattle}
        />
      </div>
    </div>
  );
}
