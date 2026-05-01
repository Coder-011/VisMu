import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Text } from '@react-three/drei';
import * as THREE from 'three';
const Flute3D = ({ holeStates, currentNote = '--', confidence = 0 }) => {
    const groupRef = useRef(null);
    const timeRef = useRef(0);
    useFrame((state) => {
        timeRef.current = state.clock.getElapsedTime();
        if (groupRef.current) {
            // Gentle floating animation
            groupRef.current.position.y = Math.sin(timeRef.current * 0.5) * 0.1;
            groupRef.current.rotation.z = Math.sin(timeRef.current * 0.3) * 0.05;
        }
    });
    return (_jsxs("group", { ref: groupRef, rotation: [0, 0, Math.PI / 2], children: [_jsx(Cylinder, { args: [0.3, 0.3, 8, 32], rotation: [0, 0, 0], children: _jsx("meshStandardMaterial", { color: "#3d2b1f", roughness: 0.9, metalness: 0.05 }) }), [0, 1, 2, 3, 4, 5].map((idx) => {
                const isActive = holeStates[idx];
                const glowIntensity = isActive ? 2 : 0;
                return (_jsxs("group", { position: [0, (idx - 2.5) * 0.8, 0.3], children: [_jsxs("mesh", { rotation: [Math.PI / 2, 0, 0], children: [_jsx("circleGeometry", { args: [0.12, 32] }), _jsx("meshStandardMaterial", { color: isActive ? "#00f2ff" : "#1a1a1a", emissive: isActive ? "#00f2ff" : "#000000", emissiveIntensity: isActive ? 1.5 + Math.sin(timeRef.current * 3) * 0.3 : 0, transparent: true, opacity: 0.9 })] }), isActive && (_jsxs("mesh", { rotation: [Math.PI / 2, 0, 0], children: [_jsx("ringGeometry", { args: [0.08, 0.12, 32] }), _jsx("meshBasicMaterial", { color: "#00f2ff", transparent: true, opacity: 0.6 })] })), isActive && (_jsxs("mesh", { rotation: [Math.PI / 2, 0, 0], children: [_jsx("ringGeometry", { args: [0.12, 0.2, 32] }), _jsx("meshBasicMaterial", { color: "#00f2ff", transparent: true, opacity: 0.2 })] })), isActive && (_jsx("pointLight", { color: "#00f2ff", intensity: glowIntensity, distance: 1.5, decay: 2 }))] }, idx));
            }), [-3.5, -2, 0, 2, 3.5].map((pos, idx) => (_jsx(Cylinder, { args: [0.31, 0.31, 0.1, 32], position: [0, pos, 0], children: _jsx("meshStandardMaterial", { color: "#8b0000" }) }, idx))), _jsx(Text, { position: [0, 3, 0], color: "#00f2ff", fontSize: 0.6, anchorX: "center", anchorY: "middle", children: currentNote }), [0, 1, 2, 3, 4, 5].map((idx) => (_jsx(Text, { position: [0.4, (idx - 2.5) * 0.8, 0.3], color: "#666", fontSize: 0.2, anchorX: "left", anchorY: "middle", children: `H${idx + 1}` }, `label-${idx}`)))] }));
};
export default Flute3D;
//# sourceMappingURL=Flute3D.js.map