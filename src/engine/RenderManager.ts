import { Engine } from "./Engine";
import { HelperFunctions } from "./HelperFunctions";
import {
  AbstractRenderer,
  autoDetectRenderer,
  Container as PIXIContainer,
  Graphics,
  PRECISION,
  Renderer,
  SCALE_MODES,
  Text,
  TextStyle,
  WebGPURenderer,
  WebWorkerAdapter,
  DOMAdapter,
  Color,
  WebGLRenderer,
  AutoDetectOptions,
} from "pixi.js";
import { TWhiskerConfig } from "../config/whiskerConfig";
import { ENGINE_DEBUG_MODE } from "./Constants/Constants";
import { Easing } from "@tweenjs/tween.js";
import isMobile from "is-mobile";
import { ENGINE_ERROR } from "./ErrorCodes/EngineErrorCodes";

export class RenderManager {
  private canvasElement: HTMLCanvasElement;
  private renderer2d: Renderer;
  private debugGrid: Graphics;

  constructor(_engine: Engine) {
    // this.canvasElement = document.createElement("canvas") as HTMLCanvasElement;
  }

  public createDebugGrid(): void {
    if (this.debugGrid) {
      this.debugGrid.removeFromParent();
      this.debugGrid.destroy();
      this.debugGrid = null;
    }

    const debugGrid = (this.debugGrid = new Graphics());
    // debugGrid.strokeStyle.width = 5;
    // debugGrid.strokeStyle.color = 0x00ff00;
    // debugGrid.strokeStyle.alpha = 0.3;
    // debugGrid.strokeStyle = (5, 0x00FF00, 0.3, 0.5);
    debugGrid
      .lineTo(this.renderer2d.width, 0)
      .lineTo(this.renderer2d.width, this.renderer2d.height)
      .lineTo(0, this.renderer2d.height)
      .lineTo(0, 0)
      .lineTo(this.renderer2d.width, this.renderer2d.height)
      .moveTo(0, this.renderer2d.height)
      .lineTo(this.renderer2d.width, 0)
      .stroke({
        color: 0x00ff00,
        width: 4,
        alpha: 0.3,
      });
    ENGINE["getStage"]().addChild(debugGrid);
    ENGINE["getStage"]().setChildIndex(debugGrid, 0);
  }

  public async initializeRenderer(_config: TWhiskerConfig): Promise<void> {
    // css stuff first
    document.body.style.margin = `0 0 0 0`;
    document.body.style.backgroundColor = "#000000";
    document.body.style.overflow = "hidden";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundSize = "100% 100%";

    const settings: Partial<AutoDetectOptions> = {
      preference: _config.renderType || "webgpu",
      // canvas: this.canvasElement,
      backgroundAlpha: _config.backgroundAlpha,
      antialias: _config.antialias,
      backgroundColor: _config.backgroundColor,
      resolution: _config.devicePixelRatio || 1,
      roundPixels: _config.roundPixels || false,
    };
    // DOMAdapter.set(WebWorkerAdapter);
    this.renderer2d = await autoDetectRenderer(settings)
      .catch((err) => {
        console.warn(err);
        settings.preference = "webgl";
        return autoDetectRenderer(settings);
      })
      .catch(() => {
        throw new Error(ENGINE_ERROR.WEBGL_UNSUPPORTED);
      });
    console.log(
      "Initialized renderer to be %s",
      this.renderer2d instanceof WebGLRenderer ? "WebGL" : "WebGPU",
    );

    this.canvasElement = this.renderer2d.canvas;
    this.canvasElement.id = "ui-canvas";
    this.canvasElement.style.position = "absolute";
    this.canvasElement.style.transform = "translateX(-50%) translateY(-50%)";
    this.canvasElement.style.left = "50%";
    this.canvasElement.style.top = "50%";
    document.body.appendChild(this.canvasElement);
    this.canvasElement.oncontextmenu = function (e) {
      e.preventDefault();
      e.stopPropagation();
    };

    if (ENGINE_DEBUG_MODE) {
      // this.createDebugGrid();
    }
  }

  public get width(): number {
    return this.renderer2d.width * this.renderer2d.resolution;
  }

  public get height(): number {
    return this.renderer2d.height * this.renderer2d.resolution;
  }

  public static configureRenderer2d(
    _w: number,
    _h: number,
    _engine: Engine,
    _renderer: Renderer,
  ): void {
    AbstractRenderer.defaultOptions.resolution = window.devicePixelRatio;
    _renderer.resize(
      _w * (1 / AbstractRenderer.defaultOptions.resolution),
      _h * (1 / AbstractRenderer.defaultOptions.resolution),
    );

    const height = _h - (_engine["_adjustHeightForBannerAd"] ? 60 : 0);
    const windowHeight =
      window.innerHeight - (_engine["_adjustHeightForBannerAd"] ? 60 : 0);

    if (_engine["autoResize"] === "width") {
      const val = !isMobile()
        ? Math.ceil(Math.min(windowHeight, height * (window.innerWidth / _w)))
        : window.innerHeight;
      // _renderer.resize(window.innerWidth, val);
      _renderer.canvas.style.width = `${window.innerWidth}px`;
      _renderer.canvas.style.height = `${val}px`;
      _renderer.canvas.style.transform = `translateX(0%) translateY(-50%)`;
      _renderer.canvas.style.top = `50%`;
      _renderer.canvas.style.left = `0%`;
    } else if (_engine["autoResize"] === "height") {
      const val = !isMobile()
        ? Math.ceil(Math.min(window.innerWidth, _w * (windowHeight / height)))
        : window.innerWidth;
      // _renderer.resize(val, window.innerHeight);
      _renderer.canvas.style.height = `${windowHeight}px`;
      _renderer.canvas.style.width = `${val}px`;
      _renderer.canvas.style.transform = `translateX(-50%) translateY(0%)`;
      _renderer.canvas.style.top = `0%`;
      _renderer.canvas.style.left = `50%`;
    } else {
      _renderer.canvas.style.width =
        Math.ceil(Math.min(_w, window.innerWidth)) + "px";
      _renderer.canvas.style.height =
        Math.ceil(Math.min(height, windowHeight)) + "px";
    }
  }

  public getRenderer(): Renderer {
    return this.renderer2d;
  }

  public init(_engine: Engine, _config: TWhiskerConfig): void {}
}
