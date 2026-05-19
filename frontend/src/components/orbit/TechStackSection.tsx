import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { useLang } from '@/contexts/LanguageContext';
import { WaveDivider } from '@/components/ui/WaveDivider';


/* ─── tech logo URLs (served from public/images/) ─── */
const TECH_LOGOS = [
  { src: '/images/react.svg', label: 'React', isDouble: true },
  { src: '/images/nextjs.svg', label: 'Next.js', isDouble: true },
  { src: '/images/nodejs.svg', label: 'Node.js', isDouble: true },
  { src: '/images/express.svg', label: 'Express', isDouble: true },
  { src: '/images/mongodb.svg', label: 'MongoDB', isDouble: true },
  { src: '/images/mysql.svg', label: 'MySQL', isDouble: true },
  { src: '/images/typescript.svg', label: 'TypeScript', isDouble: true },
  { src: '/images/tailwind.svg', label: 'Tailwind', isDouble: false },
  { src: '/images/prisma.svg', label: 'Prisma', isDouble: false },
  { src: '/images/docker.svg', label: 'Docker', isDouble: false },
  { src: '/images/redis.svg', label: 'Redis', isDouble: false },
  { src: '/images/aws.svg', label: 'AWS', isDouble: false },
  { src: '/images/graphql.svg', label: 'GraphQL', isDouble: false },
  { src: '/images/firebase.svg', label: 'Firebase', isDouble: false },
  { src: '/images/flutter.svg', label: 'Flutter', isDouble: false },
  { src: '/images/kubernetes.svg', label: 'Kubernetes', isDouble: false },
  { src: '/images/tensorflow.svg', label: 'TensorFlow', isDouble: false },
  { src: '/images/pytorch.svg', label: 'PyTorch', isDouble: false },
  { src: '/images/n8n.svg', label: 'n8n', isDouble: false },
  { src: '/images/openai.svg', label: 'OpenAI', isDouble: false },
  { src: '/images/supabase.svg', label: 'Supabase', isDouble: false },
  { src: '/images/vercel.svg', label: 'Vercel', isDouble: false },
  { src: '/images/cloudflare.svg', label: 'Cloudflare', isDouble: false },
  { src: '/images/digitalocean.svg', label: 'DigitalOcean', isDouble: false },
  { src: '/images/githubactions.svg', label: 'GitHub Actions', isDouble: false },
  { src: '/images/android.svg', label: 'Android', isDouble: false },
  { src: '/images/ios.svg', label: 'iOS', isDouble: false },
  { src: '/images/swift.svg', label: 'Swift', isDouble: false },
  { src: '/images/langchain.svg', label: 'LangChain', isDouble: false },
  { src: '/images/pinecone.svg', label: 'Pinecone', isDouble: false },
  { src: '/images/huggingface.svg', label: 'Hugging Face', isDouble: false },
  { src: '/images/kotlin.svg', label: 'Kotlin', isDouble: false },
  { src: '/images/java.svg', label: 'Java', isDouble: false },
  { src: '/images/postgresql.svg', label: 'PostgreSQL', isDouble: false },
  { src: '/images/reactnative.svg', label: 'React Native', isDouble: false },
  { src: '/images/openclaw.svg', label: 'OpenClaw', isDouble: false },
  { src: '/images/nemoclaw.svg', label: 'NemoClaw', isDouble: false },
];

/* ─── Ball Interface ─── */
interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  img: HTMLImageElement | null;
  label: string;
  isDouble: boolean;
  opacity: number;
  glowHue: number;
  rotation: number;
  rotationSpeed: number;
  hasScored?: boolean; // Track if this ball has already passed through the hoop this fall
  isInitialFall?: boolean; // Track if this ball is falling for the first time
}

interface Hoop {
  x: number;
  y: number;
  w: number;
  h: number;
  rimY: number;
}

interface ScorePopup {
  x: number;
  y: number;
  text: string;
  birthTime: number;
}

/* ─── Web Audio API Sound ─── */
let audioCtx: AudioContext | null = null;
let audioInit = false;

function playScoreSound() {
  if (!window.AudioContext && !(window as any).webkitAudioContext) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (!audioInit) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    audioInit = true;
  }
  
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(1600, t + 0.1);
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start(t);
  osc.stop(t + 0.3);
}

interface Layout {
  isMobile: boolean;
  bucketW: number;
  bucketBottom: number;
  bucketTop: number;
  bucketLeft: number;
  bucketRight: number;
  funnelH: number;
  funnelW: number;
  hoop: Hoop;
}

function getLayout(cw: number, ch: number): Layout {
  const isMobile = cw < 768;
  const bucketW = isMobile ? cw * 0.85 : cw * 0.28;
  const bucketBottom = ch - 60;
  const bucketTop = bucketBottom - (isMobile ? ch * 0.45 : ch * 0.32);
  const bucketLeft = isMobile ? (cw - bucketW) / 2 : cw * 0.05; // 5% from left
  const bucketRight = bucketLeft + bucketW;

  const funnelH = isMobile ? 60 : 80;
  const funnelW = isMobile ? 40 : 50;

  // Move hoop to top right, make larger on mobile for playability
  const hoopW = isMobile ? 120 : 120;
  const hoopH = isMobile ? 80 : 100;
  const hoopX = isMobile ? cw - hoopW - 10 : cw - hoopW - 60;
  const hoopY = isMobile ? ch * 0.25 : ch * 0.35;
  
  return {
    isMobile,
    bucketW,
    bucketBottom,
    bucketTop,
    bucketLeft,
    bucketRight,
    funnelH,
    funnelW,
    hoop: {
      x: hoopX,
      y: hoopY,
      w: hoopW,
      h: hoopH,
      rimY: hoopY + (isMobile ? 20 : 30)
    }
  };
}

