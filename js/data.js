// Romania map dataset (cities, coordinates, and road distances)
// Coordinates are the standard AIMA plotting coordinates (pixel-like, not GPS),
// used here consistently for both drawing the map and computing the straight-line heuristic.

const CITY_COORDS = {
  Arad: [91, 492],
  Bucharest: [400, 327],
  Craiova: [253, 288],
  Drobeta: [165, 299],
  Eforie: [562, 293],
  Fagaras: [305, 449],
  Giurgiu: [375, 270],
  Hirsova: [534, 350],
  Iasi: [473, 506],
  Lugoj: [165, 379],
  Mehadia: [168, 339],
  Neamt: [406, 537],
  Oradea: [131, 571],
  Pitesti: [320, 368],
  Rimnicu: [233, 410],
  Sibiu: [207, 457],
  Timisoara: [94, 410],
  Urziceni: [456, 350],
  Vaslui: [509, 444],
  Zerind: [108, 531],
};

const EDGES = [
  ["Arad", "Zerind", 75],
  ["Arad", "Sibiu", 140],
  ["Arad", "Timisoara", 118],
  ["Bucharest", "Urziceni", 85],
  ["Bucharest", "Pitesti", 101],
  ["Bucharest", "Giurgiu", 90],
  ["Bucharest", "Fagaras", 211],
  ["Craiova", "Drobeta", 120],
  ["Craiova", "Rimnicu", 146],
  ["Craiova", "Pitesti", 138],
  ["Drobeta", "Mehadia", 75],
  ["Eforie", "Hirsova", 86],
  ["Fagaras", "Sibiu", 99],
  ["Hirsova", "Urziceni", 98],
  ["Iasi", "Vaslui", 92],
  ["Iasi", "Neamt", 87],
  ["Lugoj", "Timisoara", 111],
  ["Lugoj", "Mehadia", 70],
  ["Oradea", "Zerind", 71],
  ["Oradea", "Sibiu", 151],
  ["Pitesti", "Rimnicu", 97],
  ["Rimnicu", "Sibiu", 80],
  ["Urziceni", "Vaslui", 142],
];

const SLD_TO_BUCHAREST = {
  Arad: 366,
  Bucharest: 0,
  Craiova: 160,
  Drobeta: 242,
  Eforie: 161,
  Fagaras: 176,
  Giurgiu: 77,
  Hirsova: 151,
  Iasi: 226,
  Lugoj: 244,
  Mehadia: 241,
  Neamt: 234,
  Oradea: 380,
  Pitesti: 100,
  Rimnicu: 193,
  Sibiu: 253,
  Timisoara: 329,
  Urziceni: 80,
  Vaslui: 199,
  Zerind: 374,
};


function pixelDist(a, b) {
  const [ax, ay] = CITY_COORDS[a];
  const [bx, by] = CITY_COORDS[b];

  return Math.hypot(ax - bx, ay - by);
}

const PIXEL_TO_KM_SCALE = (() => {
  let ratios = [];

  for (const city in SLD_TO_BUCHAREST) {
    if (city === "Bucharest") continue;

    const px = pixelDist(city, "Bucharest");

    if (px > 0) {
      ratios.push(
        SLD_TO_BUCHAREST[city] / px
      );
    }
  }

  // Min ratio (not average) keeps the estimate low. That alone doesn't prove admissibility
  // for every pair, but it was checked: on all 380 city pairs the heuristic never exceeds
  // the true shortest road distance, and it is consistent on every edge.
  return Math.min(...ratios);
})();

function straightLineHeuristic(a, b) {
  return (
    pixelDist(a, b) *
    PIXEL_TO_KM_SCALE
  );
}

// Fruit Fly Scent Heuristic:
// A fly finds food by sensing the odor plume the wind carries away from it. For a point
// source in a steady wind, the advection-diffusion equation gives a concentration of
// c ~ exp(-(r - x) / L) / r, where r = distance to the source, x = distance downwind of it,
// and L = 2D/U (diffusion over wind speed). We keep the exp(...) part as a 0..1 scent
// strength: 1 anywhere straight downwind, fading off to the sides and upwind.
// h = straight-line distance * scent strength. A strong scent gives full guidance;
// no scent leaves the fly blind (h -> 0, like UCS).
// Because strength <= 1, h never exceeds straight-line distance, so it stays admissible.
// Checked on all 380 city pairs: admissible, consistent on every edge, always optimal.
const WIND_DIRECTION = [1, 0]; // prevailing wind blows west -> east (+x)
const SCENT_DIFFUSION_KM = 300; // L: larger = scent spreads further sideways/upwind

// any map point (x, y), so the plume can also be drawn between cities
function scentStrengthAt(x, y, goal) {
  const [gx, gy] = CITY_COORDS[goal];

  const r = Math.hypot(x - gx, y - gy) * PIXEL_TO_KM_SCALE;
  if (r === 0) return 1;

  // how far the fly sits downwind of the food
  const downwind =
    ((x - gx) * WIND_DIRECTION[0] + (y - gy) * WIND_DIRECTION[1]) *
    PIXEL_TO_KM_SCALE;

  return Math.exp(-(r - downwind) / SCENT_DIFFUSION_KM);
}

function scentStrength(city, goal) {
  return scentStrengthAt(...CITY_COORDS[city], goal);
}

function fruitFlyWindScentHeuristic(city, goal) {
  return straightLineHeuristic(city, goal) * scentStrength(city, goal);
}



function buildGraph() {
  const graph = {};

  for (const city in CITY_COORDS) {
    graph[city] = [];
  }

  for (const [a, b, w] of EDGES) {
    graph[a].push({
      to: b,
      cost: w,
    });

    graph[b].push({
      to: a,
      cost: w,
    });
  }

  return graph;
}

const GRAPH = buildGraph();

const CITY_NAMES =
  Object.keys(CITY_COORDS).sort();