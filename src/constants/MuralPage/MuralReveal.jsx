import React, { useEffect, useRef, useState } from "react";
import p5 from "p5";

export default function MuralReveal({ wallCode, onExit, artistName }) {
  const revealRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [activeArtist, setActiveArtist] = useState("");

  useEffect(() => {
    const sketch = (p) => {
      let pg;
      let strokes = [];
      let currentIndex = 0;

      p.setup = async () => {
        const container = revealRef.current;
        if (!container) return;

        const w = container.offsetWidth;
        const h = w * (9 / 16);
        p.createCanvas(w, h).parent(container);

        // Graphics buffer for persistent drawing
        pg = p.createGraphics(p.width, p.height);
        pg.clear();

        try {
          const res = await fetch(`http://localhost:3000/api/mural/strokes/${wallCode}`);
          const data = await res.json();
          // Sort chronologically
          strokes = data.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        } catch (err) {
          console.error("Fetch error:", err);
        }
        setLoading(false);
      };

      p.draw = () => {
        p.background(10); // Main canvas background

        // Replay: Process one stroke every 5 frames
        if (p.frameCount % 5 === 0 && currentIndex < strokes.length) {
          const s = strokes[currentIndex];
          if (s.artistName) setActiveArtist(s.artistName);

          if (s.points && s.points.length >= 2) {
            drawSprayStroke(p, pg, s);
          }
          currentIndex++;
        } else if (strokes.length > 0 && currentIndex >= strokes.length) {
          setIsFinished(true);
        }

        // Render the accumulated buffer to the screen
        p.image(pg, 0, 0);
      };

      // --- THE REUSED SPRAY ENGINE LOGIC ---
      const drawSprayStroke = (p, targetPg, stroke) => {
        const color = stroke.color || "#FFFFFF";
        const brushSize = stroke.brushSize || 20;
        const cap = stroke.cap || "standard";
        const isErasing = color === "#000000" || color === "eraser";

        // Match your particle settings
        let particleCount = 20, spread = brushSize, pMin = 1, pMax = 3;
        if (cap === "skinny") {
          particleCount = 35; spread = brushSize * 0.4; pMin = 0.5; pMax = 1.5;
        } else if (cap === "fat") {
          particleCount = 12; spread = brushSize * 2.2; pMin = 2; pMax = 5;
        }

        targetPg.push();
        if (isErasing) targetPg.erase(); else targetPg.noErase();
        targetPg.noStroke();
        targetPg.fill(color);

        // Iterate through saved points
        for (let i = 1; i < stroke.points.length; i++) {
          const prev = stroke.points[i - 1];
          const curr = stroke.points[i];

          // Map percentages to current canvas pixels
          const x1 = prev.x * p.width;
          const y1 = prev.y * p.height;
          const x2 = curr.x * p.width;
          const y2 = curr.y * p.height;

          // Fill gaps between points (Lerp)
          const d = p.dist(x1, y1, x2, y2);
          const steps = p.max(1, p.floor(d / 5));

          for (let s = 0; s < steps; s++) {
            const lerpX = p.lerp(x1, x2, s / steps);
            const lerpY = p.lerp(y1, y2, s / steps);

            if (isErasing) {
              targetPg.ellipse(lerpX, lerpY, brushSize * 2);
            } else {
              // The "Spray" effect
              for (let j = 0; j < particleCount; j++) {
                targetPg.ellipse(
                  lerpX + p.randomGaussian(0, spread),
                  lerpY + p.randomGaussian(0, spread),
                  p.random(pMin, pMax)
                );
              }
            }
          }
        }
        targetPg.noErase();
        targetPg.pop();
      };
    };

    const myP5 = new p5(sketch);
    return () => myP5.remove();
  }, [wallCode]);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[200] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6">
        <h2 className="text-yellow-400 italic font-black text-5xl mb-2 tracking-tighter uppercase">
          The Mural Reveal
        </h2>
        
        <div className="h-8 mb-2">
          {activeArtist && (
            <p className="text-white font-mono text-sm uppercase tracking-[0.3em] animate-pulse">
              Current Tag: <span className="text-yellow-400 font-black">{activeArtist}</span>
            </p>
          )}
        </div>

        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">
          Wall: <span className="text-white">{wallCode}</span> • Viewing as: {artistName}
        </p>
      </div>

      <div className="relative w-full max-w-5xl aspect-video bg-black rounded-lg border-4 border-white/10 shadow-2xl overflow-hidden">
        <div ref={revealRef} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <button
        onClick={onExit}
        className={`mt-8 px-10 py-4 bg-white text-black font-black uppercase italic transition-all duration-700 hover:bg-yellow-400 ${
          isFinished ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        Finish Session
      </button>
    </div>
  );
}