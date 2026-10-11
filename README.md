# Romania Map Pathfinding

- **Web:** https://azkaeiorszghjhbvgu.github.io/Schizo-Mapping-AI/

## Algorithms

| | Blind search | Heuristic search |
|---|---|---|
| Algorithm | Uniform-Cost Search (Dijkstra) | A* with the Fruit Fly Scent heuristic |
| Expands by | `g(n)`: path cost so far | `f(n) = g(n) + h(n)` |
| Optimal | Yes | Yes (admissible heuristic) |

Both are implemented in [js/search.js](js/search.js) and share the same loop, so the only difference in the comparison is the heuristic.

### Custom heuristic: Fruit Fly Scent & Wind

Inspired by how a fruit fly finds food: it follows a scent plume that the wind carries downstream of the source. Cities inside the plume "smell" the goal more strongly and get a smaller estimate, so A* is drawn toward them.

```
h(n)  = straightLine(n, goal) × scent(n, goal)
scent = exp(-(r - x) / L)
```

- `r`: straight-line distance from `n` to the goal (km)
- `x`: how far `n` lies downwind of the goal (wind blows east)
- `L = 300 km`: scent diffusion length

**Why it stays admissible:** `x ≤ r` always, so `scent ≤ 1`, so `h(n) ≤ straightLine(n, goal)`. The straight-line distance is scaled from map pixels to km using the *smallest* pixel-to-km ratio from the textbook's straight-line distances to Bucharest, so it never overestimates the real road distance. A* therefore still returns the optimal path. See [js/data.js](js/data.js).

## Metrics compared

For every search the app reports:

- **Path cost** (km)
- **Nodes expanded** (time complexity)
- **Max frontier size** (space complexity)
- **Runtime** (ms)

The app also runs all 380 start/goal pairs and shows the average nodes expanded for UCS, plain straight-line A*, and Fruit Fly A*, split by whether the start is inside or outside the scent plume ([js/evidence.js](js/evidence.js)).

## Run locally

No build step. Clone the repo and open `index.html` in a browser. You need an internet connection for the formulas to render, since KaTeX loads from a CDN.