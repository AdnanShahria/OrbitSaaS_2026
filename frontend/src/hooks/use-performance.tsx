import { useState, useEffect } from 'react';

interface DevicePerformance {
  isLowEnd: boolean;
  maxDpr: number;
}

export function useDevicePerformance(): DevicePerformance {
  const [performance, setPerformance] = useState<DevicePerformance>({
    isLowEnd: false,
    maxDpr: 2,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth < 768;
    
    const cores = navigator.hardwareConcurrency || 4;
    // @ts-ignore - deviceMemory is not in standard typescript DOM types yet
    const memory = navigator.deviceMemory || 4;
    
    // Consider device low end if it's a mobile device or just generally low spec (<=4 cores or <=4GB RAM)
    const isLowEndDevice = isMobile || cores <= 4 || memory <= 4;
    
    // Determine maximum pixel ratio. 
    // Cap to 1 for low-end, 1.5 for high-end (to prevent 4k/5k fill-rate lag)
    const maxDpr = isLowEndDevice ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    
    setPerformance({
      isLowEnd: isLowEndDevice,
      maxDpr,
    });
  }, []);

  return performance;
}
