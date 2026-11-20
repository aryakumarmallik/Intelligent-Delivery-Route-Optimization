import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import type { RoadNetwork, GraphEdge } from '../types/graph';
import { computeTravelTime } from '../types/graph';

interface RoadManagerModalProps {
  network: RoadNetwork;
  onClose: () => void;
  onUpdateEdge: (edgeId: string, updates: Partial<GraphEdge>) => void;
  onDeleteEdge: (edgeId: string) => void;
  onAddEdge: (u: string, v: string, distance_m: number, c: number) => void;
}

export const RoadManagerModal: React.FC<RoadManagerModalProps> = ({
  network,
  onClose,
  onUpdateEdge,
  onDeleteEdge,
  onAddEdge,
}) => {
  const [newU, setNewU] = useState<string>(network.nodes[0]?.id || 'W');
  const [newV, setNewV] = useState<string>(network.nodes[1]?.id || 'A');
  const [newDistance, setNewDistance] = useState<number>(180);
  const [newC, setNewC] = useState<number>(1.0);

  const handleAddNewEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (newU && newV && newU !== newV && newDistance > 0) {
      onAddEdge(newU, newV, newDistance, newC);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Roads &amp; Traffic Manager</h3>
              <p className="text-xs text-slate-500">
                Inspect, modify weights, adjust traffic conditions, or add/delete roads.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Road List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Add New Road Inline Bar */}
          <form
            onSubmit={handleAddNewEdge}
            className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 text-xs space-y-3"
          >
            <div className="font-bold text-blue-950 flex items-center space-x-1.5">
              <Plus className="w-4 h-4 text-blue-700" />
              <span>Connect New Road Between Stops</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
              <div>
                <label className="text-slate-500 font-medium block mb-1">From Stop:</label>
                <select
                  value={newU}
                  onChange={e => setNewU(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 font-mono text-xs font-semibold"
                >
                  {network.nodes.map(n => (
                    <option key={n.id} value={n.id}>
                      {n.id} {n.isHub ? '(Hub)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">To Stop:</label>
                <select
                  value={newV}
                  onChange={e => setNewV(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 font-mono text-xs font-semibold"
                >
                  {network.nodes.map(n => (
                    <option key={n.id} value={n.id} disabled={n.id === newU}>
                      {n.id} {n.isHub ? '(Hub)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Distance (m):</label>
                <input
                  type="number"
                  min={30}
                  step={10}
                  value={newDistance}
                  onChange={e => setNewDistance(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 font-mono text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={newU === newV}
                  className="w-full py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-semibold rounded-md shadow-sm transition-colors"
                >
                  Connect Road
                </button>
              </div>
            </div>
          </form>

          {/* Table of Existing Roads */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Road</th>
                  <th className="py-2.5 px-3">Distance (m)</th>
                  <th className="py-2.5 px-3">Traffic Factor c</th>
                  <th className="py-2.5 px-3">Travel Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {network.edges.map(edge => {
                  const time = computeTravelTime(edge.distance_m, edge.c);
                  const isBlocked = edge.c === Infinity;
                  const isCrowded = edge.c === 2.5;
                  const isModerate = edge.c === 1.5;

                  return (
                    <tr key={edge.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 font-bold text-slate-800">
                        <span className="inline-flex items-center space-x-1">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                            {edge.u}
                          </span>
                          <span className="text-slate-400">&harr;</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                            {edge.v}
                          </span>
                        </span>
                      </td>

                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min={30}
                          step={10}
                          value={edge.distance_m}
                          onChange={e =>
                            onUpdateEdge(edge.id, {
                              distance_m: Math.max(10, Number(e.target.value)),
                            })
                          }
                          className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs font-semibold text-slate-800"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => onUpdateEdge(edge.id, { c: 1.0 })}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              edge.c === 1.0
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            1.0
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateEdge(edge.id, { c: 1.5 })}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              edge.c === 1.5
                                ? 'bg-amber-600 text-white border-amber-600'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            1.5
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateEdge(edge.id, { c: 2.5 })}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              edge.c === 2.5
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            2.5
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateEdge(edge.id, { c: Infinity })}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              edge.c === Infinity
                                ? 'bg-red-800 text-white border-red-800'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            &infin;
                          </button>
                        </div>
                      </td>

                      <td className="py-2 px-3 font-bold">
                        {isBlocked ? (
                          <span className="text-red-600 flex items-center space-x-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Blocked (&infin;)</span>
                          </span>
                        ) : (
                          <span
                            className={
                              isCrowded
                                ? 'text-red-700 font-bold'
                                : isModerate
                                ? 'text-amber-700'
                                : 'text-slate-800'
                            }
                          >
                            {time.toFixed(1)} mins
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteEdge(edge.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Road"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono">
            Total Roads: <span className="font-bold text-slate-800">{network.edges.length}</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
