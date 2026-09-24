
// Two search strategies over the Romania road-map graph:
// 1) Uniform-Cost Search (UCS / Dijkstra's)
//    Blind / uninformed search, expands the lowest path cost first.
//
// 2) A* Search
//    Informed search, uses straight-line distance as a heuristic.

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
    const edge = GRAPH[path[i]].find(
      (e) => e.to === path[i + 1]
    );

    cost += edge.cost;
  }

  return cost;
}

function uniformCostSearch(start, goal) {
  const t0 = performance.now();


  const frontier = [
    {
      node: start,
      g: 0
    }
  ];

  const cameFrom = new Map();

  const bestG = new Map([
    [start, 0]
  ]);

  const closed = new Set();

  const expansionOrder = [];

  let maxFrontierSize = 1;
  let nodesExpanded = 0;

  while (frontier.length > 0) {
    maxFrontierSize = Math.max(
      maxFrontierSize,
      frontier.length
    );

    let bestIdx = 0;

    for (let i = 1; i < frontier.length; i++) {
      if (
        frontier[i].g <
        frontier[bestIdx].g
      ) {
        bestIdx = i;
      }
    }

    const { node, g } =
      frontier.splice(
        bestIdx,
        1
      )[0];

    if (closed.has(node)) {
      continue;
    }

    closed.add(node);

    nodesExpanded++;

    expansionOrder.push(node);

    
    if (node === goal) {
      return finishResult({
        found: true,

        path: reconstructPath(
          cameFrom,
          goal
        ),

        cameFrom,
        expansionOrder,
        nodesExpanded,
        maxFrontierSize,

        visitedCount:
          closed.size +
          frontier.length,

        t0,
      });
    }

    for (
      const { to, cost }
      of GRAPH[node]
    ) {
      const tentativeG =
        g + cost;

      if (
        !bestG.has(to) ||
        tentativeG <
          bestG.get(to)
      ) {
        bestG.set(
          to,
          tentativeG
        );

        cameFrom.set(
          to,
          node
        );

        frontier.push({
          node: to,
          g: tentativeG
        });
      }
    }
  }

  return finishResult({
    found: false,
    path: null,
    cameFrom,
    expansionOrder,
    nodesExpanded,
    maxFrontierSize,
    visitedCount: closed.size,
    t0
  });
}

// A* Search using the Fruit Fly Scent Heuristic
function aStarSearch(start, goal) {
  const t0 = performance.now();



  // Start node: f = g (0) + h (scent heuristic)
  const frontier = [
    {
      node: start,
      g: 0,
      f: fruitFlyWindScentHeuristic(
        start,
        goal
      )
    }
  ];

  const cameFrom = new Map();

  const bestG = new Map([
    [start, 0]
  ]);

  const closed = new Set();

  const expansionOrder = [];

  let maxFrontierSize = 1;
  let nodesExpanded = 0;

  while (frontier.length > 0) {
    maxFrontierSize = Math.max(
      maxFrontierSize,
      frontier.length
    );

  

    // Pick node with lowest f-score
    let bestIdx = 0;

    for (let i = 1; i < frontier.length; i++) {
      if (
        frontier[i].f <
        frontier[bestIdx].f
      ) {
        bestIdx = i;
      }
    }

    const { node, g } =
      frontier.splice(
        bestIdx,
        1
      )[0];

    if (closed.has(node)) {
      continue;
    }

    closed.add(node);

    nodesExpanded++;

    expansionOrder.push(node);

    // Goal found
    if (node === goal) {
      return finishResult({
        found: true,

        path: reconstructPath(
          cameFrom,
          goal
        ),

        cameFrom,
        expansionOrder,
        nodesExpanded,
        maxFrontierSize,

        visitedCount:
          closed.size +
          frontier.length,

        t0,
      });
    }

  
    // Check neighbors: calculate tentative g + scent h-score
    for (
      const { to, cost }
      of GRAPH[node]
    ) {
      const tentativeG =
        g + cost;

      if (
        !bestG.has(to) ||
        tentativeG <
          bestG.get(to)
      ) {
        bestG.set(
          to,
          tentativeG
        );

        cameFrom.set(
          to,
          node
        );

        frontier.push({
          node: to,
          g: tentativeG,
          f:
            tentativeG +
            fruitFlyWindScentHeuristic(
              to,
              goal
            )
        });
      }
    }
  }

  
  return finishResult({
    found: false,
    path: null,
    cameFrom,
    expansionOrder,
    nodesExpanded,
    maxFrontierSize,
    visitedCount: closed.size,
    t0
  });
}

function finishResult({
  found,
  path,
  cameFrom,
  expansionOrder,
  nodesExpanded,
  maxFrontierSize,
  visitedCount,
  t0
}) {
  const runtimeMs =
    performance.now() -
    t0;

  return {
    found,
    path,
    cameFrom,

    cost:
      found
        ? pathCost(path)
        : null,

    expansionOrder,
    nodesExpanded,
    maxFrontierSize,
    visitedCount,
    runtimeMs,
  };
}