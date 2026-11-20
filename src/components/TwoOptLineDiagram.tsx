import React from 'react';
import type { TwoOptStep } from '../types/graph';
import { Scissors, RefreshCw, Plus, CheckCircle, TrendingDown } from 'lucide-react';

interface TwoOptLineDiagramProps {
  step: TwoOptStep | null;
}

export const TwoOptLineDiagram: React.FC<TwoOptLineDiagramProps> = ({ step }) => {
  if (!step) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4 text-center text-xs text-slate-400">
        Run or step through 2-opt to see the 3-row swap mechanism diagram.
      </div>
    );
  }

  const {
    edge1,
    edge2,
    cutCost,
    reversedSegment,
    reconnectEdge1,
    reconnectEdge2,
    addedCost,
    netSaving,
    isImproving,
    tourBefore,
    tourAfter,
    costBefore,
    costAfter,
  } = step;

  const reversedChain = [...reversedSegment].reverse();

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
          <span>2-Opt Mechanics (Cut &bull; Invert &bull; Reconnect)</span>
        </span>
        <div className="flex items-center space-x-2">
          {isImproving ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
              <CheckCircle className="w-3.5 h-3.5 text-teal-700" />
              <span>Accepted Swap (-{netSaving.toFixed(1)} mins)</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <span>Rejected (+{(-netSaving).toFixed(1)} mins penalty)</span>
            </span>
          )}
        </div>
      </div>

      {/* Row 1: Cut 2 Edges */}
      <div className="bg-red-50/50 border border-red-200 rounded-lg p-2.5 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1.5 font-bold text-red-900">
            <Scissors className="w-3.5 h-3.5 text-red-600" />
            <span>Row 1 &bull; Cut 2 Edges:</span>
            <span className="font-mono text-red-700">
              ({edge1.u}–{edge1.v}) &amp; ({edge2.u}–{edge2.v})
            </span>
          </div>
          <span className="font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
            Removed Cost: {cutCost.toFixed(1)}m ({edge1.cost.toFixed(1)}m + {edge2.cost.toFixed(1)}m)
          </span>
        </div>

        {/* Linear display before swap with cut crosses */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1 font-mono text-[11px]">
          {tourBefore.map((node, i) => {
            const isCut1 = i === edge1.index1;
            const isCut2 = i === edge2.index1;

            return (
              <React.Fragment key={i}>
                <span
                  className={`px-1.5 py-0.5 rounded font-bold ${
                    node === 'W'
                      ? 'bg-blue-900 text-white'
                      : 'bg-white border border-slate-300 text-slate-800'
                  }`}
                >
                  {node}
                </span>

                {i < tourBefore.length - 1 && (
                  <span className="flex items-center px-0.5">
                    {isCut1 || isCut2 ? (
                      <span className="flex items-center space-x-0.5 font-bold text-red-600 bg-red-100 px-1 py-0.5 rounded border border-red-300">
                        <span>&times;</span>
                        <span className="text-[9px]">CUT</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">&mdash;</span>
                    )}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Row 2: Reverse Middle Chain */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 font-semibold text-blue-950">
            <RefreshCw className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>Row 2 &bull; Invert Sub-tour Chain:</span>
            <div className="flex items-center space-x-1.5 font-mono">
              <span className="bg-white border border-blue-300 px-1.5 py-0.5 rounded text-blue-900 line-through opacity-70">
                [{reversedSegment.join(' &rarr; ')}]
              </span>
              <span className="text-blue-600">&rArr;</span>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded font-bold shadow-sm">
                [{reversedChain.join(' &rarr; ')}]
              </span>
            </div>
          </div>
          <span className="text-[11px] text-blue-800 font-mono hidden sm:inline">
            Uncrosses crossing legs
          </span>
        </div>
      </div>

      {/* Row 3: Reconnect with New Edges */}
      <div className="bg-teal-50/50 border border-teal-200 rounded-lg p-2.5 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1.5 font-bold text-teal-950">
            <Plus className="w-3.5 h-3.5 text-teal-700" />
            <span>Row 3 &bull; Reconnect New Edges:</span>
            <span className="font-mono text-teal-800">
              ({reconnectEdge1.u}–{reconnectEdge1.v}) &amp; ({reconnectEdge2.u}–{reconnectEdge2.v})
            </span>
          </div>
          <span className="font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded border border-teal-200">
            Added Cost: {addedCost.toFixed(1)}m ({reconnectEdge1.cost.toFixed(1)}m + {reconnectEdge2.cost.toFixed(1)}m)
          </span>
        </div>

        {/* Linear display after swap */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1 font-mono text-[11px]">
          {tourAfter.map((node, i) => {
            const isNew1 =
              (node === reconnectEdge1.u && tourAfter[i + 1] === reconnectEdge1.v) ||
              (node === reconnectEdge2.u && tourAfter[i + 1] === reconnectEdge2.v);

            return (
              <React.Fragment key={i}>
                <span
                  className={`px-1.5 py-0.5 rounded font-bold ${
                    node === 'W'
                      ? 'bg-blue-900 text-white'
                      : 'bg-white border border-slate-300 text-slate-800'
                  }`}
                >
                  {node}
                </span>

                {i < tourAfter.length - 1 && (
                  <span className="flex items-center px-0.5">
                    {isNew1 ? (
                      <span className="flex items-center space-x-0.5 font-bold text-teal-700 bg-teal-100 px-1 py-0.5 rounded border border-teal-300">
                        <span>+</span>
                        <span className="text-[9px]">NEW</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">&mdash;</span>
                    )}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Net Saving Banner */}
      {isImproving && (
        <div className="bg-emerald-600 text-white rounded-md px-3 py-2 flex items-center justify-between text-xs font-mono shadow-sm">
          <div className="flex items-center space-x-1.5 font-semibold">
            <TrendingDown className="w-4 h-4 text-emerald-200" />
            <span>Net Saving:</span>
            <span>{cutCost.toFixed(1)}m &minus; {addedCost.toFixed(1)}m = </span>
            <span className="font-bold underline text-amber-200">{netSaving.toFixed(1)} mins saved!</span>
          </div>
          <div className="font-bold text-emerald-100">
            {costBefore.toFixed(1)}m &rarr; {costAfter.toFixed(1)}m
          </div>
        </div>
      )}
    </div>
  );
};
