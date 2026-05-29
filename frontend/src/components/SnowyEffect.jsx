import React, { useEffect, useRef } from 'react';

const SnowyEffect = () => {
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

    const maxFlakes = 60;
    const flakes = [];

    for (let i = 0; i < maxFlakes; i++) {
      flakes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3 + 1, // flake radius
        d: Math.random() * maxFlakes, // density
        speed: Math.random() * 1 + 0.5,
        sway: Math.random() * 0.02
      });
    }

    let angle = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      
      angle += 0.01;
      for (let i = 0; i < maxFlakes; i++) {
        const f = flakes[i];
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);

        // Update coordinates
        f.y += f.speed;
        f.x += Math.sin(angle + f.d) * 0.5;

        // Reset flake when it goes off screen
        if (f.y > canvas.height) {
          flakes[i] = {
            x: Math.random() * canvas.width,
            y: -10,
            r: f.r,
            d: f.d,
            speed: f.speed,
            sway: f.sway
          };
        }
      }
      ctx.fill();
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
        opacity: 0.85
      }}
    />
  );
};

export default SnowyEffect;
