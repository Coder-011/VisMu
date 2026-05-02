import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder } from '@react-three/drei';
import * as THREE from 'three';

/**
 * C-scale bansuri — 6 finger holes
 * holeStates[i] = true  → finger DOWN → hole COVERED → neon cyan glow (note is playing)
 * holeStates[i] = false → finger UP   → hole OPEN    → dark (air escaping)
 *
 * Hole → Note mapping (from left/mouthpiece end):
 *   H1 (thumb)  — all 6 closed = Sa
 *   H2 (index)  — H1 open      = Re
 *   H3 (middle) — H1+H2 open   = Ga
 *   H4 (ring)   — H1+H2+H3 open = Ma
 *   H5 (pinky)  — H1..H4 open  = Pa
 *   H6 (pinky2) — H1..H5 open  = Dha
 *   All open                    = Ni
 */
interface Flute3DProps {
  holeStates: boolean[];
  currentNote?: string;
}

// 6 finger holes evenly spaced along the body
const FINGER_HOLE_X = [-1.5, -0.9, -0.3, 0.3, 0.9, 1.5];
const BLOW_HOLE_X = -2.4;

const Flute3D: React.FC<Flute3DProps> = ({ holeStates }) => {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((state) => {
    t.current = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t.current * 0.6) * 0.05;
    }
  });

  const safeStates = holeStates.length === 6 ? holeStates : Array(6).fill(false);

  return (
    <group ref={groupRef}>

      {/* ── Bamboo body ── */}
      <Cylinder args={[0.18, 0.18, 6.5, 32]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#8B6914" roughness={0.75} metalness={0.0} />
      </Cylinder>

      {/* Inner bore (darker) */}
      <Cylinder args={[0.12, 0.12, 6.6, 16]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#2a1200" roughness={1} />
      </Cylinder>

      {/* Bamboo nodes */}
      {[-2.2, -0.7, 0.8, 2.3].map((x, i) => (
        <Cylinder key={i} args={[0.195, 0.195, 0.1, 32]} rotation={[0, 0, Math.PI / 2]} position={[x, 0, 0]}>
          <meshStandardMaterial color="#4a2e08" roughness={0.95} />
        </Cylinder>
      ))}

      {/* Left end cap (closed/mouthpiece end) */}
      <Cylinder args={[0.19, 0.14, 0.2, 32]} rotation={[0, 0, Math.PI / 2]} position={[-3.35, 0, 0]}>
        <meshStandardMaterial color="#2a1200" roughness={0.9} />
      </Cylinder>

      {/* Right open end (bell) */}
      <Cylinder args={[0.21, 0.18, 0.15, 32]} rotation={[0, 0, Math.PI / 2]} position={[3.32, 0, 0]}>
        <meshStandardMaterial color="#4a2e08" roughness={0.85} />
      </Cylinder>

      {/* Binding threads near mouthpiece */}
      {[-3.0, -2.82].map((x, i) => (
        <Cylinder key={i} args={[0.205, 0.205, 0.03, 32]} rotation={[0, 0, Math.PI / 2]} position={[x, 0, 0]}>
          <meshStandardMaterial color="#8B0000" roughness={0.7} />
        </Cylinder>
      ))}

      {/* Blowing hole (embouchure) — always dark, no glow */}
      <group position={[BLOW_HOLE_X, 0.185, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, 0.06, 32]} />
          <meshStandardMaterial color="#0a0500" roughness={1} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.06, 0.09, 32]} />
          <meshStandardMaterial color="#1a0800" roughness={1} />
        </mesh>
      </group>

      {/* ── 6 finger holes ── */}
      {FINGER_HOLE_X.map((x, idx) => {
        const covered = safeStates[idx] ?? false;
        const pulse = covered ? 1.2 + Math.sin(t.current * 5 + idx * 1.1) * 0.4 : 0;

        return (
          <group key={idx} position={[x, 0.185, 0]}>
            {/* Rim ring — always visible */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.048, 0.08, 32]} />
              <meshStandardMaterial color="#1a0800" roughness={1} />
            </mesh>

            {/* Hole fill: covered = cyan glow, open = dark */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.048, 32]} />
              <meshStandardMaterial
                color={covered ? '#00f2ff' : '#0a0500'}
                emissive={covered ? '#00f2ff' : '#000000'}
                emissiveIntensity={pulse}
                roughness={0.1}
                metalness={0.3}
              />
            </mesh>

            {/* Neon glow halo — only when covered/playing */}
            {covered && (
              <>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.048, 0.14, 32]} />
                  <meshBasicMaterial
                    color="#00f2ff"
                    transparent
                    opacity={0.2 + Math.sin(t.current * 5 + idx) * 0.08}
                  />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.14, 0.24, 32]} />
                  <meshBasicMaterial
                    color="#00f2ff"
                    transparent
                    opacity={0.07 + Math.sin(t.current * 5 + idx) * 0.03}
                  />
                </mesh>
                <pointLight color="#00f2ff" intensity={2.5} distance={1.0} decay={2} />
              </>
            )}
          </group>
        );
      })}

    </group>
  );
};

export default Flute3D;
