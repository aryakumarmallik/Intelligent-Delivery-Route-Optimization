import React from 'react';
import {
  PlusCircle,
  Link2,
  Move,
  TableProperties,
  Trash2,
  Play,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import type { RoadNetwork } from '../types/graph';

export type EditorTool = 'add_node' | 'connect_edge' | 'move_edit';

interface GraphEditorToolbarProps {
  activeTool: EditorTool;
  onSelectTool: (tool: EditorTool) => void;
  network: RoadNetwork;
  isSimulating: boolean;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onLoadPreset: (presetName: 'iter' | 'small_city' | 'diamond' | 'cycle' | 'blank') => void;
  onClearGraph: () => void;
  onOpenRoadManager: () => void;
}

export function validateGraphConnectivity(network: RoadNetwork): { isValid: boolean; message: string } {
  if (network.nodes.length < 3) {
    return {
      isValid: false,
      message: `Need at least 3 stops to form a delivery route (currently ${network.nodes.length}).`,
    };
  }

  if (network.edges.length < network.nodes.length - 1) {
    return {
      isValid: false,
      message: 'Too few roads to connect all stops.',
    };
  }

  // BFS from first node to verify connectivity
  const startId = network.nodes[0].id;
  const visited = new Set<string>([startId]);
  const queue = [startId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const edge of network.edges) {
      if (edge.c === Infinity) continue;
      let neighbor: string | null = null;
      if (edge.u === curr) neighbor = edge.v;
      else if (edge.v === curr) neighbor = edge.u;

      if (neighbor && !visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  if (visited.size < network.nodes.length) {
    const unreachable = network.nodes.find(n => !visited.has(n.id));
    return {
      isValid: false,
      message: `Stop ${unreachable?.id} is unreachable — connect it with clear roads to run routing.`,
    };
  }

  return {
    isValid: true,
    message: `${network.nodes.length} stops, ${network.edges.length} roads — Connected & ready`,
  };
}

export const GraphEditorToolbar: React.FC<GraphEditorToolbarProps> = ({
  activeTool,
  onSelectTool,
  network,
  isSimulating,
  onStartSimulation,
  onStopSimulation,
  onLoadPreset,
  onClearGraph,
  onOpenRoadManager,
}) => {
  const validation = validateGraphConnectivity(network);

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Visual Tools */}
      <div className="flex flex-wrap items-center gap-2">
        {!isSimulating ? (
          <>
            <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 border border-slate-200/80">
              <button
                onClick={() => onSelectTool('add_node')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTool === 'add_node'
                    ? 'bg-white text-blue-900 shadow-sm ring-1 ring-blue-600/10'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Click anywhere on canvas to place a stop"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Add Stop</span>
              </button>

              <button
                onClick={() => onSelectTool('connect_edge')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTool === 'connect_edge'
                    ? 'bg-white text-blue-900 shadow-sm ring-1 ring-blue-600/10'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Click stop 1 then stop 2 to connect with a road"
              >
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Connect Road</span>
              </button>

              <button
                onClick={() => onSelectTool('move_edit')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTool === 'move_edit'
                    ? 'bg-white text-blue-900 shadow-sm ring-1 ring-blue-600/10'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Drag stops to reposition; click any road or stop to edit"
              >
                <Move className="w-3.5 h-3.5 text-blue-600" />
                <span>Move / Edit</span>
              </button>
            </div>

            {/* Road Manager Drawer Button */}
            <button
              onClick={onOpenRoadManager}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold border border-slate-200 transition-colors"
              title="Open tabular manager for all roads and weights"
            >
              <TableProperties className="w-3.5 h-3.5 text-slate-600" />
              <span>Roads Manager ({network.edges.length})</span>
            </button>

            {/* Presets Select Menu */}
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
              <span className="text-[11px] text-slate-400 px-2 font-medium">Preset:</span>
              <button
                onClick={() => onLoadPreset('small_city')}
                className="px-2 py-1 rounded hover:bg-slate-200 text-slate-700 font-medium"
              >
                5-City
              </button>
              <button
                onClick={() => onLoadPreset('diamond')}
                className="px-2 py-1 rounded hover:bg-slate-200 text-slate-700 font-medium"
              >
                4-Diamond
              </button>
              <button
                onClick={() => onLoadPreset('cycle')}
                className="px-2 py-1 rounded hover:bg-slate-200 text-slate-700 font-medium"
              >
                6-Cycle
              </button>
              <button
                onClick={() => onLoadPreset('iter')}
                className="px-2 py-1 rounded hover:bg-slate-200 text-slate-700 font-medium"
              >
                ITER Campus
              </button>
              <button
                onClick={onClearGraph}
                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                title="Clear all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onStopSimulation}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>&larr; Back to Graph Builder</span>
          </button>
        )}
      </div>

      {/* Connectivity Status & Run Button */}
      <div className="flex items-center space-x-3">
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
            validation.isValid
              ? 'bg-teal-50 border-teal-200 text-teal-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {validation.isValid ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          )}
          <span>{validation.message}</span>
        </div>

        {!isSimulating && (
          <button
            onClick={onStartSimulation}
            disabled={!validation.isValid}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Visualise Step-by-Step &rarr;</span>
          </button>
        )}
      </div>
    </div>
  );
};
