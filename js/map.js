
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

  icon.appendChild(title);
  icon.appendChild(inner);

  return icon;
}

function drawBaseMap(svg) {
  svg.innerHTML = "";

  svg.setAttribute(
    "viewBox",
    "45 250 560 350"
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

// Fruit fly scent plume for the A* map: samples the real heuristic's scentStrengthAt()
// on a grid, so the cloud is the formula itself, not a hand-drawn shape.
const SCENT_CELL = 12;

function drawScentField(svg, goal) {
  const [vx, vy, vw, vh] =
    svg.getAttribute("viewBox").split(" ").map(Number);

  const filterId = `${svg.id}-scent-blur`;

  const defs = el("defs");
  const filter = el("filter", { id: filterId });
  filter.appendChild(el("feGaussianBlur", { stdDeviation: SCENT_CELL * 0.6 }));
  defs.appendChild(filter);

  // .map has overflow: visible, so keep the cloud inside the view or it spills over the panel;
  // a blurred mask fades it out at the edges instead of cutting it off in a hard rectangle
  const maskId = `${svg.id}-scent-mask`;
  const featherId = `${svg.id}-scent-feather`;
  const feather = el("filter", { id: featherId });
  feather.appendChild(el("feGaussianBlur", { stdDeviation: 8 }));
  defs.appendChild(feather);

  const mask = el("mask", {
    id: maskId,
    maskUnits: "userSpaceOnUse",
    x: vx,
    y: vy,
    width: vw,
    height: vh,
  });
  const inset = 12;
  mask.appendChild(
    el("rect", {
      x: vx + inset,
      y: vy + inset,
      width: vw - inset * 2,
      height: vh - inset * 2,
      fill: "#fff",
      filter: `url(#${featherId})`,
    })
  );
  defs.appendChild(mask);

  const field = el("g", { class: "scent-field", filter: `url(#${filterId})` });

  // overshoot the view so the blur doesn't fade the map edges
  const pad = SCENT_CELL * 3;

  for (let x = vx - pad; x < vx + vw + pad; x += SCENT_CELL) {
    for (let y = vy - pad; y < vy + vh + pad; y += SCENT_CELL) {
      const s = scentStrengthAt(x + SCENT_CELL / 2, y + SCENT_CELL / 2, goal);

      // skip invisible cells to keep the DOM small
      if (s < 0.03) continue;

      field.appendChild(
        el("rect", {
          x,
          y,
          width: SCENT_CELL,
          height: SCENT_CELL,
          // squared only for contrast; exact values are in each city's tooltip
          "fill-opacity": (s * s * 0.3).toFixed(3),
        })
      );
    }
  }

  const masked = el("g", { mask: `url(#${maskId})` });
  masked.appendChild(field);

  // under the roads and cities
  svg.prepend(defs, masked);

  const wind = el("g", {
    class: "wind-indicator",
    transform: `translate(${vx + 12}, ${vy + 18})`,
  });
  wind.appendChild(el("line", { x1: 0, y1: 0, x2: 44, y2: 0 }));
  wind.appendChild(el("path", { d: "M44 -5 L54 0 L44 5 Z" }));
  // beside the arrow, not under it, so it stays clear of Drobeta's label
  const label = el("text", { x: 62, y: 4 });
  label.textContent = "wind / scent plume";
  wind.appendChild(label);
  svg.appendChild(wind);

  for (const city of CITY_NAMES) {
    const title = svg.querySelector(`.city-icon[data-city="${city}"] title`);
    if (title) {
      title.textContent =
        `${city}: scent ${scentStrength(city, goal).toFixed(2)}`;
    }
  }
}
