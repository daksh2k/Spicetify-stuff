import ICONS from "../constants";
import { TOP_BAR_SELECTOR, EXTRA_BAR_SELECTOR } from "../constants/selectors";
import WebAPI from "../services/web-api";
import CFM from "./config";
import { Settings } from "../types/fullscreen";

let prevUriObj: Spicetify.URI;

class Utils {
    static allNotExist() {
        const extraBar = document.querySelector(EXTRA_BAR_SELECTOR)?.childNodes[0];
        const topBar = document.querySelector(TOP_BAR_SELECTOR);

        const entriesToVerify = {
            "Top Bar Component": topBar,
            "Extra Bar Component": extraBar,
            "Spicetify CosmosAsync": Spicetify.CosmosAsync,
            "Spicetify Mousetrap": Spicetify.Mousetrap,
            "Spicetify Player": Spicetify.Player,
            "Spicetify Platform": Spicetify.Platform,
        };

        return Object.entries(entriesToVerify).filter(([, val]) => !val);
    }

    static printNotExistings(entriesNotPresent: [string, unknown][]) {
        entriesNotPresent.forEach((entry: [string, unknown]) => {
            console.error(
                `${entry[0]} not available. Report issue on GitHub or run Spicetify.test() to test.`
            );
            Spicetify.showNotification(
                `Error initializing "fullscreen.js" extension. ${entry[0]} not available. Report issue on GitHub.`
            );
        });
        console.log("Retries exceeded. Aborting.");
    }

    static fullScreenOn() {
        if (!document.fullscreen) return document.documentElement.requestFullscreen();
    }

    static fullScreenOff() {
        if (document.fullscreen) return document.exitFullscreen();
    }

    /**
     * Add fade animation on button click
     * @param element The element to add fade animation
     * @param animClass Fade animation type class
     */
    static fadeAnimation(element: HTMLElement, animClass = "fade-do") {
        element.classList.remove(animClass);
        element.classList.add(animClass);
        setTimeout(() => {
            element.classList.remove(animClass);
        }, 800);
    }

    // Utility function to add a observer with wait for element support
    static addObserver(
        observer: MutationObserver,
        selector: string,
        options: MutationObserverInit
    ) {
        const ele = document.querySelector(selector);
        if (!ele) {
            setTimeout(() => {
                Utils.addObserver(observer, selector, options);
            }, 2000);
            return;
        }
        observer.observe(ele, options);
    }

