import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';

/*  ═══════════════════════════════════════════════════════════
    HERO 3D VISUAL — Glassmorphic 3D Glove
    
    A stylized 3D hand/glove composed of capsules and spheres.
    Uses meshPhysicalMaterial + Environment preset for rich
    glass refraction.
    ═══════════════════════════════════════════════════════════ */

export function Hero3DVisual() {
  const groupRef = useRef<any>(null);
  const prefersReducedMotion = useReducedMotion();
  const startTime = useRef(Date.now());

  // Geometries for the glove parts
  const palmGeometry = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);
  const baseGeometry = useMemo(() => new THREE.CylinderGeometry(1, 1.1, 1.5, 32), []);
  const thumbGeometry = useMemo(() => new THREE.CapsuleGeometry(0.35, 1.2, 16, 16), []);
  const indexGeometry = useMemo(() => new THREE.CapsuleGeometry(0.3, 1.4, 16, 16), []);
  const middleGeometry = useMemo(() => new THREE.CapsuleGeometry(0.3, 1.6, 16, 16), []);
  const ringGeometry = useMemo(() => new THREE.CapsuleGeometry(0.3, 1.4, 16, 16), []);
  const pinkyGeometry = useMemo(() => new THREE.CapsuleGeometry(0.25, 1.1, 16, 16), []);

  // Shared glass material
  const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#312e81",
    transmission: 0.92,
    thickness: 3,
    roughness: 0.03,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    ior: 2.4,
    envMapIntensity: 2.5,
    iridescence: 0.8,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 800],
    specularIntensity: 1,
    specularColor: new THREE.Color('#6366f1'),
    transparent: true,
    side: THREE.DoubleSide,
    toneMapped: false
  }), []);

  // Inner core material to give the palm depth
  const coreMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#4338ca",
    transparent: true,
    opacity: 0.15,
    toneMapped: false
  }), []);

  useFrame((_, delta) => {
    if (prefersReducedMotion) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / 1.5, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    if (groupRef.current) {
      if (progress < 1) {
        groupRef.current.scale.setScalar(easeProgress);
      } else {
        groupRef.current.scale.setScalar(1);
      }
      
      // Gentle floating animation
      groupRef.current.rotation.y = -0.4 + Math.sin(elapsed * 0.5) * 0.1;
      groupRef.current.rotation.x = -0.2 + Math.sin(elapsed * 0.3) * 0.05;
      groupRef.current.position.y = Math.sin(elapsed * 0.8) * 0.1;
    }
  });

  return (
    <group position={[1.5, -0.5, -1]}>
      <Environment preset="night" background={false} />

      {/* Lighting setup for optimal glass refraction */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={3} color="#4338ca" />
      <directionalLight position={[-8, -5, -10]} intensity={1.5} color="#1e3a5f" />
      <pointLight position={[0, 0, 5]} intensity={2} color="#c7d2fe" />
      <pointLight position={[-5, 3, -2]} intensity={1} color="#6366f1" />

      <Float speed={prefersReducedMotion ? 0 : 2} rotationIntensity={prefersReducedMotion ? 0 : 0.5} floatIntensity={prefersReducedMotion ? 0 : 1}>
        <group ref={groupRef} scale={0} rotation={[-0.2, -0.4, 0.1]}>
          
          {/* Base / Wrist */}
          <mesh position={[0, -1.8, 0]} scale={[1.4, 1, 0.7]} geometry={baseGeometry} material={glassMaterial} />

          {/* Palm */}
          <group position={[0, 0, 0]}>
             <mesh scale={[1.8, 2.2, 0.8]} geometry={palmGeometry} material={glassMaterial} />
             {/* Inner luminous core for depth */}
             <mesh scale={[1.2, 1.5, 0.5]} geometry={palmGeometry} material={coreMaterial} />
          </group>

          {/* Thumb */}
          <group position={[-1.2, -0.5, 0.4]} rotation={[0, 0, 0.8]}>
            <mesh position={[0, 0.6, 0]} geometry={thumbGeometry} material={glassMaterial} />
          </group>

          {/* Index Finger */}
          <group position={[-0.7, 1.5, 0.1]} rotation={[0, 0, 0.1]}>
            <mesh position={[0, 0.7, 0]} geometry={indexGeometry} material={glassMaterial} />
          </group>

          {/* Middle Finger */}
          <group position={[0, 1.7, 0]} rotation={[0, 0, 0]}>
            <mesh position={[0, 0.8, 0]} geometry={middleGeometry} material={glassMaterial} />
          </group>

          {/* Ring Finger */}
          <group position={[0.7, 1.5, -0.1]} rotation={[0, 0, -0.1]}>
            <mesh position={[0, 0.7, 0]} geometry={ringGeometry} material={glassMaterial} />
          </group>

          {/* Pinky Finger */}
          <group position={[1.3, 1.1, -0.2]} rotation={[0, 0, -0.25]}>
            <mesh position={[0, 0.6, 0]} geometry={pinkyGeometry} material={glassMaterial} />
          </group>

        </group>
      </Float>
    </group>
  );
}
