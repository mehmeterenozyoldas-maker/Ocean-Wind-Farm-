import React, { useState } from 'react';
import { useStore } from './store';
import MacroView from './components/MacroView';
import MicroView from './components/MicroView';
import DocumentationModal from './components/DocumentationModal';
import HandCursor from './components/HandCursor';
import { AnimatePresence, motion } from 'framer-motion';
import { Info } from 'lucide-react';

function App() {
  const { viewMode } = useStore();
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  return (
    <div className="w-screen h-screen bg-ob-bg text-ob-text overflow-hidden relative">
      <HandCursor />
      
      <AnimatePresence mode="wait">
        {viewMode === 'macro' ? (
          <motion.div 
            key="macro"
            className="w-full h-full"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <MacroView />
          </motion.div>
        ) : (
          <motion.div 
            key="micro"
            className="w-full h-full"
            initial={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <MicroView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Grain Overlay for "Cinematic/HMI" feel */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay z-40" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />

      {/* Documentation Toggle */}
      <button 
        onClick={() => setIsDocsOpen(true)}
        className="absolute bottom-8 right-8 z-50 bg-ob-surface/50 hover:bg-ob-surface-hover backdrop-blur-md p-3 rounded-full border border-ob-border transition-colors"
      >
        <Info size={24} className="text-ob-muted" />
      </button>

      <DocumentationModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}

export default App;
