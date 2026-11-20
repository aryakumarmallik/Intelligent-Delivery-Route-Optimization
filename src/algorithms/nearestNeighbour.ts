import type {
  RoadNetwork,
  AllPairsResult,
  NearestNeighbourResult,
  NearestNeighbourStep,
  NearestNeighbourCandidate,
} from '../types/graph';

export function runNearestNeighbour(
  network: RoadNetwork,
  allPairs: AllPairsResult,
  startNodeId = 'W'
): NearestNeighbourResult {
  const steps: NearestNeighbourStep[] = [];
  const nodes = network.nodes;
  const hubNode = nodes.find(n => n.id === startNodeId) || nodes[0];
  const startId = hubNode.id;

  const visitedList: string[] = [startId];
  const visitedSet = new Set<string>([startId]);
  let currentId = startId;
  let cumulativeCost = 0;
  const legCosts: NearestNeighbourResult['legCosts'] = [];

  const unvisitedNodes = nodes.filter(n => n.id !== startId);

  while (visitedSet.size < nodes.length) {
    const candidates: NearestNeighbourCandidate[] = [];

    for (const target of unvisitedNodes) {
      if (visitedSet.has(target.id)) continue;

      const time = allPairs.matrix[currentId]?.[target.id] ?? Infinity;
      const path = allPairs.paths[currentId]?.[target.id] ?? [currentId, target.id];

      // Check if path passes through already-visited nodes (backtrack)
      const internalNodes = path.slice(1, -1);
      const backtrackVia = internalNodes.filter(nId => visitedSet.has(nId));
      const isBacktrack = backtrackVia.length > 0;

      candidates.push({
        nodeId: target.id,
        time,
        path,
        isBacktrack,
        backtrackVia: isBacktrack ? backtrackVia : undefined,
        isMinimum: false,
      });
    }

    if (candidates.length === 0) break;

    // Sort candidates by travel time ascending
    candidates.sort((a, b) => a.time - b.time);
    candidates[0].isMinimum = true;

    const chosen = candidates[0];
    visitedList.push(chosen.nodeId);
    visitedSet.add(chosen.nodeId);
    cumulativeCost = Math.round((cumulativeCost + chosen.time) * 10) / 10;

    legCosts.push({
      from: currentId,
      to: chosen.nodeId,
      cost: chosen.time,
      path: chosen.path,
      isBacktrack: chosen.isBacktrack,
    });

    let narration = '';
    if (chosen.isBacktrack) {
      narration = `Greedy trap at ${currentId}! The only remaining stop is ${chosen.nodeId}. Reaching it requires backtracking via already-visited node ${chosen.backtrackVia?.join(', ')}, taking a heavy ${chosen.time.toFixed(1)} mins!`;
    } else {
      narration = `At ${currentId}, compared ${candidates.length} unvisited stops. Closest stop is ${chosen.nodeId} (${chosen.time.toFixed(1)} mins via [${chosen.path.join(' → ')}]). Appended ${chosen.nodeId} to route.`;
    }

    steps.push({
      stepIndex: steps.length,
      currentNodeId: currentId,
      visitedNodes: [...visitedList],
      candidates,
      chosenCandidate: chosen,
      cumulativeTour: [...visitedList],
      cumulativeCost,
      narration,
    });

    currentId = chosen.nodeId;
  }

  // Return to hub leg
  const returnTime = allPairs.matrix[currentId]?.[startId] ?? Infinity;
  const returnPath = allPairs.paths[currentId]?.[startId] ?? [currentId, startId];
  visitedList.push(startId);
  cumulativeCost = Math.round((cumulativeCost + returnTime) * 10) / 10;

  const returnCandidate: NearestNeighbourCandidate = {
    nodeId: startId,
    time: returnTime,
    path: returnPath,
    isBacktrack: false,
    isMinimum: true,
  };

  legCosts.push({
    from: currentId,
    to: startId,
    cost: returnTime,
    path: returnPath,
    isBacktrack: false,
  });

  steps.push({
    stepIndex: steps.length,
    currentNodeId: currentId,
    visitedNodes: [...visitedList],
    candidates: [returnCandidate],
    chosenCandidate: returnCandidate,
    cumulativeTour: [...visitedList],
    cumulativeCost,
    narration: `All delivery stops visited! Returning from ${currentId} back to Hub ${startId} (${returnTime.toFixed(1)} mins). Completed initial Nearest Neighbour baseline tour.`,
  });

  return {
    tour: visitedList,
    totalCost: cumulativeCost,
    steps,
    legCosts,
  };
}
