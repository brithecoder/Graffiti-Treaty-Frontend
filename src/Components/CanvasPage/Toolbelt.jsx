import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

export default function Toolbelt({ 
  colors, activeColor, setActiveColor, 
  brushSize, setBrushSize, 
  capType, setCapType, 
  isEraser, setIsEraser,
  bgType, setBgType,
  onRattle 
}) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
      className="fixed bottom-0 left-0 w-full pb-8 pt-2 flex justify-center z-20"
    >
      <div className="pointer-events-auto bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-3xl md:rounded-full flex flex-wrap md:flex-nowrap items-center justify-center gap-4 md:gap-5 shadow-2xl max-width-[95%] mx-auto">
        
        {/* SURFACE SELECTOR */}
        <div className="flex items-center gap-3 pr-4 border-r border-white/10">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase text-gray-500 font-bold mb-1">Surface</span>
            <div className="flex gap-2">
              <button
                onClick={() => setBgType("none")}
                className={`w-8 h-8 rounded-full border-2 ${bgType === "none" ? "border-white" : "border-transparent opacity-50"} bg-gray-900`}
                title="Studio Black"
              />
              {["brick", "stone", "concrete"].map((surface) => (
                <button
                  key={surface}
                  onClick={() => setBgType(surface)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${bgType === surface ? "border-white scale-110" : "border-transparent opacity-50"}`}
                  style={{
                    backgroundImage: `url(/backgrounds/${surface === "brick" ? "redBrick1k.jpg" : surface === "stone" ? "greyBrick.png" : "concrete.jpg"})`,
                    backgroundSize: "cover",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* BRUSH SIZE */}
        <div className="flex items-center gap-3 px-4 border-r border-white/10">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Size</span>
          <input
            type="range" min="5" max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 accent-white cursor-pointer"
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
                onRattle(); // 🟢 Correctly calls the prop from parent
              }}
              className={`w-10 h-10 rounded-full transition-all duration-300 ${
                activeColor === color.hex
                  ? "scale-125 ring-2 ring-white ring-offset-4 ring-offset-black"
                  : "scale-100 opacity-50 hover:opacity-100"
              }`}
              style={{ backgroundColor: color.hex, boxShadow: activeColor === color.hex ? `0 0 20px ${color.hex}` : "none" }}
            />
          ))}
        </div>

        {/* CAP SELECTOR */}
        <div className="flex flex-col items-center gap-1 mx-4 px-4 border-l border-r border-gray-700">
          <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Cap Type</span>
          <div className="flex bg-black p-1 rounded-lg border border-gray-800">
            {["skinny", "standard", "fat"].map((type) => (
              <button
                key={type}
                onClick={() => setCapType(type)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${capType === type ? "bg-white text-black font-bold" : "text-gray-400 hover:text-white hover:bg-gray-900"}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ERASER */}
        <button
          onClick={() => setIsEraser(!isEraser)}
          className={`px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-tighter transition-all ${isEraser ? "bg-white text-black" : "bg-white/5 text-white"}`}
        >
          {isEraser ? "Eraser ON" : "Eraser"}
        </button>
      </div>
    </motion.div>
  );
}