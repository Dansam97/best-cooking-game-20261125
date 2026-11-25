// Hands and feet: the keyboard steers the chef and works the stations, the
// mouse can send the chef walking with a click. Everything is read as plain
// state each frame; edge-triggered actions (interact, confirm, pause) are
// consumed once so one press never fires twice.

const MOVE_KEYS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  KeyW: [0, -1],
  KeyS: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
};

export function createInput(canvas, scale) {
  const held = new Set();
  let interactQueued = false;
  let confirmQueued = false;
  let pauseQueued = false;
  let clickTarget = null;

  window.addEventListener('keydown', (event) => {
    if (MOVE_KEYS[event.code] || event.code === 'Space') event.preventDefault();
    if (event.repeat) return;
    held.add(event.code);
    if (event.code === 'Space' || event.code === 'KeyE') interactQueued = true;
    if (event.code === 'Enter') confirmQueued = true;
    if (event.code === 'KeyP' || event.code === 'Escape') pauseQueued = true;
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointerdown', (event) => {
    const point = scale(event.clientX, event.clientY);
    clickTarget = point;
    confirmQueued = true;
  });

  return {
    /** The control slice the world consumes for one step. */
    controls() {
      let dx = 0;
      let dy = 0;
      for (const code of held) {
        const move = MOVE_KEYS[code];
        if (move) {
          dx += move[0];
          dy += move[1];
        }
      }
      const ctl = { dx, dy, interact: interactQueued, target: clickTarget };
      interactQueued = false;
      if (dx !== 0 || dy !== 0) clickTarget = null;
      return ctl;
    },
    /** True once per Enter press or click, then false until the next. */
    confirm() {
      const was = confirmQueued;
      confirmQueued = false;
      return was;
    },
    /** True once per pause press, then false until the next. */
    pause() {
      const was = pauseQueued;
      pauseQueued = false;
      return was;
    },
  };
}
