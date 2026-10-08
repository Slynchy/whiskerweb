import { IMediaInstance, sound } from "@pixi/sound";
import { ENGINE_DEBUG_MODE } from "./Constants/Constants";
import { HelperFunctions } from "./HelperFunctions";
import { uid } from "./HelperFunctions/uid";
import { getSupportedAudioFormat } from "./HelperFunctions/getSupportedAudioExtension";
import { PlayerDataSingleton } from "./PlayerDataSingleton";

export enum AUDIO_TYPES {
  SFX = 0,
  MUSIC = 1,
}

let __INSTANCE: AudioSingletonClass;

// Instance volume used when playSound() isn't given `options.volume`, on first and later plays alike
const DEFAULT_SOUND_VOLUME = 1;

class AudioSingletonClass {
  private _audioInstances: {
    [AUDIO_TYPES.SFX]: {
      [key: string]: {
        [key: string]: IMediaInstance | Promise<IMediaInstance>;
      };
    };
    [AUDIO_TYPES.MUSIC]: {
      [key: string]: {
        [key: string]: IMediaInstance | Promise<IMediaInstance>;
      };
    };
  } = {
    [AUDIO_TYPES.MUSIC]: {},
    [AUDIO_TYPES.SFX]: {},
  };

  private _currentlyPlaying: Array<string> = [];

  constructor() {
    if (__INSTANCE)
      throw new Error("Only one instance of AudioSingleton allowed!");
  }

  public isMuted(_type: AUDIO_TYPES): boolean {
    if (_type === AUDIO_TYPES.SFX) {
      return false;
      // return PlayerDataSingleton.getIsSFXMuted();
    } else if (_type === AUDIO_TYPES.MUSIC) {
      // nothing for now
    }
  }

  public getAudioInstance(
    _type: AUDIO_TYPES,
    _audioId: string,
    _instanceId: string,
  ): Promise<IMediaInstance> | IMediaInstance | null {
    if (!this._audioInstances[_type][_audioId]) return null;
    return this._audioInstances[_type][_audioId][_instanceId];
  }

  public isLoaded(_id: string): boolean {
    return sound.exists(_id);
  }

  public stopAllSoundsOfId(_id: string): void {
    sound.stop(_id);
  }

  private _removeFromCurrentlyPlaying(_id: string): void {
    const index = this._currentlyPlaying.indexOf(_id);
    if (index !== -1) this._currentlyPlaying.splice(index, 1);
  }

  /**
   * Plays a sound but don't care if it doesn't play; catches errors.
   * Only one instance of each id plays at a time: while it's playing, further calls return "".
   * @param id
   * @param options = {audioType: AUDIO_TYPES, volume: number (default 1), loop: boolean, ...PIXI sound options}
   * @returns The instance id (for getAudioInstance), or "" if the sound didn't play
   */
  public async playSound(
    id: string,
    options?: { [key: string]: any },
  ): Promise<string> {
    const audioType: AUDIO_TYPES = options?.audioType || AUDIO_TYPES.SFX;
    const volume: number = options?.volume ?? DEFAULT_SOUND_VOLUME;
    // audioType is ours, and volume is applied to the instance rather than the shared PIXI Sound
    const { audioType: _audioType, volume: _volume, ...pixiOptions } = options || {};
    const randId = uid();

    if (ENGINE_DEBUG_MODE) {
      console.log(`Trying to play ${id}`);
    }

    // Forgets this instance and lets the id be played again; only acts once per instance
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      if (this._audioInstances[audioType][id])
        delete this._audioInstances[audioType][id][randId];
      this._removeFromCurrentlyPlaying(id);
    };

    const onEnd = (_stopped: boolean) => {
      if (ENGINE_DEBUG_MODE) {
        console.log(
          `Audio file ${id} ${_stopped ? "was stopped" : "finished playing"}`,
        );
      }
      // Release first, otherwise the restart below is rejected as already playing
      release();
      if (!_stopped && options?.loop) {
        this.playSound(id, options);
      }
    };

    const track = (_mediaInstance: IMediaInstance) => {
      _mediaInstance.on("end", () => onEnd(false));
      _mediaInstance.on("stop", () => onEnd(true));
      // stopAllSounds() may have cleared the buckets meanwhile
      if (!this._audioInstances[audioType][id])
        this._audioInstances[audioType][id] = {};
      this._audioInstances[audioType][id][randId] = _mediaInstance;
    };

    if (!this._audioInstances[audioType][id])
      this._audioInstances[audioType][id] = {};

    if (this.isMuted(audioType)) return "";

    if (this._currentlyPlaying.indexOf(id) !== -1) return "";
    this._currentlyPlaying.push(id);

    let mediaInstance: Promise<IMediaInstance> | IMediaInstance;
    try {
      if (!this.isLoaded(id)) {
        if (ENGINE_DEBUG_MODE) {
          console.log(`Not loaded ${id}, loading...`);
        }
        sound.add(id, {
          ...pixiOptions,
          url: `assets/audio/${id}${getSupportedAudioFormat()}`,
          autoPlay: true,
          loaded: (_err, _sound, _mediaInstance) => {
            if (_err || !_mediaInstance) {
              console.error(_err || "No media instance!");
              // Drop a sound that failed to load, so the next playSound() retries the load
              // (a failed sound left in the library would return a promise that never resolves)
              try {
                if (_err && sound.exists(id)) sound.remove(id);
              } catch (removeErr) {
                console.warn(removeErr);
              }
              release();
            } else {
              if (ENGINE_DEBUG_MODE) {
                console.log(`Loaded ${id} audio file`);
              }
              mediaInstance = _mediaInstance;
              _mediaInstance.volume = volume;
              track(_mediaInstance);
            }
          },
        });
      } else {
        mediaInstance = sound.play(id, { ...pixiOptions, volume });
        if (HelperFunctions.isPromise(mediaInstance)) {
          (mediaInstance as Promise<IMediaInstance>)
            .then((_mediaInstance) => {
              mediaInstance = _mediaInstance;
              track(_mediaInstance);
            })
            .catch((err) => {
              console.warn(err);
              release();
            });
        } else if (mediaInstance) {
          track(mediaInstance as IMediaInstance);
        } else {
          throw new Error("No media instance!");
        }
      }
    } catch (err) {
      console.warn(err);
      if (!mediaInstance) {
        release();
        return "";
      }
    }

    return randId;
  }

  private updateMuteStatusOnInstances(_type: AUDIO_TYPES): void {
    const audioIdKeys = Object.keys(this._audioInstances[_type]);
    audioIdKeys.forEach((audioId) => {
      const instanceKeys = Object.keys(this._audioInstances[_type][audioId]);
      instanceKeys.forEach((audioInstanceId) => {
        const instance = this._audioInstances[_type][audioId][audioInstanceId];
        if (HelperFunctions.isPromise(instance)) {
          (instance as Promise<IMediaInstance>).then((e) => {
            e.muted = this.isMuted(_type);
          });
        } else {
          (instance as IMediaInstance).muted = this.isMuted(_type);
        }
      });
    });
  }

  public stopAllSounds(): void {
    sound.stopAll();
    this._audioInstances[AUDIO_TYPES.SFX] = {};
    this._audioInstances[AUDIO_TYPES.MUSIC] = {};
  }
}

__INSTANCE = new AudioSingletonClass();

export const AudioSingleton = __INSTANCE;
