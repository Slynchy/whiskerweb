export function getNearest4to3Resolution(width: number, height: number) {
    const portrait = height > width;
    const resolutions = [
        { width: 640, height: 480 },
        { width: 800, height: 600 },
        { width: 1024, height: 768 },
        { width: 1152, height: 864 },
        { width: 1280, height: 960 },
        { width: 1400, height: 1050 },
        { width: 1600, height: 1200 },
    ];

    for(let i = resolutions.length-1; i >= 0; i--) {
        const curr = resolutions[i];
        if(!portrait) {
            if(
                height >= curr.height
            ) {
                return { width: curr.width, height: curr.height };
            }
        } else {
            if(
                width >= curr.width
            ) {
                return { width: curr.width, height: curr.height };
            }
        }
    }
    return { width: resolutions[0].width, height: resolutions[0].height };
}