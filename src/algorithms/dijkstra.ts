import type {
  RoadNetwork,
  GraphEdge,
  DijkstraStep,
  DijkstraTableRow,
  AllPairsResult,
} from '../types/graph';
import { computeTravelTime } from '../types/graph';

// Find edge connecting u and v
export function findEdge(edges: GraphEdge[], u: string, v: string): GraphEdge | undefined {
  return edges.find(
    e => (e.u === u && e.v === v) || (e.u === v && e.v === u)
  );
}

// Single-source Dijkstra with step-by-step tracing
export function runDijkstraTrace(network: RoadNetwork, sourceId: string): DijkstraStep[] {
  const steps: DijkstraStep[] = [];
  const nodeMap = new Map(network.nodes.map(n => [n.id, n]));
  
  if (!nodeMap.has(sourceId)) return steps;

  // Initialise state
  const distanceTable: Record<string, DijkstraTableRow> = {};
  const hops: Record<string, number> = {};

  for (const node of network.nodes) {
    distanceTable[node.id] = {
      nodeId: node.id,
      bestTime: node.id === sourceId ? 0 : Infinity,
      via: null,
      settled: false,
    };
    hops[node.id] = node.id === sourceId ? 0 : Infinity;
  }

  // Clone table helper
  const cloneTable = () => JSON.parse(JSON.stringify(distanceTable)) as Record<string, DijkstraTableRow>;

  // Step 0: Initial state
  steps.push({
    stepIndex: 0,
    type: 'initial',
    settledNodeId: null,
    settledNodes: [],
    distanceTable: cloneTable(),
    narration: `Starting Dijkstra from ${nodeMap.get(sourceId)?.label || sourceId}. Initialised distance to 0 mins; all other stops set to ∞.`,
  });

  const settledSet = new Set<string>();

  while (settledSet.size < network.nodes.length) {
    // Find unvisited node with minimum bestTime
    let minNodeId: string | null = null;
    let minTime = Infinity;
    let minHops = Infinity;

    for (const node of network.nodes) {
      if (!settledSet.has(node.id)) {
        const time = distanceTable[node.id].bestTime;
        const h = hops[node.id];
        if (time < minTime || (Math.abs(time - minTime) < 1e-6 && h < minHops)) {
          minTime = time;
          minHops = h;
          minNodeId = node.id;
        }
      }
    }

    if (!minNodeId || minTime === Infinity) {
      // Remaining nodes are unreachable
      break;
    }

    // Settle minNodeId
    settledSet.add(minNodeId);
    distanceTable[minNodeId].settled = true;

    steps.push({
      stepIndex: steps.length,
      type: 'settle',
      settledNodeId: minNodeId,
      settledNodes: Array.from(settledSet),
      distanceTable: cloneTable(),
      narration: minNodeId === sourceId
        ? `Settled starting hub ${minNodeId} with confirmed minimum travel time of 0.0 mins.`
        : `Confirmed optimal shortest travel time to stop ${minNodeId} = ${minTime.toFixed(1)} mins (via ${distanceTable[minNodeId].via}). Settled.`,
    });

    // Relax all edges incident to minNodeId
    const incidentEdges = network.edges.filter(
      e => (e.u === minNodeId || e.v === minNodeId)
    );

    for (const edge of incidentEdges) {
      const neighborId = edge.u === minNodeId ? edge.v : edge.u;
      if (settledSet.has(neighborId)) continue; // already optimal

      const edgeTime = computeTravelTime(edge.distance_m, edge.c);
      
      if (edgeTime === Infinity) {
        steps.push({
          stepIndex: steps.length,
          type: 'relax_no_update',
          settledNodeId: minNodeId,
          settledNodes: Array.from(settledSet),
          activeEdge: { u: minNodeId, v: neighborId, weight: Infinity },
          examiningNeighborId: neighborId,
          distanceTable: cloneTable(),
          narration: `Road ${minNodeId}–${neighborId} is completely blocked (w = ∞). Cannot traverse; skipping edge.`,
        });
        continue;
      }

      const proposedTime = Math.round((minTime + edgeTime) * 10) / 10;
      const proposedHops = hops[minNodeId] + 1;
      const previousTime = distanceTable[neighborId].bestTime;
      const previousHops = hops[neighborId];

      const isFaster = proposedTime < previousTime - 1e-6;
      const isFewerHops = Math.abs(proposedTime - previousTime) <= 1e-6 && proposedHops < previousHops;

      if (isFaster || isFewerHops) {
        distanceTable[neighborId].bestTime = proposedTime;
        distanceTable[neighborId].via = minNodeId;
        hops[neighborId] = proposedHops;

        let reason = '';
        if (isFaster) {
          if (previousTime === Infinity) {
            reason = `Discovered path to ${neighborId} via ${minNodeId}: ${minTime.toFixed(1)} + ${edgeTime.toFixed(1)} = ${proposedTime.toFixed(1)} mins.`;
          } else {
            reason = `Found faster route to ${neighborId}! Path via ${minNodeId} takes ${proposedTime.toFixed(1)} mins, beating previous ${previousTime.toFixed(1)} mins. Updating table!`;
          }
        } else {
          reason = `Tie-break: Path to ${neighborId} via ${minNodeId} takes equal time (${proposedTime.toFixed(1)} mins) with fewer hops (${proposedHops} vs ${previousHops}). Updating via to ${minNodeId}!`;
        }

        steps.push({
          stepIndex: steps.length,
          type: 'relax_update',
          settledNodeId: minNodeId,
          settledNodes: Array.from(settledSet),
          activeEdge: { u: minNodeId, v: neighborId, weight: edgeTime },
          examiningNeighborId: neighborId,
          proposedTime,
          previousTime,
          distanceTable: cloneTable(),
          narration: reason,
        });
      } else {
        steps.push({
          stepIndex: steps.length,
          type: 'relax_no_update',
          settledNodeId: minNodeId,
          settledNodes: Array.from(settledSet),
          activeEdge: { u: minNodeId, v: neighborId, weight: edgeTime },
          examiningNeighborId: neighborId,
          proposedTime,
          previousTime,
          distanceTable: cloneTable(),
          narration: `Checked road ${minNodeId}–${neighborId} (${edgeTime.toFixed(1)} mins). Path via ${minNodeId} would take ${(minTime + edgeTime).toFixed(1)} mins, which is not better than current best of ${previousTime.toFixed(1)} mins. Kept existing.`,
        });
      }
    }
  }

  // Final completion step
  steps.push({
    stepIndex: steps.length,
    type: 'complete',
    settledNodeId: null,
    settledNodes: Array.from(settledSet),
    distanceTable: cloneTable(),
    narration: `Dijkstra's search from ${sourceId} complete. All reachable stops have confirmed globally optimal shortest travel times.`,
  });

  return steps;
}

