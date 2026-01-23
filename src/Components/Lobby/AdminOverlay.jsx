export default function AdminOverlay({ wallCode, isAdmin, onStart }) {
  if (isAdmin) {
    return (
      <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-center p-10 border-2 border-green-400 bg-zinc-900 shadow-[0_0_50px_rgba(50,255,50,0.2)]">
          <h2 className="text-white text-3xl font-black uppercase italic mb-2">Ready for the Treaty?</h2>
          <p className="text-zinc-500 font-mono mb-8 uppercase tracking-widest">
            Invite Taggers... Code: <span className="text-white font-bold">{wallCode}</span>
          </p>
          <button 
            onClick={onStart}
            className="bg-green-400 text-black font-black py-4 px-12 text-2xl uppercase hover:bg-white transition-all active:scale-95"
          >
            Start Wall Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[65] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <p className="text-white font-mono animate-pulse tracking-[0.5em] uppercase">
        Waiting for Host to Deploy
      </p>
    </div>
  );
}