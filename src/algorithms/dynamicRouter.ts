import type {
  RoadNetwork,
  DisruptionComparison,
  PathLeg,
} from '../types/graph';
import { computeTravelTime } from '../types/graph';
import { computeAllPairsShortestPaths, findEdge } from './dijkstra';

// Find best sequence of remaining stops starting from currentPosition and ending at destination
function optimizeRemainingTour(
  currentPos: string,
  destination: string,
  remainingStops: string[],
  matrix: Record<string, Record<string, number>>
): string[] {
  if (remainingStops.length === 0) return [destination];
  if (remainingStops.length === 1) return [remainingStops[0], destination];

  // For small number of remaining stops (<= 7), evaluate all permutations for exact optimal sequence
  // If > 7, use Nearest Neighbour + 2-opt
  if (remainingStops.length <= 7) {
    let bestSeq: string[] = [];
    let minCost = Infinity;

    function permute(arr: string[], l: number) {
      if (l === arr.length) {
        let cost = matrix[currentPos]?.[arr[0]] ?? Infinity;
        for (let i = 0; i < arr.length - 1; i++) {
          cost += matrix[arr[i]]?.[arr[i + 1]] ?? Infinity;
        }
        cost += matrix[arr[arr.length - 1]]?.[destination] ?? Infinity;

        if (cost < minCost) {
          minCost = cost;
          bestSeq = [...arr];
        }
        return;
      }

      for (let i = l; i < arr.length; i++) {
        [arr[l], arr[i]] = [arr[i], arr[l]];
        permute(arr, l + 1);
        [arr[l], arr[i]] = [arr[i], arr[l]];
      }
    }

    permute([...remainingStops], 0);
    return [...bestSeq, destination];
  }

  // Fallback greedy NN for larger sets
  const unvisited = new Set(remainingStops);
  let curr = currentPos;
  const seq: string[] = [];

  while (unvisited.size > 0) {
    let bestNext: string | null = null;
    let bestTime = Infinity;

    for (const cand of unvisited) {
      const t = matrix[curr]?.[cand] ?? Infinity;
      if (t < bestTime) {
        bestTime = t;
        bestNext = cand;
      }
    }

    if (!bestNext) break;
    unvisited.delete(bestNext);
    seq.push(bestNext);
    curr = bestNext;
  }

  seq.push(destination);
  return seq;
}

