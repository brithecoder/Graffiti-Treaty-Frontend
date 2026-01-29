import React, { useEffect, useCallback, useRef, useState } from "react";
import { useMuralEngine } from "../../CustomHooks/useMuralEngine";
import colors from "../../constants/colors";
import SessionHUD from "./SessionHUD";
import Toolbelt from "./Toolbelt";
import MuralReveal from "../../constants/MuralPage/MuralReveal";

export default function MuralCanvas({
  muralName,
  crewCount,
  artistName,
  wallCode,
  isStarted,
  socket,
  durationSeconds, // Make sure this is passed from your wall data
  onExit,
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
 const [showReveal, setShowReveal] = useState(false);
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
    // Use a local variable to decide which source to trust
    const totalSeconds = isStarted ? timeLeft : durationSeconds;

    // Force it to be a number just in case the backend/dropdown sent a string
    const total = Number(totalSeconds) || 0;

    const mins = Math.floor(total / 60);
    const secs = total % 60;

    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
 const rattleSound = useRef(new Audio("/sounds/sprayCanShake.wav"));

  const handleRattle = useCallback(() => {
    if (rattleSound.current) {
      rattleSound.current.currentTime = 0;
      rattleSound.current
        .play()
        .catch((e) => console.log("Audio play blocked:", e));
    }
  }, []);

  const isActive = isStarted && !isFinished;
  // 1. Listen for the Global Start signal
  useEffect(() => {
    if (!socket) return;

    const handleStart = (data) => {
      console.log("Mural Started Data Received:", data);
      // Use the finishAt timestamp from the server
      if (data.finishAt) {
        setEndTime(data.finishAt);
      }
    };

    socket.on("mission_start_confirmed", handleStart);
    return () => socket.off("mission_start_confirmed", handleStart);
  }, [socket]);

  // 2. The Synced Ticker
  useEffect(() => {
    if (!isStarted || !endTime || isFinished) return;

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
  }, [isStarted, endTime, isFinished]);

useEffect(() => {
  socket.on("mission_ended", () => {
    setIsFinished(true);
    // Wait 2 seconds for dramatic effect, then show reveal component
    setTimeout(() => setShowReveal(true), 2000);
  });
}, [socket]);

if (showReveal) {
  return <MuralReveal wallCode={wallCode} onExit={onExit} artistName={artistName} />;
}

 

  
  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col z-50 overflow-hidden">
      {/* HUD: Top Bar */}
      <div className="relative z-[110]">
        <SessionHUD
          muralName={muralName}
          wallCode={wallCode}
          artistName={artistName}
          crewCount={crewCount}
          onClear={isActive ? clearCanvas : null} // Lock clear button when time is up
          onExit={onExit}
          timerDisplay={getTimerDisplay()}
          isFinished={isFinished}
          isExpiring={isStarted && timeLeft <= 10 && timeLeft > 0}
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
    

          {isStarted && (
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
