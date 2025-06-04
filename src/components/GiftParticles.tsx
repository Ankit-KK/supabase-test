
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Points, PointsMaterial } from 'three';
import * as THREE from 'three';

const GiftParticles: React.FC = () => {
  const pointsRef = useRef<Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(100 * 3);
    const colors = new Float32Array(100 * 3);
    
    for (let i = 0; i < 100; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      
      // Random colors (purple, pink, gold)
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.4; colors[i * 3 + 2] = 0.9; // Purple
      } else if (colorChoice < 0.66) {
        colors[i * 3] = 1; colors[i * 3 + 1] = 0.4; colors[i * 3 + 2] = 0.7; // Pink
      } else {
        colors[i * 3] = 1; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 0; // Gold
      }
    }
    
    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={100}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={100}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

export default GiftParticles;
