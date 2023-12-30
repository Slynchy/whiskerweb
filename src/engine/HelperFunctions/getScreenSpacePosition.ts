import { Container, Point } from "pixi.js";

export function getScreenSpacePosition(displayObject: Container): Point {
    const screenSpacePosition = displayObject.getGlobalPosition(new Point());
    return screenSpacePosition;
}