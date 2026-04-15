import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { TurbineData } from '../store';
import { AlertTriangle, Activity, Thermometer, Wind, Wrench, Users } from 'lucide-react';
import TelemetryWidget from './TelemetryWidget';

interface TurbineProps {
  data: TurbineData;
  isSelected: boolean;
  onClick: () => void;
  isExploded?: boolean;
}

const Turbine: React.FC<TurbineProps> = ({ data, isSelected, onClick, isExploded = false }) => {
  const group = useRef<THREE.Group>(null);
  const blades = useRef<THREE.Group>(null);
  
  // Refs for exploded view animation
  const baseRef = useRef<THREE.Mesh>(null);
  const platformRef = useRef<THREE.Mesh>(null);
  const railingRef = useRef<THREE.Mesh>(null);
  const towerRef = useRef<THREE.Mesh>(null);
  const nacelleGroupRef = useRef<THREE.Group>(null);
  const hubRef = useRef<THREE.Mesh>(null);
  const spinnerRef = useRef<THREE.Mesh>(null);
  const bladesGroupRef = useRef<THREE.Group>(null);

  const explodeProgress = useRef(0);

  // Rotate blades
  useFrame((state, delta) => {
    if (blades.current && !isExploded) {
      blades.current.rotation.z -= delta * (data.telemetry.rpm / 60) * Math.PI * 2 * 0.1; // Slowed down for visual
    }

    // Animate exploded view
    const targetExplode = isExploded ? 1 : 0;
    explodeProgress.current = THREE.MathUtils.lerp(explodeProgress.current, targetExplode, delta * 5);
    
    const p = explodeProgress.current;
    
    if (baseRef.current) baseRef.current.position.y = 10 - p * 10;
    if (platformRef.current) platformRef.current.position.y = 20 - p * 5;
    if (railingRef.current) railingRef.current.position.y = 21 - p * 5;
    if (towerRef.current) towerRef.current.position.y = 50; // stays
    if (nacelleGroupRef.current) nacelleGroupRef.current.position.y = 80 + p * 20;
    
    if (hubRef.current) hubRef.current.position.y = 80 + p * 20;
    if (spinnerRef.current) spinnerRef.current.position.y = 80 + p * 20;
    if (bladesGroupRef.current) {
      bladesGroupRef.current.position.y = 80 + p * 20;
      bladesGroupRef.current.position.z = 3.5 + p * 30;
    }
  });

  const statusColor = data.status === 'nominal' ? '#00A69C' : data.status === 'warning' ? '#F2A900' : '#E3000F';

  // Materials
  const towerMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.4, metalness: 0.1 }), []);
  const baseMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#F2A900', roughness: 0.6, metalness: 0.2 }), []); // Yellow transition piece
  const nacelleMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.3, metalness: 0.2 }), []);
  const bladeMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3, metalness: 0.1 }), []);
  const darkMetalMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.7, metalness: 0.5 }), []);
  const errorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#E3000F', emissive: '#E3000F', emissiveIntensity: 0.5 }), []);

  return (
    <group 
      ref={group} 
      position={data.position} 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Foundation / Transition Piece (Yellow) */}
      <mesh ref={baseRef} position={[0, 10, 0]} castShadow receiveShadow material={baseMaterial}>
        <cylinderGeometry args={[3, 3.5, 20, 32]} />
      </mesh>

      {/* Platform */}
      <mesh ref={platformRef} position={[0, 20, 0]} castShadow receiveShadow material={darkMetalMaterial}>
        <cylinderGeometry args={[4.5, 4.5, 0.5, 32]} />
      </mesh>
      
      {/* Railing (simplified as a thin transparent cylinder) */}
      <mesh ref={railingRef} position={[0, 21, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.5, 4.5, 2, 32]} />
        <meshStandardMaterial color="#334155" transparent opacity={0.3} wireframe />
      </mesh>

      {/* Main Tower */}
      <mesh ref={towerRef} position={[0, 50, 0]} castShadow receiveShadow material={towerMaterial}>
        <cylinderGeometry args={[1.8, 2.8, 60, 32]} />
      </mesh>

      {/* Nacelle (more realistic shape) */}
      <group ref={nacelleGroupRef} position={[0, 80, -2]}>
        <mesh castShadow receiveShadow material={nacelleMaterial} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[2.2, 6, 16, 32]} />
        </mesh>
        {/* Cooler/Vent on top */}
        <mesh position={[0, 2.5, 1]} castShadow receiveShadow material={data.status === 'critical' && isExploded ? errorMaterial : darkMetalMaterial}>
          <boxGeometry args={[2, 0.5, 4]} />
        </mesh>

        {/* Internal Mechanical Details (Visible when exploded) */}
        {isExploded && (
          <group position={[0, -0.5, 0]}>
            {/* Main Shaft */}
            <mesh position={[0, 0, 2]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow material={darkMetalMaterial}>
              <cylinderGeometry args={[0.5, 0.5, 4, 16]} />
            </mesh>
            
            {/* Gearbox (Highlight if critical) */}
            <mesh position={[0, 0, -0.5]} castShadow receiveShadow material={data.status === 'critical' ? errorMaterial : darkMetalMaterial}>
              <boxGeometry args={[2.5, 2.5, 3]} />
            </mesh>
            
            {/* Generator */}
            <mesh position={[0, 0, -3]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow material={darkMetalMaterial}>
              <cylinderGeometry args={[1.5, 1.5, 2, 16]} />
            </mesh>

            {/* Labels for internals */}
            <Html position={[0, 3, -0.5]} center distanceFactor={100} zIndexRange={[100, 0]}>
              <div className="bg-ob-surface/80 backdrop-blur-sm border border-ob-border px-2 py-1 rounded text-[8px] uppercase tracking-widest text-ob-text pointer-events-none">
                Planetary Gearbox
              </div>
            </Html>
            <Html position={[0, 3, -3]} center distanceFactor={100} zIndexRange={[100, 0]}>
              <div className="bg-ob-surface/80 backdrop-blur-sm border border-ob-border px-2 py-1 rounded text-[8px] uppercase tracking-widest text-ob-text pointer-events-none">
                Generator
              </div>
            </Html>
          </group>
        )}

        {/* Maintenance Panel (Exploded View) */}
        {isExploded && data.status !== 'nominal' && (
          <Html position={[5, 10, 0]} center distanceFactor={150} zIndexRange={[100, 0]}>
            <div className="w-80 p-4 rounded-xl backdrop-blur-xl border bg-ob-surface/90 border-ob-critical/50 shadow-2xl pointer-events-auto">
              <h4 className="text-ob-critical font-bold mb-2 flex items-center gap-2 font-sans">
                <AlertTriangle size={16} /> Gearbox Fault Detected
              </h4>
              <p className="text-xs text-ob-text mb-4 font-sans">High temperature anomaly in planetary gear stage. Immediate replacement of bearing assembly required.</p>
              <div className="flex flex-col gap-2 font-sans">
                <button 
                  className="w-full py-2 bg-ob-surface-hover hover:bg-ob-border rounded text-xs uppercase tracking-wider text-ob-text border border-ob-border transition-colors flex items-center justify-center gap-2"
                  onClick={(e) => { e.stopPropagation(); alert('Order placed for bearing assembly.'); }}
                >
                  <Wrench size={14} /> Order Replacement Part
                </button>
                <button 
                  className="w-full py-2 bg-ob-surface-hover hover:bg-ob-border rounded text-xs uppercase tracking-wider text-ob-text border border-ob-border transition-colors"
                  onClick={(e) => { e.stopPropagation(); alert('Maintenance window planned.'); }}
                >
                  Plan Maintenance Window
                </button>
                <button 
                  className="w-full py-2 bg-ob-safe/20 hover:bg-ob-safe/30 text-ob-safe rounded text-xs uppercase tracking-wider border border-ob-safe/50 transition-colors flex items-center justify-center gap-2"
                  onClick={(e) => { e.stopPropagation(); alert('Repair squad deployed.'); }}
                >
                  <Users size={14} /> Deploy Repair Squad
                </button>
              </div>
            </div>
          </Html>
        )}
      </group>

      {/* Hub */}
      <mesh ref={hubRef} position={[0, 80, 3.5]} castShadow receiveShadow material={nacelleMaterial}>
        <sphereGeometry args={[2.2, 32, 32]} />
      </mesh>
      
      {/* Spinner / Nose cone */}
      <mesh ref={spinnerRef} position={[0, 80, 4.5]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow material={nacelleMaterial}>
        <coneGeometry args={[2.2, 3, 32]} />
      </mesh>

      {/* Blades */}
      <group ref={bladesGroupRef} position={[0, 80, 3.5]}>
        <group ref={blades}>
          {[0, 1, 2].map((i) => (
            <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
              {/* Blade Root (connects to hub) */}
              <mesh position={[0, 2, 0]} castShadow receiveShadow material={darkMetalMaterial}>
                <cylinderGeometry args={[0.6, 0.6, 4, 16]} />
              </mesh>
              {/* Main Blade */}
              <mesh position={[0, 24, 0]} scale={[1, 1, 0.15]} castShadow receiveShadow material={bladeMaterial}>
                {/* Tapered and flattened cylinder for blade shape */}
                <cylinderGeometry args={[0.1, 1.2, 42, 16]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* Status Ring at Base */}
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6, 7, 32]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Volumetric Data Panel (Only if selected or critical) */}
      {(isSelected || data.status !== 'nominal') && !isExploded && (
        <Html position={[12, 80, 0]} center distanceFactor={150} zIndexRange={[100, 0]}>
          <div 
            className={`
              w-72 p-4 rounded-xl backdrop-blur-xl border shadow-2xl pointer-events-auto
              transition-all duration-300 transform
              ${isSelected ? 'scale-100 opacity-100' : 'scale-90 opacity-80 hover:scale-100 hover:opacity-100'}
              ${data.status === 'critical' ? 'bg-ob-surface/90 border-ob-critical/50' : 
                data.status === 'warning' ? 'bg-ob-surface/90 border-ob-alert/50' : 'bg-ob-surface/80 border-ob-border'}
            `}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-ob-border">
              <h3 className="text-lg font-mono font-bold text-ob-text tracking-wider">{data.id}</h3>
              <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${
                data.status === 'nominal' ? 'bg-ob-safe/20 text-ob-safe' :
                data.status === 'warning' ? 'bg-ob-alert/20 text-ob-alert' : 'bg-ob-critical/20 text-ob-critical'
              }`}>
                {data.status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <TelemetryWidget 
                label="Power Output" 
                value={Math.round(data.telemetry.powerOutput)} 
                unit="kW" 
                status={data.status === 'critical' ? 'critical' : 'nominal'}
              />
              <TelemetryWidget 
                label="Rotor Speed" 
                value={data.telemetry.rpm.toFixed(1)} 
                unit="RPM" 
              />
              <TelemetryWidget 
                label="Gearbox Temp" 
                value={data.telemetry.gearboxTemp.toFixed(1)} 
                unit="°C" 
                status={data.telemetry.gearboxTemp > 80 ? 'warning' : 'nominal'}
              />
              <TelemetryWidget 
                label="Wind Speed" 
                value={data.telemetry.windSpeed.toFixed(1)} 
                unit="m/s" 
              />
            </div>

            {/* Predictive Diagnostic (Fake) */}
            {data.status !== 'nominal' && (
              <div className="mt-4 pt-3 border-t border-ob-border">
                <div className="text-[10px] uppercase text-ob-muted mb-1 tracking-widest">AI Prediction</div>
                <div className="text-ob-critical text-xs flex items-start gap-2">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  <span>94% probability of gearbox failure within 48h. Recommend immediate shutdown.</span>
                </div>
                <button 
                  className="mt-3 w-full py-1.5 bg-ob-surface-hover hover:bg-ob-border rounded text-[10px] uppercase tracking-wider transition-colors text-ob-text border border-ob-border"
                  onClick={(e) => { e.stopPropagation(); alert('Shutdown initiated.'); }}
                >
                  Initiate Shutdown
                </button>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

export default Turbine;
