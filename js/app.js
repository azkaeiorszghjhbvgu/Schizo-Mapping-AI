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

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const swapBtn = document.getElementById("swapBtn");
const speedSelect = document.getElementById("speedSelect");
const playbackStatus = document.getElementById("playbackStatus");



let isPaused = false;
let animationSpeed = 1;
let animationToken = 0;


function populateSelect(select, defaultCity) {
  for (const city of CITY_NAMES) {
    const opt = document.createElement("option");

    opt.value = city;
    opt.textContent = city;

    if (city === defaultCity) {
      opt.selected = true;
    }

    select.appendChild(opt);
  }
}

populateSelect(startSelect, "Arad");
populateSelect(goalSelect, "Bucharest");

drawBaseMap(bfsSvg);
drawBaseMap(astarSvg);


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitWhilePaused(token) {
  while (
    isPaused &&
    token === animationToken
  ) {
    await sleep(60);
  }
}


async function animateExpansion(
  svg,
  expansionOrder,
  path,
  cameFrom,
  start,
  goal,
  token
) {
  let i = 0;

  setNodeState(
    svg,
    start,
    "start"
  );

  setNodeState(
    svg,
    goal,
    "goal"
  );

  while (
    i < expansionOrder.length
  ) {
    if (
      token !== animationToken
    ) {
      return;
    }

    await waitWhilePaused(token);

    if (
      token !== animationToken
    ) {
      return;
    }

    const city = expansionOrder[i];

    if (
      city !== start &&
      city !== goal
    ) {
      setNodeState(
        svg,
        city,
        "visited"
      );
    }

    if (
      cameFrom &&
      cameFrom.has(city)
    ) {
      const parent = cameFrom.get(city);

      animateExplorationEdge(
        svg,
        parent,
        city
      );
    }

    i++;

    if (playbackStatus) {
      playbackStatus.textContent =
        `Step ${i} / ${expansionOrder.length}`;
    }

    const delay =
      220 / animationSpeed;

    await sleep(delay);
  }

  if (
    token !== animationToken
  ) {
    return;
  }

  if (path) {
    highlightPathEdges(
      svg,
      path
    );

    path.forEach((city) => {
      if (
        city !== start &&
        city !== goal
      ) {
        setNodeState(
          svg,
          city,
          "on-path"
        );
      }
    });
  }

  setNodeState(
    svg,
    start,
    "start"
  );

  setNodeState(
    svg,
    goal,
    "goal"
  );
}


function renderRow(
  name,
  result
) {
  const tr =
    document.createElement("tr");

  const pathStr =
    result.found
      ? result.path.join(" → ")
      : "No path found";

  tr.innerHTML = `
    <td>
      ${name}
    </td>

    <td class="path-cell">
      ${pathStr}
    </td>

    <td>
      ${
        result.found
          ? result.cost
          : "—"
      }
    </td>

    <td>
      ${result.nodesExpanded}
    </td>

    <td>
      ${result.maxFrontierSize}
    </td>

    <td>
      ${result.runtimeMs.toFixed(3)}
    </td>
  `;

  resultsBody.appendChild(tr);
}


async function runComparison() {
  animationToken++;

  const token =
    animationToken;

  isPaused = false;

  if (playbackStatus) {
    playbackStatus.textContent =
      "Running...";
  }

  const start =
    startSelect.value;

  const goal =
    goalSelect.value;

  const mode =
    modeSelect.value;

  const runBfs =
    mode === "both" ||
    mode === "bfs";

  const runAstar =
    mode === "both" ||
    mode === "astar";

  bfsPanel.hidden =
    !runBfs;

  astarPanel.hidden =
    !runAstar;

  runBtn.disabled =
    true;

  statusEl.textContent =
    `Searching from ${start} to ${goal}...`;

  resultsBody.innerHTML =
    "";

  if (runBfs) {
    drawBaseMap(
      bfsSvg
    );
  }

  if (runAstar) {
    drawBaseMap(
      astarSvg
    );
  }

  if (
    start === goal
  ) {
    statusEl.textContent =
      "Start and goal are the same city.";
  }

  const bfsResult =
    runBfs
      ? uniformCostSearch(
          start,
          goal
        )
      : null;

  const astarResult =
    runAstar
      ? aStarSearch(
          start,
          goal
        )
      : null;

  const animations =
    [];

  if (runBfs) {
    animations.push(
      animateExpansion(
        bfsSvg,
        bfsResult.expansionOrder,
        bfsResult.path,
        bfsResult.cameFrom,
        start,
        goal,
        token
      )
    );
  }

  if (runAstar) {
    animations.push(
      animateExpansion(
        astarSvg,
        astarResult.expansionOrder,
        astarResult.path,
        astarResult.cameFrom,
        start,
        goal,
        token
      )
    );
  }

  await Promise.all(
    animations
  );

  if (
    token !== animationToken
  ) {
    return;
  }

  if (runBfs) {
    renderRow(
      "Uniform-Cost Search (blind)",
      bfsResult
    );
  }

  if (runAstar) {
    renderRow(
      "A* Search (heuristic)",
      astarResult
    );
  }

  const summaryParts =
    [];

  if (runBfs) {
    summaryParts.push(
      `UCS expanded ${bfsResult.nodesExpanded} nodes`
    );
  }

  if (runAstar) {
    summaryParts.push(
      `A* expanded ${astarResult.nodesExpanded} nodes`
    );
  }

  statusEl.textContent =
    `Done. ${summaryParts.join("; ")}.`;

  if (playbackStatus) {
    playbackStatus.textContent =
      "Complete";
  }

  runBtn.disabled =
    false;
}


playBtn.addEventListener(
  "click",
  () => {
    isPaused = false;

    playbackStatus.textContent =
      "Playing";
  }
);



pauseBtn.addEventListener(
  "click",
  () => {
    isPaused = true;

    playbackStatus.textContent =
      "Paused";
  }
);


resetBtn.addEventListener(
  "click",
  () => {
    animationToken++;

    isPaused = false;

    drawBaseMap(
      bfsSvg
    );

    drawBaseMap(
      astarSvg
    );

    resultsBody.innerHTML =
      "";

    statusEl.textContent =
      "";

    playbackStatus.textContent =
      "Ready";

    runBtn.disabled =
      false;
  }
);



speedSelect.addEventListener(
  "change",
  () => {
    animationSpeed =
      Number(
        speedSelect.value
      );
  }
);


runBtn.addEventListener(
  "click",
  runComparison
);

modeSelect.addEventListener(
  "change",
  runComparison
);



runComparison();

swapBtn.addEventListener(
  "click",
  () => {
    const oldStart =
      startSelect.value;

    const oldGoal =
      goalSelect.value;

    startSelect.value =
      oldGoal;

    goalSelect.value =
      oldStart;

    runComparison();
  }
);