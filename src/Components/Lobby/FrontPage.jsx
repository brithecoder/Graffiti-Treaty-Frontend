import {useEffect, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import JoinRoom from "./JoinRoom";
import CreateWall from "./CreateWall";
import InfoModal from "./InfoModal";
import socket from "../../socket";
import { API_BASE_URL } from '../../apiConfig'
import LoadingScreen from "./LoadingScreen";

export default function FrontPage() {
  const navigate = useNavigate();
  
  // --- SERVER WAKE LOCK ---
  const [isWaking, setIsWaking] = useState(true);

  // --- UI STATE ---
  const [view, setView] = useState("MENU"); // MENU, CREATE, or JOIN
  const [infoOpen, setInfoOpen] = useState(false);

  // --- FORM STATE ---
  const [muralName, setMuralName] = useState("");
  const [artistTag, setArtistTag] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [duration, setDuration] = useState(60);



  // --- WAKE UP LOGIC ---
  useEffect(() => {
    const wakeUp = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
          setIsWaking(false); // Server responded! Hide the sphere.
        } else {
          throw new Error("Not ready");
        }
      } catch (err) {
        console.log("Wall is asleep... retrying in 2s",err);
        setTimeout(wakeUp, 2000); // Try again every 2 seconds
      }
    };

    wakeUp();
  }, []);

  // --- HANDLERS ---

  // 1. Create a brand new wall
  const handleCreateWall = async () => {
    if (!muralName || !artistTag) return alert("Artist Tag and Mural Name required.");

    try {
      const response = await fetch(`${API_BASE_URL}/api/mural/create`, {
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
        // Send join signal to socket
        socket.emit("join_wall", { wallCode: data.wallCode, artistName: artistTag });
        
        // TELEPORT to the drawing page and pass data through "state"
        navigate(`/draw/${data.wallCode}`, {
          state: {
            artistName: artistTag,
            muralName: muralName,
            isAdmin: true,
            durationMinutes: Number(duration)
          },
        });
      }
    } catch (err) {
      console.error("Connection Error:", err);
    }
  };

  // 2. Join an existing wall
  const handleJoinWall = (data) => {
    // Send join signal to socket
    socket.emit("join_wall", { wallCode: data.wallCode, artistName: data.nickname });

    // TELEPORT to the drawing page
    navigate(`/draw/${data.wallCode}`, {
      state: {
        artistName: data.nickname,
        muralName: data.muralName || "Joint Mission",
        isAdmin: false,
      },
    });
  };
     if (isWaking) {
    return <LoadingScreen message="WAKING UP THE MURAL SERVER..." />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
      
      {/* HEADER SECTION (Always visible in Lobby) */}
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ y: -50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="text-7xl font-black italic tracking-tighter"
        >
          GRAFFITI <span className="text-treaty-neon drop-shadow-[0_0_15px_rgba(57,255,20,0.6)]">TREATY</span>
        </motion.h1>
        
        <button
          onClick={() => setInfoOpen(true)}
          className="fixed top-6 right-6 text-zinc-500 font-mono text-xs hover:text-[#39ff14] transition-colors border border-zinc-800 px-3 py-1 uppercase tracking-tighter"
        >
          [ Intelligence ]
        </button>
        <InfoModal isOpen={infoOpen} onClose={() => setInfoOpen(false)} />

        <motion.p 
          animate={{ opacity: [1, 0.5, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-treaty-accent font-mono mt-4 tracking-widest text-lg"
        >
          AWAITING ARTIST SIGNATURE...
        </motion.p>
      </div>

      {/* VIEW SWITCHER */}
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          
          {/* MENU VIEW */}
          {view === "MENU" && (
            <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-6">
              <button 
                onClick={() => setView("CREATE")} 
                className="flex-1 border-2 border-green-400 p-4 font-black uppercase italic hover:bg-green-400 hover:text-black transition-all"
              >
                Create Wall
              </button>
              <button 
                onClick={() => setView("JOIN")} 
                className="flex-1 bg-white text-black p-4 font-black uppercase italic hover:bg-zinc-200 transition-all"
              >
                Join Wall
              </button>
            </motion.div>
          )}

          {/* CREATE VIEW */}
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

          {/* JOIN VIEW */}
          {view === "JOIN" && (
            <JoinRoom
              onBack={() => setView("MENU")}
              onJoin={handleJoinWall}
            />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}