import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useHandTracking, HandData } from '../hooks/useHandTracking';

export default function HandCursor() {
  const { leftHand, rightHand, isReady } = useHandTracking();
  const prevLeftGrab = useRef(false);
  const prevRightGrab = useRef(false);

  const handleHandClick = (hand: HandData | null, prevGrabRef: React.MutableRefObject<boolean>) => {
    if (!hand) {
      prevGrabRef.current = false;
      return;
    }
    const isGrabbing = hand.isGrabbing || hand.isPinching;
    if (isGrabbing && !prevGrabRef.current) {
      const x = (1 - hand.indexFinger.x) * window.innerWidth;
      const y = hand.indexFinger.y * window.innerHeight;
      
      // Temporarily hide the cursor elements so document.elementFromPoint doesn't hit them
      const cursors = document.querySelectorAll('.hand-cursor-element');
      cursors.forEach(c => (c as HTMLElement).style.pointerEvents = 'none');
      
      const el = document.elementFromPoint(x, y);
      
      if (el instanceof HTMLElement) {
        el.click();
      }
      
      cursors.forEach(c => (c as HTMLElement).style.pointerEvents = '');
    }
    prevGrabRef.current = isGrabbing;
  };

  useEffect(() => {
    handleHandClick(leftHand, prevLeftGrab);
    handleHandClick(rightHand, prevRightGrab);
  }, [leftHand, rightHand]);

  if (!isReady) {
    return (
      <div className="fixed top-4 left-4 z-[100] flex items-center gap-2 bg-ob-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-ob-border">
        <div className="w-2 h-2 rounded-full bg-ob-alert animate-pulse" />
        <span className="text-[10px] font-sans uppercase tracking-widest text-ob-muted">Initializing Spatial Input...</span>
      </div>
    );
  }

  if (!leftHand && !rightHand) {
    return (
      <div className="fixed top-4 left-4 z-[100] flex items-center gap-2 bg-ob-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-ob-border">
        <div className="w-2 h-2 rounded-full bg-ob-muted" />
        <span className="text-[10px] font-sans uppercase tracking-widest text-ob-muted">Spatial Input Ready (Hands not detected)</span>
      </div>
    );
  }

  const renderCursor = (hand: HandData, label: string, colorClass: string, borderColorClass: string) => {
    const x = (1 - hand.indexFinger.x) * window.innerWidth;
    const y = hand.indexFinger.y * window.innerHeight;

    return (
      <motion.div
        key={label}
        className="hand-cursor-element fixed top-0 left-0 pointer-events-none z-[100] flex items-center justify-center"
        animate={{
          x: x - 16, // Center the cursor (32x32)
          y: y - 16,
          scale: hand.isPinching || hand.isGrabbing ? 0.8 : 1,
        }}
        transition={{ type: 'spring', stiffness: 800, damping: 35, mass: 0.5 }}
      >
        <div className={`
          w-8 h-8 rounded-full border-2 backdrop-blur-sm transition-colors duration-200 flex items-center justify-center
          ${hand.isGrabbing ? 'bg-ob-critical/40 border-ob-critical' : 
            hand.isPinching ? `${colorClass}/40 ${borderColorClass}` : 
            'bg-ob-surface/40 border-ob-text/50'}
        `}>
          <span className="text-[8px] font-mono font-bold text-white/50">{label}</span>
        </div>
        
        {/* Reticle crosshairs */}
        <div className="absolute w-12 h-[1px] bg-ob-text/30" />
        <div className="absolute h-12 w-[1px] bg-ob-text/30" />
      </motion.div>
    );
  };

  return (
    <>
      <div className="fixed top-4 left-4 z-[100] flex items-center gap-2 bg-ob-surface/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-ob-border">
        <div className="w-2 h-2 rounded-full bg-ob-safe" />
        <span className="text-[10px] font-sans uppercase tracking-widest text-ob-safe">Spatial Input Active</span>
      </div>

      {leftHand && renderCursor(leftHand, 'L', 'bg-blue-500', 'border-blue-500')}
      {rightHand && renderCursor(rightHand, 'R', 'bg-ob-safe', 'border-ob-safe')}
    </>
  );
}
