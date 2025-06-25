import WebAPI from "../services/web-api";
import CFM from "./config";
import { Settings } from "../types/fullscreen";
import Utils from "./utils";

class ColorExtractor {
    private static readonly DEFAULT_THRESHOLD_VALUE = 160;
    private static readonly DEFAULT_FALLBACK_COLOR = "0,0,0";
    private static readonly DYNAMIC_FALLBACK_COLOR = "#444444";
    private static readonly BRIGHTNESS_THRESHOLD = 0.3;

    // RGB color coefficients for luminance calculation
    private static readonly LUMINANCE_COEFFICIENTS = {
        RED: 0.299,
        GREEN: 0.587,
        BLUE: 0.114,
    };

    /**
     * Extracts and determines the main color and contrast color based on image and user settings
     * @param imageURL - URL of the image to extract colors from
     * @returns Promise resolving to [mainColor, contrastColor] as RGB strings
     */
    static async getMainColor(imageURL: string): Promise<[string, string]> {
        const imageColors = await WebAPI.colorExtractor(imageURL).catch((err) => {
            console.warn("Color extraction failed:", err);
            return null;
        });

        const backgroundChoice = CFM.get("backgroundChoice");
        let imageProminentColor: string;
        let thresholdValue = this.DEFAULT_THRESHOLD_VALUE;

        // Determine prominent color and threshold based on background choice
        switch (backgroundChoice) {
            case "album_art":
            case "artist_art":
                imageProminentColor = this.getAlbumArtColor(imageColors);
                thresholdValue = this.calculateBrightnessAdjustedThreshold();
                break;
            case "dynamic_color":
                imageProminentColor = this.getDynamicColor(imageColors);
                break;
            case "static_color":
                imageProminentColor = this.getStaticColor();
                break;
            default:
                imageProminentColor = this.DEFAULT_FALLBACK_COLOR;
        }

        const isLightBackground = this.calculateBackgroundLightness(
            imageProminentColor,
            thresholdValue,
        );
        const shouldUseBrightnessCheck =
            backgroundChoice === "album_art" || backgroundChoice === "artist_art";

        return this.determineColors(isLightBackground, shouldUseBrightnessCheck);
    }

    /**
     * Extracts color from album or artist art
     */
    private static getAlbumArtColor(imageColors: any): string {
        if (!imageColors?.PROMINENT) {
            return this.DEFAULT_FALLBACK_COLOR;
        }
        return Utils.hexToRgb(imageColors.PROMINENT) ?? this.DEFAULT_FALLBACK_COLOR;
    }

    /**
     * Gets dynamic color based on user's colored background choice
     */
    private static getDynamicColor(imageColors: any): string {
        const coloredBackChoice = CFM.get("coloredBackChoice") as Settings["coloredBackChoice"];

        if (!imageColors || !imageColors[coloredBackChoice]) {
            return Utils.hexToRgb(this.DYNAMIC_FALLBACK_COLOR) ?? this.DEFAULT_FALLBACK_COLOR;
        }

        return Utils.hexToRgb(imageColors[coloredBackChoice]) ?? this.DEFAULT_FALLBACK_COLOR;
    }

    /**
     * Gets static color from user settings
     */
    private static getStaticColor(): string {
        const staticBackChoice = CFM.get("staticBackChoice") as Settings["staticBackChoice"];
        return Utils.hexToRgb(staticBackChoice) ?? this.DEFAULT_FALLBACK_COLOR;
    }

    /**
     * Calculates brightness-adjusted threshold for album/artist art modes
     */
    private static calculateBrightnessAdjustedThreshold(): number {
        const backgroundBrightness = CFM.get(
            "backgroundBrightness",
        ) as Settings["backgroundBrightness"];
        return 260 - backgroundBrightness * 100;
    }

    /**
     * Determines if background is light based on luminance calculation
     */
    private static calculateBackgroundLightness(rgbColor: string, threshold: number): boolean {
        const [red, green, blue] = rgbColor.split(",").map(Number);
        const luminance =
            red * this.LUMINANCE_COEFFICIENTS.RED +
            green * this.LUMINANCE_COEFFICIENTS.GREEN +
            blue * this.LUMINANCE_COEFFICIENTS.BLUE;
        return luminance > threshold;
    }

    /**
     * Determines final main and contrast colors based on background lightness and mode
     */
    private static determineColors(
        isLightBackground: boolean,
        shouldUseBrightnessCheck: boolean,
    ): [string, string] {
        const darkColor = "0,0,0";
        const lightColor = "255,255,255";

        if (shouldUseBrightnessCheck) {
            // For album_art and artist_art: consider both background lightness and brightness setting
            const brightnessThreshold =
                Number(CFM.get("backgroundBrightness")) > this.BRIGHTNESS_THRESHOLD;
            const useDarkText = isLightBackground && brightnessThreshold;

            return useDarkText ? [darkColor, lightColor] : [lightColor, darkColor];
        } else {
            // For dynamic_color and static_color: only consider background lightness
            return isLightBackground ? [darkColor, lightColor] : [lightColor, darkColor];
        }
    }
}

export default ColorExtractor;
