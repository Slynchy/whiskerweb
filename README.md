![WhiskerWeb Logo](http://slynch.xyz/images/whiskerweb_256.png)

# WhiskerWeb
A TypeScript ECS framework built on-top of PixiJS v8. Long live catto.

## Getting started
Simply clone `Slynchy/whiskerweb-template` and initialize git submodules to get started.

Alternatively, you can add it as a git submodule yourself. Make sure to run `npm install` on the contents of `npm_install_cmd.txt` to install all the required dependencies.

## How to use
- Instantiate `Engine`
- Call `Engine.init(_initialState, _config)` where `_initialState` is a class extension of `State`, and `_config` is a `TWhiskerConfig`-compliant object.

## Notes
- PIXI graphics objects require `fill()`/`stroke()` to be called AFTER shape drawing.