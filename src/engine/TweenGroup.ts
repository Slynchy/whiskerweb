import { Group, Tween } from "@tweenjs/tween.js";

/**
 * The tween group the engine updates every frame (and pauses with `engine.pause()`).
 * tween.js doesn't put new tweens in any group, so add yours:
 * `tweenGroup.add(new Tween(obj).to({ x: 10 }, 500).start())`.
 * Tweens are removed from the group once they have finished or been stopped.
 */
export const tweenGroup = new Group();

/**
 * Advances every tween in `tweenGroup`, then removes the ones that have finished or been stopped.
 * Called by the engine each frame; tweens use tween.js's default clock (performance.now).
 */
export function updateTweens(time?: number): void {
    tweenGroup.update(time);
    for (const tween of tweenGroup.getAll()) {
        // A tween that hasn't been started yet (e.g. one chained after another) has a start time of 0
        // and must stay in the group; one that has started and is no longer playing is done.
        const startTime = (tween as unknown as { _startTime: number })._startTime;
        if (!tween.isPlaying() && startTime > 0) {
            tweenGroup.remove(tween as Tween);
        }
    }
}
