// The pop-out: a small always-on-top window with the timer, so it stays in view
// over slides or a doc. Uses Document Picture-in-Picture (Chrome and Edge only).
import { mount, unmount } from "svelte";
import PopOut from "#lib/components/PopOut.svelte";

interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
  window: Window | null;
}

function api(): DocumentPictureInPicture | null {
  if (typeof window === "undefined") return null;
  return (
    (
      window as unknown as {
        documentPictureInPicture?: DocumentPictureInPicture;
      }
    ).documentPictureInPicture ?? null
  );
}

/** Give the pop-out window the page's styles. */
function copyStyles(target: Document) {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const style = target.createElement("style");
      style.textContent = Array.from(sheet.cssRules)
        .map((rule) => rule.cssText)
        .join("\n");
      target.head.append(style);
    } catch {
      // A stylesheet from another origin can't be read; link to it instead.
      if (!sheet.href) continue;
      const link = target.createElement("link");
      link.rel = "stylesheet";
      link.href = sheet.href;
      target.head.append(link);
    }
  }
}

class Popout {
  readonly supported = api() !== null;
  open = $state(false);

  async toggle(): Promise<void> {
    const pip = api();
    if (!pip) return;
    if (pip.window) {
      pip.window.close();
      return;
    }
    let win: Window;
    try {
      win = await pip.requestWindow({ width: 320, height: 400 });
    } catch {
      return;
    }
    win.document.title = "Timer Toolbox";
    copyStyles(win.document);
    const component = mount(PopOut, {
      target: win.document.body,
      props: { win },
    });
    this.open = true;
    win.addEventListener("pagehide", () => {
      void unmount(component);
      this.open = false;
    });
  }
}

export const popout = new Popout();
