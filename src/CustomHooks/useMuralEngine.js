import { useEffect, useRef } from "react";
import p5 from "p5";
import socket from "../socket";

export function useMuralEngine({
  renderRef,
  artistName,
  wallCode,
  activeColor,
  brushSize,
  isEraser,
  capType,
  bgType,
  setMousePos,
}) {
  const p5Instance = useRef(null);
  const colorRef = useRef(activeColor);
  const sizeRef = useRef(brushSize);
  const eraserRef = useRef(isEraser);
  const capRef = useRef(capType);
  const bgRef = useRef(bgType);
  
  const clearFlag = useRef(false);
  const dripsRef = useRef([]); 
  const spraySound = useRef(new Audio("/sounds/paintingSound.wav"));

  // Sync state to refs
  useEffect(() => {
    colorRef.current = activeColor;
    eraserRef.current = isEraser;
    sizeRef.current = brushSize;
    capRef.current = capType;
    bgRef.current = bgType;
  }, [activeColor, isEraser, brushSize, capType, bgType]);

  useEffect(() => {
    let textures = {};
    let pg;
    // Unique key for this specific wall and artist
    const storageKey = `mural_save_${wallCode}`;

    const sketch = (p) => {
      p.setup = async () => {
        const container = renderRef.current;
        if (!container) return;
        p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);
        
        pg = p.createGraphics(p.width, p.height);
        pg.clear();

        // --- 1. RESTORE FROM LOCAL STORAGE ---
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          p.loadImage(savedData, (img) => {
            pg.image(img, 0, 0);
            console.log(`Restored session for ${artistName}`);
          });
        }

        try {
          textures.brick = await p.loadImage("/backgrounds/redBrick1k.jpg");
          textures.stone = await p.loadImage("/backgrounds/greyBrick.png");
          textures.concrete = await p.loadImage("/backgrounds/concrete.jpg");
        } catch (err) {
          console.error("Texture Load Failed:", err);
        }
      };

      const drawWall = () => {
        const currentBg = bgRef.current;
        if (currentBg !== "none" && textures[currentBg]) {
          p.image(textures[currentBg], 0, 0, p.width, p.height);
          p.fill(0, 0, 0, 80);
          p.rect(0, 0, p.width, p.height);
        } else {
          p.background(10, 10, 10);
        }
      };

      p.draw = () => {
        drawWall();
        if (clearFlag.current) {
          pg.clear();
          dripsRef.current = []; 
          clearFlag.current = false;
          // Clear the save file when the user hits the clear button
        //   localStorage.removeItem(storageKey);
          console.log("Canvas and Local Storage Reset");
        }

        if (p.mouseIsPressed && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          const currentColor = colorRef.current;
          const currentSize = sizeRef.current;
          const isErasing = eraserRef.current;
          const currentCap = capRef.current;

          let particleCount = 20, spread = currentSize, pMin = 1, pMax = 3, dripChance = 0.04;

          if (currentCap === "skinny") {
            particleCount = 35; spread = currentSize * 0.4; pMin = 0.5; pMax = 1.5; dripChance = 0.01;
          } else if (currentCap === "fat") {
            particleCount = 12; spread = currentSize * 2.2; pMin = 2; pMax = 5; dripChance = 0.08;
          }

          if (isErasing) pg.erase(); else pg.noErase();
          pg.noStroke();

          const distance = p.dist(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
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
          pg.noErase();

          if (!isErasing && p.random(1) < dripChance) {
            dripsRef.current.push({
              x: p.mouseX + p.random(-spread / 2, spread / 2),
              y: p.mouseY,
              velocity: p.random(1.0, 2.0),
              size: p.random(1, 2),
              color: currentColor,
              life: p.random(40, 100),
            });
          }
        }

        for (let i = dripsRef.current.length - 1; i >= 0; i--) {
          let d = dripsRef.current[i];
          pg.noStroke();
          pg.fill(d.color);
          pg.ellipse(d.x, d.y, d.size);
          d.y += d.velocity;
          d.velocity *= 0.99;
          d.life--;
          if (d.life <= 0) dripsRef.current.splice(i, 1);
        }

        p.image(pg, 0, 0);
      };

      p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            p.pmouseX = p.mouseX;
            p.pmouseY = p.mouseY;
          if (spraySound.current) {
            spraySound.current.loop = true;
            spraySound.current.play().catch(() => {});
          }
        }
      };

      const stopSound = () => {
        if (spraySound.current) {
          spraySound.current.pause();
          spraySound.current.currentTime = 0;
        }
      };

      p.mouseReleased = () => {
        stopSound();
        // --- 2. SAVE TO LOCAL STORAGE ON MOUSE UP ---
        const snapshot = pg.canvas.toDataURL("image/png");
        localStorage.setItem(storageKey, snapshot);
      };

      p.mouseOut = stopSound;

      p.windowResized = () => {
        const container = renderRef.current;
        if (container) {
          const newW = container.offsetWidth;
          const newH = container.offsetHeight;
          let newPg = p.createGraphics(newW, newH);
          newPg.image(pg, 0, 0, newW, newH);
          p.resizeCanvas(newW, newH);
          pg.remove();
          pg = newPg;
          drawWall();
        }
      };

      p.mouseMoved = () => setMousePos({ x: p.mouseX, y: p.mouseY });
      p.mouseDragged = () => setMousePos({ x: p.mouseX, y: p.mouseY });
    }; 

    p5Instance.current = new p5(sketch);

    return () => {
      p5Instance.current?.remove();
      socket.off("receive_stroke");
    };
    // artistName added here to fix the "unused" warning and ensure setup runs correctly
  }, [wallCode, renderRef, setMousePos, artistName]); 

  return {
    clearCanvas: () => {
      clearFlag.current = true;
    },
    // Returns the artist name along with the image for the final reveal
    getSnapshot: () => ({
      artist: artistName,
      image: p5Instance.current?.canvas.toDataURL("image/png")
    })
  };
}