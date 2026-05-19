import React, { useEffect, useRef, useState } from 'react';

interface WaveDividerProps {
  fill?: string;
  className?: string;
  flip?: boolean;
}

export function WaveDivider({ 
  fill = "#FAFAFA", 
  className = "",
  flip = false
}: WaveDividerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // High-frequency, VERY low-amplitude path. 
  // Exactly 6 complete waves. 
  // ViewBox midpoint is 30. Q control points shifted slightly to 20 to heavily flatten the wave amplitude.
  const pathD = "M0,30 Q50,20 100,30 T200,30 Q250,20 300,30 T400,30 Q450,20 500,30 T600,30 Q650,20 700,30 T800,30 Q850,20 900,30 T1000,30 Q1050,20 1100,30 T1200,30";

  useEffect(() => {
    // Only animate when the divider itself is visible on screen
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { 
      rootMargin: "50px 0px" // Start animating slightly before it enters screen
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const WaveSVG = () => (
    <svg 
      className="w-1/2 h-full flex-shrink-0" 
      viewBox="0 0 1200 60" 
      preserveAspectRatio="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d={`${pathD} L1200,60 L0,60 Z`}
        fill={fill}
        className="transition-colors duration-700"
      />
      {/* Outer Golden Glow (Multiple fast paths simulate blur) */}
      <path d={pathD} fill="none" stroke="rgba(212, 160, 23, 0.15)" strokeWidth="6" />
      {/* Inner Bright Glow */}
      <path d={pathD} fill="none" stroke="rgba(232, 180, 35, 0.4)" strokeWidth="3" />
      {/* Razor-sharp Core Line - Luminous Gold */}
      <path d={pathD} fill="none" stroke="#F5C542" strokeWidth="1" />
    </svg>
  );

  return (
    <div 
      ref={containerRef}
      // Height heavily reduced for lower amplitude aesthetic
      className={`absolute bottom-[-1px] left-0 w-full overflow-hidden leading-[0] z-20 pointer-events-none h-[20px] md:h-[35px] !border-none !shadow-none ${className}`}
      style={{ transform: flip ? 'scaleY(-1)' : 'none' }}
    >
      <style>
        {`
          @keyframes wave-scroll-gpu {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .animate-wave-gpu {
            /* Speed increased slightly as requested */
            animation: wave-scroll-gpu 8s linear infinite;
            will-change: transform;
          }
        `}
      </style>
      <div 
        className={`absolute top-0 left-0 w-[200%] h-full flex transform-gpu ${isVisible ? 'animate-wave-gpu' : ''}`}
        style={{ animationPlayState: isVisible ? 'running' : 'paused' }}
      >
        <WaveSVG />
        <WaveSVG />
      </div>
    </div>
  );
}
