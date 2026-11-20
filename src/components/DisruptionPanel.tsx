import React from 'react';
import type { RoadNetwork, DisruptionComparison } from '../types/graph';
import { AlertOctagon, CheckCircle2, Flame, MapPin, Sparkles, Split } from 'lucide-react';

interface DisruptionPanelProps {
  network: RoadNetwork;
  stage3Tour: string[];
  disruption: DisruptionComparison;
  activeDisruptionView: 'dynamic' | 'static';
  onDisruptionViewChange: (view: 'dynamic' | 'static') => void;
  onSelectCartPosition: (pos: string) => void;
  onSelectDisruptedEdge: (edge: { u: string; v: string }, factor: number) => void;
  onLoadReportScenario: () => void;
  isIterMode: boolean;
}

export const DisruptionPanel: React.FC<DisruptionPanelProps> = ({
  network,
  stage3Tour,
  disruption,
  activeDisruptionView,
  onDisruptionViewChange,
  onSelectCartPosition,
  onSelectDisruptedEdge,
  onLoadReportScenario,
  isIterMode,
}) => {
  const currentPos = disruption.cartPosition;

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Quick Report Scenario Button */}
      {isIterMode && (
        <button
          onClick={onLoadReportScenario}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-300" />
          <span>Load Report Scenario (Cart at B*, Block C–E)</span>
        </button>
      )}

      {/* Disruption Setup Controls */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5 text-xs">
        <div className="flex items-center justify-between font-semibold text-slate-800 border-b border-slate-200 pb-1.5">
          <span className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-700" />
            <span>Delivery Cart State</span>
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            Completed: {disruption.completedTime.toFixed(1)} mins
          </span>
        </div>

        {/* Current Position Selector along Stage 3 Tour */}
        <div>
          <label className="text-[11px] text-slate-500 block mb-1">
            Current Cart Position on Route:
          </label>
          <div className="flex flex-wrap gap-1">
            {stage3Tour.slice(0, -1).map((stopId, idx) => {
              const isSelected = stopId === currentPos;
              const isPast = stage3Tour.indexOf(stopId) < stage3Tour.indexOf(currentPos);

              return (
                <button
                  key={`${stopId}-${idx}`}
                  onClick={() => onSelectCartPosition(stopId)}
                  className={`px-2 py-1 rounded font-mono text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-blue-700 text-white border-blue-700 shadow-sm ring-2 ring-blue-300'
                      : isPast
                      ? 'bg-slate-200 text-slate-500 border-slate-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {stopId}
                  {isSelected && '*'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Disrupted Road Selector */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">
              Disrupted Road:
            </label>
            <select
              value={`${disruption.disruptedEdge.u}-${disruption.disruptedEdge.v}`}
              onChange={e => {
                const [u, v] = e.target.value.split('-');
                onSelectDisruptedEdge({ u, v }, disruption.disruptedCondition);
              }}
              className="w-full font-mono text-xs font-semibold bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 outline-none"
            >
              {network.edges.map(e => (
                <option key={e.id} value={`${e.u}-${e.v}`}>
                  Road {e.u}&ndash;{e.v} ({e.distance_m}m)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 block mb-1">
              Disruption Severity:
            </label>
            <div className="flex space-x-1">
              <button
                onClick={() =>
                  onSelectDisruptedEdge(disruption.disruptedEdge, Infinity)
                }
                className={`flex-1 py-1 rounded text-xs font-semibold border transition-colors flex items-center justify-center space-x-1 ${
                  disruption.disruptedCondition === Infinity
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <AlertOctagon className="w-3 h-3" />
                <span>Blocked (&infin;)</span>
              </button>
              <button
                onClick={() =>
                  onSelectDisruptedEdge(disruption.disruptedEdge, 2.5)
                }
                className={`flex-1 py-1 rounded text-xs font-semibold border transition-colors flex items-center justify-center space-x-1 ${
                  disruption.disruptedCondition === 2.5
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>Crowded (2.5)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {/* Static Plan Card */}
        <div
          onClick={() => onDisruptionViewChange('static')}
          className={`cursor-pointer rounded-lg p-3 border transition-all ${
            activeDisruptionView === 'static'
              ? 'bg-red-50/70 border-red-400 ring-2 ring-red-400/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-red-900 flex items-center space-x-1">
              <span>Static Plan</span>
              <span className="text-[10px] text-red-600 font-normal">(Detour Only)</span>
            </span>
            <span className="font-mono font-bold text-red-700 text-sm">
              {disruption.staticPlan.totalTime.toFixed(1)}m
            </span>
          </div>

          <p className="text-[11px] text-slate-600 mb-2">
            Remaining: <span className="font-mono font-bold">{disruption.staticPlan.remainingTime.toFixed(1)}m</span> (Completed: {disruption.completedTime.toFixed(1)}m)
          </p>

          <div className="bg-white p-1.5 rounded border border-slate-200 font-mono text-[10px] text-slate-700">
            <span className="text-slate-400 block mb-0.5">Static Sequence:</span>
            <span>[{currentPos}* &rarr; {disruption.staticPlan.sequence.join(' &rarr; ')}]</span>
          </div>

          <div className="mt-2 text-[10px] text-red-700 font-medium flex items-center space-x-1">
            <span>Forces detour without re-ordering remaining stops</span>
          </div>
        </div>

        {/* Dynamic Re-routing Card */}
        <div
          onClick={() => onDisruptionViewChange('dynamic')}
          className={`cursor-pointer rounded-lg p-3 border transition-all ${
            activeDisruptionView === 'dynamic'
              ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-teal-950 flex items-center space-x-1">
              <span>Dynamic Route</span>
              <span className="text-[10px] bg-teal-200 text-teal-900 font-bold px-1 rounded">
                -{disruption.timeSaved.toFixed(1)}m
              </span>
            </span>
            <span className="font-mono font-bold text-teal-900 text-sm">
              {disruption.dynamicPlan.totalTime.toFixed(1)}m
            </span>
          </div>

          <p className="text-[11px] text-slate-600 mb-2">
            Remaining: <span className="font-mono font-bold">{disruption.dynamicPlan.remainingTime.toFixed(1)}m</span> (Completed: {disruption.completedTime.toFixed(1)}m)
          </p>

          <div className="bg-white p-1.5 rounded border border-slate-200 font-mono text-[10px] text-slate-700">
            <span className="text-slate-400 block mb-0.5">Re-optimised Sequence:</span>
            <span className="text-teal-900 font-bold">
              [{currentPos}* &rarr; {disruption.dynamicPlan.sequence.join(' &rarr; ')}]
            </span>
          </div>

          <div className="mt-2 text-[10px] text-teal-800 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            <span>Eliminates backtrack across remaining stops</span>
          </div>
        </div>
      </div>

      {/* Disruption Visual Toggle Bar */}
      <div className="bg-slate-100 p-1 rounded-lg flex items-center space-x-1 border border-slate-200 text-xs">
        <button
          onClick={() => onDisruptionViewChange('static')}
          className={`flex-1 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center space-x-1.5 ${
            activeDisruptionView === 'static'
              ? 'bg-white text-red-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>Show Static Detour ({disruption.staticPlan.totalTime.toFixed(1)}m)</span>
        </button>

        <button
          onClick={() => onDisruptionViewChange('dynamic')}
          className={`flex-1 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center space-x-1.5 ${
            activeDisruptionView === 'dynamic'
              ? 'bg-white text-teal-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          <span>Show Dynamic Route ({disruption.dynamicPlan.totalTime.toFixed(1)}m)</span>
        </button>
      </div>
    </div>
  );
};
