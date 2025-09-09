/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ReactDOM from "react-dom";
import React from "react";

import Utils from "./utils/utils";
import ColorExtractor from "./utils/colors";
import CFM from "./utils/config";
import {
    animateCanvas,
    animateColor,
    animatedRotatedCanvas,
    modifyIsAnimationRunning,
    modifyRotationSpeed,
} from "./utils/animation";
import { headerText, getSettingCard, createAdjust, getAboutSection } from "./utils/setting";

import translations from "./resources/strings";
import ICONS, {
    DEFAULTS,
    CLASSES_TO_ADD,
    EXTRA_BAR_SELECTOR,
    TOP_BAR_SELECTOR,
    TOP_BAR_SELECTOR_GLOBAL_NAVBAR,
} from "./constants";
import { Config, Settings } from "./types/fullscreen";

import WebAPI from "./services/web-api";
import showWhatsNew from "./services/whats-new";
import { getHtmlContent } from "./services/html-creator";
import { initMoustrapRecord } from "./services/mousetrap-record";

import SeekableProgressBar from "./ui/components/ProgressBar/ProgressBar";
import SeekableVolumeBar from "./ui/components/VolumeBar/VolumeBar";
import OverviewCard from "./ui/components/OverviewPopup/OverviewCard";

import { settingsStyles } from "./styles/settings";
import "./styles/base.scss";
import "./styles/tvMode.scss";
import "./styles/defaultMode.scss";
import "./styles/settings.scss";

