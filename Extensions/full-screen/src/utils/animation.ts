import { Settings } from "../types/fullscreen";
import CFM from "./config";

export function animateCanvas(
    prevImg: HTMLImageElement,
    nextImg: HTMLImageElement,
    back: HTMLCanvasElement,
    fromResize = false
) {
    const configTransitionTime = CFM.get("backAnimationTime") as Settings["backAnimationTime"];
    const { innerWidth: width, innerHeight: height } = window;
    back.width = width;
    back.height = height;

    const ctx = back.getContext("2d") as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    const blur = CFM.get("blurSize") as Settings["blurSize"];
    ctx.filter = `brightness(${CFM.get("backgroundBrightness")}) blur(${blur}px)`;

    const vals = getSizeValues(width, height, nextImg.width, nextImg.height);
    const x = vals.x - blur * 2;
    const y = vals.y - blur * 2;
    const sizeX = vals.width + blur * 4;
    const sizeY = vals.height + blur * 4;

    if (!CFM.get("enableFade") || fromResize) {
        ctx.globalAlpha = 1;
        ctx.drawImage(nextImg, x, y, sizeX, sizeY);
        return;
    }

    let prevTimeStamp: number,
        start: number,
        done = false;

    const animate = (timestamp: number) => {
        if (start === undefined) start = timestamp;

        const elapsed = timestamp - start;

        if (prevTimeStamp !== timestamp) {
            const factor = Math.min(elapsed / (configTransitionTime * 1000), 1.0);
            ctx.globalAlpha = 1;
            ctx.drawImage(prevImg, x, y, sizeX, sizeY);
            ctx.globalAlpha = Math.sin((Math.PI / 2) * factor);
            ctx.drawImage(nextImg, x, y, sizeX, sizeY);
            if (factor === 1.0) done = true;
        }
        if (elapsed < configTransitionTime * 1000) {
            prevTimeStamp = timestamp;
            !done && requestAnimationFrame(animate);
        }
    };

    requestAnimationFrame(animate);
}

let prevColor = "#000000";
export async function animateColor(nextColor: string, back: HTMLCanvasElement, fromConfig = false) {
    const configTransitionTime = CFM.get("backAnimationTime") as Settings["backAnimationTime"];
    const { innerWidth: width, innerHeight: height } = window;
    back.width = width;
    back.height = height;

    const ctx = back.getContext("2d") as CanvasRenderingContext2D;

    if (!CFM.get("enableFade") || fromConfig) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = nextColor;
        ctx.fillRect(0, 0, width, height);
        return;
    }

    let previousTimeStamp: number,
        done = false,
        start: number;
    const animate = (timestamp: number) => {
        if (start === undefined) start = timestamp;
        const elapsed = timestamp - start;

        if (previousTimeStamp !== timestamp) {
            const factor = Math.min(elapsed / (configTransitionTime * 1000), 1.0);
            ctx.globalAlpha = 1;
            ctx.fillStyle = prevColor;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = Math.sin((Math.PI / 2) * factor);
            ctx.fillStyle = nextColor;
            ctx.fillRect(0, 0, width, height);
            if (factor === 1.0) done = true;
        }
        if (elapsed < configTransitionTime * 1000) {
            previousTimeStamp = timestamp;
            !done && requestAnimationFrame(animate);
        } else {
            prevColor = nextColor;
        }
    };

    requestAnimationFrame(animate);
}

function getSizeValues(
    parentWidth: number,
    parentHeight: number,
    childWidth: number,
    childHeight: number
) {
    const doRatio = childWidth / childHeight;
    const cRatio = parentWidth / parentHeight;
    let width = parentWidth;
    let height = parentHeight;

    if (doRatio < cRatio) {
        height = width / doRatio;
    } else {
        width = height * doRatio;
    }

    return {
        width,
        height,
        x: (parentWidth - width) / 2,
        y: (parentHeight - height) / 2,
    };
}
