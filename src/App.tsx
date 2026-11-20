import React, { useState, useMemo, useEffect } from 'react';
import type { StageId } from './components/StageProgressBar';
import { StageProgressBar } from './components/StageProgressBar';
import type { AppMode } from './components/Header';
import { Header } from './components/Header';
import { GraphCanvas } from './components/GraphCanvas';
import { GraphEditorToolbar } from './components/GraphEditorToolbar';
import type { EditorTool } from './components/GraphEditorToolbar';
import { PlaybackControls } from './components/PlaybackControls';
import { DijkstraPanel } from './components/DijkstraPanel';
import { NearestNeighbourPanel } from './components/NearestNeighbourPanel';
import { TwoOptPanel } from './components/TwoOptPanel';
import { TwoOptLineDiagram } from './components/TwoOptLineDiagram';
import { DisruptionPanel } from './components/DisruptionPanel';
import { RoadManagerModal } from './components/RoadManagerModal';

import {
  ITER_CAMPUS_GRAPH,
  SMALL_CITY_5_NODE_GRAPH,
  DIAMOND_4_NODE_GRAPH,
  CYCLE_6_NODE_GRAPH,
  cloneGraph,
} from './data/presets';
import type { RoadNetwork, GraphEdge } from './types/graph';
import { runDijkstraTrace, computeAllPairsShortestPaths } from './algorithms/dijkstra';
import { runNearestNeighbour } from './algorithms/nearestNeighbour';
import { runTwoOpt } from './algorithms/twoOpt';
import { computeDynamicDisruption } from './algorithms/dynamicRouter';

import { MessageSquare, Sparkles } from 'lucide-react';

