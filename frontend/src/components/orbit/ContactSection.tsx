import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { ArrowRight, Mail, MapPin, ExternalLink, Globe2, Facebook, Instagram, Linkedin, Send, Twitter, Youtube, Github, MessageCircle } from 'lucide-react';

import DOMPurify from 'dompurify';

const RichText = ({ text }: { text: string }) => (
  <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }} />
);

// ── Interactive Background Canvas (Comet Collision with Physics) ──
// Adapted from StarfieldCanvas.tsx approach-collision system
const TAU = 2 * Math.PI;
const COLORS = ['#f59e0b', '#d97706', '#fbbf24', '#f97316', '#ef4444'];

const ContactBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isMobile] = React.useState(() =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 768)
  );

  useEffect(() => {
    if (isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let lastTs = 0;

    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    let W = 0, H = 0;
    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Types ──
    // Approach comet: flies from off-screen toward a collision point
    interface Approach {
      fX: number; fY: number;   // from position (viewport %)
      tX: number; tY: number;   // target position (viewport %)
      life: number; maxLife: number;
      color: string;
      trail: number;            // trail length in px
      dot: boolean;             // render as dot vs streaky head
      spin: number; spinSpd: number;
    }

    // Free-roaming comet with physics
    interface Comet {
      x: number; y: number;
      vx: number; vy: number;
      mass: number; radius: number;
      color: string;
      trail: { x: number; y: number }[];
      age: number;
    }

    // Burst particle (directional, ease-out)
    interface Particle {
      cx: number; cy: number;   // origin (viewport %)
      px: number; py: number;   // target offset (px from origin)
      sz: number; color: string;
      life: number; maxLife: number;
    }

    // Flash burst at collision point
    interface Flash {
      cx: number; cy: number;   // viewport %
      color: string;
      life: number; maxLife: number;
    }

    // Shockwave ring
    interface Shockwave {
      x: number; y: number;
      radius: number; maxRadius: number;
      life: number; color: string;
    }

    const approaches: Approach[] = [];
    const comets: Comet[] = [];
    const particles: Particle[] = [];
    const flashes: Flash[] = [];
    const shockwaves: Shockwave[] = [];

    // ── Physics constants ──
    const GRAVITY_STRENGTH = 800;
    const MAX_SPEED = 12;
    const CENTER_ZONE = 60;
    const MAX_COMETS = 6;
    const COMET_RESTITUTION = 0.9;

    // ── Sequencer ──
    let seqTimer = 1.5;  // first event after ~1.5s

    // ── Helpers ──
    // Calculate an off-screen point given a center (viewport%) and angle (degrees)
    const offScreen = (cx: number, cy: number, aDeg: number): [number, number] => {
      const r = aDeg * Math.PI / 180;
      const c = Math.cos(r), s = Math.sin(r);
      for (let t = 1; t < 200; t += 2) {
        const x = cx + c * t, y = cy + s * t;
        if (x < -10 || x > 110 || y < -10 || y > 110) return [x, y];
      }
      return [cx + c * 120, cy + s * 120];
    };

    // ── Spawn approach collision (from StarfieldCanvas pattern) ──
    const spawnCollision = () => {
      // Random collision point within the canvas (10%-90% viewport)
      const cx = 15 + Math.random() * 70;
      const cy = 15 + Math.random() * 60;
      const dur = 1.2 + Math.random() * 0.6;

      // Two opposite angles
      const a1 = Math.random() * 360;
      const a2 = a1 + 180;
      const [f1x, f1y] = offScreen(cx, cy, a1);
      const [f2x, f2y] = offScreen(cx, cy, a2);

      const c1 = COLORS[Math.floor(Math.random() * COLORS.length)];
      const c2 = COLORS[Math.floor(Math.random() * COLORS.length)];

      const mkApproach = (fX: number, fY: number, col: string, isDot: boolean): Approach => ({
        fX, fY, tX: cx, tY: cy,
        life: 0, maxLife: dur, color: col,
        trail: isDot ? 160 : 120,
        dot: isDot,
        spin: 0, spinSpd: (Math.random() > 0.5 ? 1 : -1) * TAU / (1.5 + Math.random() * 2),
      });

      approaches.push(mkApproach(f1x, f1y, c1, true));
      approaches.push(mkApproach(f2x, f2y, c2, Math.random() > 0.5));

      // Schedule the collision burst
      setTimeout(() => {
        const numParticles = 16;
        const spread = 120;
        const fc = ['#ff6b00', '#ff4500', '#ff8c00', '#ffd700', '#ff3300', '#ffaa00', c1, c2];

        // Flash
        flashes.push({ cx, cy, color: c1, life: 0, maxLife: 0.6 });

        // Directional particles (from StarfieldCanvas pattern)
        for (let i = 0; i < numParticles; i++) {
          const a = (360 / numParticles) * i + Math.random() * 30 - 15;
          const d = spread * (0.6 + Math.random() * 0.8);
          const r = a * Math.PI / 180;
          particles.push({
            cx, cy,
            px: Math.cos(r) * d,
            py: Math.sin(r) * d,
            sz: 3 + Math.random() * 6,
            color: fc[Math.floor(Math.random() * fc.length)],
            life: 0,
            maxLife: 0.6 + Math.random() * 0.8,
          });
        }

        // Extra ember particles
        for (let i = 0; i < 5; i++) {
          const a = Math.random() * 360;
          const d = 30 + Math.random() * 60;
          const r = a * Math.PI / 180;
          particles.push({
            cx, cy,
            px: Math.cos(r) * d,
            py: Math.sin(r) * d - 20,
            sz: 4 + Math.random() * 4,
            color: '#ff6b00',
            life: 0,
            maxLife: 0.8 + Math.random() * 0.5,
          });
        }

        // Shockwave
        const sx = cx * W / 100, sy = cy * H / 100;
        shockwaves.push({ x: sx, y: sy, radius: 0, maxRadius: 140, life: 1, color: c1 });
      }, dur * 1000);
    };

    // ── Spawn free-roaming comet ──
    const spawnComet = () => {
      if (comets.length >= MAX_COMETS) return;
      const edge = Math.floor(Math.random() * 4);
      let x: number, y: number;
      if (edge === 0) { x = Math.random() * W; y = -40; }
      else if (edge === 1) { x = W + 40; y = Math.random() * H; }
      else if (edge === 2) { x = Math.random() * W; y = H + 40; }
      else { x = -40; y = Math.random() * H; }

      const cxT = W / 2 + (Math.random() - 0.5) * 200;
      const cyT = H / 2 + (Math.random() - 0.5) * 200;
      const dx = cxT - x, dy = cyT - y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const initSpeed = 3 + Math.random() * 4;
      const radius = 3 + Math.random() * 4;

      comets.push({
        x, y,
        vx: (dx / dist) * initSpeed,
        vy: (dy / dist) * initSpeed,
        mass: radius * radius,
        radius,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        trail: [],
        age: 0,
      });
    };

    // ── Spawn center burst (when free-roaming comet hits center) ──
    const spawnCenterBurst = (px: number, py: number, color: string) => {
      const cx = (px / W) * 100, cy = (py / H) * 100;
      flashes.push({ cx, cy, color, life: 0, maxLife: 0.5 });
      const n = 20, sp = 90;
      for (let i = 0; i < n; i++) {
        const a = (360 / n) * i + Math.random() * 20 - 10;
        const d = sp * (0.5 + Math.random() * 0.8);
        const r = a * Math.PI / 180;
        particles.push({
          cx, cy,
          px: Math.cos(r) * d,
          py: Math.sin(r) * d,
          sz: 2 + Math.random() * 4,
          color: [color, '#ffffff', color + 'cc'][Math.floor(Math.random() * 3)],
          life: 0,
          maxLife: 0.5 + Math.random() * 0.6,
        });
      }
      shockwaves.push({ x: px, y: py, radius: 0, maxRadius: 100, life: 1, color });
    };

    // ── 2D Elastic Collision between two comets ──
    const resolveCollision = (a: Comet, b: Comet) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const overlap = (a.radius + b.radius) - dist;
      if (overlap <= 0) return;

      const nx = dx / dist, ny = dy / dist;
      const sep = overlap / 2 + 0.5;
      a.x -= nx * sep; a.y -= ny * sep;
      b.x += nx * sep; b.y += ny * sep;

      const dvx = a.vx - b.vx, dvy = a.vy - b.vy;
      const dvn = dvx * nx + dvy * ny;
      if (dvn <= 0) return;

      const impulse = (dvn * (1 + COMET_RESTITUTION)) / (1 / a.mass + 1 / b.mass);
      a.vx -= (impulse / a.mass) * nx;
      a.vy -= (impulse / a.mass) * ny;
      b.vx += (impulse / b.mass) * nx;
      b.vy += (impulse / b.mass) * ny;

      // Small collision burst
      const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
      const mc = Math.random() > 0.5 ? a.color : b.color;
      const cx = (midX / W) * 100, cy = (midY / H) * 100;
      for (let i = 0; i < 8; i++) {
        const ang = Math.random() * TAU;
        const d = 20 + Math.random() * 40;
        particles.push({
          cx, cy,
          px: Math.cos(ang) * d, py: Math.sin(ang) * d,
          sz: 2 + Math.random() * 3,
          color: mc,
          life: 0, maxLife: 0.4 + Math.random() * 0.3,
        });
      }
      shockwaves.push({ x: midX, y: midY, radius: 0, maxRadius: 40, life: 1, color: mc });
    };

    // ── Main render loop ──
    const render = (ts: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (!isVisible) { lastTs = 0; return; }

      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.1) : 0.016;
      lastTs = ts;
      if (dt <= 0) return;

      // ── Sequencer: spawn events ──
      seqTimer -= dt;
      if (seqTimer <= 0) {
        const roll = Math.random();
        if (roll < 0.45) {
          spawnCollision();  // Approach collision (the dramatic one)
        } else {
          spawnComet();      // Free-roaming gravity comet
        }
        seqTimer = 3 + Math.random() * 2; // ~4s avg gap
      }

      const cxC = W / 2, cyC = H / 2;

      // ── Clear with fade ──
      ctx.fillStyle = 'rgba(5, 5, 5, 0.18)';
      ctx.fillRect(0, 0, W, H);

      // Center glow
      const glow = ctx.createRadialGradient(cxC, cyC, 0, cxC, cyC, 350);
      glow.addColorStop(0, 'rgba(212, 160, 23, 0.06)');
      glow.addColorStop(1, 'rgba(5, 5, 5, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      ctx.save();

      // ══════════════════════════════════════════════
      // 1. APPROACH COMETS (from StarfieldCanvas)
      // ══════════════════════════════════════════════
      for (let i = approaches.length - 1; i >= 0; i--) {
        const a = approaches[i];
        a.life += dt;
        if (a.life >= a.maxLife) { approaches.splice(i, 1); continue; }

        const t = a.life / a.maxLife;
        const px = (a.fX + (a.tX - a.fX) * t) * W / 100;
        const py = (a.fY + (a.tY - a.fY) * t) * H / 100;
        a.spin += a.spinSpd * dt;

        const op = t < 0.08 ? t / 0.08 : t > 0.98 ? (1 - t) / 0.02 : 1;

        // Trail
        const dx = (a.tX - a.fX) * W / 100;
        const dy = (a.tY - a.fY) * H / 100;
        const ang = Math.atan2(dy, dx);
        const tx = px - Math.cos(ang) * a.trail;
        const ty = py - Math.sin(ang) * a.trail;
        const gr = ctx.createLinearGradient(tx, ty, px, py);
        gr.addColorStop(0, 'rgba(0,0,0,0)');
        gr.addColorStop(0.5, a.color + '66');
        gr.addColorStop(1, a.color);
        ctx.globalAlpha = op;
        ctx.strokeStyle = gr;
        ctx.lineWidth = a.dot ? 5 : 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(px, py);
        ctx.stroke();

        // Head
        if (a.dot) {
          ctx.fillStyle = a.color;
          ctx.globalAlpha = op * 0.5;
          ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.fill();
          ctx.globalAlpha = op;
          ctx.beginPath(); ctx.arc(px, py, 3, 0, TAU); ctx.fill();
        } else {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(a.spin);
          ctx.globalAlpha = op * 0.4;
          ctx.fillStyle = a.color;
          ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill();
          ctx.globalAlpha = op;
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
          ctx.restore();
        }
      }

      // ══════════════════════════════════════════════
      // 2. FREE-ROAMING COMETS (gravity + elastic collisions)
      // ══════════════════════════════════════════════
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.age += dt;

        // Gravitational acceleration toward center
        const gdx = cxC - c.x, gdy = cyC - c.y;
        const gDist = Math.sqrt(gdx * gdx + gdy * gdy) || 1;
        const gForce = GRAVITY_STRENGTH / (gDist * gDist + 2000);
        c.vx += (gdx / gDist) * gForce * dt * 60;
        c.vy += (gdy / gDist) * gForce * dt * 60;

        const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);
        if (speed > MAX_SPEED) {
          c.vx = (c.vx / speed) * MAX_SPEED;
          c.vy = (c.vy / speed) * MAX_SPEED;
        }

        c.x += c.vx * dt * 60;
        c.y += c.vy * dt * 60;

        c.trail.push({ x: c.x, y: c.y });
        const maxTrail = Math.min(25, Math.floor(speed * 3) + 5);
        while (c.trail.length > maxTrail) c.trail.shift();

        // Center zone: despawn + burst
        if (gDist < CENTER_ZONE) {
          spawnCenterBurst(c.x, c.y, c.color);
          comets.splice(i, 1);
          continue;
        }

        // Off-screen safety
        if (c.age > 15 && (c.x < -200 || c.x > W + 200 || c.y < -200 || c.y > H + 200)) {
          comets.splice(i, 1);
          continue;
        }
      }

      // Comet-to-comet collision detection
      for (let i = 0; i < comets.length; i++) {
        for (let j = i + 1; j < comets.length; j++) {
          const a = comets[i], b = comets[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < a.radius + b.radius) resolveCollision(a, b);
        }
      }

      // Render free-roaming comets
      for (const c of comets) {
        const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy);

        // Trail
        if (c.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(c.trail[0].x, c.trail[0].y);
          for (let j = 1; j < c.trail.length; j++) ctx.lineTo(c.trail[j].x, c.trail[j].y);
          ctx.globalAlpha = Math.min(1, speed / MAX_SPEED + 0.3);
          ctx.strokeStyle = c.color;
          ctx.lineWidth = c.radius * 0.7;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowBlur = 12;
          ctx.shadowColor = c.color;
          ctx.stroke();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }

        // Draw comet head with glow
        const headGlow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.radius * 3);
        headGlow.addColorStop(0, '#ffffff');
        headGlow.addColorStop(0.3, c.color);
        headGlow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = headGlow;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 18;
        ctx.shadowColor = c.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ══════════════════════════════════════════════
      // 3. FLASH BURSTS (radial gradient flashes at collision points)
      // ══════════════════════════════════════════════
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.life += dt;
        if (f.life >= f.maxLife) { flashes.splice(i, 1); continue; }
        const t = f.life / f.maxLife;
        const fx = f.cx * W / 100, fy = f.cy * H / 100;
        const r = 14 * (0.5 + t * 4.5);
        ctx.globalAlpha = t < 0.5 ? 1 - t * 0.4 : 1 - t;
        const gf = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
        gf.addColorStop(0, f.color);
        gf.addColorStop(0.5, f.color + '88');
        gf.addColorStop(1, f.color + '00');
        ctx.fillStyle = gf;
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, TAU);
        ctx.fill();
      }

      // ══════════════════════════════════════════════
      // 4. DIRECTIONAL PARTICLES (ease-out from origin)
      // ══════════════════════════════════════════════
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
        const t = p.life / p.maxLife;
        const eT = 1 - (1 - t) * (1 - t); // ease-out quadratic
        const px = p.cx * W / 100 + p.px * eT;
        const py = p.cy * H / 100 + p.py * eT;
        const radius = (p.sz / 2) * (1 - t); // shrink to 0
        // Glow
        ctx.globalAlpha = (1 - t) * 0.3;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(radius * 1.5, 1), 0, TAU);
        ctx.fill();
        // Core
        ctx.globalAlpha = 1 - t;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(radius, 0.5), 0, TAU);
        ctx.fill();
      }

      // ══════════════════════════════════════════════
      // 5. SHOCKWAVE RINGS
      // ══════════════════════════════════════════════
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += (sw.maxRadius * 2) * dt;
        sw.life -= dt * 2.5;
        if (sw.life <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, TAU);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 2 * sw.life;
        ctx.globalAlpha = sw.life * 0.6;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto opacity-70 z-0 mix-blend-screen"
    />
  );
};


