import { Scene } from "../Scene";
import { GameObject } from "../GameObject";

export function constructSceneGraphString(scene: Scene, indentation?: number, child?: GameObject): string {
    // iterate over children recurisvely?
    const container = child || scene["getStage"]().parent;
    let result = (container.name || (
        child ? child.constructor.name : "Unknown"
    )) + " - pos: (" + container.x + ", " + container.y + ")";

    result += ", scale: (" + container.scale.x + ", " + container.scale.y + ")";
    result += ", visible: (" + container.visible + ")";
    // @ts-ignore
    result += ", anchor: (" + (container.anchor?.x || "null") + ", " + (container.anchor?.y || "null") + ")";

    if(child instanceof GameObject) {
        result += `, components: ${child.debug_GetListOfComponents()}`;
    }

    let indent = (indentation || 0) + 1;
    if (container.children && container.children.length > 0) {
        result += ": \n";
        for (let i = 0; i < container.children.length; i++) {
            for (let ind = 0; ind < indent; ind++) {
                result += "..";
            }
            result += constructSceneGraphString(scene, indent, container.children[i] as GameObject);
        }
    } else {
        // nothing?
    }
    indent--;
    result += "\n";
    return result;
}