    // Converting hex to rgb
    static hexToRgb(hex: string) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
            : null;
    }

    static trimTitle(title: string) {
        const trimmedTitle = title
            .replace(/\(.+?\)/g, "")
            .replace(/\[.+?\]/g, "")
            .replace(/\s-\s.+?$/, "")
            .trim();
        if (!trimmedTitle) return title;
        return trimmedTitle;
    }

    static async getAlbumReleaseDate(albumURI: string, locale: string) {
        const albumInfo = await WebAPI.getAlbumInfo(albumURI.replace("spotify:album:", "")).catch(
            (err) => console.error(err)
        );
        if (!albumInfo?.release_date) return "";
        const albumDate = new Date(albumInfo.release_date);
        const recentDate = new Date();
        recentDate.setMonth(recentDate.getMonth() - 18);
        const dateStr = albumDate.toLocaleString(
            locale,
            albumDate > recentDate ? { year: "numeric", month: "short" } : { year: "numeric" }
        );
        return " • " + dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }
    static async getImageAndLoad(meta: Spicetify.Metadata) {
        if (meta.artist_uri == null) return meta.image_xlarge_url;
        let arUri = meta.artist_uri.split(":")[2];
        if (meta.artist_uri.split(":")[1] === "local") {
            const res = await WebAPI.searchArt(meta.artist_name).catch((err) => console.error(err));
            arUri = res ? res.artists.items[0].id : "";
        }
        const artistInfo = await WebAPI.getArtistInfo(arUri).catch((err) => console.error(err));
        return artistInfo?.visuals?.headerImage?.sources[0].url ?? meta.image_xlarge_url;
    }

    static async getNextColor(colorChoice: string) {
        let nextColor = "#444444";
        const imageColors = await WebAPI.colorExtractor(
            Spicetify.Player.data.track?.uri ?? ""
        ).catch((err) => console.warn(err));
        if (imageColors && imageColors[colorChoice]) nextColor = imageColors[colorChoice];
        return nextColor;
    }

    static revertPathHistory(originalLocation: string) {
        Spicetify.Platform.History.push(originalLocation);
        Spicetify.Platform.History.entries.splice(Spicetify.Platform.History.entries.length - 3, 2);
        Spicetify.Platform.History.index =
            Spicetify.Platform.History.index > 0 ? Spicetify.Platform.History.index - 2 : -1;
        Spicetify.Platform.History.length =
            Spicetify.Platform.History.length > 1 ? Spicetify.Platform.History.length - 2 : 0;
    }

    // Return the total time left to show the upnext timer
    static getShowTime(upnextTime: number) {
        const showBefore = upnextTime * 1000;
        const dur = Spicetify.Player.data.duration;
        const curProg = Spicetify.Player.getProgress();

        if (dur - curProg <= showBefore) return -1;
        else return dur - showBefore - curProg;
    }

    static isModeActivated(): boolean {
        return document.body.classList.contains("fsd-activated");
    }

    static overlayBack(hideBackground = true) {
        const overlay = document.querySelector("body > generic-modal > div");
        if (overlay) {
            hideBackground
                ? overlay.classList.add("transparent-bg")
                : overlay.classList.remove("transparent-bg");
        }
    }

    // Translation string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static getAvailableLanguages(translations: Record<string, any>) {
        const languages: Record<string, string> = {};
        for (const lang in translations) {
            languages[lang] = translations[lang].langName;
        }
        return languages;
    }

    static async getMainColor(imageURL: string) {
        let imageProminentColor,
            thresholdValue = 160;
        const imageColors = await WebAPI.colorExtractor(imageURL).catch((err) => console.warn(err));

        if (
            CFM.get("backgroundChoice") === "album_art" ||
            CFM.get("backgroundChoice") === "artist_art"
        ) {
            if (!imageColors?.PROMINENT) imageProminentColor = "0,0,0";
            else imageProminentColor = Utils.hexToRgb(imageColors.PROMINENT);
            thresholdValue =
                260 - (CFM.get("backgroundBrightness") as Settings["backgroundBrightness"]) * 100;
        } else if (CFM.get("backgroundChoice") === "dynamic_color") {
            if (
                !imageColors ||
                !imageColors[CFM.get("coloredBackChoice") as Settings["coloredBackChoice"]]
            )
                imageProminentColor = Utils.hexToRgb("#444444");
            else
                imageProminentColor = Utils.hexToRgb(
                    imageColors[CFM.get("coloredBackChoice") as Settings["coloredBackChoice"]]
                );
        } else if (CFM.get("backgroundChoice") === "static_color") {
            imageProminentColor = Utils.hexToRgb(
                CFM.get("staticBackChoice") as Settings["staticBackChoice"]
            );
        }
        const isLightBG =
            Number(imageProminentColor?.split(",")[0]) * 0.299 +
                Number(imageProminentColor?.split(",")[1]) * 0.587 +
                Number(imageProminentColor?.split(",")[2]) * 0.114 >
            thresholdValue;
        const mainColor =
            isLightBG && Number(CFM.get("backgroundBrightness")) > 0.3 ? "0,0,0" : "255,255,255";
        const contrastColor =
            isLightBG && Number(CFM.get("backgroundBrightness")) > 0.3 ? "255,255,255" : "0,0,0";
        return [mainColor, contrastColor];
    }

    // Translation strings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async getContext(STRINGS: Record<string, any>): Promise<Record<string, string>> {
        let ctxIcon = "",
            ctxSource,
            ctxName;
        if (Spicetify.Player.data.track?.provider === "queue") {
            ctxIcon = ICONS.CTX_QUEUE;
            ctxSource = STRINGS.context.queue;
            ctxName = "";
        } else {
            const uriObj = Spicetify.URI.fromString(Spicetify.Player.data.context_uri);
            if (
                JSON.stringify(uriObj) === JSON.stringify(prevUriObj) &&
                ctxSource != undefined &&
                ctxName != undefined
            )
                return { ctxIcon, ctxSource, ctxName };
            prevUriObj = uriObj;
            switch (uriObj.type) {
                case Spicetify.URI.Type.TRACK:
                    ctxIcon = ICONS.CTX_TRACK;
                    ctxSource = STRINGS.context.track;
                    await WebAPI.getTrackInfo(uriObj._base62Id ? uriObj._base62Id : uriObj.id).then(
                        (meta) => (ctxName = `${meta.name}  •  ${meta.artists[0].name}`)
                    );
                    break;
                case Spicetify.URI.Type.SEARCH:
                    ctxIcon = Spicetify.SVGIcons["search-active"];
                    ctxSource = STRINGS.context.search;
                    ctxName = `"${uriObj.query}" in ${STRINGS.context.searchDest}`;
                    break;
                case Spicetify.URI.Type.COLLECTION:
                    ctxIcon = Spicetify.SVGIcons["heart-active"];
                    ctxSource = STRINGS.context.collection;
                    ctxName = STRINGS.context.likedSongs;
                    break;
                case Spicetify.URI.Type.PLAYLIST_V2:
                    ctxIcon = Spicetify.SVGIcons["playlist"];
                    ctxSource = STRINGS.context.playlist;
                    ctxName = Spicetify.Player.data.context_metadata?.context_description || "";
                    break;

                case Spicetify.URI.Type.STATION:
                case Spicetify.URI.Type.RADIO:
                    ctxIcon = ICONS.CTX_RADIO;
                    switch (uriObj.args[0]) {
                        case "album":
                            ctxSource = STRINGS.context.albumRadio;
                            await WebAPI.getAlbumInfo(uriObj.args[1]).then(
                                (meta) => (ctxName = meta.name)
                            );
                            break;
                        case "track":
                            ctxSource = STRINGS.context.trackRadio;
                            await WebAPI.getTrackInfo(uriObj.args[1]).then(
                                (meta) => (ctxName = `${meta.name}  •  ${meta.artists[0].name}`)
                            );
                            break;
                        case "artist":
                            ctxSource = STRINGS.context.artistRadio;
                            await WebAPI.getArtistInfo(uriObj.args[1]).then(
                                (meta) => (ctxName = meta?.profile?.name)
                            );
                            break;
                        case "playlist":
                        case "playlist-v2":
                            ctxSource = STRINGS.context.playlistRadio;
                            ctxIcon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M16.94 6.9l-1.4 1.46C16.44 9.3 17 10.58 17 12s-.58 2.7-1.48 3.64l1.4 1.45C18.22 15.74 19 13.94 19 12s-.8-3.8-2.06-5.1zM23 12c0-3.12-1.23-5.95-3.23-8l-1.4 1.45C19.97 7.13 21 9.45 21 12s-1 4.9-2.64 6.55l1.4 1.45c2-2.04 3.24-4.87 3.24-8zM7.06 17.1l1.4-1.46C7.56 14.7 7 13.42 7 12s.6-2.7 1.5-3.64L7.08 6.9C5.78 8.2 5 10 5 12s.8 3.8 2.06 5.1zM1 12c0 3.12 1.23 5.95 3.23 8l1.4-1.45C4.03 16.87 3 14.55 3 12s1-4.9 2.64-6.55L4.24 4C2.24 6.04 1 8.87 1 12zm9-3.32v6.63l5-3.3-5-3.3z"></path></svg>`;
                            await WebAPI.getPlaylistInfo("spotify:playlist:" + uriObj.args[1]).then(
                                (meta) => (ctxName = meta.playlist.name)
                            );
                            break;
                        default:
                            ctxName = "";
                    }
                    break;

                case Spicetify.URI.Type.PLAYLIST:
                    ctxIcon = Spicetify.SVGIcons[uriObj.type];
                    ctxSource = STRINGS.context.playlist;
                    ctxName = Spicetify.Player.data.context_metadata.context_description || "";
                    break;
                case Spicetify.URI.Type.ALBUM:
                    ctxIcon = Spicetify.SVGIcons[uriObj.type];
                    ctxSource = STRINGS.context.album;
                    ctxName = Spicetify.Player.data.context_metadata.context_description || "";
                    break;

                case Spicetify.URI.Type.ARTIST:
                    ctxIcon = Spicetify.SVGIcons[uriObj.type];
                    ctxSource = STRINGS.context.artist;
                    ctxName = Spicetify.Player.data.context_metadata.context_description || "";
                    break;

                case Spicetify.URI.Type.FOLDER: {
                    ctxIcon = Spicetify.SVGIcons["playlist-folder"];
                    ctxSource = STRINGS.context.playlistFolder;
                    const res = await Spicetify.CosmosAsync.get(`sp://core-playlist/v1/rootlist`, {
                        policy: { folder: { rows: true, link: true, name: true } },
                    });
                    for (const item of res.rows) {
                        if (
                            item.type === "folder" &&
                            item.link === Spicetify.Player.data.context_uri
                        ) {
                            ctxName = item.name;
                            break;
                        }
                    }
                    break;
                }
                default:
                    ctxSource = uriObj.type;
                    ctxName = Spicetify.Player.data?.context_metadata?.context_description || "";
            }
        }
        return { ctxIcon, ctxSource, ctxName };
    }
}

export default Utils;
