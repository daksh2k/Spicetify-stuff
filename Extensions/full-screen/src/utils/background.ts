import CFM from "./config";
import ICONS from "../constants";
import { Settings } from "../types/fullscreen";
import Utils from "./utils";
import { DOM } from "../ui/elements";
import ColorExtractor from "./colors";
import WebAPI from "../services/web-api";
import {
    animateCanvas,
    animateColor,
    animatedRotatedCanvas,
    modifyIsAnimationRunning,
} from "./animation";
import { ExtraControls } from "../ui/components/ExtraControls/ExtraControls";

export class Background {
    private static updateId = 0;

    static async updateBackground(meta: Partial<Record<string, unknown>>, fromResize = false) {
        const updateId = ++this.updateId;
        const isCurrent = () => updateId === this.updateId;
        const previousImg = DOM.backgroundImg.cloneNode() as HTMLImageElement;

        const settingValue = CFM.get("backgroundChoice") as Settings["backgroundChoice"];

        DOM.back.classList.toggle("animated", settingValue === "animated_album");
        modifyIsAnimationRunning(settingValue === "animated_album");

        switch (settingValue) {
            case "dynamic_color": {
                const nextColor = await Utils.getNextColor(
                    CFM.get("coloredBackChoice") as Settings["coloredBackChoice"],
                );
                if (!isCurrent()) return;
                this.updateMainColor(
                    Spicetify.Player.data.item?.metadata.image_xlarge_url,
                    meta as Partial<Record<string, string>>,
                );
                this.updateThemeColor(Spicetify.Player.data.item?.metadata.image_xlarge_url);
                animateColor(nextColor, DOM.back);
                break;
            }
            case "static_color":
                this.updateMainColor(
                    Spicetify.Player.data.item?.metadata.image_xlarge_url,
                    meta as Partial<Record<string, string>>,
                );
                this.updateThemeColor(Spicetify.Player.data.item?.metadata.image_xlarge_url);
                animateColor(CFM.get("staticBackChoice") as Settings["staticBackChoice"], DOM.back);
                break;
            case "artist_art":
                {
                    const imageUrl = await Utils.getImageAndLoad(
                    meta as Partial<Record<string, string>>,
                    );
                    if (!isCurrent()) return;
                    let painted = false;
                    const paint = () => {
                        if (painted || !isCurrent()) return;
                        painted = true;
                        DOM.backgroundImg.onload = null;
                        this.updateMainColor(imageUrl, meta as Partial<Record<string, string>>);
                        this.updateThemeColor(imageUrl);
                        animateCanvas(previousImg, DOM.backgroundImg, DOM.back, fromResize);
                    };
                    DOM.backgroundImg.onload = paint;
                    DOM.backgroundImg.src = imageUrl;
                    if (DOM.backgroundImg.complete && DOM.backgroundImg.naturalWidth) paint();
                }
                break;
            case "animated_album": {
                const imageUrl = meta?.image_xlarge_url as string;
                let painted = false;
                const paint = () => {
                    if (painted || !isCurrent()) return;
                    painted = true;
                    DOM.backgroundImg.onload = null;
                    this.updateMainColor(
                        Spicetify.Player.data.item?.metadata.image_xlarge_url,
                        meta as Partial<Record<string, string>>,
                    );
                    this.updateThemeColor(Spicetify.Player.data.item?.metadata?.image_xlarge_url);
                    animatedRotatedCanvas(DOM.back, DOM.backgroundImg);
                };
                DOM.backgroundImg.onload = paint;
                DOM.backgroundImg.src = imageUrl;
                if (DOM.backgroundImg.complete && DOM.backgroundImg.naturalWidth) paint();

                break;
            }
            case "album_art":
            default: {
                const imageUrl = meta?.image_xlarge_url as string;
                let painted = false;
                const paint = () => {
                    if (painted || !isCurrent()) return;
                    painted = true;
                    DOM.backgroundImg.onload = null;
                    this.updateMainColor(
                        Spicetify.Player.data.item?.metadata.image_xlarge_url,
                        meta as Partial<Record<string, string>>,
                    );
                    this.updateThemeColor(Spicetify.Player.data.item?.metadata?.image_xlarge_url);
                    animateCanvas(previousImg, DOM.backgroundImg, DOM.back, fromResize);
                };
                DOM.backgroundImg.onload = paint;
                DOM.backgroundImg.src = imageUrl;
                if (DOM.backgroundImg.complete && DOM.backgroundImg.naturalWidth) paint();
                break;
            }
        }
    }

    static async updateMainColor(imageURL: string, meta: Spicetify.Metadata) {
        switch (CFM.get("invertColors")) {
            case "always":
                DOM.container.style.setProperty("--main-color", "0,0,0");
                DOM.container.style.setProperty("--contrast-color", "255,255,255");
                break;
            case "auto": {
                let mainColor = "255,255,255",
                    contrastColor = "0,0,0";
                if (
                    CFM.get("backgroundChoice") === "album_art" &&
                    (meta?.album_uri?.split(":")[2] ?? "") in ExtraControls.INVERTED
                ) {
                    mainColor = ExtraControls.INVERTED[meta?.album_uri?.split(":")[2] ?? ""]
                        ? "0,0,0"
                        : "255,255,255";
                } else {
                    [mainColor, contrastColor] = await ColorExtractor.getMainColor(imageURL);
                }
                DOM.container.style.setProperty("--main-color", mainColor);
                DOM.container.style.setProperty("--contrast-color", contrastColor);
                if (CFM.get("extraControls") !== "never") {
                    DOM.invertButton.classList.remove("button-active");
                    DOM.invertButton.innerHTML = ICONS.INVERT_INACTIVE;
                }
                break;
            }
            case "never":
            default:
                DOM.container.style.setProperty("--main-color", "255,255,255");
                DOM.container.style.setProperty("--contrast-color", "0,0,0");
                break;
        }
    }

    //Set main theme color for the display
    static async updateThemeColor(imageURL: string) {
        if (
            !(
                CFM.get("backgroundChoice") == "dynamic_color" &&
                CFM.get("coloredBackChoice") == "VIBRANT"
            ) &&
            (CFM.get("themedButtons") || CFM.get("themedIcons"))
        ) {
            DOM.container.classList.toggle("themed-buttons", Boolean(CFM.get("themedButtons")));
            DOM.container.classList.toggle("themed-icons", Boolean(CFM.get("themedIcons")));
            let themeVibrantColor;
            const artColors = await WebAPI.colorExtractor(imageURL).catch((err) =>
                console.warn(err),
            );
            if (!artColors?.VIBRANT) themeVibrantColor = "175,175,175";
            else themeVibrantColor = Utils.hexToRgb(artColors.VIBRANT);
            DOM.container.style.setProperty("--theme-color", themeVibrantColor);
        } else {
            DOM.container.classList.remove("themed-buttons", "themed-icons");
            DOM.container.style.setProperty("--theme-color", "175,175,175");
        }
    }
}
