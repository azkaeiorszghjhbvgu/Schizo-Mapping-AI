const startSelect = document.getElementById("start-city");
const goalSelect = document.getElementById("goal-city");
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


// Our own dropdown instead of <datalist>: iOS Safari shows no list for datalists.
// Shows cities containing the typed letters, minus the city chosen in the other box.
function setupCityCombo(input, otherInput) {
  const list = document.getElementById(
    input.getAttribute("aria-controls")
  );

  let matches = [];
  let active = -1;

  function close() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    active = -1;
  }

  function render() {
    const typed = input.value.trim().toLowerCase();
    const exclude = findCity(otherInput);

    // an exact match still lists everything, so the box works as a plain picker too
    matches = CITY_NAMES.filter(
      (city) =>
        city !== exclude &&
        (findCity(input) || city.toLowerCase().includes(typed))
    );

    active = -1;
    list.innerHTML = "";

    matches.forEach((city, i) => {
      const li = document.createElement("li");

      li.id = `${list.id}-${i}`;
      li.textContent = city;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");

      list.appendChild(li);
    });

    list.hidden = matches.length === 0;
    input.setAttribute("aria-expanded", String(!list.hidden));
  }

  function highlight(i) {
    if (active >= 0) {
      list.children[active].setAttribute("aria-selected", "false");
    }

    active = i;

    const li = list.children[active];

    li.setAttribute("aria-selected", "true");
    li.scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", li.id);
  }

  function pick(city) {
    input.value = city;
    close();
    runComparison();
  }

  input.addEventListener("focus", render);
  input.addEventListener("click", render);
  input.addEventListener("blur", close);

  input.addEventListener("input", () => {
    render();

    if (findCity(input)) {
      runComparison();
    } else {
      // half-typed name: clear quietly instead of flashing the "select a city" error
      stopRun();
      statusEl.textContent = "";
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();

      if (list.hidden) {
        render();
      }

      if (matches.length) {
        const step = e.key === "ArrowDown" ? 1 : -1;

        highlight((active + step + matches.length) % matches.length);
      }
    } else if (e.key === "Enter" && !list.hidden && matches.length) {
      e.preventDefault();
      pick(
        active >= 0
          ? matches[active]
          : findCity(input) || matches[0]
      );
    } else if (e.key === "Escape") {
      close();
    }
  });

  // mousedown, not click: keeps focus in the input so blur doesn't close the list first.
  // Taps on phones fire it too, but not when the finger scrolls the list.
  list.addEventListener("mousedown", (e) => {
    e.preventDefault();

    const li = e.target.closest("li");

    if (li) {
      pick(li.textContent);
    }
  });

  // the list sits inside a <label>, whose click would refocus the input and reopen it
  list.addEventListener("click", (e) => e.preventDefault());
}

setupCityCombo(startSelect, goalSelect);
setupCityCombo(goalSelect, startSelect);

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



modeSelect.addEventListener(
  "change",
  runComparison
);
