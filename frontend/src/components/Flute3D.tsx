import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface Flute3DProps {
  holeStates: boolean[];
  currentNote?: string;
}

// C-scale bansuri: 6 finger holes evenly spaced in lower half of flute
// Flute body: 6 units long, radius 0.18
// Blowing hole near left end, 6 finger holes spread across middle-right
const BLOW_HOLE_X = -2.3;
const FINGER_HOLE_X = [-1.2, -0.7, -0.2, 0.3, 0.8, 1.3];

const Flute3D: React.FC<Flute3DProps> = ({ holeStates }) => {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((state) => {
    t.current = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t.current * 0.6) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>

      {/* ── Main bamboo body ── */}
      <Cylinder args={[0.18, 0.18, 6, 32]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#8B6914" roughness={0.75} metalness={0.0} />
      </Cylinder>

      {/* Inner bore (slightly darker cylinder inside) */}
      <Cylinder args={[0.13, 0.13, 6.1, 16]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#3a1e00" roughness={1} />
      </Cylinder>

      {/* ── Bamboo nodes (natural joints) ── */}
      {[-2.0, -0.5, 1.0, 2.2].map((x, i) => (
        <Cylinder key={i} args={[0.195, 0.195, 0.09, 32]} rotation={[0, 0, Math.PI / 2]} position={[x, 0, 0]}>
          <meshStandardMaterial color="#5a3a08" roughness={0.9} />
        </Cylinder>
      ))}

      {/* ── Left end cap (closed end) ── */}
      <Cylinder args={[0.18, 0.14, 0.18, 32]} rotation={[0, 0, Math.PI / 2]} position={[-3.09, 0, 0]}>
        <meshStandardMaterial color="#3a1e00" roughness={0.9} />
      </Cylinder>

      {/* ── Right end (open end) — slightly flared ── */}
      <Cylinder args={[0.20, 0.18, 0.12, 32]} rotation={[0, 0, Math.PI / 2]} position={[3.06, 0, 0]}>
        <meshStandardMaterial color="#5a3a08" roughness={0.85} />
      </Cylinder>

      {/* ── Blowing hole (embouchure) — always open, no glow ── */}
      <group position={[BLOW_HOLE_X, 0.185, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.055, 32]} />
          <meshStandardMaterial color="#1a0800" roughness={1} />
        </mesh>
      </group>

      {/* ── 6 finger holes ── */}
      {FINGER_HOLE_X.map((x, idx) => {
        // Map to holeStates: idx 0 = thumb (H1), 1-4 = fingers
        // For display we show 5 states across 6 holes (last two share pinky state)
        const stateIdx = idx < 5 ? idx : 4;
        const closed = holeStates[stateIdx] ?? false;
        const pulse = 1.0 + Math.sin(t.current * 5 + idx * 1.1) * 0.4;

        return (
          <group key={idx} position={[x, 0.185, 0]}>
            {/* Hole rim — always visible dark ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.045, 0.075, 32]} />
              <meshStandardMaterial color="#1a0800" roughness={1} />
            </mesh>

            {/* Hole fill */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.045, 32]} />
              <meshStandardMaterial
                color={closed ? '#00f2ff' : '#0d0500'}
                emissive={closed ? '#00f2ff' : '#000000'}
                emissiveIntensity={closed ? pulse : 0}
                roughness={0.1}
                metalness={0.2}
              />
            </mesh>

            {/* Neon glow halo — only when closed */}
            {closed && (
              <>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.045, 0.13, 32]} />
                  <meshBasicMaterial
                    color="#00f2ff"
                    transparent
                    opacity={0.18 + Math.sin(t.current * 5 + idx) * 0.07}
                  />
                </mesh>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.13, 0.22, 32]} />
                  <meshBasicMaterial
                    color="#00f2ff"
                    transparent
                    opacity={0.06 + Math.sin(t.current * 5 + idx) * 0.03}
                  />
                </mesh>
                <pointLight color="#00f2ff" intensity={2.0} distance={0.9} decay={2} />
              </>
            )}

            {/* Open hole — subtle dark depression */}
            {!closed && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.045, 0.075, 32]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.4} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* ── Binding thread near mouthpiece ── */}
      {[-2.6, -2.45].map((x, i) => (
        <Cylinder key={i} args={[0.20, 0.20, 0.025, 32]} rotation={[0, 0, Math.PI / 2]} position={[x, 0, 0]}>
          <meshStandardMaterial color="#8B0000" roughness={0.8} />
        </Cylinder>
      ))}

    </group>
  );
};

export default Flute3D;
