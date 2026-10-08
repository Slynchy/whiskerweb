// import { tsthreeConfig } from "../../config/tsthreeConfig";
// import { Windows95 } from "../../game/States/Windows95";
import { getMainCanvasElement } from "./getMainCanvasElement";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement(): Element | null {
  const _document = document as FullscreenDocument;
  return (
    _document.fullscreenElement ||
    _document.webkitFullscreenElement ||
    _document.mozFullScreenElement ||
    _document.msFullscreenElement ||
    null
  );
}

/**
 * Read from the document each time, so it stays correct when the user leaves
 * fullscreen themselves (Esc, back gesture) or a request is refused.
 */
export function getIsFullscreen(): boolean {
  return Boolean(getFullscreenElement());
}

/**
 * Requests fullscreen for the game canvas. Browsers only allow this from a user gesture (e.g. a click handler).
 * Resolves once the request has been handled, including when the browser refuses it (logged as a warning);
 * check `getIsFullscreen()` afterwards for the result.
 */
export function openFullscreen(): Promise<void> {
  const canvas: any = getMainCanvasElement() || document.documentElement;
  let request: unknown;
  try {
    if (canvas.requestFullscreen) request = canvas.requestFullscreen();
    else if (canvas["webkitRequestFullscreen"])
      request = canvas["webkitRequestFullscreen"]();
    else if (canvas["webkitRequestFullScreen"])
      request = canvas["webkitRequestFullScreen"]();
    else if (canvas["mozRequestFullScreen"])
      request = canvas["mozRequestFullScreen"]();
    else if (canvas["msRequestFullscreen"])
      request = canvas["msRequestFullscreen"]();
    else {
      console.warn("Fullscreen is not supported");
      return Promise.resolve();
    }
  } catch (err) {
    console.warn(err);
    return Promise.resolve();
  }
  // The standard API returns a promise that rejects when the request is refused;
  // the prefixed ones return nothing
  return Promise.resolve(request)
    .then(() => undefined)
    .catch((err) => {
      console.warn(err);
    });
}

/* Close fullscreen */
export function closeFullscreen(): void {
  // exitFullscreen() rejects when the document isn't fullscreen
  if (!getIsFullscreen()) return;
  try {
    const _document = document as FullscreenDocument;
    let request: unknown;
    if (_document.exitFullscreen) {
      request = _document.exitFullscreen();
    } else if (_document.webkitExitFullscreen) {
      /* Safari */
      request = _document.webkitExitFullscreen();
    } else if (_document.mozCancelFullScreen) {
      request = _document.mozCancelFullScreen();
    } else if (_document.msExitFullscreen) {
      /* IE11 */
      request = _document.msExitFullscreen();
    }
    Promise.resolve(request).catch((err) => console.warn(err));
  } catch (err) {
    console.warn(err);
  }
}
