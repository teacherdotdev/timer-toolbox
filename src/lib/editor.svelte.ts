// Which timer the editor pop-up is open on, if any. Any page can open it; the
// layout shows it.
import { app } from "#lib/state.svelte.ts";

interface Editing {
  timerId: string;
  /** Made by "New timer": Cancel throws it away and goes back to `previousId`. */
  isNew: boolean;
  previousId: string;
}

class Editor {
  editing = $state<Editing | null>(null);

  edit(timerId: string): void {
    this.editing = { timerId, isNew: false, previousId: app.currentId };
  }

  create(): void {
    const previousId = app.currentId;
    const timerId = app.addTimer();
    this.editing = { timerId, isNew: true, previousId };
  }

  close(): void {
    this.editing = null;
  }

  cancel(): void {
    const editing = this.editing;
    this.editing = null;
    if (!editing?.isNew) return;
    app.remove(editing.timerId, { undoable: false });
    app.select(editing.previousId);
  }
}

export const editor = new Editor();
