import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import JoinRoom from './JoinRoom';
import MuralCanvas from './MuralCanvas'; // Make sure you created this file!

export default function FrontPage() {
    const [view, setView] = useState('MENU'); // Views: 'MENU', 'JOIN', 'MURAL'

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-treaty-dark p-6">
            
            {/* Header Section - We only show this if we AREN'T in the Mural */}
            {view !== 'MURAL' && (
                <div className="text-center mb-16">
                    <motion.h1 
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 100, damping: 10, delay: 0.2 }}
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

            {/* Main Content Area */}
            <div className="w-full max-w-md">
                <AnimatePresence mode="wait">
                    
                    {/* 1. SHOW MENU */}
                    {view === 'MENU' && (
                        <motion.div 
                            key="menu-buttons"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col sm:flex-row gap-6 w-full"
                        >
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex-1 bg-transparent border-2 border-treaty-neon text-treaty-neon font-black py-4 px-8 rounded-sm uppercase tracking-tighter text-xl"
                            >
                                Create Wall
                            </motion.button>

                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setView('JOIN')}
                                className="flex-1 bg-white text-black font-black py-4 px-8 rounded-sm uppercase tracking-tighter text-xl"
                            >
                                Join Wall
                            </motion.button>
                        </motion.div>
                    )}

                    {/* 2. SHOW JOIN ROOM */}
                    {view === 'JOIN' && (
                        <motion.div 
                            key="join-room"
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full"
                        >
                            <JoinRoom 
                                onBack={() => setView('MENU')}
                                onJoin={() => setView('MURAL')} 
                            />
                        </motion.div>
                    )}

                    {/* 3. SHOW MURAL CANVAS */}
                    {view === 'MURAL' && (
                        <motion.div 
                            key="mural-canvas"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 z-50" // fixed inset-0 makes it cover the whole screen
                        >
                            <MuralCanvas wallCode="8821" onExit={() => setView('MENU')} />
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* Footer - Only show if not in Mural */}
            {view !== 'MURAL' && (
                <p className="mt-12 text-gray-600 font-mono text-xs uppercase tracking-[0.5em]">
                    Authorized Access Only // Zone 30
                </p>
            )}
        </div>
    )
}