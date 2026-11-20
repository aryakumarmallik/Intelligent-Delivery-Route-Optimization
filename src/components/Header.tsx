import React from 'react';
import { School, Layers, RotateCcw, Info, Compass } from 'lucide-react';

export type AppMode = 'iter_campus' | 'custom_graph';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onResetIterDefaults?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  onResetIterDefaults,
}) => {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Academic Title and Author */}
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Compass className="w-5 h-5 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Intelligent Delivery Route Optimisation
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 rounded">
                Under Dynamic Traffic
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Research by <span className="text-slate-800 font-semibold">Arya Kumar Mallik</span> &bull;{' '}
              <span className="text-slate-600">ITER, Siksha &apos;O&apos; Anusandhan (SOA)</span>
            </p>
          </div>
        </div>

        {/* Center: Formula Info Chip */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-600">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <div className="font-mono text-[11px]">
            <span className="text-slate-500">Travel time: </span>
            <span className="font-semibold text-slate-900">w(u, v) = (d / 60) &times; c</span>
            <span className="text-slate-400 ml-1.5">(v_base = 60 m/min)</span>
          </div>
        </div>

        {/* Right: Mode Switcher & Reset Button */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200">
            <button
              onClick={() => onModeChange('iter_campus')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === 'iter_campus'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>ITER Campus Case Study</span>
            </button>

            <button
              onClick={() => onModeChange('custom_graph')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                mode === 'custom_graph'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Custom Graph Lab</span>
            </button>
          </div>

          {mode === 'iter_campus' && onResetIterDefaults && (
            <button
              onClick={onResetIterDefaults}
              title="Reset all edge traffic conditions and positions to default ITER study"
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span className="hidden sm:inline">Reset ITER Defaults</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
