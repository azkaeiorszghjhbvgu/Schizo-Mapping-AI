const startSelect = document.getElementById("start-city");
const goalSelect = document.getElementById("goal-city");
const modeSelect = document.getElementById("mode-select");
const runBtn = document.getElementById("run-btn");
const bfsSvg = document.getElementById("bfs-map");
const astarSvg = document.getElementById("astar-map");
const bfsPanel = document.getElementById("bfs-panel");
const astarPanel = document.getElementById("astar-panel");
const resultsBody = document.getElementById("results-body");
const statusEl = document.getElementById("status");

function populateSelect(select, defaultCity) {
  for (const city of CITY_NAMES) {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    if (city === defaultCity) opt.selected = true;
    select.appendChild(opt);
  }
}

populateSelect(startSelect, "Arad");
populateSelect(goalSelect, "Bucharest");
drawBaseMap(bfsSvg);
drawBaseMap(astarSvg);

function animateExpansion(svg, expansionOrder, path, start, goal, delayMs) {
  return new Promise((resolve) => {
    let i = 0;
    function step() {
      if (i < expansionOrder.length) {
        setNodeState(svg, expansionOrder[i], "visited");
        i++;
        setTimeout(step, delayMs);
      } else {
        if (path) {
          highlightPathEdges(svg, path);
          path.forEach((c) => setNodeState(svg, c, "on-path"));
        }
        setNodeState(svg, start, "start");
        setNodeState(svg, goal, "goal");
        resolve();
      }
    }
    step();
  });
}

function renderRow(name, result) {
  const tr = document.createElement("tr");
  const pathStr = result.found ? result.path.join(" → ") : "No path found";
  tr.innerHTML = `
    <td>${name}</td>
    <td class="path-cell">${pathStr}</td>
    <td>${result.found ? result.cost : "—"}</td>
    <td>${result.nodesExpanded}</td>
    <td>${result.maxFrontierSize}</td>
    <td>${result.runtimeMs.toFixed(3)}</td>
  `;
  resultsBody.appendChild(tr);
}

async function runComparison() {
  const start = startSelect.value;
  const goal = goalSelect.value;
  const mode = modeSelect.value; // "both" | "bfs" | "astar"

  const runBfs = mode === "both" || mode === "bfs";
  const runAstar = mode === "both" || mode === "astar";
  bfsPanel.hidden = !runBfs;
  astarPanel.hidden = !runAstar;

  runBtn.disabled = true;
  statusEl.textContent = `Searching from ${start} to ${goal}...`;
  resultsBody.innerHTML = "";
  if (runBfs) drawBaseMap(bfsSvg);
  if (runAstar) drawBaseMap(astarSvg);

  if (start === goal) {
    statusEl.textContent = "Start and goal are the same city.";
  }

  const bfsResult = runBfs ? uniformCostSearch(start, goal) : null;
  const astarResult = runAstar ? aStarSearch(start, goal) : null;

  const animations = [];
  if (runBfs) animations.push(animateExpansion(bfsSvg, bfsResult.expansionOrder, bfsResult.path, start, goal, 220));
  if (runAstar) animations.push(animateExpansion(astarSvg, astarResult.expansionOrder, astarResult.path, start, goal, 220));
  await Promise.all(animations);

  if (runBfs) renderRow("Uniform-Cost Search (blind)", bfsResult);
  if (runAstar) renderRow("A* Search (heuristic: straight-line distance)", astarResult);

  const summaryParts = [];
  if (runBfs) summaryParts.push(`UCS expanded ${bfsResult.nodesExpanded} nodes`);
  if (runAstar) summaryParts.push(`A* expanded ${astarResult.nodesExpanded} nodes`);
  statusEl.textContent = `Done. ${summaryParts.join("; ")}.`;
  runBtn.disabled = false;
}

runBtn.addEventListener("click", runComparison);
modeSelect.addEventListener("change", runComparison);

// Run once on load with the defaults so the page isn't empty.
runComparison();
