export type TrafficFactor = 1.0 | 1.5 | 2.5 | typeof Infinity;

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  isHub?: boolean;
}

export interface GraphEdge {
  id: string;
  u: string;
  v: string;
  distance_m: number;
  c: number; // 1.0 = Clear, 1.5 = Moderate, 2.5 = Crowded, Infinity = Blocked
}

export interface RoadNetwork {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const BASE_VELOCITY_M_MIN = 60; // 60 metres per minute (1 m/s campus utility cart)

export function computeTravelTime(distance_m: number, c: number): number {
  if (c === Infinity || !isFinite(c)) return Infinity;
  // w(u, v) = (d(u, v) / 60) * c(u, v)
  const time = (distance_m / BASE_VELOCITY_M_MIN) * c;
  return Math.round(time * 10) / 10; // 1 decimal place precision (e.g. 7.5, 2.0)
}

// Single-source Dijkstra table entry
export interface DijkstraTableRow {
  nodeId: string;
  bestTime: number;
  via: string | null;
  settled: boolean;
}

// Single-source Dijkstra trace step
export interface DijkstraStep {
  stepIndex: number;
  type: 'initial' | 'settle' | 'relax_inspect' | 'relax_update' | 'relax_no_update' | 'complete';
  settledNodeId: string | null;
  settledNodes: string[];
  activeEdge?: { u: string; v: string; weight: number };
  examiningNeighborId?: string;
  proposedTime?: number;
  previousTime?: number;
  distanceTable: Record<string, DijkstraTableRow>;
  narration: string;
}

// All-pairs shortest path matrix
export interface AllPairsResult {
  matrix: Record<string, Record<string, number>>;
  paths: Record<string, Record<string, string[]>>; // e.g. paths['W']['C'] = ['W', 'A', 'C']
  isShortcut: Record<string, Record<string, boolean>>; // true if multi-hop or beats direct/congested link
}

// Nearest neighbour trace step
export interface NearestNeighbourCandidate {
  nodeId: string;
  time: number;
  path: string[];
  isBacktrack: boolean;
  backtrackVia?: string[];
  isMinimum: boolean;
}

export interface NearestNeighbourStep {
  stepIndex: number;
  currentNodeId: string;
  visitedNodes: string[];
  candidates: NearestNeighbourCandidate[];
  chosenCandidate: NearestNeighbourCandidate;
  cumulativeTour: string[];
  cumulativeCost: number;
  narration: string;
}

export interface NearestNeighbourResult {
  tour: string[]; // e.g. ['W', 'A', 'C', 'E', 'D', 'B', 'F', 'W']
  totalCost: number;
  steps: NearestNeighbourStep[];
  legCosts: Array<{ from: string; to: string; cost: number; path: string[]; isBacktrack: boolean }>;
}

// 2-opt trace step
export interface TwoOptStep {
  stepIndex: number;
  tourBefore: string[];
  costBefore: number;
  edge1: { u: string; v: string; cost: number; index1: number; index2: number };
  edge2: { u: string; v: string; cost: number; index1: number; index2: number };
  cutCost: number;
  reversedSegment: string[];
  reconnectEdge1: { u: string; v: string; cost: number };
  reconnectEdge2: { u: string; v: string; cost: number };
  addedCost: number;
  netSaving: number; // cutCost - addedCost
  isImproving: boolean;
  isKeySwap: boolean;
  tourAfter: string[];
  costAfter: number;
  narration: string;
}

export interface TwoOptResult {
  initialTour: string[];
  initialCost: number;
  finalTour: string[];
  finalCost: number;
  totalSaved: number;
  allSteps: TwoOptStep[];
  keySwapSteps: TwoOptStep[];
  finalLegs: Array<{ from: string; to: string; cost: number; path: string[] }>;
}

// Dynamic Disruption
export interface PathLeg {
  from: string;
  to: string;
  path: string[];
  time: number;
}

export interface DisruptionComparison {
  disruptedEdge: { u: string; v: string };
  disruptedCondition: number;
  cartPosition: string; // e.g. 'B'
  completedStops: string[]; // e.g. ['W', 'A', 'B']
  completedTime: number; // 6.0 mins
  remainingUnvisited: string[]; // ['D', 'E', 'C', 'F']
  staticPlan: {
    sequence: string[]; // ['D', 'E', 'C', 'F', 'W']
    legs: PathLeg[];
    remainingTime: number;
    totalTime: number;
    fullPathSequence: string[];
  };
  dynamicPlan: {
    sequence: string[]; // ['D', 'E', 'F', 'C', 'W']
    legs: PathLeg[];
    remainingTime: number;
    totalTime: number;
    fullPathSequence: string[];
  };
  timeSaved: number;
  narration: string;
}