export function computeDynamicDisruption(
  baseNetwork: RoadNetwork,
  stage3Tour: string[], // e.g. ['W', 'A', 'B', 'D', 'E', 'C', 'F', 'W']
  cartPosition: string, // e.g. 'B'
  disruptedEdge: { u: string; v: string },
  newTrafficFactor: number // 2.5 or Infinity
): DisruptionComparison {
  // 1. Identify completed portion of the tour up to cartPosition
  const cartIndex = stage3Tour.indexOf(cartPosition);
  const completedStops = cartIndex >= 0 ? stage3Tour.slice(0, cartIndex + 1) : [stage3Tour[0]];

  // 2. Compute completed travel time on original network
  const originalAllPairs = computeAllPairsShortestPaths(baseNetwork);
  let completedTime = 0;
  for (let i = 0; i < completedStops.length - 1; i++) {
    const legCost = originalAllPairs.matrix[completedStops[i]]?.[completedStops[i + 1]] ?? 0;
    completedTime = Math.round((completedTime + legCost) * 10) / 10;
  }

  // 3. Identify remaining unvisited delivery stops in the original tour
  // The tour ends with the start hub (e.g. 'W')
  const endHub = stage3Tour[stage3Tour.length - 1];
  const staticRemainingStops = cartIndex >= 0 ? stage3Tour.slice(cartIndex + 1) : stage3Tour.slice(1);
  const remainingUnvisited = staticRemainingStops.filter(s => s !== endHub);

  // 4. Create updated road network with disruption applied
  const updatedNetwork: RoadNetwork = {
    nodes: baseNetwork.nodes.map(n => ({ ...n })),
    edges: baseNetwork.edges.map(e => {
      const match =
        (e.u === disruptedEdge.u && e.v === disruptedEdge.v) ||
        (e.u === disruptedEdge.v && e.v === disruptedEdge.u);
      if (match) {
        return { ...e, c: newTrafficFactor };
      }
      return { ...e };
    }),
  };

  const updatedAllPairs = computeAllPairsShortestPaths(updatedNetwork);

  // 5. Compute Static Plan (Detour only - retains static remaining sequence)
  const staticLegs: PathLeg[] = [];
  let staticRemainingTime = 0;
  let staticCurr = cartPosition;
  const staticFullSequence: string[] = [cartPosition];

  for (const nextStop of staticRemainingStops) {
    const legTime = updatedAllPairs.matrix[staticCurr]?.[nextStop] ?? Infinity;
    const legPath = updatedAllPairs.paths[staticCurr]?.[nextStop] ?? [staticCurr, nextStop];

    staticLegs.push({
      from: staticCurr,
      to: nextStop,
      path: legPath,
      time: legTime,
    });

    staticRemainingTime = Math.round((staticRemainingTime + legTime) * 10) / 10;
    // Append path nodes (excluding start)
    for (let k = 1; k < legPath.length; k++) {
      staticFullSequence.push(legPath[k]);
    }
    staticCurr = nextStop;
  }

  // 6. Compute Dynamic Plan (Re-optimise remaining unvisited stops)
  const dynamicSequence = optimizeRemainingTour(
    cartPosition,
    endHub,
    remainingUnvisited,
    updatedAllPairs.matrix
  );

  const dynamicLegs: PathLeg[] = [];
  let dynamicRemainingTime = 0;
  let dynamicCurr = cartPosition;
  const dynamicFullSequence: string[] = [cartPosition];

  for (const nextStop of dynamicSequence) {
    const legTime = updatedAllPairs.matrix[dynamicCurr]?.[nextStop] ?? Infinity;
    const legPath = updatedAllPairs.paths[dynamicCurr]?.[nextStop] ?? [dynamicCurr, nextStop];

    dynamicLegs.push({
      from: dynamicCurr,
      to: nextStop,
      path: legPath,
      time: legTime,
    });

    dynamicRemainingTime = Math.round((dynamicRemainingTime + legTime) * 10) / 10;
    for (let k = 1; k < legPath.length; k++) {
      dynamicFullSequence.push(legPath[k]);
    }
    dynamicCurr = nextStop;
  }

  const staticTotalTime = Math.round((completedTime + staticRemainingTime) * 10) / 10;
  const dynamicTotalTime = Math.round((completedTime + dynamicRemainingTime) * 10) / 10;
  const timeSaved = Math.round((staticTotalTime - dynamicTotalTime) * 10) / 10;

  const narration = timeSaved > 0
    ? `Disruption detected on road ${disruptedEdge.u}–${disruptedEdge.v}! Static plan forces cart through detour [${staticLegs.find(l => l.path.length > 2)?.path.join(' → ') || 'detour'}], taking ${staticTotalTime.toFixed(1)} mins total. Dynamic re-routing reshuffles remaining stops [${dynamicSequence.slice(0, -1).join(' → ')}], avoiding the double backtrack and finishing in ${dynamicTotalTime.toFixed(1)} mins (saving ${timeSaved.toFixed(1)} mins)!`
    : `Disruption on road ${disruptedEdge.u}–${disruptedEdge.v}. Remaining stops navigated optimally. Total dynamic route time: ${dynamicTotalTime.toFixed(1)} mins.`;

  return {
    disruptedEdge,
    disruptedCondition: newTrafficFactor,
    cartPosition,
    completedStops,
    completedTime,
    remainingUnvisited,
    staticPlan: {
      sequence: staticRemainingStops,
      legs: staticLegs,
      remainingTime: staticRemainingTime,
      totalTime: staticTotalTime,
      fullPathSequence: staticFullSequence,
    },
    dynamicPlan: {
      sequence: dynamicSequence,
      legs: dynamicLegs,
      remainingTime: dynamicRemainingTime,
      totalTime: dynamicTotalTime,
      fullPathSequence: dynamicFullSequence,
    },
    timeSaved,
    narration,
  };
}
