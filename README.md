# Intelligent Delivery Route Optimisation Under Dynamic Traffic Conditions

> **An Interactive Academic Visualisation & Algorithmic Explainer**  
> **Author:** Arya Kumar Mallik  
> **Institution:** Faculty of Engineering and Technology, ITER, Siksha 'O' Anusandhan (SOA) Deemed to be University

[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-teal.svg)](https://tailwindcss.com/)
[![Pure SVG](https://img.shields.io/badge/Rendering-Pure%20SVG-orange.svg)]()
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen.svg)]()

---

## 📌 Executive Summary & Research Motivation
Campus utility carts and last-mile autonomous couriers operate under **dynamic traffic congestion**, pedestrian surges, and unexpected road closures. Standard static shortest-path algorithms and greedy dispatch heuristics frequently fail near the end of delivery routes by creating expensive **backtrack traps**.

This web application visualises and proves the multi-stage optimization pipeline proposed in the research report:
1. **Dijkstra's Algorithm with Congestion Factors:** Discovering when a longer clear detour is faster than a short congested link.
2. **Nearest Neighbour (TSP Baseline):** Demonstrating how early greedy choices isolate stops and cause heavy backtracks.
3. **2-opt Local Search:** Visually explaining the 3-step edge-swap mechanism (**Cut $\to$ Invert $\to$ Reconnect**) that uncrosses routes.
4. **Dynamic Mid-Journey Re-routing:** Proving why re-optimising remaining stops $U$ dynamically outperforms static detour planning during sudden road closures.

---

## 📐 Mathematical Formulation

### 1. Dynamic Travel Time Equation
The effective traversal time $w(u, v)$ for an edge connecting stops $u$ and $v$ is modeled as:
$$w(u, v) = \left( \frac{d(u, v)}{v_{\text{base}}} \right) \times c(u, v)$$

Where:
- $d(u, v)$ = Physical road distance in metres.
- $v_{\text{base}} = 60\text{ m/min}$ ($1.0\text{ m/s}$ average campus utility cart operating speed).
- $c(u, v)$ = Congestion multiplier:
  - **Clear ($c = 1.0$):** Normal campus speed ($60\text{ m/min}$).
  - **Moderate ($c = 1.5$):** Mild pedestrian flow ($40\text{ m/min}$).
  - **Crowded ($c = 2.5$):** Peak class dismissal rush ($24\text{ m/min}$).
  - **Blocked ($c = \infty$):** Construction / impassable pathway.

### 2. Tie-Breaking Rule (Fewest Hops)
When two candidate paths have identical travel times, the algorithm prefers the route with fewer intermediate nodes:
$$\min \left\{ \text{Hops}(P) \mid \text{Time}(P) = T_{\min} \right\}$$
*(e.g., $B \to F$ cleanly resolves to $B \to C \to F$ in 2 hops).*

### 3. 2-opt Swap Mechanics
Given tour $T$ and two non-adjacent edges $(u, v)$ and $(x, y)$:
$$\Delta \text{Cost} = [w(u, x) + w(v, y)] - [w(u, v) + w(x, y)]$$
If $\Delta \text{Cost} < 0$, edges $(u, v)$ and $(x, y)$ are cut, the intermediate sub-chain is reversed, and edges $(u, x)$ and $(v, y)$ are reconnected.

---

## 🎓 The ITER (SOA) Campus Case Study (Benchmark Results)

The system is preloaded with the exact 7-node planar layout of the ITER campus:
- **Nodes:** `W` (Main Cafeteria / Hub), `A` (Academic Block A), `B` (BioTech Block), `C` (Central Library), `D` (Dept. of CS & IT), `E` (Engineering Workshop), `F` (Faculty Enclave).

### Proven Benchmark Results:
| Phase | Algorithm | Path / Metric | Travel Time | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 1** | Dijkstra Shortest Path | $W \to A \to C$ | **4.0 mins** | Beats direct congested road $W \to C$ ($7.5\text{m}$) |
| **Stage 1** | Dijkstra Tie-Break | $B \to C \to F$ | **9.0 mins** | Prefers 2 hops over 3 hops |
| **Stage 2** | Nearest Neighbour | $W \to A \to C \to E \to D \to B \to F \to W$ | **24.0 mins** | Trapped: forced $9.0\text{m}$ backtrack $B \to C \to F$ |
| **Stage 3** | 2-opt Local Search | $W \to A \to B \to D \to E \to C \to F \to W$ | **21.0 mins** | Cuts $(A,C) + (B,F)$ ($11\text{m}$), adds $(A,B) + (C,F)$ ($8\text{m}$) $\to$ **Saves 3.0 mins** |
| **Stage 4** | Static Detour ($C\text{–}E$ Blocked at $B^*$) | $[B^* \to D \to E \to C \to F \to W]$ | **27.0 mins** | Double traversal of $C\text{–}F$ ($21\text{m}$ remaining) |
| **Stage 4** | Dynamic Route ($C\text{–}E$ Blocked at $B^*$) | $[B^* \to D \to E \to F \to C \to W]$ | **24.0 mins** | Re-sequenced remaining stops $\to$ **Saves 3.0 mins** |

---

## 🚀 Interactive Features

### Mode A: ITER Campus Case Study (Default)
- **Zero-Setup Walkthrough:** Step through all 4 stages with live plain-English explanations.
- **Live Traffic Cycling:** Click any road to cycle traffic condition ($1.0 \to 1.5 \to 2.5 \to \infty$).
- **One-Click Reset:** Instantly restore default campus conditions.

### Mode B: Custom Graph Lab (Interactive Builder)
- **Add Stop Tool:** Click anywhere on the canvas to place nodes (auto-labeled $W, A, B, C \dots$).
- **Connect Road Tool:** Click Stop 1, see the live rubber-band guide line, then click Stop 2. Enter distance and traffic condition in the dialog.
- **Move / Edit Tool:** Smoothly drag stops; click any road to adjust weights or cycle traffic; click any stop to designate it as the Central Hub ($W$) or delete it.
- **Roads & Traffic Manager:** Full tabular inspector displaying all edges, inline distance inputs, single-click traffic factor buttons, and add-road form.
- **Presets Menu:** Quick starter configurations: `ITER Campus`, `5-Node City`, `4-Node Diamond`, `6-Node Cycle`, and `Start Blank`.
- **Validation Engine:** Checks full graph reachability before launching the 4-stage stepper.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS (Strict academic neutral palette: Navy `#1e3a8a`, Slate `#334155`, Blue `#1d4ed8`, Amber `#d97706`, Teal `#0f766e`, Red `#dc2626`)
- **Canvas:** Pure Interactive SVG (zero heavy D3/Canvas dependencies)
- **Test Runner:** `tsx` automated verification test script

```
route-optimisation-iter/
├── scripts/
│   └── verify.ts                 # Automated unit tests across 4 network topologies
├── src/
│   ├── types/
│   │   └── graph.ts              # Graph interfaces, step traces, and matrix models
│   ├── data/
│   │   └── presets.ts            # ITER Campus (7 nodes), 5-City, 4-Diamond, 6-Cycle
│   ├── algorithms/
│   │   ├── dijkstra.ts           # Single-source trace + All-Pairs Matrix T
│   │   ├── nearestNeighbour.ts   # Greedy TSP baseline + backtrack detection
│   │   ├── twoOpt.ts             # Pairwise 2-opt edge swap search
│   │   └── dynamicRouter.ts      # Static detour vs. dynamic partial re-sequencing
│   ├── components/
│   │   ├── Header.tsx            # Academic title, author info, formula chip, mode toggle
│   │   ├── StageProgressBar.tsx  # 4-stage progressive disclosure bar
│   │   ├── GraphCanvas.tsx       # Interactive pure-SVG graph renderer & zoom controls
│   │   ├── GraphEditorToolbar.tsx# Custom graph builder toolbar & presets
│   │   ├── ConnectEdgeModal.tsx  # Dialog for connecting 2 stops
│   │   ├── EditEdgeModal.tsx     # Dialog for editing road distance & traffic
│   │   ├── EditNodeModal.tsx     # Dialog for editing stop label & hub status
│   │   ├── RoadManagerModal.tsx  # Tabular road manager
│   │   ├── DijkstraPanel.tsx     # Single-source live table + All-Pairs matrix inspector
│   │   ├── NearestNeighbourPanel.tsx # Route strip + candidate comparisons
│   │   ├── TwoOptPanel.tsx       # 2-opt search depth filter + metrics
│   │   ├── TwoOptLineDiagram.tsx # 3-row visual line diagram (Cut, Invert, Reconnect)
│   │   ├── DisruptionPanel.tsx   # Side-by-side static vs dynamic comparison
│   │   └── PlaybackControls.tsx  # Step playback controls (Play, Pause, Step, Speed)
│   ├── App.tsx                   # Master layout coordinator (65% SVG / 35% Explainer)
│   ├── index.css
│   └── main.tsx
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 📄 License
This project is released under the **MIT License**.

---
