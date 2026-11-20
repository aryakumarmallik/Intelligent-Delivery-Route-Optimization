import React, { useState } from 'react';
import { X, Link2, Check, Clock } from 'lucide-react';
import { computeTravelTime } from '../types/graph';

interface ConnectEdgeModalProps {
  u: string;
  v: string;
  onClose: () => void;
  onAddEdge: (u: string, v: string, distance_m: number, c: number) => void;
}

const PRESET_DISTANCES = [90, 120, 180, 240, 300];

export const ConnectEdgeModal: React.FC<ConnectEdgeModalProps> = ({
  u,
  v,
  onClose,
  onAddEdge,
}) => {
  const [distance, setDistance] = useState<number>(180);
  const [c, setC] = useState<number>(1.0);

  const travelTime = computeTravelTime(distance, c);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (distance > 0) {
      onAddEdge(u, v, distance, c);
      onClose();
    }
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
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Connect New Road</h3>
              <p className="text-xs text-slate-500 font-mono">
                Between Stop <span className="font-bold text-blue-700">{u}</span> and Stop <span className="font-bold text-blue-700">{v}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Distance Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">Distance (metres):</label>
              <span className="font-mono text-slate-500 font-bold">{distance} m</span>
            </div>

            <input
              type="number"
              min={30}
              max={2000}
              step={10}
              value={distance}
              onChange={e => setDistance(Math.max(10, Number(e.target.value)))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />

            {/* Quick preset distance buttons */}
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="text-[11px] text-slate-400">Presets:</span>
              {PRESET_DISTANCES.map(d => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDistance(d)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    distance === d
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>

          {/* Traffic Condition Selection */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">Traffic Condition (c):</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setC(1.0)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  c === 1.0
                    ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500 font-bold text-teal-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Clear (1.0)</span>
                  {c === 1.0 && <Check className="w-3.5 h-3.5 text-teal-600" />}
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Normal speed (60 m/min)</div>
              </button>

              <button
                type="button"
                onClick={() => setC(1.5)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  c === 1.5
                    ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500 font-bold text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Moderate (1.5)</span>
                  {c === 1.5 && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Light pedestrian traffic</div>
              </button>

              <button
                type="button"
                onClick={() => setC(2.5)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  c === 2.5
                    ? 'bg-red-50 border-red-500 ring-1 ring-red-500 font-bold text-red-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Crowded (2.5)</span>
                  {c === 2.5 && <Check className="w-3.5 h-3.5 text-red-600" />}
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Heavy peak rush</div>
              </button>

              <button
                type="button"
                onClick={() => setC(Infinity)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  c === Infinity
                    ? 'bg-red-100 border-red-600 ring-1 ring-red-600 font-bold text-red-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Blocked (&infin;)</span>
                  {c === Infinity && <Check className="w-3.5 h-3.5 text-red-700" />}
                </div>
                <div className="text-[10px] text-slate-400 font-normal">Road closed/repair</div>
              </button>
            </div>
          </div>

          {/* Real-time Computed Formula Preview */}
          <div className="bg-slate-100/80 rounded-lg p-2.5 flex items-center justify-between border border-slate-200">
            <div className="flex items-center space-x-1.5 text-slate-600">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Travel Time:</span>
              <span className="font-mono text-[11px] text-slate-500">
                ({distance} / 60) &times; {c === Infinity ? '∞' : c}
              </span>
            </div>
            <div className="font-mono text-sm font-bold text-blue-900">
              {travelTime === Infinity ? '∞ (Blocked)' : `${travelTime.toFixed(1)} mins`}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              Connect Road
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
