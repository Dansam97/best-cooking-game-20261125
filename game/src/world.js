// The kitchen itself: state and rules, with no drawing and no DOM. One step
// advances the shift by a fixed slice of time and answers with the events
// that happened in it, so the shell can play the matching sounds.

import { CHEF, CHOPS_NEEDED, FIELD, GRILL, MAX_STRIKES, ORDERS, RECIPES, SHIFT_SECONDS, STATIONS } from './config.js';

export const EVT_PICKUP = 1;
export const EVT_PLACE = 2;
export const EVT_CHOP = 4;
export const EVT_COOKED = 8;
export const EVT_SERVE = 16;
export const EVT_EXPIRE = 32;
export const EVT_BURN = 64;
export const EVT_TRASH = 128;
export const EVT_ERROR = 256;

/** Items a bin hands out raw and the board can chop. */
const CHOPPABLE = { lettuce: 'lettuceChopped', tomato: 'tomatoChopped' };

/** Centre of the grill station, where its steam rises from. */
const GRILL_X = 1208;

function samePlate(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((item, index) => item === sortedB[index]);
}

/** The recipe a plate's contents match exactly, or null. */
export function recipeFor(plate) {
  for (const recipe of RECIPES) if (samePlate(plate, recipe.items)) return recipe;
  return null;
}

