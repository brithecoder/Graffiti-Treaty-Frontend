import React, { useEffect, useRef, useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import p5 from "p5";

const colors = [
  { name: "Neon Green", hex: "#39ff14" },
  { name: "Treaty Pink", hex: "#ff007f" },
  { name: "Sky Blue", hex: "#00f0ff" },
  { name: "Electric Purple", hex: "#bc13fe" },
  { name: "White Paint", hex: "#ffffff" },
];

export default function MuralCanvas({ artistName, wallCode }) {
  const renderRef = useRef(null);
  const p5Instance = useRef(null);
  const [activeColor, setActiveColor] = useState(colors[0].hex);
  const [brushSize, setBrushSize] = useState(15); // Default size
  const [isEraser, setIsEraser] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [capType, setCapType] = useState("standard"); // 'skinny', 'standard', or 'fat'
  // 1. Setup the Ref to track the color without re-running the effect
  const colorRef = useRef(activeColor);

  //  Add a Ref for the brush size (just like we did for color)
  const sizeRef = useRef(brushSize);

  // We use a ref so the p5 loop can see the "Clear" command immediately
  const clearFlag = useRef(false);

  //  Create the Ref near your other refs
  const eraserRef = useRef(false);

  const capRef = useRef("standard");
  // Pre-load the sounds so there's no delay when clicking
  const spraySound = new Audio("/sounds/paintingSound.wav");
  spraySound.loop = true;

  const rattleSound = new Audio("/sounds/sprayCanShake.wav");

  useEffect(() => {
    colorRef.current = activeColor;
    eraserRef.current = isEraser;
    sizeRef.current = brushSize;
    capRef.current = capType;
  }, [activeColor, isEraser, brushSize, capType]);

  // 3. The Main p5 Effect
  useEffect(() => {
    let drips = []; // Array to store active drips
    const sketch = (p) => {
      p.setup = () => {
        const container = renderRef.current;
        if (!container) return;
        p.createCanvas(container.offsetWidth, container.offsetHeight).parent(
          container,
        );
        p.background(10, 10, 10);
      };

      p.windowResized = () => {
        const container = renderRef.current;
        if (container) {
          p.resizeCanvas(container.offsetWidth, container.offsetHeight);
          p.background(10, 10, 10); // Note: This clears the wall!
        }
      };
      p.draw = () => {
        const currentColor = colorRef.current;
        const currentSize = sizeRef.current;
        const isErasing = eraserRef.current;

        if (clearFlag.current) {
          p.background(10, 10, 10);
          drips = [];
          clearFlag.current = false;
        }

        if (p.mouseIsPressed) {
          // 1. Play sound once when pressing
          if (spraySound.paused) spraySound.play();

          p.noStroke();

          // 2. Line Smoother Math
          const distance = p.dist(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
          const steps = p.max(1, p.floor(distance / 5));

          // 3. CAP CONFIG (Moved outside the loop for performance)
          const currentCap = capRef.current;
          let particleCount = 20,
            spread = currentSize,
            pMin = 1,
            pMax = 3,
            dripChance = 0.04;

          if (currentCap === "skinny") {
            particleCount = 35;
            spread = currentSize * 0.4;
            pMin = 0.5;
            pMax = 1.5;
            dripChance = 0.01;
          } else if (currentCap === "fat") {
            particleCount = 12;
            spread = currentSize * 2.2;
            pMin = 2;
            pMax = 5;
            dripChance = 0.08;
          }

          // 4. THE DRAWING LOOP (Smoothing)
          for (let s = 0; s < steps; s++) {
            const lerpX = p.lerp(p.pmouseX, p.mouseX, s / steps);
            const lerpY = p.lerp(p.pmouseY, p.mouseY, s / steps);

            if (isErasing) {
              p.fill(10, 10, 10);
              p.ellipse(lerpX, lerpY, currentSize * 1.5);
            } else {
              p.fill(currentColor);
              for (let i = 0; i < particleCount; i++) {
                let offsetX = p.randomGaussian(0, spread);
                let offsetY = p.randomGaussian(0, spread);
                p.ellipse(
                  lerpX + offsetX,
                  lerpY + offsetY,
                  p.random(pMin, pMax),
                );
              }
            }
          }

          // 5. DRIP LOGIC (Only one check per frame, not per step!)
          if (!isErasing && p.random(1) < dripChance) {
            drips.push({
              x: p.mouseX + p.random(-spread / 2, spread / 2),
              y: p.mouseY + spread / 2,
              velocity: p.random(1.0, 2.0),
              size: p.random(1, 2),
              color: currentColor,
              life: p.random(40, 100),
            });
          }
        } else {
          // Stop sound when not pressing
          spraySound.pause();
          spraySound.currentTime = 0;
        }

        // --- DRIP ANIMATION ENGINE ---
        for (let i = drips.length - 1; i >= 0; i--) {
          let d = drips[i];
          p.noStroke();
          p.fill(d.color);
          p.ellipse(d.x, d.y, d.size, d.size);
          d.y += d.velocity;
          d.velocity *= 0.99;
          d.life--;
          if (d.life <= 0) drips.splice(i, 1);
        }

        // --- MOUSE TRACKING ---
        p.mouseMoved = () => setMousePos({ x: p.mouseX, y: p.mouseY });
        p.mouseDragged = () => setMousePos({ x: p.mouseX, y: p.mouseY });
      }; // End p.draw
    }; // End sketch
    p5Instance.current = new p5(sketch);
    return () => p5Instance.current && p5Instance.current.remove();
  }, []); // Empty dependency array keeps the canvas persistent

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-[#050505] flex flex-col z-50 overflow-hidden"
    >
      {/* HUD: Top Bar */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
        /* Added w-full and removed the inner duplicate div */
        className="fixed top-0 left-0 w-full p-8 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent z-20"
      >
        {/* Left Side: Wall Info */}
        <div>
          <h2 className="text-white font-black tracking-tighter text-2xl">
            WALL ID:{" "}
            <span className="text-treaty-accent uppercase">{wallCode}</span>
          </h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em] mt-1">
            Artist: {artistName || "Anonymous"} // Zone 14
          </p>
        </div>

        {/* Right Side: Clear and Exit Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              clearFlag.current = true;
            }}
            className="px-4 py-2 border border-red-500/20 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 text-xs uppercase font-bold transition-all"
          >
            Clear Wall
          </button>
          <button
            onClick={() => window.location.reload()} // Or your onExit prop
            className="px-6 py-2 border border-white/10 text-gray-500 hover:text-white hover:border-treaty-accent hover:bg-treaty-accent/10 text-xs uppercase font-bold transition-all tracking-widest"
          >
            Exit Treaty
          </button>
        </div>
      </motion.div>
      {/* THE WALL (Canvas Area) */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 pt-24 pb-12">
        {/* The Painting Zone */}
        <div className="relative w-full max-w-5xl aspect-video md:h-[65vh] border-2 border-white/5 bg-[#0a0a0a] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Label Overlay */}
          <div className="absolute top-4 left-4 text-[10px] text-white/20 font-mono uppercase tracking-[0.2em] pointer-events-none z-10">
            Section 14/30 — Secured
          </div>

          {/* p5.js Canvas Container */}
          <div ref={renderRef} className="w-full h-full cursor-crosshair" />
          <div
            style={{
              position: "absolute",
              top: mousePos.y,
              left: mousePos.x,
              width: "500px", // Adjust for a wider or tighter beam
              height: "500px",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none", // Allows clicking "through" to the canvas
              mixBlendMode: "screen", // Makes colors underneath appear to glow
              zIndex: 10, // Ensures it stays on top
            }}
          />
        </div>

        {/* Instructions underneath the canvas */}
        <p className="mt-6 text-white-600 font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse">
          Click and Drag to Tag
        </p>
      </div>

      {/* TOOLBELT */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }} // Slightly longer delay than the top bar
        className="bottom-0 left-0 w-full pb-8 pt-2 flex justify-center z-20"
      >
        <div
          className="
          pointer-events-auto
          bg-black/80 backdrop-blur-xl border border-white/10 
          p-4 rounded-3xl md:rounded-full 
         flex flex-wrap md:flex-nowrap items-center justify-center
         gap-4 md:gap-5 shadow-2xl 
          max-width-[95%] mx-auto
         "
        >
          {/* BRUSH SIZE SLIDER */}
          <div className="flex items-center gap-3 px-4 border-r border-white/10">
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
              Size
            </span>
            <input
              type="range"
              min="5"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-24 accent-treaty-neon cursor-pointer"
            />
          </div>

          {/* COLORS */}
          <div className="flex gap-4">
            {colors.map((color) => (
              <button
                key={color.hex}
                onClick={() => {
                  setActiveColor(color.hex);
                  setIsEraser(false);

                  rattleSound.currentTime = 0; // Reset to start so you can click fast
                  rattleSound.play();
                }}
                className={`w-10 h-10 rounded-full transition-all duration-300 ${
                  activeColor === color.hex
                    ? "scale-125 ring-2 ring-white ring-offset-4 ring-offset-black"
                    : "scale-100 opacity-50 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: color.hex,
                  boxShadow:
                    activeColor === color.hex
                      ? `0 0 20px ${color.hex}`
                      : "none",
                }}
              />
            ))}
          </div>
          {/* --- CAP SELECTOR (Insert between Colors and Eraser) --- */}
          <div className="flex flex-col items-center gap-1 mx-4 px-4 border-l border-r border-gray-700">
            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">
              Cap Type
            </span>
            <div className="flex bg-black p-1 rounded-lg border border-gray-800">
              {["skinny", "standard", "fat"].map((type) => (
                <button
                  key={type}
                  onClick={() => setCapType(type)}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    capType === type
                      ? "bg-white text-black font-bold"
                      : "text-gray-400 hover:text-white hover:bg-gray-900"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* ERASER */}
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-tighter transition-all ${
              isEraser ? "bg-white text-black" : "bg-white/5 text-white"
            }`}
          >
            {isEraser ? "Eraser ON" : "Eraser"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
