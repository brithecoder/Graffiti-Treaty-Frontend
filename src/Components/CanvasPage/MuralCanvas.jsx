import React, { useCallback, useRef, useState } from "react";
import { useMuralEngine } from "../../CustomHooks/useMuralEngine";
import colors from "../../constants/colors"; 
import SessionHUD from "./SessionHUD";
import Toolbelt from "./Toolbelt";

export default function MuralCanvas({ 
  muralName, 
  crewCount, 
  artistName, 
  wallCode, 
  isStarted, 
  onExit 
}) {
  const renderRef = useRef(null);
  const [activeColor, setActiveColor] = useState(colors[0].hex);
  const [brushSize, setBrushSize] = useState(15);
  const [isEraser, setIsEraser] = useState(false);
  const [capType, setCapType] = useState("standard");
  const [bgType, setBgType] = useState("none");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const rattleSound = useRef(new Audio("/sounds/sprayCanShake.wav"));

  const handleRattle = useCallback(() => {
    if (rattleSound.current) {
      rattleSound.current.currentTime = 0;
      rattleSound.current.play().catch(e => console.log("Audio play blocked:", e));
    }
  }, []);

  const { clearCanvas } = useMuralEngine({
    renderRef,
    artistName,
    wallCode,
    activeColor,
    brushSize,
    isEraser,
    capType,
    bgType,
    setMousePos
  });

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col z-50 overflow-hidden">
      
      {/* HUD: Top Bar */}
      <div className="relative z-[110]"> 
        <SessionHUD 
          muralName={muralName} 
          wallCode={wallCode} 
          artistName={artistName}
          crewCount={crewCount}
          onClear={isStarted ? clearCanvas : null}
          onExit={onExit}
        />
      </div>

      {/* THE WALL (Canvas Area) */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 pt-24 pb-12">
        <div className={`relative w-full max-w-5xl aspect-video md:h-[65vh] border-2 border-white/5 bg-[#0a0a0a] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transition-opacity duration-500
          ${!isStarted ? 'pointer-events-none opacity-40' : 'pointer-events-auto opacity-100'}`}>
          
          <div ref={renderRef} className="w-full h-full cursor-crosshair" />
          
          {isStarted && (
            <div
              style={{
                position: "absolute",
                top: mousePos.y,
                left: mousePos.x,
                width: "500px",
                height: "500px",
                background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                mixBlendMode: "screen",
                zIndex: 10,
              }}
            />
          )}
        </div>

        {/* Instructions underneath the canvas */}
        <p className="mt-6 pb-24 text-white-600 font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse">
          Click and Drag to Tag
        </p>
      </div>
        
      {/* TOOLBELT: Control Panel */}
      <div className={!isStarted ? "opacity-20 pointer-events-none" : "opacity-100"}>
        <Toolbelt 
          colors={colors}
          activeColor={activeColor} 
          setActiveColor={setActiveColor}
          brushSize={brushSize} 
          setBrushSize={setBrushSize}
          capType={capType} 
          setCapType={setCapType}
          isEraser={isEraser} 
          setIsEraser={setIsEraser}
          bgType={bgType} 
          setBgType={setBgType}
          onRattle={handleRattle}
        />
      </div>
    </div>
  );
}