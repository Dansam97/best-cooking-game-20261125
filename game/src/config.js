// Sizzle & Serve — every tuning number, station and recipe in one place.
// The kitchen is a fixed 1280x720 logical field; the renderer scales it to
// the window, so no rule below ever depends on the real screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second at any refresh rate. */
export const STEP = 1 / 60;

export const CHEF = { radius: 17, speed: 238, reach: 58 };

/** A shift lasts this long; three expired orders end it early. */
export const SHIFT_SECONDS = 150;
export const MAX_STRIKES = 3;

/** The order board across the top of the screen. */
export const BOARD = { x: 0, y: 0, width: 1280, height: 104 };

/**
 * The stations the chef walks between. Bins hand out raw ingredients, the
 * board chops, the grill cooks, the island plates, the hatch serves and the
 * trash forgives. Rectangles are in field coordinates.
 */
export const STATIONS = [
  { id: 'board', kind: 'board', label: 'CHOPPING BOARD', x: 26, y: 196, width: 92, height: 128 },
  { id: 'grill', kind: 'grill', label: 'GRILL', x: 1162, y: 186, width: 92, height: 148 },
  { id: 'hatch', kind: 'hatch', label: 'SERVING HATCH', x: 1162, y: 420, width: 92, height: 128 },
  { id: 'plate', kind: 'plate', label: 'PLATING COUNTER', x: 440, y: 322, width: 400, height: 74 },
  { id: 'trash', kind: 'trash', label: 'TRASH', x: 26, y: 616, width: 76, height: 76 },
  { id: 'bin-bun', kind: 'bin', item: 'bun', label: 'BUNS', x: 150, y: 616, width: 118, height: 76 },
  { id: 'bin-patty', kind: 'bin', item: 'pattyRaw', label: 'PATTIES', x: 284, y: 616, width: 118, height: 76 },
  { id: 'bin-cheese', kind: 'bin', item: 'cheese', label: 'CHEESE', x: 418, y: 616, width: 118, height: 76 },
  { id: 'bin-lettuce', kind: 'bin', item: 'lettuce', label: 'LETTUCE', x: 552, y: 616, width: 118, height: 76 },
  { id: 'bin-tomato', kind: 'bin', item: 'tomato', label: 'TOMATO', x: 686, y: 616, width: 118, height: 76 },
];

/** What each carried or plated thing is called on an order ticket. */
export const ITEM_NAMES = {
  bun: 'Bun',
  pattyRaw: 'Raw patty',
  pattyCooked: 'Grilled patty',
  pattyBurnt: 'Burnt patty',
  cheese: 'Cheese',
  lettuce: 'Lettuce',
  lettuceChopped: 'Chopped lettuce',
  tomato: 'Tomato',
  tomatoChopped: 'Chopped tomato',
};

/** The menu. A plate serves when its contents match a recipe exactly. */
export const RECIPES = [
  { id: 'classic', name: 'Classic Burger', items: ['bun', 'pattyCooked', 'cheese'], price: 12 },
  { id: 'garden', name: 'Garden Burger', items: ['bun', 'pattyCooked', 'lettuceChopped', 'tomatoChopped'], price: 16 },
  { id: 'crunch', name: 'Crunch Salad', items: ['lettuceChopped', 'tomatoChopped', 'cheese'], price: 11 },
  { id: 'deluxe', name: 'Deluxe Stack', items: ['bun', 'pattyCooked', 'cheese', 'lettuceChopped', 'tomatoChopped'], price: 20 },
];

/** Order pacing: the gap between tickets shrinks as the shift heats up. */
export const ORDERS = {
  firstDelay: 1.0,
  gapStart: 10.5,
  gapEnd: 5.2,
  maxActive: 4,
  patienceStart: 52,
  patienceEnd: 38,
  tipMax: 8,
};

/** Grill timing, in seconds: raw -> cooked -> burnt. */
export const GRILL = { cookAt: 6, burntAt: 11.5 };

/** Chopping takes this many knife presses. */
export const CHOPS_NEEDED = 3;

/** Colours of the kitchen: warm wood, steel, tile and the food itself. */
export const COLORS = {
  wall: '#3d2b23',
  floorA: '#e8d3ae',
  floorB: '#dfc69c',
  counter: '#8a5a33',
  counterTop: '#c98d4e',
  steel: '#9aa3ab',
  steelDark: '#6e777f',
  boardTop: '#e6e0cf',
  ink: '#2b1c12',
  paper: '#fff7e6',
  accent: '#e4572e',
  good: '#3f9e4d',
  warn: '#e8a13a',
  bad: '#d23b2e',
};
