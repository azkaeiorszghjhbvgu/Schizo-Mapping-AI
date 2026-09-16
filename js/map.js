// SVG rendering for the Romania map.

const SVG_NS = "http://www.w3.org/2000/svg";

function el(tag, attrs) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

function drawBaseMap(svg) {
  svg.innerHTML = "";
  svg.setAttribute("viewBox", "60 250 530 350");

  // edges
  for (const [a, b] of EDGES) {
    const [x1, y1] = CITY_COORDS[a];
    const [x2, y2] = CITY_COORDS[b];
    svg.appendChild(el("line", {
      x1, y1, x2, y2, class: "edge",
    }));
  }

  // nodes + labels
  for (const city of CITY_NAMES) {
    const [x, y] = CITY_COORDS[city];
    const g = el("g", { class: "city-group", "data-city": city });
    g.appendChild(el("circle", { cx: x, cy: y, r: 7, class: "node", "data-city": city }));
    const label = el("text", { x: x + 9, y: y + 4, class: "node-label" });
    label.textContent = city;
    g.appendChild(label);
    svg.appendChild(g);
  }
}

function setNodeState(svg, city, stateClass) {
  const node = svg.querySelector(`circle.node[data-city="${city}"]`);
  if (node) node.classList.add(stateClass);
}

function highlightPathEdges(svg, path) {
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    svg.querySelectorAll("line.edge").forEach((line) => {
      const x1 = +line.getAttribute("x1"), y1 = +line.getAttribute("y1");
      const x2 = +line.getAttribute("x2"), y2 = +line.getAttribute("y2");
      const [ax, ay] = CITY_COORDS[a], [bx, by] = CITY_COORDS[b];
      const matchesForward = x1 === ax && y1 === ay && x2 === bx && y2 === by;
      const matchesBackward = x1 === bx && y1 === by && x2 === ax && y2 === ay;
      if (matchesForward || matchesBackward) line.classList.add("edge-path");
    });
  }
}
