// Two search strategies over the Romania road-map graph:
//  1) Uniform-Cost Search (UCS / Dijkstra's) - blind/uninformed, expands by lowest path cost so far
//  2) A* Search - informed, uses the straight-line-distance heuristic (admissible & consistent)

function reconstructPath(cameFrom, goal) {
  const path = [goal];
  let cur = goal;
  while (cameFrom.has(cur)) {
    cur = cameFrom.get(cur);
    path.push(cur);
  }
  path.reverse();
  return path;
}

function pathCost(path) {
  let cost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = GRAPH[path[i]].find((e) => e.to === path[i + 1]);
    cost += edge.cost;
  }
  return cost;
}

function uniformCostSearch(start, goal) {
  const t0 = performance.now();
  // frontier entries: { node, g } - blind: ordered only by accumulated path cost, no heuristic
  const frontier = [{ node: start, g: 0 }];
  const cameFrom = new Map();
  const bestG = new Map([[start, 0]]);
  const closed = new Set();
  const expansionOrder = [];
  let maxFrontierSize = 1;
  let nodesExpanded = 0;

  while (frontier.length > 0) {
    maxFrontierSize = Math.max(maxFrontierSize, frontier.length);
    // pick lowest-g node (linear scan fine for 20-node graph)
    let bestIdx = 0;
    for (let i = 1; i < frontier.length; i++) {
      if (frontier[i].g < frontier[bestIdx].g) bestIdx = i;
    }
    const { node, g } = frontier.splice(bestIdx, 1)[0];

    if (closed.has(node)) continue;
    closed.add(node);
    nodesExpanded++;
    expansionOrder.push(node);

    if (node === goal) {
      return finishResult({
        found: true, path: reconstructPath(cameFrom, goal), cameFrom,
        expansionOrder, nodesExpanded, maxFrontierSize, visitedCount: closed.size + frontier.length, t0,
      });
    }

    for (const { to, cost } of GRAPH[node]) {
      const tentativeG = g + cost;
      if (!bestG.has(to) || tentativeG < bestG.get(to)) {
        bestG.set(to, tentativeG);
        cameFrom.set(to, node);
        frontier.push({ node: to, g: tentativeG });
      }
    }
  }

  return finishResult({ found: false, path: null, cameFrom, expansionOrder, nodesExpanded, maxFrontierSize, visitedCount: closed.size, t0 });
}

function aStarSearch(start, goal) {
  const t0 = performance.now();
  // frontier entries: { node, g, f }
  const frontier = [{ node: start, g: 0, f: straightLineHeuristic(start, goal) }];
  const cameFrom = new Map();
  const bestG = new Map([[start, 0]]);
  const closed = new Set();
  const expansionOrder = [];
  let maxFrontierSize = 1;
  let nodesExpanded = 0;

  while (frontier.length > 0) {
    maxFrontierSize = Math.max(maxFrontierSize, frontier.length);
    // pick lowest-f node (linear scan fine for 20-node graph)
    let bestIdx = 0;
    for (let i = 1; i < frontier.length; i++) {
      if (frontier[i].f < frontier[bestIdx].f) bestIdx = i;
    }
    const { node, g } = frontier.splice(bestIdx, 1)[0];

    if (closed.has(node)) continue;
    closed.add(node);
    nodesExpanded++;
    expansionOrder.push(node);

    if (node === goal) {
      return finishResult({
        found: true, path: reconstructPath(cameFrom, goal), cameFrom,
        expansionOrder, nodesExpanded, maxFrontierSize, visitedCount: closed.size + frontier.length, t0,
      });
    }

    for (const { to, cost } of GRAPH[node]) {
      const tentativeG = g + cost;
      if (!bestG.has(to) || tentativeG < bestG.get(to)) {
        bestG.set(to, tentativeG);
        cameFrom.set(to, node);
        frontier.push({ node: to, g: tentativeG, f: tentativeG + straightLineHeuristic(to, goal) });
      }
    }
  }

  return finishResult({ found: false, path: null, cameFrom, expansionOrder, nodesExpanded, maxFrontierSize, visitedCount: closed.size, t0 });
}

function finishResult({ found, path, expansionOrder, nodesExpanded, maxFrontierSize, visitedCount, t0 }) {
  const runtimeMs = performance.now() - t0;
  return {
    found,
    path,
    cost: found ? pathCost(path) : null,
    expansionOrder,
    nodesExpanded,
    maxFrontierSize, // proxy for space complexity
    visitedCount,
    runtimeMs,
  };
}
