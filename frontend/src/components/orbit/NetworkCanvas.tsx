import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDevicePerformance } from '@/hooks/use-performance';

export function NetworkCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { isLowEnd, canRunComplexCanvas, maxDpr } = useDevicePerformance();

  // Low-powered devices skip the canvas loop entirely to preserve RAM, GPU fill-rate, and CPU
  if (isLowEnd || !canRunComplexCanvas || prefersReducedMotion) {
    return null;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let logicalWidth = 0;
    let logicalHeight = 0;
    let isVisible = true;

    // Pause canvas completely when scrolled out of view to eliminate wasted background cycles
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

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
      colorType: number;

      constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
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

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        if (this.colorType === 0) {
          c.fillStyle = 'rgba(52, 211, 153, 0.88)';
          c.shadowColor = 'rgba(16, 185, 129, 0.65)';
          c.shadowBlur = 6;
        } else if (this.colorType === 1) {
          c.fillStyle = 'rgba(45, 212, 191, 0.85)';
          c.shadowColor = 'rgba(20, 184, 166, 0.55)';
          c.shadowBlur = 5;
        } else {
          c.fillStyle = 'rgba(6, 182, 212, 0.82)';
          c.shadowColor = 'rgba(6, 182, 212, 0.55)';
          c.shadowBlur = 5;
        }
        c.fill();
        c.restore();
      }
    }

    const init = () => {
      resize();
      particles = [];
      const particleCount = Math.floor((logicalWidth * logicalHeight) / 16000);
      const isMobile = logicalWidth < 768;
      const maxParticles = Math.min(particleCount, isMobile ? 24 : 50);
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle(logicalWidth, logicalHeight));
      }
    };

    const animate = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(logicalWidth, logicalHeight);
      }

      const maxDistance = logicalWidth < 768 ? 95 : 120;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            
            const opacity = (1 - distance / maxDistance) * 0.3;
            ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`; 
            ctx.lineWidth = distance < 50 ? 1 : 0.7;
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < particles.length; i++) {
        particles[i].draw(ctx);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    window.addEventListener('resize', init, { passive: true });

    return () => {
      window.removeEventListener('resize', init);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [maxDpr]);

  return (
    <canvas 
      ref={canvasRef} 
      className={`w-full h-full pointer-events-none ${className}`}
      style={{ display: 'block' }}
    />
  );
}
