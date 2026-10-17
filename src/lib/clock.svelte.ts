// The current time, refreshed every animation frame of the given window. A hidden
// tab gets no frames, and that's fine: nothing is counted, only redrawn (see run.ts).

export class Clock {
  now = $state(Date.now());

  /** Start ticking; returns a function that stops it. */
  start(win: Window = window): () => void {
    let frame = 0;
    const tick = () => {
      this.now = Date.now();
      frame = win.requestAnimationFrame(tick);
    };
    tick();
    return () => win.cancelAnimationFrame(frame);
  }
}

/**
 * The current time, refreshed once a second even while the tab is hidden, for the
 * tab title. Chrome may slow it to once a minute after a minute hidden.
 */
class SecondClock {
  now = $state(Date.now());

  start(): () => void {
    const id = setInterval(() => (this.now = Date.now()), 1000);
    return () => clearInterval(id);
  }
}

export const seconds = new SecondClock();
