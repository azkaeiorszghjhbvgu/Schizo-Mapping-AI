// A* evidence panel: measures the Fruit Fly heuristic in the browser over all 380
// start/goal pairs, instead of quoting numbers in the text.
(function buildEvidence() {
  const IN_PLUME = 0.5; // start scent at or above this counts as "fly can smell the goal"

  // [pairs, UCS nodes, straight-line A* nodes, Fruit Fly A* nodes]
  const groups = { all: [0, 0, 0, 0], in: [0, 0, 0, 0], out: [0, 0, 0, 0] };

  for (const goal of CITY_NAMES) {
    for (const start of CITY_NAMES) {
      if (start === goal) continue;

      const ucs = uniformCostSearch(start, goal);
      const plain = aStarSearch(start, goal, straightLineHeuristic);
      const fly = aStarSearch(start, goal);

      const group = scentStrength(start, goal) >= IN_PLUME ? "in" : "out";
      for (const g of [groups.all, groups[group]]) {
        g[0]++;
        g[1] += ucs.nodesExpanded;
        g[2] += plain.nodesExpanded;
        g[3] += fly.nodesExpanded;
      }
    }
  }

  const avg = (g, i) => (g[0] ? (g[i] / g[0]).toFixed(1) : "–");
  const row = (label, g) =>
    `<tr><td>${label}</td><td>${g[0]}</td><td>${avg(g, 1)}</td><td>${avg(g, 2)}</td><td>${avg(g, 3)}</td></tr>`;

  document.getElementById("evidence-body").innerHTML = [
    row("All pairs", groups.all),
    row(`Start in plume (scent ≥ ${IN_PLUME})`, groups.in),
    row(`Start outside plume (scent < ${IN_PLUME})`, groups.out),
  ].join("");
})();
