import {
  ITER_CAMPUS_GRAPH,
  SMALL_CITY_5_NODE_GRAPH,
  DIAMOND_4_NODE_GRAPH,
  CYCLE_6_NODE_GRAPH,
} from '../src/data/presets';
import { computeAllPairsShortestPaths } from '../src/algorithms/dijkstra';
import { runNearestNeighbour } from '../src/algorithms/nearestNeighbour';
import { runTwoOpt } from '../src/algorithms/twoOpt';
import { computeDynamicDisruption } from '../src/algorithms/dynamicRouter';

console.log('================================================================');
console.log('COMPREHENSIVE ALGORITHM SUITE VERIFICATION');
console.log('Checking Dijkstra, Nearest Neighbour, 2-opt, & Dynamic Router');
console.log('================================================================\n');

let allPassed = true;

function assert(condition: boolean, testName: string, detail: string) {
  if (condition) {
    console.log(`[PASS] ${testName}: ${detail}`);
  } else {
    console.error(`[FAIL] ${testName}: ${detail}`);
    allPassed = false;
  }
}

// -------------------------------------------------------------------------
// SUITE 1: ITER CAMPUS CASE STUDY (SOA)
// -------------------------------------------------------------------------
console.log('--- SUITE 1: ITER Campus Case Study (7 Nodes, 11 Roads) ---');
const iterAllPairs = computeAllPairsShortestPaths(ITER_CAMPUS_GRAPH);

assert(
  iterAllPairs.matrix['W']['C'] === 4.0 && iterAllPairs.paths['W']['C'].join(' → ') === 'W → A → C',
  '1.1 Dijkstra T[W][C] Shortcut',
  `Got ${iterAllPairs.matrix['W']['C']}m via ${iterAllPairs.paths['W']['C'].join(' → ')} (beating 7.5m direct)`
);

assert(
  iterAllPairs.matrix['B']['F'] === 9.0 && iterAllPairs.paths['B']['F'].join(' → ') === 'B → C → F',
  '1.2 Dijkstra T[B][F] Fewer-Hops Tie-Break',
  `Got ${iterAllPairs.matrix['B']['F']}m via ${iterAllPairs.paths['B']['F'].join(' → ')} (2 hops)`
);

const iterNN = runNearestNeighbour(ITER_CAMPUS_GRAPH, iterAllPairs, 'W');
assert(
  iterNN.tour.join(' → ') === 'W → A → C → E → D → B → F → W' && iterNN.totalCost === 24.0,
  '1.3 Nearest Neighbour Baseline Tour & Cost',
  `Got ${iterNN.tour.join(' → ')} = ${iterNN.totalCost} mins`
);

const iter2Opt = runTwoOpt(iterNN.tour, ITER_CAMPUS_GRAPH, iterAllPairs);
assert(
  iter2Opt.finalTour.join(' → ') === 'W → A → B → D → E → C → F → W' && iter2Opt.finalCost === 21.0 && iter2Opt.totalSaved === 3.0,
  '1.4 2-opt Tour Refinement & Savings',
  `Got ${iter2Opt.finalTour.join(' → ')} = ${iter2Opt.finalCost} mins (saved ${iter2Opt.totalSaved} mins)`
);

const iterDisrupt = computeDynamicDisruption(
  ITER_CAMPUS_GRAPH,
  iter2Opt.finalTour,
  'B',
  { u: 'C', v: 'E' },
  Infinity
);
assert(
  iterDisrupt.staticPlan.totalTime === 27.0 && iterDisrupt.dynamicPlan.totalTime === 24.0 && iterDisrupt.timeSaved === 3.0,
  '1.5 Dynamic Disruption (Cart at B*, Road C–E Blocked)',
  `Static Detour: ${iterDisrupt.staticPlan.totalTime}m | Dynamic Route: ${iterDisrupt.dynamicPlan.totalTime}m | Saved: ${iterDisrupt.timeSaved}m`
);

// -------------------------------------------------------------------------
// SUITE 2: 4-NODE DIAMOND GRAPH
// -------------------------------------------------------------------------
console.log('\n--- SUITE 2: 4-Node Diamond Graph (W, A, B, C) ---');
const diamondAllPairs = computeAllPairsShortestPaths(DIAMOND_4_NODE_GRAPH);

// W-A = 2.0m, A-B = 3.0m, B-C = 2.0m, C-W = 3.0m, W-B = 10.0m crowded (c=2.5), A-C = 7.5m moderate (c=1.5)
assert(
  diamondAllPairs.matrix['W']['B'] === 5.0 && diamondAllPairs.paths['W']['B'].join(' → ') === 'W → A → B',
  '2.1 Diamond Dijkstra T[W][B] Avoids Congested Direct',
  `Avoided 10.0m direct diagonal; routed via W → A → B (5.0m)`
);

