
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

interface Scene3DProps {
  children: React.ReactNode;
  height?: string;
  enableControls?: boolean;
}

export const Scene3D: React.FC<Scene3DProps> = ({ 
  children, 
  height = "400px",
  enableControls = false 
}) => {
  return (
    <div style={{ height, width: '100%' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        style={{ background: 'transparent' }}
        onError={(error) => {
          console.error('Three.js Canvas Error:', error);
        }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#8b5cf6" />
          <pointLight position={[10, -10, -5]} intensity={0.5} color="#ec4899" />
          
          {/* Environment for reflections */}
          <Environment preset="night" />
          
          {children}
          
          {/* Optional orbit controls */}
          {enableControls && (
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={true}
              autoRotate={true}
              autoRotateSpeed={0.5}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};
