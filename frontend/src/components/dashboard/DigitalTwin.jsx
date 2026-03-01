import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder } from '@react-three/drei';
import GlassCard from '../common/GlassCard';
import { Activity } from 'lucide-react';
import { useSimulationContext } from '../../context/SimulationContext';

function SugarcaneBelt({ activeAlert, isRunning }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current && isRunning) {
      meshRef.current.position.x += delta * 2.5;
      if (meshRef.current.position.x > 3) meshRef.current.position.x = -3;
    }
  });

  const caneColor = activeAlert ? '#ef4444' : '#16a34a';

  return (
    <group>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />

      {/* Conveyor Belt */}
      <Box args={[8, 0.2, 2]} position={[0, -0.6, 0]}>
        <meshStandardMaterial color="#cbd5e1" />
      </Box>
      <Box args={[8, 0.8, 1.8]} position={[0, -1.1, 0]}>
        <meshStandardMaterial color="#e2e8f0" />
      </Box>

      {/* Sugarcane Material Flow */}
      <Cylinder ref={meshRef} args={[0.3, 0.3, 1.5]} rotation={[0, 0, Math.PI / 2]} position={[-3, -0.2, 0]}>
        <meshStandardMaterial color={caneColor} emissive={caneColor} emissiveIntensity={0.3} />
      </Cylinder>

      {/* NIR Sensor Block */}
      <Box args={[0.5, 0.5, 2.5]} position={[0, 1.5, 0]}>
        <meshStandardMaterial color="#94a3b8" />
      </Box>

      {/* NIR Laser Field */}
      {isRunning && (
        <Box args={[0.05, 3, 2]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#0891b2" emissive="#0891b2" emissiveIntensity={2} transparent opacity={0.3} />
        </Box>
      )}

      <OrbitControls enableZoom={false} autoRotate={isRunning} autoRotateSpeed={-0.5} maxPolarAngle={Math.PI / 2.5} minPolarAngle={Math.PI / 3} />
    </group>
  );
}

export default function DigitalTwin() {
  const { latestData, isRunning } = useSimulationContext();

  return (
    <GlassCard className="digital-twin-card" delay={0.2}>
      <h3 className="card-title"><Activity size={20} /> Digital Twin — Conveyor Feed</h3>
      <div className="twin-canvas">
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <SugarcaneBelt activeAlert={latestData?.alert} isRunning={isRunning} />
        </Canvas>
      </div>
    </GlassCard>
  );
}
