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
  const [bgType, setBgType] = useState("none");
  
  const colorRef = useRef(activeColor);
  const sizeRef = useRef(brushSize);
  const clearFlag = useRef(false);
  const eraserRef = useRef(false);
  const capRef = useRef("standard");
  const spraySound = new Audio("/sounds/paintingSound.wav");
  spraySound.loop = true;
  const rattleSound = new Audio("/sounds/sprayCanShake.wav");

  const bgRef = useRef("none");

  useEffect(() => {
    colorRef.current = activeColor;
    eraserRef.current = isEraser;
    sizeRef.current = brushSize;
    capRef.current = capType;
    bgRef.current = bgType;
  }, [activeColor, isEraser, brushSize, capType, bgType]);

  // --- 3. THE MAIN P5.JS DRAWING ENGINE ---
  useEffect(() => {
    let drips = [];    // Stores position and life of active paint drips
    let textures = {}; // Stores the Brick, Stone, and Concrete image files
    let pg;            // The "Paint Layer" (an off-screen buffer that keeps paint separate from the wall)

    const sketch = (p) => {
      
      // [INITIAL SETUP]: Runs once when the canvas is created
      p.setup = async () => {
        const container = renderRef.current;
        if (!container) return;
        p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);
        
        // CREATE PAINT BUFFER: This prevents the wall texture from erasing the paint
        pg = p.createGraphics(p.width, p.height);
        pg.clear(); // Starts fully transparent

        // ASSET LOADING: Fetching the wall textures from your public folder
        try {
          textures.brick = await p.loadImage('/backgrounds/redBrick1k.jpg');
          textures.stone = await p.loadImage('/backgrounds/greyBrick.png');
          textures.concrete = await p.loadImage('/backgrounds/concrete.jpg');
        } catch (err) {
          console.error("Texture Load Failed:", err);
        }
      };

      // [WALL RENDERER]: Draws the selected texture or black background
      const drawWall = () => {
        const currentBg = bgRef.current;
        if (currentBg !== 'none' && textures[currentBg]) {
          p.image(textures[currentBg], 0, 0, p.width, p.height);
          p.fill(0, 0, 0, 80); // Dark overlay to make neon colors pop
          p.rect(0, 0, p.width, p.height);
        } else {
          p.background(10, 10, 10); // Default Studio Black
        }
      };

      // [RESPONSIVE LOGIC]: Keeps the canvas full-screen on window resize
      p.windowResized = () => {
        const container = renderRef.current;
        if (container) {
          p.resizeCanvas(container.offsetWidth, container.offsetHeight);
          // Transfer old paint to a new buffer size so we don't lose the mural
          let newPg = p.createGraphics(p.width, p.height);
          newPg.image(pg, 0, 0);
          pg = newPg;
          drawWall();
        }
      };

      // [MAIN LOOP]: Runs 60 times per second
      p.draw = () => {
        // STEP 1: Always draw the wall first (the bottom layer)
        drawWall();

        // Sync React State with the p5 Loop
        const currentColor = colorRef.current;
        const currentSize = sizeRef.current;
        const isErasing = eraserRef.current;

        // COMMAND: CLEAR WALL (Triggered by the UI Button)
        if (clearFlag.current) {
          pg.clear();
          drips = [];
          clearFlag.current = false;
        }

        // STEP 2: PAINTING INPUT (Only if mouse is pressed)
        if (p.mouseIsPressed) {
          if (spraySound.paused) spraySound.play();

          // KINK FIX: Reset mouse position if user clicks far away from last spray
          const distance = p.dist(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
          if (distance > 100) {
            p.pmouseX = p.mouseX;
            p.pmouseY = p.mouseY;
          }

          // CAP & SPREAD LOGIC: Adjusts "Skinny" vs "Fat" spray patterns
          const currentCap = capRef.current;
          let particleCount = 20, spread = currentSize, pMin = 1, pMax = 3, dripChance = 0.04;

          if (currentCap === "skinny") {
            particleCount = 35; spread = currentSize * 0.4; pMin = 0.5; pMax = 1.5; dripChance = 0.01;
          } else if (currentCap === "fat") {
            particleCount = 12; spread = currentSize * 2.2; pMin = 2; pMax = 5; dripChance = 0.08;
          }

          // ERASER MODE: "Cuts" through the paint layer to show the wall underneath
          if (isErasing) pg.erase(); else pg.noErase();
          pg.noStroke();

          // SPRAY SIMULATION: Smoothly interpolates dots between mouse frames
          const steps = p.max(1, p.floor(distance / 5));
          for (let s = 0; s < steps; s++) {
            const lerpX = p.lerp(p.pmouseX, p.mouseX, s / steps);
            const lerpY = p.lerp(p.pmouseY, p.mouseY, s / steps);

            if (isErasing) {
              pg.ellipse(lerpX, lerpY, currentSize * 2);
            } else {
              pg.fill(currentColor);
              for (let i = 0; i < particleCount; i++) {
                let offsetX = p.randomGaussian(0, spread);
                let offsetY = p.randomGaussian(0, spread);
                pg.ellipse(lerpX + offsetX, lerpY + offsetY, p.random(pMin, pMax));
              }
            }
          }
          pg.noErase(); // Reset buffer to standard paint mode

          // DRIP GENERATOR: Spawns new drips based on cap type
          if (!isErasing && p.random(1) < dripChance) {
            drips.push({
              x: p.mouseX + p.random(-spread / 2, spread / 2),
              y: p.mouseY,
              velocity: p.random(1.0, 2.0),
              size: p.random(1, 2),
              color: currentColor,
              life: p.random(40, 100),
            });
          }
        } else {
          // Input released: Stop sounds
          spraySound.pause();
          spraySound.currentTime = 0;
        }

        // STEP 3: DRIP PHYSICS: Animates drops sliding down the wall
        for (let i = drips.length - 1; i >= 0; i--) {
          let d = drips[i];
          pg.noStroke();
          pg.fill(d.color);
          pg.ellipse(d.x, d.y, d.size);
          d.y += d.velocity;
          d.velocity *= 0.99; // Air friction
          d.life--;           // Drip "dries" and disappears
          if (d.life <= 0) drips.splice(i, 1);
        }

        // STEP 4: LAYER COMPOSITION: Stamp the paint layer onto the wall
        p.image(pg, 0, 0); 
      };

      // STEP 5: CURSOR TRACKING: Keeps the flashlight/beam following the mouse
      p.mouseMoved = () => setMousePos({ x: p.mouseX, y: p.mouseY });
      p.mouseDragged = () => setMousePos({ x: p.mouseX, y: p.mouseY });
    };

    // React Lifecycle: Initialize and Cleanup the p5 Instance
    p5Instance.current = new p5(sketch);
    return () => p5Instance.current && p5Instance.current.remove();
  }, []);

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
         {/* SURFACE SELECTOR */}
          <div className="flex items-center gap-3 pr-4 border-r border-white/10">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase text-gray-500 font-bold mb-1">Surface</span>
              <div className="flex gap-2">
                <button onClick={() => { setBgType("none")}} className={`w-8 h-8 rounded-full border-2 ${bgType === "none" ? "border-white" : "border-transparent opacity-50"} bg-gray-900`} title="Studio Black" />
                {["brick", "stone", "concrete"].map((surface) => (
                  <button
                    key={surface}
                    onClick={() => { setBgType(surface)}}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${bgType === surface ? "border-white scale-110" : "border-transparent opacity-50"}`}
                    style={{
                      backgroundImage: `url(/backgrounds/${surface === 'brick' ? 'redBrick1k.jpg' : surface === 'stone' ? 'greyBrick.png' : 'concrete.jpg'})`,
                      backgroundSize: "cover",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
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
