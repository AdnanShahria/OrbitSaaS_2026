import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDevicePerformance } from '@/hooks/use-performance';

export function NetworkCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { isLowEnd, maxDpr } = useDevicePerformance();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let logicalWidth = 0;
    let logicalHeight = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        logicalWidth = parent.clientWidth;
        logicalHeight = parent.clientHeight;
        canvas.width = logicalWidth * maxDpr;
        canvas.height = logicalHeight * maxDpr;
        canvas.style.width = `${logicalWidth}px`;
        canvas.style.height = `${logicalHeight}px`;
        ctx.scale(maxDpr, maxDpr);
      }
    };
    
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      colorType: number; // 0: Emerald Green, 1: Mint/Teal, 2: Cyan

      constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // Calm, elegant floating
        this.vx = (Math.random() - 0.5) * 0.22;
        this.vy = (Math.random() - 0.5) * 0.22;
        this.radius = Math.random() * 1.8 + 1.1;
        const r = Math.random();
        this.colorType = r < 0.5 ? 0 : r < 0.8 ? 1 : 2;
      }

      update(width: number, height: number) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        if (this.colorType === 0) {
          ctx.fillStyle = 'rgba(52, 211, 153, 0.88)';
          ctx.shadowColor = 'rgba(16, 185, 129, 0.65)';
          ctx.shadowBlur = 6;
        } else if (this.colorType === 1) {
          ctx.fillStyle = 'rgba(45, 212, 191, 0.85)';
          ctx.shadowColor = 'rgba(20, 184, 166, 0.55)';
          ctx.shadowBlur = 5;
        } else {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.82)';
          ctx.shadowColor = 'rgba(6, 182, 212, 0.55)';
          ctx.shadowBlur = 5;
        }
        ctx.fill();
        ctx.restore();
      }
    }

    const init = () => {
      resize();
      particles = [];
      // Adjust density based on container size
      const particleCount = Math.floor((logicalWidth * logicalHeight) / 14000);
      const isMobile = logicalWidth < 768;
      // Cap particles to ensure buttery 60fps performance on all devices
      const maxParticles = Math.min(particleCount, isLowEnd ? 20 : (isMobile ? 32 : 75));
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle(logicalWidth, logicalHeight));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      
      // Update particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(logicalWidth, logicalHeight);
      }

      // Draw connections first (behind nodes)
      const maxDistance = logicalWidth < 768 ? 105 : 125;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            
            const opacity = (1 - distance / maxDistance) * 0.35;
            // Greeny mesh lines
            ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`; 
            ctx.lineWidth = distance < 55 ? 1.1 : 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw nodes on top
      for (let i = 0; i < particles.length; i++) {
        particles[i].draw(ctx);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    window.addEventListener('resize', init);

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion, isLowEnd, maxDpr]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full pointer-events-none ${className}`}
      style={{ display: 'block' }}
    />
  );
}
