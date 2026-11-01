import { useState, useEffect } from 'react';

export type DeviceTier = 'low' | 'mid' | 'high';

export interface DevicePerformance {
  tier: DeviceTier;
  isLowEnd: boolean;
  isMidTier: boolean;
  isHighEnd: boolean;
  maxDpr: number;
  saveData: boolean;
  reducedMotion: boolean;
  cores: number;
  memory: number;
  canRunHeavy3D: boolean;
  canRunComplexCanvas: boolean;
}

const DEFAULT_PERF: DevicePerformance = {
  tier: 'high',
  isLowEnd: false,
  isMidTier: false,
  isHighEnd: true,
  maxDpr: 1.5,
  saveData: false,
  reducedMotion: false,
  cores: 8,
  memory: 8,
  canRunHeavy3D: true,
  canRunComplexCanvas: true,
};

export function useDevicePerformance(): DevicePerformance {
  const [performance, setPerformance] = useState<DevicePerformance>(() => {
    if (typeof window === 'undefined') return DEFAULT_PERF;

    // Fast initial synchronous check
    const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;
    // @ts-ignore
    const memory = typeof navigator !== 'undefined' ? (navigator.deviceMemory || 4) : 4;
    // @ts-ignore
    const conn = typeof navigator !== 'undefined' ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection) : null;
    const saveData = conn?.saveData === true;
    const slowConn = conn?.effectiveType === '2g' || conn?.effectiveType === '3g';
    const isMobile = window.innerWidth < 768;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isLowEndDevice = isMobile || cores <= 4 || memory <= 4 || saveData || slowConn || reducedMotion;
    const tier: DeviceTier = isLowEndDevice ? 'low' : (cores <= 6 || memory <= 6) ? 'mid' : 'high';

    return {
      tier,
      isLowEnd: isLowEndDevice,
      isMidTier: tier === 'mid',
      isHighEnd: tier === 'high',
      maxDpr: isLowEndDevice ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
      saveData,
      reducedMotion,
      cores,
      memory,
      canRunHeavy3D: !isLowEndDevice,
      canRunComplexCanvas: !isLowEndDevice && !reducedMotion,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePerf = () => {
      const cores = navigator.hardwareConcurrency || 4;
      // @ts-ignore
      const memory = navigator.deviceMemory || 4;
      // @ts-ignore
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const saveData = conn?.saveData === true;
      const slowConn = conn?.effectiveType === '2g' || conn?.effectiveType === '3g';
      const isMobile = window.innerWidth < 768;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Low end if low RAM (<=4GB), low cores (<=4), mobile viewport, data saver, or slow network
      const isLowEndDevice = isMobile || cores <= 4 || memory <= 4 || saveData || slowConn || reducedMotion;
      const tier: DeviceTier = isLowEndDevice ? 'low' : (cores <= 6 || memory <= 6) ? 'mid' : 'high';

      // Attach data attribute & class to <html> for pure-CSS hardware-adaptive optimizations
      const root = document.documentElement;
      root.setAttribute('data-perf-tier', tier);
      if (isLowEndDevice) {
        root.classList.add('low-perf-device');
      } else {
        root.classList.remove('low-perf-device');
      }

      setPerformance({
        tier,
        isLowEnd: isLowEndDevice,
        isMidTier: tier === 'mid',
        isHighEnd: tier === 'high',
        maxDpr: isLowEndDevice ? 1 : Math.min(window.devicePixelRatio || 1, 1.5),
        saveData,
        reducedMotion,
        cores,
        memory,
        canRunHeavy3D: !isLowEndDevice,
        canRunComplexCanvas: !isLowEndDevice && !reducedMotion,
      });
    };

    updatePerf();

    window.addEventListener('resize', updatePerf, { passive: true });
    return () => window.removeEventListener('resize', updatePerf);
  }, []);

  return performance;
}
