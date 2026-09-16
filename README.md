# Romania Map Pathfinding

## Assignment Brief

- **Problem**: The Romania-Map Pathfinding problem.
  - Implement 1 blind search and 1 custom heuristic search.
  - Any arbitrary cities can be selected as the start and goal states.
  - Compare the runtime, space, and path cost between the blind and heuristic searches.
- **Grading criteria**: Creativity, Completeness, and Presentation skills.
- **Due date**: 9 AM Tuesday, October 13, 2026.
- **Things to turn in**:
  - Web App URL (must be deployed onto a host computer) — _TODO: add deployed URL here_
  - A link to the GitHub repository, provided within the web app — see footer of `index.html`
  - Presentation clip link on YouTube (approx. 10–15 minutes) — _TODO: add video link here_

## Algorithms implemented

| | Blind search | Heuristic search |
|---|---|---|
| Algorithm | Uniform-Cost Search (UCS / Dijkstra's) | A* Search |
| Informed by | Accumulated path cost only | Path cost + straight-line distance to goal |
| Optimal (cost-wise) | Yes | Yes (admissible heuristic) |
| Metrics compared | Path cost, nodes expanded, max frontier size, runtime | Same |

## Run locally

Open `index.html` directly in a browser, or serve the folder with any static server, e.g.:

```
python -m http.server 8080
```

then visit http://localhost:8080.

## Actual Deployed

https://schizo-mapping.netlify.app