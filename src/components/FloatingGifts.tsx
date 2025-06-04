
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

const FloatingGifts: React.FC = () => {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Heart shape geometry
  const HeartShape = ({ position, color }: { position: [number, number, number]; color: string }) => {
    const heartRef = useRef<Group>(null);
    
    useFrame((state) => {
      if (heartRef.current) {
        heartRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.3;
        heartRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.1;
      }
    });

    return (
      <group ref={heartRef} position={position}>
        <mesh position={[-0.3, 0.3, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0.3, 0.3, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.4, 0.4, 0.2]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
        </mesh>
      </group>
    );
  };

  // Star shape
  const StarShape = ({ position, color }: { position: [number, number, number]; color: string }) => {
    const starRef = useRef<Group>(null);
    
    useFrame((state) => {
      if (starRef.current) {
        starRef.current.rotation.z += 0.02;
        starRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.2;
      }
    });

    return (
      <group ref={starRef} position={position}>
        <mesh>
          <cylinderGeometry args={[0, 0.3, 0.6, 5]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI]}>
          <cylinderGeometry args={[0, 0.3, 0.6, 5]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      </group>
    );
  };

  return (
    <group ref={groupRef}>
      {/* Hearts */}
      <HeartShape position={[-3, 2, -1]} color="#FF69B4" />
      <HeartShape position={[3, -1, 1]} color="#FF1493" />
      <HeartShape position={[-2, -2, 0]} color="#FF69B4" />
      
      {/* Stars */}
      <StarShape position={[2, 3, -2]} color="#FFD700" />
      <StarShape position={[-4, 0, 2]} color="#FFA500" />
      <StarShape position={[4, -3, -1]} color="#FFD700" />
      
      {/* Rupee Symbols */}
      <mesh position={[0, 4, 0]}>
        <torusGeometry args={[0.3, 0.1, 8, 16]} />
        <meshStandardMaterial color="#00FF7F" emissive="#00FF7F" emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
};

export default FloatingGifts;
