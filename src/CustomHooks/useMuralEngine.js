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
  setisFinished,
}) {
  const p5Instance = useRef(null);
  const colorRef = useRef(activeColor);
  const sizeRef = useRef(brushSize);
  const eraserRef = useRef(isEraser);
  const capRef = useRef(capType);
  const bgRef = useRef(bgType);
  const slotIndexRef = useRef(null);

  // --- GARBAGE COLLECTION & TIMELAPSE REFS ---
  const strokePointsRef = useRef([]); // Stores coordinates for the current line
  const clearFlag = useRef(false);
  const dripsRef = useRef([]);
  const spraySound = useRef(new Audio("/sounds/paintingSound.wav"));
  const boundsRef = useRef({ x: 0, y: 0, w: 0, h: 0 }); // Store bounds in a Ref
  const pgRef = useRef(null); // Store PG in a Ref so return can see it

  useEffect(() => {
    if (spraySound.current) {
      spraySound.current.load(); // Forces the browser to buffer the file
      spraySound.current.volume = 0.5; // Optional: set a comfortable volume
      spraySound.current.loop = true; // Make sure it stays on while dragging
    }
  }, []);

  useEffect(() => {
    colorRef.current = activeColor;
    eraserRef.current = isEraser;
    sizeRef.current = brushSize;
    capRef.current = capType;
    bgRef.current = bgType;
  }, [activeColor, isEraser, brushSize, capType, bgType]);

  useEffect(() => {
    let textures = {};
    const storageKey = `mural_save_${wallCode}`;

    const sketch = (p) => {
      p.setup = async () => {
        const container = renderRef.current;
        if (!container) return;
        p.createCanvas(container.offsetWidth, container.offsetHeight).parent(
          container,
        );

        pgRef.current = p.createGraphics(p.width, p.height);
        pgRef.current.clear();
        boundsRef.current = { x: 0, y: 0, w: p.width, h: p.height };
        socket.on("mission_assigned", ({ slotIndex }) => {
          console.log("Assigned to slot:", slotIndex);
          slotIndexRef.current = slotIndex;
        });
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          p.loadImage(savedData, (img) => {
            if (pgRef.current) pgRef.current.image(img, 0, 0);
          });
        }

        try {
          textures.brick = await p.loadImage("/backgrounds/redBrick1k.jpg");
          textures.stone = await p.loadImage("/backgrounds/greyBrick.png");
          textures.concrete = await p.loadImage("/backgrounds/concrete.jpg");
        } catch (err) {
          console.error(err);
        }
      };

      p.draw = () => {
        if (!p.isLooping()) return; 
        // Draw Background
        if (bgRef.current !== "none" && textures[bgRef.current]) {
          p.image(textures[bgRef.current], 0, 0, p.width, p.height);
          p.fill(0, 0, 0, 80);
          p.rect(0, 0, p.width, p.height);
        } else {
          p.background(10, 10, 10);
        }
        if (clearFlag.current) {
          const { x, y, w, h } = boundsRef.current;
          pgRef.current.push();
          pgRef.current.erase();
          pgRef.current.rect(x, y, w, h);
          pgRef.current.noErase();
          pgRef.current.pop();
          dripsRef.current = [];
          clearFlag.current = false;
        }

        // --- DRAWING LOGIC ---
        if (p.mouseIsPressed) {
          const topElement = document.elementFromPoint(p.winMouseX, p.winMouseY);
          if (topElement && topElement.tagName === 'CANVAS') {
            
            // SPRAY LOGIC START: Play if inside canvas
            if (spraySound.current && spraySound.current.paused) {
              spraySound.current.play().catch(() => {});
            }

            p.pmouseX = p.mouseX;
            p.pmouseY = p.mouseY;
            
            const isInside = p.mouseX >= 0 && p.mouseX <= p.width && 
                             p.mouseY >= 0 && p.mouseY <= p.height;

            if (isInside && p.focused) {
              const pctX = p.mouseX / p.width;
              const pctY = p.mouseY / p.height;
              const lastPt = strokePointsRef.current[strokePointsRef.current.length - 1];
              if (!lastPt || p.dist(lastPt.x * p.width, lastPt.y * p.height, p.mouseX, p.mouseY) > 1) {
                 strokePointsRef.current.push({ x: pctX, y: pctY });
              }
            }

            const currentColor = colorRef.current;
            const currentSize = sizeRef.current;
            const isErasing = eraserRef.current;
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
              dripChance = 0.06;
            }

            if (isErasing) pgRef.current.erase();
            else pgRef.current.noErase();
            pgRef.current.noStroke();

            const d = p.dist(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
            if(d > 100){
              p.pmouseX = p.mouseX;
              p.pmouseY = p.mouseY; 
            } else {
              const steps = p.max(
                1,
                p.floor(p.dist(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY) / 5),
              );
              for (let s = 0; s < steps; s++) {
                const lerpX = p.lerp(p.pmouseX, p.mouseX, s / steps);
                const lerpY = p.lerp(p.pmouseY, p.mouseY, s / steps);
                if (isErasing) {
                  pgRef.current.ellipse(lerpX, lerpY, currentSize * 2);
                } else {
                  pgRef.current.fill(currentColor);
                  for (let i = 0; i < particleCount; i++) {
                    pgRef.current.ellipse(
                      lerpX + p.randomGaussian(0, spread),
                      lerpY + p.randomGaussian(0, spread),
                      p.random(pMin, pMax),
                    );
                  }
                  // PAUSE REMOVED FROM HERE
                }
              }
            
              pgRef.current.noErase();
            
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
          }
        } else {
          // SPRAY LOGIC STOP: Pause if mouse is NOT pressed
          if (spraySound.current && !spraySound.current.paused) {
            spraySound.current.pause();
          }
        }

        for (let i = dripsRef.current.length - 1; i >= 0; i--) {
          let d = dripsRef.current[i];
          pgRef.current.noStroke();
          pgRef.current.fill(d.color);
          pgRef.current.ellipse(d.x, d.y, d.size);
          d.y += d.velocity;
          d.velocity *= 0.99;
          d.life--;
          if (d.life <= 0) dripsRef.current.splice(i, 1);
        }
        p.image(pgRef.current, 0, 0);
      };

      const renderStaticStroke = (stroke) => {
        if (!stroke.points || stroke.points.length === 0) return;
        pgRef.current.push();
        pgRef.current.noStroke();
        pgRef.current.fill(stroke.color);
        const isFat = stroke.capType === "fat";
        const particleCount = isFat ? 12 : 35;
        const spread = (stroke.brushSize || 15) * (isFat ? 2.2 : 1);
        for (let i = 0; i < stroke.points.length; i++) {
          const p1 = { x: stroke.points[i].x * p.width, y: stroke.points[i].y * p.height };
          const nextPt = stroke.points[i + 1];
          const p2 = nextPt ? { x: nextPt.x * p.width, y: nextPt.y * p.height } : p1;
          const d = p.dist(p1.x, p1.y, p2.x, p2.y);
          const steps = p.max(1, p.floor(d / 5));
          for (let s = 0; s < steps; s++) {
            const lerpX = p.lerp(p1.x, p2.x, s / steps);
            const lerpY = p.lerp(p1.y, p2.y, s / steps);
            for (let j = 0; j < particleCount; j++) {
              pgRef.current.ellipse(lerpX + p.random(-spread, spread), lerpY + p.random(-spread, spread), p.random(1, 3));
            }
          }
          if (!nextPt) break;
        }
        pgRef.current.pop();
      };
    
      p.runTimelapse = (allStrokes) => {
        p.noLoop();
        pgRef.current.clear();
        dripsRef.current = [];
        let i = 0;
        const totalDuration = 5000;
        const strokeDelay = allStrokes.length > 0 ? totalDuration / allStrokes.length : 160;
        const interval = setInterval(() => {
          if (i >= allStrokes.length) {
            clearInterval(interval);
            setisFinished(true);
            p.loop();
            return;
          }
          renderStaticStroke(allStrokes[i]);
          p.background(10, 10, 10); 
          p.image(pgRef.current, 0, 0);
          i++;
        }, strokeDelay);
      };

      p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          p.pmouseX = p.mouseX;
          p.pmouseY = p.mouseY;
          strokePointsRef.current = [{ x: Math.round(p.mouseX), y: Math.round(p.mouseY) }];
          if (spraySound.current) {
            spraySound.current.currentTime = 0;
          }
        }
      };

      p.mouseReleased = () => {
        if (spraySound.current) {
          spraySound.current.pause();
        }
        if (strokePointsRef.current.length > 0) {
          const strokeData = {
            wallCode,
            artistName,
            slotIndex: slotIndexRef.current,
            color: eraserRef.current ? "#000000" : colorRef.current,
            brushSize: sizeRef.current,
            capType: capRef.current,
            points: strokePointsRef.current,
            originalWidth: p.width,
            originalHeight: p.height,
            timestamp: Date.now(),
          };
          socket.emit("send_stroke", strokeData);
          strokePointsRef.current = [];
        }
        try {
          const snapshot = pgRef.current.canvas.toDataURL("image/webp", 0.5);
          localStorage.setItem(storageKey, snapshot);
        } catch (err) {
          if (err.name === "QuotaExceededError") {
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith("mural_save_") && key !== storageKey) {
                localStorage.removeItem(key);
              }
            });
          }
        }
      };

      p.mouseOut = () => {
        if (spraySound.current) spraySound.current.pause();
      };

      p.windowResized = () => {
        const container = renderRef.current;
        if (container && pgRef.current) {
          const newW = container.offsetWidth;
          const newH = container.offsetHeight;
          let newPg = p.createGraphics(newW, newH);
          newPg.image(pgRef.current, 0, 0, newW, newH);
          p.resizeCanvas(newW, newH);
          pgRef.current.remove();
          pgRef.current = newPg;
          boundsRef.current = { x: 0, y: 0, w: newW, h: newH };
        }
      };

      p.mouseMoved = () => setMousePos({ x: p.mouseX, y: p.mouseY });
      p.mouseDragged = () => setMousePos({ x: p.mouseX, y: p.mouseY });
    };

    p5Instance.current = new p5(sketch);

    return () => {
      p5Instance.current?.remove();
      if (spraySound.current) {
        spraySound.current.pause();
        spraySound.current = null;
      }
    };
  }, [wallCode, renderRef, setMousePos, artistName]);

  return {
    clearCanvas: () => {
      socket.emit("clear_quadrant", { wallCode, artistName });
      const pg = pgRef.current;
      if (pg) pg.clear();
      dripsRef.current = [];
      clearFlag.current = true;
    },
    startReveal: (allStrokes) => {
      if (p5Instance.current) p5Instance.current.runTimelapse(allStrokes);
    },
    getSnapshot: () => ({
      artist: artistName,
      image: p5Instance.current?.canvas.toDataURL("image/png"),
    }),
  };
}