![WhiskerWeb Logo](http://slynch.xyz/images/whiskerweb_256.png)

# WhiskerWeb
A TypeScript ECS framework built on-top of PixiJS v8 for interactive WebGPU/WebGL rendering or game development. Long live catto.

### Why use WhiskerWeb?
- **Flexibility**: WhiskerWeb extends PixiJS with ECS functionality as well as lots of other useful QoL features for developing on web, but you can happily ignore the ECS entirely and use PIXI directly.
- **Speed**: Utilising PIXI v8, WhiskerWeb was designed to make full use of cutting-edge WebGPU technology.
- **Ease of Use**: Simply install the module, instantiate the engine, and start making your game state!

### Dependencies

- Always-used dependencies:
  - [PixiJS v8](https://pixijs.io/)
- Optional/treeshakeable dependencies:
  - [CapacitorJS](https://capacitorjs.com/)
  - [Firebase](https://firebase.google.com/)
  - [GameAnalytics](https://gameanalytics.com/)
  - [Pixi-Filters](https://pixijs.io/pixi-filters/docs/)
  - [Stats.js](https://github.com/mrdoob/stats.js)
  - [ESLint](https://eslint.org/)

## Getting started
Simply clone `Slynchy/whiskerweb-template` and initialize git submodules to get started.

Alternatively, you can install the module via npm:
```bash
npm install whiskerweb --save-dev
```

Or clone this repository and build it yourself:
```bash
git clone [this repo]
cd whiskerweb
npm ci
npm run build

npm link
```

Once you have the module installed, you can import the engine and start using it in your project:
```typescript
import { Engine, State } from "whiskerweb";

class MyGameState extends State {
  onAwake(): void {}
  onResize(): void {}
  onStep(): void {}
  preload(): void {}
  onDestroy(): void {}
}

async function main() {
  const engine = new Engine();
  await engine.init(
    new MyGameState(),
  );
}

main();
```

### Notes
- Do not install PIXI via npm; instead, import the PIXI exports from `whiskerweb` directly.
- `HelperFunctions` is a class of useful static functions for development, from older versions of the framework.
  - `Helpers` is the newer home for helper functions, and is a namespace for helper functions.

### Project structure

* Assets - `./src/assets/**/*`
  * Contains required templates for the game (e.g. `index.html`, `main.css`, etc.)
* Config - `./src/config/whiskerConfig.ts`
  * Contains the interface for configuring the engine on initialization.
* Components - `./src/engine/Components/**/*`
  * Contains the base ECS components for the engine.
* Systems - `./src/engine/Systems/**/*`
  * Contains the base ECS systems for the engine.
* Engine - `./src/engine/Engine.ts`
  * Contains the main engine class.
  * Globally accessible with `ENGINE`.
* Platform bindings - `./src/engine/PlatformSDKs.ts`
  * Contains the interface for platform-specific SDKs.
* Helpers/HelperFunctions - `./src/engine/HelperFunctions/**/*`
  * Contains all the helper functions for the framework.
* Savers - `./src/engine/Savers/**/*`
  * Contains the base classes for saving and loading game states to storage
  * (Currently only LocalStorageSaver)
* Types - `./src/engine/Types/**/*`
  * Contains the base types for the engine.
* Savers - `./src/engine/ModularPathFinding/**/*`
  * Some helper functions for pathfinding.

## Project terminology

* `Engine` - The main funnel for all framework functionality. This is passed as a reference to most `onSomething` functions.
* `GameObject` - Essentially a `Container` from PIXI, but can have components added to it. Prefabs should extend this.
* `Component` - A relatively-small class that contains as little logic as possible.
  * Preferably only holds data, but for abstracting PIXI, it's often unavoidable to require some logic to sync the component abstraction with the library implementation.
* `Scene` - A 2D container for multiple GameObjects (e.g. `Level`, `WorldMap`)
* `State` - An abstraction beyond Scene to represent areas of a game (e.g. `Init`, `Game`, `MainMenu`)
  * **Note**: Adding a GameObject to an active scene of an active state will automatically call `onStep` every frame.
* "Step" - A single frame, handled by the framework abstracting `PIXI.Ticker`