// Compute full all-pairs shortest travel-time matrix T and path reconstructions
export function computeAllPairsShortestPaths(network: RoadNetwork): AllPairsResult {
  const nodeIds = network.nodes.map(n => n.id);
  const matrix: Record<string, Record<string, number>> = {};
  const paths: Record<string, Record<string, string[]>> = {};
  const isShortcut: Record<string, Record<string, boolean>> = {};

  for (const u of nodeIds) {
    matrix[u] = {};
    paths[u] = {};
    isShortcut[u] = {};
    for (const v of nodeIds) {
      if (u === v) {
        matrix[u][v] = 0;
        paths[u][v] = [u];
        isShortcut[u][v] = false;
      } else {
        matrix[u][v] = Infinity;
        paths[u][v] = [];
        isShortcut[u][v] = false;
      }
    }
  }

  // Run Dijkstra from each node
  for (const src of nodeIds) {
    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    const hops: Record<string, number> = {};
    const settled = new Set<string>();

    for (const id of nodeIds) {
      dist[id] = id === src ? 0 : Infinity;
      prev[id] = null;
      hops[id] = id === src ? 0 : Infinity;
    }

    while (settled.size < nodeIds.length) {
      let u: string | null = null;
      let minD = Infinity;
      let minH = Infinity;

      for (const id of nodeIds) {
        if (!settled.has(id)) {
          if (dist[id] < minD || (Math.abs(dist[id] - minD) < 1e-6 && hops[id] < minH)) {
            minD = dist[id];
            minH = hops[id];
            u = id;
          }
        }
      }

      if (!u || minD === Infinity) break;
      settled.add(u);

      const incident = network.edges.filter(e => e.u === u || e.v === u);
      for (const edge of incident) {
        const v = edge.u === u ? edge.v : edge.u;
        if (settled.has(v)) continue;

        const w = computeTravelTime(edge.distance_m, edge.c);
        if (w === Infinity) continue;

        const candD = Math.round((minD + w) * 10) / 10;
        const candH = hops[u] + 1;

        if (candD < dist[v] - 1e-6 || (Math.abs(candD - dist[v]) <= 1e-6 && candH < hops[v])) {
          dist[v] = candD;
          prev[v] = u;
          hops[v] = candH;
        }
      }
    }

    // Reconstruct paths from src to all targets
    for (const dest of nodeIds) {
      matrix[src][dest] = dist[dest];

      if (dist[dest] === Infinity) {
        paths[src][dest] = [];
      } else if (src === dest) {
        paths[src][dest] = [src];
      } else {
        const route: string[] = [];
        let curr: string | null = dest;
        while (curr !== null) {
          route.unshift(curr);
          curr = prev[curr];
        }
        paths[src][dest] = route;

        // Determine if this path is a multi-hop shortcut
        const directEdge = findEdge(network.edges, src, dest);
        if (route.length > 2) {
          // Multi-hop path
          if (!directEdge) {
            isShortcut[src][dest] = true;
          } else {
            const directTime = computeTravelTime(directEdge.distance_m, directEdge.c);
            if (dist[dest] < directTime) {
              isShortcut[src][dest] = true;
            }
          }
        }
      }
    }
  }

  return { matrix, paths, isShortcut };
}
