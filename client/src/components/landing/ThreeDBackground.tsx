import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from '../../hooks/useTheme';

const ThreeDBackground = memo(() => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(theme);

  // Update theme ref without re-initializing animation
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;


  // HiDPI/Retina fix
  let width = window.innerWidth;
  let height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      x: number; y: number; z: number; size: number;
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * 1000;
        this.size = Math.random() * 2;
      }
      update() {
        this.z -= 2;
        if (this.z <= 0) {
          this.z = 1000;
          this.x = Math.random() * width;
          this.y = Math.random() * height;
        }
      }
      draw(ctx: CanvasRenderingContext2D, color: string) {
        const scale = 1000 / (1000 + this.z);
        const x2d = (this.x - width / 2) * scale + width / 2;
        const y2d = (this.y - height / 2) * scale + height / 2;
        ctx.fillStyle = color;
        ctx.globalAlpha = 1 - this.z / 1000;
        ctx.beginPath();
        ctx.arc(x2d, y2d, this.size * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 150; i++) particles.push(new Particle());

    let animationId: number;
    const animate = () => {
      // Use themeRef.current to get latest theme without re-initializing
      const currentTheme = themeRef.current;
  // Increase alpha for less ghosting
  ctx.fillStyle = currentTheme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(0, 0, width, height);
      const color = currentTheme === 'dark' ? '#8b5cf6' : '#6366f1';
      particles.forEach(p => { p.update(); p.draw(ctx, color); });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []); // Empty dependency - only initialize once

  return (
    <div className='fixed inset-0 -z-10'>
      <canvas 
        ref={canvasRef} 
        className='w-full h-full transition-colors duration-300' 
        style={{ background: theme === 'dark' ? '#0f172a' : '#ffffff' }} 
      />
    </div>
  );
});

ThreeDBackground.displayName = 'ThreeDBackground';

export default ThreeDBackground;
