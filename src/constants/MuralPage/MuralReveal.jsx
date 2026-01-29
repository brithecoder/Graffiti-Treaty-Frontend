import React, { useEffect, useRef, useState } from 'react';
import p5 from 'p5';

export default function MuralReveal({ wallCode, onExit, artistName }) {
  const revealRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [currentArtist, setCurrentArtist] = useState(""); // Track who is drawing right now

  useEffect(() => {
    const sketch = (p) => {
      let pg;
      let strokes = [];
      let currentIndex = 0;

      p.setup = async () => {
        const container = revealRef.current;
        if (!container) return;
        
        p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);
        pg = p.createGraphics(p.width, p.height);
        pg.clear();
        
        try {
          const res = await fetch(`http://localhost:3000/api/mural/strokes/${wallCode}`);
          const data = await res.json();
          // Sort chronologically just in case
          strokes = data.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        } catch (err) {
          console.error("Fetch error:", err);
        } finally {
          setLoading(false);
        }
      };

      p.draw = () => {
        p.background(10);
        
        // Replay speed: 3 strokes per frame for that "Time-lapse" feel
        for (let i = 0; i < 3; i++) {
          if (strokes.length > 0 && currentIndex < strokes.length) {
            const s = strokes[currentIndex];
            // Update the UI with the name of the person who drew this stroke
            if (s.artistName) setCurrentArtist(s.artistName);
            
            drawStroke(s);
            currentIndex++;
          } else if (strokes.length > 0 && currentIndex >= strokes.length) {
            setIsFinished(true); 
          }
        }
        p.image(pg, 0, 0);
      };

     const drawStroke = (stroke) => {
        if (!stroke.points || stroke.points.length < 2) return;
        pg.push();
        
        if (stroke.color === "#000000" || stroke.color === "eraser") {
            pg.erase();
        } else {
            pg.noErase();
            pg.fill(stroke.color || "#FFFFFF");
        }

        const particleCount = stroke.capType === "fat" ? 15 : 30;
        const spread = stroke.capType === "fat" ? (stroke.brushSize || 15) * 1.5 : (stroke.brushSize || 15) * 0.5;

        for (let i = 1; i < stroke.points.length; i++) {
          const p1 = stroke.points[i - 1];
          const p2 = stroke.points[i];
          
          // --- AUTO-DETECT MATH ---
          // If p1.x is less than 1, we treat it as percentage (pct * width)
          // If p1.x is greater than 1, it's old pixel data—we map it from a 1200px base
          const x1 = p1.x <= 1 ? p1.x * p.width : p.map(p1.x, 0, 1200, 0, p.width);
          const y1 = p1.y <= 1 ? p1.y * p.height : p.map(p1.y, 0, 675, 0, p.height);
          const x2 = p2.x <= 1 ? p2.x * p.width : p.map(p2.x, 0, 1200, 0, p.width);
          const y2 = p2.y <= 1 ? p2.y * p.height : p.map(p2.y, 0, 675, 0, p.height);

          const dist = p.dist(x1, y1, x2, y2);
          const steps = p.max(1, p.floor(dist / 2));

          for (let s = 0; s < steps; s++) {
            const lerpX = p.lerp(x1, x2, s / steps);
            const lerpY = p.lerp(y1, y2, s / steps);
            
            pg.noStroke();
            for (let j = 0; j < particleCount; j++) {
              const offX = p.randomGaussian(0, spread);
              const offY = p.randomGaussian(0, spread);
              pg.ellipse(lerpX + offX, lerpY + offY, p.random(1, 3));
            }
          }
        }
        pg.noErase();
        pg.pop();
      };
    }
    const myP5 = new p5(sketch);
    return () => myP5.remove();
  }, [wallCode]);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[200] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <h2 className="text-yellow-400 italic font-black text-6xl mb-2 tracking-tighter">
          THE REVEAL
        </h2>
        
        {/* Dynamic Tagger Name */}
        <div className="h-6">
            <p className="text-zinc-400 font-mono text-xs uppercase tracking-[0.3em]">
                {currentArtist ? (
                    <>Currently Tagging: <span className="text-white font-bold">{artistName}</span></>
                ) : (
                    <>Wall: <span className="text-white">{wallCode}</span></>
                )}
            </p>
        </div>
      </div>

      <div className="relative w-full max-w-5xl aspect-video group">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        <div 
          ref={revealRef} 
          className="w-full h-full border-8 border-white/5 shadow-2xl bg-black rounded-sm" 
        />
      </div>

      <button 
        onClick={onExit} 
        className={`mt-10 px-12 py-4 bg-yellow-400 text-black font-black uppercase italic transition-all duration-700 hover:scale-110 active:scale-95 ${
          isFinished ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        Close Gallery
      </button>
    </div>
  );
}