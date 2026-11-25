// The dining-room window: everything the player sees, drawn on one canvas in
// field coordinates. Food is drawn from paths, never images, so the game
// loads nothing and every screenshot is the game's own code rendering.

import { BOARD, CHEF, COLORS, FIELD, GRILL, ITEM_NAMES, MAX_STRIKES, RECIPES, STATIONS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, colour, align = 'left', weight = 700) {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px 'Trebuchet MS', 'Segoe UI', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

/** One ingredient, drawn at (x, y) inside a box of half-size r. */
export function drawItem(ctx, item, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (item === 'bun') {
    ctx.fillStyle = '#e0a558';
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r * 0.95, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#c9853e';
    ctx.fillRect(-r * 0.95, r * 0.25, r * 1.9, r * 0.34);
    ctx.fillStyle = '#ffe9bd';
    for (const [sx, sy] of [[-0.4, -0.3], [0.1, -0.5], [0.45, -0.2]]) {
      ctx.beginPath();
      ctx.ellipse(sx * r, sy * r, r * 0.13, r * 0.07, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'pattyRaw' || item === 'pattyCooked' || item === 'pattyBurnt') {
    ctx.fillStyle = item === 'pattyRaw' ? '#b06a5a' : item === 'pattyCooked' ? '#7a4526' : '#2e2320';
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (const [sx, sy] of [[-0.5, -0.15], [0.2, 0.2], [0.55, -0.25]]) {
      ctx.beginPath();
      ctx.arc(sx * r, sy * r, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'cheese') {
    ctx.fillStyle = '#f6b93b';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(r, r * 0.6);
    ctx.lineTo(0, -r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(190,120,20,0.55)';
    for (const [sx, sy, sr] of [[-0.25, 0.3, 0.16], [0.3, 0.35, 0.12], [0, -0.15, 0.1]]) {
      ctx.beginPath();
      ctx.arc(sx * r, sy * r, sr * r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item === 'lettuce' || item === 'lettuceChopped') {
    ctx.fillStyle = '#58b368';
    if (item === 'lettuce') {
      for (const [sx, sy] of [[-0.45, 0.1], [0, -0.25], [0.45, 0.1], [0, 0.3]]) {
        ctx.beginPath();
        ctx.arc(sx * r, sy * r, r * 0.52, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#7cc788';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (const sx of [-0.55, -0.18, 0.18, 0.55]) {
        roundRect(ctx, sx * r - r * 0.13, -r * 0.6, r * 0.26, r * 1.2, r * 0.1);
        ctx.fill();
      }
    }
  } else if (item === 'tomato' || item === 'tomatoChopped') {
    ctx.fillStyle = '#d8402e';
    if (item === 'tomato') {
      ctx.beginPath();
      ctx.arc(0, r * 0.12, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f9e4d';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.75);
      ctx.lineTo(r * 0.3, -r * 0.3);
      ctx.lineTo(-r * 0.3, -r * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.1, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (const [sx, sy] of [[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.35], [0.4, 0.35]]) {
        roundRect(ctx, sx * r - r * 0.3, sy * r - r * 0.3, r * 0.6, r * 0.6, r * 0.16);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/** A plate and everything stacked on it, drawn small enough for a ticket. */
function drawPlate(ctx, items, x, y, r) {
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.25, r * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9c2b2';
  ctx.lineWidth = 2;
  ctx.stroke();
  items.forEach((item, index) => {
    const angle = (index / Math.max(1, items.length)) * Math.PI * 2;
    const ox = items.length === 1 ? 0 : Math.cos(angle) * r * 0.45;
    const oy = items.length === 1 ? -r * 0.1 : Math.sin(angle) * r * 0.2 - r * 0.08;
    drawItem(ctx, item, x + ox, y + oy, r * 0.52);
  });
}

function drawTicket(ctx, order, x) {
  const w = 232;
  const y = 10;
  const h = 84;
  ctx.fillStyle = COLORS.paper;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = '#d8c9a3';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, order.recipe.name, x + 12, y + 17, 16, COLORS.ink);
  text(ctx, `$${order.recipe.price}`, x + w - 12, y + 17, 16, '#3f9e4d', 'right');
  order.recipe.items.forEach((item, index) => {
    drawItem(ctx, item, x + 24 + index * 40, y + 48, 13);
  });
  const frac = Math.max(0, order.patience / order.patienceMax);
  ctx.fillStyle = '#e5d9bd';
  roundRect(ctx, x + 10, y + h - 12, w - 20, 6, 3);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? COLORS.good : frac > 0.25 ? COLORS.warn : COLORS.bad;
  roundRect(ctx, x + 10, y + h - 12, (w - 20) * frac, 6, 3);
  ctx.fill();
}

function drawBoard(ctx, state) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(BOARD.x, BOARD.y, BOARD.width, BOARD.height);
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(0, BOARD.height - 4, BOARD.width, 4);
  state.orders.forEach((order, index) => drawTicket(ctx, order, 14 + index * 244));
  if (state.orders.length === 0) text(ctx, 'No tickets yet — breathe…', 24, 52, 18, '#e8d3ae');
  const hx = 1010;
  text(ctx, `$${state.coins}`, hx, 26, 26, '#ffd76a');
  const seconds = Math.ceil(state.timeLeft);
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  text(ctx, clock, 1266, 26, 26, seconds <= 20 ? COLORS.bad : '#fff7e6', 'right');
  for (let i = 0; i < MAX_STRIKES; i += 1) {
    ctx.fillStyle = i < state.strikes ? COLORS.bad : 'rgba(255,247,230,0.3)';
    ctx.beginPath();
    ctx.arc(hx + 16 + i * 30, 66, 10, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '✕', hx + 16 + i * 30, 67, 14, '#fff7e6', 'center');
  }
  if (state.combo > 1) text(ctx, `Combo x${state.combo}`, hx + 92, 26, 18, '#ffd76a');
  text(ctx, `Served ${state.served}`, 1266, 66, 15, '#e8d3ae', 'right');
}

function drawStation(ctx, station, state, active) {
  const { x, y, width: w, height: h } = station;
  ctx.fillStyle = COLORS.counter;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.fillStyle = station.kind === 'grill' || station.kind === 'hatch' ? COLORS.steel : COLORS.counterTop;
  roundRect(ctx, x + 5, y + 5, w - 10, h - 30, 6);
  ctx.fill();
  if (active) {
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = 3;
    roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 10);
    ctx.stroke();
  }
  text(ctx, station.label, x + w / 2, y + h - 13, 12, '#fff7e6', 'center');
  const cx = x + w / 2;
  const cy = y + (h - 25) / 2;
  if (station.kind === 'bin') {
    drawItem(ctx, station.item, cx, cy, 20);
  } else if (station.kind === 'board') {
    ctx.fillStyle = COLORS.boardTop;
    roundRect(ctx, x + 14, y + 12, w - 28, h - 48, 6);
    ctx.fill();
    if (state.board.item) {
      drawItem(ctx, state.board.item, cx, cy, 19);
      for (let i = 0; i < 3; i += 1) {
        ctx.fillStyle = i < state.board.chops ? COLORS.accent : 'rgba(43,28,18,0.25)';
        ctx.beginPath();
        ctx.arc(cx - 16 + i * 16, y + h - 38, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (station.kind === 'grill') {
    ctx.strokeStyle = COLORS.steelDark;
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + 14, y + 18 + i * 22);
      ctx.lineTo(x + w - 14, y + 18 + i * 22);
      ctx.stroke();
    }
    if (state.grill.item) {
      const heat = state.grill.heat;
      const item = heat >= GRILL.burntAt ? 'pattyBurnt' : heat >= GRILL.cookAt ? 'pattyCooked' : 'pattyRaw';
      drawItem(ctx, item, cx, cy, 21);
      const frac = Math.min(1, heat / GRILL.burntAt);
      ctx.fillStyle = 'rgba(43,28,18,0.35)';
      roundRect(ctx, x + 12, y + h - 40, w - 24, 7, 3);
      ctx.fill();
      ctx.fillStyle = heat >= GRILL.burntAt ? COLORS.bad : heat >= GRILL.cookAt ? COLORS.good : COLORS.warn;
      roundRect(ctx, x + 12, y + h - 40, (w - 24) * frac, 7, 3);
      ctx.fill();
    }
  } else if (station.kind === 'plate') {
    if (state.plate.length > 0) {
      drawPlate(ctx, state.plate, cx, cy + 2, 30);
    } else {
      ctx.strokeStyle = 'rgba(43,28,18,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 2, 38, 19, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (station.kind === 'hatch') {
    ctx.fillStyle = '#57493d';
    roundRect(ctx, x + 12, y + 12, w - 24, h - 52, 6);
    ctx.fill();
    // A service bell on the hatch counter: dome, button and base.
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(cx, cy + 6, 15, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(cx - 19, cy + 6, 38, 5);
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (station.kind === 'trash') {
    // A swing-top bin, drawn plain so it reads at any size.
    ctx.fillStyle = COLORS.steelDark;
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 12);
    ctx.lineTo(cx + 14, cy - 12);
    ctx.lineTo(cx + 10, cy + 18);
    ctx.lineTo(cx - 10, cy + 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.steel;
    ctx.fillRect(cx - 17, cy - 18, 34, 7);
  }
}

function drawChef(ctx, state) {
  const chef = state.chef;
  const bob = Math.sin(chef.walk) * 2;
  const x = chef.x;
  const y = chef.y + bob * 0.3;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(chef.x, chef.y + 18, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Coat, neckerchief, head and hat.
  ctx.fillStyle = '#f7f4ee';
  roundRect(ctx, x - 15, y - 6, 30, 26, 9);
  ctx.fill();
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 4);
  ctx.lineTo(x + 8, y - 4);
  ctx.lineTo(x, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f2c094';
  ctx.beginPath();
  ctx.arc(x, y - 16, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, x - 12, y - 30, 24, 9, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 30, 8, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(x + chef.dirX * 4 - 3.5, y - 16 + chef.dirY * 2, 1.6, 0, Math.PI * 2);
  ctx.arc(x + chef.dirX * 4 + 3.5, y - 16 + chef.dirY * 2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  if (chef.carry) {
    if (chef.carry.plate) drawPlate(ctx, chef.carry.plate, x, y - 48, 17);
    else drawItem(ctx, chef.carry.item, x, y - 46, 14);
  }
}

function drawOverlay(ctx, title, lines, foot) {
  ctx.fillStyle = 'rgba(30,18,10,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, title, FIELD.width / 2, 250, 64, '#ffd76a', 'center', 800);
  lines.forEach((line, index) => text(ctx, line, FIELD.width / 2, 330 + index * 34, 22, '#fff7e6', 'center', 500));
  if (foot) text(ctx, foot, FIELD.width / 2, 620, 20, '#e8d3ae', 'center', 600);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;

  function activeStation(state) {
    let best = null;
    let bestDist = Infinity;
    for (const station of STATIONS) {
      const cx = Math.min(station.x + station.width, Math.max(station.x, state.chef.x));
      const cy = Math.min(station.y + station.height, Math.max(station.y, state.chef.y));
      const dist = Math.hypot(state.chef.x - cx, state.chef.y - cy);
      if (dist < CHEF.reach && dist < bestDist) {
        best = station;
        bestDist = dist;
      }
    }
    return best;
  }

  return {
    draw(state, screen, best) {
      // Floor tiles.
      const tile = 64;
      for (let ty = 0; ty < FIELD.height / tile; ty += 1) {
        for (let tx = 0; tx < FIELD.width / tile; tx += 1) {
          ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
          ctx.fillRect(tx * tile, Math.max(BOARD.height, ty * tile), tile, tile);
        }
      }
      ctx.fillStyle = COLORS.floorA;
      ctx.fillRect(0, BOARD.height, FIELD.width, 20);
      const active = screen === SCREEN_PLAY ? activeStation(state) : null;
      for (const station of STATIONS) drawStation(ctx, station, state, station === active);
      // Steam over the grill.
      for (const puff of state.steam) {
        ctx.fillStyle = `rgba(255,255,255,${0.35 * (1 - puff.t)})`;
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, 5 + puff.t * 7, 0, Math.PI * 2);
        ctx.fill();
      }
      drawChef(ctx, state);
      drawBoard(ctx, state);
      for (const note of state.popups) {
        ctx.globalAlpha = Math.max(0, 1 - note.t / 1.15);
        text(ctx, note.text, note.x, note.y, 19, note.colour, 'center', 800);
        ctx.globalAlpha = 1;
      }
      if (active && screen === SCREEN_PLAY) {
        // The hint rides on a dark pill along the bottom edge, like a
        // subtitle: readable over any floor and never over a station label.
        const hint = 'SPACE: use ' + active.label.toLowerCase();
        ctx.font = "700 14px 'Trebuchet MS', 'Segoe UI', sans-serif";
        const pillWidth = ctx.measureText(hint).width + 22;
        const pillX = (FIELD.width - pillWidth) / 2;
        ctx.fillStyle = 'rgba(30,18,10,0.82)';
        roundRect(ctx, pillX, FIELD.height - 28, pillWidth, 24, 12);
        ctx.fill();
        text(ctx, hint, FIELD.width / 2, FIELD.height - 16, 14, '#fff7e6', 'center', 700);
      }
      if (screen === SCREEN_TITLE) {
        drawOverlay(ctx, 'SIZZLE & SERVE', [
          'The lunch rush is coming. You are the whole kitchen.',
          'Walk with WASD or the arrow keys (or click to walk).',
          'SPACE uses the station in front of you: take, chop, grill, plate, serve.',
          'Match each ticket exactly — a burnt patty only feeds the trash.',
        ], 'Press ENTER to start the shift');
      } else if (screen === SCREEN_PAUSED) {
        drawOverlay(ctx, 'PAUSED', ['The tickets keep for no one. Well, just this once.'], 'Press P or ENTER to resume');
      } else if (screen === SCREEN_OVER) {
        drawOverlay(ctx, 'SHIFT OVER', [
          state.overReason,
          `Served ${state.served} dishes · Earned $${state.coins} · Best combo x${state.bestCombo}`,
          best > 0 ? `Best shift so far: $${best}` : '',
        ], 'Press ENTER to work another shift');
      }
    },
  };
}

// Kept for the dossier outline: the menu the renderer can plate.
export const MENU_SIZE = RECIPES.length;
export const TICKET_ITEMS = ITEM_NAMES;