/* ─── Particle Interface ─── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

function createBalls(
  cw: number,
  ch: number,
  images: (HTMLImageElement | null)[],
): Ball[] {
  const balls: Ball[] = [];
  const layout = getLayout(cw, ch);
  const isSmallMobile = cw < 450;

  const techCount = layout.isMobile ? Math.min(30, images.length) : images.length;

  for (let i = 0; i < techCount; i++) {
    const rBase = isSmallMobile ? (22 + Math.random() * 4) : layout.isMobile ? (26 + Math.random() * 5) : (20 + Math.random() * 6);

    // Drop balls directly inside the left-aligned bucket funnel
    const dropRange = layout.bucketW * 0.6;
    const dropCenter = layout.bucketLeft + layout.bucketW / 2;
    const dropX = dropCenter - dropRange/2 + Math.random() * dropRange;

    balls.push({
      x: dropX,
      y: -rBase - Math.random() * ch * 2.5,
      vx: 0,
      vy: Math.random() * 4 + 6,
      r: rBase,
      img: images[i],
      label: TECH_LOGOS[i].label,
      isDouble: !!TECH_LOGOS[i].isDouble,
      opacity: 0,
      glowHue: 35 + Math.random() * 15,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      isInitialFall: true,
    });
  }

  return balls.sort(() => Math.random() - 0.5);
}

function createParticles(count: number, cw: number, ch: number): Particle[] {
  const pts: Particle[] = [];
  for (let i = 0; i < count; i++) {
    pts.push({
      x: Math.random() * cw,
      y: Math.random() * ch,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.4,
      hue: 200 + Math.random() * 40, // Subtle blueish background dust
    });
  }
  return pts;
}

/* ─── Physics step ─── */
// Physics Helper: Line Segment Collision
function checkLineCollision(b: Ball, p1x: number, p1y: number, p2x: number, p2y: number, BOUNCE: number) {
  const dx = p2x - p1x;
  const dy = p2y - p1y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return;

  let t = ((b.x - p1x) * dx + (b.y - p1y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));

  const closestX = p1x + t * dx;
  const closestY = p1y + t * dy;

  const distDx = b.x - closestX;
  const distDy = b.y - closestY;
  const distSq = distDx * distDx + distDy * distDy;

  if (distSq < b.r * b.r) {
    const dist = Math.sqrt(distSq);
    const nx = distDx / dist;
    const ny = distDy / dist;

    // Push out
    const overlap = b.r - dist;
    b.x += nx * overlap;
    b.y += ny * overlap;

    // Reflect velocity
    const dot = b.vx * nx + b.vy * ny;
    if (dot < 0) {
      // Zero bounce for slow collisions to prevent jitter/vibration
      const bounceMult = Math.abs(dot) < 1.0 ? 0 : BOUNCE;
      b.vx -= 2 * dot * nx * bounceMult;
      b.vy -= 2 * dot * ny * bounceMult;
    }
    // High Ground friction
    b.vx *= 0.94;
    b.vy *= 0.94;
    
    // Rotation transfer (slight spin based on slide)
    const tx = -ny;
    const ty = nx;
    const tangentSlip = b.vx * tx + b.vy * ty;
    b.rotationSpeed += tangentSlip * 0.0005;
  }
}

