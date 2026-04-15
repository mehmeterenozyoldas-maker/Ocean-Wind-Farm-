import React, { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Sky, Environment, Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { Water } from 'three-stdlib';
import { useStore } from '../store';
import Turbine from './Turbine';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, Eye, Layers } from 'lucide-react';
import { useHandTracking } from '../hooks/useHandTracking';

const Ocean = () => {
  const gl = useThree((state) => state.gl);
  const waterNormals = useLoader(THREE.TextureLoader, 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/waternormals.jpg');
  
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  
  const water = useMemo(() => {
    const geom = new THREE.PlaneGeometry(10000, 10000);
    const waterObj = new Water(geom, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(100, 20, 100).normalize(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: false,
    });
    waterObj.rotation.x = -Math.PI / 2;
    waterObj.position.y = 0;
    return waterObj;
  }, [waterNormals]);

  useFrame((state, delta) => {
    (water.material as THREE.ShaderMaterial).uniforms.time.value += delta * 0.5;
  });

  return <primitive object={water} />;
};

// Component to control the camera via hand tracking
const HandCameraController = ({ controlsRef }: { controlsRef: React.RefObject<any> }) => {
  const { leftHand, rightHand } = useHandTracking();
  const panHand = leftHand?.isPinching ? leftHand : rightHand?.isPinching ? rightHand : null;
  const prevPos = useRef<{ x: number, y: number } | null>(null);

  useFrame(() => {
    if (panHand && controlsRef.current) {
      if (prevPos.current) {
        // Calculate delta
        const dx = panHand.indexFinger.x - prevPos.current.x;
        const dy = panHand.indexFinger.y - prevPos.current.y;

        // Apply to OrbitControls
        // Note: x is mirrored
        const currentAzimuth = controlsRef.current.getAzimuthalAngle();
        const currentPolar = controlsRef.current.getPolarAngle();
        
        controlsRef.current.setAzimuthalAngle(currentAzimuth - dx * 5);
        controlsRef.current.setPolarAngle(currentPolar + dy * 5);
      }
      prevPos.current = { x: panHand.indexFinger.x, y: panHand.indexFinger.y };
    } else {
      prevPos.current = null;
    }
  });

  return null;
};

const MicroView: React.FC = () => {
  const { turbines, selectedTurbineId, setSelectedTurbineId, setViewMode } = useStore();
  const controlsRef = useRef<any>(null);
  const { leftHand, rightHand } = useHandTracking();
  const grabHand = rightHand?.isGrabbing ? rightHand : leftHand?.isGrabbing ? leftHand : null;
  const [isExploded, setIsExploded] = useState(false);
  
  // Find target position for camera
  const selectedTurbine = turbines.find(t => t.id === selectedTurbineId);
  const targetPosition = selectedTurbine ? selectedTurbine.position : [0, 0, 0];

  // Hand gesture to return to Macro View
  useEffect(() => {
    if (grabHand) {
      // Simple heuristic: if grabbing in the top-left corner, go back
      if (grabHand.indexFinger.x > 0.7 && grabHand.indexFinger.y < 0.3) {
        setViewMode('macro');
      }
    }
  }, [grabHand, setViewMode]);

  return (
    <div className="w-full h-full relative bg-ob-bg">
      <Canvas shadows camera={{ position: [0, 100, 400], fov: 45 }}>
        <Suspense fallback={null}>
          <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} />
          <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <ambientLight intensity={0.2} />
          <directionalLight 
            position={[100, 100, 50]} 
            intensity={1.5} 
            castShadow 
            shadow-mapSize={[2048, 2048]}
          />
          <Environment preset="night" />
          
          <Ocean />
          
          {/* Clouds for atmosphere */}
          <Cloud opacity={0.5} speed={0.4} position={[0, 150, -200]} />

          {turbines.map((turbine) => (
            <Turbine 
              key={turbine.id} 
              data={turbine} 
              isSelected={selectedTurbineId === turbine.id}
              onClick={() => setSelectedTurbineId(turbine.id)}
              isExploded={selectedTurbineId === turbine.id && isExploded}
            />
          ))}

          <OrbitControls 
            ref={controlsRef}
            target={selectedTurbine ? new THREE.Vector3(...selectedTurbine.position).add(new THREE.Vector3(0, 50, 0)) : [0, 0, 0]}
            maxPolarAngle={Math.PI / 2 - 0.1} // Don't go below water
            minDistance={50}
            maxDistance={800}
            enableDamping
          />
          <HandCameraController controlsRef={controlsRef} />
        </Suspense>
      </Canvas>

      {/* UI Overlays */}
      <div className="absolute top-8 left-8 z-10 flex flex-col gap-4">
        <button 
          onClick={() => setViewMode('macro')}
          className="flex items-center gap-2 bg-ob-surface/80 hover:bg-ob-surface-hover backdrop-blur-md text-ob-text px-4 py-2 rounded-full border border-ob-border transition-all w-max"
        >
          <ArrowLeft size={16} />
          <span className="text-xs uppercase tracking-widest font-sans">Return to Macro View</span>
        </button>

        <button 
          onClick={() => setIsExploded(!isExploded)}
          className={`flex items-center gap-2 backdrop-blur-md px-4 py-2 rounded-full border transition-all w-max ${
            isExploded 
              ? 'bg-ob-safe/20 text-ob-safe border-ob-safe/50' 
              : 'bg-ob-surface/80 hover:bg-ob-surface-hover text-ob-text border-ob-border'
          }`}
        >
          <Layers size={16} />
          <span className="text-xs uppercase tracking-widest font-sans">
            {isExploded ? 'Collapse Asset' : 'Explode Asset View'}
          </span>
        </button>
      </div>

      {/* HMI Controls Simulation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        <div className="flex flex-col items-center gap-2">
          <button className="w-12 h-12 rounded-full bg-ob-surface/80 backdrop-blur-md border border-ob-border flex items-center justify-center text-ob-text hover:bg-ob-safe/20 hover:border-ob-safe/50 transition-all group">
            <Mic size={20} className="group-hover:text-ob-safe" />
          </button>
          <span className="text-[10px] uppercase text-ob-muted tracking-widest font-sans">Voice</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button className="w-12 h-12 rounded-full bg-ob-surface/80 backdrop-blur-md border border-ob-border flex items-center justify-center text-ob-text hover:bg-blue-500/20 hover:border-blue-500/50 transition-all group">
            <Eye size={20} className="group-hover:text-blue-400" />
          </button>
          <span className="text-[10px] uppercase text-ob-muted tracking-widest font-sans">Gaze</span>
        </div>
      </div>
      
      {/* Context Info */}
      <div className="absolute top-8 right-8 text-right pointer-events-none">
        <h2 className="text-2xl font-sans font-light text-ob-text tracking-widest">SPATIAL ASSET MODE</h2>
        <div className="text-ob-muted text-xs uppercase mt-1 font-sans">Live Digital Twin Feed • Latency: 12ms</div>
        <div className="text-ob-safe/70 text-[10px] uppercase mt-2 font-sans">Pinch to rotate camera • Grab top-left to return</div>
        <div className="text-ob-safe/70 text-[10px] uppercase mt-1 font-sans">Hover & pinch buttons to click</div>
      </div>
    </div>
  );
};

export default MicroView;
