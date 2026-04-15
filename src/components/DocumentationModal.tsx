import React from 'react';
import { X, FileText, Image as ImageIcon, Map } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-slate-900 border border-white/10 w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-light tracking-widest uppercase text-white">Project Specification: HMI 2030</h2>
              <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-12 text-slate-300 font-sans">
              
              {/* User Journey */}
              <section>
                <div className="flex items-center gap-3 mb-4 text-emerald-400">
                  <Map size={24} />
                  <h3 className="text-lg font-bold uppercase tracking-wider">User Journey: The "Ghost" Vibration</h3>
                </div>
                <div className="pl-9 border-l border-white/10 space-y-4">
                  <p>
                    <strong className="text-white">08:15 AM:</strong> Senior Operator Elena puts on her AR headset. The "Macro View" initializes—a dark void populated by a glowing constellation of 150 turbines.
                  </p>
                  <p>
                    <strong className="text-white">08:17 AM:</strong> A subtle haptic pulse on her wrist draws attention to Sector 4. In the graph, node <span className="text-amber-400">WTG007</span> is pulsing amber. It's not a critical alarm yet, but the AI has detected a "predictive anomaly."
                  </p>
                  <p>
                    <strong className="text-white">08:18 AM:</strong> Elena performs a "pinch-and-zoom" gesture on WTG007. The interface transitions seamlessly (Micro View). She is now floating 50 meters above the North Sea, looking at the digital twin of Turbine 7.
                  </p>
                  <p>
                    <strong className="text-white">08:19 AM:</strong> She says, <em>"Show gearbox vibration analysis, last 24 hours."</em> A volumetric panel unfolds from the nacelle. The "Data Model" (AI prediction) diverges from the "Physical Model" starting 2 hours ago.
                  </p>
                  <p>
                    <strong className="text-white">08:20 AM:</strong> The diagnosis is clear: a micro-fracture in the high-speed shaft bearing, invisible to standard sensors but detected by audio-spectrum analysis. She swipes the panel to the "Maintenance" queue and authorizes a drone inspection with a nod.
                  </p>
                </div>
              </section>

              {/* UI/UX Breakdown */}
              <section>
                <div className="flex items-center gap-3 mb-4 text-blue-400">
                  <FileText size={24} />
                  <h3 className="text-lg font-bold uppercase tracking-wider">UI/UX Component Breakdown: Volumetric Data Panels</h3>
                </div>
                <div className="pl-9 border-l border-white/10 grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-white font-bold mb-2">Visual Language</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li><strong>Material:</strong> "Aerogel Glass" – semi-transparent, refractive, with a subtle frosted blur (backdrop-filter: blur(20px)).</li>
                      <li><strong>Typography:</strong> Monospace (JetBrains Mono) for data, Sans-serif (Inter) for labels. High contrast white text.</li>
                      <li><strong>Anchoring:</strong> Panels are tethered to the physical asset via a thin, glowing "leader line" that obeys physics (sways slightly with wind).</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-2">Interaction Model</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      <li><strong>Gaze-to-Activate:</strong> Panels are dimmed (30% opacity) until the user looks at them (100% opacity).</li>
                      <li><strong>Proximity Scaling:</strong> UI elements scale down as the user moves closer to prevent occlusion of the physical asset.</li>
                      <li><strong>Dismissal:</strong> A casual "swat" gesture sends the panel back into the turbine object.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Image Prompts */}
              <section>
                <div className="flex items-center gap-3 mb-4 text-purple-400">
                  <ImageIcon size={24} />
                  <h3 className="text-lg font-bold uppercase tracking-wider">Midjourney / DALL-E Prompts</h3>
                </div>
                <div className="pl-9 border-l border-white/10 space-y-6">
                  <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                    <div className="text-xs text-white/40 uppercase mb-2">Prompt 1: The Macro View</div>
                    <code className="text-sm text-purple-200">
                      Cinematic shot of a futuristic holographic control room, dark mode, a massive 3D neural network graph floating in the air representing a wind farm, glowing nodes connected by lines of light, data streams flowing, an operator in silhouette wearing an AR headset interacting with the light with hand gestures, 8k resolution, unreal engine 5 render, cyberpunk aesthetic but clean --ar 16:9
                    </code>
                  </div>
                  <div className="bg-black/30 p-4 rounded-lg border border-white/5">
                    <div className="text-xs text-white/40 uppercase mb-2">Prompt 2: The Micro View</div>
                    <code className="text-sm text-purple-200">
                      First-person view through AR glasses, looking at a photorealistic offshore wind turbine in the middle of a stormy ocean, a floating semi-transparent frosted glass UI panel hovers next to the turbine blades displaying red warning graphs and temperature data, rain droplets on the virtual lens, high contrast, futuristic UI design, hyper-realistic --ar 16:9
                    </code>
                  </div>
                </div>
              </section>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DocumentationModal;
