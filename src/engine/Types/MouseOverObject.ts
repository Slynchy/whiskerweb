import { MouseOverState } from "./MouseOverState";
import { IVector2 } from "./IVector2";

export interface MouseOverObject {
    pos: IVector2;
    dimensions: IVector2;
    onclick?: (ev: MouseEvent) => void;
    onmouseenter?: (ev: MouseEvent) => void;
    onmouseexit?: (ev: MouseEvent) => void;
    onmousemove?: (ev: MouseEvent) => void;
    _currState?: MouseOverState;
}
