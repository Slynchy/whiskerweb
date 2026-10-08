/**
 * Returns the canvas the engine renders to: the renderer's canvas once `Engine.init()` has created it,
 * otherwise the element with id "ui-canvas" (the id the engine gives its canvas), or null if neither exists.
 */
export function getMainCanvasElement(): HTMLCanvasElement | null {
    // ENGINE is a global that only exists once an Engine has been constructed
    const renderManager = typeof ENGINE !== "undefined" && ENGINE ? ENGINE.getRenderManager() : undefined;
    const renderer = renderManager ? renderManager.getRenderer() : undefined;
    const canvas = renderer ? renderer.canvas as HTMLCanvasElement : undefined;
    return canvas || (document.getElementById("ui-canvas") as HTMLCanvasElement | null);
}