export function createWorld(random) {
  const state = {
    phase: 'title', // title | play | over
    overReason: '',
    elapsed: 0,
    timeLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    strikes: 0,
    combo: 0,
    bestCombo: 0,
    chef: { x: 640, y: 520, dirX: 0, dirY: -1, carry: null, walk: 0 },
    board: { item: null, chops: 0 },
    grill: { item: null, heat: 0 },
    plate: [],
    orders: [],
    popups: [],
    steam: [],
    spawnIn: ORDERS.firstDelay,
    nextOrderId: 1,
    flash: '',
    flashT: 0,
  };

  function stationAt(x, y, reach) {
    let best = null;
    let bestDist = Infinity;
    for (const station of STATIONS) {
      const cx = Math.min(station.x + station.width, Math.max(station.x, x));
      const cy = Math.min(station.y + station.height, Math.max(station.y, y));
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < reach && dist < bestDist) {
        best = station;
        bestDist = dist;
      }
    }
    return best;
  }

  function popup(x, y, text, colour) {
    state.popups.push({ x, y, text, colour, t: 0 });
  }

  function spawnOrder(recipe) {
    const span = ORDERS.patienceStart - ORDERS.patienceEnd;
    const heat = Math.min(1, state.elapsed / SHIFT_SECONDS);
    const patience = ORDERS.patienceStart - span * heat;
    state.orders.push({ id: state.nextOrderId, recipe, patience, patienceMax: patience });
    state.nextOrderId += 1;
  }

  function chooseRecipe() {
    // Early tickets stay simple; the full menu unlocks as the shift warms up.
    const unlocked = state.elapsed < 25 ? 2 : RECIPES.length;
    return RECIPES[random.int(0, unlocked - 1)];
  }

  function serveAt(station) {
    const carry = state.chef.carry;
    if (!carry || !carry.plate) return EVT_ERROR;
    const index = state.orders.findIndex((order) => samePlate(carry.plate, order.recipe.items));
    if (index === -1) {
      popup(station.x + station.width / 2, station.y - 8, 'No ticket matches!', '#d23b2e');
      return EVT_ERROR;
    }
    const [order] = state.orders.splice(index, 1);
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const tip = Math.round(ORDERS.tipMax * (order.patience / order.patienceMax));
    const earned = order.recipe.price + tip + Math.min(5, state.combo - 1);
    state.coins += earned;
    state.served += 1;
    state.chef.carry = null;
    popup(station.x + station.width / 2, station.y - 10, `+$${earned}`, '#3f9e4d');
    if (state.combo > 1) popup(state.chef.x, state.chef.y - 34, `Combo x${state.combo}`, '#e4572e');
    return EVT_SERVE;
  }

  function interact() {
    const chef = state.chef;
    const station = stationAt(chef.x, chef.y, CHEF.reach);
    if (!station) return 0;
    const cx = station.x + station.width / 2;
    if (station.kind === 'bin') {
      if (chef.carry) return EVT_ERROR;
      chef.carry = { item: station.item };
      return EVT_PICKUP;
    }
    if (station.kind === 'board') {
      if (chef.carry && CHOPPABLE[chef.carry.item] && !state.board.item) {
        state.board.item = chef.carry.item;
        state.board.chops = 0;
        chef.carry = null;
        return EVT_PLACE;
      }
      if (!chef.carry && state.board.item) {
        if (state.board.chops >= CHOPS_NEEDED) {
          chef.carry = { item: CHOPPABLE[state.board.item] };
          state.board.item = null;
          state.board.chops = 0;
          return EVT_PICKUP;
        }
        state.board.chops += 1;
        return EVT_CHOP;
      }
      return EVT_ERROR;
    }
    if (station.kind === 'grill') {
      if (chef.carry && chef.carry.item === 'pattyRaw' && !state.grill.item) {
        state.grill.item = 'pattyRaw';
        state.grill.heat = 0;
        chef.carry = null;
        return EVT_PLACE;
      }
      if (!chef.carry && state.grill.item) {
        const done = state.grill.heat >= GRILL.burntAt ? 'pattyBurnt' : state.grill.heat >= GRILL.cookAt ? 'pattyCooked' : 'pattyRaw';
        chef.carry = { item: done };
        state.grill.item = null;
        state.grill.heat = 0;
        return EVT_PICKUP;
      }
      return EVT_ERROR;
    }
    if (station.kind === 'plate') {
      if (chef.carry && chef.carry.item) {
        state.plate.push(chef.carry.item);
        chef.carry = null;
        popup(cx, station.y - 8, 'Plated', '#8a5a33');
        return EVT_PLACE;
      }
      if (!chef.carry && state.plate.length > 0) {
        chef.carry = { plate: [...state.plate] };
        state.plate = [];
        return EVT_PICKUP;
      }
      return EVT_ERROR;
    }
    if (station.kind === 'hatch') return serveAt(station);
    if (station.kind === 'trash') {
      if (!chef.carry) return EVT_ERROR;
      chef.carry = null;
      popup(cx, station.y - 8, 'Tossed', '#6e777f');
      return EVT_TRASH;
    }
    return 0;
  }

  function moveChef(dt, ctl) {
    const chef = state.chef;
    let dx = ctl.dx;
    let dy = ctl.dy;
    if (ctl.target) {
      const tx = ctl.target.x - chef.x;
      const ty = ctl.target.y - chef.y;
      const dist = Math.hypot(tx, ty);
      if (dist > 6) {
        dx = tx / dist;
        dy = ty / dist;
      } else {
        ctl.target = null;
      }
    }
    const len = Math.hypot(dx, dy);
    if (len > 0.01) {
      dx /= Math.max(1, len);
      dy /= Math.max(1, len);
      chef.dirX = dx;
      chef.dirY = dy;
      chef.x += dx * CHEF.speed * dt;
      chef.y += dy * CHEF.speed * dt;
      chef.walk += dt * 11;
      // Counters are solid: slide out of any station rectangle the chef entered.
      for (const station of STATIONS) {
        const inX = chef.x > station.x - CHEF.radius && chef.x < station.x + station.width + CHEF.radius;
        const inY = chef.y > station.y - CHEF.radius && chef.y < station.y + station.height + CHEF.radius;
        if (inX && inY) {
          const left = chef.x - (station.x - CHEF.radius);
          const right = station.x + station.width + CHEF.radius - chef.x;
          const up = chef.y - (station.y - CHEF.radius);
          const down = station.y + station.height + CHEF.radius - chef.y;
          const min = Math.min(left, right, up, down);
          if (min === left) chef.x = station.x - CHEF.radius;
          else if (min === right) chef.x = station.x + station.width + CHEF.radius;
          else if (min === up) chef.y = station.y - CHEF.radius;
          else chef.y = station.y + station.height + CHEF.radius;
        }
      }
      chef.x = Math.min(FIELD.width - CHEF.radius, Math.max(CHEF.radius, chef.x));
      chef.y = Math.min(FIELD.height - CHEF.radius, Math.max(120 + CHEF.radius, chef.y));
    }
  }

  function step(dt, ctl) {
    let events = 0;
    if (state.phase !== 'play') return events;
    state.elapsed += dt;
    state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
    moveChef(dt, ctl);
    if (ctl.interact) events |= interact();

    // The grill cooks whether anyone watches it or not.
    if (state.grill.item) {
      const before = state.grill.heat;
      state.grill.heat += dt;
      if (before < GRILL.cookAt && state.grill.heat >= GRILL.cookAt) events |= EVT_COOKED;
      if (before < GRILL.burntAt && state.grill.heat >= GRILL.burntAt) events |= EVT_BURN;
      if (random.next() < 0.35) {
        state.steam.push({ x: GRILL_X + random.range(-22, 22), y: 196, t: 0, drift: random.range(-6, 6) });
      }
    }
    state.steam = state.steam.filter((puff) => {
      puff.t += dt;
      puff.y -= 26 * dt;
      puff.x += puff.drift * dt;
      return puff.t < 0.9;
    });

    // Tickets arrive on their own schedule and burn down on the board.
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      if (state.orders.length < ORDERS.maxActive) spawnOrder(chooseRecipe());
      const gap = ORDERS.gapStart + (ORDERS.gapEnd - ORDERS.gapStart) * Math.min(1, state.elapsed / SHIFT_SECONDS);
      state.spawnIn = gap * random.range(0.85, 1.15);
    }
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.patience -= dt;
      if (order.patience <= 0) {
        state.orders.splice(index, 1);
        state.strikes += 1;
        state.combo = 0;
        events |= EVT_EXPIRE;
        popup(120 + index * 268, 118, 'Ticket expired!', '#d23b2e');
      }
    }
    state.popups = state.popups.filter((note) => {
      note.t += dt;
      note.y -= 22 * dt;
      return note.t < 1.15;
    });
    if (state.flashT > 0) state.flashT -= dt;

    if (state.strikes >= MAX_STRIKES) {
      state.phase = 'over';
      state.overReason = 'Three tickets expired. The dining room walks out.';
    } else if (state.timeLeft <= 0) {
      state.phase = 'over';
      state.overReason = 'Shift over. The kitchen goes quiet.';
    }
    return events;
  }

  return {
    state,
    step,
    /** Begin a fresh shift from the title or the game-over screen. */
    start() {
      state.phase = 'play';
      state.elapsed = 0;
      state.timeLeft = SHIFT_SECONDS;
      state.coins = 0;
      state.served = 0;
      state.strikes = 0;
      state.combo = 0;
      state.bestCombo = 0;
      state.chef = { x: 640, y: 520, dirX: 0, dirY: -1, carry: null, walk: 0 };
      state.board = { item: null, chops: 0 };
      state.grill = { item: null, heat: 0 };
      state.plate = [];
      state.orders = [];
      state.popups = [];
      state.steam = [];
      state.spawnIn = ORDERS.firstDelay;
      state.nextOrderId = 1;
    },
    /** Staging hooks for the screenshot scenes: same state, set by hand. */
    stage: {
      order(recipe) {
        spawnOrder(recipe);
      },
      chefAt(x, y, carry) {
        state.chef.x = x;
        state.chef.y = y;
        state.chef.carry = carry;
      },
      plate(items) {
        state.plate = [...items];
      },
      grill(item, heat) {
        state.grill.item = item;
        state.grill.heat = heat;
      },
      board(item, chops) {
        state.board.item = item;
        state.board.chops = chops;
      },
      popup(x, y, text, colour) {
        popup(x, y, text, colour);
      },
      set(patch) {
        Object.assign(state, patch);
      },
    },
  };
}
