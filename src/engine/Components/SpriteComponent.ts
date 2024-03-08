import { Component } from "../Component";
import { Sprite as PIXISprite, Texture as PIXITexture, Filter as PIXIFilter, Filter } from "pixi.js";
import { System } from "../Systems/System";
import { SpriteSystem } from "../Systems/SpriteSystem";
import { IVector2 } from "../Types/IVector2";

export class SpriteComponent extends Component {

    public static readonly id: string = "SpriteComponent";
    protected static readonly _system: typeof System = SpriteSystem;
    private _sprite: PIXISprite;

    constructor(_textureKey?: string) {
        super();

        if (_textureKey) this.setTexture(
            _textureKey
        );
    }

    public onAttach(): void {
        if (!this._sprite) {
            this.init(null);
        }
        this.parent.addChild(this._sprite);
    }

    public onDetach(): void {
        this.parent.removeChild(this._sprite);
    }

    public onComponentAttached(_componentId: string, _component: Component): void {
    }

    public get pivot(): IVector2 {
        return this._sprite.pivot;
    }

    public get anchor(): IVector2 {
        return this._sprite.anchor;
    }

    public get width(): number {
        return this._sprite.width;
    }

    public set width(_x: number) {
        this._sprite.width = _x;
    }

    public get height(): number {
        return this._sprite.height;
    }

    public set height(_y: number) {
        this._sprite.height = _y;
    }

    public addFilter(filter: PIXIFilter): void {
        if(!this._sprite.filters) this._sprite.filters = [];
        (
            this._sprite.filters as Filter[]
        ).push(filter);
    }

    public getSpriteObj(): PIXISprite | null {
        return this._sprite || null;
    }

    public setTexture(_textureKey: string): void {
        if (this._sprite) {
            this._sprite.texture = ENGINE.getPIXIResource(_textureKey) as PIXITexture;
        } else {
            this.init(ENGINE.getPIXIResource(_textureKey) as PIXITexture);
        }
    }

    private init(_texture?: PIXITexture): void {
        this._sprite = new PIXISprite(_texture);
    }
}