function stepPhysics(
  balls: Ball[],
  particles: Particle[],
  cw: number,
  ch: number,
  mouseX: number,
  mouseY: number,
  mouseActive: boolean,
  layout: Layout,
  onScore: (x: number, y: number) => void,
) {
  const GRAVITY = 0.45; // Increased gravity for faster dropping
  const FRICTION = 0.99;
  const BOUNCE = 0.5;
  const MOUSE_RADIUS = 150;
  const MOUSE_FORCE = 4.0;

  const { bucketBottom, bucketTop, bucketLeft, bucketRight, funnelH, funnelW, hoop } = layout;

  // Balls
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];

    b.vy += GRAVITY;
    b.vx *= FRICTION;
    b.vy *= FRICTION;
    b.rotation += b.rotationSpeed;

    if (mouseActive) {
      const dx = b.x - mouseX;
      const dy = b.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 0) {
        b.isInitialFall = false; // Release clamp on interaction
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * MOUSE_FORCE;
        b.vx += (dx / dist) * force;
        b.vy += (dy / dist) * force;
        b.rotationSpeed += (dx / dist) * 0.002;
      }
    }

    // Clamp initial falling trajectory inside the funnel opening to prevent missing the bucket
    if (b.isInitialFall) {
      const minX = bucketLeft - funnelW + b.r + 2;
      const maxX = bucketRight + funnelW - b.r - 2;
      if (b.x < minX) {
        b.x = minX;
        b.vx = 0;
      } else if (b.x > maxX) {
        b.x = maxX;
        b.vx = 0;
      }
      if (b.y >= bucketTop) {
        b.isInitialFall = false;
      }
    }

    // Aggressive Dampening near bucket floor/corners
    if (b.y > bucketBottom - b.r * 2) {
      b.vx *= 0.95;
      b.vy *= 0.95;
      b.rotationSpeed *= 0.92;
      
      // Stop completely if very slow
      if (Math.abs(b.vx) < 0.05) b.vx = 0;
      if (Math.abs(b.vy) < 0.05) b.vy = 0;
      if (Math.abs(b.rotationSpeed) < 0.005) b.rotationSpeed = 0;
    }

    b.x += b.vx;
    b.y += b.vy;

    // Basketball Hoop Scoring Detection
    if (!b.hasScored && b.vy > 0) {
      // Check if ball center passes through the 3D rim area
      if (b.y > hoop.rimY - 10 && b.y < hoop.rimY + 20 && b.x > hoop.x && b.x < hoop.x + hoop.w) {
        b.hasScored = true;
        onScore(b.x, b.y);
      }
    }
    
    // Reset hasScored if ball goes significantly above the hoop again
    if (b.hasScored && b.y < hoop.rimY - 100) {
      b.hasScored = false;
    }

    if (b.opacity < 1) b.opacity = Math.min(1, b.opacity + 0.015);

    // 1. Funnel Slants and Vertical Walls direct clamping & bounce
    if (b.y >= bucketTop && b.y <= bucketBottom) {
      // Inside vertical walls
      const minX = bucketLeft + b.r;
      const maxX = bucketRight - b.r;
      if (b.x < minX) {
        b.x = minX;
        b.vx = Math.abs(b.vx) * BOUNCE;
        b.rotationSpeed += b.vy * 0.002;
      } else if (b.x > maxX) {
        b.x = maxX;
        b.vx = -Math.abs(b.vx) * BOUNCE;
        b.rotationSpeed -= b.vy * 0.002;
      }
    } else if (b.y >= bucketTop - funnelH && b.y < bucketTop) {
      // Inside funnel slants
      const progress = (bucketTop - b.y) / funnelH; // 0 at bucketTop, 1 at funnel entrance
      const minX = bucketLeft - funnelW * progress + b.r;
      const maxX = bucketRight + funnelW * progress - b.r;
      if (b.x < minX) {
        b.x = minX;
        b.vx = Math.abs(b.vx) * BOUNCE;
      } else if (b.x > maxX) {
        b.x = maxX;
        b.vx = -Math.abs(b.vx) * BOUNCE;
      }
    }

    // 2. Corner collisions for smooth physics feeling
    // Curved corners (approximated)
    checkLineCollision(b, bucketLeft, bucketBottom - 30, bucketLeft + 30, bucketBottom, BOUNCE);
    checkLineCollision(b, bucketRight, bucketBottom - 30, bucketRight - 30, bucketBottom, BOUNCE);

    // 3. Screen edge bounce (only horizontal)
    if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * BOUNCE; }
    if (b.x + b.r > cw) { b.x = cw - b.r; b.vx = -Math.abs(b.vx) * BOUNCE; }
    
    // Bottom floor fallback (prevent sinking - now clamped to the bucket floor line)
    if (b.y + b.r > bucketBottom) { 
      b.y = bucketBottom - b.r; 
      b.vy = -Math.abs(b.vy) * BOUNCE; 
    }

    // Absolute vertical walls post-clamp to completely prevent corner-collision penetration
    if (b.y >= bucketTop && b.y <= bucketBottom) {
      const minX = bucketLeft + b.r;
      const maxX = bucketRight - b.r;
      if (b.x < minX) {
        b.x = minX;
        b.vx = Math.abs(b.vx) * BOUNCE;
      } else if (b.x > maxX) {
        b.x = maxX;
        b.vx = -Math.abs(b.vx) * BOUNCE;
      }
    }

    // Multi-ball collision
    for (let j = i + 1; j < balls.length; j++) {
      const o = balls[j];
      const dx = o.x - b.x;
      const dy = o.y - b.y;
      const distSq = dx * dx + dy * dy;
      const minDist = b.r + o.r;
      if (distSq < minDist * minDist) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;
        
        // Positional overlap resolution - CRITICAL to prevent sinking through floor
        const overlap = (minDist - dist) / 2;
        b.x -= nx * overlap;
        b.y -= ny * overlap;
        o.x += nx * overlap;
        o.y += ny * overlap;

        const dvx = b.vx - o.vx;
        const dvy = b.vy - o.vy;
        const dvDotN = dvx * nx + dvy * ny;
        if (dvDotN > 0) {
          // Suppress bounce for slow collisions to stabilize the pile
          const bounceMult = dvDotN < 1.0 ? 0 : BOUNCE;
          b.vx -= dvDotN * nx * bounceMult;
          b.vy -= dvDotN * ny * bounceMult;
          o.vx += dvDotN * nx * bounceMult;
          o.vy += dvDotN * ny * bounceMult;
        }
      }
    }
  }

  // Particles
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = cw;
    if (p.x > cw) p.x = 0;
    if (p.y < 0) p.y = ch;
    if (p.y > ch) p.y = 0;
  }
}

