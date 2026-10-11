// Touch screens get a native <select>: iOS Safari shows no dropdown for <datalist>.
// Desktop keeps the typeable <input> whose datalist suggests matching cities.
function cityBox(id) {
  const input = document.getElementById(id);

  if (!matchMedia("(pointer: coarse)").matches) {
    return input;
  }

  const select = document.createElement("select");

  select.id = id;
  input.replaceWith(select);

  return select;
}

const startSelect = cityBox("start-city");
const goalSelect = cityBox("goal-city");
const modeSelect = document.getElementById("mode-select");

const ucsSvg = document.getElementById("ucs-map");
const astarSvg = document.getElementById("astar-map");

const ucsPanel = document.getElementById("ucs-panel");
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

const EMPTY_ROW =
  '<tr class="empty-row"><td colspan="6">Results appear here once a search finishes.</td></tr>';


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

  drawBaseMap(ucsSvg);
  drawBaseMap(astarSvg);

  resultsBody.innerHTML = EMPTY_ROW;

  playbackStatus.textContent = "Ready";
}


// each box's list leaves out the city chosen in the other box
function fillCityList(box, excludeCity) {
  // desktop <input> fills its <datalist>; a touch <select> fills itself
  const list = box.list || box;
  const current = box.value;

  list.innerHTML = box.list
    ? ""
    : '<option value="" selected disabled hidden>Select City</option>';

  for (const city of CITY_NAMES) {
    if (city === excludeCity) {
      continue;
    }

    list.appendChild(new Option(city, city));
  }

  // rebuilding a <select> drops its selection, so put it back
  if (!box.list && current && current !== excludeCity) {
    box.value = current;
  }
}

function refreshCityLists() {
  fillCityList(startSelect, findCity(goalSelect));
  fillCityList(goalSelect, findCity(startSelect));
}

refreshCityLists();

resultsBody.innerHTML = EMPTY_ROW;

drawBaseMap(ucsSvg);
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

  const runUcs =
    mode === "both" ||
    mode === "ucs";

  const runAstar =
    mode === "both" ||
    mode === "astar";

  ucsPanel.hidden =
    !runUcs;

  astarPanel.hidden =
    !runAstar;

  statusEl.textContent =
    `Searching from ${start} to ${goal}...`;

  resultsBody.innerHTML =
    EMPTY_ROW;

  if (runUcs) {
    drawBaseMap(
      ucsSvg
    );
  }

  if (runAstar) {
    drawBaseMap(
      astarSvg
    );

    drawScentField(
      astarSvg,
      goal
    );
  }

  const ucsResult =
    runUcs
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

  if (runUcs) {
    animations.push(
      animateExpansion(
        ucsSvg,
        ucsResult.expansionOrder,
        ucsResult.path,
        ucsResult.cameFrom,
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

  resultsBody.innerHTML =
    "";

  if (runUcs) {
    renderRow(
      "Uniform-Cost Search (blind)",
      ucsResult
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

  if (runUcs) {
    summaryParts.push(
      `UCS expanded ${ucsResult.nodesExpanded} nodes`
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
    // nothing running: start (or replay) the search
    if (!isRunning) {
      runComparison();

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

    // full screen keeps its locked algorithm through a reset
    if (lockOpt.isConnected) lockOpt.selected = true;

    syncEvidence();

    refreshCityLists();

    ucsPanel.hidden = false;
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



// "input" fires for both typing and picking (datalist or select)
// only refill the other box's list, so the open list under the cursor doesn't flicker
function onCityInput(box, other) {
  fillCityList(other, findCity(box));

  // half-typed name: clear quietly instead of flashing the "select a city" error
  if (box.value.trim() && !findCity(box)) {
    stopRun();

    statusEl.textContent = "";

    return;
  }

  runComparison();
}

startSelect.addEventListener(
  "input",
  () => onCityInput(startSelect, goalSelect)
);

goalSelect.addEventListener(
  "input",
  () => onCityInput(goalSelect, startSelect)
);

modeSelect.addEventListener(
  "change",
  runComparison
);

// the evidence is about the A* heuristic, so only show it when A* is picked
const evidenceEl = document.querySelector(".evidence");

function syncEvidence() {
  evidenceEl.hidden = !["astar", "both"].includes(modeSelect.value);
}

modeSelect.addEventListener("change", syncEvidence);

document.getElementById("swapBtn").addEventListener("click", () => {
  const start = startSelect.value;
  const goal = goalSelect.value;

  // touch <select>s each exclude the other's city, so clear both and refill before swapping
  startSelect.value = "";
  goalSelect.value = "";
  refreshCityLists();

  startSelect.value = goal;
  goalSelect.value = start;
  refreshCityLists();

  rerunIfReady();
});


// Full-screen map: borrow the real controls section so all existing listeners keep working.
const controlsEl = document.querySelector(".controls");
const controlsHome = controlsEl.nextElementSibling;
const resultsEl = document.querySelector(".results");
// anchor after the evidence box: both boxes leave together, so neither can be the other's anchor
const resultsHome = evidenceEl.nextElementSibling;
// one column so the comparison table stacks under the controls box
const fsDock = document.createElement("div");
fsDock.className = "fs-dock";
// shares the panel's mode value so runComparison reads it like a normal choice
const lockOpt = new Option("Exit Fullscreen to Select");
let modeBeforeFullscreen = "";

function rerunIfReady() {
  if (findCity(startSelect) && findCity(goalSelect)) runComparison();
}

function exitFullscreen() {
  const open = document.querySelector(".map-panel.is-fullscreen");
  if (!open) return;
  open.classList.remove("is-fullscreen");
  document.body.classList.remove("has-fullscreen");
  controlsHome.before(controlsEl);
  resultsHome.before(resultsEl, evidenceEl);
  fsDock.remove();
  lockOpt.remove();
  modeSelect.value = modeBeforeFullscreen;
  modeSelect.disabled = false;
  modeSelect.parentElement.title = "";
  syncEvidence();
  rerunIfReady();
}

document.querySelectorAll(".fullscreen-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const panel = btn.closest(".map-panel");
    const wasOpen = panel.classList.contains("is-fullscreen");
    exitFullscreen();
    if (wasOpen) return;
    panel.classList.add("is-fullscreen");
    document.body.classList.add("has-fullscreen");
    fsDock.append(controlsEl, resultsEl, evidenceEl);
    panel.append(fsDock);
    modeBeforeFullscreen = modeSelect.value;
    lockOpt.value = panel === ucsPanel ? "ucs" : "astar";
    modeSelect.append(lockOpt);
    lockOpt.selected = true;
    modeSelect.disabled = true;
    // on the wrapping label: hover on a disabled select is unreliable across browsers
    modeSelect.parentElement.title =
      `Currently on ${modeSelect.querySelector(`option[value="${lockOpt.value}"]`).text}`;
    // locked mode is "ucs" or "astar", so the evidence shows only on the A* map
    syncEvidence();
    rerunIfReady();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") exitFullscreen();
});
