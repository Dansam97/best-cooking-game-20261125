// The screenshot scenes behind ?shot=rush|serve|title|over. Each one starts
// a real shift and then sets the kitchen by hand — tickets on the board, a
// patty on the grill, a dish half-built on the plating counter — and steps
// the true rules forward a few frames, so the picture is the game itself at
// a moment a player could really reach, and the same seed always stages the
// same frame.

import { RECIPES } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const RECIPE = Object.fromEntries(RECIPES.map((recipe) => [recipe.id, recipe]));

/** Step the staged world a little so timers, steam and popups come alive. */
function settle(world, steps) {
  const idle = { dx: 0, dy: 0, interact: false, target: null };
  for (let index = 0; index < steps; index += 1) world.step(1 / 60, idle);
}

export function stageShot(name, world) {
  const state = world.state;
  if (name === 'title' || (name !== 'rush' && name !== 'serve' && name !== 'over')) {
    return { screen: SCREEN_TITLE, best: 0 };
  }
  world.start();
  if (name === 'rush') {
    // Mid-service, everything moving at once: three tickets up, one burning
    // down, a patty mid-grill, a tomato mid-chop, a burger half-plated and
    // the chef crossing the kitchen with chopped lettuce for it.
    world.stage.order(RECIPE.garden);
    world.stage.order(RECIPE.classic);
    world.stage.order(RECIPE.deluxe);
    state.orders[0].patience = 21;
    state.orders[1].patience = 38;
    state.orders[2].patience = 47;
    world.stage.set({ elapsed: 47, timeLeft: 103, coins: 38, served: 4, combo: 2 });
    world.stage.grill('pattyRaw', 4.2);
    world.stage.board('tomato', 2);
    world.stage.plate(['bun', 'pattyCooked']);
    world.stage.chefAt(716, 478, { item: 'lettuceChopped' });
    state.chef.dirX = -0.7;
    state.chef.dirY = -0.7;
    world.stage.popup(1208, 402, '+$15', '#3f9e4d');
    settle(world, 24);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    // A finished Classic Burger in hand, steps from the hatch, with a salad
    // nearly plated and a patty resting at perfect on the grill.
    world.stage.order(RECIPE.classic);
    world.stage.order(RECIPE.crunch);
    state.orders[0].patience = 44;
    state.orders[1].patience = 30;
    world.stage.set({ elapsed: 88, timeLeft: 62, coins: 86, served: 7, combo: 3 });
    world.stage.grill('pattyRaw', 7.4);
    world.stage.plate(['lettuceChopped', 'tomatoChopped']);
    world.stage.chefAt(1108, 492, { plate: ['bun', 'pattyCooked', 'cheese'] });
    state.chef.dirX = 1;
    state.chef.dirY = 0;
    settle(world, 12);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  // over: the shift is done and the till is counted.
  world.stage.order(RECIPE.garden);
  world.stage.set({
    phase: 'over',
    overReason: 'Shift over. The kitchen goes quiet.',
    elapsed: 150,
    timeLeft: 0,
    coins: 132,
    served: 11,
    bestCombo: 5,
    strikes: 1,
  });
  world.stage.plate(['bun']);
  world.stage.chefAt(640, 500, null);
  return { screen: SCREEN_OVER, best: 132 };
}
