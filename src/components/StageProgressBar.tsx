import React from 'react';
import { Route, Navigation, RefreshCw, Zap } from 'lucide-react';

export type StageId = 1 | 2 | 3 | 4;

interface StageProgressBarProps {
  activeStage: StageId;
  onSelectStage: (stage: StageId) => void;
}

const STAGES = [
  {
    id: 1 as StageId,
    number: '01',
    title: 'Shortest Paths',
    subtitle: "Dijkstra's Algorithm",
    icon: Navigation,
  },
  {
    id: 2 as StageId,
    number: '02',
    title: 'Initial Tour',
    subtitle: 'Nearest Neighbour Greedy',
    icon: Route,
  },
  {
    id: 3 as StageId,
    number: '03',
    title: 'Route Refinement',
    subtitle: '2-opt Edge Swaps',
    icon: RefreshCw,
  },
  {
    id: 4 as StageId,
    number: '04',
    title: 'Dynamic Mid-Journey',
    subtitle: 'Real-Time Disruption',
    icon: Zap,
  },
];

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  activeStage,
  onSelectStage,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-2.5">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {STAGES.map(stage => {
          const isActive = stage.id === activeStage;
          const isPassed = stage.id < activeStage;
          const Icon = stage.icon;

          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              className={`flex items-center space-x-3 p-2 rounded-lg text-left transition-all border ${
                isActive
                  ? 'bg-blue-50/70 border-blue-600 shadow-sm ring-1 ring-blue-600/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-blue-700 text-white'
                    : isPassed
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                      isActive ? 'text-blue-700' : 'text-slate-400'
                    }`}
                  >
                    Stage {stage.number}
                  </span>
                  {isPassed && (
                    <span className="text-[10px] text-teal-600 font-semibold">✓</span>
                  )}
                </div>
                <div
                  className={`text-xs font-semibold truncate ${
                    isActive ? 'text-blue-950 font-bold' : 'text-slate-700'
                  }`}
                >
                  {stage.title}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {stage.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
