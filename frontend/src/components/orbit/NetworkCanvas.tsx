import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      colorIndex: number;

      constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // Slow, elegant floating
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 2 + 1;
        this.colorIndex = Math.random() > 0.5 ? 0 : 1;
      }

      update(width: number, height: number) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // Colors: Indigo or Cyan
        ctx.fillStyle = this.colorIndex === 0 ? 'rgba(99, 102, 241, 0.8)' : 'rgba(6, 182, 212, 0.8)';
        ctx.fill();
      }
    }

    const init = () => {
      resize();
      particles = [];
      // Adjust density based on container size
      const particleCount = Math.floor((canvas.width * canvas.height) / 10000);
      // Cap particles to ensure performance
      const maxParticles = Math.min(particleCount, 120);
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update particles
      particles.forEach(p => {
        p.update(canvas.width, canvas.height);
      });

      // Draw connections first (so they are behind the nodes)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            
            const opacity = 1 - distance / 120;
            // Mix of purple and indigo for lines
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity * 0.35})`; 
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw nodes on top
      particles.forEach(p => p.draw(ctx));

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    window.addEventListener('resize', init);

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
