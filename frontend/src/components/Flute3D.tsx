import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder } from '@react-three/drei';
import * as THREE from 'three';

interface Flute3DProps {
  holeStates: boolean[];
}

const Flute3D: React.FC<Flute3DProps> = ({ holeStates }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
      groupRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.05;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, 0, Math.PI / 2]}>
      {/* Main Bamboo Body */}
      <Cylinder args={[0.3, 0.3, 8, 32]} rotation={[0, 0, 0]}>
        <meshStandardMaterial 
          color="#3d2b1f" 
          roughness={0.8} 
          metalness={0.1} 
        />
      </Cylinder>

      {/* Holes with enhanced glow effects */}
      {[0, 1, 2, 3, 4, 5].map((idx) => {
        const isActive = holeStates[idx];
        const glowIntensity = isActive ? 2 : 0;
        
        return (
          <group key={idx} position={[0, (idx - 2.5) * 0.8, 0.3]}>
            {/* Hole base */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.12, 32]} />
              <meshStandardMaterial 
                color={isActive ? "#00f2ff" : "#1a1a1a"}
                emissive={isActive ? "#00f2ff" : "#000000"}
                emissiveIntensity={isActive ? 1.5 : 0}
                transparent
                opacity={0.9}
              />
            </mesh>
            
            {/* Inner glow ring */}
            {isActive && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.08, 0.12, 32]} />
                <meshBasicMaterial 
                  color="#00f2ff"
                  transparent
                  opacity={0.6}
                />
              </mesh>
            )}
            
            {/* Outer glow effect */}
            {isActive && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.12, 0.2, 32]} />
                <meshBasicMaterial 
                  color="#00f2ff"
                  transparent
                  opacity={0.2}
                />
              </mesh>
            )}
            
            {/* Point light for glow */}
            {isActive && (
              <pointLight 
                color="#00f2ff" 
                intensity={glowIntensity} 
                distance={1.5} 
                decay={2}
              />
            )}
          </group>
        );
      })}

      {/* Bamboo Bindings (Threads) */}
      {[-3.5, -2, 0, 2, 3.5].map((pos, idx) => (
        <Cylinder key={idx} args={[0.31, 0.31, 0.1, 32]} position={[0, pos, 0]}>
          <meshStandardMaterial color="#8b0000" />
        </Cylinder>
      ))}
    </group>
  );
};

export default Flute3D;
