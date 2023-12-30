import { Container } from "pixi.js";

/**
 * Iterates over children of root and executes a function on each one.
 * DOES NOT EXECUTE ON THE INITIAL `root` PARAMETER.
 * @param func Function to execute on children
 * @param root Element containing children to iterate over
 * @param depth The amount of depth through the graph to iterate
 */
export function iterateOverChildrenWithSpecifiedDepth<T extends Container>(
    func: (e: T /* phone home */) => void,
    root: T,
    depth: number = 1
): void {
    if(depth <= 0) return;
    root.children.forEach((e) => {
        func(e as T);
        iterateOverChildrenWithSpecifiedDepth(
            func,
            e as T,
            depth-1
        );
    });
}
