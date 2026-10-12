import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Sparkles, Float, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const ElectricOrb = () => {
  const sphereRef = useRef<THREE.Mesh>(null);
  
  // Rotate the orb
  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      sphereRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      {/* Outer distorted energy field */}
      <Sphere ref={sphereRef} args={[1.5, 64, 64]} scale={1.2}>
        <MeshDistortMaterial 
          color="#fef08a" 
          emissive="#fbbf24" 
          emissiveIntensity={2}
          roughness={0.2}
          metalness={0.8}
          distort={0.4}
          speed={3}
          wireframe={true}
          transparent
          opacity={0.8}
        />
      </Sphere>
      {/* Inner solid core */}
      <Sphere args={[1.1, 32, 32]}>
        <meshStandardMaterial 
          color="#fef08a" 
          emissive="#fbbf24" 
          emissiveIntensity={2} 
          roughness={0.4} 
        />
      </Sphere>
      
      {/* Dynamic point light following the core */}
      <pointLight color="#facc15" intensity={2} distance={10} />
    </Float>
  );
};

export default function ThreeBackground() {
  return (
    <div className="w-full h-full min-h-[400px] lg:min-h-[600px] relative pointer-events-auto cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.2} />
        
        <Sparkles 
          count={150} 
          scale={5} 
          size={4} 
          speed={0.6} 
          opacity={0.8} 
          color="#fef08a" 
        />
        
        <ElectricOrb />
        
        {/* Soft shadow below the orb */}
        <ContactShadows 
          position={[0, -2, 0]} 
          opacity={0.4} 
          scale={10} 
          blur={2.5} 
          far={4} 
          color="#facc15" 
        />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
