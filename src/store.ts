import { create } from 'zustand';

export type TurbineStatus = 'nominal' | 'warning' | 'critical' | 'offline';

export interface TelemetryData {
  rpm: number;
  pitchAngle: number;
  yawAngle: number;
  powerOutput: number; // kW
  gearboxTemp: number; // Celsius
  windSpeed: number; // m/s
  windDirection: number; // degrees
  generatorTemp: number; // Celsius
  gridLoad: number; // %
}

export interface TurbineData {
  id: string;
  name: string;
  status: TurbineStatus;
  telemetry: TelemetryData;
  position: [number, number, number];
}

interface AppState {
  viewMode: 'macro' | 'micro';
  selectedTurbineId: string | null;
  turbines: TurbineData[];
  setViewMode: (mode: 'macro' | 'micro') => void;
  setSelectedTurbineId: (id: string | null) => void;
  updateTurbineData: (id: string, data: Partial<TelemetryData>) => void;
}

// Generate initial mock data
const generateTurbines = (count: number): TurbineData[] => {
  const turbines: TurbineData[] = [];
  const rows = Math.sqrt(count);
  const spacing = 400; // meters

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / rows);
    const col = i % rows;
    
    // Add some randomness to positions to make it look organic/realistic
    const x = (col * spacing) - (rows * spacing / 2) + (Math.random() * 50 - 25);
    const z = (row * spacing) - (rows * spacing / 2) + (Math.random() * 50 - 25);

    const rand = Math.random();
    const status: TurbineStatus = rand > 0.9 ? (rand > 0.95 ? 'critical' : 'warning') : 'nominal';

    turbines.push({
      id: `WTG${String(i + 1).padStart(3, '0')}`,
      name: `Turbine ${i + 1}`,
      status,
      telemetry: {
        rpm: 12 + Math.random() * 2,
        pitchAngle: 10 + Math.random() * 5,
        yawAngle: 180 + Math.random() * 20,
        powerOutput: 5000 + Math.random() * 1000,
        gearboxTemp: 60 + Math.random() * 10,
        windSpeed: 12 + Math.random() * 3,
        windDirection: 180 + Math.random() * 20,
        generatorTemp: 70 + Math.random() * 15,
        gridLoad: 85 + Math.random() * 10,
      },
      position: [x, 0, z],
    });
  }
  
  // Force WTG007 to be the interesting one
  const wtg007Index = 6;
  if (turbines[wtg007Index]) {
    turbines[wtg007Index].id = 'WTG007';
    turbines[wtg007Index].name = 'Turbine 7';
    turbines[wtg007Index].status = 'warning';
    turbines[wtg007Index].telemetry.gearboxTemp = 82.4; // High temp
    turbines[wtg007Index].telemetry.rpm = 14.2;
  }

  return turbines;
};

export const useStore = create<AppState>((set) => ({
  viewMode: 'macro',
  selectedTurbineId: null,
  turbines: generateTurbines(16),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedTurbineId: (id) => set({ selectedTurbineId: id }),
  updateTurbineData: (id, data) => set((state) => ({
    turbines: state.turbines.map((t) => 
      t.id === id ? { ...t, telemetry: { ...t.telemetry, ...data } } : t
    )
  })),
}));
