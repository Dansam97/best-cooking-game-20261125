// Boot and the one loop. Input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), the
// renderer paints what is there, and the sounds answer the world's events.
// Screens: title, play, paused, over.
//
// ?seed=N fixes the order pattern. ?shot=rush|serve|title|over (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for the screenshot.

import { STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import {
  createWorld,
  EVT_BURN,
  EVT_CHOP,
  EVT_COOKED,
  EVT_ERROR,
  EVT_EXPIRE,
  EVT_PICKUP,
  EVT_PLACE,
  EVT_SERVE,
  EVT_TRASH,
} from './world.js';
import { createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const BEST_KEY = 'sizzle-serve-best';
const MAX_FRAME = 0.25;

const EVENT_SOUNDS = [
  [EVT_SERVE, 'serve'],
  [EVT_EXPIRE, 'expire'],
  [EVT_BURN, 'burn'],
  [EVT_COOKED, 'cooked'],
  [EVT_CHOP, 'chop'],
  [EVT_PICKUP, 'pickup'],
  [EVT_PLACE, 'place'],
  [EVT_TRASH, 'trash'],
  [EVT_ERROR, 'error'],
];

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best shift lasts this visit only.
  }
}

function toField(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * 1280,
    y: ((clientY - rect.top) / rect.height) * 720,
  };
}

if (shot !== null) {
  const scene = stageShot(shot, world);
  let painted = 0;
  const paint = () => {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  };
  requestAnimationFrame(paint);
} else {
  const input = createInput(canvas, toField);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  const announce = () => {
    const s = world.state;
    status.textContent = s.phase === 'play'
      ? `Sizzle and Serve: $${s.coins} earned, ${s.served} served, ${s.orders.length} tickets waiting.`
      : 'Sizzle and Serve: a lunch-rush cooking game.';
  };

  const frame = (now) => {
    let delta = (now - last) / 1000;
    last = now;
    if (delta > MAX_FRAME) delta = MAX_FRAME;
    audio.wake();

    if (screen === SCREEN_TITLE && input.confirm()) {
      world.start();
      screen = SCREEN_PLAY;
    } else if (screen === SCREEN_PLAY) {
      if (input.pause()) {
        screen = SCREEN_PAUSED;
      } else {
        accumulator += delta;
        while (accumulator >= STEP) {
          const events = world.step(STEP, input.controls());
          for (const [bit, sound] of EVENT_SOUNDS) if (events & bit) audio.play(sound);
          accumulator -= STEP;
          if (world.state.phase === 'over') {
            screen = SCREEN_OVER;
            best = Math.max(best, world.state.coins);
            saveBest(best);
            break;
          }
        }
      }
    } else if (screen === SCREEN_PAUSED) {
      if (input.pause() || input.confirm()) screen = SCREEN_PLAY;
    } else if (screen === SCREEN_OVER && input.confirm()) {
      world.start();
      screen = SCREEN_PLAY;
    }

    renderer.draw(world.state, screen, best);
    announce();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
