import { Renderer } from "pixi.js";
// import { tsthreeConfig } from "../../config/tsthreeConfig";
// import { Windows95 } from "../../game/States/Windows95";

let _isFullscreen: boolean = false;

export function getIsFullscreen(): boolean {
  return _isFullscreen;
}

const elem: {
  requestFullscreen?: Function;
  webkitRequestFullscreen?: Function;
  msRequestFullscreen?: Function;
  exitFullscreen?: Function;
  webkitExitFullscreen?: Function;
  msExitFullscreen?: Function;
} = document.documentElement;

export function openFullscreen(): Promise<void> {
  const canvas: any = document.getElementById("ui-canvas");
  if (canvas.requestFullscreen) canvas.requestFullscreen();
  else if (canvas["webkitRequestFullScreen"])
    canvas["webkitRequestFullScreen"]();
  else if (canvas["mozRequestFullScreen"]) canvas["mozRequestFullScreen"]();
  return Promise.resolve();
}

/* Close fullscreen */
export function closeFullscreen(): void {
  try {
    const _document: typeof elem = document;
    if (_document.exitFullscreen) {
      _document.exitFullscreen();
    } else if (_document.webkitExitFullscreen) {
      /* Safari */
      _document.webkitExitFullscreen();
    } else if (_document.msExitFullscreen) {
      /* IE11 */
      _document.msExitFullscreen();
    }
  } catch (err) {
    console.warn(err);
  }
  _isFullscreen = false;
}
