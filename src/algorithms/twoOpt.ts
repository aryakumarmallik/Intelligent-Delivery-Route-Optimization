import type {
  RoadNetwork,
  AllPairsResult,
  TwoOptResult,
  TwoOptStep,
} from '../types/graph';

// Compute total tour cost using all-pairs travel-time matrix T
export function computeTourCost(tour: string[], matrix: Record<string, Record<string, number>>): number {
  let total = 0;
  for (let i = 0; i < tour.length - 1; i++) {
    const from = tour[i];
    const to = tour[i + 1];
    const legCost = matrix[from]?.[to] ?? Infinity;
    total += legCost;
  }
  return Math.round(total * 10) / 10;
}

export function runTwoOpt(
  initialTour: string[],
  network: RoadNetwork,
  allPairs: AllPairsResult
): TwoOptResult {
  let currentTour = [...initialTour];
  let currentCost = computeTourCost(currentTour, allPairs.matrix);
  const initialCost = currentCost;

  const allSteps: TwoOptStep[] = [];
  const keySwapSteps: TwoOptStep[] = [];

  const n = currentTour.length - 1; // number of edges (e.g. 7 edges for 8 vertices W...W)
  let improved = true;

  while (improved) {
    improved = false;

    // Check all pairs of non-adjacent edges (i, i+1) and (j, j+1)
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n; j++) {
        // Exclude wrap-around adjacency if first and last edge touch hub
        if (i === 0 && j === n - 1) continue;

        const u = currentTour[i];
        const v = currentTour[i + 1];
        const x = currentTour[j];
        const y = currentTour[j + 1];

        const costEdge1 = allPairs.matrix[u]?.[v] ?? Infinity;
        const costEdge2 = allPairs.matrix[x]?.[y] ?? Infinity;
        const cutCost = Math.round((costEdge1 + costEdge2) * 10) / 10;

        const middleSegment = currentTour.slice(i + 1, j + 1);
        const reversedMiddle = [...middleSegment].reverse();

        const candidateTour = [
          ...currentTour.slice(0, i + 1),
          ...reversedMiddle,
          ...currentTour.slice(j + 1),
        ];

        const reconnectEdge1Cost = allPairs.matrix[u]?.[x] ?? Infinity;
        const reconnectEdge2Cost = allPairs.matrix[v]?.[y] ?? Infinity;
        const addedCost = Math.round((reconnectEdge1Cost + reconnectEdge2Cost) * 10) / 10;

        const candidateCost = computeTourCost(candidateTour, allPairs.matrix);
        const netSaving = Math.round((currentCost - candidateCost) * 10) / 10;
        const isImproving = netSaving > 0.05;

        const step: TwoOptStep = {
          stepIndex: allSteps.length,
          tourBefore: [...currentTour],
          costBefore: currentCost,
          edge1: { u, v, cost: costEdge1, index1: i, index2: i + 1 },
          edge2: { u: x, v: y, cost: costEdge2, index1: j, index2: j + 1 },
          cutCost,
          reversedSegment: middleSegment,
          reconnectEdge1: { u, v: x, cost: reconnectEdge1Cost },
          reconnectEdge2: { u: v, v: y, cost: reconnectEdge2Cost },
          addedCost,
          netSaving,
          isImproving,
          isKeySwap: isImproving,
          tourAfter: isImproving ? [...candidateTour] : [...currentTour],
          costAfter: isImproving ? candidateCost : currentCost,
          narration: isImproving
            ? `Improving swap found! Cutting (${u}–${v}: ${costEdge1.toFixed(1)}m) and (${x}–${y}: ${costEdge2.toFixed(1)}m) [cut: ${cutCost.toFixed(1)}m]. Reconnecting (${u}–${x}: ${reconnectEdge1Cost.toFixed(1)}m) and (${v}–${y}: ${reconnectEdge2Cost.toFixed(1)}m) [added: ${addedCost.toFixed(1)}m]. Reverses segment [${middleSegment.join(' → ')}], saving ${netSaving.toFixed(1)} mins (${currentCost.toFixed(1)}m → ${candidateCost.toFixed(1)}m)!`
            : `Evaluated 2-opt swap of (${u}–${v}) & (${x}–${y}). Net change would be ${netSaving >= 0 ? '+' : ''}${(-netSaving).toFixed(1)} mins (no saving). Rejected.`,
        };

        allSteps.push(step);

        if (isImproving) {
          keySwapSteps.push(step);
          currentTour = candidateTour;
          currentCost = candidateCost;
          improved = true;
          break; // break inner loop to re-evaluate from updated tour
        }
      }
      if (improved) break; // break outer loop to restart scan
    }
  }

  // Construct final legs with reconstructed paths
  const finalLegs: TwoOptResult['finalLegs'] = [];
  for (let i = 0; i < currentTour.length - 1; i++) {
    const from = currentTour[i];
    const to = currentTour[i + 1];
    finalLegs.push({
      from,
      to,
      cost: allPairs.matrix[from]?.[to] ?? Infinity,
      path: allPairs.paths[from]?.[to] ?? [from, to],
    });
  }

  return {
    initialTour,
    initialCost,
    finalTour: currentTour,
    finalCost: currentCost,
    totalSaved: Math.round((initialCost - currentCost) * 10) / 10,
    allSteps,
    keySwapSteps,
    finalLegs,
  };
}
