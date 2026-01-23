// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function CreateWall({ 
  onBack, 
  onDeploy, 
  muralName, setMuralName, 
  artistTag, setArtistTag, 
  setPartySize, setDuration 
}) {
  return (
    <motion.div
      key="create-form"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-6 w-full bg-zinc-900/50 p-6 border border-zinc-800 rounded-sm"
    >
      <h2 className="text-white font-black text-2xl uppercase italic tracking-tighter">
        Initialize <span className="text-green-400">New Wall</span>
      </h2>
      
      <div className="flex flex-col gap-4 text-white">
        <input 
          type="text" 
          placeholder="WALL NAME" 
          value={muralName}
          className="bg-zinc-800 p-4 border-b-2 border-zinc-700 outline-none focus:border-green-400 font-mono uppercase"
          onChange={(e) => setMuralName(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="YOUR ARTIST TAG" 
          value={artistTag}
          className="bg-zinc-800 p-4 border-b-2 border-zinc-700 outline-none focus:border-green-400 font-mono uppercase"
          onChange={(e) => setArtistTag(e.target.value)}
        />

        <div className="flex flex-col gap-1 text-white">
          <label className="text-zinc-500 text-[10px] uppercase font-black tracking-widest ml-1">Party Limit</label>
          <select 
            className="bg-zinc-800 p-4 border-b-2 border-zinc-700 outline-none focus:border-green-400 font-mono uppercase cursor-pointer text-white"
            onChange={(e) => setPartySize(Number(e.target.value))}
          >
            {[...Array(30)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} ARTISTS</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-zinc-500 text-[10px] uppercase font-black tracking-widest ml-1">Session Duration</label>
          <select 
            className="bg-zinc-800 p-4 border-b-2 border-zinc-700 outline-none focus:border-green-400 font-mono uppercase cursor-pointer text-white"
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            <option value="60">1 MINUTE</option>
            <option value="300">5 MINUTES</option>
            <option value="1800">30 MINUTES</option>
            <option value="3600">60 MINUTES</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button onClick={onBack} className="text-zinc-500 uppercase font-bold text-sm tracking-widest">Back</button>
        <button onClick={onDeploy} className="flex-1 bg-green-400 text-black font-black py-4 rounded-sm uppercase">Deploy Wall</button>
      </div>
    </motion.div>
  );
}