import React from 'react'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
export default function InfoModal({ isOpen, onClose }) {
  return (
   <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-zinc-950 border-2 border-[#39ff14] p-8 max-w-lg w-full shadow-[0_0_50px_rgba(57,255,20,0.2)] overflow-hidden"
          >
            {/* Background Texture/Accent */}
            <div className="absolute top-0 right-0 p-2 text-[10px] font-mono text-zinc-800 uppercase tracking-widest pointer-events-none">
              v1.0.4-treaty-protocol
            </div>

            <h3 className="text-4xl font-black italic text-[#39ff14] mb-6 tracking-tighter uppercase leading-none">
              Mission <br/> Parameters
            </h3>

            <div className="space-y-6 font-mono text-xs md:text-sm text-zinc-400">
              <section>
                <h4 className="text-white font-bold mb-1 uppercase tracking-wider">01. The Objective</h4>
                <p>Digital Art collective. Multiple artists occupy one coordinate plane. No rules, just the tag.</p>
              </section>

              <section>
                <h4 className="text-white font-bold mb-1 uppercase tracking-wider">02. Tools of Chaos</h4>
                <p>Use the <span className="text-[#39ff14]">Spray Can</span> for broad coverage or the <span className="text-[#ff007f]">Fat Cap</span> for heavy fill. The eraser is for light corrections...</p>
              </section>

              <section>
                <h4 className="text-white font-bold mb-1 uppercase tracking-wider">03. The Archival</h4>
                <p>Once the mission is complete, 'The Reveal' reconstructs the history of the wall. Download your proof of work before the database wipes.</p>
              </section>
            </div>

            <button 
              onClick={onClose}
              className="mt-10 w-full py-4 bg-[#39ff14] text-black font-black uppercase italic hover:bg-white transition-all transform active:scale-95 shadow-lg"
            >
              Enter the Sector
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
