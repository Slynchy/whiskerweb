// Written by ChatGPT

const DEBUG_FONT_LOG = false;

/**
 * Loads `assets/fonts/<fontName>.woff` and adds it to the document.
 * Rejects if the font file fails to load (e.g. 404), or if the font still isn't usable after `_timeoutMs`.
 * @param fontName
 * @param _timeoutMs Optional: how long to wait for the font to become usable after loading
 */
export function loadFont(fontName: string, _timeoutMs: number = 10000): Promise<void> {
    // Check if font is already loaded
    if (document.fonts.check(`1em "${fontName}"`)) {
        if(DEBUG_FONT_LOG) {
            console.log("Font %s already loaded", fontName);
        }
        return Promise.resolve();
    }

    // Create a FontFace object
    const font = new FontFace(fontName, `url(assets/fonts/${fontName}.woff)`);
    if(DEBUG_FONT_LOG) {
        console.log("Created fontface for %s", fontName);
    }

    // Load the font; a load error rejects the returned promise
    return font.load().then(loadedFont => {
        if(DEBUG_FONT_LOG) {
            console.log("Loaded font for %s", fontName);
        }
        // Add the loaded font to the document
        document.fonts.add(loadedFont);
        if(DEBUG_FONT_LOG) {
            console.log("Added font to doc for %s", fontName);
        }

        // Resolve when the font is available, giving up after _timeoutMs
        const deadline = Date.now() + _timeoutMs;
        return new Promise<void>((resolve, reject) => {
            const _try = () => {
                if(DEBUG_FONT_LOG) {
                    console.log("Waiting for font %s to be ready...", fontName);
                }
                document.fonts.ready.then(() => {
                    if (document.fonts.check(`1em "${fontName}"`)) {
                        if(DEBUG_FONT_LOG) {
                            console.log("Font %s ready to use!", fontName);
                        }
                        resolve();
                    } else if (Date.now() >= deadline) {
                        reject(new Error(`Font ${fontName} loaded but was not usable after ${_timeoutMs}ms`));
                    } else {
                        if(DEBUG_FONT_LOG) {
                            console.error("Font ready but not actually ready?! %s", fontName);
                        }
                        setTimeout(_try, 100);
                    }
                }, reject);
            };
            _try();
        });
    });
}