// Global cache for the static bucket canvas to prevent recreation on every frame
let bucketCacheCanvas: HTMLCanvasElement | null = null;
let lastBucketKey: string = '';
const spriteCache = new Map<string, HTMLCanvasElement>();

function preRenderBallSprites(balls: Ball[], dpr: number) {
  balls.forEach((b, i) => {
    const key = `${b.label}_${b.r}`;
    if (spriteCache.has(key)) return;

    const canvas = document.createElement('canvas');
    const size = b.r * 2.5; // Padding for glows
    canvas.width = size * 2 * dpr;
    canvas.height = size * 2 * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.translate(size, size);

    // DRAW LOGIC (copied from original loop but static)
    // Ambient Glow
    const outerGlow = ctx.createRadialGradient(0, 0, b.r * 0.8, 0, 0, b.r * 2.2);
    outerGlow.addColorStop(0, `hsla(${b.glowHue}, 70%, 50%, 0.15)`);
    outerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Sphere Body
    const bodyGrad = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.3, b.r * 0.1, 0, 0, b.r);
    bodyGrad.addColorStop(0, 'rgba(45, 47, 60, 1)');
    bodyGrad.addColorStop(0.8, 'rgba(15, 16, 22, 1)');
    bodyGrad.addColorStop(1, 'rgba(5, 5, 8, 1)');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();

    // Internal Refraction
    const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, b.r);
    innerGlow.addColorStop(0, `hsla(${b.glowHue}, 60%, 45%, 0.25)`);
    innerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = innerGlow;
    ctx.fill();

    // Gold Rim
    ctx.strokeStyle = `hsla(${b.glowHue}, 70%, 60%, 0.35)`;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Logo
    if (b.img && b.img.complete && b.img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, b.r * 0.75, 0, Math.PI * 2);
      ctx.clip();

      const imgWidth = b.img.naturalWidth;
      const imgHeight = b.img.naturalHeight;
      const targetSize = b.r * 1.55;

      if (b.isDouble) {
        ctx.drawImage(b.img, 0, 0, imgWidth / 2, imgHeight, -targetSize / 2, -targetSize / 2, targetSize, targetSize);
      } else {
        ctx.drawImage(b.img, -targetSize / 2, -targetSize / 2, targetSize, targetSize);
      }
      ctx.restore();
    }

    // Specular Highlights
    const spec1 = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.4, 0, -b.r * 0.3, -b.r * 0.4, b.r * 0.6);
    spec1.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    spec1.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = spec1;
    ctx.fill();

    spriteCache.set(key, canvas);
  });
}

function getCachedBucket(cw: number, ch: number, dpr: number, pulse: number, layout: Layout): HTMLCanvasElement {
  const { isMobile, bucketW, bucketBottom, bucketTop, bucketLeft, bucketRight, funnelH, funnelW } = layout;
  const key = `${cw}x${ch}x${dpr}_${bucketLeft}`;
  
  if (bucketCacheCanvas && lastBucketKey === key) {
    return bucketCacheCanvas;
  }

  bucketCacheCanvas = document.createElement('canvas');
  bucketCacheCanvas.width = cw * dpr;
  bucketCacheCanvas.height = ch * dpr;
  const ctx = bucketCacheCanvas.getContext('2d');
  if (!ctx) return bucketCacheCanvas;
  
  ctx.scale(dpr, dpr);
  lastBucketKey = key;

  ctx.globalCompositeOperation = 'source-over';

  // High-Tech Funnel Shape
  ctx.beginPath();
  ctx.moveTo(bucketLeft - funnelW, bucketTop - funnelH);
  ctx.lineTo(bucketLeft, bucketTop);
  ctx.lineTo(bucketLeft, bucketBottom - 30);
  ctx.quadraticCurveTo(bucketLeft, bucketBottom, bucketLeft + 30, bucketBottom);
  ctx.lineTo(bucketRight - 30, bucketBottom);
  ctx.quadraticCurveTo(bucketRight, bucketBottom, bucketRight, bucketBottom - 30);
  ctx.lineTo(bucketRight, bucketTop);
  ctx.lineTo(bucketRight + funnelW, bucketTop - funnelH);

  const glassGrad = ctx.createLinearGradient(0, bucketTop - funnelH, 0, bucketBottom);
  glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.01)');
  glassGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.03)');
  glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
  ctx.fillStyle = glassGrad;
  ctx.fill();



  const drawEnergySlant = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 1)';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x1 + (x1 < x2 ? -5 : 5), y1 - 2);
    ctx.lineTo(x2 + (x1 < x2 ? -5 : 5), y2 - 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.stroke();
    ctx.restore();
  };

  drawEnergySlant(bucketLeft - funnelW, bucketTop - funnelH, bucketLeft, bucketTop);
  drawEnergySlant(bucketRight + funnelW, bucketTop - funnelH, bucketRight, bucketTop);

  return bucketCacheCanvas;
}

