import type { RoadNetwork } from '../types/graph';

export const ITER_CAMPUS_GRAPH: RoadNetwork = {
  nodes: [
    { id: 'W', label: 'Main Cafeteria (Hub W)', x: 450, y: 530, isHub: true },
    { id: 'A', label: 'Academic Block A', x: 230, y: 460 },
    { id: 'C', label: 'Central Library C', x: 450, y: 310 },
    { id: 'F', label: 'Faculty Enclave F', x: 670, y: 460 },
    { id: 'B', label: 'BioTech Block B', x: 230, y: 170 },
    { id: 'D', label: 'Dept of CS & IT (D)', x: 450, y: 90 },
    { id: 'E', label: 'Engineering Workshop E', x: 670, y: 170 },
  ],
  edges: [
    { id: 'W-A', u: 'W', v: 'A', distance_m: 120, c: 1.0 },
    { id: 'W-C', u: 'W', v: 'C', distance_m: 180, c: 2.5 }, // Congested 7.5 min
    { id: 'W-F', u: 'W', v: 'F', distance_m: 180, c: 1.0 },
    { id: 'A-C', u: 'A', v: 'C', distance_m: 120, c: 1.0 },
    { id: 'A-B', u: 'A', v: 'B', distance_m: 240, c: 1.0 },
    { id: 'B-C', u: 'B', v: 'C', distance_m: 120, c: 2.5 }, // Congested 5.0 min
    { id: 'B-D', u: 'B', v: 'D', distance_m: 180, c: 1.0 },
    { id: 'C-E', u: 'C', v: 'E', distance_m: 180, c: 1.0 },
    { id: 'D-E', u: 'D', v: 'E', distance_m: 120, c: 1.0 },
    { id: 'C-F', u: 'C', v: 'F', distance_m: 240, c: 1.0 },
    { id: 'E-F', u: 'E', v: 'F', distance_m: 300, c: 1.0 },
  ],
};

export const SMALL_CITY_5_NODE_GRAPH: RoadNetwork = {
  nodes: [
    { id: 'W', label: 'Logistics Hub (W)', x: 450, y: 500, isHub: true },
    { id: 'A', label: 'West Suburb A', x: 240, y: 350 },
    { id: 'B', label: 'North Station B', x: 330, y: 150 },
    { id: 'C', label: 'East Center C', x: 570, y: 150 },
    { id: 'D', label: 'South Depot D', x: 660, y: 350 },
  ],
  edges: [
    { id: 'W-A', u: 'W', v: 'A', distance_m: 180, c: 1.0 }, // 3.0 min
    { id: 'A-B', u: 'A', v: 'B', distance_m: 150, c: 1.0 }, // 2.5 min
    { id: 'B-C', u: 'B', v: 'C', distance_m: 180, c: 1.0 }, // 3.0 min
    { id: 'C-D', u: 'C', v: 'D', distance_m: 150, c: 1.0 }, // 2.5 min
    { id: 'D-W', u: 'D', v: 'W', distance_m: 180, c: 1.0 }, // 3.0 min
    { id: 'W-B', u: 'W', v: 'B', distance_m: 300, c: 2.5 }, // 12.5 min crowded cross-link
    { id: 'A-C', u: 'A', v: 'C', distance_m: 270, c: 1.0 }, // 4.5 min bypass
  ],
};

export const DIAMOND_4_NODE_GRAPH: RoadNetwork = {
  nodes: [
    { id: 'W', label: 'Central Hub (W)', x: 450, y: 500, isHub: true },
    { id: 'A', label: 'West Node A', x: 250, y: 300 },
    { id: 'B', label: 'North Node B', x: 450, y: 120 },
    { id: 'C', label: 'East Node C', x: 650, y: 300 },
  ],
  edges: [
    { id: 'W-A', u: 'W', v: 'A', distance_m: 120, c: 1.0 }, // 2.0m
    { id: 'A-B', u: 'A', v: 'B', distance_m: 180, c: 1.0 }, // 3.0m
    { id: 'B-C', u: 'B', v: 'C', distance_m: 120, c: 1.0 }, // 2.0m
    { id: 'C-W', u: 'C', v: 'W', distance_m: 180, c: 1.0 }, // 3.0m
    { id: 'W-B', u: 'W', v: 'B', distance_m: 240, c: 2.5 }, // 10.0m crowded diagonal
    { id: 'A-C', u: 'A', v: 'C', distance_m: 300, c: 1.5 }, // 7.5m moderate horizontal
  ],
};

export const CYCLE_6_NODE_GRAPH: RoadNetwork = {
  nodes: [
    { id: 'W', label: 'Main Depot (W)', x: 450, y: 530, isHub: true },
    { id: 'A', label: 'Point A', x: 220, y: 420 },
    { id: 'B', label: 'Point B', x: 220, y: 200 },
    { id: 'C', label: 'Point C', x: 450, y: 100 },
    { id: 'D', label: 'Point D', x: 680, y: 200 },
    { id: 'E', label: 'Point E', x: 680, y: 420 },
  ],
  edges: [
    { id: 'W-A', u: 'W', v: 'A', distance_m: 150, c: 1.0 }, // 2.5m
    { id: 'A-B', u: 'A', v: 'B', distance_m: 180, c: 1.0 }, // 3.0m
    { id: 'B-C', u: 'B', v: 'C', distance_m: 150, c: 1.0 }, // 2.5m
    { id: 'C-D', u: 'C', v: 'D', distance_m: 150, c: 1.0 }, // 2.5m
    { id: 'D-E', u: 'D', v: 'E', distance_m: 180, c: 1.0 }, // 3.0m
    { id: 'E-W', u: 'E', v: 'W', distance_m: 150, c: 1.0 }, // 2.5m
    { id: 'A-D', u: 'A', v: 'D', distance_m: 360, c: 2.5 }, // 15.0m crowded chord
    { id: 'B-E', u: 'B', v: 'E', distance_m: 360, c: 1.0 }, // 6.0m clear chord
  ],
};

export function cloneGraph(graph: RoadNetwork): RoadNetwork {
  return {
    nodes: graph.nodes.map(n => ({ ...n })),
    edges: graph.edges.map(e => ({ ...e })),
  };
}
