import { IMediaInstance, sound } from "@pixi/sound";
import { ENGINE_DEBUG_MODE } from "./Constants/Constants";
import { HelperFunctions } from "../../index";
import { getSupportedAudioFormat } from "./HelperFunctions/getSupportedAudioExtension";
import { PlayerDataSingleton } from "./PlayerDataSingleton";

export enum AUDIO_TYPES {
    SFX = 0,
    MUSIC = 1,
}

let __INSTANCE: AudioSingletonClass;

class AudioSingletonClass {

    private _audioInstances: {
        [AUDIO_TYPES.SFX]: { [key: string]: { [key: string]: IMediaInstance | Promise<IMediaInstance> } },
        [AUDIO_TYPES.MUSIC]: { [key: string]: { [key: string]: IMediaInstance | Promise<IMediaInstance> } },
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
        if(_type === AUDIO_TYPES.SFX) {
            return false;
            // return PlayerDataSingleton.getIsSFXMuted();
        } else if(_type === AUDIO_TYPES.MUSIC) {
            // nothing for now
        }
    }

    public getAudioInstance(
        _type: AUDIO_TYPES,
        _audioId: string,
        _instanceId: string
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

    /**
     * Plays a sound but don't care if it doesn't play; catches errors
     * @param id
     * @param options = {audioType: AUDIO_TYPES,}
     */
    public async playSound(id: string, options?: { [key: string]: any }): Promise<string> {
        const audioType: AUDIO_TYPES = options?.audioType || AUDIO_TYPES.SFX;

        if (ENGINE_DEBUG_MODE) {
            console.log(`Trying to play ${id}`);
        }

        const onEnd = (_stopped: boolean) => {
            if (ENGINE_DEBUG_MODE) {
                console.log(`Audio file ${id} ${_stopped ? "was stopped" : "finished playing"}`);
            }
            if(!_stopped && options?.loop) {
                this.playSound(id, options);
                return;
            } else {
                if (this._audioInstances[audioType][id][randId])
                    delete this._audioInstances[audioType][id][randId];
                this._currentlyPlaying.splice(this._currentlyPlaying.indexOf(id));
            }
        };

        if (!this._audioInstances[audioType][id])
            this._audioInstances[audioType][id] = {};

        if (this.isMuted(audioType)) return "";

        if(this._currentlyPlaying.indexOf(id) !== -1) return "";
        this._currentlyPlaying.push(id);

        let mediaInstance: Promise<IMediaInstance> | IMediaInstance;
        const randId = Math.random().toString().slice(2);
        if(!this._audioInstances[AUDIO_TYPES.SFX][id]) {
            this._audioInstances[AUDIO_TYPES.SFX][id] = {};
        }
        try {
            if (!this.isLoaded(id)) {
                if (ENGINE_DEBUG_MODE) {
                    console.log(`Not loaded ${id}, loading...`);
                }
                sound.add(id, {
                    url: `assets/audio/${id}${getSupportedAudioFormat()}`,
                    autoPlay: true,
                    loaded: (_err, _sound, _mediaInstance) => {
                        if (_err || !_mediaInstance) {
                            console.error(_err || "No media instance!");
                        } else {
                            if (ENGINE_DEBUG_MODE) {
                                console.log(`Loaded ${id} audio file`);
                            }
                            mediaInstance = _mediaInstance;
                            mediaInstance.volume = options?.volume || 0.1;
                            mediaInstance.on("end", () => onEnd(false));
                            mediaInstance.on("stop", () => onEnd(true));
                        }
                    },
                    ...(options || {})
                });
            } else {
                mediaInstance = sound.play(id, options || {});
                if (HelperFunctions.isPromise(mediaInstance)) {
                    (mediaInstance as Promise<IMediaInstance>).then((_mediaInstance) => {
                        mediaInstance = _mediaInstance;
                        mediaInstance.on("end", () => onEnd(false));
                        mediaInstance.on("stop", () => onEnd(true));
                        this._audioInstances[AUDIO_TYPES.SFX][id][randId] = mediaInstance;
                    });
                } else {
                    (mediaInstance as IMediaInstance).on("end", () => onEnd(false));
                    (mediaInstance as IMediaInstance).on("stop", () => onEnd(true));
                    this._audioInstances[AUDIO_TYPES.SFX][id][randId] = mediaInstance;
                }
            }
        } catch (err) {
            console.warn(err);
            if(!mediaInstance) return "";
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