async function main() {
    let INIT_RETRIES = 0;
    let entriesNotPresent = Utils.allNotExist();

    while (entriesNotPresent.length > 0) {
        if (INIT_RETRIES > 100) {
            Utils.printNotExistings(entriesNotPresent);
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
        entriesNotPresent = Utils.allNotExist();
        INIT_RETRIES += 1;
    }

    // Start from here
    showWhatsNew();
    initMoustrapRecord(Spicetify.Mousetrap);

    if (CFM.getGlobal("activationTypes") !== "btns") {
        if (CFM.getGlobal("keyActivation") !== "def") Spicetify.Mousetrap.bind("t", openwithTV);
        if (CFM.getGlobal("keyActivation") !== "tv") Spicetify.Mousetrap.bind("f", openwithDef);
    }

    function openwithTV() {
        if (!Utils.isModeActivated() || !CFM.getGlobal("tvMode") || CFM.getMode() !== "tv") {
            if (!CFM.getGlobal("tvMode") || CFM.getMode() !== "tv") {
                CFM.setGlobal("tvMode", true);
                CFM.setMode("tv");
                render();
            }
            activate();
        } else deactivate();
    }

    function openwithDef() {
        if (!Utils.isModeActivated() || CFM.getGlobal("tvMode") || CFM.getMode() === "tv") {
            if (CFM.getGlobal("tvMode") || CFM.getMode() === "tv") {
                CFM.setGlobal("tvMode", false);
                CFM.setMode("def");
                render();
            }
            activate();
        } else deactivate();
    }

    if (localStorage.getItem("full-screen:inverted") === null) {
        localStorage.setItem("full-screen:inverted", "{}");
    }

    const INVERTED = JSON.parse(localStorage.getItem("full-screen:inverted") ?? "{}");

    let LOCALE: string = CFM.getGlobal("locale") as Config["locale"];

    const style = document.createElement("style");

    const container = document.createElement("div");
    container.id = "full-screen-display";
    container.classList.add("Video", "VideoPlayer--fullscreen", "VideoPlayer--landscape");

    let cover: HTMLElement,
        back: HTMLCanvasElement,
        title: HTMLElement,
        artist: HTMLElement,
        album: HTMLElement,
        play: HTMLElement,
        ctx_container: HTMLElement,
        ctx_icon: HTMLElement,
        ctx_source: HTMLElement,
        ctx_name: HTMLElement,
        fsd_myUp: HTMLElement,
        fsd_nextCover: HTMLElement,
        fsd_up_next_text: HTMLElement,
        fsd_next_tit_art: HTMLElement,
        fsd_next_tit_art_inner: HTMLElement,
        fsd_first_span: HTMLElement,
        fsd_second_span: HTMLElement,
        playingIcon: HTMLElement,
        pausedIcon: HTMLElement,
        nextControl: HTMLElement,
        backControl: HTMLElement,
        heart: HTMLElement,
        shuffle: HTMLElement,
        repeat: HTMLElement,
        queue: HTMLElement | null,
        invertButton: HTMLElement,
        lyrics: HTMLElement;

    const coverImg = new Image();
    const backgroundImg = new Image();

    function render() {
        container.classList.toggle("lyrics-active", Boolean(CFM.get("lyricsDisplay")));
        // if (CFM.get("sidebarQueue")) {
        Utils.toggleQueuePanel(queue, false);
        // }
        container.classList.toggle(
            "vertical-mode",
            (CFM.get("verticalMonitorSupport") as Settings["verticalMonitorSupport"]) &&
                window.innerWidth < window.innerHeight,
        );
        document.body.classList.toggle(
            "vertical-mode",
            (CFM.get("verticalMonitorSupport") as Settings["verticalMonitorSupport"]) &&
                window.innerWidth < window.innerHeight,
        );
        container.setAttribute("data-locale", LOCALE);
        container.setAttribute("mode", CFM.getMode());
        if (!CFM.get("lyricsDisplay") || CFM.get("extraControls") === "never")
            container.classList.remove("lyrics-hide-force");

        Spicetify.Player.removeEventListener("songchange", updateInfo);
        Spicetify.Player.removeEventListener("onplaypause", updatePlayerControls);
        Spicetify.Player.removeEventListener("onplaypause", updatePlayingIcon);
        document.removeEventListener("fullscreenchange", fullScreenListener);
        Spicetify.Platform.PlayerAPI._events.removeListener("update", updateExtraControls);
        heartObserver.disconnect();

        Spicetify.Platform.PlayerAPI._events.removeListener("queue_update", updateUpNext);
        Spicetify.Platform.PlayerAPI._events.removeListener("update", updateUpNextShow);
        window.removeEventListener("resize", resizeEvents);
        upNextShown = false;

        modifyIsAnimationRunning(false);
        // resetCanvas(back);

        if (origLoc !== "/lyrics-plus" && Utils.isModeActivated()) {
            Utils.revertPathHistory(origLoc);
        }
        window.dispatchEvent(new Event("fad-request"));
        window.removeEventListener("lyrics-plus-update", handleLyricsUpdate);

        handleMouseMoveDeactivation();

        style.innerHTML = `
        #full-screen-display {
            --lyrics-alignment: ${CFM.get("lyricsAlignment")};
            --right-margin-lyrics: ${getRightMarginLyrics()};
            --icons-display: ${CFM.get("icons") ? "inline-block" : "none"};
            --fs-transition: ${CFM.get("backAnimationTime")}s;
       }
       `;

        function getRightMarginLyrics() {
            switch (CFM.get("lyricsAlignment")) {
                case "left":
                    return "50px";
                case "center":
                    return "0px";
                case "right":
                    return "-50px";
            }
        }

        container.innerHTML = getHtmlContent(container.classList.contains("lyrics-hide-force"));

        back = container.querySelector("canvas")!;
        back.width = window.innerWidth;
        back.height = window.innerHeight;

        cover = container.querySelector("#fsd-art-image")!;
        title = container.querySelector("#fsd-title span")!;
        artist = container.querySelector("#fsd-artist span")!;
        album = container.querySelector("#fsd-album span")!;

        if (CFM.get("contextDisplay") !== "never") {
            ctx_container = container.querySelector("#fsd-ctx-container")!;
            ctx_icon = container.querySelector("#fsd-ctx-icon")!;
            ctx_source = container.querySelector("#fsd-ctx-source")!;
            ctx_name = container.querySelector("#fsd-ctx-name")!;
        }
        if (CFM.get("upnextDisplay") !== "never") {
            fsd_myUp = container.querySelector("#fsd-upnext-container")!;
            fsd_myUp.onclick = Spicetify.Player.next;
            fsd_nextCover = container.querySelector("#fsd_next_art_image")!;
            fsd_up_next_text = container.querySelector("#fsd_up_next_text")!;
            fsd_next_tit_art = container.querySelector("#fsd_next_tit_art")!;
            fsd_next_tit_art_inner = container.querySelector("#fsd_next_tit_art_inner")!;
            fsd_first_span = container.querySelector("#fsd_first_span")!;
            fsd_second_span = container.querySelector("#fsd_second_span")!;
        }
        if (CFM.get("icons")) {
            playingIcon = container.querySelector("#playing-icon")!;

            //Clicking on playing icon disables it and remembers the config
            playingIcon.onclick = () => {
                CFM.set("titleMovingIcon", false);
                playingIcon.classList.add("hidden");
                pausedIcon.classList.remove("hidden");
            };
            pausedIcon = container.querySelector("#paused-icon")!;
            pausedIcon.onclick = () => {
                CFM.set("titleMovingIcon", true);
                playingIcon.classList.remove("hidden");
                pausedIcon.classList.add("hidden");
                updatePlayingIcon({ data: { is_paused: !Spicetify.Player.isPlaying() } });
            };
        }
        if (CFM.get("playerControls") !== "never") {
            play = container.querySelector("#fsd-play")!;
            play.onclick = () => {
                Utils.fadeAnimation(play);
                Spicetify.Player.togglePlay();
            };
            nextControl = container.querySelector("#fsd-next")!;
            nextControl.onclick = () => {
                Utils.fadeAnimation(nextControl, "fade-ri");
                Spicetify.Player.next();
            };
            backControl = container.querySelector("#fsd-back")!;
            backControl.onclick = () => {
                Utils.fadeAnimation(backControl, "fade-le");
                Spicetify.Player.back();
            };
        }
        if (CFM.get("extraControls") !== "never") {
            heart = container.querySelector("#fsd-heart")!;
            shuffle = container.querySelector("#fsd-shuffle")!;
            repeat = container.querySelector("#fsd-repeat")!;

            heart.onclick = () => {
                Utils.fadeAnimation(heart);
                Spicetify.Player.toggleHeart();
            };
            shuffle.onclick = () => {
                Utils.fadeAnimation(shuffle);
                Spicetify.Player.toggleShuffle();
            };
            repeat.onclick = () => {
                Utils.fadeAnimation(repeat);
                Spicetify.Player.toggleRepeat();
            };

            if (CFM.get("invertColors") === "auto") {
                invertButton = container.querySelector("#fsd-invert")!;
                invertButton.onclick = toggleInvert;
            }
            // if (CFM.get("lyricsDisplay") && !CFM.get("sidebarQueue")) {
            //     lyrics = container.querySelector("#fsd-lyrics")!;
            //     lyrics.onclick = () => toggleLyrics();
            // lyrics.onclick = () => recordSequence();
            // }
            // if (CFM.get("sidebarQueue")) {
            queue = container.querySelector("#fsd-queue")!;
            queue.onclick = () => toggleQueue();
            // }
        }
    }

    function recordSequence() {
        Spicetify.Mousetrap.record(function (sequence) {
            // sequence is an array like ['ctrl+k', 'c']
            console.log("You pressed: " + sequence.join(" "));
        });
    }
    // Set the timeout to show upnext or hide when song ends
    let upnextTimer: NodeJS.Timeout,
        upNextShown = false;

    function toggleLyrics() {
        container.classList.toggle("lyrics-hide-force");
    }

    function toggleQueue() {
        Utils.toggleQueue(queue);
        if (queue) {
            Utils.fadeAnimation(queue);
        }
    }

    function updateUpNextShow() {
        if (CFM.get("upnextDisplay") === "smart") {
            setTimeout(() => {
                const timetogo = Utils.getShowTime(
                    CFM.get("upnextTimeToShow") as Settings["upnextTimeToShow"],
                );
                if (upnextTimer) {
                    clearTimeout(upnextTimer);
                }
                if (timetogo < 10) {
                    if (!upNextShown || fsd_myUp.style.transform !== "translateX(0px)") {
                        updateUpNext();
                    }
                    upNextShown = true;
                } else {
                    fsd_myUp.style.transform = "translateX(600px)";
                    upNextShown = false;
                    if (Spicetify.Player.isPlaying()) {
                        upnextTimer = setTimeout(() => {
                            updateUpNext();
                            upNextShown = true;
                        }, timetogo);
                    }
                }
            }, 100);
        } else if (CFM.get("upnextDisplay") === "always" && !upNextShown) {
            updateUpNext();
            upNextShown = true;
        }
    }

    function handleNavigation(navigateUri: string) {
        const formattedUri = navigateUri.replace("spotify", "").replaceAll(":", "/");
        deactivate();
        setTimeout(() => {
            Spicetify.Platform.History.push(formattedUri);
        }, 100);
    }

    /**
     * Update song details like title, artists, album etc.
     */
    async function updateInfo() {
        const meta = Spicetify.Player.data.item?.metadata;

        if (CFM.get("contextDisplay") !== "never")
            updateContext().catch((err) => console.error("Error getting context: ", err));

        // prepare title
        let songName = meta?.title;
        if (CFM.get("trimTitle")) {
            songName = Utils.trimTitle(songName);
        }

        // prepare artist
        let artistData: string[][];
        // if (CFM.get("showAllArtists")) {
        const artistNameList = Object.keys(meta!)
            .filter((key) => key.startsWith("artist_name"))
            .sort() as Array<keyof typeof meta>;

        const artistUriList = Object.keys(meta!)
            .filter((key) => key.startsWith("artist_uri"))
            .sort() as Array<keyof typeof meta>;

        artistData = artistNameList.map((key, index) => [meta![key], meta![artistUriList[index]]]);
        // } else {
        //     artistData = [[meta?.artist_name, meta?.artist_uri]];
        // }

        // prepare album
        let albumText: string,
            updatedAlbum = false;
        if (CFM.get("showAlbum") !== "never") {
            albumText = meta?.album_title || "";
            if (CFM.get("trimAlbum")) {
                albumText = Utils.trimTitle(albumText);
            }
            const albumURI = meta?.album_uri;
            if (albumURI?.startsWith("spotify:album:") && CFM.get("showAlbum") === "date") {
                Utils.getAlbumReleaseDate(albumURI, LOCALE).then((releaseDate) => {
                    albumText += releaseDate;
                    if (updatedAlbum) album.innerText = albumText || "";
                });
            }
        }

        updateBackground(meta!);

        // prepare cover image
        coverImg.src = meta?.image_xlarge_url;

        // update all the things on cover load
        coverImg.onload = () => {
            cover.style.backgroundImage = `url("${coverImg.src}")`;
            title.innerText = songName || "";
            title.setAttribute("uri", Spicetify.Player.data?.item?.uri || "");

            // combine artist in a list with each span and separated by comma
            artist.innerHTML = `${artistData
                .map((artist) => `<span uri=${artist[1]}>${artist[0]}</span>`)
                .join(", ")}`;

            artist.querySelectorAll("span").forEach((span) => {
                span.onclick = () => {
                    handleNavigation(span.getAttribute("uri")!);
                };
            });

            if (album) {
                album.innerText = albumText || "";
                album.setAttribute("uri", meta?.album_uri || "");
                updatedAlbum = true;
            }
            if (CFM.get("lyricsDisplay") && CFM.get("autoHideLyrics")) {
                const lyricsContainer = container.querySelector<HTMLElement>(
                    "#fad-lyrics-plus-container",
                );
                if (lyricsContainer) {
                    autoHideLyrics();
                }
            }
        };

        // Placeholder
        coverImg.onerror = () => {
            console.error("Check your Internet! Unable to load Image");
            coverImg.src = ICONS.OFFLINE_SVG;
        };
    }

    async function updateBackground(meta: Partial<Record<string, unknown>>, fromResize = false) {
        const previousImg = backgroundImg.cloneNode() as HTMLImageElement;

        const settingValue = CFM.get("backgroundChoice") as Settings["backgroundChoice"];

        back.classList.toggle("animated", settingValue === "animated_album");
        modifyIsAnimationRunning(settingValue === "animated_album");

        switch (settingValue) {
            case "dynamic_color": {
                const nextColor = await Utils.getNextColor(
                    CFM.get("coloredBackChoice") as Settings["coloredBackChoice"],
                );
                updateMainColor(
                    Spicetify.Player.data.item?.uri,
                    meta as Partial<Record<string, string>>,
                );
                updateThemeColor(Spicetify.Player.data.item?.uri);
                animateColor(nextColor, back);
                break;
            }
            case "static_color":
                updateMainColor(
                    Spicetify.Player.data.item?.uri,
                    meta as Partial<Record<string, string>>,
                );
                updateThemeColor(Spicetify.Player.data.item?.uri);
                animateColor(CFM.get("staticBackChoice") as Settings["staticBackChoice"], back);
                break;
            case "artist_art":
                backgroundImg.src = await Utils.getImageAndLoad(
                    meta as Partial<Record<string, string>>,
                );
                updateMainColor(backgroundImg.src, meta as Partial<Record<string, string>>);
                updateThemeColor(backgroundImg.src);
                backgroundImg.onload = () => {
                    animateCanvas(previousImg, backgroundImg, back, fromResize);
                };
                break;
            case "animated_album": {
                backgroundImg.src = meta?.image_xlarge_url as string;
                backgroundImg.onload = () => {
                    updateMainColor(
                        Spicetify.Player.data.item?.uri,
                        meta as Partial<Record<string, string>>,
                    );
                    updateThemeColor(Spicetify.Player.data.item?.uri);
                    animatedRotatedCanvas(back, backgroundImg);
                };

                break;
            }
            case "album_art":
            default:
                backgroundImg.src = meta?.image_xlarge_url as string;
                backgroundImg.onload = () => {
                    updateMainColor(
                        Spicetify.Player.data.item?.uri,
                        meta as Partial<Record<string, string>>,
                    );
                    updateThemeColor(Spicetify.Player.data.item?.uri);
                    animateCanvas(previousImg, backgroundImg, back, fromResize);
                };
                break;
        }
    }

    async function updateMainColor(imageURL: string, meta: Spicetify.Metadata) {
        switch (CFM.get("invertColors")) {
            case "always":
                container.style.setProperty("--main-color", "0,0,0");
                container.style.setProperty("--contrast-color", "255,255,255");
                break;
            case "auto": {
                let mainColor = "255,255,255",
                    contrastColor = "0,0,0";
                if (
                    CFM.get("backgroundChoice") === "album_art" &&
                    (meta?.album_uri?.split(":")[2] ?? "") in INVERTED
                ) {
                    mainColor = INVERTED[meta?.album_uri?.split(":")[2] ?? ""]
                        ? "0,0,0"
                        : "255,255,255";
                } else {
                    [mainColor, contrastColor] = await ColorExtractor.getMainColor(imageURL);
                }
                container.style.setProperty("--main-color", mainColor);
                container.style.setProperty("--contrast-color", contrastColor);
                if (CFM.get("extraControls") !== "never") {
                    invertButton.classList.remove("button-active");
                    invertButton.innerHTML = ICONS.INVERT_INACTIVE;
                }
                break;
            }
            case "never":
            default:
                container.style.setProperty("--main-color", "255,255,255");
                container.style.setProperty("--contrast-color", "0,0,0");
                break;
        }
    }

    //Set main theme color for the display
    async function updateThemeColor(imageURL: string) {
        if (
            !(
                CFM.get("backgroundChoice") == "dynamic_color" &&
                CFM.get("coloredBackChoice") == "VIBRANT"
            ) &&
            (CFM.get("themedButtons") || CFM.get("themedIcons"))
        ) {
            container.classList.toggle("themed-buttons", Boolean(CFM.get("themedButtons")));
            container.classList.toggle("themed-icons", Boolean(CFM.get("themedIcons")));
            let themeVibrantColor;
            const artColors = await WebAPI.colorExtractor(imageURL).catch((err) =>
                console.warn(err),
            );
            if (!artColors?.VIBRANT) themeVibrantColor = "175,175,175";
            else themeVibrantColor = Utils.hexToRgb(artColors.VIBRANT);
            container.style.setProperty("--theme-color", themeVibrantColor);
        } else {
            container.classList.remove("themed-buttons", "themed-icons");
            container.style.setProperty("--theme-color", "175,175,175");
        }
    }

    function handleLyricsUpdate(evt: any) {
        if (evt.detail.isLoading) return;
        container.classList.toggle(
            "lyrics-unavailable",
            !(evt.detail.available && (evt.detail?.synced?.length ?? 5) > 1),
        );
        // if (CFM.get("extraControls") !== "never" && !CFM.get("sidebarQueue")) {
        //     lyrics.classList.toggle("hidden", container.classList.contains("lyrics-unavailable"));
        // }
    }

    function autoHideLyrics() {
        const lyricsContainer = container.querySelector(
            "#fad-lyrics-plus-container",
        ) as HTMLElement;
        if (!lyricsContainer.innerText) {
            handleLyricsUpdate({ detail: { isLoading: true, available: false } });
            setTimeout(autoHideLyrics, 100);
        } else {
            if (lyricsContainer.innerText == "(• _ • )") {
                handleLyricsUpdate({ detail: { isLoading: false, available: false } });
            } else {
                handleLyricsUpdate({ detail: { isLoading: false, available: true } });
            }
        }
    }

    function resizeEvents() {
        if (CFM.get("upnextDisplay") !== "never") updateUpNext();
        updateBackground(Spicetify.Player.data.item?.metadata, true);
        container.classList.toggle(
            "vertical-mode",
            (CFM.get("verticalMonitorSupport") as Settings["verticalMonitorSupport"]) &&
                window.innerWidth < window.innerHeight,
        );

        document.body.classList.toggle(
            "vertical-mode",
            (CFM.get("verticalMonitorSupport") as Settings["verticalMonitorSupport"]) &&
                window.innerWidth < window.innerHeight,
        );
    }

    // Get the context and update it
    async function updateContext() {
        const ctxDetails = await Utils.getContext(translations[LOCALE]).catch((err) =>
            console.error(err),
        );
        ctx_source.classList.toggle("ctx-no-name", !ctxDetails!.ctxName);

        //Set default icon if no icon is returned
        if (!ctxDetails!.ctxIcon) ctxDetails!.ctxIcon = Spicetify.SVGIcons.spotify;
        ctx_icon.innerHTML = /^<path/.test(ctxDetails!.ctxIcon)
            ? `<svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">${
                  ctxDetails!.ctxIcon
              }</svg>`
            : ctxDetails!.ctxIcon;

        //Only change the DOM if context is changed
        if (
            ctx_source.innerText.toLowerCase() !== `${ctxDetails!.ctxSource}`.toLowerCase() ||
            ctx_name.innerText.toLowerCase() !== ctxDetails!.ctxName.toLowerCase()
        ) {
            ctx_source.innerText = `${ctxDetails!.ctxSource}`;
            ctx_name.innerText = ctxDetails!.ctxName;
            if (CFM.get("contextDisplay") === "mousemove") hideContext();
        }
    }

    function updateUpNextInfo() {
        fsd_up_next_text.innerText = translations[LOCALE].upnext.toUpperCase();
        let metadata: Spicetify.Metadata = {};
        const queue_metadata = Spicetify.Queue.nextTracks[0];
        if (queue_metadata) {
            metadata = queue_metadata?.contextTrack?.metadata;
        } else {
            metadata["artist_name"] = "";
            metadata["title"] = "";
        }

        let songName = metadata.title;
        if (CFM.get("trimTitleUpNext") && songName) {
            songName = Utils.trimTitle(songName);
        }
        const artistNameNext = Object.keys(metadata)
            .filter((key) => key.startsWith("artist_name"))
            .sort()
            .map((key) => metadata[key])
            .join(", ");

        let next_artist;
        if (artistNameNext) {
            next_artist = artistNameNext;
        } else {
            next_artist = translations[LOCALE].unknownArtist;
        }
        const next_image = metadata.image_xlarge_url;
        if (next_image) {
            fsd_nextCover.style.backgroundImage = `url("${next_image}")`;
        } else {
            if (metadata.image_url)
                fsd_nextCover.style.backgroundImage = `url("${metadata.image_url}")`;
            else {
                fsd_nextCover.style.backgroundImage = `url("${ICONS.OFFLINE_SVG}")`;
            }
        }
        fsd_first_span.innerText = songName + "  •  " + next_artist;
        fsd_second_span.innerText = songName + "  •  " + next_artist;
    }

    async function updateUpNext() {
        const nextTrack = Spicetify.Queue?.nextTracks[0]?.contextTrack?.metadata;
        const upnextDisplay = CFM.get("upnextDisplay");

        let shouldShow = false;
        if (nextTrack?.title) {
            if (upnextDisplay === "always") {
                shouldShow = true;
            } else if (upnextDisplay === "smart") {
                const timeToShow =
                    (CFM.get("upnextTimeToShow") as Settings["upnextTimeToShow"]) * 1000 + 50;
                const remainingTime =
                    Spicetify.Player.data.duration - Spicetify.Player.getProgress();
                shouldShow = remainingTime <= timeToShow;
            }
        }

        if (shouldShow) {
            await updateUpNextInfo();
            showUpNext();
        } else {
            hideUpNext();
        }
    }

    function showUpNext() {
        fsd_myUp.style.transform = "translateX(0px)";
        upNextShown = true;

        if (fsd_second_span.offsetWidth > fsd_next_tit_art.offsetWidth - 2) {
            setupScrollingAnimation();
        } else {
            resetUpNextAnimation();
        }
    }

    function hideUpNext() {
        upNextShown = false;
        fsd_myUp.style.transform = "translateX(600px)";
        resetUpNextAnimation();
    }

    function setupScrollingAnimation() {
        fsd_first_span.style.paddingRight = "0px";
        fsd_second_span.innerText = "";

        const animTime = Math.max(
            (fsd_first_span.offsetWidth - fsd_next_tit_art.offsetWidth - 2) / 0.035,
            1500,
        );

        fsd_myUp.style.setProperty(
            "--translate_width_fsd",
            `-${fsd_first_span.offsetWidth - fsd_next_tit_art.offsetWidth + 5}px`,
        );

        fsd_next_tit_art_inner.style.animation = `fsd_translate ${animTime}ms linear 800ms infinite`;
    }

    function resetUpNextAnimation() {
        fsd_first_span.style.paddingRight = "0px";
        fsd_next_tit_art_inner.style.animation = "none";
        fsd_second_span.innerText = "";
    }

    function updatePlayingIcon(evt: any) {
        if (evt.data.is_paused || evt.data.isPaused) {
            pausedIcon.classList.remove("hidden");
            playingIcon.classList.add("hidden");
        } else {
            pausedIcon.classList.toggle("hidden", CFM.get("titleMovingIcon") as boolean);
            playingIcon.classList.toggle("hidden", !CFM.get("titleMovingIcon"));
        }
    }

    function updatePlayerControls(evt: any) {
        if (CFM.get("playerControls") === "mousemove") hidePlayerControls();
        Utils.fadeAnimation(play);
        if (evt.data.is_paused || evt.data.isPaused) {
            play.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.play}</svg>`;
        } else {
            play.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.pause}</svg>`;
        }
    }

    let prevControlData = {
        shuffle: Spicetify.Platform?.PlayerAPI?._state?.shuffle,
        repeat: Spicetify.Platform?.PlayerAPI?._state?.repeat,
    };

    function updateExtraControls(data: any) {
        data = data?.data ?? Spicetify.Player.data;
        updateHeart();
        if (prevControlData?.shuffle !== data?.shuffle) Utils.fadeAnimation(shuffle);
        if (prevControlData?.repeat !== data?.repeat) Utils.fadeAnimation(repeat);
        prevControlData = {
            shuffle: data?.shuffle,
            repeat: data?.repeat,
        };
        repeat.classList.toggle("dot-after", data?.repeat !== 0);
        repeat.classList.toggle("button-active", data?.repeat !== 0);

        shuffle.classList.toggle("dot-after", data?.shuffle);
        shuffle.classList.toggle("button-active", data?.shuffle);
        if (data?.repeat === 2) {
            repeat.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["repeat-once"]}</svg>`;
        } else {
            repeat.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["repeat"]}</svg>`;
        }
        if (data?.restrictions) {
            shuffle.classList.toggle("unavailable", !data?.restrictions?.canToggleShuffle);
            repeat.classList.toggle(
                "unavailable",
                !data?.restrictions?.canToggleRepeatTrack &&
                    !data?.restrictions?.canToggleRepeatContext,
            );
        }
    }

    let prevHeartData = Spicetify.Player?.data?.item?.metadata["collection.in_collection"];

    function updateHeart() {
        setTimeout(() => {
            const meta = Spicetify.Player?.data?.item;
            heart.classList.toggle("unavailable", meta?.metadata["collection.can_add"] !== "true");
            if (prevHeartData !== meta?.metadata["collection.in_collection"])
                Utils.fadeAnimation(heart);
            prevHeartData = meta?.metadata["collection.in_collection"];
            if (
                meta?.metadata["collection.in_collection"] === "true" ||
                Spicetify.Player.getHeart()
            ) {
                heart.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["heart-active"]}</svg>`;
                heart.classList.add("button-active");
            } else {
                heart.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["heart"]}</svg>`;
                heart.classList.remove("button-active");
            }
        }, 200);
    }

    function toggleInvert() {
        Utils.fadeAnimation(invertButton);
        if (invertButton.classList.contains("button-active"))
            invertButton.innerHTML = ICONS.INVERT_ACTIVE;
        else invertButton.innerHTML = ICONS.INVERT_INACTIVE;
        invertButton.classList.toggle("button-active");
        if (getComputedStyle(container).getPropertyValue("--main-color").startsWith("0")) {
            container.style.setProperty("--main-color", "255,255,255");
            container.style.setProperty("--contrast-color", "0,0,0");
            if (!CFM.getGlobal("tvMode") && CFM.get("backgroundChoice") === "album_art")
                INVERTED[Spicetify.Player.data.item?.metadata?.album_uri?.split(":")[2]] = false;
        } else {
            container.style.setProperty("--main-color", "0,0,0");
            container.style.setProperty("--contrast-color", "255,255,255");
            if (!CFM.getGlobal("tvMode") && CFM.get("backgroundChoice") === "album_art")
                INVERTED[Spicetify.Player.data.item?.metadata?.album_uri?.split(":")[2]] = true;
        }
        localStorage.setItem("full-screen:inverted", JSON.stringify(INVERTED));
    }

    let curTimer: NodeJS.Timeout,
        ctxTimer: NodeJS.Timeout,
        extraControlsTimer: NodeJS.Timeout,
        playerControlsTimer: NodeJS.Timeout;

    function hideCursor() {
        if (curTimer) {
            clearTimeout(curTimer);
        }
        container.style.cursor = "default";
        curTimer = setTimeout(() => (container.style.cursor = "none"), 2000);
    }

    function hideContext() {
        if (ctxTimer) {
            clearTimeout(ctxTimer);
        }
        ctx_container.style.opacity = "1";
        ctxTimer = setTimeout(() => (ctx_container.style.opacity = "0"), 3000);
    }

    function hideExtraControls() {
        if (extraControlsTimer) {
            clearTimeout(extraControlsTimer);
        }
        const elements = container.querySelectorAll(".extra-controls") as NodeListOf<HTMLElement>;
        elements.forEach((element) => (element.style.opacity = "1"));
        extraControlsTimer = setTimeout(() => {
            elements.forEach((element) => (element.style.opacity = "0"));
        }, 3000);
    }

    function hidePlayerControls() {
        if (playerControlsTimer) {
            clearTimeout(playerControlsTimer);
        }
        const element = container.querySelector(".fsd-controls-center")! as HTMLElement;
        element.style.opacity = "1";
        playerControlsTimer = setTimeout(() => (element.style.opacity = "0"), 3000);
    }

    function handleMouseMoveActivation() {
        container.addEventListener("mousemove", hideCursor);
        hideCursor();
        if (CFM.get("contextDisplay") === "mousemove") {
            container.addEventListener("mousemove", hideContext);
            hideContext();
        }
        if (CFM.get("extraControls") === "mousemove") {
            container.addEventListener("mousemove", hideExtraControls);
            hideExtraControls();
        }
        if (CFM.get("playerControls") === "mousemove") {
            container.addEventListener("mousemove", hidePlayerControls);
            hidePlayerControls();
        }
    }

    function handleMouseMoveDeactivation() {
        container.removeEventListener("mousemove", hideCursor);
        container.removeEventListener("mousemove", hideContext);
        container.removeEventListener("mousemove", hideExtraControls);
        container.removeEventListener("mousemove", hidePlayerControls);

        if (curTimer) clearTimeout(curTimer);
        if (ctxTimer) clearTimeout(ctxTimer);
        if (extraControlsTimer) clearTimeout(extraControlsTimer);
        if (playerControlsTimer) clearTimeout(playerControlsTimer);
    }

    function fullScreenListener() {
        if (
            document.fullscreenElement === null &&
            CFM.get("enableFullscreen") &&
            Utils.isModeActivated()
        ) {
            deactivate();
        }
    }

    let origLoc: string;
    const heartObserver = new MutationObserver(updateHeart);

    async function activate() {
        // if (CFM.get("sidebarQueue")) {
        Utils.toggleQueuePanel(queue, true);
        // }
        document.body.classList.add(...CLASSES_TO_ADD);
        if (CFM.get("enableFullscreen")) await Utils.fullScreenOn()?.catch((err) => {});
        else await Utils.fullScreenOff()?.catch((err) => {});
        setTimeout(() => {
            updateInfo();
            window.addEventListener("resize", resizeEvents);
            resizeEvents();
            container.querySelectorAll(".fsd-song-meta span").forEach((span) => {
                (span as HTMLElement).onclick = (evt: any) => {
                    handleNavigation(evt.target?.getAttribute("uri") ?? "");
                };
            });
        }, 200);
        Spicetify.Player.addEventListener("songchange", updateInfo);
        handleMouseMoveActivation();
        container.querySelector<HTMLElement>("#fsd-foreground")!.oncontextmenu = openConfig;
        container.querySelector<HTMLElement>("#fsd-foreground")!.ondblclick = deactivate;
        back.oncontextmenu = openConfig;
        back.ondblclick = deactivate;
        if (CFM.get("upnextDisplay") !== "never") {
            updateUpNextShow();
            Spicetify.Platform.PlayerAPI._events.addListener("queue_update", updateUpNext);
            Spicetify.Platform.PlayerAPI._events.addListener("update", updateUpNextShow);
        }
        if (CFM.get("volumeDisplay") !== "never") {
            ReactDOM.render(
                <SeekableVolumeBar state={CFM.get("volumeDisplay") as Settings["volumeDisplay"]} />,
                container.querySelector("#fsd-volume-parent"),
            );
        }
        // if (CFM.get("enableFade")) {
        cover.classList.add("fsd-background-fade");
        // } else {
        //     cover.classList.remove("fsd-background-fade");
        // }
        if (CFM.get("icons")) {
            updatePlayingIcon({ data: { is_paused: !Spicetify.Player.isPlaying() } });
            Spicetify.Player.addEventListener("onplaypause", updatePlayingIcon);
        }
        if (CFM.get("progressBarDisplay") !== "never") {
            ReactDOM.render(
                <SeekableProgressBar
                    state={CFM.get("progressBarDisplay") as Settings["progressBarDisplay"]}
                />,
                container.querySelector("#fsd-progress-parent"),
            );
        }
        ReactDOM.render(
            <OverviewCard
                onExit={deactivate}
                onToggle={() => {
                    CFM.getGlobal("tvMode") ? openwithDef() : openwithTV();
                }}
            />,
            container.querySelector("#fsd-overview-card-parent"),
        );
        if (CFM.get("playerControls") !== "never") {
            updatePlayerControls({ data: { is_paused: !Spicetify.Player.isPlaying() } });
            Spicetify.Player.addEventListener("onplaypause", updatePlayerControls);
        }
        if (CFM.get("extraControls") !== "never") {
            updateExtraControls(null);
            Utils.addObserver(heartObserver, ".control-button-heart", {
                attributes: true,
                attributeFilter: ["aria-checked"],
            });
            Spicetify.Platform.PlayerAPI._events.addListener("update", updateExtraControls);
        }
        document.querySelector(".Root__top-container")?.append(style, container);
        if (CFM.get("lyricsDisplay")) {
            window.addEventListener("lyrics-plus-update", handleLyricsUpdate);
            origLoc = Spicetify.Platform.History.location.pathname;
            if (origLoc !== "/lyrics-plus") {
                Spicetify.Platform.History.push("/lyrics-plus");
            }
            window.dispatchEvent(new Event("fad-request"));
        }
        Spicetify.Mousetrap.bind("f11", fsToggle);
        document.addEventListener("fullscreenchange", fullScreenListener);
        Spicetify.Mousetrap.bind("esc", deactivate);
        if (CFM.get("lyricsDisplay")) {
            Spicetify.Mousetrap.bind("l", toggleLyrics);
        }
        Spicetify.Mousetrap.bind("c", () => {
            const popup = document.querySelector("body > generic-modal");
            if (popup) popup.remove();
            else openConfig();
        });
        // if (CFM.get("sidebarQueue")) {
        Spicetify.Mousetrap.bind("q", toggleQueue);
        // }
    }

    async function deactivate() {
        // if (CFM.get("sidebarQueue")) {
        Utils.toggleQueuePanel(queue, false);
        // }
        modifyIsAnimationRunning(false);
        Spicetify.Player.removeEventListener("songchange", updateInfo);
        handleMouseMoveDeactivation();
        window.removeEventListener("resize", resizeEvents);
        if (CFM.get("upnextDisplay") !== "never") {
            upNextShown = false;
            Spicetify.Platform.PlayerAPI._events.removeListener("queue_update", updateUpNext);
            Spicetify.Platform.PlayerAPI._events.removeListener("update", updateUpNextShow);
        }
        ReactDOM.unmountComponentAtNode(container.querySelector("#fsd-volume-parent")!);
        ReactDOM.unmountComponentAtNode(container.querySelector("#fsd-progress-parent")!);
        ReactDOM.unmountComponentAtNode(container.querySelector("#fsd-overview-card-parent")!);
        if (CFM.get("icons")) {
            Spicetify.Player.removeEventListener("onplaypause", updatePlayingIcon);
        }
        if (CFM.get("playerControls") !== "never") {
            Spicetify.Player.removeEventListener("onplaypause", updatePlayerControls);
        }
        if (CFM.get("extraControls") !== "never") {
            heartObserver.disconnect();
            Spicetify.Platform.PlayerAPI._events.removeListener("update", updateExtraControls);
        }
        document.body.classList.remove(...CLASSES_TO_ADD);
        upNextShown = false;
        if (CFM.get("enableFullscreen")) {
            await Utils.fullScreenOff()?.catch((err) => {});
        }
        const popup = document.querySelector("body > generic-modal");
        if (popup) popup.remove();
        style.remove();
        container.remove();
        if (CFM.get("lyricsDisplay")) {
            window.removeEventListener("lyrics-plus-update", handleLyricsUpdate);
            if (origLoc !== "/lyrics-plus") {
                Utils.revertPathHistory(origLoc);
            }
            window.dispatchEvent(new Event("fad-request"));
        }
        document.removeEventListener("fullscreenchange", fullScreenListener);

        Spicetify.Mousetrap.unbind("f11");
        Spicetify.Mousetrap.unbind("esc");
        Spicetify.Mousetrap.unbind("l");
        Spicetify.Mousetrap.unbind("c");
        Spicetify.Mousetrap.unbind("q");
    }

    function fsToggle() {
        if (CFM.get("enableFullscreen")) {
            CFM.set("enableFullscreen", false);
            render();
            activate();
        } else {
            CFM.set("enableFullscreen", true);
            render();
            activate();
        }
    }

    function saveOption(key: keyof Settings, value: Settings[keyof Settings]) {
        CFM.set(key, value);
        render();
        if (Utils.isModeActivated()) activate();
    }

    // Saves an option independent from TV or Fullscreen mode
    function saveGlobalOption(key: keyof Config, value: Config[keyof Config]) {
        CFM.setGlobal(key, value);
        LOCALE = CFM.getGlobal("locale") as Config["locale"]; // Update locale (avoids reloading client to apply setting)
        render();
        if (Utils.isModeActivated()) activate();
    }

    function getSettingTopHeader() {
        const container = document.createElement("div");
        container.innerHTML = `
        <div class="setting-button-row">
          <button class="main-buttons-button main-button-primary" id="mode-switch">${
              CFM.getGlobal("tvMode")
                  ? translations[LOCALE].settings.switchToFullscreen
                  : translations[LOCALE].settings.switchToTV
          }</button>
          <button class="main-buttons-button main-button-primary" id="mode-exit">
            ${translations[LOCALE].settings.exit}
          </button>
        </div>`;
        container.querySelector<HTMLElement>("#mode-exit")!.onclick = deactivate;
        container.querySelector<HTMLElement>("#mode-switch")!.onclick = () => {
            CFM.getGlobal("tvMode") ? openwithDef() : openwithTV();
            document.querySelector("body > generic-modal")?.remove();
        };
        return container;
    }

    function getSettingBottomHeader() {
        const container = document.createElement("div");
        container.innerHTML = `
        <div class="setting-button-row">
          <button class="main-buttons-button main-button-secondary" id="reset-switch">${translations[LOCALE].settings.configReset}</button>
          <button class="main-buttons-button main-button-secondary" id="reload-switch">${translations[LOCALE].settings.reload}</button>
        </div>`;
        container.querySelector<HTMLElement>("#reset-switch")!.onclick = () => {
            if (Utils.isModeActivated()) {
                CFM.resetSettings();
                render();
                activate();
                configContainer = "";
                setTimeout(openConfig, 5);
            } else {
                CFM.resetSettings(null, true);
                location.reload();
            }
        };
        container.querySelector<HTMLElement>("#reload-switch")!.onclick = () => {
            location.reload();
        };
        return container;
    }

    function createOptions(
        title: string,
        options: Record<string, string>,
        configValue: string | number,
        key: keyof Settings | keyof Config,
        callback: (val: string) => void,
        description = "",
    ) {
        const settingCard = getSettingCard(
            `<select>
                ${Object.keys(options)
                    .map((item) => `<option value="${item}" dir="auto">${options[item]}</option>`)
                    .join("\n")}
            </select>`,
            title,
            key,
            description,
        );

        const select = settingCard.querySelector<HTMLSelectElement>("select")!;
        if (!(configValue in options)) {
            if (key in DEFAULTS[CFM.getMode()]) {
                configValue = DEFAULTS[CFM.getMode()][key as keyof Settings] as string;
                saveOption(key as keyof Settings, configValue);
            } else if (key in DEFAULTS) {
                configValue = DEFAULTS[key as keyof Config] as string | number;
                saveGlobalOption(key as keyof Config, configValue as Config[keyof Config]);
            }
        }
        select.value = configValue.toString();
        select.onchange = (e) => {
            callback((e?.target as HTMLInputElement).value);
        };
        return settingCard;
    }

    function createToggle(
        title: string,
        key: keyof Settings | keyof Config,
        callback = (value: boolean) => saveOption(key as keyof Settings, value),
        description = "",
    ) {
        const settingCard = getSettingCard(
            `<label class="switch">
                <input type="checkbox">
                <span class="slider"></span>
            </label>`,
            title,
            key,
            description,
        );
        const toggle = settingCard.querySelector<HTMLInputElement>("input");
        if (toggle) {
            if (key in DEFAULTS) toggle.checked = CFM.getGlobal(key as keyof Config) as boolean;
            else toggle.checked = CFM.get(key as keyof Settings) as boolean;

            toggle.onchange = (evt) => callback((evt?.target as HTMLInputElement)?.checked);
        }
        return settingCard;
    }

    function createInputElement(
        title: string,
        key: keyof Settings | keyof Config,
        type: string,
        callback = (value: string) => saveOption(key as keyof Settings, value),
        description = "",
    ): HTMLDivElement {
        const settingCard = getSettingCard(
            `<label class="gen-input">
                <input type="${type}">
            </label>`,
            title,
            key,
            description,
        );
        const inputElement = settingCard.querySelector<HTMLInputElement>("input");
        if (inputElement) {
            if (key in DEFAULTS) inputElement.value = CFM.getGlobal(key as keyof Config) as string;
            else inputElement.value = CFM.get(key as keyof Settings) as string;

            inputElement.oninput = (evt) => callback((evt?.target as HTMLInputElement)?.value);
        }
        return settingCard;
    }

    let configContainer;
    let overlayTimout: NodeJS.Timeout;

    function openConfig(evt: Event | null = null): void {
        evt?.preventDefault();
        configContainer = document.createElement("div");
        configContainer.id = "full-screen-config-container";
        const style = document.createElement("style");
        style.innerHTML = settingsStyles;
        configContainer.append(
            style,
            Utils.isModeActivated() ? getSettingTopHeader() : "",
            headerText(translations[LOCALE].settings.pluginSettings),
            createOptions(
                translations[LOCALE].settings.language,
                Utils.getAvailableLanguages(translations),
                CFM.getGlobal("locale") as Config["locale"],
                "locale",
                (value: string) => {
                    saveGlobalOption("locale", value);
                    document.querySelector("body > generic-modal")?.remove();
                    openConfig();
                },
            ),
            createOptions(
                translations[LOCALE].settings.activationTypes.setting,
                {
                    both: translations[LOCALE].settings.activationTypes.both,
                    btns: translations[LOCALE].settings.activationTypes.btns,
                    keys: translations[LOCALE].settings.activationTypes.keys,
                },
                CFM.getGlobal("activationTypes") as Config["activationTypes"],
                "activationTypes",
                (value: string) => {
                    saveGlobalOption("activationTypes", value);
                    location.reload();
                },
                translations[LOCALE].settings.activationTypes.description,
            ),
            createOptions(
                translations[LOCALE].settings.buttonActivation.setting,
                {
                    both: translations[LOCALE].settings.buttonActivation.both,
                    tv: translations[LOCALE].settings.buttonActivation.tv,
                    def: translations[LOCALE].settings.buttonActivation.def,
                },
                CFM.getGlobal("buttonActivation") as Config["buttonActivation"],
                "buttonActivation",
                (value: string) => {
                    saveGlobalOption("buttonActivation", value);
                    location.reload();
                },
                translations[LOCALE].settings.buttonActivation.description,
            ),
            createOptions(
                translations[LOCALE].settings.keyActivation.setting,
                {
                    both: translations[LOCALE].settings.keyActivation.both,
                    tv: translations[LOCALE].settings.keyActivation.tv,
                    def: translations[LOCALE].settings.keyActivation.def,
                },
                CFM.getGlobal("keyActivation") as Config["keyActivation"],
                "keyActivation",
                (value: string) => {
                    saveGlobalOption("keyActivation", value);
                    location.reload();
                },
                translations[LOCALE].settings.keyActivation.description,
            ),

            headerText(translations[LOCALE].settings.lyricsHeader),
            createToggle(
                translations[LOCALE].settings.lyrics,
                "lyricsDisplay",
                (value) => {
                    saveOption("lyricsDisplay", value);
                    container.classList.remove("lyrics-unavailable");
                },
                translations[LOCALE].settings.lyricsDescription.join("<br>"),
            ),
            createToggle(translations[LOCALE].settings.autoHideLyrics, "autoHideLyrics"),
            createOptions(
                translations[LOCALE].settings.lyricsAlignment.setting,
                {
                    left: translations[LOCALE].settings.lyricsAlignment.left,
                    center: translations[LOCALE].settings.lyricsAlignment.center,
                    right: translations[LOCALE].settings.lyricsAlignment.right,
                },
                CFM.get("lyricsAlignment") as Settings["lyricsAlignment"],
                "lyricsAlignment",
                (value: string) => saveOption("lyricsAlignment", value),
            ),
            // createAdjust(
            //     translations[LOCALE].settings.lyricsAnimationTempo,
            //     "animationTempo",
            //     "s",
            //     CFM.get("animationTempo") as Settings["animationTempo"],
            //     0.1,
            //     0,
            //     1,
            //     (state) => {
            //         CFM.set("animationTempo", Number(state));
            //         render();
            //         if (Utils.isModeActivated()) activate();
            //     },
            // ),
            headerText(translations[LOCALE].settings.generalHeader),
            createOptions(
                translations[LOCALE].settings.progressBar,
                {
                    never: translations[LOCALE].settings.contextDisplay.never,
                    mousemove: translations[LOCALE].settings.contextDisplay.mouse,
                    always: translations[LOCALE].settings.contextDisplay.always,
                },
                CFM.get("progressBarDisplay") as Settings["progressBarDisplay"],
                "progressBarDisplay",
                (value: string) => {
                    CFM.set("progressBarDisplay", value);
                    if (value !== "never") {
                        ReactDOM.render(
                            <SeekableProgressBar state={value} />,
                            container.querySelector("#fsd-progress-parent"),
                        );
                    } else {
                        ReactDOM.unmountComponentAtNode(
                            container.querySelector("#fsd-progress-parent")!,
                        );
                    }
                },
            ),
            createOptions(
                translations[LOCALE].settings.playerControls,
                {
                    never: translations[LOCALE].settings.contextDisplay.never,
                    mousemove: translations[LOCALE].settings.contextDisplay.mouse,
                    always: translations[LOCALE].settings.contextDisplay.always,
                },
                CFM.get("playerControls") as Settings["playerControls"],
                "playerControls",
                (value: string) => saveOption("playerControls", value),
            ),
            createOptions(
                translations[LOCALE].settings.showAlbum.setting,
                {
                    never: translations[LOCALE].settings.showAlbum.never,
                    always: translations[LOCALE].settings.showAlbum.always,
                    date: translations[LOCALE].settings.showAlbum.date,
                },
                CFM.get("showAlbum") as Settings["showAlbum"],
                "showAlbum",
                (value: string) => saveOption("showAlbum", value),
            ),
            createToggle(translations[LOCALE].settings.icons, "icons"),
            // createToggle(translations[LOCALE].settings.showAllArtists, "showAllArtists"),
            createToggle(translations[LOCALE].settings.trimTitle, "trimTitle"),
            // createToggle(translations[LOCALE].settings.songChangeAnimation, "enableFade"),
            document.fullscreenEnabled
                ? createToggle(translations[LOCALE].settings.fullscreen, "enableFullscreen")
                : "",
            headerText(translations[LOCALE].settings.extraHeader),
            // createToggle(
            //     translations[LOCALE].settings.sidebarQueue,
            //     "sidebarQueue",
            //     (value: boolean) => saveOption("sidebarQueue", value),
            //     translations[LOCALE].settings.sidebarQueueDescription.join("<br>"),
            // ),
            createOptions(
                translations[LOCALE].settings.extraControls,
                {
                    never: translations[LOCALE].settings.contextDisplay.never,
                    mousemove: translations[LOCALE].settings.contextDisplay.mouse,
                    always: translations[LOCALE].settings.contextDisplay.always,
                },
                CFM.get("extraControls") as Settings["extraControls"],
                "extraControls",
                (value: string) => saveOption("extraControls", value),
            ),
            createToggle(translations[LOCALE].settings.upnextDisplay, "upnextDisplay"),
            createOptions(
                translations[LOCALE].settings.upnextDisplay,
                {
                    always: translations[LOCALE].settings.volumeDisplay.always,
                    never: translations[LOCALE].settings.volumeDisplay.never,
                    smart: translations[LOCALE].settings.volumeDisplay.smart,
                },
                CFM.get("upnextDisplay") as Settings["upnextDisplay"],
                "upnextDisplay",
                (value: string) => saveOption("upnextDisplay", value),
            ),
            createOptions(
                translations[LOCALE].settings.contextDisplay.setting,
                {
                    never: translations[LOCALE].settings.contextDisplay.never,
                    mousemove: translations[LOCALE].settings.contextDisplay.mouse,
                    always: translations[LOCALE].settings.contextDisplay.always,
                },
                CFM.get("contextDisplay") as Settings["contextDisplay"],
                "contextDisplay",
                (value: string) => saveOption("contextDisplay", value),
            ),
            createOptions(
                translations[LOCALE].settings.volumeDisplay.setting,
                {
                    always: translations[LOCALE].settings.volumeDisplay.always,
                    never: translations[LOCALE].settings.volumeDisplay.never,
                    smart: translations[LOCALE].settings.volumeDisplay.smart,
                },
                CFM.get("volumeDisplay") as Settings["volumeDisplay"],
                "volumeDisplay",
                (value: string) => {
                    CFM.set("volumeDisplay", value);
                    if (value !== "never") {
                        ReactDOM.render(
                            <SeekableVolumeBar state={value} />,
                            container.querySelector("#fsd-volume-parent"),
                        );
                    } else {
                        ReactDOM.unmountComponentAtNode(
                            container.querySelector("#fsd-volume-parent")!,
                        );
                    }
                },
                translations[LOCALE].settings.volumeDisplay.description.join("\n"),
            ),
            headerText(
                translations[LOCALE].settings.backgroundHeader,
                translations[LOCALE].settings.backgroundSubHeader,
            ),
            createOptions(
                translations[LOCALE].settings.backgroundChoice.setting,
                {
                    album_art: translations[LOCALE].settings.backgroundChoice.artwork,
                    animated_album: translations[LOCALE].settings.backgroundChoice.animatedArt,
                    dynamic_color: translations[LOCALE].settings.backgroundChoice.dynamicColor,
                    static_color: translations[LOCALE].settings.backgroundChoice.staticColor,
                    artist_art: translations[LOCALE].settings.backgroundChoice.artist,
                },
                CFM.get("backgroundChoice") as Settings["backgroundChoice"],
                "backgroundChoice",
                (value: string) => {
                    CFM.set("backgroundChoice", value);
                    if (Utils.isModeActivated()) {
                        updateBackground(Spicetify.Player.data.item?.metadata);
                    }
                },
                translations[LOCALE].settings.backgroundChoice.description.join("<br>"),
            ),
            createAdjust(
                translations[LOCALE].settings.animationSpeed,
                "animationSpeed",
                "",
                (CFM.get("animationSpeed") as Settings["animationSpeed"]) * 100,
                2,
                2,
                40,
                (state) => {
                    CFM.set("animationSpeed", Number(state) / 100);
                    modifyRotationSpeed(Number(state) / 100);
                },
            ),
            createAdjust(
                translations[LOCALE].settings.backAnimationTime,
                "backAnimationTime",
                "s",
                CFM.get("backAnimationTime") as Settings["backAnimationTime"],
                0.1,
                0,
                5,
                (state) => {
                    CFM.set("backAnimationTime", Number(state));
                    container.style.setProperty("--fs-transition", `${state}s`);
                },
            ),
            createOptions(
                translations[LOCALE].settings.backgroundColor.setting,
                {
                    VIBRANT: translations[LOCALE].settings.backgroundColor.vibrant,
                    PROMINENT: translations[LOCALE].settings.backgroundColor.prominent,
                    DESATURATED: translations[LOCALE].settings.backgroundColor.desaturated,
                    LIGHT_VIBRANT: translations[LOCALE].settings.backgroundColor.lightVibrant,
                    DARK_VIBRANT: translations[LOCALE].settings.backgroundColor.darkVibrant,
                    VIBRANT_NON_ALARMING:
                        translations[LOCALE].settings.backgroundColor.vibrantNonAlarming,
                },
                CFM.get("coloredBackChoice") as Settings["coloredBackChoice"],
                "coloredBackChoice",
                (value: string) => {
                    CFM.set("coloredBackChoice", value);
                    if (Utils.isModeActivated()) {
                        updateBackground(Spicetify.Player.data.item?.metadata, true);
                    }
                },
            ),
            createInputElement(
                translations[LOCALE].settings.staticColor,
                "staticBackChoice",
                "color",
                (value) => {
                    CFM.set("staticBackChoice", value);
                    if (CFM.get("backgroundChoice") === "static_color" && Utils.isModeActivated()) {
                        Utils.overlayBack();
                        animateColor(value, back, true);
                        updateMainColor(
                            Spicetify.Player.data.item?.uri,
                            Spicetify.Player.data.item?.metadata,
                        );
                        if (overlayTimout) clearTimeout(overlayTimout);
                        overlayTimout = setTimeout(() => {
                            Utils.overlayBack(false);
                        }, 1500);
                    }
                },
            ),
            createAdjust(
                translations[LOCALE].settings.backgroundBlur,
                "blurSize",
                "px",
                CFM.get("blurSize") as Settings["blurSize"],
                4,
                0,
                100,
                (state) => {
                    CFM.set("blurSize", Number(state));
                    if (Utils.isModeActivated()) {
                        Utils.overlayBack();
                        updateBackground(Spicetify.Player.data.item?.metadata, true);
                        if (overlayTimout) clearTimeout(overlayTimout);
                        overlayTimout = setTimeout(() => {
                            Utils.overlayBack(false);
                        }, 2000);
                    }
                },
            ),
            createOptions(
                translations[LOCALE].settings.backgroundBrightness,
                {
                    0: "0%",
                    0.1: "10%",
                    0.2: "20%",
                    0.3: "30%",
                    0.4: "40%",
                    0.5: "50%",
                    0.6: "60%",
                    0.7: "70%",
                    0.8: "80%",
                    0.9: "90%",
                    1: "100%",
                },
                CFM.get("backgroundBrightness") as Settings["backgroundBrightness"],
                "backgroundBrightness",
                (value: string) => {
                    CFM.set("backgroundBrightness", value);
                    if (Utils.isModeActivated()) {
                        updateBackground(Spicetify.Player.data.item?.metadata, true);
                    }
                },
            ),
            headerText(
                translations[LOCALE].settings.appearanceHeader,
                translations[LOCALE].settings.appearanceSubHeader,
            ),
            createToggle(translations[LOCALE].settings.themedButtons, "themedButtons"),
            createToggle(translations[LOCALE].settings.themedIcons, "themedIcons"),
            createOptions(
                translations[LOCALE].settings.invertColors.setting,
                {
                    never: translations[LOCALE].settings.invertColors.never,
                    always: translations[LOCALE].settings.invertColors.always,
                    auto: translations[LOCALE].settings.invertColors.auto,
                },
                CFM.get("invertColors") as Settings["invertColors"],
                "invertColors",
                (value: string) => saveOption("invertColors", value),
            ),
            createToggle(
                translations[LOCALE].settings.verticalMonitorSupport,
                "verticalMonitorSupport",
                (value: boolean) => saveOption("verticalMonitorSupport", value),
                translations[LOCALE].settings.verticalMonitorSupportDescription,
            ),
            createToggle(translations[LOCALE].settings.trimTitleUpNext, "trimTitleUpNext"),
            createToggle(translations[LOCALE].settings.trimAlbum, "trimAlbum"),
            createAdjust(
                translations[LOCALE].settings.upnextTime,
                "upnextTimeToShow",
                "s",
                CFM.get("upnextTimeToShow") as Settings["upnextTimeToShow"],
                1,
                5,
                60,
                (state) => {
                    CFM.set("upnextTimeToShow", Number(state));
                    updateUpNextShow();
                },
            ),
            createToggle(
                translations[LOCALE].settings.fsHideOriginal,
                "fsHideOriginal",
                (value) => {
                    saveGlobalOption("fsHideOriginal", value);
                    location.reload();
                },
                translations[LOCALE].settings.fsHideOriginalDescription,
            ),
            createOptions(
                translations[LOCALE].settings.autoLaunch.setting,
                {
                    never: translations[LOCALE].settings.autoLaunch.never,
                    default: translations[LOCALE].settings.autoLaunch.default,
                    tvmode: translations[LOCALE].settings.autoLaunch.tvmode,
                    lastused: translations[LOCALE].settings.autoLaunch.lastused,
                },
                CFM.getGlobal("autoLaunch") as Config["autoLaunch"],
                "autoLaunch",
                (value: string) => {
                    saveGlobalOption("autoLaunch", value);
                },
                translations[LOCALE].settings.autoLaunch.description,
            ),
            // createOptions(
            //     translations[LOCALE].settings.upnextScroll.setting,
            //     {
            //         mq: translations[LOCALE].settings.upnextScroll.mq,
            //         sp: translations[LOCALE].settings.upnextScroll.sp,
            //     },
            //     CFM.get("upNextAnim") as Settings["upNextAnim"],
            //     "upNextAnim",
            //     (value: string) => saveOption("upNextAnim", value),
            // ),
            headerText(translations[LOCALE].settings.aboutHeader),
            getAboutSection(),
            getSettingBottomHeader(),
        );
        Spicetify.PopupModal.display({
            title:
                CFM.getMode() === "tv"
                    ? translations[LOCALE].settings.tvModeConfig
                    : translations[LOCALE].settings.fullscreenConfig,
            content: configContainer,
        });
    }

    const extraBar = document.querySelector(EXTRA_BAR_SELECTOR)?.childNodes[0] as HTMLElement;
    if (CFM.getGlobal("fsHideOriginal")) {
        if (
            (extraBar.lastChild as HTMLElement).classList.contains("control-button") ||
            (extraBar.lastChild as HTMLElement)?.title == "Full screen"
        )
            extraBar?.lastChild?.remove();
    }
    if (CFM.getGlobal("activationTypes") != "keys") {
        if (CFM.getGlobal("buttonActivation") !== "tv") {
            // Add Full Screen Button on bottom bar
            const defButton = document.createElement("button");
            defButton.classList.add("button", "fsd-button", "control-button", "InvalidDropTarget");
            defButton.id = "fs-button";
            defButton.setAttribute("title", translations[LOCALE].fullscreenBtnDesc);

            defButton.innerHTML = ICONS.FULLSCREEN;
            defButton.onclick = openwithDef;

            defButton.oncontextmenu = (evt) => {
                evt.preventDefault();
                CFM.setMode("def");
                openConfig();
            };
            (extraBar as HTMLElement)?.append(defButton);
        }

        if (CFM.getGlobal("buttonActivation") !== "def") {
            // Add TV Mode Button on top bar
            const tvButton = document.createElement("button");

            tvButton.innerHTML = ICONS.TV_MODE;
            tvButton.id = "TV-button";
            tvButton.setAttribute("title", translations[LOCALE].tvBtnDesc);

            tvButton.onclick = openwithTV;
            if (document.querySelector(TOP_BAR_SELECTOR)) {
                tvButton.classList.add(
                    "button",
                    "tm-button",
                    "main-topBar-button",
                    "InvalidDropTarget",
                );
                document.querySelector(TOP_BAR_SELECTOR)?.append(tvButton);
            } else {
                tvButton.classList.add(
                    "tm-button",
                    "Button-buttonTertiary-small-isUsingKeyboard-useBrowserDefaultFocusStyle-condensedAll",
                    "Button-small-small-buttonTertiary-condensedAll-isUsingKeyboard-useBrowserDefaultFocusStyle",
                    "Button-buttonTertiary-small-small-isUsingKeyboard-useBrowserDefaultFocusStyle-condensedAll",
                    "encore-text-body-small-bold",
                    "main-globalNav-buddyFeed",
                    "Button-sc-1dqy6lx-0",
                );
                document.querySelector(TOP_BAR_SELECTOR_GLOBAL_NAVBAR)?.prepend(tvButton);
            }

            // document.querySelector(TOP_BAR_SELECTOR)?.append(tvButton);
            tvButton.oncontextmenu = (evt) => {
                evt.preventDefault();
                CFM.setMode("tv");
                openConfig();
            };
        }
    }

    render();

    switch (CFM.getGlobal("autoLaunch")) {
        case "default":
            openwithDef();
            break;
        case "tvmode":
            openwithTV();
            break;
        case "lastused":
            if (CFM.getGlobal("tvMode")) openwithTV();
            else openwithDef();
            break;
        case "never":
        default:
            break;
    }
}

export default main;