// ── WhatsApp Icon Component ──
const WhatsAppIcon = ({ className, size = 24 }: { className?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ── Social icons map ──
const socialIconComponents: Record<string, any> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  telegram: Send,
  twitter: Twitter,
  youtube: Youtube,
  github: Github,
  whatsapp: WhatsAppIcon,
};

// ── Contact Card Component ──
const ContactCard = ({ icon: Icon, title, value, href, delay }: { icon: any, title: string, value: string, href?: string, delay: number }) => {
  const CardWrapper = href ? 'a' : 'div';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <CardWrapper
        href={href}
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="group relative flex items-center gap-3 p-3.5 rounded-xl bg-[#0a0a0a]/40 border border-white/5 backdrop-blur-md overflow-hidden transition-all hover:bg-white/[0.05] hover:border-primary/30 block"
      >
        <div className="relative shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#1c1a15] to-[#0a0a0a] border border-[#2a2618] text-primary group-hover:text-primary-foreground group-hover:bg-primary transition-all">
          <Icon size={16} />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">{title}</span>
          <span className="text-sm text-white/90 font-medium group-hover:text-primary transition-colors truncate">
            {value}
          </span>
        </div>
      </CardWrapper>
    </motion.div>
  );
};


export function ContactSection() {
  const { content } = useContent();
  const { lang } = useLang();

  const t = (content[lang] as any)?.contact || {};
  const footerData = (content[lang] as any)?.footer || {};
  const socials = footerData.socials || [];
  const activeSocials = socials.filter((s: any) => s.enabled && s.url);
 
  const whatsappNumber = footerData.phone || t?.whatsapp || '+8801853452264';
  const emailAddress = footerData.email || t?.email || 'contact@orbitsaas.com';
  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  return (
    <section id="contact" className="section-dark relative min-h-[100dvh] flex items-center py-20 lg:py-32 overflow-hidden bg-[#050505]">

      {/* ── Background Effects ── */}
      <ContactBackground />

      {/* Radial Gradient Base */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(212,160,23,0.08)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_90%,rgba(212,160,23,0.05)_0%,transparent_40%)] pointer-events-none" />

      <div className="section-container relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Center Column: Copy & CTAs */}
          <div className="lg:col-span-8 lg:col-start-3 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="mb-6"
            >
              <span className="pill-badge pill-badge-accent shadow-[0_0_20px_rgba(212,160,23,0.15)] flex items-center gap-2">
                <Globe2 size={14} className="text-[var(--accent)] animate-spin-slow" />
                {t?.badge || 'Launch your vision'}
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-6"
            >
              <RichText text={t?.title || 'Ready to put your idea into ORBIT?'} />
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed mb-10 max-w-2xl px-4"
            >
              {t?.subtitle || 'Join the elite businesses scaling with our high-performance AI & web ecosystems.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col items-center gap-6"
            >
              <motion.a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="relative px-8 py-4 rounded-2xl bg-primary text-white font-bold text-lg flex items-center gap-3 overflow-hidden group shadow-xl shadow-primary/20 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                <WhatsAppIcon size={24} className="animate-pulse" />
                <span>{t?.cta || 'Book a Free Consultation'}</span>
              </motion.a>
            </motion.div>

            {/* Social Links Matrix */}
            {activeSocials.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-12 w-full max-w-md"
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold mb-6 flex items-center justify-center gap-4">
                  <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-primary/30" />
                  Connect With Us
                  <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-primary/30" />
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  {activeSocials.map((social: any, idx: number) => {
                    const IconComponent = socialIconComponents[social.platform];
                    return (
                      <motion.a
                        key={idx}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ y: -5, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                        className="w-12 h-12 rounded-full border border-white/5 bg-white/5 text-white/50 flex items-center justify-center transition-all group"
                        title={social.platform}
                      >
                        {IconComponent ? <IconComponent size={20} className="group-hover:text-primary transition-colors" /> : <ExternalLink size={18} />}
                      </motion.a>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Cards: Secondary Contact Info */}
          <div className="lg:col-span-10 lg:col-start-2 grid grid-cols-1 md:grid-cols-3 gap-4 mt-20">
            <ContactCard
              icon={Mail}
              title="Email Us"
              value={emailAddress}
              href={`mailto:${emailAddress}`}
              delay={0.4}
            />
            {whatsappNumber && (
              <ContactCard
                icon={WhatsAppIcon}
                title="WhatsApp / Phone"
                value={whatsappNumber}
                href={whatsappLink}
                delay={0.5}
              />
            )}
            <ContactCard
              icon={MapPin}
              title="Global HQ"
              value={footerData.location || t?.address || "Rajshahi, Bangladesh"}
              href={footerData.mapLink || t?.mapLink || "https://www.google.com/maps/search/?api=1&query=24.36545054786298,88.62639818383883"}
              delay={0.6}
            />
          </div>

        </div>
      </div>
    </section>
  );
}

export default ContactSection;
