import React from 'react';
import type { NearestNeighbourStep, NearestNeighbourResult } from '../types/graph';
import { AlertTriangle, CheckCircle2, ChevronRight, Lock } from 'lucide-react';

interface NearestNeighbourPanelProps {
  currentStep: NearestNeighbourStep | null;
  result: NearestNeighbourResult;
}

export const NearestNeighbourPanel: React.FC<NearestNeighbourPanelProps> = ({
  currentStep,
  result,
}) => {
  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Growing Route Strip */}
      <div className="bg-white border border-slate-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-800 flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Constructed Route Strip</span>
          </span>
          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {currentStep?.cumulativeCost.toFixed(1)} mins
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {currentStep?.cumulativeTour.map((nodeId, idx, arr) => (
            <React.Fragment key={idx}>
              <span
                className={`px-2 py-1 rounded font-bold border ${
                  idx === arr.length - 1
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : nodeId === 'W'
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                {nodeId}
              </span>
              {idx < arr.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Candidate Decisions at Current Step */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-semibold text-slate-800">
            Unvisited Candidates from {currentStep?.currentNodeId}
          </span>
          <span className="text-slate-500 font-mono text-[11px]">Matrix T Cost</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {currentStep?.candidates.map(candidate => {
            const isChosen = candidate.isMinimum;

            return (
              <div
                key={candidate.nodeId}
                className={`flex items-center justify-between p-2 rounded border text-xs transition-colors ${
                  isChosen
                    ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300'
                    : candidate.isBacktrack
                    ? 'bg-red-50/60 border-red-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
                      isChosen
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {candidate.nodeId}
                  </span>
                  <div>
                    <div className="flex items-center space-x-1 font-mono text-[11px] text-slate-600">
                      <span>Path:</span>
                      <span>[{candidate.path.join(' → ')}]</span>
                    </div>
                    {candidate.isBacktrack && (
                      <span className="inline-flex items-center space-x-1 text-[10px] text-red-700 font-semibold">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>Backtracks via {candidate.backtrackVia?.join(', ')}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 font-mono">
                  <span
                    className={`font-bold ${
                      isChosen ? 'text-amber-700 text-sm' : 'text-slate-600'
                    }`}
                  >
                    {candidate.time.toFixed(1)}m
                  </span>
                  {isChosen && (
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Min
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Greedy Trap Callout if backtrack is chosen */}
      {currentStep?.chosenCandidate?.isBacktrack && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 text-xs text-red-900">
          <div className="flex items-center space-x-1.5 font-bold mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Classic Nearest Neighbour Greedy Trap</span>
          </div>
          <p className="text-[11px] leading-relaxed text-red-800">
            Because earlier greedy choices prioritised immediate short hops (like A &rarr; C &rarr; E &rarr; D), Stop {currentStep.chosenCandidate.nodeId} was isolated. The cart is now forced to traverse already-visited node {currentStep.chosenCandidate.backtrackVia?.join(', ')}, incurring a massive {currentStep.chosenCandidate.time.toFixed(1)} mins penalty!
          </p>
        </div>
      )}

      {/* Completion Summary */}
      {currentStep && currentStep.stepIndex === result.steps.length - 1 && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-xs text-emerald-950">
          <div className="flex items-center space-x-1.5 font-bold mb-1 text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Nearest Neighbour Baseline Finished</span>
          </div>
          <p className="text-[11px] text-emerald-800">
            Tour: <span className="font-mono font-bold">{result.tour.join(' → ')}</span>
            <br />
            Baseline Travel Time: <span className="font-mono font-bold text-amber-900">{result.totalCost.toFixed(1)} mins</span>.
            Proceed to Stage 3 to see how 2-opt uncrosses this trap.
          </p>
        </div>
      )}
    </div>
  );
};
