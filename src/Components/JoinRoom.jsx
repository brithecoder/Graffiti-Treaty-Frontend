/* eslint-disable no-unused-vars */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function JoinRoom({ onBack, onJoin }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col gap-6 w-full"
    >
    <div className="flex flex-col gap-8 animate-in slide-in-from-bottom-10 duration-500 w-full">
      
      {/* Input Group: Tag Name & Wall Code */}
      <div className="flex flex-col gap-6">
        
        {/* ARTIST ALIAS INPUT */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="ARTIST ALIAS"
            className="w-full bg-transparent border-b-2 border-treaty-neon/30 p-4 text-2xl font-bold text-center text-white focus:outline-none focus:border-treaty-neon transition-all uppercase placeholder:text-gray-800"
          />
          <p className="text-center text-[10px] text-treaty-neon mt-2 font-mono tracking-widest uppercase">Your Street Name</p>
        </div>

        {/* WALL CODE INPUT */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="0000"
            maxLength={4}
            className="w-full bg-transparent border-b-2 border-treaty-accent p-4 text-4xl font-black text-center text-white focus:outline-none focus:border-white transition-all tracking-[0.5em] uppercase placeholder:text-gray-800"
          />
          <p className="text-center text-[10px] text-treaty-accent mt-2 font-mono tracking-widest uppercase">4-Digit Treaty ID</p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={onJoin}
          className="w-full bg-treaty-accent text-white font-black py-4 rounded-sm hover:shadow-[0_0_20px_rgba(255,0,127,0.4)] transition-all uppercase italic text-xl active:scale-95"
        >
          Establish Connection
        </button>
        
        <button 
          onClick={onBack}
          className="w-full text-gray-500 font-bold py-2 hover:text-white transition-colors uppercase text-xs tracking-[0.3em]"
        >
          ← Abort Mission
        </button>
      </div>
    </div>
    </motion.div>
  );
}