import React, { useState, useRef } from 'react';
import type {
  RoadNetwork,
  GraphNode,
  GraphEdge,
  DijkstraStep,
  NearestNeighbourStep,
  TwoOptStep,
  DisruptionComparison,
  AllPairsResult,
} from '../types/graph';
import { computeTravelTime } from '../types/graph';
import type { StageId } from './StageProgressBar';
import type { EditorTool } from './GraphEditorToolbar';
import { ConnectEdgeModal } from './ConnectEdgeModal';
import { EditEdgeModal } from './EditEdgeModal';
import { EditNodeModal } from './EditNodeModal';
import { ZoomIn, ZoomOut, RotateCcw, Link2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface GraphCanvasProps {
  network: RoadNetwork;
  stage: StageId;
  isCustomMode: boolean;
  isSimulating: boolean;
  editorTool: EditorTool;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
  onAddNode: (x: number, y: number) => void;
  onAddEdge: (u: string, v: string, distance_m: number, c: number) => void;
  onUpdateEdge: (edgeId: string, updates: Partial<GraphEdge>) => void;
  onDeleteEdge: (edgeId: string) => void;
  onToggleHub: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateNodeLabel: (nodeId: string, label: string) => void;

  // Algorithm visualization states
  dijkstraStep: DijkstraStep | null;
  dijkstraSourceId: string;
  dijkstraHighlightedPath: string[] | null;

  nearestNeighbourStep: NearestNeighbourStep | null;

  twoOptStep: TwoOptStep | null;
  twoOptFinalTour: string[] | null;

  disruption: DisruptionComparison | null;
  disruptionView: 'dynamic' | 'static';

  allPairs: AllPairsResult;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  network,
  stage,
  isCustomMode,
  isSimulating,
  editorTool,
  onUpdateNodePosition,
  onAddNode,
  onAddEdge,
  onUpdateEdge,
  onDeleteEdge,
  onToggleHub,
  onDeleteNode,
  onUpdateNodeLabel,

  dijkstraStep,
  dijkstraSourceId,
  dijkstraHighlightedPath,

  nearestNeighbourStep,

  twoOptStep,
  twoOptFinalTour,

  disruption,
  disruptionView,

  allPairs,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Zoom and Pan states
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState<boolean>(false);

  // Connect Road interactive state
  const [connectFirstNodeId, setConnectFirstNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [edgeModalData, setEdgeModalData] = useState<{ u: string; v: string } | null>(null);

  // Modals for editing
  const [editingEdge, setEditingEdge] = useState<GraphEdge | null>(null);
  const [editingNode, setEditingNode] = useState<GraphNode | null>(null);

  // Hovered edge for formula tooltip
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Canvas ViewBox
  const BASE_WIDTH = 900;
  const BASE_HEIGHT = 620;

  // Coordinate converter
  const getSvgCoordinates = (e: { clientX: number; clientY: number }) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / BASE_WIDTH);
    const y = (e.clientY - rect.top) / (rect.height / BASE_HEIGHT);
    return { x, y };
  };

  // Node Pointer Down (start drag)
  const handleNodePointerDown = (node: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation();

    if (isCustomMode && !isSimulating) {
      if (editorTool === 'move_edit') {
        const coords = getSvgCoordinates(e);
        setDraggingNodeId(node.id);
        setDragOffset({ x: coords.x - node.x, y: coords.y - node.y });
        setHasDragged(false);
      }
    }
  };

  // Node Click (connect or edit)
  const handleNodeClick = (node: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation();

    if (isCustomMode && !isSimulating) {
      if (editorTool === 'connect_edge') {
        if (!connectFirstNodeId) {
          // Select source node
          setConnectFirstNodeId(node.id);
        } else if (connectFirstNodeId === node.id) {
          // Deselect
          setConnectFirstNodeId(null);
        } else {
          // Connect first to second!
          setEdgeModalData({ u: connectFirstNodeId, v: node.id });
          setConnectFirstNodeId(null);
        }
      } else if (editorTool === 'move_edit' && !hasDragged) {
        // Open edit node modal
        setEditingNode(node);
      }
    }
  };

  // Mouse Move over Canvas
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const coords = getSvgCoordinates(e);
    setMousePos(coords);

    if (draggingNodeId && isCustomMode && !isSimulating && editorTool === 'move_edit') {
      setHasDragged(true);
      const newX = Math.max(50, Math.min(BASE_WIDTH - 50, coords.x - dragOffset.x));
      const newY = Math.max(50, Math.min(BASE_HEIGHT - 50, coords.y - dragOffset.y));
      onUpdateNodePosition(draggingNodeId, Math.round(newX), Math.round(newY));
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
    }
  };

  // Canvas Click (Add Node or Cancel Selection)
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isCustomMode && !isSimulating) {
      if (editorTool === 'add_node') {
        const coords = getSvgCoordinates(e);
        onAddNode(Math.round(coords.x), Math.round(coords.y));
      } else if (editorTool === 'connect_edge') {
        setConnectFirstNodeId(null);
      }
    }
  };

  // Edge Click
  const handleEdgeClick = (edge: GraphEdge, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isCustomMode) {
      // In Mode A: cycle Clear (1.0) -> Moderate (1.5) -> Crowded (2.5) -> Blocked (Infinity) -> Clear (1.0)
      let nextC = 1.0;
      if (edge.c === 1.0) nextC = 1.5;
      else if (edge.c === 1.5) nextC = 2.5;
      else if (edge.c === 2.5) nextC = Infinity;
      else nextC = 1.0;

      onUpdateEdge(edge.id, { c: nextC });
    } else if (!isSimulating) {
      // In Custom Graph: open EditEdgeModal immediately!
      setEditingEdge(edge);
    }
  };

  const getNode = (id: string) => network.nodes.find(n => n.id === id);

  const isEdgeInPath = (u: string, v: string, path: string[]) => {
    if (!path || path.length < 2) return false;
    for (let i = 0; i < path.length - 1; i++) {
      if (
        (path[i] === u && path[i + 1] === v) ||
        (path[i] === v && path[i + 1] === u)
      ) {
        return true;
      }
    }
    return false;
  };

  const firstNode = connectFirstNodeId ? getNode(connectFirstNodeId) : null;

  return (
    <div className="relative w-full h-full bg-slate-50/60 rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs select-none">
      {/* Floating Status & Guidance Banner */}
      <div className="absolute top-3 left-3 z-10 flex flex-col space-y-1.5 pointer-events-none">
        {!isCustomMode ? (
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 shadow-sm flex items-center space-x-2 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            <span>
              <strong className="text-slate-900">Interactive Canvas:</strong> Click any road to cycle traffic (
              <span className="text-teal-700 font-bold">1.0</span> &rarr;{' '}
              <span className="text-amber-700 font-bold">1.5</span> &rarr;{' '}
              <span className="text-red-700 font-bold">2.5</span> &rarr;{' '}
              <span className="text-red-800 font-bold">&infin;</span>)
            </span>
          </div>
        ) : !isSimulating ? (
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 shadow-sm flex items-center space-x-2 pointer-events-auto">
            {editorTool === 'add_node' && (
              <span>Click anywhere on the canvas to place a new delivery stop</span>
            )}
            {editorTool === 'connect_edge' && (
              <span>
                {connectFirstNodeId ? (
                  <span className="text-blue-900 font-semibold flex items-center space-x-1.5">
                    <Link2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Stop <strong>{connectFirstNodeId}</strong> selected &bull; Click destination stop</span>
                  </span>
                ) : (
                  'Click the first stop to start connecting a road'
                )}
              </span>
            )}
            {editorTool === 'move_edit' && (
              <span>Drag stops to arrange &bull; Click any road or stop to edit</span>
            )}
          </div>
        ) : null}
      </div>

      {/* Canvas Zoom & View Controls */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center space-x-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-1 shadow-sm">
        <button
          onClick={() => setZoom(z => Math.min(1.6, z + 0.1))}
          title="Zoom In"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.7, z - 0.1))}
          title="Zoom Out"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          title="Reset View"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
        className="w-full h-full cursor-default"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <defs>
          <pattern id="canvas-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.6" />
          </pattern>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#canvas-grid)" />

        <g transform={`scale(${zoom}) translate(${pan.x}, ${pan.y})`} className="transition-transform duration-75">
          {/* 1. EDGES LAYER */}
          <g id="edges-layer">
            {network.edges.map(edge => {
              const nodeU = getNode(edge.u);
              const nodeV = getNode(edge.v);
              if (!nodeU || !nodeV) return null;

              const time = computeTravelTime(edge.distance_m, edge.c);
              const isBlocked = edge.c === Infinity || !isFinite(edge.c);
              const isCrowded = edge.c === 2.5;
              const isModerate = edge.c === 1.5;

              let strokeColor = '#94a3b8';
              let strokeWidth = 3;
              let strokeDasharray = 'none';
              let isHighlighted = false;

              // Stage 1: Dijkstra
              if (stage === 1) {
                if (
                  dijkstraStep?.activeEdge &&
                  ((dijkstraStep.activeEdge.u === edge.u && dijkstraStep.activeEdge.v === edge.v) ||
                    (dijkstraStep.activeEdge.u === edge.v && dijkstraStep.activeEdge.v === edge.u))
                ) {
                  strokeColor = '#1d4ed8'; // Blue active relaxing edge
                  strokeWidth = 5;
                  isHighlighted = true;
                } else if (
                  dijkstraHighlightedPath &&
                  isEdgeInPath(edge.u, edge.v, dijkstraHighlightedPath)
                ) {
                  strokeColor = '#1d4ed8';
                  strokeWidth = 5;
                  isHighlighted = true;
                }
              }

              // Stage 2: Nearest Neighbour
              if (stage === 2 && nearestNeighbourStep) {
                const currentTour = nearestNeighbourStep.cumulativeTour;
                if (isEdgeInPath(edge.u, edge.v, currentTour)) {
                  strokeColor = '#d97706'; // Amber locked route
                  strokeWidth = 4.5;
                  isHighlighted = true;
                }
                if (
                  nearestNeighbourStep.chosenCandidate.isBacktrack &&
                  isEdgeInPath(edge.u, edge.v, nearestNeighbourStep.chosenCandidate.path)
                ) {
                  strokeColor = '#dc2626'; // Red backtrack
                  strokeWidth = 4;
                  strokeDasharray = '6,4';
                }
              }

              // Stage 3: 2-opt
              if (stage === 3) {
                if (twoOptStep) {
                  const isCut1 =
                    (edge.u === twoOptStep.edge1.u && edge.v === twoOptStep.edge1.v) ||
                    (edge.u === twoOptStep.edge1.v && edge.v === twoOptStep.edge1.u);
                  const isCut2 =
                    (edge.u === twoOptStep.edge2.u && edge.v === twoOptStep.edge2.v) ||
                    (edge.u === twoOptStep.edge2.v && edge.v === twoOptStep.edge2.u);
                  const isRec1 =
                    (edge.u === twoOptStep.reconnectEdge1.u && edge.v === twoOptStep.reconnectEdge1.v) ||
                    (edge.u === twoOptStep.reconnectEdge1.v && edge.v === twoOptStep.reconnectEdge1.u);
                  const isRec2 =
                    (edge.u === twoOptStep.reconnectEdge2.u && edge.v === twoOptStep.reconnectEdge2.v) ||
                    (edge.u === twoOptStep.reconnectEdge2.v && edge.v === twoOptStep.reconnectEdge2.u);

                  if (isCut1 || isCut2) {
                    strokeColor = '#dc2626';
                    strokeWidth = 4.5;
                    strokeDasharray = '5,4';
                    isHighlighted = true;
                  } else if (isRec1 || isRec2) {
                    strokeColor = '#0f766e';
                    strokeWidth = 5;
                    isHighlighted = true;
                  } else if (isEdgeInPath(edge.u, edge.v, twoOptStep.tourAfter)) {
                    strokeColor = '#0f766e';
                    strokeWidth = 3.5;
                  }
                } else if (twoOptFinalTour && isEdgeInPath(edge.u, edge.v, twoOptFinalTour)) {
                  strokeColor = '#0f766e';
                  strokeWidth = 4;
                }
              }

              // Stage 4: Disruption
              if (stage === 4 && disruption) {
                const isDisrupted =
                  (edge.u === disruption.disruptedEdge.u && edge.v === disruption.disruptedEdge.v) ||
                  (edge.u === disruption.disruptedEdge.v && edge.v === disruption.disruptedEdge.u);

                if (isDisrupted) {
                  strokeColor = '#dc2626';
                  strokeWidth = 5;
                  strokeDasharray = '6,4';
                  isHighlighted = true;
                } else {
                  const activePlan =
                    disruptionView === 'dynamic'
                      ? disruption.dynamicPlan.fullPathSequence
                      : disruption.staticPlan.fullPathSequence;

                  if (isEdgeInPath(edge.u, edge.v, activePlan)) {
                    strokeColor = disruptionView === 'dynamic' ? '#0f766e' : '#dc2626';
                    strokeWidth = 4;
                    isHighlighted = true;
                  }
                }
              }

              // Fallback road styles
              if (!isHighlighted) {
                if (isBlocked) {
                  strokeColor = '#dc2626';
                  strokeDasharray = '6,4';
                } else if (isCrowded) {
                  strokeColor = '#ef4444';
                  strokeDasharray = '6,3';
                } else if (isModerate) {
                  strokeColor = '#d97706';
                }
              }

              const midX = (nodeU.x + nodeV.x) / 2;
              const midY = (nodeU.y + nodeV.y) / 2;

              return (
                <g
                  key={edge.id}
                  className="cursor-pointer group"
                  onClick={e => handleEdgeClick(edge, e)}
                  onMouseEnter={() => setHoveredEdgeId(edge.id)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                >
                  {/* Generous hit area line */}
                  <line
                    x1={nodeU.x}
                    y1={nodeU.y}
                    x2={nodeV.x}
                    y2={nodeV.y}
                    stroke="transparent"
                    strokeWidth={24}
                  />

                  {/* Road line */}
                  <line
                    x1={nodeU.x}
                    y1={nodeU.y}
                    x2={nodeV.x}
                    y2={nodeV.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeLinecap="round"
                    className="transition-all duration-150 group-hover:stroke-blue-600"
                  />

                  {/* Road Weight Pill */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-25"
                      y="-12"
                      width="50"
                      height="24"
                      rx="12"
                      fill="#ffffff"
                      stroke={
                        isBlocked
                          ? '#dc2626'
                          : isCrowded
                          ? '#f87171'
                          : isModerate
                          ? '#fbbf24'
                          : '#cbd5e1'
                      }
                      strokeWidth={1.5}
                      className="shadow-sm group-hover:scale-110 transition-transform"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="font-mono text-[11px] font-bold fill-slate-800"
                    >
                      {isBlocked ? '∞' : `${time.toFixed(1)}m`}
                    </text>
                    {isCrowded && (
                      <circle cx="18" cy="-8" r="4" fill="#dc2626" />
                    )}
                  </g>
                </g>
              );
            })}
          </g>

          {/* Interactive Rubberband Line in Connect Mode */}
          {firstNode && (
            <line
              x1={firstNode.x}
              y1={firstNode.y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#1d4ed8"
              strokeWidth="3"
              strokeDasharray="6,4"
              className="pointer-events-none animate-pulse"
            />
          )}

          {/* 2. NODES LAYER */}
          <g id="nodes-layer">
            {network.nodes.map(node => {
              const isHub = node.isHub || node.id === 'W';
              const isConnectingSource = connectFirstNodeId === node.id;

              let fillColor = isHub ? '#1e3a8a' : '#ffffff';
              let strokeColor = isHub ? '#1e3a8a' : '#334155';
              let textColor = isHub ? '#ffffff' : '#0f172a';
              let strokeWidth = 2.5;
              let showPulse = false;
              let badgeText: string | null = null;
              let badgeBg = '#0f766e';

              // Stage 1: Dijkstra
              if (stage === 1 && dijkstraStep) {
                const isSettled = dijkstraStep.settledNodes.includes(node.id);
                const isSettling = dijkstraStep.settledNodeId === node.id;
                const isExamined = dijkstraStep.examiningNeighborId === node.id;

                if (isSettling) {
                  fillColor = '#0f766e';
                  strokeColor = '#0f766e';
                  textColor = '#ffffff';
                  showPulse = true;
                } else if (isSettled) {
                  strokeColor = '#0f766e';
                  strokeWidth = 3;
                  if (!isHub) fillColor = '#f0fdfa';
                } else if (isExamined) {
                  fillColor = '#1d4ed8';
                  strokeColor = '#1d4ed8';
                  textColor = '#ffffff';
                  showPulse = true;
                }
              }

              // Stage 2: Nearest Neighbour
              if (stage === 2 && nearestNeighbourStep) {
                const isVisited = nearestNeighbourStep.visitedNodes.includes(node.id);
                const isCurrent = nearestNeighbourStep.currentNodeId === node.id;

                if (isCurrent) {
                  fillColor = '#d97706';
                  strokeColor = '#d97706';
                  textColor = '#ffffff';
                  showPulse = true;
                } else if (isVisited) {
                  strokeColor = '#d97706';
                  strokeWidth = 3;
                  if (!isHub) fillColor = '#fffbeb';
                }
              }

              // Stage 4: Disruption
              if (stage === 4 && disruption) {
                const isCartNode = disruption.cartPosition === node.id;
                const isCompleted =
                  disruption.completedStops.includes(node.id) && !isCartNode;

                if (isCartNode) {
                  fillColor = '#1d4ed8';
                  strokeColor = '#1d4ed8';
                  textColor = '#ffffff';
                  showPulse = true;
                  badgeText = 'Cart*';
                  badgeBg = '#1d4ed8';
                } else if (isCompleted) {
                  strokeColor = '#94a3b8';
                  strokeWidth = 2;
                  fillColor = '#f1f5f9';
                  textColor = '#64748b';
                  badgeText = 'Done';
                  badgeBg = '#64748b';
                }
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className={`transition-all ${
                    isCustomMode && !isSimulating ? 'cursor-pointer group' : 'cursor-default'
                  }`}
                  onMouseDown={e => handleNodePointerDown(node, e)}
                  onClick={e => handleNodeClick(node, e)}
                >
                  {/* Connecting Halo */}
                  {isConnectingSource && (
                    <circle
                      r="28"
                      fill="none"
                      stroke="#1d4ed8"
                      strokeWidth="3.5"
                      strokeDasharray="5,3"
                      className="animate-spin origin-center"
                    />
                  )}

                  {/* Pulse Ring */}
                  {showPulse && (
                    <circle
                      r="28"
                      fill="none"
                      stroke={fillColor}
                      strokeWidth="2.5"
                      className="animate-ping opacity-60"
                    />
                  )}

                  {/* Main Circle */}
                  <circle
                    r="20"
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    className="shadow-md transition-transform group-hover:scale-105"
                  />

                  {/* Stop ID */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={textColor}
                    className="font-mono text-sm font-bold pointer-events-none"
                  >
                    {node.id}
                  </text>

                  {/* Hub Crown Badge */}
                  {isHub && (
                    <g transform="translate(11, -19)">
                      <circle r="7.5" fill="#1e3a8a" stroke="#ffffff" strokeWidth="1.5" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        className="font-sans text-[9px] font-bold"
                      >
                        ★
                      </text>
                    </g>
                  )}

                  {/* Node Label Below */}
                  <text
                    y="32"
                    textAnchor="middle"
                    className="font-sans text-[11px] font-bold fill-slate-700 pointer-events-none drop-shadow-sm"
                  >
                    {node.label}
                  </text>

                  {/* Stage 4 Badge */}
                  {badgeText && (
                    <g transform="translate(0, -26)">
                      <rect
                        x="-19"
                        y="-8"
                        width="38"
                        height="16"
                        rx="8"
                        fill={badgeBg}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        className="font-mono text-[9px] font-bold"
                      >
                        {badgeText}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Hover Formula Tooltip */}
      {hoveredEdgeId && (() => {
        const edge = network.edges.find(e => e.id === hoveredEdgeId);
        if (!edge) return null;
        const time = computeTravelTime(edge.distance_m, edge.c);
        const conditionName =
          edge.c === 1.0 ? 'Clear (1.0)' : edge.c === 1.5 ? 'Moderate (1.5)' : edge.c === 2.5 ? 'Crowded (2.5)' : 'Blocked (∞)';

        return (
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-md pointer-events-none z-20">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <span>Road {edge.u} &harr; {edge.v}</span>
              <span className="text-slate-400">&bull;</span>
              <span className="font-mono text-blue-700">{edge.distance_m}m</span>
              <span className="text-slate-400">&bull;</span>
              <span className="font-mono">{conditionName}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-600 mt-0.5">
              Formula: ({edge.distance_m}m / 60) &times; {edge.c === Infinity ? '∞' : edge.c} ={' '}
              <strong className="text-slate-900">{time === Infinity ? '∞' : `${time.toFixed(1)} mins`}</strong>
            </div>
          </div>
        );
      })()}

      {/* Connect Edge Modal */}
      {edgeModalData && (
        <ConnectEdgeModal
          u={edgeModalData.u}
          v={edgeModalData.v}
          onClose={() => setEdgeModalData(null)}
          onAddEdge={onAddEdge}
        />
      )}

      {/* Edit Edge Modal */}
      {editingEdge && (
        <EditEdgeModal
          edge={editingEdge}
          onClose={() => setEditingEdge(null)}
          onUpdateEdge={onUpdateEdge}
          onDeleteEdge={onDeleteEdge}
        />
      )}

      {/* Edit Node Modal */}
      {editingNode && (
        <EditNodeModal
          node={editingNode}
          onClose={() => setEditingNode(null)}
          onToggleHub={onToggleHub}
          onDeleteNode={onDeleteNode}
          onUpdateNodeLabel={onUpdateNodeLabel}
        />
      )}
    </div>
  );
};
