
import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface DonationSphereProps {
  donationAmount: number;
  goalAmount: number;
}

export const DonationSphere: React.FC<DonationSphereProps> = ({ 
  donationAmount, 
  goalAmount 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const fillMeshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { mouse } = useThree();
  
  const progress = Math.min(donationAmount / goalAmount, 1);
  const fillHeight = progress * 2 - 1; // -1 to 1 range

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Gentle rotation
      meshRef.current.rotation.y += delta * 0.5;
      
      // Mouse following effect with null checks
      if (mouse) {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(
          meshRef.current.rotation.x,
          mouse.y * 0.2,
          0.05
        );
        meshRef.current.rotation.z = THREE.MathUtils.lerp(
          meshRef.current.rotation.z,
          mouse.x * 0.2,
          0.05
        );
      }
      
      // Pulsing effect when hovered
      if (state.clock) {
        const scale = hovered ? 1.1 + Math.sin(state.clock.elapsedTime * 4) * 0.05 : 1;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <group>
      {/* Main sphere using native Three.js geometry */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhongMaterial
          color={progress > 0.8 ? '#10b981' : progress > 0.5 ? '#f59e0b' : '#8b5cf6'}
          transparent
          opacity={0.8}
          emissive={progress > 0.8 ? '#065f46' : progress > 0.5 ? '#92400e' : '#581c87'}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Fill indicator sphere */}
      <mesh ref={fillMeshRef} position={[0, fillHeight - 1, 0]}>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshPhongMaterial
          color="#ec4899"
          transparent
          opacity={0.6}
          emissive="#be185d"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Floating donation text */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        ₹{donationAmount.toLocaleString()}
      </Text>
      
      <Text
        position={[0, -2, 0]}
        fontSize={0.2}
        color="#a855f7"
        anchorX="center"
        anchorY="middle"
      >
        Goal: ₹{goalAmount.toLocaleString()}
      </Text>
    </group>
  );
};
