// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

// 1. Added crewCount to the props list here
export default function SessionHUD({
  wallCode,
  muralName,
  artistName,
  crewCount,
  onClear,
  onExit,
}) {
  console.log("HUD names:", { muralName, artistName });
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 w-full p-8 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent z-20 pointer-events-none"
    >
      {/* 2. Added pointer-events-none to the container so you can draw "through" the empty space, 
          then added pointer-events-auto to the buttons below. */}
      <div className="pointer-events-auto">
        <h2 className="text-white font-black tracking-tighter text-2xl leading-none uppercase">
          {/* Mural Name and Code on one line */}
          {muralName || "Mural"}
          <span className="text-pink-500 ml-3 border-l border-white/20 pl-3">
            {wallCode}
          </span>
        </h2>

        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em] mt-2">
          Artist:{" "}
          <span className="text-zinc-300">{artistName || "Anonymous"}</span>
        </p>

        <div className="flex items-center gap-2 font-mono text-[10px] uppercase mt-3 bg-black/40 w-fit px-2 py-1 rounded-sm border border-white/5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-zinc-400">{crewCount || 0} Artists Active</span>
        </div>
      </div>

      <div className="flex gap-4 pointer-events-auto">
        <button
          onClick={() => {
            console.log("HUD: Clear Triggered");
            if (onClear) onClear();
            else console.error("HUD: onClear prop is missing!");
          }}
          className="px-4 py-2 border border-red-500/20 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 text-xs uppercase font-bold transition-all"
        >
          Clear Wall
        </button>
        <button
          onClick={onExit}
          className="px-6 py-2 border border-white/10 text-gray-500 hover:text-white hover:border-pink-500 hover:bg-pink-500/10 text-xs uppercase font-bold transition-all tracking-widest"
        >
          Exit Treaty
        </button>
      </div>
    </motion.div>
  );
}
