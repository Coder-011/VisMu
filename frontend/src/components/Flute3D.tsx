import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder } from '@react-three/drei';
import * as THREE from 'three';

/**
 * holeStates: boolean[5] — [thumb, index, middle, ring, pinky]
 * true  = finger bent DOWN  = hole CLOSED = air blocked = dark (no glow)
 * false = finger extended   = hole OPEN   = air flows   = cyan neon glow
 */
interface Flute3DProps {
  holeStates: boolean[];
  currentNote?: string;
}

const BLOW_HOLE_X = -2.3;
// 5 finger holes — 1:1 with holeStates[0..4]
const FINGER_HOLE_X = [-1.2, -0.6, 0.0, 0.6, 1.2];

const Flute3D: React.FC<Flute3DProps> = ({ holeStates }) => {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(0);

  // Validate length
  if (holeStates.length !== 5) {
    console.warn(`Flute3D: expected holeStates length 5, got ${holeStates.length}`);
  }

  useFrame((state) => {
    t.current = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t.current * 0.6) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>

      {/* Main bamboo body */}
      <Cylinder args={[0.18, 0.18, 6, 32]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#8B6914" roughness={0.75} metalness={0.0} />
      </Cylinder>

      {/* Inner bore */}
      <Cylinder args={[0.13, 0.13, 6.1, 16]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#3a1e00" roughness={1} />
      </Cylinder>

      {/* Bamboo nodes */}
      {[-2.0, -0.5, 1.0, 2.2].map((x, i) => (
        <Cylinder key={i} args={[0.195, 0.195, 0.09, 32]} rotation={[0, 0, Math.PI / 2]} position={[x, 0, 0]}>
          <meshStandardMaterial color="#5a3a08" roughness={0.9} />
        </Cylinder>
      ))}

      {/* Left end cap */}
      <Cylinder args={[0.18, 0.14, 0.18, 32]} rotation={[0, 0, Math.PI / 2]} position={[-3.09, 0, 0]}>
        <meshStandardMaterial color="#3a1e00" roughness={0.9} />
      </Cylinder>

      {/* Right open end */}
      <Cylinder args={[0.20, 0.18, 0.12, 32]} rotation={[0, 0, Math.PI / 2]} position={[3.06, 0, 0]}>
        <meshStandardMaterial color="#5a3a08" roughness={0.85} />
      </Cylinder>

      {/* Blowing hole — always open, no glow */}
      <group position={[BLOW_HOLE_X, 0.185, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.0, 0.055, 32]} />
          <meshStandardMaterial color="#1a0800" roughness={1} />
        </mesh>
      </group>

      {/* Binding threads near mouthpiece */}
      {[-2.6, -2.45].map((x, i) => (
        <Cylinder key={i} args={[0.20, 0.20, 0.025, 32]} rotation={[0, 0, Math.PI / 2]} position={[x, 0, 0]}>
          <meshStandardMaterial color="#8B0000" roughness={0.8} />
        </Cylinder>
      ))}

      {/* 5 finger holes — open = cyan glow, closed = dark */}
      {FINGER_HOLE_X.map((x, idx) => {
        // 1:1 mapping — no duplication
        const closed = holeStates[idx] ?? false;
        // open hole: air flows → bright cyan glow
        // closed hole: air blocked → dark
        const isOpen = !closed;
        const pulse = isOpen ? 1.0 + Math.sin(t.current * 5 + idx * 1.1) * 0.4 : 0;

        return (
          <group key={idx} position={[x, 0.185, 0]}>
            {/* Rim — always visible */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.045, 0.075, 32]} />
              <meshStandardMaterial color="#1a0800" roughness={1} />
            </mesh>

            {/* Hole fill: open=cyan glow, closed=dark */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.045, 32]} />
              <meshStandardMaterial
                color={isOpen ? '#00f2ff' : '#1a0800'}
                emissive={isOpen ? '#00f2ff' : '#000000'}
                emissiveIntensity={pulse}
                roughness={0.1}
                metalness={0.2}
              />
            </mesh>

            {/* Neon glow halo — only when OPEN */}
            {isOpen && (
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
          </group>
        );
      })}

    </group>
  );
};

export default Flute3D;