/* ─── Draw ─── */
function drawScene(
  ctx: CanvasRenderingContext2D,
  balls: Ball[],
  particles: Particle[],
  popups: ScorePopup[],
  cw: number,
  ch: number,
  dpr: number,
  layout: Layout,
  score: number
) {
  ctx.clearRect(0, 0, cw * dpr, ch * dpr);
  ctx.save();
  ctx.scale(dpr, dpr);

  const isMobile = cw < 768;

  // 1. Background Nebula Auras
  ctx.globalCompositeOperation = 'screen';
  const time = Date.now() * 0.0005;
  const auroraCount = 3;
  for (let i = 0; i < auroraCount; i++) {
    const ax = cw * (0.5 + Math.cos(time + i * 2) * 0.3);
    const ay = ch * (0.5 + Math.sin(time * 0.8 + i) * 0.2);
    const grad = ctx.createRadialGradient(ax, ay, 0, ax, ay, cw * 0.6);
    grad.addColorStop(0, `hsla(35, 80%, 30%, ${0.05 + i * 0.02})`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
  }

  // 2. Particles
  ctx.globalCompositeOperation = 'lighter';
  for (const p of particles) {
    ctx.fillStyle = `hsla(${p.hue}, 50%, 80%, ${p.opacity})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. DRAW AGENTIC BUCKET (Behind Balls) — desktop only
  if (!isMobile) {
  const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;
  
  // Draw the pre-rendered bucket
  ctx.globalCompositeOperation = 'source-over';
  const cachedBucket = getCachedBucket(cw, ch, dpr, pulse, layout);
  // Important: when drawing the offscreen canvas, we need to temporarily
  // save and reset the transform because the offscreen canvas is already scaled by dpr
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform matrix to identity
  ctx.drawImage(cachedBucket, 0, 0);
  ctx.restore(); // Restore the standard scale(dpr, dpr) transform

  const { bucketBottom, bucketTop, bucketLeft, bucketRight, bucketW, funnelH, funnelW, hoop } = layout;

  // Add the dynamic pulsing rim and glows that need recalculation per frame
  ctx.save();
  const rimColor = `rgba(212, 175, 55, ${0.4 * pulse})`;
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bucketLeft - funnelW, bucketTop - funnelH);
  ctx.lineTo(bucketLeft, bucketTop);
  ctx.lineTo(bucketLeft, bucketBottom - 30);
  ctx.quadraticCurveTo(bucketLeft, bucketBottom, bucketLeft + 30, bucketBottom);
  ctx.lineTo(bucketRight - 30, bucketBottom);
  ctx.quadraticCurveTo(bucketRight, bucketBottom, bucketRight, bucketBottom - 30);
  ctx.lineTo(bucketRight, bucketTop);
  ctx.lineTo(bucketRight + funnelW, bucketTop - funnelH);
  ctx.stroke();
  ctx.restore();

  // Bottom corner glows
  const drawCornerGlow = (x: number, y: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 80);
    g.addColorStop(0, `rgba(212, 175, 55, ${0.1 * pulse})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(x - 80, y - 80, 160, 160);
  };
  drawCornerGlow(bucketLeft, bucketBottom);
  drawCornerGlow(bucketRight, bucketBottom);

  // 3.5 DRAW TUTORIAL TRAJECTORY ARC
  // If the user hasn't scored yet, draw a moving dashed line to show them what to do
  if (score === 0) {
    ctx.save();
    const timeSpeed = Date.now() * 0.003;
    ctx.setLineDash([15, 20]);
    ctx.lineDashOffset = -timeSpeed * 20; // Animate dashes moving towards hoop
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(212, 175, 55, ${0.2 + Math.sin(timeSpeed) * 0.3})`;
    
    // Draw an arc from the center of the bucket to the top of the hoop
    ctx.beginPath();
    ctx.moveTo(bucketLeft + (bucketW / 2), bucketTop + 50);
    // Control point high up in the middle to create an arc
    const cpX = bucketLeft + (bucketW / 2) + 100;
    const cpY = hoop.y - 150;
    ctx.quadraticCurveTo(cpX, cpY, hoop.x + hoop.w / 2, hoop.rimY);
    ctx.stroke();
    
    // Draw an arrow head at the hoop
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(hoop.x + hoop.w / 2 - 10, hoop.rimY - 20);
    ctx.lineTo(hoop.x + hoop.w / 2, hoop.rimY);
    ctx.lineTo(hoop.x + hoop.w / 2 + 10, hoop.rimY - 20);
    ctx.stroke();
    ctx.restore();
  }

  // 4. DRAW BASKETBALL HOOP (3D Perspective / Modern Neon)
  ctx.save();
  
  // Pulse factor for subtle breathing neon effect
  const bbPulse = Math.sin(Date.now() * 0.002) * 0.1 + 0.9;

  // Backboard (Volumetric Glassmorphism)
  const bbX = hoop.x + hoop.w * 0.1;
  const bbY = hoop.y - 20;
  const bbW = hoop.w * 0.8;
  const bbH = hoop.h * 0.7;
  
  // Glowing Backboard Shadow
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(212, 175, 55, 0.2)';
  
  // Glass Gradient Fill
  const glassGrad = ctx.createLinearGradient(bbX, bbY, bbX + bbW, bbY + bbH);
  glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
  glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
  ctx.fillStyle = glassGrad;
  
  ctx.beginPath();
  ctx.roundRect(bbX, bbY, bbW, bbH, 12);
  ctx.fill();
  
  // Sleek golden-orange border with pulsing opacity
  ctx.strokeStyle = `rgba(212, 175, 55, ${0.4 + bbPulse * 0.25})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  
  // Corner Accents (Futuristic brackets)
  const bracketSize = 6;
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
  ctx.lineWidth = 1.5;
  
  // Top-left bracket
  ctx.beginPath();
  ctx.moveTo(bbX + bracketSize, bbY + 2);
  ctx.lineTo(bbX + 2, bbY + 2);
  ctx.lineTo(bbX + 2, bbY + bracketSize);
  ctx.stroke();
  
  // Top-right bracket
  ctx.beginPath();
  ctx.moveTo(bbX + bbW - bracketSize, bbY + 2);
  ctx.lineTo(bbX + bbW - 2, bbY + 2);
  ctx.lineTo(bbX + bbW - 2, bbY + bracketSize);
  ctx.stroke();

  // Bottom-left bracket
  ctx.beginPath();
  ctx.moveTo(bbX + 2, bbY + bbH - bracketSize);
  ctx.lineTo(bbX + 2, bbY + bbH - 2);
  ctx.lineTo(bbX + bracketSize, bbY + bbH - 2);
  ctx.stroke();

  // Bottom-right bracket
  ctx.beginPath();
  ctx.moveTo(bbX + bbW - bracketSize, bbY + bbH - 2);
  ctx.lineTo(bbX + bbW - 2, bbY + bbH - 2);
  ctx.lineTo(bbX + bbW - 2, bbY + bbH - bracketSize);
  ctx.stroke();
  
  // Futuristic Glowing Inner Target Box
  ctx.save();
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(212, 175, 55, 0.3)';
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bbX + bbW/2 - 20, bbY + bbH - 45, 40, 30);
  ctx.restore();

  // 3D Rim (Neon Ellipse)
  const rimCY = hoop.rimY;
  const rimCX = hoop.x + hoop.w / 2;
  const rimRX = hoop.w / 2;
  const rimRY = 18; 
  
  // Outer Rim Neon Glow
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(rimCX, rimCY, rimRX, rimRY, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(212, 175, 55, ${0.7 + Math.sin(Date.now() * 0.005) * 0.15})`;
  ctx.lineWidth = 6;
  ctx.shadowBlur = 15;
  ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
  ctx.stroke();
  ctx.restore();

  // Inner Hot Core Rim
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(rimCX, rimCY, rimRX - 1, rimRY - 1, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
  
  // Sci-Fi Crossed-Mesh Net
  ctx.save();
  
  // Net attachment points calculation
  const netDrops = 8;
  const topPoints: {x: number, y: number}[] = [];
  const midPoints: {x: number, y: number}[] = [];
  const botPoints: {x: number, y: number}[] = [];

  const midRX = rimRX * 0.72;
  const botRX = rimRX * 0.45;
  
  for (let i = 0; i <= netDrops; i++) {
    const angle = Math.PI + (i / netDrops) * Math.PI; // Front half of ellipse
    
    // Top Attachment Points on Rim
    topPoints.push({
      x: rimCX + Math.cos(angle) * rimRX,
      y: rimCY + Math.sin(angle) * rimRY
    });
    
    // Mid level points
    midPoints.push({
      x: rimCX + Math.cos(angle) * midRX,
      y: rimCY + 22
    });

    // Bottom ring points
    botPoints.push({
      x: rimCX + Math.cos(angle) * botRX,
      y: rimCY + 45
    });
  }

  // Neon fading gradient for the net strings
  const netGrad = ctx.createLinearGradient(rimCX, rimCY, rimCX, rimCY + 45);
  netGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  netGrad.addColorStop(0.4, 'rgba(212, 175, 55, 0.35)');
  netGrad.addColorStop(1, 'rgba(212, 175, 55, 0.02)');
  ctx.strokeStyle = netGrad;
  ctx.lineWidth = 1.2;

  // Draw Crossed Net Mesh
  for (let i = 0; i <= netDrops; i++) {
    // 1. Top to Mid crossed lines
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(topPoints[i].x, topPoints[i].y);
      ctx.lineTo(midPoints[i - 1].x, midPoints[i - 1].y);
      ctx.stroke();
    }
    if (i < netDrops) {
      ctx.beginPath();
      ctx.moveTo(topPoints[i].x, topPoints[i].y);
      ctx.lineTo(midPoints[i + 1].x, midPoints[i + 1].y);
      ctx.stroke();
    }

    // 2. Mid to Bottom crossed lines
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(midPoints[i].x, midPoints[i].y);
      ctx.lineTo(botPoints[i - 1].x, botPoints[i - 1].y);
      ctx.stroke();
    }
    if (i < netDrops) {
      ctx.beginPath();
      ctx.moveTo(midPoints[i].x, midPoints[i].y);
      ctx.lineTo(botPoints[i + 1].x, botPoints[i + 1].y);
      ctx.stroke();
    }

    // 3. Vertical structural guidelines
    ctx.beginPath();
    ctx.moveTo(topPoints[i].x, topPoints[i].y);
    ctx.lineTo(midPoints[i].x, midPoints[i].y);
    ctx.lineTo(botPoints[i].x, botPoints[i].y);
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
  } // end !isMobile bucket/hoop block

  // 5. DRAW BALLS (Using Sprite Cache)
  for (const b of balls) {
    const key = `${b.label}_${b.r}`;
    const sprite = spriteCache.get(key);
    
    if (sprite) {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rotation);
      ctx.globalAlpha = b.opacity;
      
      const size = b.r * 2.5; 
      // Important: reset transform to draw pixel-perfect sprite if needed, 
      // but since we rotate, we just use the scaled dimensions.
      // The sprite itself was drawn with DPR scale, so we draw it at 1/DPR its pixel size.
      const drawSize = (size * 2); 
      ctx.drawImage(sprite, -size, -size, drawSize, drawSize);
      ctx.restore();
    } else {
      // Fallback to minimal draw if sprite missing (shouldn't happen)
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.fill();
    }
  }

  // 6. DRAW POPUPS (+10 Animations) — desktop only
  if (!isMobile) {
  const now = Date.now();
  for (let i = popups.length - 1; i >= 0; i--) {
    const pu = popups[i];
    const age = now - pu.birthTime;
    if (age > 1000) {
      popups.splice(i, 1);
      continue;
    }
    const progress = age / 1000;
    const py = pu.y - progress * 40; // float up 40px
    const alpha = 1 - progress;
    
    ctx.save();
    ctx.fillStyle = `rgba(212, 175, 55, ${alpha})`;
    ctx.font = 'bold 28px "Abril Fatface", serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(pu.text, pu.x, py);
    ctx.restore();
  }
  }

  ctx.restore();
}

export function TechStackSection() {
  const { content } = useContent();
  const { lang } = useLang();
  const t = (content[lang] as any)?.techStack;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionElRef = useRef<HTMLElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const rafRef = useRef<number>(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const lastScoreTime = useRef(0);

  const onScore = useCallback((x: number, y: number) => {
    scoreRef.current += 10;
    setScore(scoreRef.current);
    lastScoreTime.current = Date.now();
    popupsRef.current.push({ x, y, text: '+10', birthTime: Date.now() });
    
    // Play synthesis ping
    playScoreSound();
  }, []);

  // IntersectionObserver: track when section is ≥50% visible
  useEffect(() => {
    const el = sectionElRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        if (visible) setHasBeenVisible(true);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Pre-load images
  useEffect(() => {
    let loaded = 0;
    const imgs: (HTMLImageElement | null)[] = TECH_LOGOS.map(() => null);
    TECH_LOGOS.forEach((logo, i) => {
      const img = new Image();
      img.src = logo.src;
      img.onload = () => {
        imgs[i] = img;
        loaded++;
        if (loaded === TECH_LOGOS.length) {
          imagesRef.current = imgs;
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loaded++;
        if (loaded === TECH_LOGOS.length) {
          imagesRef.current = imgs;
          setImagesLoaded(true);
        }
      };
    });
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const cw = rect.width;
    const ch = rect.height;

    ballsRef.current = createBalls(cw, ch, imagesRef.current);
    particlesRef.current = createParticles(cw < 600 ? 30 : 60, cw, ch);

    return { cw, ch, dpr };
  }, []);

  useEffect(() => {
    if (!imagesLoaded || !hasBeenVisible) return;
    const dims = initCanvas();
    if (!dims) return;
    let { cw, ch, dpr } = dims;
    // Sprite pre-rendering trigger
    preRenderBallSprites(ballsRef.current, dpr);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const d = initCanvas();
      if (d) { cw = d.cw; ch = d.ch; dpr = d.dpr; }
      preRenderBallSprites(ballsRef.current, dpr);
    };
    window.addEventListener('resize', handleResize);

    let running = true;
    const tick = () => {
      if (!running) return;

      const layout = getLayout(cw, ch);

      stepPhysics(
        ballsRef.current,
        particlesRef.current,
        cw,
        ch,
        mouseRef.current.x,
        mouseRef.current.y,
        mouseRef.current.active,
        layout,
        onScore
      );
      drawScene(ctx, ballsRef.current, particlesRef.current, popupsRef.current, cw, ch, dpr, layout, scoreRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    if (isVisible) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [imagesLoaded, hasBeenVisible, isVisible, initCanvas, onScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateMouse = (x: number, y: number) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = x - rect.left;
      mouseRef.current.y = y - rect.top;
      mouseRef.current.active = true;
    };
    const onMouseMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY);
    const onMouseLeave = () => { mouseRef.current.active = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) updateMouse(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleDown = (e: MouseEvent | TouchEvent) => {
      // Init Audio Context on first interaction
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      } else if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        audioInit = true;
      }

      mouseRef.current.active = true;
      updateMouse(
        'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX,
        'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
      );
    };
    const onTouchEnd = () => { mouseRef.current.active = false; };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('touchstart', handleDown, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [imagesLoaded]);

  // Categorized tech logos for mobile marquee rows (expanded)
  const techCategories = [
    { name: 'Frontend', color: '#61DAFB', logos: ['React', 'Next.js', 'TypeScript', 'Tailwind', 'React Native'] },
    { name: 'Backend & Database', color: '#68A063', logos: ['Node.js', 'Express', 'Firebase', 'Supabase', 'MongoDB', 'Redis', 'Prisma', 'PostgreSQL'] },
    { name: 'Cloud & DevOps', color: '#FF9900', logos: ['Docker', 'GitHub Actions', 'Cloudflare', 'Kubernetes', 'DigitalOcean', 'AWS', 'Vercel'] },
    { name: 'AI / ML Stack', color: '#A855F7', logos: ['n8n', 'Hugging Face', 'TensorFlow', 'PyTorch', 'Pinecone', 'LangChain', 'OpenAI'] },
    { name: 'Agentic Stacks', color: '#FCD34D', logos: ['OpenClaw', 'NemoClaw', 'LangChain', 'n8n'] },
    { name: 'App Development', color: '#3DDC84', logos: ['React Native', 'Java', 'Kotlin', 'Swift', 'Android', 'iOS', 'Flutter'] },
  ];

  return (
    <section
      ref={sectionElRef}
      id="tech"
      className="section-dark relative overflow-hidden w-full lg:h-[100dvh]"
      style={{ background: '#060606' }}
    >
      {/* Background radial gradient for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #060606 100%)',
          opacity: 0.7
        }}
      />

      {/* Top Overlay to protect Header Legibility */}
      <div
        className="absolute inset-x-0 top-0 h-[50dvh] pointer-events-none z-10"
        style={{
          background: 'linear-gradient(to bottom, #060606 0%, rgba(6,6,6,0.8) 50%, rgba(6,6,6,0.4) 80%, transparent 100%)'
        }}
      />

      {/* Canvas Area — (Desktop: Full Screen / Mobile: Header Only) */}
      <div className="relative h-auto lg:h-full pt-10 pb-4 lg:pt-0 lg:pb-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0 hidden lg:block"
          style={{ touchAction: 'none' }}
        />

        {/* Header Overlay */}
        <div className="relative z-20 pointer-events-none h-auto lg:h-full flex flex-col items-center w-full">
          <div className="section-container lg:!pt-28 w-full">
            <div className="text-center">

              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-7xl font-black text-white tracking-tighter"
                style={{ fontFamily: "'Abril Fatface', serif" }}
              >
                {t?.title || 'Our Expertise'}
              </motion.h2>

              {/* Subtitle - mobile only */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="lg:hidden mt-2 text-sm text-white/40 font-medium"
              >
                Technologies We Power Your Vision With
              </motion.p>

              {/* Gamification Hud — desktop only */}
              <div className="hidden lg:flex flex-col items-center">
                <motion.div 
                  animate={{ 
                    scale: Date.now() - lastScoreTime.current < 300 ? [1, 1.2, 1] : 1,
                    color: Date.now() - lastScoreTime.current < 300 ? '#d4af37' : '#ffffff'
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl"
                >
                  <span className="text-xs uppercase tracking-[0.2em] font-medium text-white/50">Score</span>
                  <span className="text-2xl font-black tabular-nums">{score}</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: [0, 5, 0] }}
                  transition={{ 
                    opacity: { delay: 1, duration: 1 },
                    y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                  }}
                  className="mt-3 text-sm text-white/40 flex items-center gap-2"
                >
                  <span>Drag logos into the hoop!</span>
                  <span className="text-lg">🏀</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Mobile Marquee Rows (lg-) ═══ */}
      <div className="lg:hidden relative z-20 pb-10 pt-4 space-y-5">
        {techCategories.map((category, catIdx) => {
          const isReverse = catIdx % 2 !== 0;
          const logoItems = category.logos
            .map(label => TECH_LOGOS.find(l => l.label === label))
            .filter(Boolean) as typeof TECH_LOGOS;

          // Duplicate for infinite scroll
          const doubled = [...logoItems, ...logoItems];

          return (
            <motion.div
              key={category.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.5, delay: catIdx * 0.08 }}
            >
              {/* Category label */}
              <div className="flex items-center justify-center gap-3 mb-2.5 px-4">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, ${category.color}30)` }} />
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: category.color }}>
                  {category.name}
                </span>
                <div className="flex-1 h-[1px]" style={{ backgroundImage: `linear-gradient(to left, transparent, ${category.color}30)` }} />
              </div>

              {/* Marquee track with edge fade */}
              <div className="relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
                <div
                  className={isReverse ? 'marquee-track-reverse' : 'marquee-track'}
                  style={{ '--marquee-speed': `${22 + catIdx * 3}s` } as React.CSSProperties}
                >
                  {doubled.map((logo, i) => (
                    <div
                      key={`${logo.label}-${i}`}
                      className="flex items-center gap-2 px-4 py-2 mx-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] whitespace-nowrap flex-shrink-0"
                    >
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img
                          src={logo.src}
                          alt={logo.label}
                          className="w-full h-full object-cover rounded-full"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-white/70">
                        {logo.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      <WaveDivider fill="#060606" />
    </section>
  );
}

export default TechStackSection;
