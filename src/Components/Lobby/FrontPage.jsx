import { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import JoinRoom from "./JoinRoom";
import MuralCanvas from "../CanvasPage/MuralCanvas";
import CreateWall from "./CreateWall";
import AdminOverlay from "./AdminOverlay";
import socket from "../../socket";

export default function FrontPage() {
// FrontPage.jsx
  const [view, setView] = useState("MENU"); // Back to standard
  const [activeWallData, setActiveWallData] = useState(null); 
  const [muralName, setMuralName] = useState("");
  const [artistTag, setArtistTag] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [duration, setDuration] = useState(60);
  const [crewCount, setCrewCount] = useState(0);



  // --- SOCKET LISTENERS ---
useEffect(() => {
  socket.on("room_count_update", (count) => {
    setCrewCount(count);
  });

  // Listen for the CORRECT signal from the server
  socket.on("mission_start_confirmed", (data) => {
    console.log("Mission Start Received by Artist!");
    setActiveWallData((prev) => {
      if (prev) {
        return { 
          ...prev, 
          isStarted: true, 
          expiresAt: data.finishAt, // Use the timestamp from the server
        };
      }
      return prev;
    });
  });

  return () => {
    socket.off("room_count_update");
    socket.off("mission_start_confirmed");
  };
}, []);


  // --- HANDLERS ---
  const handleCreateWall = async () => {
    if (!muralName || !artistTag) return alert("Mural identity required.");

    try {
      const response = await fetch("http://localhost:3000/api/mural/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: artistTag,
          muralName: muralName,
          partySize: partySize,
          durationMinutes: Number(duration), 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        socket.emit('join_wall',{ 
  wallCode: data.wallCode, 
  artistName: data.nickname
});
        setActiveWallData({
          artistName: artistTag,
          muralName: muralName,
          wallCode: data.wallCode,
          adminCode: data.adminCode, 
          durationSeconds: Number(duration),
          isAdmin: true,
          isStarted: false,
        });
        localStorage.setItem(`mural_admin_${data.wallCode}`, data.adminCode);
        setView("MURAL");
      } else {
        alert(data.message || "Failed to initialize wall");
      }
    } catch (err) {
      console.error("Deployment Error:", err);
      alert("Connection Error: Check backend port.");
    }
  };

  const startMission = () => {
    if (!activeWallData) return;
   console.log("Admin is starting mission...");
    
    socket.emit("start_mission", { 
      wallCode: activeWallData.wallCode,
      muralName: activeWallData.muralName,
     durationSeconds: activeWallData.durationSeconds
    });

    setActiveWallData((prev) => ({
      ...prev,
      isStarted: true,
    }));
  };

  const handleExit = () => {
 // Only warn if the game is active OR currently revealing
  // If the game is over and they've seen the reveal, let them leave freely
  if (activeWallData?.isStarted && !activeWallData?.revealComplete) {
    const confirmLeave = window.confirm(
      "The reveal is about to start! If you leave now, you'll miss the final wall. Exit anyway?"
    );
    if (!confirmLeave) return;
  }

  // Clear session and reset
  localStorage.removeItem("mural_session");
  localStorage.removeItem(`mural_save_${activeWallData?.wallCode}`); // Clean up the specific canvas save
  
  setActiveWallData(null); 
  setView("MENU");
  window.location.reload();
};

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 font-sans">
       {view !== "MURAL" && (
        <div className="text-center mb-16">
          <motion.h1
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 10,
              delay: 0.2,
            }}
            className="text-7xl font-black italic tracking-tighter"
          >
            <span className="text-white">GRAFFITI</span>
            <motion.span
              animate={{ opacity: [1, 0.8, 1, 0.9, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-treaty-neon drop-shadow-[0_0_15px_rgba(57,255,20,0.6)]"
            >
              <span className="text-treaty-neon"> TREATY</span>
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="text-treaty-accent font-mono mt-4 animate-pulse tracking-widest text-lg"
          >
            AWAITING ARTIST SIGNATURE...
          </motion.p>
        </div>
      )}

      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {view === "MENU" && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex gap-6"
            >
              <button onClick={() => setView("CREATE")} className="flex-1 border-2 border-green-400 p-4 font-black uppercase italic hover:bg-green-400 hover:text-black transition-all">
                Create Wall
              </button>
              <button onClick={() => setView("JOIN")} className="flex-1 bg-white text-black p-4 font-black uppercase italic hover:bg-zinc-200 transition-all">
                Join Wall
              </button>
            </motion.div>
          )}

          {view === "CREATE" && (
            <CreateWall
              onBack={() => setView("MENU")}
              onDeploy={handleCreateWall}
              muralName={muralName}
              setMuralName={setMuralName}
              artistTag={artistTag}
              setArtistTag={setArtistTag}
              setPartySize={setPartySize}
              setDuration={setDuration}
            />
          )}

          {view === "JOIN" && (
            <JoinRoom
              onBack={() => setView("MENU")}
              onJoin={(data) => {
                console.log("WHOLE DATA OBJECT:", JSON.stringify(data, null, 2));
                setActiveWallData({
                  artistName: data.nickname,// Uses your state variable
                  wallCode: data.wallCode,
                  muralName: data.muralName || data.settings?.muralName,
                  isAdmin: false,
                  isStarted: data.isStarted || false,
                });
                socket.emit("join_wall", data.wallCode);
                setView("MURAL");
              }}
            />
          )}
          {view === "MURAL" && activeWallData && (
  <motion.div 
    key="canvas-view"
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    className="fixed inset-0 z-50 bg-black overflow-hidden"
  >
    {/* 1. THE CANVAS LAYER (Bottom) */}
    <div className="absolute inset-0 z-10">
      <MuralCanvas
       {...activeWallData}
       isStarted={activeWallData.isStarted}
       endTime={activeWallData.expiresAt} // Pass the timestamp here too!
       crewCount={crewCount}
      socket={socket}
      durationMinutes={duration}
        onExit={handleExit}
      />
    </div>

    {/* 2. THE ADMIN OVERLAY LAYER (Middle) */}
    {!activeWallData.isStarted && (
      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-black/60">
        {/* pointer-events-auto allows interaction with the actual overlay box */}
        <div className="pointer-events-auto">
          <AdminOverlay
            wallCode={activeWallData.wallCode}
            isAdmin={activeWallData.isAdmin}
            crewCount={crewCount}
            onStart={startMission}
          />
        </div>
      </div>
    )}
  </motion.div>
)}
        </AnimatePresence>
      </div>
    </div>
  );
}