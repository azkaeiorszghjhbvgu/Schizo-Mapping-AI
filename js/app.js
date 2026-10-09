const startSelect = document.getElementById("start-city");
const goalSelect = document.getElementById("goal-city");
const modeSelect = document.getElementById("mode-select");

const bfsSvg = document.getElementById("bfs-map");
const astarSvg = document.getElementById("astar-map");

const bfsPanel = document.getElementById("bfs-panel");
const astarPanel = document.getElementById("astar-panel");

const resultsBody = document.getElementById("results-body");
const statusEl = document.getElementById("status");

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const speedSelect = document.getElementById("speedSelect");
const playbackStatus = document.getElementById("playbackStatus");



let isPaused = false;
let animationSpeed = 1;
let animationToken = 0;
let isRunning = false;


// typed text can be anything, so map it to a real city name (any case) or undefined
function findCity(input) {
  const typed = input.value.trim().toLowerCase();

  return CITY_NAMES.find(
    (city) => city.toLowerCase() === typed
  );
}


// cancel any animation and clear the maps and results
function stopRun() {
  animationToken++;

  isPaused = false;
  isRunning = false;

  drawBaseMap(bfsSvg);
  drawBaseMap(astarSvg);

  resultsBody.innerHTML = "";

  playbackStatus.textContent = "Ready";
}


// each box's list leaves out the city chosen in the other box
function fillCityList(list, excludeCity) {
  list.innerHTML = "";

  for (const city of CITY_NAMES) {
    if (city === excludeCity) {
      continue;
    }

    const opt = document.createElement("option");

    opt.value = city;

    list.appendChild(opt);
  }
}

function refreshCityLists() {
  fillCityList(startSelect.list, findCity(goalSelect));
  fillCityList(goalSelect.list, findCity(startSelect));
}

refreshCityLists();

drawBaseMap(bfsSvg);
drawBaseMap(astarSvg);


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// A single search on 20 cities takes microseconds, so one timing is mostly noise
const TIMING_RUNS = 1000;

function runTimed(searchFn, start, goal) {
  const result = searchFn(start, goal);

  const t0 = performance.now();

  for (let i = 0; i < TIMING_RUNS; i++) {
    searchFn(start, goal);
  }

  result.runtimeMs =
    (performance.now() - t0) / TIMING_RUNS;

  return result;
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
      ${result.runtimeMs.toFixed(4)}
    </td>
  `;

  resultsBody.appendChild(tr);
}


async function runComparison() {
  const start =
    findCity(startSelect);

  const goal =
    findCity(goalSelect);

  if (
    !start ||
    !goal ||
    !modeSelect.value
  ) {
    stopRun();

    statusEl.textContent =
      "Select a start city, goal city and algorithm.";

    return;
  }

  // the lists hide this, but the same name can still be typed into both boxes
  if (start === goal) {
    stopRun();

    statusEl.textContent =
      "Start and goal must be different cities.";

    return;
  }

  animationToken++;

  const token =
    animationToken;

  isPaused = false;
  isRunning = true;

  if (playbackStatus) {
    playbackStatus.textContent =
      "Running...";
  }

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

  const bfsResult =
    runBfs
      ? runTimed(
          uniformCostSearch,
          start,
          goal
        )
      : null;

  const astarResult =
    runAstar
      ? runTimed(
          aStarSearch,
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
      "A* Search (Fruit Fly Scent)",
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

  isRunning = false;

  if (playbackStatus) {
    playbackStatus.textContent =
      "Complete";
  }
}


playBtn.addEventListener(
  "click",
  () => {
    if (!isRunning) {
      return;
    }

    isPaused = false;

    playbackStatus.textContent =
      "Playing";
  }
);



pauseBtn.addEventListener(
  "click",
  () => {
    if (!isRunning) {
      return;
    }

    isPaused = true;

    playbackStatus.textContent =
      "Paused";
  }
);


resetBtn.addEventListener(
  "click",
  () => {
    stopRun();

    statusEl.textContent =
      "";

    startSelect.value = "";
    goalSelect.value = "";
    modeSelect.value = "";

    refreshCityLists();

    bfsPanel.hidden = false;
    astarPanel.hidden = false;
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


// "input" also fires when a city is picked from the datalist
// only refill the other box's list, so the open list under the cursor doesn't flicker
startSelect.addEventListener(
  "input",
  () => {
    fillCityList(goalSelect.list, findCity(startSelect));

    runComparison();
  }
);

goalSelect.addEventListener(
  "input",
  () => {
    fillCityList(startSelect.list, findCity(goalSelect));

    runComparison();
  }
);

modeSelect.addEventListener(
  "change",
  runComparison
);
