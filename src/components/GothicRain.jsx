import React, { useEffect, useRef } from 'react';

const GothicRain = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Rain drop particles setup
    const dropCount = Math.floor(window.innerWidth / 12); // Responsive density
    const drops = [];

    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: Math.random() * 22 + 10,
        speed: Math.random() * 12 + 10,
        opacity: Math.random() * 0.25 + 0.1,
        width: Math.random() * 1.2 + 0.6,
      });
    }

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];

        // Draw raindrop streak
        const gradient = ctx.createLinearGradient(d.x, d.y, d.x - 2, d.y + d.length);
        gradient.addColorStop(0, 'rgba(200, 200, 220, 0)');
        gradient.addColorStop(1, `rgba(200, 210, 230, ${d.opacity})`);

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = d.width;
        ctx.lineCap = 'round';
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.length); // Slight wind angle
        ctx.stroke();

        // Move raindrop
        d.y += d.speed;
        d.x -= 0.5;

        // Reset if off-screen
        if (d.y > canvas.height) {
          d.y = -d.length;
          d.x = Math.random() * (canvas.width + 50);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="gothic-rain-canvas"
      aria-hidden="true"
    />
  );
};

export default GothicRain;
