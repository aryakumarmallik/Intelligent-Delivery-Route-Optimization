import React from 'react';
import { X, Trash2, RotateCw, Clock, ArrowRightLeft } from 'lucide-react';
import type { GraphEdge } from '../types/graph';
import { computeTravelTime } from '../types/graph';

interface EditEdgeModalProps {
  edge: GraphEdge;
  onClose: () => void;
  onUpdateEdge: (edgeId: string, updates: Partial<GraphEdge>) => void;
  onDeleteEdge: (edgeId: string) => void;
}

const PRESET_DISTANCES = [90, 120, 180, 240, 300];

export const EditEdgeModal: React.FC<EditEdgeModalProps> = ({
  edge,
  onClose,
  onUpdateEdge,
  onDeleteEdge,
}) => {
  const travelTime = computeTravelTime(edge.distance_m, edge.c);

  const handleCycleTraffic = () => {
    let nextC = 1.0;
    if (edge.c === 1.0) nextC = 1.5;
    else if (edge.c === 1.5) nextC = 2.5;
    else if (edge.c === 2.5) nextC = Infinity;
    else nextC = 1.0;

    onUpdateEdge(edge.id, { c: nextC });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Configure Road</h3>
              <p className="text-xs text-slate-500 font-mono">
                Road <span className="font-bold text-blue-700">{edge.u}</span> &harr; <span className="font-bold text-blue-700">{edge.v}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Distance */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">Distance (metres):</label>
              <span className="font-mono text-slate-600 font-bold">{edge.distance_m} m</span>
            </div>
            <input
              type="number"
              min={30}
              max={2000}
              step={10}
              value={edge.distance_m}
              onChange={e =>
                onUpdateEdge(edge.id, { distance_m: Math.max(10, Number(e.target.value)) })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {/* Quick presets */}
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="text-[11px] text-slate-400">Presets:</span>
              {PRESET_DISTANCES.map(d => (
                <button
                  type="button"
                  key={d}
                  onClick={() => onUpdateEdge(edge.id, { distance_m: d })}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    edge.distance_m === d
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          {/* Traffic Condition */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">Traffic Condition (c):</label>
              <button
                type="button"
                onClick={handleCycleTraffic}
                className="flex items-center space-x-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
              >
                <RotateCw className="w-3 h-3" />
                <span>Cycle Traffic</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateEdge(edge.id, { c: 1.0 })}
                className={`p-2 rounded-lg border text-left transition-all ${
                  edge.c === 1.0
                    ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500 font-bold text-teal-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div>Clear (1.0)</div>
                <div className="text-[10px] text-slate-400 font-normal">Normal 60 m/min</div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateEdge(edge.id, { c: 1.5 })}
                className={`p-2 rounded-lg border text-left transition-all ${
                  edge.c === 1.5
                    ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500 font-bold text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div>Moderate (1.5)</div>
                <div className="text-[10px] text-slate-400 font-normal">Light congestion</div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateEdge(edge.id, { c: 2.5 })}
                className={`p-2 rounded-lg border text-left transition-all ${
                  edge.c === 2.5
                    ? 'bg-red-50 border-red-500 ring-1 ring-red-500 font-bold text-red-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div>Crowded (2.5)</div>
                <div className="text-[10px] text-slate-400 font-normal">Heavy peak rush</div>
              </button>

              <button
                type="button"
                onClick={() => onUpdateEdge(edge.id, { c: Infinity })}
                className={`p-2 rounded-lg border text-left transition-all ${
                  edge.c === Infinity
                    ? 'bg-red-100 border-red-600 ring-1 ring-red-600 font-bold text-red-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div>Blocked (&infin;)</div>
                <div className="text-[10px] text-slate-400 font-normal">Road closed</div>
              </button>
            </div>
          </div>

          {/* Computed Travel Time */}
          <div className="bg-slate-100/80 rounded-lg p-2.5 flex items-center justify-between border border-slate-200">
            <div className="flex items-center space-x-1.5 text-slate-600">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Travel Time:</span>
            </div>
            <div className="font-mono text-sm font-bold text-blue-900">
              {travelTime === Infinity ? '∞ (Blocked)' : `${travelTime.toFixed(1)} mins`}
            </div>
          </div>

          {/* Delete Road Button */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onDeleteEdge(edge.id);
                onClose();
              }}
              className="flex items-center space-x-1.5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Road</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
