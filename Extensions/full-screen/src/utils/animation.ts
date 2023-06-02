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

let isAnimationRunning = false;

export const modifyIsAnimationRunning = (value: boolean) => {
    isAnimationRunning = value;
};

let rotationSpeed = CFM.get("animationSpeed") as Settings["animationSpeed"];

export const modifyRotationSpeed = (value: number) => {
    rotationSpeed = value;
};

//todo: fix high resource usage when re rendering on setting change
export function animatedRotatedCanvas(back: HTMLCanvasElement, bgImg: HTMLImageElement) {
    const ctx = back.getContext("2d") as CanvasRenderingContext2D;

    back.width = window.innerWidth;
    back.height = window.innerHeight;

    const blur = Math.max(CFM.get("blurSize") as Settings["blurSize"], 28);
    const brightness = Math.min(
        CFM.get("backgroundBrightness") as Settings["backgroundBrightness"],
        0.7
    );

    ctx.filter = `saturate(2) brightness(${brightness}) blur(${blur}px)`;

    const radius = Math.min(back.width, back.height);

    let rotationAngle = 0;

    // let lastFrameTime1 = performance.now();
    // let frameCount = 0;

    function draw() {
        ctx.clearRect(0, 0, back.width, back.height);

        ctx.save();
        ctx.translate(0, 0);
        ctx.rotate(((2 * Math.PI) / 360) * rotationAngle);
        ctx.drawImage(bgImg, -radius, -radius, radius * 2, radius * 2);
        ctx.restore();

        ctx.save();
        ctx.translate(back.width / 2, 0);
        ctx.rotate(((2 * Math.PI) / 360) * rotationAngle + Math.PI);
        ctx.drawImage(bgImg, -radius, -radius, radius * 2, radius * 2);
        ctx.restore();

        rotationAngle += rotationSpeed;

        // //Calculate the frame rate
        // const now = performance.now();
        // const deltaTime = now - lastFrameTime1;
        // frameCount++;
        // if (deltaTime >= 1000) {
        //     const fps = Math.round((frameCount * 1000) / deltaTime);
        //     console.log(`Frame rate: ${fps} fps`);
        //     frameCount = 0;
        //     lastFrameTime1 = now;
        // }

        if (isAnimationRunning) requestAnimationFrame(draw);
    }
    isAnimationRunning = true;
    draw();
}

// limited frames animation,logic
// TODO: fix flickering
let lastFrameTime = performance.now();
export function animatedRotatedCanvasV2(back: HTMLCanvasElement, bgImg: HTMLImageElement) {
    const ctx = back.getContext("2d") as CanvasRenderingContext2D;

    back.width = window.innerWidth;
    back.height = window.innerHeight;

    const blur = Math.max(CFM.get("blurSize") as Settings["blurSize"], 28);
    const brightness = Math.min(
        CFM.get("backgroundBrightness") as Settings["backgroundBrightness"],
        0.7
    );

    ctx.filter = `saturate(2) brightness(${brightness}) blur(${blur}px)`;

    const radius = Math.min(back.width, back.height);

    let rotationAngle = 0;

    const frameRate = 30;
    const frameInterval = 1000 / frameRate;

    function draw() {
        if (isAnimationRunning) requestAnimationFrame(draw);

        const now = performance.now();
        const deltaTime = now - lastFrameTime;

        if (deltaTime >= frameInterval) {
            lastFrameTime = now - (deltaTime % frameInterval);
            ctx.clearRect(0, 0, back.width, back.height);
            ctx.save();
            ctx.translate(0, 0);
            ctx.rotate(((2 * Math.PI) / 360) * rotationAngle);
            ctx.drawImage(bgImg, -radius, -radius, radius * 2, radius * 2);
            ctx.restore();

            ctx.save();
            ctx.translate(back.width / 2, 0);
            ctx.rotate(((2 * Math.PI) / 360) * rotationAngle + Math.PI);
            ctx.drawImage(bgImg, -radius, -radius, radius * 2, radius * 2);
            ctx.restore();

            rotationAngle += rotationSpeed;
        }
    }
    isAnimationRunning = true;
    draw();
}

const offscreenCanvas = document.createElement("canvas");

// TODO Test this, fix high resource usage on song change
export function animatedRotatedCanvasOptimized(back: HTMLCanvasElement, bgImg: HTMLImageElement) {
    const offscreenCtx = offscreenCanvas.getContext("2d") as CanvasRenderingContext2D;
    const ctx = back.getContext("2d") as CanvasRenderingContext2D;

    offscreenCanvas.width = window.innerWidth;
    offscreenCanvas.height = window.innerHeight;

    back.width = window.innerWidth;
    back.height = window.innerHeight;

    const blur = Math.max(CFM.get("blurSize") as Settings["blurSize"], 32);
    const brightness = Math.min(
        CFM.get("backgroundBrightness") as Settings["backgroundBrightness"],
        0.7
    );

    offscreenCtx.filter = `saturate(2) brightness(${brightness}) blur(${blur}px)`;

    const radius = Math.min(offscreenCanvas.width, offscreenCanvas.height);

    let rotationAngle = 0;
    const rotationSpeed = 0.25; // Adjust the rotation speed here (smaller value for slower rotation)

    let lastFrameTime = performance.now();
    let frameCount = 0;

    function draw() {
        offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

        // Draw the background image
        offscreenCtx.save();
        offscreenCtx.translate(0, 0);
        offscreenCtx.rotate(((2 * Math.PI) / 360) * rotationAngle);
        offscreenCtx.drawImage(bgImg, -radius, -radius, radius * 2, radius * 2);
        offscreenCtx.restore();

        // Draw the colored image
        offscreenCtx.save();
        offscreenCtx.translate(offscreenCanvas.width, 0);
        offscreenCtx.rotate(((2 * Math.PI) / 360) * rotationAngle);
        offscreenCtx.drawImage(bgImg, -radius, -radius, radius * 2, radius * 2);
        offscreenCtx.restore();

        rotationAngle += rotationSpeed;

        // Calculate the frame rate
        const now = performance.now();
        const deltaTime = now - lastFrameTime;
        frameCount++;
        if (deltaTime >= 1000) {
            const fps = Math.round((frameCount * 1000) / deltaTime);
            console.log(`Frame rate: ${fps} fps`);
            frameCount = 0;
            lastFrameTime = now;
        }

        // Copy the off-screen canvas onto the visible canvas
        ctx.clearRect(0, 0, back.width, back.height);
        ctx.drawImage(offscreenCanvas, 0, 0);

        if (isAnimationRunning) requestAnimationFrame(draw);
    }
    isAnimationRunning = true;
    draw();
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
