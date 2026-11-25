# best-cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Dansam97/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Dansam97/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle & Serve** — a lunch-rush cooking game. You are the whole kitchen: tickets land on the order board, and you run the chef between the ingredient bins, the chopping board, the grill and the plating counter to build each dish exactly as ordered and serve it at the hatch before its patience bar runs dry. Patties burn if you forget them, expired tickets cost you a strike, and three strikes close the kitchen. Combos and tips reward a cook who plans a route instead of running in circles.

Play with WASD or the arrow keys (or click to walk); SPACE uses the station in front of you. The game is plain static files under `game/` — no build step, no network, all art drawn in code and all sound synthesized live. `main.ts` hands the entry in: it copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored library.

## Run it

```sh
node serve.ts
# then open http://localhost:8123 in a desktop browser
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=p62m1pd8&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