const diamondNN = runNearestNeighbour(DIAMOND_4_NODE_GRAPH, diamondAllPairs, 'W');
assert(
  diamondNN.tour.length === 5 && diamondNN.totalCost === 10.0,
  '2.2 Diamond Nearest Neighbour',
  `Tour: ${diamondNN.tour.join(' → ')} = ${diamondNN.totalCost} mins`
);

const diamond2Opt = runTwoOpt(diamondNN.tour, DIAMOND_4_NODE_GRAPH, diamondAllPairs);
assert(
  diamond2Opt.finalCost <= diamondNN.totalCost,
  '2.3 Diamond 2-opt Refinement',
  `Cost: ${diamond2Opt.finalCost} mins (initial: ${diamondNN.totalCost}m)`
);

// -------------------------------------------------------------------------
// SUITE 3: 5-NODE CITY GRAPH
// -------------------------------------------------------------------------
console.log('\n--- SUITE 3: 5-Node City Graph (W, A, B, C, D) ---');
const cityAllPairs = computeAllPairsShortestPaths(SMALL_CITY_5_NODE_GRAPH);

// Check that W avoids crowded W-B link (12.5m)
assert(
  cityAllPairs.matrix['W']['B'] === 5.5 && cityAllPairs.paths['W']['B'].join(' → ') === 'W → A → B',
  '3.1 City Dijkstra T[W][B] Avoids Congestion',
  `W → A (3.0m) + A → B (2.5m) = 5.5m (beating 12.5m direct)`
);

const cityNN = runNearestNeighbour(SMALL_CITY_5_NODE_GRAPH, cityAllPairs, 'W');
assert(
  cityNN.tour.length === 6 && cityNN.totalCost > 0,
  '3.2 City Nearest Neighbour Complete Tour',
  `Tour: ${cityNN.tour.join(' → ')} = ${cityNN.totalCost} mins`
);

const city2Opt = runTwoOpt(cityNN.tour, SMALL_CITY_5_NODE_GRAPH, cityAllPairs);
assert(
  city2Opt.finalCost <= cityNN.totalCost,
  '3.3 City 2-opt Tour Convergence',
  `Final Cost: ${city2Opt.finalCost} mins (saved ${city2Opt.totalSaved}m)`
);

// Disruption in City: Block C-D
const cityDisrupt = computeDynamicDisruption(
  SMALL_CITY_5_NODE_GRAPH,
  city2Opt.finalTour,
  city2Opt.finalTour[1],
  { u: 'C', v: 'D' },
  Infinity
);
assert(
  cityDisrupt.dynamicPlan.remainingTime <= cityDisrupt.staticPlan.remainingTime,
  '3.4 City Disruption Dynamic Re-routing',
  `Static: ${cityDisrupt.staticPlan.totalTime}m | Dynamic: ${cityDisrupt.dynamicPlan.totalTime}m`
);

// -------------------------------------------------------------------------
// SUITE 4: 6-NODE CYCLE GRAPH WITH SHORTCUT CHORDS
// -------------------------------------------------------------------------
console.log('\n--- SUITE 4: 6-Node Cycle Graph with Chords ---');
const cycleAllPairs = computeAllPairsShortestPaths(CYCLE_6_NODE_GRAPH);

assert(
  cycleAllPairs.matrix['B']['E'] === 6.0 && cycleAllPairs.paths['B']['E'].join(' → ') === 'B → E',
  '4.1 Cycle Graph Chord Shortcut',
  `B → E direct chord used (6.0m)`
);

const cycleNN = runNearestNeighbour(CYCLE_6_NODE_GRAPH, cycleAllPairs, 'W');
const cycle2Opt = runTwoOpt(cycleNN.tour, CYCLE_6_NODE_GRAPH, cycleAllPairs);
assert(
  cycle2Opt.finalCost <= cycleNN.totalCost,
  '4.2 Cycle Graph 2-opt Optimization',
  `NN: ${cycleNN.totalCost}m → 2-opt: ${cycle2Opt.finalCost}m`
);

console.log('\n================================================================');
if (allPassed) {
  console.log('ALL VERIFICATION SUITES PASSED FLAWLESSLY! (100%)');
} else {
  console.error('VERIFICATION HAD FAILURES.');
  process.exit(1);
}
console.log('================================================================\n');
