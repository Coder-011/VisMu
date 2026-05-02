import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface Flute3DProps {
  holeStates: boolean[];
  currentNote?: string;
}

const HOLE_X = [-1.5, -0.9, -0.3, 0.3, 0.9, 1.5];

const Flute3D: React.FC<Flute3DProps> = ({ holeStates }) => {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((state) => {
    t.current = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t.current * 0.7) * 0.06;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main bamboo body — horizontal, fits in view */}
      <Cylinder args={[0.22, 0.22, 5, 32]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#7a5230" roughness={0.8} metalness={0.05} />
      </Cylinder>

      {/* Bamboo node rings */}
      {[-1.8, -0.6, 0.6, 1.8].map((x, i) => (
        <Cylinder key={i} args={[0.235, 0.235, 0.07, 32]} rotation={[0, 0, Math.PI / 2]} position={[x, 0, 0]}>
          <meshStandardMaterial color="#4a2e10" roughness={1} />
        </Cylinder>
      ))}

      {/* Left end cap (mouthpiece) */}
      <Cylinder args={[0.24, 0.18, 0.2, 32]} rotation={[0, 0, Math.PI / 2]} position={[-2.6, 0, 0]}>
        <meshStandardMaterial color="#3a1e08" roughness={0.9} />
      </Cylinder>

      {/* Holes */}
      {HOLE_X.map((x, idx) => {
        const closed = holeStates[idx] ?? false;
        const glow = closed ? 1.0 + Math.sin(t.current * 5 + idx * 1.2) * 0.4 : 0;

        return (
          <group key={idx} position={[x, 0.23, 0]}>
            {/* Dark rim always visible */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.07, 0.11, 32]} />
              <meshStandardMaterial color="#1a0a00" roughness={1} />
            </mesh>

            {/* Hole centre */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.07, 32]} />
              <meshStandardMaterial
                color={closed ? '#00f2ff' : '#080808'}
                emissive={closed ? '#00f2ff' : '#000000'}
                emissiveIntensity={glow}
                roughness={0.1}
              />
            </mesh>

            {/* Outer glow halo */}
            {closed && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.07, 0.18, 32]} />
                <meshBasicMaterial
                  color="#00f2ff"
                  transparent
                  opacity={0.15 + Math.sin(t.current * 5 + idx) * 0.08}
                />
              </mesh>
            )}

            {closed && <pointLight color="#00f2ff" intensity={2.5} distance={1.0} decay={2} />}
          </group>
        );
      })}
    </group>
  );
};

export default Flute3D;
