
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

interface GiftBox3DProps {
  position: [number, number, number];
  value: number;
  color: string;
}

const GiftBox3D: React.FC<GiftBox3DProps> = ({ position, value, color }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
      
      // Rotation animation
      meshRef.current.rotation.y += 0.01;
      
      // Scale on hover
      const targetScale = hovered ? 1.2 : 1;
      meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as any, 0.1);
    }
  });

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 300);
  };

  return (
    <group position={position}>
      {/* Gift Box */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={handleClick}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.3}
          roughness={0.4}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>
      
      {/* Ribbon */}
      <mesh position={[0, 0, 0.51]}>
        <boxGeometry args={[1.1, 0.1, 0.1]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[0, 0, 0.51]}>
        <boxGeometry args={[0.1, 1.1, 0.1]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Value Label */}
      {hovered && (
        <mesh position={[0, 1.5, 0]}>
          <planeGeometry args={[1, 0.5]} />
          <meshBasicMaterial color="#000000" opacity={0.8} transparent />
        </mesh>
      )}
    </group>
  );
};

export default GiftBox3D;
