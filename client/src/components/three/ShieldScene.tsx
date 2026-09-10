import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Shield, RadarIcon } from 'lucide-react';
import { usePrefersReducedMotion, useWebGL } from '../../hooks/useObserver';

const THREATS = [
  { label: 'Phishing', color: '#ef4444', angle: 0.2, speed: 0.35 },
  { label: 'Payment', color: '#f97316', angle: 1.2, speed: 0.28 },
  { label: 'Identity', color: '#a855f7', angle: 2.4, speed: 0.42 },
  { label: 'Link', color: '#eab308', angle: 3.6, speed: 0.31 },
  { label: 'Social Eng.', color: '#22d3ee', angle: 4.8, speed: 0.22 },
];

function Particles({ count = 700 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#7dd3fc" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function ShieldCore({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const { pointer } = useThree();

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    const g = group.current;
    const inn = inner.current;
    const r1 = ring1.current;
    const r2 = ring2.current;
    if (g) {
      const px = pointer.x * 0.45;
      const py = pointer.y * 0.35;
      g.rotation.y = px + Math.sin(t * 0.25) * 0.15;
      g.rotation.x = py + Math.cos(t * 0.2) * 0.1;
      g.position.x += (px * 0.3 - g.position.x) * 0.05;
      g.position.y += (py * 0.3 - g.position.y) * 0.05;
    }
    if (inn) {
      const s = 1 + Math.sin(t * 1.6) * 0.05;
      inn.scale.setScalar(s);
      const m = inn.material as THREE.MeshBasicMaterial;
      m.opacity = 0.35 + Math.sin(t * 1.6) * 0.1;
    }
    if (r1) r1.rotation.z = t * 0.4;
    if (r2) r2.rotation.z = -t * 0.25;
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.28} />
      </mesh>
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.9, 2]} />
        <meshBasicMaterial color="#4452ff" wireframe transparent opacity={0.35} />
      </mesh>
      <mesh ref={ring1} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[1.85, 0.012, 12, 80]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.5} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 1.8, 0, 0]}>
        <torusGeometry args={[2.15, 0.01, 12, 80]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function ThreatNodes({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null);
  const refs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    THREATS.forEach((threat, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const a = threat.angle + t * threat.speed;
      const r = 2.6 + Math.sin(t * 0.7 + i) * 0.18;
      mesh.position.set(Math.cos(a) * r, Math.sin(a * 0.7 + i) * 0.35, Math.sin(a) * r);
      const m = mesh.material as THREE.MeshBasicMaterial;
      m.opacity = 0.7 + Math.sin(t * 2 + i) * 0.3;
    });
  });

  return (
    <group ref={group}>
      {THREATS.map((threat, i) => (
        <mesh
          key={threat.label}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshBasicMaterial color={threat.color} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Scene(props: { reduced: boolean }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 4, 4]} intensity={0.8} />
      <Particles />
      <ShieldCore reduced={props.reduced} />
      <ThreatNodes reduced={props.reduced} />
    </>
  );
}

function StaticFallback() {
  return (
    <div className="relative grid h-full w-full place-items-center">
      <div className="relative grid aspect-square w-56 place-items-center rounded-full border border-accent/20 bg-ink-900/60 shadow-glow">
        <div className="absolute inset-4 rounded-full border border-accent/10" />
        <Shield className="size-20 text-accent/70" strokeWidth={1} aria-hidden="true" />
      </div>
    </div>
  );
}

export function ShieldScene({ interactive = true, className = '' }: { interactive?: boolean; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const webgl = useWebGL();
  const showScene = webgl && !reduced;

  if (!showScene) {
    return (
      <div className={className} aria-hidden="true">
        <StaticFallback />
      </div>
    );
  }

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene reduced={reduced} />
        </Suspense>
      </Canvas>
    </div>
  );
}