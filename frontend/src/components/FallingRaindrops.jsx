import React, { useEffect, useRef } from 'react';

const FallingRaindrops = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const maxDrops = 100;
    const drops = [];

    for (let i = 0; i < maxDrops; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        l: Math.random() * 20 + 10, // length of raindrop
        xs: Math.random() * 1 - 0.5, // slight wind slant
        ys: Math.random() * 12 + 8, // fast fall speed
        opacity: Math.random() * 0.4 + 0.1
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(174, 219, 206, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';

      for (let i = 0; i < maxDrops; i++) {
        const d = drops[i];
        
        ctx.beginPath();
        ctx.strokeStyle = `rgba(16, 185, 129, ${d.opacity})`; // green-tinted dewy raindrops
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.xs, d.y + d.l);
        ctx.stroke();

        // Update position
        d.x += d.xs;
        d.y += d.ys;

        // Reset drop when it reaches screen bottom
        if (d.y > canvas.height) {
          drops[i] = {
            x: Math.random() * canvas.width,
            y: -20,
            l: d.l,
            xs: d.xs,
            ys: d.ys,
            opacity: d.opacity
          };
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 99,
        opacity: 0.7
      }}
    />
  );
};

export default FallingRaindrops;