export default function App() {
  // Top-level Mode: 'iter_campus' | 'custom_graph'
  const [mode, setMode] = useState<AppMode>('iter_campus');

  // Active Stage: 1 | 2 | 3 | 4
  const [activeStage, setActiveStage] = useState<StageId>(1);

  // Road Network States
  const [iterGraph, setIterGraph] = useState<RoadNetwork>(() => cloneGraph(ITER_CAMPUS_GRAPH));
  const [customGraph, setCustomGraph] = useState<RoadNetwork>(() => cloneGraph(SMALL_CITY_5_NODE_GRAPH));

  // Editor states in Custom Graph Lab
  const [editorTool, setEditorTool] = useState<EditorTool>('move_edit');
  const [isSimulatingCustom, setIsSimulatingCustom] = useState<boolean>(false);
  const [isRoadManagerOpen, setIsRoadManagerOpen] = useState<boolean>(false);

  // Active network depending on mode
  const activeNetwork = mode === 'iter_campus' ? iterGraph : customGraph;
  const setNetwork = (updater: (prev: RoadNetwork) => RoadNetwork) => {
    if (mode === 'iter_campus') {
      setIterGraph(updater);
    } else {
      setCustomGraph(updater);
    }
  };

  // Playback & Step States
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<'slow' | 'normal'>('normal');

  // Stage 1 (Dijkstra) specific states
  const [dijkstraSourceId, setDijkstraSourceId] = useState<string>('W');
  const [dijkstraSubView, setDijkstraSubView] = useState<'single_source' | 'all_pairs'>('single_source');
  const [matrixHighlightedCell, setMatrixHighlightedCell] = useState<{ u: string; v: string } | null>(null);

  // Stage 3 (2-opt) specific states
  const [twoOptFilterMode, setTwoOptFilterMode] = useState<'key_swaps' | 'all'>('key_swaps');

  // Stage 4 (Disruption) specific states
  const [disruptedEdge, setDisruptedEdge] = useState<{ u: string; v: string }>({ u: 'C', v: 'E' });
  const [disruptedFactor, setDisruptedFactor] = useState<number>(Infinity);
  const [cartPosition, setCartPosition] = useState<string>('B');
  const [disruptionView, setDisruptionView] = useState<'dynamic' | 'static'>('dynamic');

  // -------------------------------------------------------------
  // Algorithm Computations (Memoized)
  // -------------------------------------------------------------
  const allPairs = useMemo(() => {
    return computeAllPairsShortestPaths(activeNetwork);
  }, [activeNetwork]);

  // Stage 1: Dijkstra Steps
  const dijkstraSteps = useMemo(() => {
    const validSource = activeNetwork.nodes.some(n => n.id === dijkstraSourceId)
      ? dijkstraSourceId
      : activeNetwork.nodes[0]?.id || 'W';
    return runDijkstraTrace(activeNetwork, validSource);
  }, [activeNetwork, dijkstraSourceId]);

  // Stage 2: Nearest Neighbour Baseline Tour
  const nnResult = useMemo(() => {
    const hubId = activeNetwork.nodes.find(n => n.isHub)?.id || activeNetwork.nodes[0]?.id || 'W';
    return runNearestNeighbour(activeNetwork, allPairs, hubId);
  }, [activeNetwork, allPairs]);

  // Stage 3: 2-opt Local Search Refinement
  const twoOptResult = useMemo(() => {
    return runTwoOpt(nnResult.tour, activeNetwork, allPairs);
  }, [nnResult.tour, activeNetwork, allPairs]);

  const twoOptActiveSteps = useMemo(() => {
    if (twoOptFilterMode === 'key_swaps') {
      return twoOptResult.keySwapSteps.length > 0
        ? twoOptResult.keySwapSteps
        : twoOptResult.allSteps.slice(0, 1);
    }
    return twoOptResult.allSteps;
  }, [twoOptResult, twoOptFilterMode]);

  // Stage 4: Dynamic Disruption Comparison
  const disruptionResult = useMemo(() => {
    const defaultEdge = activeNetwork.edges[0]
      ? { u: activeNetwork.edges[0].u, v: activeNetwork.edges[0].v }
      : { u: 'C', v: 'E' };

    const edgeToDisrupt =
      activeNetwork.edges.find(
        e =>
          (e.u === disruptedEdge.u && e.v === disruptedEdge.v) ||
          (e.u === disruptedEdge.v && e.v === disruptedEdge.u)
      )
        ? disruptedEdge
        : defaultEdge;

    const riderPos = twoOptResult.finalTour.includes(cartPosition)
      ? cartPosition
      : twoOptResult.finalTour[1] || twoOptResult.finalTour[0] || 'W';

    return computeDynamicDisruption(
      activeNetwork,
      twoOptResult.finalTour,
      riderPos,
      edgeToDisrupt,
      disruptedFactor
    );
  }, [activeNetwork, twoOptResult.finalTour, cartPosition, disruptedEdge, disruptedFactor]);

  // -------------------------------------------------------------
  // Step limits and current step calculation
  // -------------------------------------------------------------
  const totalSteps = useMemo(() => {
    switch (activeStage) {
      case 1:
        return dijkstraSteps.length;
      case 2:
        return nnResult.steps.length;
      case 3:
        return twoOptActiveSteps.length;
      case 4:
        return 1;
      default:
        return 1;
    }
  }, [activeStage, dijkstraSteps.length, nnResult.steps.length, twoOptActiveSteps.length]);

  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [activeStage, dijkstraSourceId, twoOptFilterMode, mode]);

  const currentDijkstraStep =
    activeStage === 1 && dijkstraSteps.length > 0
      ? dijkstraSteps[Math.min(stepIndex, dijkstraSteps.length - 1)]
      : null;

  const currentNNStep =
    activeStage === 2 && nnResult.steps.length > 0
      ? nnResult.steps[Math.min(stepIndex, nnResult.steps.length - 1)]
      : null;

  const currentTwoOptStep =
    activeStage === 3 && twoOptActiveSteps.length > 0
      ? twoOptActiveSteps[Math.min(stepIndex, twoOptActiveSteps.length - 1)]
      : null;

  const currentNarration = useMemo(() => {
    switch (activeStage) {
      case 1:
        return (
          currentDijkstraStep?.narration ||
          'Initialising Dijkstra single-source shortest path exploration.'
        );
      case 2:
        return (
          currentNNStep?.narration ||
          'Evaluating Nearest Neighbour greedy candidate selection from active stop.'
        );
      case 3:
        return (
          currentTwoOptStep?.narration ||
          'Evaluating 2-opt pairwise non-adjacent edge swaps to eliminate backtracks.'
        );
      case 4:
        return disruptionResult.narration;
      default:
        return '';
    }
  }, [activeStage, currentDijkstraStep, currentNNStep, currentTwoOptStep, disruptionResult]);

  // -------------------------------------------------------------
  // Graph mutation handlers
  // -------------------------------------------------------------
  const handleUpdateNodePosition = (id: string, x: number, y: number) => {
    setNetwork(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => (n.id === id ? { ...n, x, y } : n)),
    }));
  };

  const handleAddNode = (x: number, y: number) => {
    setNetwork(prev => {
      const existingIds = new Set(prev.nodes.map(n => n.id));
      let nextId = 'W';
      if (existingIds.has('W')) {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        for (const char of letters) {
          if (!existingIds.has(char)) {
            nextId = char;
            break;
          }
        }
      }

      const newNode = {
        id: nextId,
        label: nextId === 'W' ? 'Warehouse Hub (W)' : `Stop ${nextId}`,
        x,
        y,
        isHub: nextId === 'W',
      };

      return {
        ...prev,
        nodes: [...prev.nodes, newNode],
      };
    });
  };

  const handleAddEdge = (u: string, v: string, distance_m: number, c: number) => {
    setNetwork(prev => {
      const exists = prev.edges.some(
        e => (e.u === u && e.v === v) || (e.u === v && e.v === u)
      );
      if (exists) {
        // Update existing edge instead
        return {
          ...prev,
          edges: prev.edges.map(e =>
            (e.u === u && e.v === v) || (e.u === v && e.v === u)
              ? { ...e, distance_m, c }
              : e
          ),
        };
      }

      const newEdge: GraphEdge = {
        id: `${u}-${v}`,
        u,
        v,
        distance_m,
        c,
      };

      return {
        ...prev,
        edges: [...prev.edges, newEdge],
      };
    });
  };

  const handleUpdateEdge = (edgeId: string, updates: Partial<GraphEdge>) => {
    setNetwork(prev => ({
      ...prev,
      edges: prev.edges.map(e => (e.id === edgeId ? { ...e, ...updates } : e)),
    }));
  };

  const handleDeleteEdge = (edgeId: string) => {
    setNetwork(prev => ({
      ...prev,
      edges: prev.edges.filter(e => e.id !== edgeId),
    }));
  };

  const handleToggleHub = (nodeId: string) => {
    setNetwork(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => ({
        ...n,
        isHub: n.id === nodeId,
      })),
    }));
    setDijkstraSourceId(nodeId);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNetwork(prev => ({
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      edges: prev.edges.filter(e => e.u !== nodeId && e.v !== nodeId),
    }));
  };

  const handleUpdateNodeLabel = (nodeId: string, label: string) => {
    setNetwork(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => (n.id === nodeId ? { ...n, label } : n)),
    }));
  };

  const handleResetIterDefaults = () => {
    setIterGraph(cloneGraph(ITER_CAMPUS_GRAPH));
    setDisruptedEdge({ u: 'C', v: 'E' });
    setDisruptedFactor(Infinity);
    setCartPosition('B');
  };

  const handleLoadPreset = (presetName: 'iter' | 'small_city' | 'diamond' | 'cycle' | 'blank') => {
    if (presetName === 'iter') {
      setCustomGraph(cloneGraph(ITER_CAMPUS_GRAPH));
    } else if (presetName === 'small_city') {
      setCustomGraph(cloneGraph(SMALL_CITY_5_NODE_GRAPH));
    } else if (presetName === 'diamond') {
      setCustomGraph(cloneGraph(DIAMOND_4_NODE_GRAPH));
    } else if (presetName === 'cycle') {
      setCustomGraph(cloneGraph(CYCLE_6_NODE_GRAPH));
    } else {
      setCustomGraph({ nodes: [], edges: [] });
    }
    setIsSimulatingCustom(false);
  };

  const handleLoadReportScenario = () => {
    setCartPosition('B');
    setDisruptedEdge({ u: 'C', v: 'E' });
    setDisruptedFactor(Infinity);
    setDisruptionView('dynamic');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header */}
      <Header
        mode={mode}
        onModeChange={newMode => {
          setMode(newMode);
          if (newMode === 'custom_graph') {
            setIsSimulatingCustom(false);
          }
        }}
        onResetIterDefaults={handleResetIterDefaults}
      />

      {/* 2. Stage Progress Bar */}
      <StageProgressBar
        activeStage={activeStage}
        onSelectStage={s => setActiveStage(s)}
      />

      {/* 3. Custom Graph Lab Toolbar */}
      {mode === 'custom_graph' && (
        <GraphEditorToolbar
          activeTool={editorTool}
          onSelectTool={setEditorTool}
          network={customGraph}
          isSimulating={isSimulatingCustom}
          onStartSimulation={() => setIsSimulatingCustom(true)}
          onStopSimulation={() => setIsSimulatingCustom(false)}
          onLoadPreset={handleLoadPreset}
          onClearGraph={() => setCustomGraph({ nodes: [], edges: [] })}
          onOpenRoadManager={() => setIsRoadManagerOpen(true)}
        />
      )}

      {/* 4. Main Responsive Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (Canvas & 2-Opt Line Diagram) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
          <div className="w-full h-[540px] sm:h-[600px]">
            <GraphCanvas
              network={activeNetwork}
              stage={activeStage}
              isCustomMode={mode === 'custom_graph'}
              isSimulating={isSimulatingCustom}
              editorTool={editorTool}
              onUpdateNodePosition={handleUpdateNodePosition}
              onAddNode={handleAddNode}
              onAddEdge={handleAddEdge}
              onUpdateEdge={handleUpdateEdge}
              onDeleteEdge={handleDeleteEdge}
              onToggleHub={handleToggleHub}
              onDeleteNode={handleDeleteNode}
              onUpdateNodeLabel={handleUpdateNodeLabel}
              dijkstraStep={currentDijkstraStep}
              dijkstraSourceId={dijkstraSourceId}
              dijkstraHighlightedPath={
                matrixHighlightedCell
                  ? allPairs.paths[matrixHighlightedCell.u]?.[matrixHighlightedCell.v] || null
                  : null
              }
              nearestNeighbourStep={currentNNStep}
              twoOptStep={currentTwoOptStep}
              twoOptFinalTour={twoOptResult.finalTour}
              disruption={disruptionResult}
              disruptionView={disruptionView}
              allPairs={allPairs}
            />
          </div>

          {/* In Stage 3: 3-Row Visual Line Diagram */}
          {activeStage === 3 && (
            <div className="w-full">
              <TwoOptLineDiagram step={currentTwoOptStep} />
            </div>
          )}
        </div>

        {/* Right Column (Explainer & Controls) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-3">
          {/* Live Plain-English Narration */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <MessageSquare className="w-4 h-4 text-blue-700" />
              <span>Why This Step?</span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100 font-medium">
              {currentNarration}
            </p>
          </div>

          {/* Focused Stage-Specific Panel */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs min-h-[360px]">
            {activeStage === 1 && (
              <DijkstraPanel
                network={activeNetwork}
                currentStep={currentDijkstraStep}
                selectedSourceId={dijkstraSourceId}
                onSourceChange={setDijkstraSourceId}
                subView={dijkstraSubView}
                onSubViewChange={setDijkstraSubView}
                allPairs={allPairs}
                highlightedCell={matrixHighlightedCell}
                onHighlightCell={setMatrixHighlightedCell}
              />
            )}

            {activeStage === 2 && (
              <NearestNeighbourPanel
                currentStep={currentNNStep}
                result={nnResult}
              />
            )}

            {activeStage === 3 && (
              <TwoOptPanel
                result={twoOptResult}
                currentStep={currentTwoOptStep}
                filterMode={twoOptFilterMode}
                onFilterModeChange={setTwoOptFilterMode}
              />
            )}

            {activeStage === 4 && (
              <DisruptionPanel
                network={activeNetwork}
                stage3Tour={twoOptResult.finalTour}
                disruption={disruptionResult}
                activeDisruptionView={disruptionView}
                onDisruptionViewChange={setDisruptionView}
                onSelectCartPosition={setCartPosition}
                onSelectDisruptedEdge={(edge, factor) => {
                  setDisruptedEdge(edge);
                  setDisruptedFactor(factor);
                }}
                onLoadReportScenario={handleLoadReportScenario}
                isIterMode={mode === 'iter_campus'}
              />
            )}
          </div>

          {/* Consistent Playback Controls */}
          {activeStage !== 4 && (
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs">
              <PlaybackControls
                currentStep={stepIndex}
                totalSteps={totalSteps}
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(p => !p)}
                onPrev={() => setStepIndex(s => Math.max(0, s - 1))}
                onNext={() => setStepIndex(s => Math.min(totalSteps - 1, s + 1))}
                onReset={() => {
                  setStepIndex(0);
                  setIsPlaying(false);
                }}
                speed={speed}
                onSpeedToggle={() => setSpeed(s => (s === 'normal' ? 'slow' : 'normal'))}
              />
            </div>
          )}
        </div>
      </main>

      {/* Roads Manager Modal */}
      {isRoadManagerOpen && (
        <RoadManagerModal
          network={customGraph}
          onClose={() => setIsRoadManagerOpen(false)}
          onUpdateEdge={handleUpdateEdge}
          onDeleteEdge={handleDeleteEdge}
          onAddEdge={handleAddEdge}
        />
      )}

      {/* Academic Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-500">
        <p>
          Research Report Demonstration &bull;{' '}
          <strong className="text-slate-700">
            Intelligent Delivery Route Optimisation Under Dynamic Traffic Conditions
          </strong>{' '}
          by Arya Kumar Mallik (ITER, SOA). Built with React, TypeScript &amp; SVG.
        </p>
      </footer>
    </div>
  );
}
