import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface Flute3DProps {
  holeStates: boolean[];
  currentNote?: string;
}

// Hole positions along X axis (flute length = 8 units, centred at 0)
const HOLE_X = [-2.4, -1.6, -0.8, 0, 0.8, 1.6];

const Flute3D: React.FC<Flute3DProps> = ({ holeStates, currentNote = '--' }) => {
  const groupRef = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((state) => {
    t.current = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Gentle float only — no rotation so it stays horizontal
      groupRef.current.position.y = Math.sin(t.current * 0.6) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Bamboo body — horizontal along X */}
      <Cylinder args={[0.28, 0.28, 8, 32]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#5c3d1e" roughness={0.85} metalness={0.05} />
      </Cylinder>

      {/* Bamboo surface grain lines */}
      {[-3, -1.5, 0, 1.5, 3].map((x, i) => (
        <Cylinder key={i} args={[0.285, 0.285, 0.08, 32]} rotation={[0, 0, Math.PI / 2]} position={[x, 0, 0]}>
          <meshStandardMaterial color="#3a2010" roughness={1} metalness={0} />
        </Cylinder>
      ))}

      {/* Mouthpiece end cap */}
      <Cylinder args={[0.3, 0.3, 0.15, 32]} rotation={[0, 0, Math.PI / 2]} position={[-4.1, 0, 0]}>
        <meshStandardMaterial color="#2a1a08" roughness={0.9} />
      </Cylinder>

      {/* Holes */}
      {HOLE_X.map((x, idx) => {
        const closed = holeStates[idx] ?? false;
        const pulse = closed ? 1.2 + Math.sin(t.current * 4 + idx) * 0.3 : 0;

        return (
          <group key={idx} position={[x, 0.29, 0]}>
            {/* Hole rim (dark ring always visible) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.09, 0.14, 32]} />
              <meshStandardMaterial color="#1a0e05" roughness={1} />
            </mesh>

            {/* Hole fill — dark when open, glowing when closed */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.09, 32]} />
              <meshStandardMaterial
                color={closed ? '#00f2ff' : '#0a0a0a'}
                emissive={closed ? '#00f2ff' : '#000000'}
                emissiveIntensity={closed ? pulse : 0}
                roughness={0.2}
                metalness={0.1}
              />
            </mesh>

            {/* Outer glow ring when closed */}
            {closed && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.09, 0.22, 32]} />
                <meshBasicMaterial color="#00f2ff" transparent opacity={0.25 + Math.sin(t.current * 4 + idx) * 0.1} />
              </mesh>
            )}

            {/* Point light for neon glow */}
            {closed && (
              <pointLight color="#00f2ff" intensity={3} distance={1.2} decay={2} />
            )}

            {/* Hole label */}
            <mesh position={[0, 0.28, 0]}>
              <planeGeometry args={[0.25, 0.12]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </group>
        );
      })}

      {/* Note display — floating above centre */}
      {currentNote !== '--' && (
        <group position={[0, 1.1, 0]}>
          <mesh>
            <planeGeometry args={[1.2, 0.5]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default Flute3D;
