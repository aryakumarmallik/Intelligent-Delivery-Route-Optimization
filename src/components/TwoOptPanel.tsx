import React from 'react';
import type { TwoOptResult, TwoOptStep } from '../types/graph';
import { CheckCircle2, Filter, Sparkles, TrendingDown } from 'lucide-react';

interface TwoOptPanelProps {
  result: TwoOptResult;
  currentStep: TwoOptStep | null;
  filterMode: 'key_swaps' | 'all';
  onFilterModeChange: (mode: 'key_swaps' | 'all') => void;
}

export const TwoOptPanel: React.FC<TwoOptPanelProps> = ({
  result,
  currentStep,
  filterMode,
  onFilterModeChange,
}) => {
  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Filter Mode Toggle */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Evaluation Depth:</span>
        </div>

        <div className="flex space-x-1 bg-slate-100 p-0.5 rounded-md text-xs">
          <button
            onClick={() => onFilterModeChange('key_swaps')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterMode === 'key_swaps'
                ? 'bg-white text-blue-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Key Swaps Only (Crisp)
          </button>
          <button
            onClick={() => onFilterModeChange('all')}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterMode === 'all'
                ? 'bg-white text-blue-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Every Checked Pair ({result.allSteps.length})
          </button>
        </div>
      </div>

      {/* Tour Metrics Comparison Card */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
            Initial NN Tour
          </div>
          <div className="text-base font-bold font-mono text-amber-900 mt-0.5">
            {result.initialCost.toFixed(1)} mins
          </div>
          <div className="text-[11px] text-amber-700 truncate font-mono mt-1">
            [{result.initialTour.join(' → ')}]
          </div>
        </div>

        <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-2.5">
          <div className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider flex items-center justify-between">
            <span>Optimised 2-opt</span>
            <span className="text-[10px] bg-teal-200 text-teal-900 px-1 rounded font-bold">
              -{result.totalSaved.toFixed(1)}m
            </span>
          </div>
          <div className="text-base font-bold font-mono text-teal-900 mt-0.5 flex items-center space-x-1.5">
            <span>{result.finalCost.toFixed(1)} mins</span>
            <TrendingDown className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-[11px] text-teal-700 truncate font-mono mt-1">
            [{result.finalTour.join(' → ')}]
          </div>
        </div>
      </div>

      {/* Current Step Summary */}
      {currentStep && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800">
              Examining Pair ({currentStep.edge1.u}&ndash;{currentStep.edge1.v}) &amp; (
              {currentStep.edge2.u}&ndash;{currentStep.edge2.v})
            </span>
            <span
              className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                currentStep.isImproving
                  ? 'bg-teal-100 text-teal-800 border border-teal-300'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {currentStep.isImproving
                ? `Saves ${currentStep.netSaving.toFixed(1)}m`
                : 'No Improvement'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Remove Edges:</span>
              <span className="text-red-700 font-bold">
                {currentStep.cutCost.toFixed(1)} mins
              </span>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Add Reconnects:</span>
              <span className="text-teal-700 font-bold">
                {currentStep.addedCost.toFixed(1)} mins
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Final Optimisation Insight */}
      <div className="bg-white border border-teal-200 rounded-lg p-3 text-xs text-slate-700 space-y-1.5 shadow-sm">
        <div className="flex items-center space-x-1.5 font-bold text-teal-950">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Academic Insight: Why 2-opt Succeeded</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Nearest Neighbour greedily chained <span className="font-mono font-semibold">A &rarr; C &rarr; E &rarr; D</span>, leaving node <span className="font-mono font-semibold">B</span> isolated from <span className="font-mono font-semibold">F</span>. 
          2-opt detected that uncrossing the tour to <span className="font-mono font-semibold">A &rarr; B &rarr; D &rarr; E &rarr; C &rarr; F</span> visits BioTech Block (B) early, eliminating the expensive 9.0 min backtrack.
        </p>
      </div>
    </div>
  );
};
