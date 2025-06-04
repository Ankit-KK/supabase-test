
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

interface Scene3DWrapperProps {
  children: React.ReactNode;
}

const Scene3DWrapper: React.FC<Scene3DWrapperProps> = ({ children }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 60 }}
      style={{ height: '600px', width: '100%' }}
      dpr={[1, 2]}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#9b87f5" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
      />

      {/* Environment */}
      <Environment preset="night" />
      
      {/* Controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={1}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 3}
      />

      {children}
    </Canvas>
  );
};

export default Scene3DWrapper;
