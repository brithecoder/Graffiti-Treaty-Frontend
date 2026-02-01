import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import p5 from 'p5';

export default function MuralReveal({ artistName }) {
  const revealRef = useRef(null);
  const p5Instance = useRef(null);
  const pgRef = useRef(null); // Ref for the graphics buffer
  const currentIndexRef = useRef(0); // Ref for the animation progress
  const strokesRef = useRef([]); // Ref for the data

  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [currentArtist, setCurrentArtist] = useState("");

const { wallCode } = useParams();


  useEffect(() => {
    const sketch = (p) => {
      p5Instance.current = p;

      p.setup = async () => {
        currentIndexRef.current = 0;
        const container = revealRef.current;
        if (!container) return;

        container.innerHTML = '';
        p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);
        
        // Create the graphics buffer and store in Ref
        pgRef.current = p.createGraphics(p.width, p.height);
        pgRef.current.clear();
        
        try {
          const res = await fetch(`http://localhost:3000/api/mural/strokes/${wallCode}`);
          const data = await res.json();
          // Sort chronologically
          strokesRef.current = data.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        } catch (err) {
          console.error("Fetch error:", err);
        } finally {
          setLoading(false);
        }
      };

      p.draw = () => {
        p.background(10);
        
        const strokes = strokesRef.current;
        
        if (strokes.length === 0 && !loading) {
     p.fill(255);
     p.text("No strokes found for this wall.", 20, 20);
  }

        // Replay speed loop
        
          if (strokes.length > 0 && currentIndexRef.current < strokes.length) {
            const s = strokes[currentIndexRef.current];
            
            if (s.artistName) setCurrentArtist(s.artistName);
            
            drawStroke(s);
            currentIndexRef.current++;
          } else if (strokes.length > 0 && currentIndexRef.current >= strokes.length) {
          setIsFinished((prev) => {
        if (!prev) return true;
        return prev;
    });
    p.noLoop();
        }
        if (pgRef.current) {
          p.image(pgRef.current, 0, 0);
        }
      };
const drawStroke = (stroke) => {
  const pg = pgRef.current;
  if (!pg || !stroke.points || stroke.points.length === 0) return;

  // --- HELPER FUNCTIONS ---
  // This ensures points recorded as 0.5 (percent) or 600 (pixels) both land in the right spot
  const getX = (val) => (val <= 1 ? val * p.width : p.map(val, 0, 1200, 0, p.width));
  const getY = (val) => (val <= 1 ? val * p.height : p.map(val, 0, 675, 0, p.height));

  pg.push();
  pg.noStroke();

  if (stroke.color === "#000000" || stroke.color === "eraser") {
    pg.erase();
  } else {
    pg.noErase();
    pg.fill(stroke.color || "#FFFFFF");
  }

  const brushSize = stroke.brushSize || 15;
  const isFat = stroke.capType === "fat";
  const particleCount = isFat ? 15 : 30;
  const spread = isFat ? brushSize * 2.2 : brushSize * 0.8;

  for (let i = 0; i < stroke.points.length; i++) {
    const p1 = stroke.points[i];
    const nextPt = stroke.points[i + 1];

    // Apply the helpers here
    const x1 = getX(p1.x);
    const y1 = getY(p1.y);

    if (!nextPt) {
      // Single point splat (for dots/clicks)
      for (let j = 0; j < particleCount; j++) {
        const angle = p.random(p.TWO_PI);
        const r = p.random(spread);
        pg.ellipse(x1 + p.cos(angle) * r, y1 + p.sin(angle) * r, p.random(1, 2.5));
      }
      break;
    }

    const x2 = getX(nextPt.x);
    const y2 = getY(nextPt.y);

    const dist = p.dist(x1, y1, x2, y2);
    
    // THE SCRATCH FIX: If the distance is too large (like a teleport), 
    // don't draw a line, just skip to the next point.
    if (dist > 100) continue; 

    let steps = p.max(1, p.floor(dist / 4));
    if (steps > 500) steps = 500;

    for (let s = 0; s < steps; s++) {
      const lerpX = p.lerp(x1, x2, s / steps);
      const lerpY = p.lerp(y1, y2, s / steps);
      for (let j = 0; j < particleCount; j++) {
        const angle = p.random(p.TWO_PI);
        const r = p.random(spread);
        pg.ellipse(lerpX + p.cos(angle) * r, lerpY + p.sin(angle) * r, p.random(1, 2.5));
      }
    }
  }
  pg.noErase();
  pg.pop();
};
    };
    const myP5 = new p5(sketch);
    return () => myP5.remove();
  }, [wallCode]);

  // --- BUTTON HANDLERS ---
  const handleDownload = () => {
    if (p5Instance.current && isFinished) {
      p5Instance.current.saveCanvas(`mural-${wallCode}`, 'png');
    }
  };
const handleReplay = () => {
  // 1. Reset the progress index
  currentIndexRef.current = 0;
  
  // 2. Clear the canvas buffer completely
  if (pgRef.current) {
    pgRef.current.clear();
    // Re-draw the background if you aren't doing it in p.draw
    pgRef.current.background(10); 
  }

  // 3. Reset React state so buttons hide while replaying
  setIsFinished(false);

  // 4. THE FIX: Explicitly restart the p5 engine
  if (p5Instance.current) {
    p5Instance.current.loop(); 
  }
};

const handleFinalExit = () => {
  // 1. Clean up local storage so the next user starts fresh
  localStorage.removeItem("mural_session");
  localStorage.removeItem(`mural_save_${wallCode}`);

  // 2. The "Nuke" option: This kills the p5 instance, sockets, 
  // and React state instantly and takes them back to the splash page.
  window.location.href = "/"; 
};
  

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[200] flex flex-col items-center justify-center p-4">
      {/* HEADER SECTION */}
      <div className="text-center mb-6">
        <h2 className="text-treaty-neon italic font-black text-6xl mb-2 tracking-tighter">THE REVEAL</h2>
        <div className="h-6">
          <p className="text-zinc-400 font-mono text-xs uppercase tracking-[0.3em]">
            {currentArtist ? (
              <>
                <span>Currently Tagging: <span className="text-white font-bold">{currentArtist || artistName}</span></span>
                <span className="text-zinc-600 mx-3">|</span>
                <span>Wall: <span className="text-yellow-400/80">{wallCode}</span></span>
              </>
            ) : (
              <>Wall: <span className="text-white">{wallCode}</span></>
            )}
          </p>
        </div>
      </div>
 
      {/* CANVAS CONTAINER */}
       <div className="relative w-full max-w-5xl aspect-video">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={revealRef} className="w-full h-full border-8 border-white/5 shadow-2xl bg-black" />
      </div> 
      {/* ACTION BUTTONS */}
      {isFinished && (
        <div className="mt-8 flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button onClick={handleReplay} className="px-6 py-3 bg-[#ff007f] text-white font-bold uppercase tracking-tighter hover:bg-zinc-700 transition-all flex items-center gap-2">
            ↺ Replay
          </button>
          <button onClick={handleDownload} className="px-8 py-3 bg-treaty-neon text-black font-black uppercase italic hover:scale-105 transition-all shadow-lg">
            Download Piece
          </button>
          <button onClick={handleFinalExit} className="px-6 py-3 bg-white text-black font-bold uppercase tracking-tighter hover:bg-red-500 hover:text-white transition-all">
           Finish Mission
          </button>
        </div>
      )}
    </div>
  );
}