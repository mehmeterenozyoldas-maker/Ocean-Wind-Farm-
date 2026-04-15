import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { AlertTriangle, CheckCircle, Zap, Wind } from 'lucide-react';
import { useHandTracking } from '../hooks/useHandTracking';

const MacroView: React.FC = () => {
  const { turbines, setViewMode, setSelectedTurbineId } = useStore();
  const { leftHand, rightHand } = useHandTracking();
  const [hoveredTurbineId, setHoveredTurbineId] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [prevPanHand, setPrevPanHand] = useState<{ x: number, y: number } | null>(null);

  // Generate connections for the "neural network" look
  const connections = useMemo(() => {
    const lines = [];
    for (let i = 0; i < turbines.length; i++) {
      for (let j = i + 1; j < turbines.length; j++) {
        const dist = Math.sqrt(
          Math.pow(turbines[i].position[0] - turbines[j].position[0], 2) +
          Math.pow(turbines[i].position[2] - turbines[j].position[2], 2)
        );
        if (dist < 600) { // Connect nearby nodes
          lines.push({ start: turbines[i], end: turbines[j], key: `${i}-${j}` });
        }
      }
    }
    return lines;
  }, [turbines]);

  // Normalize coordinates for SVG (assuming 2000x2000 world space mapped to view)
  const mapToScreen = (val: number) => (val + 1000) / 2000 * 100; // Percent

  const panHand = leftHand?.isPinching ? leftHand : rightHand?.isPinching ? rightHand : null;
  const selectHand = rightHand && !rightHand.isPinching ? rightHand : leftHand && !leftHand.isPinching ? leftHand : null;

  // Panning logic (either hand)
  useEffect(() => {
    if (panHand) {
      if (prevPanHand) {
        // Calculate delta (mirrored X)
        const dx = (panHand.indexFinger.x - prevPanHand.x) * 100; // SVG units
        const dy = (panHand.indexFinger.y - prevPanHand.y) * 100;
        
        // Update pan state. Note: x is mirrored in the camera, so we subtract dx.
        setPan(p => ({ x: p.x - dx, y: p.y + dy }));
      }
      setPrevPanHand({ x: panHand.indexFinger.x, y: panHand.indexFinger.y });
    } else {
      setPrevPanHand(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panHand?.indexFinger.x, panHand?.indexFinger.y]);

  // Selection logic (either hand)
  useEffect(() => {
    if (!selectHand) {
      setHoveredTurbineId(null);
      return;
    }

    // Map hand coordinates to SVG percentages, accounting for pan
    // Using a ref or just the current state value for pan to avoid dependency loop
    const handX = (1 - selectHand.indexFinger.x) * 100 - pan.x;
    const handY = selectHand.indexFinger.y * 100 - pan.y;

    let closestTurbine = null;
    let minDistance = 5; // Threshold in percentage points

    turbines.forEach(turbine => {
      const tx = mapToScreen(turbine.position[0]);
      const ty = mapToScreen(turbine.position[2]);
      const dist = Math.sqrt(Math.pow(tx - handX, 2) + Math.pow(ty - handY, 2));
      
      if (dist < minDistance) {
        minDistance = dist;
        closestTurbine = turbine;
      }
    });

    if (closestTurbine) {
      setHoveredTurbineId(closestTurbine.id);
      
      // If grabbing while hovering, select and transition
      if (selectHand.isGrabbing) {
        setSelectedTurbineId(closestTurbine.id);
        setViewMode('micro');
      }
    } else {
      setHoveredTurbineId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectHand?.indexFinger.x, selectHand?.indexFinger.y, selectHand?.isGrabbing, turbines, setSelectedTurbineId, setViewMode]);

  const totalOutput = turbines.reduce((acc, t) => acc + t.telemetry.powerOutput, 0);
  const avgWind = turbines.reduce((acc, t) => acc + t.telemetry.windSpeed, 0) / turbines.length;

  const nominalCount = turbines.filter(t => t.status === 'nominal').length;
  const warningCount = turbines.filter(t => t.status === 'warning').length;
  const criticalCount = turbines.filter(t => t.status === 'critical').length;

  return (
    <div className="w-full h-full bg-ob-bg relative overflow-hidden font-mono text-xs">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'radial-gradient(var(--color-ob-border) 1px, transparent 1px)', 
             backgroundSize: '40px 40px',
             backgroundPosition: `${pan.x * 10}px ${pan.y * 10}px` // Parallax effect
           }} 
      />

      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-8 z-10 flex justify-between items-start pointer-events-none">
        <div>
          <h1 className="text-4xl font-sans font-light tracking-widest text-ob-text uppercase">
            North Sea Array <span className="text-ob-safe text-sm align-top font-mono">LIVE</span>
          </h1>
          <div className="flex gap-8 mt-4 text-ob-muted">
            <div className="flex items-center gap-2">
              <Zap size={16} /> <span>Total Output: {(totalOutput / 1000).toFixed(1)} MW</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind size={16} /> <span>Avg Wind: {avgWind.toFixed(1)} m/s</span>
            </div>
          </div>
        </div>
        
        <div className="bg-ob-surface/80 backdrop-blur-md border border-ob-border p-4 rounded-lg">
           <div className="text-ob-muted mb-2 uppercase tracking-wider text-[10px] font-sans">System Health</div>
           <div className="flex gap-4">
             <div className="text-center">
               <div className="text-2xl text-ob-safe">{nominalCount}</div>
               <div className="text-[10px] text-ob-muted font-sans">NOMINAL</div>
             </div>
             <div className="text-center">
               <div className="text-2xl text-ob-alert">{warningCount}</div>
               <div className="text-[10px] text-ob-muted font-sans">WARNING</div>
             </div>
             <div className="text-center">
               <div className="text-2xl text-ob-critical">{criticalCount}</div>
               <div className="text-[10px] text-ob-muted font-sans">CRITICAL</div>
             </div>
           </div>
        </div>
      </div>

      {/* Interactive Graph */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-full h-full max-w-4xl max-h-4xl" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <g transform={`translate(${pan.x}, ${pan.y})`}>
            {/* Connections */}
            {connections.map((conn) => (
              <motion.line
                key={conn.key}
                x1={mapToScreen(conn.start.position[0])}
                y1={mapToScreen(conn.start.position[2])}
                x2={mapToScreen(conn.end.position[0])}
                y2={mapToScreen(conn.end.position[2])}
                stroke="var(--color-ob-border)"
                strokeWidth="0.2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            ))}

            {/* Nodes */}
            {turbines.map((turbine) => {
              const isHovered = hoveredTurbineId === turbine.id;
              
              return (
                <g 
                  key={turbine.id} 
                  onClick={() => {
                    setSelectedTurbineId(turbine.id);
                    setViewMode('micro');
                  }}
                  onMouseEnter={() => setHoveredTurbineId(turbine.id)}
                  onMouseLeave={() => setHoveredTurbineId(null)}
                  className="cursor-pointer group"
                >
                  <motion.circle
                    cx={mapToScreen(turbine.position[0])}
                    cy={mapToScreen(turbine.position[2])}
                    r="1.5"
                    fill={turbine.status === 'nominal' ? 'var(--color-ob-safe)' : turbine.status === 'warning' ? 'var(--color-ob-alert)' : 'var(--color-ob-critical)'}
                    initial={{ scale: 0 }}
                    animate={{ scale: isHovered ? 2 : 1 }}
                    whileHover={{ scale: 2 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  />
                  
                  {/* Pulse Effect for non-nominal */}
                  {turbine.status !== 'nominal' && (
                    <motion.circle
                      cx={mapToScreen(turbine.position[0])}
                      cy={mapToScreen(turbine.position[2])}
                      r="3"
                      stroke={turbine.status === 'warning' ? 'var(--color-ob-alert)' : 'var(--color-ob-critical)'}
                      strokeWidth="0.2"
                      fill="none"
                      animate={{ scale: [1, 2], opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}

                  {/* Selection Ring when hovered by hand */}
                  {isHovered && (
                    <motion.circle
                      cx={mapToScreen(turbine.position[0])}
                      cy={mapToScreen(turbine.position[2])}
                      r="4"
                      stroke="var(--color-ob-text)"
                      strokeWidth="0.1"
                      strokeDasharray="0.5 0.5"
                      fill="none"
                      initial={{ opacity: 0, rotate: 0 }}
                      animate={{ opacity: 1, rotate: 360 }}
                      transition={{ rotate: { repeat: Infinity, duration: 4, ease: "linear" } }}
                    />
                  )}

                  {/* Label on Hover */}
                  <foreignObject 
                    x={mapToScreen(turbine.position[0]) + 2} 
                    y={mapToScreen(turbine.position[2]) - 2} 
                    width="20" 
                    height="10"
                    className={`transition-opacity duration-200 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  >
                    <div className="bg-ob-surface/90 text-ob-text text-[4px] p-1 rounded border border-ob-border backdrop-blur-sm">
                      {turbine.id}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Footer / Legend */}
      <div className="absolute bottom-8 left-8 text-ob-muted text-[10px] uppercase tracking-widest space-y-1 font-sans">
        <div>View Mode: Macro / Ontology</div>
        <div>System: HMI-2030-ALPHA</div>
        <div className="text-ob-safe/70 pt-2">Interaction: Pinch to pan • Hover & grab to inspect</div>
      </div>
    </div>
  );
};

export default MacroView;
