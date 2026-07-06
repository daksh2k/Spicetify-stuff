/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ReactDOM from "react-dom";
import React from "react";

import Utils from "./utils/utils";
import CFM from "./utils/config";
import { modifyIsAnimationRunning } from "./utils/animation";

import translations from "./resources/strings";
import ICONS, { CLASSES_TO_ADD } from "./constants";
import HtmlSelectors from "./utils/selectors";
import { Config, Settings } from "./types/fullscreen";

import showWhatsNew from "./services/whats-new";
import { getHtmlContent } from "./services/html-creator";
import { initMoustrapRecord } from "./services/mousetrap-record";

import SeekableProgressBar from "./ui/components/ProgressBar/ProgressBar";
import SeekableVolumeBar from "./ui/components/VolumeBar/VolumeBar";
import OverviewCard from "./ui/components/OverviewPopup/OverviewCard";

import { DOM } from "./ui/elements";
import { ConfigManager } from "./ui/components/Config/Config";
import { UpNext } from "./ui/components/UpNext/UpNext";
import { Context } from "./ui/components/Context/Context";
import { PlayerControls } from "./ui/components/PlayerControls/PlayerControls";
import { ExtraControls } from "./ui/components/ExtraControls/ExtraControls";
import { Lyrics } from "./ui/components/Lyrics/Lyrics";
import { Background } from "./utils/background";

import "./styles/base.scss";
import "./styles/tvMode.scss";
import "./styles/defaultMode.scss";
import "./styles/settings.scss";

/** Multiplier on 1× (classic) album-art width/max/min; unused for Auto layout. */
const DEFAULT_MODE_CLASSIC_ALBUM_MULT: Partial<
    Record<Config["defaultModeAlbumArtSizing"], number>
