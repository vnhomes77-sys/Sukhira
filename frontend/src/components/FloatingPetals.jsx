import React, { useEffect, useRef } from 'react';

const FloatingPetals = () => {
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

    const particleCount = 20;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height + canvas.height,
        r: Math.random() * 20 + 8, // warm dust/petal size
        speedY: -(Math.random() * 0.4 + 0.2), // float up
        speedX: Math.random() * 0.4 - 0.2,
        opacity: Math.random() * 0.3 + 0.1,
        angle: Math.random() * Math.PI,
        swaySpeed: Math.random() * 0.01 + 0.005
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        gradient.addColorStop(0, `rgba(253, 191, 85, ${p.opacity})`);
        gradient.addColorStop(0.5, `rgba(251, 146, 60, ${p.opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(251, 146, 60, 0)');
        
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
        ctx.fill();

        // Update coordinates
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.angle) * 0.2;
        p.angle += p.swaySpeed;

        // Reset if floats off the top
        if (p.y < -50) {
          particles[i] = {
            x: Math.random() * canvas.width,
            y: canvas.height + 50,
            r: p.r,
            speedY: p.speedY,
            speedX: p.speedX,
            opacity: p.opacity,
            angle: Math.random() * Math.PI,
            swaySpeed: p.swaySpeed
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
        opacity: 0.6
      }}
    />
  );
};

export default FloatingPetals;
