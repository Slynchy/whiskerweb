import { IVector2 } from "../Types/IVector2";

export function getAngleBetweenTwoPoints(vec1: IVector2, vec2: IVector2): number {
  const dy = vec2.y - vec1.y;
  const dx = vec2.x - vec1.x;
  const radians = Math.atan2(dy, dx);
  return radians;
}