
const SVG_NS = "http://www.w3.org/2000/svg";

function el(tag, attrs = {}) {
  const e = document.createElementNS(SVG_NS, tag);

  for (const k in attrs) {
    e.setAttribute(k, attrs[k]);
  }

  return e;
}

function createCityIcon(city, x, y) {
  const icon = el("g", {
    class: "city-icon",
    "data-city": city,
    transform: `translate(${x}, ${y})`
  });

  const inner = el("g", {
    class: "city-icon-inner"
  });

  inner.appendChild(
    el("circle", {
      cx: 0,
      cy: 0,
      r: 12,
      class: "city-hit-area"
    })
  );

  inner.appendChild(
    el("circle", {
      cx: 0,
      cy: 0,
      r: 10,
      class: "city-backdrop"
    })
  );

  inner.appendChild(
    el("path", {
      d: "M-8 -4 L-5 -7 L-2 -4 V5 H-8 Z",
      class: "city-shape"
    })
  );

  inner.appendChild(
    el("path", {
      d: "M2 -5 L5 -8 L8 -5 V5 H2 Z",
      class: "city-shape"
    })
  );

  inner.appendChild(
    el("line", {
      x1: -9,
      y1: 6,
      x2: 9,
      y2: 6,
      class: "city-ground"
    })
  );

  const title = el("title");
  title.textContent = city;

  icon.appendChild(inner);

  return icon;
}

function drawBaseMap(svg) {
  svg.innerHTML = "";

  svg.setAttribute(
    "viewBox",
    "60 250 530 350"
  );

  for (const [a, b] of EDGES) {
    const [x1, y1] = CITY_COORDS[a];
    const [x2, y2] = CITY_COORDS[b];

    svg.appendChild(
      el("line", {
        x1,
        y1,
        x2,
        y2,
        class: "edge"
      })
    );
  }

  for (const city of CITY_NAMES) {
    const [x, y] = CITY_COORDS[city];

    const group = el("g", {
      class: "city-group",
      "data-city": city
    });

    const icon =
      createCityIcon(
        city,
        x,
        y
      );

    group.appendChild(icon);

    const label = el("text", {
      x: x + 11,
      y: y + 4,
      class: "node-label",
      "data-city": city
    });

    label.textContent = city;

    group.appendChild(label);

    svg.appendChild(group);
  }
}

function setNodeState(
  svg,
  city,
  stateClass
) {
  const node = svg.querySelector(
    `.city-icon[data-city="${city}"]`
  );

  if (node) {
    node.classList.add(
      stateClass
    );
  }
}

function clearNodeStates(svg) {
  svg
    .querySelectorAll(".city-icon")
    .forEach((node) => {
      node.classList.remove(
        "start",
        "goal",
        "visited",
        "current",
        "frontier",
        "node-start",
        "node-goal",
        "node-visited",
        "node-current",
        "node-frontier"
      );
    });

  svg
    .querySelectorAll("line.edge")
    .forEach((line) => {
      line.classList.remove(
        "edge-path"
      );
    });
}


function highlightPathEdges(
  svg,
  path
) {
  if (
    !path ||
    path.length < 2
  ) {
    return;
  }

  for (
    let i = 0;
    i < path.length - 1;
    i++
  ) {
    const a = path[i];
    const b = path[i + 1];

    svg
      .querySelectorAll("line.edge")
      .forEach((line) => {
        const x1 =
          +line.getAttribute("x1");

        const y1 =
          +line.getAttribute("y1");

        const x2 =
          +line.getAttribute("x2");

        const y2 =
          +line.getAttribute("y2");

        const [ax, ay] =
          CITY_COORDS[a];

        const [bx, by] =
          CITY_COORDS[b];

        const matchesForward =
          x1 === ax &&
          y1 === ay &&
          x2 === bx &&
          y2 === by;

        const matchesBackward =
          x1 === bx &&
          y1 === by &&
          x2 === ax &&
          y2 === ay;

        if (
          matchesForward ||
          matchesBackward
        ) {
          line.classList.add(
            "edge-path"
          );
        }
      });
  }
}

function highlightPathNodes(
  svg,
  path
) {
  if (!path) {
    return;
  }

  for (const city of path) {
    const node = svg.querySelector(
      `.city-icon[data-city="${city}"]`
    );

    if (node) {
      node.classList.add(
        "path-node"
      );
    }
  }
}

function findEdge(
  svg,
  a,
  b
) {
  const [ax, ay] =
    CITY_COORDS[a];

  const [bx, by] =
    CITY_COORDS[b];

  const lines =
    svg.querySelectorAll(
      "line.edge"
    );

  for (const line of lines) {
    const x1 =
      +line.getAttribute("x1");

    const y1 =
      +line.getAttribute("y1");

    const x2 =
      +line.getAttribute("x2");

    const y2 =
      +line.getAttribute("y2");

    const forward =
      x1 === ax &&
      y1 === ay &&
      x2 === bx &&
      y2 === by;

    const backward =
      x1 === bx &&
      y1 === by &&
      x2 === ax &&
      y2 === ay;

    if (
      forward ||
      backward
    ) {
      return line;
    }
  }

  return null;
}

function animateExplorationEdge(
  svg,
  fromCity,
  toCity
) {
  const edge =
    findEdge(
      svg,
      fromCity,
      toCity
    );

  if (!edge) {
    return;
  }

  edge.classList.add(
    "edge-explored"
  );
 
  edge.style.animation = "none";

  void edge.getBoundingClientRect();

  edge.style.animation = "";
}