import React from 'react';
import type { RoadNetwork, DijkstraStep, AllPairsResult } from '../types/graph';
import { HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface DijkstraPanelProps {
  network: RoadNetwork;
  currentStep: DijkstraStep | null;
  selectedSourceId: string;
  onSourceChange: (sourceId: string) => void;
  subView: 'single_source' | 'all_pairs';
  onSubViewChange: (view: 'single_source' | 'all_pairs') => void;
  allPairs: AllPairsResult;
  highlightedCell: { u: string; v: string } | null;
  onHighlightCell: (cell: { u: string; v: string } | null) => void;
}

export const DijkstraPanel: React.FC<DijkstraPanelProps> = ({
  network,
  currentStep,
  selectedSourceId,
  onSourceChange,
  subView,
  onSubViewChange,
  allPairs,
  highlightedCell,
  onHighlightCell,
}) => {
  const nodeIds = network.nodes.map(n => n.id);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Sub-view switcher tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex space-x-1 bg-slate-100 p-0.5 rounded-md text-xs font-medium">
          <button
            onClick={() => onSubViewChange('single_source')}
            className={`px-3 py-1 rounded transition-colors ${
              subView === 'single_source'
                ? 'bg-white text-blue-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single-Source Stepper
          </button>
          <button
            onClick={() => onSubViewChange('all_pairs')}
            className={`px-3 py-1 rounded transition-colors ${
              subView === 'all_pairs'
                ? 'bg-white text-blue-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All-Pairs Matrix (T)
          </button>
        </div>

        {subView === 'single_source' && (
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500 font-medium">Source:</span>
            <select
              value={selectedSourceId}
              onChange={e => onSourceChange(e.target.value)}
              className="font-mono font-semibold bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-800 text-xs focus:ring-1 focus:ring-blue-600 outline-none"
            >
              {network.nodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.id} {node.isHub ? '(Hub)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Sub-view 1: Single-Source Live Distance Table */}
      {subView === 'single_source' && (
        <div className="flex-1 flex flex-col space-y-3">
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="font-semibold text-slate-800">
                Live Relaxation Table (From Hub {selectedSourceId})
              </span>
              <span className="text-[11px] text-slate-400">Values in minutes</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider font-mono">
                    <th className="py-1.5 px-2">Node</th>
                    <th className="py-1.5 px-2">Best Time</th>
                    <th className="py-1.5 px-2">Via</th>
                    <th className="py-1.5 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {nodeIds.map(nodeId => {
                    const row = currentStep?.distanceTable?.[nodeId];
                    const isSettled = row?.settled;
                    const isExamined = currentStep?.examiningNeighborId === nodeId;
                    const isSettlingNode = currentStep?.settledNodeId === nodeId;

                    return (
                      <tr
                        key={nodeId}
                        className={`transition-colors ${
                          isSettlingNode
                            ? 'bg-teal-50 font-bold'
                            : isExamined
                            ? 'bg-blue-50 font-semibold'
                            : isSettled
                            ? 'bg-slate-50/70 text-slate-700'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-1.5 px-2 font-bold flex items-center space-x-1.5">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center text-[11px] ${
                              nodeId === selectedSourceId
                                ? 'bg-blue-900 text-white'
                                : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {nodeId}
                          </span>
                        </td>
                        <td className="py-1.5 px-2">
                          {row?.bestTime === Infinity ? (
                            <span className="text-slate-400">&infin;</span>
                          ) : (
                            <span
                              className={`${
                                isExamined
                                  ? 'text-blue-700 font-bold'
                                  : isSettled
                                  ? 'text-teal-800 font-semibold'
                                  : 'text-slate-800'
                              }`}
                            >
                              {row?.bestTime?.toFixed(1)}m
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-slate-600">
                          {row?.via ? (
                            <span className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded text-[11px]">
                              {row.via}
                            </span>
                          ) : (
                            <span className="text-slate-400">&mdash;</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2">
                          {isSettled ? (
                            <span className="inline-flex items-center space-x-1 text-teal-700 font-medium text-[11px]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Settled</span>
                            </span>
                          ) : isExamined ? (
                            <span className="text-blue-700 font-medium text-[11px] animate-pulse">
                              Relaxing...
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tie-breaking rule explanation */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-md p-2.5 text-[11px] text-slate-700 flex items-start space-x-2">
            <HelpCircle className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-950">Fewer-Hops Tie-Breaking: </span>
              When multiple routes yield identical travel times, the algorithm prefers the route with fewer intermediate hops (e.g. B &rarr; F prefers B &rarr; C &rarr; F in 2 hops over 3 hops).
            </div>
          </div>
        </div>
      )}

      {/* Sub-view 2: All-Pairs Shortest-Time Matrix (T) */}
      {subView === 'all_pairs' && (
        <div className="flex-1 flex flex-col space-y-3">
          <div className="bg-white rounded-lg border border-slate-200 p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800">
                All-Pairs Travel Time Matrix T (mins)
              </span>
              <div className="flex items-center space-x-2 text-[10px]">
                <span className="flex items-center space-x-1 text-blue-700">
                  <span className="w-2.5 h-2.5 bg-blue-100 border border-blue-300 rounded-sm"></span>
                  <span>Multi-hop shortcut</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono text-[11px] text-center">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold">
                    <th className="p-1 border border-slate-200">u \ v</th>
                    {nodeIds.map(v => (
                      <th key={v} className="p-1 border border-slate-200 w-8">
                        {v}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nodeIds.map(u => (
                    <tr key={u}>
                      <td className="p-1 font-bold bg-slate-100 border border-slate-200 text-slate-700">
                        {u}
                      </td>
                      {nodeIds.map(v => {
                        const time = allPairs.matrix[u]?.[v];
                        const isShort = allPairs.isShortcut[u]?.[v];
                        const isSelected =
                          highlightedCell?.u === u && highlightedCell?.v === v;

                        return (
                          <td
                            key={v}
                            onClick={() => onHighlightCell({ u, v })}
                            onMouseEnter={() => onHighlightCell({ u, v })}
                            title={`Path ${u} → ${v}: [${allPairs.paths[u]?.[v]?.join(' → ')}] (${time?.toFixed(1)} mins)`}
                            className={`p-1 border border-slate-200 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-600'
                                : isShort
                                ? 'bg-blue-50 text-blue-900 font-semibold hover:bg-blue-100'
                                : u === v
                                ? 'bg-slate-50 text-slate-400'
                                : 'hover:bg-slate-100 text-slate-800'
                            }`}
                          >
                            {time === Infinity ? '∞' : time?.toFixed(1)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Path Inspector for Highlighted Matrix Cell */}
          {highlightedCell && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <span>Shortest Path: {highlightedCell.u}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                  <span>{highlightedCell.v}</span>
                </span>
                <span className="font-mono font-bold text-blue-700">
                  {allPairs.matrix[highlightedCell.u]?.[highlightedCell.v]?.toFixed(1)} mins
                </span>
              </div>

              <div className="flex items-center space-x-1.5 font-mono text-xs bg-white p-2 rounded border border-slate-200 my-1">
                {allPairs.paths[highlightedCell.u]?.[highlightedCell.v]?.map((node, idx, arr) => (
                  <React.Fragment key={idx}>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        node === 'W'
                          ? 'bg-blue-900 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {node}
                    </span>
                    {idx < arr.length - 1 && (
                      <span className="text-slate-400">&rarr;</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {allPairs.isShortcut[highlightedCell.u]?.[highlightedCell.v] && (
                <p className="text-[11px] text-blue-800 mt-1">
                  &bull; Dijkstra discovered that this multi-hop path is faster than congested direct links!
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
