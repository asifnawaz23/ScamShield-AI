import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePrefersReducedMotion, useWebGL } from '../../hooks/useObserver';

/**
 * A slowly-rotating dot-matrix globe — points distributed on a sphere surface
 * (Fibonacci sphere) so it reads like a wireframe/dotted earth, with a faint
 * wireframe shell and a soft glow. Used as the Login/Signup background.
 */
function GlobeDots({ count = 2600, radius = 2 }: { count?: number; radius?: number }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const golden = Math.PI * (3 - Math.sqrt(5)); // golden angle
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // -1..1
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      arr[i * 3] = Math.cos(theta) * r * radius;
      arr[i * 3 + 1] = y * radius;
      arr[i * 3 + 2] = Math.sin(theta) * r * radius;
    }
    return arr;
  }, [count, radius]);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.028} color="#38bdf8" transparent opacity={0.9} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function GlobeShell({ radius = 2 }: { radius?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius * 0.985, 40, 40]} />
      <meshBasicMaterial color="#0891b2" wireframe transparent opacity={0.08} />
    </mesh>
  );
}

/** Faint orbiting particles around the globe for depth. */
function OrbitDust({ count = 300 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.8 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y -= delta * 0.02;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#7dd3fc" transparent opacity={0.4} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Scene() {
  return (
    <group rotation={[0.35, 0, 0.15]}>
      <GlobeShell />
      <GlobeDots />
      <OrbitDust />
    </group>
  );
}

export function GlobeScene({ className = '' }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const webgl = useWebGL();

  // No WebGL or reduced-motion → render nothing; the AuthShell CSS glow remains
  // as a graceful, lightweight fallback.
  if (!webgl || reduced) return null;

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