> = {
    scale125: 1.25,
    scale15: 1.5,
    scale175: 1.75,
    scale2: 2,
    scale25: 2.5,
};

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
    DOM.init();

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

    let LOCALE: string = CFM.getGlobal("locale") as Config["locale"];

    function render() {
        DOM.container.classList.toggle("lyrics-active", Boolean(CFM.get("lyricsDisplay")));
        Utils.toggleQueuePanel(DOM.queue, false);
        DOM.container.classList.toggle(
            "vertical-mode",
            (CFM.get("verticalMonitorSupport") as Settings["verticalMonitorSupport"]) &&
            window.innerWidth < window.innerHeight,
        );
        const albumSizing = CFM.getGlobal("defaultModeAlbumArtSizing") as Config["defaultModeAlbumArtSizing"];
        DOM.container.classList.toggle("album-art-auto-scale", albumSizing === "auto");
        const classicMult = DEFAULT_MODE_CLASSIC_ALBUM_MULT[albumSizing];
        if (classicMult != null) {
            DOM.container.style.setProperty("--fsd-album-size-mult", String(classicMult));
        } else {
            DOM.container.style.removeProperty("--fsd-album-size-mult");
        }
        document.body.classList.toggle(
            "vertical-mode",
            (CFM.get("verticalMonitorSupport") as Settings["verticalMonitorSupport"]) &&
            window.innerWidth < window.innerHeight,
        );
        DOM.container.setAttribute("data-locale", LOCALE);
        DOM.container.setAttribute("mode", CFM.getMode());
        if (!CFM.get("lyricsDisplay") || CFM.get("extraControls") === "never")
            DOM.container.classList.remove("lyrics-hide-force");

        Spicetify.Player.removeEventListener("songchange", updateInfo);
        Spicetify.Player.removeEventListener("onplaypause", PlayerControls.updatePlayerControls.bind(PlayerControls));
        Spicetify.Player.removeEventListener("onplaypause", updatePlayingIcon);
        document.removeEventListener("fullscreenchange", fullScreenListener);
        Spicetify.Platform.PlayerAPI._events.removeListener("update", ExtraControls.updateExtraControls.bind(ExtraControls));

        // Disconnect heart observer if it exists (handled in ExtraControls but we might need a reference here or move it completely)
        // ExtraControls handles its own observer logic if we move it there? 
        // Actually ExtraControls.updateExtraControls uses DOM elements.
        // The observer was local in app.tsx. Let's check ExtraControls.
        // ExtraControls has static updateExtraControls.
        // We need to handle the observer in activate/deactivate or make it static in ExtraControls.
        // Let's assume we handle it in activate/deactivate using ExtraControls methods if possible or just keep it here if it's simple.
        // But we moved updateHeart to ExtraControls.

        Spicetify.Platform.PlayerAPI._events.removeListener("queue_update", UpNext.updateUpNext.bind(UpNext));
        Spicetify.Platform.PlayerAPI._events.removeListener("update", UpNext.updateUpNextShow.bind(UpNext));
        window.removeEventListener("resize", resizeEvents);
        UpNext.upNextShown = false;

        modifyIsAnimationRunning(false);

        if (origLoc !== "/lyrics-plus" && Utils.isModeActivated()) {
            Utils.revertPathHistory(origLoc);
        }
        window.dispatchEvent(new Event("fad-request"));
        window.removeEventListener("lyrics-plus-update", Lyrics.handleLyricsUpdate);

        handleMouseMoveDeactivation();

        DOM.style.innerHTML = `
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

        DOM.container.innerHTML = getHtmlContent(DOM.container.classList.contains("lyrics-hide-force"));

        DOM.back = DOM.container.querySelector("canvas")!;
        DOM.back.width = window.innerWidth;
        DOM.back.height = window.innerHeight;

        DOM.cover = DOM.container.querySelector("#fsd-art-image")!;
        DOM.title = DOM.container.querySelector("#fsd-title span")!;
        DOM.artist = DOM.container.querySelector("#fsd-artist span")!;
        DOM.album = DOM.container.querySelector("#fsd-album span")!;

        if (CFM.get("contextDisplay") !== "never") {
            DOM.ctx_container = DOM.container.querySelector("#fsd-ctx-container")!;
            DOM.ctx_icon = DOM.container.querySelector("#fsd-ctx-icon")!;
            DOM.ctx_source = DOM.container.querySelector("#fsd-ctx-source")!;
            DOM.ctx_name = DOM.container.querySelector("#fsd-ctx-name")!;
        }
        if (CFM.get("upnextDisplay") !== "never") {
            DOM.fsd_myUp = DOM.container.querySelector("#fsd-upnext-container")!;
            DOM.fsd_myUp.onclick = Spicetify.Player.next;
            DOM.fsd_nextCover = DOM.container.querySelector("#fsd_next_art_image")!;
            DOM.fsd_up_next_text = DOM.container.querySelector("#fsd_up_next_text")!;
            DOM.fsd_next_tit_art = DOM.container.querySelector("#fsd_next_tit_art")!;
            DOM.fsd_next_tit_art_inner = DOM.container.querySelector("#fsd_next_tit_art_inner")!;
            DOM.fsd_first_span = DOM.container.querySelector("#fsd_first_span")!;
            DOM.fsd_second_span = DOM.container.querySelector("#fsd_second_span")!;
        }
        if (CFM.get("icons")) {
            DOM.playingIcon = DOM.container.querySelector("#playing-icon")!;

            //Clicking on playing icon disables it and remembers the config
            DOM.playingIcon.onclick = () => {
                CFM.set("titleMovingIcon", false);
                DOM.playingIcon.classList.add("hidden");
                DOM.pausedIcon.classList.remove("hidden");
            };
            DOM.pausedIcon = DOM.container.querySelector("#paused-icon")!;
            DOM.pausedIcon.onclick = () => {
                CFM.set("titleMovingIcon", true);
                DOM.playingIcon.classList.remove("hidden");
                DOM.pausedIcon.classList.add("hidden");
                updatePlayingIcon({ data: { is_paused: !Spicetify.Player.isPlaying() } });
            };
        }
        if (CFM.get("playerControls") !== "never") {
            DOM.play = DOM.container.querySelector("#fsd-play")!;
            DOM.play.onclick = () => {
                Utils.fadeAnimation(DOM.play);
                Spicetify.Player.togglePlay();
            };
            DOM.nextControl = DOM.container.querySelector("#fsd-next")!;
            DOM.nextControl.onclick = () => {
                Utils.fadeAnimation(DOM.nextControl, "fade-ri");
                Spicetify.Player.next();
            };
            DOM.backControl = DOM.container.querySelector("#fsd-back")!;
            DOM.backControl.onclick = () => {
                Utils.fadeAnimation(DOM.backControl, "fade-le");
                Spicetify.Player.back();
            };
        }
        if (CFM.get("extraControls") !== "never") {
            DOM.heart = DOM.container.querySelector("#fsd-heart")!;
            DOM.shuffle = DOM.container.querySelector("#fsd-shuffle")!;
            DOM.repeat = DOM.container.querySelector("#fsd-repeat")!;

            DOM.heart.onclick = () => {
                Utils.fadeAnimation(DOM.heart);
                Spicetify.Player.toggleHeart();
            };
            DOM.shuffle.onclick = () => {
                Utils.fadeAnimation(DOM.shuffle);
                Spicetify.Player.toggleShuffle();
            };
            DOM.repeat.onclick = () => {
                Utils.fadeAnimation(DOM.repeat);
                Spicetify.Player.toggleRepeat();
            };

            if (CFM.get("invertColors") === "auto") {
                DOM.invertButton = DOM.container.querySelector("#fsd-invert")!;
                DOM.invertButton.onclick = ExtraControls.toggleInvert.bind(ExtraControls);
            }
            DOM.queue = DOM.container.querySelector("#fsd-queue")!;
            DOM.queue.onclick = () => toggleQueue();
        }
    }

    function toggleQueue() {
        Utils.toggleQueue(DOM.queue);
        if (DOM.queue) {
            Utils.fadeAnimation(DOM.queue);
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
            Context.updateContext().catch((err) => console.error("Error getting context: ", err));

        // prepare title
        let songName = meta?.title;
        if (CFM.get("trimTitle")) {
            songName = Utils.trimTitle(songName);
        }

        // prepare artist
        let artistData: string[][];
        const artistNameList = Object.keys(meta!)
            .filter((key) => key.startsWith("artist_name"))
            .sort() as Array<keyof typeof meta>;

        const artistUriList = Object.keys(meta!)
            .filter((key) => key.startsWith("artist_uri"))
            .sort() as Array<keyof typeof meta>;

        artistData = artistNameList.map((key, index) => [meta![key], meta![artistUriList[index]]]);

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
                    if (updatedAlbum) DOM.album.innerText = albumText || "";
                });
            }
        }

        Background.updateBackground(meta!);

        // prepare cover image
        DOM.coverImg.src = meta?.image_xlarge_url;

        // update all the things on cover load
        DOM.coverImg.onload = () => {
            DOM.cover.style.backgroundImage = `url("${DOM.coverImg.src}")`;
            DOM.title.innerText = songName || "";
            DOM.title.setAttribute("uri", Spicetify.Player.data?.item?.uri || "");

            // combine artist in a list with each span and separated by comma
            DOM.artist.innerHTML = `${artistData
                .map((artist) => `<span uri=${artist[1]}>${artist[0]}</span>`)
                .join(", ")}`;

            DOM.artist.querySelectorAll("span").forEach((span) => {
                span.onclick = () => {
                    handleNavigation(span.getAttribute("uri")!);
                };
            });

            if (DOM.album) {
                DOM.album.innerText = albumText || "";
                DOM.album.setAttribute("uri", meta?.album_uri || "");
                updatedAlbum = true;
            }
            if (CFM.get("lyricsDisplay") && CFM.get("autoHideLyrics")) {
                const lyricsContainer = DOM.container.querySelector<HTMLElement>(
                    "#fad-lyrics-plus-container",
                );
                if (lyricsContainer) {
                    Lyrics.autoHideLyrics();
                }
            }
        };

        // Placeholder
        DOM.coverImg.onerror = () => {
            console.error("Check your Internet! Unable to load Image");
            DOM.coverImg.src = ICONS.OFFLINE_SVG;
        };
    }

    function updatePlayingIcon(evt: any) {
        if (evt.data.is_paused || evt.data.isPaused) {
            DOM.pausedIcon.classList.remove("hidden");
            DOM.playingIcon.classList.add("hidden");
        } else {
            DOM.pausedIcon.classList.toggle("hidden", CFM.get("titleMovingIcon") as boolean);
            DOM.playingIcon.classList.toggle("hidden", !CFM.get("titleMovingIcon"));
        }
    }

    let curTimer: NodeJS.Timeout;

    function hideCursor() {
        if (curTimer) {
            clearTimeout(curTimer);
        }
        DOM.container.style.cursor = "default";
        curTimer = setTimeout(() => (DOM.container.style.cursor = "none"), 2000);
    }

    function handleMouseMoveActivation() {
        DOM.container.addEventListener("mousemove", hideCursor);
        hideCursor();
        if (CFM.get("contextDisplay") === "mousemove") {
            DOM.container.addEventListener("mousemove", Context.hideContext.bind(Context));
            Context.hideContext();
        }
        if (CFM.get("extraControls") === "mousemove") {
            DOM.container.addEventListener("mousemove", ExtraControls.hideExtraControls.bind(ExtraControls));
            ExtraControls.hideExtraControls();
        }
        if (CFM.get("playerControls") === "mousemove") {
            DOM.container.addEventListener("mousemove", PlayerControls.hidePlayerControls.bind(PlayerControls));
            PlayerControls.hidePlayerControls();
        }
    }

    function handleMouseMoveDeactivation() {
        DOM.container.removeEventListener("mousemove", hideCursor);
        DOM.container.removeEventListener("mousemove", Context.hideContext.bind(Context));
        DOM.container.removeEventListener("mousemove", ExtraControls.hideExtraControls.bind(ExtraControls));
        DOM.container.removeEventListener("mousemove", PlayerControls.hidePlayerControls.bind(PlayerControls));

        if (curTimer) clearTimeout(curTimer);
        if (Context.ctxTimer) clearTimeout(Context.ctxTimer);
        if (ExtraControls.extraControlsTimer) clearTimeout(ExtraControls.extraControlsTimer);
        if (PlayerControls.playerControlsTimer) clearTimeout(PlayerControls.playerControlsTimer);
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
    const heartObserver = new MutationObserver(ExtraControls.updateHeart.bind(ExtraControls));

    async function activate() {
        Utils.toggleQueuePanel(DOM.queue, true);
        document.body.classList.add(...CLASSES_TO_ADD);
        if (CFM.get("enableFullscreen")) await Utils.fullScreenOn()?.catch((err) => { });
        else await Utils.fullScreenOff()?.catch((err) => { });
        setTimeout(() => {
            updateInfo();
            window.addEventListener("resize", resizeEvents);
            resizeEvents();
            DOM.container.querySelectorAll(".fsd-song-meta span").forEach((span) => {
                (span as HTMLElement).onclick = (evt: any) => {
                    handleNavigation(evt.target?.getAttribute("uri") ?? "");
                };
            });
        }, 200);
        Spicetify.Player.addEventListener("songchange", updateInfo);
        handleMouseMoveActivation();
        DOM.container.querySelector<HTMLElement>("#fsd-foreground")!.oncontextmenu = ConfigManager.openConfig.bind(ConfigManager);
        DOM.container.querySelector<HTMLElement>("#fsd-foreground")!.ondblclick = deactivate;
        DOM.back.oncontextmenu = ConfigManager.openConfig.bind(ConfigManager);
        DOM.back.ondblclick = deactivate;
        if (CFM.get("upnextDisplay") !== "never") {
            UpNext.updateUpNextShow();
            Spicetify.Platform.PlayerAPI._events.addListener("queue_update", UpNext.updateUpNext.bind(UpNext));
            Spicetify.Platform.PlayerAPI._events.addListener("update", UpNext.updateUpNextShow.bind(UpNext));
        }
        if (CFM.get("volumeDisplay") !== "never") {
            ReactDOM.render(
                <SeekableVolumeBar state={CFM.get("volumeDisplay") as Settings["volumeDisplay"]} />,
                DOM.container.querySelector("#fsd-volume-parent"),
            );
        }
        if (CFM.get("icons")) {
            updatePlayingIcon({ data: { is_paused: !Spicetify.Player.isPlaying() } });
            Spicetify.Player.addEventListener("onplaypause", updatePlayingIcon);
        }
        if (CFM.get("progressBarDisplay") !== "never") {
            ReactDOM.render(
                <SeekableProgressBar
                    state={CFM.get("progressBarDisplay") as Settings["progressBarDisplay"]}
                />,
                DOM.container.querySelector("#fsd-progress-parent"),
            );
        }
        if (CFM.get("overviewDisplay")) {
            ReactDOM.render(
                <OverviewCard
                    onExit={deactivate}
                    onToggle={() => {
                        CFM.getGlobal("tvMode") ? openwithDef() : openwithTV();
                    }}
                />,
                DOM.container.querySelector("#fsd-overview-card-parent"),
            );
        }
        if (CFM.get("playerControls") !== "never") {
            PlayerControls.updatePlayerControls({ data: { is_paused: !Spicetify.Player.isPlaying() } });
            Spicetify.Player.addEventListener("onplaypause", PlayerControls.updatePlayerControls.bind(PlayerControls));
        }
        if (CFM.get("extraControls") !== "never") {
            ExtraControls.updateExtraControls(null);
            Utils.addObserver(heartObserver, ".control-button-heart", {
                attributes: true,
                attributeFilter: ["aria-checked"],
            });
            Spicetify.Platform.PlayerAPI._events.addListener("update", ExtraControls.updateExtraControls.bind(ExtraControls));
        }
        document.querySelector(".Root__top-container")?.append(DOM.style, DOM.container);
        if (CFM.get("lyricsDisplay")) {
            window.addEventListener("lyrics-plus-update", Lyrics.handleLyricsUpdate);
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
            Spicetify.Mousetrap.bind("l", Lyrics.toggleLyrics);
        }
        Spicetify.Mousetrap.bind("c", () => {
            const popup = document.querySelector("dialog.fs-popup-modal");
            if (popup) (popup as HTMLDialogElement).close();
            else ConfigManager.openConfig();
        });
        Spicetify.Mousetrap.bind("q", toggleQueue);
    }

    async function deactivate() {
        Utils.toggleQueuePanel(DOM.queue, false);
        modifyIsAnimationRunning(false);
        Spicetify.Player.removeEventListener("songchange", updateInfo);
        handleMouseMoveDeactivation();
        window.removeEventListener("resize", resizeEvents);
        if (CFM.get("upnextDisplay") !== "never") {
            UpNext.upNextShown = false;
            Spicetify.Platform.PlayerAPI._events.removeListener("queue_update", UpNext.updateUpNext.bind(UpNext));
            Spicetify.Platform.PlayerAPI._events.removeListener("update", UpNext.updateUpNextShow.bind(UpNext));
        }
        ReactDOM.unmountComponentAtNode(DOM.container.querySelector("#fsd-volume-parent")!);
        ReactDOM.unmountComponentAtNode(DOM.container.querySelector("#fsd-progress-parent")!);
        ReactDOM.unmountComponentAtNode(DOM.container.querySelector("#fsd-overview-card-parent")!);
        if (CFM.get("icons")) {
            Spicetify.Player.removeEventListener("onplaypause", updatePlayingIcon);
        }
        if (CFM.get("playerControls") !== "never") {
            Spicetify.Player.removeEventListener("onplaypause", PlayerControls.updatePlayerControls.bind(PlayerControls));
        }
        if (CFM.get("extraControls") !== "never") {
            heartObserver.disconnect();
            Spicetify.Platform.PlayerAPI._events.removeListener("update", ExtraControls.updateExtraControls.bind(ExtraControls));
        }
        document.body.classList.remove(...CLASSES_TO_ADD);
        UpNext.upNextShown = false;
        if (CFM.get("enableFullscreen")) {
            await Utils.fullScreenOff()?.catch((err) => { });
        }
        const popup = document.querySelector("dialog.fs-popup-modal");
        if (popup) (popup as HTMLDialogElement).close();
        DOM.style.remove();
        DOM.container.remove();
        if (CFM.get("lyricsDisplay")) {
            window.removeEventListener("lyrics-plus-update", Lyrics.handleLyricsUpdate);
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

    function resizeEvents() {
        if (CFM.get("upnextDisplay") !== "never") UpNext.updateUpNext();
        Background.updateBackground(Spicetify.Player.data.item?.metadata, true);
        DOM.container.classList.toggle(
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

    ConfigManager.init(
        render,
        activate,
        deactivate,
        openwithDef,
        openwithTV,
        Background.updateBackground.bind(Background),
        UpNext.updateUpNextShow.bind(UpNext),
        Background.updateMainColor.bind(Background)
    );

    const extraBar = HtmlSelectors.getExtraBarSelector() as HTMLElement;
    if (CFM.getGlobal("fsHideOriginal") && extraBar) {
        extraBar.childNodes.forEach((child: Node) => {
            const el = child as HTMLElement;
            if (el.nodeType === Node.ELEMENT_NODE && el.getAttribute("data-testid") === "fullscreen-mode-button") {
                el.remove();
            }
        });
    }
    if (CFM.getGlobal("activationTypes") != "keys") {
        if (CFM.getGlobal("buttonActivation") !== "tv") {
            // Add Full Screen Button on bottom bar
            const defButton = document.createElement("button");
            defButton.classList.add("button");
            defButton.id = "fullscreen-default-button";
            defButton.setAttribute("title", translations[LOCALE].fullscreenBtnDesc);

            defButton.innerHTML = ICONS.FULLSCREEN;
            defButton.onclick = openwithDef;

            defButton.oncontextmenu = (evt) => {
                evt.preventDefault();
                CFM.setMode("def");
                ConfigManager.openConfig();
            };
            (extraBar as HTMLElement)?.append(defButton);
        }

        if (CFM.getGlobal("buttonActivation") !== "def") {
            // Add TV Mode Button on top bar
            const tvButton = document.createElement("button");

            tvButton.innerHTML = ICONS.TV_MODE;
            tvButton.id = "fullscreen-tv-button";
            tvButton.setAttribute("title", translations[LOCALE].tvBtnDesc);

            tvButton.onclick = openwithTV;

            tvButton.classList.add(
                "Button-buttonTertiary-small-isUsingKeyboard-useBrowserDefaultFocusStyle-condensedAll",
                "Button-small-small-buttonTertiary-condensedAll-isUsingKeyboard-useBrowserDefaultFocusStyle",
                "Button-buttonTertiary-small-small-isUsingKeyboard-useBrowserDefaultFocusStyle-condensedAll",
                "encore-text-body-small-bold",
                "main-globalNav-buddyFeed",
                "Button-sc-1dqy6lx-0",
                "main-topBar-buddyFeed"
            );
            HtmlSelectors.getTopBarSelector()?.prepend(tvButton);

            // document.querySelector(TOP_BAR_SELECTOR)?.append(tvButton);
            tvButton.oncontextmenu = (evt) => {
                evt.preventDefault();
                CFM.setMode("tv");
                ConfigManager.openConfig();
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
