// @ts-no-check
// NAME: Full Screen Mode
// AUTHOR: daksh2k
// VERSION: 1.0
// DESCRIPTION: Fancy artwork and track status display.

/// <reference path="../globals.d.ts" />

let INIT_RETRIES = 0;
function fullScreen() {
    const extraBar = document.querySelector(".main-nowPlayingBar-right")?.childNodes[0] || document.querySelector(".ExtraControls") || document.querySelector(".ClYTTKGdd9KB7D9MXicj");
    const topBar = document.querySelector(".main-topBar-historyButtons");
    const { CosmosAsync, LocalStorage, Keyboard, ContextMenu, Player, Platform } = Spicetify;

    let entriesToVerify = [topBar, extraBar, CosmosAsync, LocalStorage, ContextMenu, Keyboard, Player, Platform];

    if (INIT_RETRIES > 50) {
        entriesToVerify.forEach((entry) => {
            if (!entry) {
                console.error("Spicetify method not available. Report issue on GitHub or run Spicetify.test() to test.");
                Spicetify.showNotification(`Error initializing "fullscreen.js" extension. Spicetify method not available. Report issue on GitHub.`);
            }
        });
        return;
    }
    if (entriesToVerify.some((it) => !it)) {
        setTimeout(fullScreen, 300);
        INIT_RETRIES += 1;
        return;
    }
    Spicetify.Keyboard.registerShortcut(
        {
            key: Spicetify.Keyboard.KEYS["T"],
            ctrl: false,
            shift: false,
            alt: false,
        },
        openwithTV
    );
    Spicetify.Keyboard.registerShortcut(
        {
            key: Spicetify.Keyboard.KEYS["F"],
            ctrl: false,
            shift: false,
            alt: false,
        },
        openwithDef
    );

    function openwithTV() {
        if (!document.body.classList.contains("fsd-activated") || !CONFIG.tvMode || ACTIVE !== "tv") {
            if (!CONFIG.tvMode || ACTIVE !== "tv") {
                CONFIG["tvMode"] = true;
                ACTIVE = "tv";
                saveConfig();
                render();
            }
            activate();
        } else deactivate();
    }

    function openwithDef() {
        if (!document.body.classList.contains("fsd-activated") || CONFIG.tvMode || ACTIVE !== "def") {
            if (CONFIG.tvMode || ACTIVE !== "def") {
                CONFIG["tvMode"] = false;
                ACTIVE = "def";
                saveConfig();
                render();
            }
            activate();
        } else deactivate();
    }
    const DEFAULTS = {
        tv: {
            lyricsDisplay: true,
            lyricsAlignment: "right",
            animationTempo: 0.2,
            progressBarDisplay: false,
            playerControls: false,
            trimTitle: true,
            showAlbum: "d",
            showAllArtists: true,
            icons: true,
            titleMovingIcon: false,
            enableFade: true,
            enableFullscreen: true,
            extraControls: false,
            upnextDisplay: true,
            contextDisplay: "a",
            volumeDisplay: "o",
            themedButtons: true,
            themedIcons: true,
            invertColors: "n",
            backAnimationTime: 0.4,
            upNextAnim: "sp",
            upnextTimeToShow: 45,
            blurSize: 0,
            backgroundBrightness: 0.4,
        },
        def: {
            lyricsDisplay: true,
            lyricsAlignment: "right",
            animationTempo: 0.2,
            progressBarDisplay: true,
            playerControls: true,
            trimTitle: true,
            showAlbum: "n",
            showAllArtists: true,
            icons: false,
            titleMovingIcon: false,
            enableFade: true,
            enableFullscreen: true,
            backgroundChoice: "a",
            extraControls: true,
            upnextDisplay: true,
            contextDisplay: "m",
            volumeDisplay: "o",
            themedButtons: true,
            themedIcons: false,
            invertColors: "n",
            backAnimationTime: 1,
            upNextAnim: "sp",
            upnextTimeToShow: 30,
            coloredBackChoice: "DESATURATED",
            blurSize: 24,
            backgroundBrightness: 0.7,
        },
        tvMode: false,
    };
    const CONFIG = getConfig();
    if (localStorage.getItem("full-screen:inverted") === null) {
        localStorage.setItem("full-screen:inverted", "{}");
    }
    const INVERTED = JSON.parse(localStorage.getItem("full-screen:inverted"));
    let ACTIVE = CONFIG.tvMode ? "tv" : "def";

    const OFFLINESVG = `data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCI+CiAgPHJlY3Qgc3R5bGU9ImZpbGw6I2ZmZmZmZiIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiB4PSIwIiB5PSIwIiAvPgogIDxwYXRoIGZpbGw9IiNCM0IzQjMiIGQ9Ik0yNi4yNSAxNi4xNjJMMjEuMDA1IDEzLjEzNEwyMS4wMTIgMjIuNTA2QzIwLjU5NCAyMi4xOTIgMjAuMDgxIDIxLjk5OSAxOS41MTkgMjEuOTk5QzE4LjE0MSAyMS45OTkgMTcuMDE5IDIzLjEyMSAxNy4wMTkgMjQuNDk5QzE3LjAxOSAyNS44NzggMTguMTQxIDI2Ljk5OSAxOS41MTkgMjYuOTk5QzIwLjg5NyAyNi45OTkgMjIuMDE5IDI1Ljg3OCAyMi4wMTkgMjQuNDk5QzIyLjAxOSAyNC40MjIgMjIuMDA2IDE0Ljg2NyAyMi4wMDYgMTQuODY3TDI1Ljc1IDE3LjAyOUwyNi4yNSAxNi4xNjJaTTE5LjUxOSAyNS45OThDMTguNjkyIDI1Ljk5OCAxOC4wMTkgMjUuMzI1IDE4LjAxOSAyNC40OThDMTguMDE5IDIzLjY3MSAxOC42OTIgMjIuOTk4IDE5LjUxOSAyMi45OThDMjAuMzQ2IDIyLjk5OCAyMS4wMTkgMjMuNjcxIDIxLjAxOSAyNC40OThDMjEuMDE5IDI1LjMyNSAyMC4zNDYgMjUuOTk4IDE5LjUxOSAyNS45OThaIi8+Cjwvc3ZnPgo=`;

    const style = document.createElement("style");

    const container = document.createElement("div");
    container.id = "full-screen-display";
    container.classList.add("Video", "VideoPlayer--fullscreen", "VideoPlayer--landscape");

    let cover,
        back,
        title,
        artist,
        album,
        prog,
        elaps,
        durr,
        play,
        ctx_container,
        ctx_icon,
        ctx_source,
        ctx_name,
        fsd_nextCover,
        fsd_up_next_text,
        fsd_next_tit_art,
        fsd_next_tit_art_inner,
        fsd_first_span,
        fsd_second_span;
    const nextTrackImg = new Image();
    const artistImg = new Image();

    function render() {
        container.classList.toggle("lyrics-active", !!CONFIG[ACTIVE].lyricsDisplay);
        if (!CONFIG[ACTIVE].lyricsDisplay || !CONFIG[ACTIVE].extraControls) container.classList.remove("lyrics-hide-force");
        const styleBase = `
#full-screen-display {
    display: none;
    z-index: 100;
    position: fixed;
    width: 100%;
    height: 100%;
    cursor: default;
    left: 0;
    top: 0;
    --transition-duration: .8s;
    --transition-function: ease-in-out;
    --main-color: 255,255,255;
    --contrast-color: 0,0,0;
    --primary-color: rgba(var(--main-color),1);
    --secondary-color: rgba(var(--main-color),.7);
    --tertiary-color: rgba(var(--main-color),.5);
    --theme-color: 175,175,175;
    --theme-background-color: rgba(175,175,175,.6);
    --theme-hover-color: rgba(175,175,175,.3);
    --theme-main-color: rgba(var(--theme-color),1);
}
#full-screen-display.themed-buttons{
    --theme-background-color: rgba(var(--theme-color),.6);
    --theme-hover-color: rgba(var(--theme-color),.3);
}
.unavailable{
    color: var(--tertiary-color) !important;
    pointer-events: none !important;
    opacity: .5 !important;
    background: transparent !important;
}
/*
.unavailable::after{
    content: "";
    display: block;
    background-color: #FFF;
    bottom: 50%;
    left: 0;
    right: 0;
    position: absolute;
    transform: rotateZ(45deg);
    width: 25px;
    height: 1.5px;
}
.unavailable::before{
    content: "";
    display: block;
    background-color: #FFF;
    bottom: 50%;
    left: 0;
    right: 0;
    position: absolute;
    transform: rotateZ(-45deg);
    width: 25px;
    height: 1.5px;
}
*/
@keyframes fadeUp{
    0%{
        opacity:0;
        transform:translateY(-10px)
    }
    to{
        opacity:1;
        transform:translateY(0)
    }
}
@keyframes fadeDo{
    0%{
        opacity:0;
        transform:translateY(10px)
    }
    to{
        opacity:1;
        transform:translateY(0)
    }
}
@keyframes fadeRi{
    0%{
        opacity:0;
        transform:translateX(10px)
    }
    to{
        opacity:1;
        transform:translateX(0)
    }
}
@keyframes fadeLe{
    0%{
        opacity:0;
        transform:translateX(-10px)
    }
    to{
        opacity:1;
        transform:translateX(0)
    }
}
.fade-do{
    animation: fadeDo .5s cubic-bezier(.3, 0, 0, 1);
}
.fade-up{
    animation: fadeUp .5s cubic-bezier(.3, 0, 0, 1);
}
.fade-ri{
    animation: fadeRi .5s cubic-bezier(.3, 0, 0, 1);
}
.fade-le{
    animation: fadeLe .5s cubic-bezier(.3, 0, 0, 1);
}
button.dot-after{
    padding-bottom: 3px !important;
}
.dot-after:after{
    background-color: currentColor;
    border-radius: 50%;
    bottom: 3px;
    content: "";
    display: block;
    height: 4px;
    left: 50%;
    position: absolute;
    transform: translateX(-50%);
    width: 4px;
}
#fsd-ctx-container {
    background-color: transparent;
    color: var(--secondary-color);
    position: fixed;
    float: left;
    top: 30px;
    left: 50px;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    text-align: left;
    z-index: 50;
    transition: all 1s ease-in-out;
    opacity: 1;
    max-width: 40%;
}
#fsd-ctx-details{
    padding-left: 18px;
    line-height: initial;
    font-size: 18px;
    overflow: hidden;
}
#fsd-ctx-icon{
    width: 48px;
    height : 48px;
}
#fsd-ctx-icon svg{
    fill: var(--primary-color) !important;
}
#fsd-ctx-source{
    text-transform: uppercase;
}
#fsd-ctx-name{
    font-weight: 700;
    font-size: 20px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
}
.ctx-no-name{
    padding-bottom: 2px;
    font-size: 24px;
    font-weight: 600;
}
#fsd-upnext-container{
    float: right;
    width: 472px;
    height: 102px;
    max-width: 45%;
    position: fixed;
    top: 45px;
    right: 60px;
    display: flex;
    border: 1px solid rgba(130,130,130,.7);
    border-radius: 10px;
    background-color: rgba(20,20,20,1);
    flex-direction: row;
    text-align: left;
    z-index: 50;
    transition: transform .8s ease-in-out;
    transform: translateX(600px);
}
#fsd_next_art_image{
    background-size: cover;
    background-position: center;
    width:  100px;
    height: 100px;
    border-radius: 9px 0 0 9px;
}
#fsd_next_details{
    padding-left: 18px;
    padding-top: 17px;
    line-height: initial;
    width: calc(100% - 115px);
    color: rgba(255,255,255,1);
    font-size: 19px;
    overflow: hidden;
}
#fsd_next_tit_art{
    padding-top: 9px;
    font-size: 22px;
    font-weight: 700;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}
@keyframes fsd_cssmarquee {
    0% {
        transform: translateX(0%);
    }
    18% {
        transform: translateX(0%);
    }
    100% {
         transform: translateX(var(--translate_width_fsd));
    }
}
@keyframes fsd_translate {
    0%,10% {
        transform: translateX(0%);
    }
    50%,55% {
        transform: translateX(var(--translate_width_fsd));
    }
    100% {
        transform: translateX(0%);
    }
}
#fsd-volume-container{
    position: fixed;
    text-align: center;
    background-color: transparent;
    color: var(--primary-color);
    float: left;
    top: 30%;
    left: 30px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 50;
    height: 200px;
    max-height: 33vh;
    transition: transform .8s var(--transition-function);
}
#fsd-volume-container.v-hidden{
    transform: translateX(-100px) scale(.1);
}
#fsd-volume-container:hover{
    transform: translateX(0px) scale(1);
}
#fsd-volume-bar{
    margin: 8px 0;
    border-radius: 4px;
    background-color: rgba(var(--main-color),.35);
    overflow: hidden;
    width: 8px;
    height: 100%;
    display: flex;
    align-items: end;
}
#fsd-volume-bar-inner{
    width: 100%;
    border-radius: 4px;
    background-color: var(--primary-color);
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.8);
    transition: height .2s var(--transition-function);
}
#fsd-volume-icon svg{
    fill: var(--primary-color) !important;
}
.unavailable #fsd-volume-bar-inner{
    height: 100%;
    background-color: var(--tertiary-color);
}
#fsd-volume{
    width: 50px;
    font-size: 18px;
}
#fad-lyrics-plus-container{
    transition: transform var(--transition-duration) var(--transition-function);
    position: absolute;
    right: -50px;
    max-width: 50%;
    top: 7.5vh;
}
.lyrics-unavailable #fad-lyrics-plus-container, .lyrics-hide-force #fad-lyrics-plus-container{
    transform: translateX(1000px) scale3d(.1,.1,.1) rotate(45deg);
}
#fad-lyrics-plus-container .lyrics-lyricsContainer-LyricsContainer{
   --lyrics-color-active: var(--primary-color) !important;
   --lyrics-color-inactive: var(--tertiary-color) !important;
   --lyrics-highlight-background: rgba(var(--contrast-color),.7) !important;
   --lyrics-align-text: ${CONFIG[ACTIVE].lyricsAlignment} !important;
   --animation-tempo: ${CONFIG[ACTIVE].animationTempo}s !important;
   height: 85vh !important;
}
.lyrics-config-button{
    margin-right: 20px;
}
#fsd-foreground {
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-color);
    transition: all var(--transition-duration) var(--transition-function);
}
#fsd-art-image {
    position: relative;
    width: 100%;
    height: 100%;
    padding-bottom: 100%;
    border-radius: 8px;
    background-size: cover;
}
#fsd-art-inner {
    position: absolute;
    left: 3%;
    bottom: 0;
    width: 94%;
    height: 94%;
    z-index: -1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6) !important;
    transform: translateZ(0);
}
#fsd-artist{
    font-weight: 500;
    color: var(--secondary-color);
}
#fsd-album{
    font-weight: 400;
    color: var(--tertiary-color);
}
.fsd-controls{
    display: flex;
    flex-direction: row;
    column-gap: 10px;
}
#fsd-progress {
    width: 100%;
    height: 6px;
    border-radius: 4px;
    background-color: rgba(var(--main-color),.35);
    overflow: hidden;
}
#fsd-progress-inner {
    height: 100%;
    border-radius: 4px;
    background-color: var(--primary-color);
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.8);
}
#fsd-elapsed, #fsd-duration{
    min-width: 35px;
    text-align: center;
}
#fsd-elapsed {
    margin-right: 10px;
}
#fsd-duration {
    margin-left: 10px;
}
#fsd-background {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -2;
}

#full-screen-display .fs-button{
    background: transparent;
    border: 0;
    border-radius: 8px;
    color: var(--primary-color);
    padding: 3px 5px 0 5px;
    cursor: pointer;
    position: relative;
    transition: all .3s var(--transition-function), transform .1s var(--transition-function);
}
#full-screen-display .fs-button:hover{
    transform: scale(1.2);
    filter: saturate(1.5) contrast(1.5) !important;
    background: var(--theme-hover-color);
}
#full-screen-display .fs-button.button-active{
    background: var(--theme-background-color) !important;
    filter: saturate(1.5) contrast(1.5) !important;
}

#fsd-foreground svg{
    fill: var(--primary-color);
    transition: all .3s var(--transition-function);
}
.themed-icons #fsd-foreground svg{
    fill: var(--theme-main-color);
    filter: saturate(1.8);
}
.themed-icons.themed-buttons .fs-button.button-active svg{
    fill: var(--primary-color) !important;
}
.fsd-background-fade {
    transition: background-image var(--fs-transition) linear;
}
body.fsd-activated #full-screen-display {
    display: block;
}
.fsd-activated .Root__top-bar, .fsd-activated .Root__nav-bar, .fsd-activated .Root__main-view, .fsd-activated .Root__now-playing-bar{
  visibility: hidden;
  display: none;
}
.main-notificationBubbleContainer-NotificationBubbleContainer{
  z-index: 1000;
}`;

        const styleChoices = [
            `
#full-screen-display,
#full-screen-display.lyrics-unavailable,
#full-screen-display.lyrics-hide-force{
    --fsd-foreground-transform: 50%;
    --fsd-art-max-width: 600px;
    --fsd-items-max-width: 580px;
    --fsd-title-size: 50px;
    --fsd-sec-size: 28px;
}
#full-screen-display.lyrics-active :not(#full-screen-display.lyrics-unavailable *,#full-screen-display.lyrics-hide-force *){
    --fsd-foreground-transform: 0px;
    --fsd-art-max-width: 500px;
    --fsd-items-max-width: 480px;
    --fsd-title-size: 40px;
    --fsd-sec-size: 23px;
}

#fsd-art, #fsd-details, #fsd-status, #fsd-progress-container{
    transition: all var(--transition-duration) var(--transition-function);
}

#fsd-foreground {
    transform: translateX(var(--fsd-foreground-transform));
    width: 50%;
    flex-direction: column;
    text-align: center;
}
#fsd-art {
    width: calc(100vh - 300px);
    max-width: var(--fsd-art-max-width);
    min-width: 300px;
}

#fsd-title{
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
}
#fsd-album, #fsd-artist{
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
}

#fsd-progress-container {
    width: 28vw;
    max-width: var(--fsd-items-max-width);
    display: flex;
    align-items: center;
}
#fsd-details {
    padding-top: 30px;
    line-height: initial;
    max-width: var(--fsd-items-max-width);
    color: var(--primary-color);
}
#fsd-status {
    display: flex;
    width: 28vw;
    max-width: var(--fsd-items-max-width);
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
}
#fsd-status.active {
    margin: 5px auto 0;
    gap: 10px;
}

#fsd-title {
    font-size: var(--fsd-title-size);
    font-weight: 900;
    transition: all var(--transition-duration) var(--transition-function);
}
#fsd-artist,#fsd-album{
    font-size: var(--fsd-sec-size);
    transition: all var(--transition-duration) var(--transition-function);
}
@media (max-width: 900px), (max-height: 900px){
    #fsd-title{
        font-size: 35px;
        font-weight: 600;
    }
}

#fsd-title svg{
    width: 35px;
    height: 35px;
}
.lyrics-active #fsd-title svg{
    width: 30px;
    height: 30px;
}
.lyrics-unavailable #fsd-title svg,.lyrics-hide-force #fsd-title svg{
    width: 35px;
    height: 35px;
}
#playing-icon{
    width: 28px !important;
    height: 28px !important;
    margin-right: 7px;
}
.lyrics-active #playing-icon{
    margin-right: 2px;
}
.lyrics-unavailable #playing-icon,.lyrics-hide-force #playing-icon{
    margin-right: 7px;
}

#fsd-artist svg, #fsd-album svg{
    width: calc(var(--fsd-sec-size) - 6px);
    height: calc(var(--fsd-sec-size) - 6px);
    margin-right: 5px;
}

.fsd-controls {
    margin-top: 10px;
    margin-bottom: 5px;
}
.fsd-controls-left{
    width: 30%;
    justify-content: flex-start;
}
.fsd-controls-center{
    width: 40%;
    justify-content: center;
    margin: 10px auto 5px;
}
.fsd-controls-right{
    width: 30%;
    justify-content: flex-end;
}
`,
            `#fsd-background-image {
    height: 100%;
    background-size: cover;
    filter: brightness(${CONFIG[ACTIVE].backgroundBrightness}) blur(${CONFIG[ACTIVE].blurSize}px);
    background-position: center;
    transform: translateZ(0);
}

#fsd-foreground {
    flex-direction: row;
    text-align: left;
    justify-content: left;
    align-items: flex-end;
    position: absolute;
    top: auto;
    bottom: 75px;
}
.lyrics-active #fsd-foreground{
    width: max-content;
    max-width: 65%;
}

#fsd-art {
    width: calc(100vw - 840px);
    min-width: 180px;
    max-width: 220px;
    margin-left: 65px;
}

#fsd-progress-container {
    width: 100%;
    max-width: 450px;
    display: flex;
    align-items: center;
}
.fsd-controls + #fsd-progress-container{
    padding-left: 10px;
}
#fsd-details {
    padding-left: 30px;
    line-height: initial;
    width: 80%;
    color: var(--primary-color);
}
#fsd-title, #fsd-album, #fsd-artist{
    display: flex;
    justify-content: flex-start;
    align-items: baseline;
    gap: 5px;
}
#fsd-title span, #fsd-album span, #fsd-artist span{
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
}
#fsd-title span{
    -webkit-line-clamp: 3;
}
#fsd-title svg, #fsd-artist svg, #fsd-album svg{
    flex: 0 0 auto;
}
#fsd-album{
    position: relative;
}
#fsd-album svg{
    position: absolute;
    top: 7px;
}
#fsd-album svg + span{
    margin-left: 40px;
}
#fsd-title {
    font-size: 62px;
    font-weight: 900;
}
@media (max-width: 900px), (max-height: 800px){
    #fsd-title{
        font-size: 40px;
        font-weight: 600;
    }
    #fsd-artist, #fsd-album {
        font-size: 20px;
    }
}
#fsd-artist, #fsd-album {
    font-size: 28px;
}
#fsd-title svg{
    width: 35px;
    height: 45px;
}
#playing-icon{
    width: 30px !important;
    height: 40px !important;
    margin-right: 5px;
}
#fsd-artist svg, #fsd-album svg {
    margin-right: 15px;
    width: 22px;
    height: 22px;
}
#fsd-status {
    display: flex;
    flex-direction: row;
    min-width: 450px;
    max-width: 450px;
    align-items: center;
    justify-content: space-between;
}
#fsd-status.active {
    column-gap: 10px;
    margin: 10px 0;
}
`,
        ];
        const iconStyleChoices = [
            `
#fsd-title svg, #fsd-artist svg, #fsd-album svg {
    display: none;
}`,
            `
#fsd-title svg, #fsd-artist svg, #fsd-album svg {
    transition: all var(--transition-duration) var(--transition-function);
    display: inline-block;
}`,
        ];
        Spicetify.Player.removeEventListener("songchange", updateInfo);
        if (progressListener) clearInterval(progressListener);
        Spicetify.Player.removeEventListener("onplaypause", updatePlayerControls);
        Spicetify.Player.removeEventListener("onplaypause", updatePlayingIcon);
        Spicetify.Player.origin._events.removeListener("update", updateExtraControls);
        heartObserver.disconnect();

        Spicetify.Player.origin._events.removeListener("queue_update", updateUpNext);
        Spicetify.Player.origin._events.removeListener("update", updateUpNextShow);
        window.removeEventListener("resize", updateUpNext);
        upNextShown = false;

        if (Spicetify.Platform?.PlaybackAPI === undefined) Spicetify.Player.origin._events.removeListener("volume", updateVolume);
        else Spicetify.Platform.PlaybackAPI._events.removeListener("volume", updateVolume);

        if (origLoc !== "/lyrics-plus" && document.body.classList.contains("fsd-activated")) {
            Spicetify.Platform.History.push(origLoc);
            Spicetify.Platform.History.entries.splice(Spicetify.Platform.History.entries.length - 3, 2);
            Spicetify.Platform.History.index = Spicetify.Platform.History.index > 0 ? Spicetify.Platform.History.index - 2 : -1;
            Spicetify.Platform.History.length = Spicetify.Platform.History.length > 1 ? Spicetify.Platform.History.length - 2 : 0;
        }
        window.dispatchEvent(new Event("fad-request"));
        window.removeEventListener("lyrics-plus-update", handleLyricsUpdate);

        container.removeEventListener("mousemove", hideCursor);
        container.removeEventListener("mousemove", hideContext);
        container.removeEventListener("mousemove", hideVolume);

        if (curTimer) clearTimeout(curTimer);
        if (ctxTimer) clearTimeout(ctxTimer);
        if (volTimer) clearTimeout(volTimer);

        style.innerHTML = styleBase + styleChoices[CONFIG.tvMode ? 1 : 0] + iconStyleChoices[CONFIG[ACTIVE].icons ? 1 : 0];

        container.innerHTML = `
${
    CONFIG.tvMode
        ? `<div id="fsd-background">
  <div id="fsd-background-image"></div>
</div>`
        : `<canvas id="fsd-background"></canvas>`
}
  ${
      CONFIG[ACTIVE].contextDisplay !== "n"
          ? `
   <div id="fsd-ctx-container">
      <div id="fsd-ctx-icon"></div>
      <div id="fsd-ctx-details">
        <div id="fsd-ctx-source"></div>
        <div id="fsd-ctx-name"></div>
      </div>
    </div>`
          : ""
  }
 ${
     CONFIG[ACTIVE].upnextDisplay
         ? `
<div id="fsd-upnext-container">
      <div id="fsd_next_art">
        <div id="fsd_next_art_image"></div>
       </div>
      <div id="fsd_next_details">
        <div id="fsd_up_next_text"></div>
        <div id="fsd_next_tit_art">
        <div id="fsd_next_tit_art_inner">
        <span id="fsd_first_span"></span>
        <span id="fsd_second_span"></span>
        </div></div>
      </div>
    </div>`
         : ""
 }
${
    CONFIG[ACTIVE].volumeDisplay !== "n"
        ? `
<div id="fsd-volume-container">
     <span id="fsd-volume"></span>
     <div id="fsd-volume-bar"><div id="fsd-volume-bar-inner"></div></div>
     <button class="fs-button" id="fsd-volume-icon"></button>
</div>`
        : ""
}
${CONFIG[ACTIVE].lyricsDisplay ? `<div id="fad-lyrics-plus-container"></div>` : ""}
<div id="fsd-foreground">
    <div id="fsd-art">
        <div id="fsd-art-image">
            <div id="fsd-art-inner"></div>
        </div>
    </div>
    <div id="fsd-details">
            <div id="fsd-title">
                 <svg id='playing-icon' width="30" height="30" viewBox='0 0 22 24' fill="currentColor"><defs><style> #playing-icon { fill: currentColor; } @keyframes play { 0% {transform: scaleY(1);} 3.3% {transform: scaleY(0.9583);} 6.6% {transform: scaleY(0.9166);} 9.9% {transform: scaleY(0.8333);} 13.3% {transform: scaleY(0.7083);} 16.6% {transform: scaleY(0.5416);} 19.9% {transform: scaleY(0.4166);} 23.3% {transform: scaleY(0.25);} 26.6% {transform: scaleY(0.1666);} 29.9% {transform: scaleY(0.125);} 33.3% {transform: scaleY(0.125);} 36.6% {transform: scaleY(0.1666);} 39.9% {transform: scaleY(0.1666);} 43.3% {transform: scaleY(0.2083);} 46.6% {transform: scaleY(0.2916);} 49.9% {transform: scaleY(0.375);} 53.3% {transform: scaleY(0.5);} 56.6% {transform: scaleY(0.5833);} 59.9% {transform: scaleY(0.625);} 63.3% {transform: scaleY(0.6666);} 66.6% {transform: scaleY(0.6666);} 69.9% {transform: scaleY(0.6666);} 73.3% {transform: scaleY(0.6666);} 76.6% {transform: scaleY(0.7083);} 79.9% {transform: scaleY(0.75);} 83.3% {transform: scaleY(0.8333);} 86.6% {transform: scaleY(0.875);} 89.9% {transform: scaleY(0.9166);} 93.3% {transform: scaleY(0.9583);} 96.6% {transform: scaleY(1);} } #bar1 { transform-origin: bottom; animation: play 0.9s -0.51s infinite; } #bar2 { transform-origin: bottom; animation: play 0.9s infinite; } #bar3 { transform-origin: bottom; animation: play 0.9s -0.15s infinite; } #bar4 { transform-origin: bottom; animation: play 0.9s -0.75s infinite; } </style></defs><rect id='bar1' class='cls-1' width='2' height='24'/><rect id='bar2' class='cls-1' x='6' width='2' height='24'/><rect id='bar3' class='cls-1' x='12' width='2' height='24'/><rect id='bar4' class='cls-1' x='18' width='2' height='24'/></svg>
                 <svg id='paused-icon'  width="30" height="30" viewBox="5 4 16 16" fill="currentColor"><path d="M9.732 19.241c1.077 0 2.688-.79 2.688-2.922V9.617c0-.388.074-.469.418-.542l3.347-.732a.48.48 0 00.403-.484V5.105c0-.388-.315-.637-.689-.563l-3.764.82c-.47.102-.725.359-.725.769l.014 8.144c.037.36-.132.594-.454.66l-1.164.241c-1.465.308-2.154 1.055-2.154 2.16 0 1.122.864 1.905 2.08 1.905z" fill-rule="nonzero"></path></svg>
                 <span></span>
            </div>
            <div id="fsd-artist">
                <svg height="30" width="30" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.artist}</svg>
                <span></span>
            </div>
            ${
                CONFIG[ACTIVE].showAlbum !== "n"
                    ? `<div id="fsd-album">
                ${CONFIG[ACTIVE].icons ? `<svg height="30" width="30" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.album}</svg>` : ""}
                 <span></span>
            </div>`
                    : ""
            } 
            <div id="fsd-status" class="${
                CONFIG[ACTIVE].playerControls || CONFIG[ACTIVE].extraControls || CONFIG[ACTIVE].progressBarDisplay ? "active" : ""
            }">
                ${
                    CONFIG[ACTIVE].extraControls
                        ? `<div class="fsd-controls-left fsd-controls extra-controls">
                       <button class="fs-button" id="fsd-heart">
                           <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["heart"]}</svg>
                       </button>
                       <button class="fs-button" id="fsd-shuffle">
                           <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["shuffle"]}</svg>
                       </button>
                    </div>`
                        : ""
                }
                    ${
                        CONFIG[ACTIVE].playerControls
                            ? `
                    <div class="fsd-controls-center fsd-controls">
                        <button class="fs-button" id="fsd-back">
                            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["skip-back"]}</svg>
                        </button>
                        <button class="fs-button" id="fsd-play">
                            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.play}</svg>
                        </button>
                        <button class="fs-button" id="fsd-next">
                            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["skip-forward"]}</svg>
                        </button>
                    </div>`
                            : ""
                    }
                ${
                    CONFIG[ACTIVE].extraControls
                        ? `<div class="fsd-controls-right fsd-controls extra-controls">
                        ${
                            CONFIG[ACTIVE].invertColors === "d"
                                ? `<button class="fs-button" id="fsd-invert">
                            <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="20px" width="20px" viewBox="0 0 20 20" fill="currentColor"><rect fill="none" height="20" width="20"/><path d="M7.08,4.96L10,2l4.53,4.6l0,0c1.07,1.1,1.72,2.6,1.72,4.24c0,0.96-0.23,1.86-0.62,2.67L10,7.88V4.14L8.14,6.02L7.08,4.96z M16.01,18.13l-2.33-2.33C12.65,16.55,11.38,17,10,17c-3.45,0-6.25-2.76-6.25-6.16c0-1.39,0.47-2.67,1.26-3.7L1.87,3.99l1.06-1.06 l14.14,14.14L16.01,18.13z M10,12.12L6.09,8.21c-0.54,0.77-0.84,1.68-0.84,2.63c0,2.57,2.13,4.66,4.75,4.66V12.12z"/></svg>
                        </button>`
                                : ""
                        }
                       <button class="fs-button" id="fsd-repeat">
                            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["repeat"]}</svg>
                       </button>
                       ${
                           CONFIG[ACTIVE].lyricsDisplay
                               ? `<button id="fsd-lyrics" class="fs-button ${
                                     container.classList.contains("lyrics-hide-force") ? "" : "button-active"
                                 }">
                          ${
                              container.classList.contains("lyrics-hide-force")
                                  ? `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                                 <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                                 <path d="M7.066 4.76A1.665 1.665 0 0 0 4 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112zm4 0A1.665 1.665 0 0 0 8 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112z"/>
                              </svg>`
                                  : `<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.5a1 1 0 0 0-.8.4l-1.9 2.533a1 1 0 0 1-1.6 0L5.3 12.4a1 1 0 0 0-.8-.4H2a2 2 0 0 1-2-2V2zm7.194 2.766a1.688 1.688 0 0 0-.227-.272 1.467 1.467 0 0 0-.469-.324l-.008-.004A1.785 1.785 0 0 0 5.734 4C4.776 4 4 4.746 4 5.667c0 .92.776 1.666 1.734 1.666.343 0 .662-.095.931-.26-.137.389-.39.804-.81 1.22a.405.405 0 0 0 .011.59c.173.16.447.155.614-.01 1.334-1.329 1.37-2.758.941-3.706a2.461 2.461 0 0 0-.227-.4zM11 7.073c-.136.389-.39.804-.81 1.22a.405.405 0 0 0 .012.59c.172.16.446.155.613-.01 1.334-1.329 1.37-2.758.942-3.706a2.466 2.466 0 0 0-.228-.4 1.686 1.686 0 0 0-.227-.273 1.466 1.466 0 0 0-.469-.324l-.008-.004A1.785 1.785 0 0 0 10.07 4c-.957 0-1.734.746-1.734 1.667 0 .92.777 1.666 1.734 1.666.343 0 .662-.095.931-.26z"/>
                          </svg>`
                          }
                       </button>`
                               : ""
                       }
                    </div>`
                        : ""
                }
                ${
                    CONFIG.tvMode && !(CONFIG[ACTIVE].playerControls && CONFIG[ACTIVE].extraControls)
                        ? `${
                              CONFIG[ACTIVE].progressBarDisplay
                                  ? `<div id="fsd-progress-container">
                        <span id="fsd-elapsed"></span>
                        <div id="fsd-progress"><div id="fsd-progress-inner"></div></div>
                        <span id="fsd-duration"></span>
                    </div>`
                                  : ""
                          }`
                        : ""
                }
            </div>
            ${
                CONFIG.tvMode && CONFIG[ACTIVE].playerControls && CONFIG[ACTIVE].extraControls
                    ? `${
                          CONFIG[ACTIVE].progressBarDisplay
                              ? `<div id="fsd-progress-container">
                        <span id="fsd-elapsed"></span>
                        <div id="fsd-progress"><div id="fsd-progress-inner"></div></div>
                        <span id="fsd-duration"></span>
                    </div>`
                              : ""
                      }`
                    : ""
            }
    </div>
    ${
        CONFIG.tvMode
            ? ""
            : `${
                  CONFIG[ACTIVE].progressBarDisplay
                      ? `<div id="fsd-progress-container">
            <span id="fsd-elapsed"></span>
            <div id="fsd-progress"><div id="fsd-progress-inner"></div></div>
            <span id="fsd-duration"></span>
        </div>`
                      : ""
              }`
    }
</div>`;
        if (CONFIG.tvMode) back = container.querySelector("#fsd-background-image");
        else {
            back = container.querySelector("canvas");
            back.width = window.innerWidth;
            back.height = window.innerHeight;
        }
        cover = container.querySelector("#fsd-art-image");
        title = container.querySelector("#fsd-title span");
        artist = container.querySelector("#fsd-artist span");
        album = container.querySelector("#fsd-album span");

        if (CONFIG[ACTIVE].contextDisplay !== "n") {
            ctx_container = container.querySelector("#fsd-ctx-container");
            ctx_icon = container.querySelector("#fsd-ctx-icon");
            ctx_source = container.querySelector("#fsd-ctx-source");
            ctx_name = container.querySelector("#fsd-ctx-name");
        }
        if (CONFIG[ACTIVE].upnextDisplay) {
            fsd_myUp = container.querySelector("#fsd-upnext-container");
            fsd_myUp.onclick = Spicetify.Player.next;
            fsd_nextCover = container.querySelector("#fsd_next_art_image");
            fsd_up_next_text = container.querySelector("#fsd_up_next_text");
            fsd_next_tit_art = container.querySelector("#fsd_next_tit_art");
            fsd_next_tit_art_inner = container.querySelector("#fsd_next_tit_art_inner");
            fsd_first_span = container.querySelector("#fsd_first_span");
            fsd_second_span = container.querySelector("#fsd_second_span");
        }
        if (CONFIG[ACTIVE].volumeDisplay !== "n") {
            volumeContainer = container.querySelector("#fsd-volume-container");
            volumeCurr = container.querySelector("#fsd-volume");
            volumeBarInner = container.querySelector("#fsd-volume-bar-inner");
            volumeIcon = container.querySelector("#fsd-volume-icon");
            volumeIcon.onclick = Spicetify.Player.toggleMute;
        }
        if (CONFIG[ACTIVE].progressBarDisplay) {
            prog = container.querySelector("#fsd-progress-inner");
            durr = container.querySelector("#fsd-duration");
            elaps = container.querySelector("#fsd-elapsed");
        }
        if (CONFIG[ACTIVE].icons) {
            playingIcon = container.querySelector("#playing-icon");

            //Clicking on playing icon disables it and remembers the config
            playingIcon.onclick = () => {
                CONFIG[ACTIVE]["titleMovingIcon"] = false;
                saveConfig();
                playingIcon.classList.add("hidden");
                pausedIcon.classList.remove("hidden");
            };
            pausedIcon = container.querySelector("#paused-icon");
            pausedIcon.onclick = () => {
                CONFIG[ACTIVE]["titleMovingIcon"] = true;
                saveConfig();
                playingIcon.classList.remove("hidden");
                pausedIcon.classList.add("hidden");
                updatePlayingIcon({ data: { is_paused: !Spicetify.Player.isPlaying() } });
            };
        }
        if (CONFIG[ACTIVE].playerControls) {
            play = container.querySelector("#fsd-play");
            play.onclick = () => {
                fadeAnimation(play);
                Spicetify.Player.togglePlay();
            };
            nextControl = container.querySelector("#fsd-next");
            nextControl.onclick = () => {
                fadeAnimation(nextControl, "fade-ri");
                Spicetify.Player.next();
            };
            backControl = container.querySelector("#fsd-back");
            backControl.onclick = () => {
                fadeAnimation(backControl, "fade-le");
                Spicetify.Player.back();
            };
        }
        if (CONFIG[ACTIVE].extraControls) {
            heart = container.querySelector("#fsd-heart");
            shuffle = container.querySelector("#fsd-shuffle");
            repeat = container.querySelector("#fsd-repeat");

            heart.onclick = () => {
                fadeAnimation(heart);
                Spicetify.Player.toggleHeart();
            };
            shuffle.onclick = () => {
                fadeAnimation(shuffle);
                Spicetify.Player.toggleShuffle();
            };
            repeat.onclick = () => {
                fadeAnimation(repeat);
                Spicetify.Player.toggleRepeat();
            };
            if (CONFIG[ACTIVE].invertColors === "d") {
                invertButton = container.querySelector("#fsd-invert");
                invertButton.onclick = () => {
                    fadeAnimation(invertButton);
                    if (invertButton.classList.contains("button-active"))
                        invertButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="20px" width="20px" viewBox="0 0 20 20" fill="currentColor"><rect fill="none" height="20" width="20"/><path d="M7.08,4.96L10,2l4.53,4.6l0,0c1.07,1.1,1.72,2.6,1.72,4.24c0,0.96-0.23,1.86-0.62,2.67L10,7.88V4.14L8.14,6.02L7.08,4.96z M16.01,18.13l-2.33-2.33C12.65,16.55,11.38,17,10,17c-3.45,0-6.25-2.76-6.25-6.16c0-1.39,0.47-2.67,1.26-3.7L1.87,3.99l1.06-1.06 l14.14,14.14L16.01,18.13z M10,12.12L6.09,8.21c-0.54,0.77-0.84,1.68-0.84,2.63c0,2.57,2.13,4.66,4.75,4.66V12.12z"/></svg>`;
                    else
                        invertButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="20px" width="20px" viewBox="0 0 20 20" fill="currentColor"><rect fill="none" height="20" width="20"/><path d="M14.53,6.59L14.53,6.59L10,2L5.5,6.56c-1.08,1.11-1.75,2.62-1.75,4.28c0,3.4,2.8,6.16,6.25,6.16s6.25-2.76,6.25-6.16 C16.25,9.19,15.6,7.7,14.53,6.59z M5.25,10.84c0-1.21,0.47-2.35,1.32-3.22L10,4.14V15.5C7.38,15.5,5.25,13.41,5.25,10.84z"/></svg>`;
                    invertButton.classList.toggle("button-active");
                    if (getComputedStyle(container).getPropertyValue("--main-color").startsWith("0")) {
                        container.style.setProperty("--main-color", "255,255,255");
                        container.style.setProperty("--contrast-color", "0,0,0");
                        if (!CONFIG.tvMode && CONFIG.def.backgroundChoice === "a")
                            INVERTED[Spicetify.Player.data.track.metadata.album_uri.split(":")[2]] = false;
                    } else {
                        container.style.setProperty("--main-color", "0,0,0");
                        container.style.setProperty("--contrast-color", "255,255,255");
                        if (!CONFIG.tvMode && CONFIG.def.backgroundChoice === "a")
                            INVERTED[Spicetify.Player.data.track.metadata.album_uri.split(":")[2]] = true;
                    }
                    localStorage.setItem("full-screen:inverted", JSON.stringify(INVERTED));
                };
            }
            if (CONFIG[ACTIVE].lyricsDisplay) {
                lyrics = container.querySelector("#fsd-lyrics");
                lyrics.onclick = () => {
                    fadeAnimation(lyrics);
                    container.classList.toggle("lyrics-hide-force");
                    lyrics.classList.toggle("button-active");
                    lyrics.innerHTML =
                        container.classList.contains("lyrics-unavailable") || container.classList.contains("lyrics-hide-force")
                            ? `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                                 <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                                 <path d="M7.066 4.76A1.665 1.665 0 0 0 4 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112zm4 0A1.665 1.665 0 0 0 8 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112z"/>
                              </svg>`
                            : `<svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.5a1 1 0 0 0-.8.4l-1.9 2.533a1 1 0 0 1-1.6 0L5.3 12.4a1 1 0 0 0-.8-.4H2a2 2 0 0 1-2-2V2zm7.194 2.766a1.688 1.688 0 0 0-.227-.272 1.467 1.467 0 0 0-.469-.324l-.008-.004A1.785 1.785 0 0 0 5.734 4C4.776 4 4 4.746 4 5.667c0 .92.776 1.666 1.734 1.666.343 0 .662-.095.931-.26-.137.389-.39.804-.81 1.22a.405.405 0 0 0 .011.59c.173.16.447.155.614-.01 1.334-1.329 1.37-2.758.941-3.706a2.461 2.461 0 0 0-.227-.4zM11 7.073c-.136.389-.39.804-.81 1.22a.405.405 0 0 0 .012.59c.172.16.446.155.613-.01 1.334-1.329 1.37-2.758.942-3.706a2.466 2.466 0 0 0-.228-.4 1.686 1.686 0 0 0-.227-.273 1.466 1.466 0 0 0-.469-.324l-.008-.004A1.785 1.785 0 0 0 10.07 4c-.957 0-1.734.746-1.734 1.667 0 .92.777 1.666 1.734 1.666.343 0 .662-.095.931-.26z"/></svg>`;
                };
            }
        }
    }

    const classes = ["video", "video-full-screen", "video-full-window", "video-full-screen--hide-ui", "fsd-activated"];

    function fullScreenOn() {
        if (!document.fullscreen) document.documentElement.requestFullscreen();
    }

    function fullScreenOff() {
        if (document.fullscreen) document.exitFullscreen();
    }

    function getToken() {
        return Spicetify.Platform.AuthorizationAPI._tokenProvider({
            preferCached: true,
        }).then((res) => res.accessToken);
    }

    async function getTrackInfo(id) {
        return fetch(`https://api.spotify.com/v1/tracks/${id}`, {
            headers: {
                Authorization: `Bearer ${await getToken()}`,
            },
        }).then((res) => res.json());
        // return Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/tracks/${id}`)
    }

    async function getAlbumInfo(id) {
        return fetch(`https://api.spotify.com/v1/albums/${id}`, {
            headers: {
                Authorization: `Bearer ${await getToken()}`,
            },
        }).then((res) => res.json());
        // return Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/albums/${id}`)
    }

    function getPlaylistInfo(uri) {
        return Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${uri}`);
    }

    async function getArtistInfo(id) {
        return fetch(
            `https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistOverview&variables=%7B%22uri%22%3A%22spotify%3Aartist%3A${id}%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22d66221ea13998b2f81883c5187d174c8646e4041d67f5b1e103bc262d447e3a0%22%7D%7D`,
            {
                headers: {
                    Authorization: `Bearer ${await getToken()}`,
                },
            }
        )
            .then((res) => res.json())
            .then((res) => res.data.artist);
        // return Spicetify.CosmosAsync.get(`https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistOverview&variables=%7B%22uri%22%3A%22spotify%3Aartist%3A${id}%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22d66221ea13998b2f81883c5187d174c8646e4041d67f5b1e103bc262d447e3a0%22%7D%7D`).then(res => res.data.artist)
    }

    async function searchArt(name) {
        return fetch(`https://api.spotify.com/v1/search?q="${name}"&type=artist&limit=2`, {
            headers: {
                Authorization: `Bearer ${await getToken()}`,
            },
        }).then((res) => res.json());
        // return Spicetify.CosmosAsync.get(`https://api.spotify.com/v1/search?q="${name}"&type=artist&limit=2`)
    }

    // Add fade animation on button click
    function fadeAnimation(ele, anim = "fade-do") {
        ele.classList.remove(anim);
        ele.classList.add(anim);
        setTimeout(() => {
            ele.classList.remove(anim);
        }, 800);
    }

    // Utility function to add a observer with wait for element support
    function addObserver(observer, selector, options) {
        const ele = document.querySelector(selector);
        if (!ele) {
            setTimeout(() => {
                addObserver(observer, selector, options);
            }, 2000);
            return;
        }
        observer.observe(ele, options);
    }

    // Converting hex to rgb
    function hexToRgb(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b;
        });
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : null;
    }

    async function getImageAndLoad(meta) {
        if (meta.artist_uri == null) return meta.image_xlarge_url;
        let arUri = meta.artist_uri.split(":")[2];
        if (meta.artist_uri.split(":")[1] === "local") {
            let res = await searchArt(meta.artist_name).catch((err) => console.error(err));
            arUri = res ? res.artists.items[0].id : "";
        }
        let artistInfo = await getArtistInfo(arUri).catch((err) => console.error(err));
        return artistInfo?.visuals?.headerImage?.sources[0].url ?? meta.image_xlarge_url;
    }

    // Set the timeout to show upnext or hide when song ends
    let upnextTimer,
        upNextShown = false;

    function updateUpNextShow() {
        setTimeout(() => {
            let timetogo = getShowTime();
            if (upnextTimer) {
                clearTimeout(upnextTimer);
                upnextTimer = 0;
            }
            if (timetogo < 10) {
                if (!upNextShown || fsd_myUp.style.transform !== "translateX(0px)") {
                    updateUpNext();
                }
                upNextShown = true;
            } else {
                fsd_myUp.style.transform = "translateX(600px)";
                upNextShown = false;
                if (!Spicetify.Player.origin._state.isPaused) {
                    upnextTimer = setTimeout(() => {
                        updateUpNext();
                        upNextShown = true;
                    }, timetogo);
                }
            }
        }, 100);
    }

    // Return the total time left to show the upnext timer
    function getShowTime() {
        let showBefore = CONFIG[ACTIVE].upnextTimeToShow * 1000;
        let dur = Spicetify.Player.data.duration;
        let curProg = Spicetify.Player.getProgress();

        if (dur - curProg <= showBefore) return -1;
        else return dur - showBefore - curProg;
    }

    let colorsCache = {};
    async function colorExtractor(uri) {
        if (uri in colorsCache) return colorsCache[uri];
        const body = await Spicetify.CosmosAsync.get(`wg://colorextractor/v1/extract-presets?uri=${uri}&format=json`);
        if (body.entries && body.entries.length) {
            const list = {};
            for (const color of body.entries[0].color_swatches) {
                list[color.preset] = `#${color.color.toString(16).padStart(6, "0")}`;
            }
            if (Object.keys(colorsCache).length > 15) {
                delete colorsCache;
                colorsCache = {};
            }
            colorsCache[uri] = list;
            return colorsCache[uri];
        }
        throw "No colors returned.";
    }

    async function updateInfo() {
        const meta = Spicetify.Player.data.track.metadata;

        if (CONFIG[ACTIVE].contextDisplay !== "n") updateContext().catch((err) => console.error("Error getting context: ", err));

        // prepare title
        let rawTitle = meta.title;
        if (CONFIG[ACTIVE].trimTitle) {
            rawTitle = rawTitle
                .replace(/\(.+?\)/g, "")
                .replace(/\[.+?\]/g, "")
                .replace(/\s\-\s.+?$/, "")
                .trim();
            if (!rawTitle) rawTitle = meta.title;
        }

        // prepare artist
        let artistName;
        if (CONFIG[ACTIVE].showAllArtists) {
            artistName = Object.keys(meta)
                .filter((key) => key.startsWith("artist_name"))
                .sort()
                .map((key) => meta[key])
                .join(", ");
        } else {
            artistName = meta.artist_name;
        }

        // prepare album
        let albumText;
        if (CONFIG[ACTIVE].showAlbum !== "n") {
            albumText = meta.album_title || "";
            if (album) album.innerText = albumText || "";
            const albumURI = meta.album_uri;
            if (albumURI?.startsWith("spotify:album:") && CONFIG[ACTIVE].showAlbum === "d") {
                getAlbumInfo(albumURI.replace("spotify:album:", ""))
                    .then((albumInfo) => {
                        if (!albumInfo?.release_date) throw Error("No release Date");
                        const albumDate = new Date(albumInfo.release_date);
                        const recentDate = new Date();
                        recentDate.setMonth(recentDate.getMonth() - 18);
                        const dateStr = albumDate.toLocaleString(
                            "default",
                            albumDate > recentDate ? { year: "numeric", month: "short" } : { year: "numeric" }
                        );
                        albumText += " • " + dateStr;
                        if (album) album.innerText = albumText || "";
                    })
                    .catch((err) => console.error(err));
            }
        }

        // prepare duration
        let durationText;
        if (CONFIG[ACTIVE].progressBarDisplay) {
            durationText = Spicetify.Player.formatTime(meta.duration);
        }
        const previousImg = nextTrackImg.cloneNode();

        nextTrackImg.src = meta.image_xlarge_url;

        // Wait until next track image is downloaded then update UI text and images
        nextTrackImg.onload = async () => {
            if (!CONFIG.tvMode) {
                updateMainColor(Spicetify.Player.data.track.uri, meta);
                updateThemeColor(Spicetify.Player.data.track.uri);
                if (CONFIG.def.backgroundChoice == "a") {
                    animateCanvas(previousImg, nextTrackImg);
                } else {
                    animateColor(await getNextColor());
                }
            }
            cover.style.backgroundImage = `url("${nextTrackImg.src}")`;
            title.innerText = rawTitle || "";
            artist.innerText = artistName || "";
            if (durr) {
                durr.innerText = durationText || "";
            }
            new Image().src = Spicetify?.Queue?.nextTracks[0]?.contextTrack?.metadata.image_xlarge_url;
        };
        nextTrackImg.onerror = () => {
            // Placeholder
            console.error("Check your Internet! Unable to load Image");
            nextTrackImg.src = OFFLINESVG;
        };
        if (CONFIG.tvMode) {
            artistImg.src = await getImageAndLoad(meta);
            updateMainColor(artistImg.src, meta);
            updateThemeColor(artistImg.src);
            artistImg.onload = async () => {
                back.style.backgroundImage = `url("${artistImg.src}")`;
                let newurl = await getImageAndLoad(Spicetify?.Queue?.nextTracks[0]?.contextTrack?.metadata);
                new Image().src = newurl;
            };
        }
    }

    async function getNextColor() {
        let nextColor;
        const imageColors = await colorExtractor(Spicetify.Player.data.track.uri).catch((err) => console.warn(err));
        if (!imageColors || !imageColors[CONFIG.def.coloredBackChoice]) nextColor = "#444444";
        else nextColor = imageColors[CONFIG.def.coloredBackChoice];
        return nextColor;
    }
    async function updateMainColor(imageURL, meta) {
        switch (CONFIG[ACTIVE].invertColors) {
            case "a":
                container.style.setProperty("--main-color", "0,0,0");
                container.style.setProperty("--contrast-color", "255,255,255");
                break;
            case "d":
                let mainColor, contrastColor;
                if (!CONFIG.tvMode && CONFIG.def.backgroundChoice === "a" && meta.album_uri.split(":")[2] in INVERTED) {
                    mainColor = INVERTED[meta.album_uri.split(":")[2]] ? "0,0,0" : "255,255,255";
                } else {
                    let imageProminentColor;
                    const imageColors = await colorExtractor(imageURL).catch((err) => console.warn(err));
                    if (CONFIG.tvMode || CONFIG.def.backgroundChoice == "a") {
                        if (!imageColors?.PROMINENT) imageProminentColor = "0,0,0";
                        else imageProminentColor = hexToRgb(imageColors.PROMINENT);
                    } else {
                        if (!imageColors || !imageColors[CONFIG.def.coloredBackChoice]) imageProminentColor = hexToRgb("#444444");
                        else imageProminentColor = hexToRgb(imageColors[CONFIG.def.coloredBackChoice]);
                    }
                    const thresholdValue = 260 - CONFIG[ACTIVE].backgroundBrightness * 100;
                    const isLightBG =
                        imageProminentColor.split(",")[0] * 0.299 +
                            imageProminentColor.split(",")[1] * 0.587 +
                            imageProminentColor.split(",")[2] * 0.114 >
                        thresholdValue;
                    mainColor = isLightBG && CONFIG[ACTIVE].backgroundBrightness > 0.3 ? "0,0,0" : "255,255,255";
                    contrastColor = isLightBG && CONFIG[ACTIVE].backgroundBrightness > 0.3 ? "255,255,255" : "0,0,0";
                }
                container.style.setProperty("--main-color", mainColor);
                container.style.setProperty("--contrast-color", contrastColor);
                if (CONFIG[ACTIVE].extraControls) {
                    invertButton.classList.remove("button-active");
                    invertButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="20px" width="20px" viewBox="0 0 20 20" fill="currentColor"><rect fill="none" height="20" width="20"/><path d="M7.08,4.96L10,2l4.53,4.6l0,0c1.07,1.1,1.72,2.6,1.72,4.24c0,0.96-0.23,1.86-0.62,2.67L10,7.88V4.14L8.14,6.02L7.08,4.96z M16.01,18.13l-2.33-2.33C12.65,16.55,11.38,17,10,17c-3.45,0-6.25-2.76-6.25-6.16c0-1.39,0.47-2.67,1.26-3.7L1.87,3.99l1.06-1.06 l14.14,14.14L16.01,18.13z M10,12.12L6.09,8.21c-0.54,0.77-0.84,1.68-0.84,2.63c0,2.57,2.13,4.66,4.75,4.66V12.12z"/></svg>`;
                }
                break;
            case "n":
            default:
                container.style.setProperty("--main-color", "255,255,255");
                container.style.setProperty("--contrast-color", "0,0,0");
                break;
        }
    }
    //Set main theme color for the display
    async function updateThemeColor(imageURL) {
        if (
            !(!CONFIG.tvMode && CONFIG.def.backgroundChoice == "c" && CONFIG.def.coloredBackChoice == "VIBRANT") &&
            (CONFIG[ACTIVE].themedButtons || CONFIG[ACTIVE].themedIcons)
        ) {
            container.classList.toggle("themed-buttons", !!CONFIG[ACTIVE].themedButtons);
            container.classList.toggle("themed-icons", !!CONFIG[ACTIVE].themedIcons);
            let themeVibrantColor;
            const artColors = await colorExtractor(imageURL).catch((err) => console.warn(err));
            if (!artColors?.VIBRANT) themeVibrantColor = "175,175,175";
            else themeVibrantColor = hexToRgb(artColors.VIBRANT);
            container.style.setProperty("--theme-color", themeVibrantColor);
        } else {
            container.classList.remove("themed-buttons", "themed-icons");
            container.style.setProperty("--theme-color", "175,175,175");
        }
    }

    function handleLyricsUpdate(evt) {
        if (evt.detail.isLoading) return;
        container.classList.toggle("lyrics-unavailable", !(evt.detail.available && evt.detail?.synced?.length > 1));
        if (CONFIG[ACTIVE].extraControls) {
            lyrics.classList.toggle("hidden", container.classList.contains("lyrics-unavailable"));
        }
    }

    let prevColor = "#000000";
    async function animateColor(nextColor) {
        const configTransitionTime = CONFIG[ACTIVE].backAnimationTime;
        const { innerWidth: width, innerHeight: height } = window;
        back.width = width;
        back.height = height;

        const ctx = back.getContext("2d");

        if (!CONFIG[ACTIVE].enableFade) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = nextColor;
            ctx.fillRect(0, 0, width, height);
            return;
        }

        let previousTimeStamp,
            done = false,
            start;
        const animate = (timestamp) => {
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

    function animateCanvas(prevImg, nextImg) {
        const configTransitionTime = CONFIG[ACTIVE].backAnimationTime;
        const { innerWidth: width, innerHeight: height } = window;
        back.width = width;
        back.height = height;

        const ctx = back.getContext("2d");
        ctx.imageSmoothingEnabled = false;
        ctx.filter = `brightness(${CONFIG[ACTIVE].backgroundBrightness}) blur(${CONFIG[ACTIVE].blurSize}px)`;
        const blur = CONFIG[ACTIVE].blurSize;

        const x = -blur * 2;

        let y, dim;
        if (width > height) {
            dim = width;
            y = x - (width - height) / 2;
        } else {
            dim = height;
            y = x;
        }
        const size = dim + 4 * blur;

        if (!CONFIG[ACTIVE].enableFade) {
            ctx.globalAlpha = 1;
            ctx.drawImage(nextImg, x, y, size, size);
            return;
        }

        let prevTimeStamp,
            start,
            done = false;

        const animate = (timestamp) => {
            if (start === undefined) start = timestamp;

            const elapsed = timestamp - start;

            if (prevTimeStamp !== timestamp) {
                const factor = Math.min(elapsed / (configTransitionTime * 1000), 1.0);
                ctx.globalAlpha = 1;
                ctx.drawImage(prevImg, x, y, size, size);
                ctx.globalAlpha = Math.sin((Math.PI / 2) * factor);
                ctx.drawImage(nextImg, x, y, size, size);
                if (factor === 1.0) done = true;
            }
            if (elapsed < configTransitionTime * 1000) {
                prevTimeStamp = timestamp;
                !done && requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    let prevUriObj;
    async function getContext() {
        let ctxIcon = "",
            ctxSource,
            ctxName;
        if (Spicetify.Player.data.track.provider === "queue") {
            ctxIcon = `<svg width="48" height="48" viewBox="1 1.2 16 16" fill="currentColor"><path d="M2 2v5l4.33-2.5L2 2zm0 12h14v-1H2v1zm0-4h14V9H2v1zm7-5v1h7V5H9z"></path></svg>`;
            ctxSource = "queue";
            ctxName = "";
        } else {
            const uriObj = Spicetify.URI.fromString(Spicetify.Player.data.context_uri);
            if (JSON.stringify(uriObj) === JSON.stringify(prevUriObj) && ctxSource != undefined && ctxName != undefined)
                return [ctxIcon, ctxSource, ctxName];
            prevUriObj = uriObj;
            switch (uriObj.type) {
                case Spicetify.URI.Type.TRACK:
                    ctxIcon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M9.732 19.241c1.077 0 2.688-.79 2.688-2.922V9.617c0-.388.074-.469.418-.542l3.347-.732a.48.48 0 00.403-.484V5.105c0-.388-.315-.637-.689-.563l-3.764.82c-.47.102-.725.359-.725.769l.014 8.144c.037.36-.132.594-.454.66l-1.164.241c-1.465.308-2.154 1.055-2.154 2.16 0 1.122.864 1.905 2.08 1.905z" fill-rule="nonzero"></path></svg>`;
                    ctxSource = uriObj.type;
                    await getTrackInfo(uriObj._base62Id).then((meta) => (ctxName = `${meta.name}  •  ${meta.artists[0].name}`));
                    break;
                case Spicetify.URI.Type.SEARCH:
                    ctxIcon = Spicetify.SVGIcons["search-active"];
                    ctxSource = uriObj.type;
                    ctxName = `"${uriObj.query}" in Songs`;
                    break;
                case Spicetify.URI.Type.COLLECTION:
                    ctxIcon = Spicetify.SVGIcons["heart-active"];
                    ctxSource = uriObj.type;
                    ctxName = "Liked Songs";
                    break;
                case Spicetify.URI.Type.PLAYLIST_V2:
                    ctxIcon = Spicetify.SVGIcons["playlist"];
                    ctxSource = "playlist";
                    ctxName = Spicetify.Player.data.context_metadata?.context_description || "";
                    break;

                case Spicetify.URI.Type.STATION:
                case Spicetify.URI.Type.RADIO:
                    ctxIcon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M19.359 18.57C21.033 16.818 22 14.461 22 11.89s-.967-4.93-2.641-6.68c-.276-.292-.653-.26-.868-.023-.222.246-.176.591.085.868 1.466 1.535 2.272 3.593 2.272 5.835 0 2.241-.806 4.3-2.272 5.835-.261.268-.307.621-.085.86.215.245.592.276.868-.016zm-13.85.014c.222-.238.176-.59-.085-.86-1.474-1.535-2.272-3.593-2.272-5.834 0-2.242.798-4.3 2.272-5.835.261-.277.307-.622.085-.868-.215-.238-.592-.269-.868.023C2.967 6.96 2 9.318 2 11.89s.967 4.929 2.641 6.68c.276.29.653.26.868.014zm1.957-1.873c.223-.253.162-.583-.1-.867-.951-1.068-1.473-2.45-1.473-3.954 0-1.505.522-2.887 1.474-3.954.26-.284.322-.614.1-.876-.23-.26-.622-.26-.891.039-1.175 1.274-1.827 2.963-1.827 4.79 0 1.82.652 3.517 1.827 4.784.269.3.66.307.89.038zm9.958-.038c1.175-1.267 1.827-2.964 1.827-4.783 0-1.828-.652-3.517-1.827-4.791-.269-.3-.66-.3-.89-.039-.23.262-.162.592.092.876.96 1.067 1.481 2.449 1.481 3.954 0 1.504-.522 2.886-1.481 3.954-.254.284-.323.614-.092.867.23.269.621.261.89-.038zm-8.061-1.966c.23-.26.13-.568-.092-.883-.415-.522-.63-1.197-.63-1.934 0-.737.215-1.413.63-1.943.222-.307.322-.614.092-.875s-.653-.261-.906.054a4.385 4.385 0 00-.968 2.764 4.38 4.38 0 00.968 2.756c.253.322.675.322.906.061zm6.18-.061a4.38 4.38 0 00.968-2.756 4.385 4.385 0 00-.968-2.764c-.253-.315-.675-.315-.906-.054-.23.261-.138.568.092.875.415.53.63 1.206.63 1.943 0 .737-.215 1.412-.63 1.934-.23.315-.322.622-.092.883s.653.261.906-.061zm-3.547-.967c.96 0 1.789-.814 1.789-1.797s-.83-1.789-1.789-1.789c-.96 0-1.781.806-1.781 1.789 0 .983.821 1.797 1.781 1.797z" fill-rule="nonzero"></path></svg>`;
                    const rType = uriObj.args[0];
                    ctxSource = `${rType} radio`;
                    if (rType === "album") await getAlbumInfo(uriObj.args[1]).then((meta) => (ctxName = meta.name));
                    else if (rType === "track")
                        await getTrackInfo(uriObj.args[1]).then((meta) => (ctxName = `${meta.name}  •  ${meta.artists[0].name}`));
                    else if (rType === "artist") await getArtistInfo(uriObj.args[1]).then((meta) => (ctxName = meta?.profile?.name));
                    else if (rType === "playlist" || rType === "playlist-v2") {
                        ctxIcon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M16.94 6.9l-1.4 1.46C16.44 9.3 17 10.58 17 12s-.58 2.7-1.48 3.64l1.4 1.45C18.22 15.74 19 13.94 19 12s-.8-3.8-2.06-5.1zM23 12c0-3.12-1.23-5.95-3.23-8l-1.4 1.45C19.97 7.13 21 9.45 21 12s-1 4.9-2.64 6.55l1.4 1.45c2-2.04 3.24-4.87 3.24-8zM7.06 17.1l1.4-1.46C7.56 14.7 7 13.42 7 12s.6-2.7 1.5-3.64L7.08 6.9C5.78 8.2 5 10 5 12s.8 3.8 2.06 5.1zM1 12c0 3.12 1.23 5.95 3.23 8l1.4-1.45C4.03 16.87 3 14.55 3 12s1-4.9 2.64-6.55L4.24 4C2.24 6.04 1 8.87 1 12zm9-3.32v6.63l5-3.3-5-3.3z"></path></svg>`;
                        await getPlaylistInfo("spotify:playlist:" + uriObj.args[1]).then((meta) => (ctxName = meta.playlist.name));
                    } else ctxName = "";
                    break;

                case Spicetify.URI.Type.PLAYLIST:
                case Spicetify.URI.Type.ALBUM:
                case Spicetify.URI.Type.ARTIST:
                    ctxIcon = Spicetify.SVGIcons[uriObj.type];
                    ctxSource = uriObj.type;
                    ctxName = Spicetify.Player.data.context_metadata.context_description || "";
                    break;

                case Spicetify.URI.Type.FOLDER:
                    ctxIcon = Spicetify.SVGIcons["playlist-folder"];
                    ctxSource = "playlist folder";
                    const res = await Spicetify.CosmosAsync.get(`sp://core-playlist/v1/rootlist`, {
                        policy: { folder: { rows: true, link: true, name: true } },
                    });
                    for (const item of res.rows) {
                        if (item.type === "folder" && item.link === Spicetify.Player.data.context_uri) {
                            ctxName = item.name;
                            break;
                        }
                    }
                    break;
                default:
                    ctxSource = uriObj.type;
                    ctxName = Spicetify.Player.data?.context_metadata?.context_description || "";
            }
        }
        return [ctxIcon, ctxSource, ctxName];
    }

    // Get the context and update it
    async function updateContext() {
        [ctxIcon, ctxSource, ctxName] = await getContext().catch((err) => console.error(err));
        ctx_source.classList.toggle("ctx-no-name", !ctxName);

        //Set default icon if no icon is returned
        if (!ctxIcon) ctxIcon = Spicetify.SVGIcons.spotify;
        ctx_icon.innerHTML = /^<path/.test(ctxIcon)
            ? `<svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">${ctxIcon}</svg>`
            : ctxIcon;

        //Only change the DOM if context is changed
        if (
            ctx_source.innerText.toLowerCase() !== `playing from ${ctxSource}`.toLowerCase() ||
            ctx_name.innerText.toLowerCase() !== ctxName.toLowerCase()
        ) {
            ctx_source.innerText = `playing from ${ctxSource}`;
            ctx_name.innerText = ctxName;
            if (CONFIG[ACTIVE].contextDisplay === "m") hideContext();
        }
    }

    function updateUpNextInfo() {
        fsd_up_next_text.innerText = "UP NEXT";
        let metadata = {};
        const queue_metadata = Spicetify.Queue.nextTracks[0];
        if (queue_metadata) {
            metadata = queue_metadata?.contextTrack?.metadata;
        } else {
            metadata["artist_name"] = "";
            metadata["title"] = "";
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
            next_artist = "Artist (Unavailable)";
        }
        const next_image = metadata.image_xlarge_url;
        if (next_image) {
            fsd_nextCover.style.backgroundImage = `url("${next_image}")`;
        } else {
            if (metadata.image_url) fsd_nextCover.style.backgroundImage = `url("${metadata.image_url}")`;
            else {
                fsd_nextCover.style.backgroundImage = `url("${OFFLINESVG}")`;
            }
        }
        fsd_first_span.innerText = metadata.title + "  •  " + next_artist;
        fsd_second_span.innerText = metadata.title + "  •  " + next_artist;
    }

    async function updateUpNext() {
        if (
            Spicetify.Player.data.duration - Spicetify.Player.getProgress() <= CONFIG[ACTIVE].upnextTimeToShow * 1000 + 50 &&
            Spicetify.Queue?.nextTracks[0]?.contextTrack?.metadata?.title
        ) {
            await updateUpNextInfo();
            fsd_myUp.style.transform = "translateX(0px)";
            upNextShown = true;
            if (fsd_second_span.offsetWidth > fsd_next_tit_art.offsetWidth - 2) {
                switch (CONFIG[ACTIVE].upNextAnim) {
                    case "mq":
                        fsd_first_span.style.paddingRight = "80px";
                        anim_time = 5000 * (fsd_first_span.offsetWidth / 400);
                        fsd_myUp.style.setProperty("--translate_width_fsd", `-${fsd_first_span.offsetWidth + 3.5}px`);
                        fsd_next_tit_art_inner.style.animation = "fsd_cssmarquee " + anim_time + "ms linear 800ms infinite";
                        break;
                    case "sp":
                    default:
                        fsd_first_span.style.paddingRight = "0px";
                        fsd_second_span.innerText = "";
                        anim_time = (fsd_first_span.offsetWidth - fsd_next_tit_art.offsetWidth - 2) / 0.05;
                        // anim_time= 3000*(fsd_first_span.offsetWidth/fsd_next_tit_art.offsetWidth)
                        fsd_myUp.style.setProperty("--translate_width_fsd", `-${fsd_first_span.offsetWidth - fsd_next_tit_art.offsetWidth + 5}px`);
                        fsd_next_tit_art_inner.style.animation = `fsd_translate ${anim_time > 1500 ? anim_time : 1500}ms linear 800ms infinite`;
                        break;
                }
            } else {
                fsd_first_span.style.paddingRight = "0px";
                fsd_next_tit_art_inner.style.animation = "none";
                fsd_second_span.innerText = "";
            }
        } else {
            upNextShown = false;
            fsd_myUp.style.transform = "translateX(600px)";
            fsd_first_span.style.paddingRight = "0px";
            fsd_next_tit_art_inner.style.animation = "none";
            fsd_second_span.innerText = "";
        }
    }

    let prevVolume = Spicetify.Player?.origin?._volume?._volume ?? Spicetify.Platform?.PlaybackAPI?._volume;

    function updateVolume(data) {
        volume = !data ? Spicetify.Player?.origin?._volume?._volume ?? Spicetify.Platform?.PlaybackAPI?._volume : data.data.volume;
        if (volume !== prevVolume || !data) {
            //Only update volume when there is a change or on initial fire
            prevVolume = volume;
            if (CONFIG[ACTIVE].volumeDisplay === "o" || CONFIG[ACTIVE].volumeDisplay === "m") {
                volumeContainer.classList.remove("v-hidden");
            }
            volumeBarInner.style.height = volume * 100 + "%";
            let currVol = Math.round(volume * 100) === -100 ? "%" : Math.round(volume * 100);
            volumeCurr.innerText = currVol + "%";
            volumeContainer.classList.toggle("unavailable", typeof currVol !== "number");
            if (typeof currVol !== "number" || currVol > 60)
                volumeIcon.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["volume"]}</svg>`;
            else if (currVol > 30)
                volumeIcon.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["volume-two-wave"]}</svg>`;
            else if (currVol > 0)
                volumeIcon.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["volume-one-wave"]}</svg>`;
            else
                volumeIcon.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["volume-off"]}</svg>`;
            if (CONFIG[ACTIVE].volumeDisplay === "o" || CONFIG[ACTIVE].volumeDisplay === "m") {
                hideVolume();
            }
        }
    }

    function updateProgress() {
        const progress = Spicetify.Player.formatTime(Spicetify.Player.getProgress());
        if (!Spicetify.Player.origin._state.isPaused || elaps.innerText !== progress) {
            prog.style.width = Spicetify.Player.getProgressPercent() * 100 + "%";
            elaps.innerText = progress;
        }
    }

    function updatePlayingIcon({ data }) {
        if (data.is_paused) {
            pausedIcon.classList.remove("hidden");
            playingIcon.classList.add("hidden");
        } else {
            pausedIcon.classList.toggle("hidden", CONFIG[ACTIVE].titleMovingIcon);
            playingIcon.classList.toggle("hidden", !CONFIG[ACTIVE].titleMovingIcon);
        }
    }

    function updatePlayerControls({ data }) {
        fadeAnimation(play);
        if (data.is_paused) {
            play.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.play}</svg>`;
        } else {
            play.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.pause}</svg>`;
        }
    }

    let prevControlData = {
        shuffle: Spicetify?.Player?.origin?._state?.shuffle,
        repeat: Spicetify?.Player?.origin?._state?.repeat,
    };

    function updateExtraControls(data) {
        data = !data ? Spicetify.Player.origin._state : data.data;
        updateHeart();
        if (prevControlData?.shuffle !== data?.shuffle) fadeAnimation(shuffle);
        if (prevControlData?.repeat !== data?.repeat) fadeAnimation(repeat);
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
        if (data.restrictions) {
            shuffle.classList.toggle("unavailable", !data?.restrictions?.canToggleShuffle);
            repeat.classList.toggle("unavailable", !data?.restrictions?.canToggleRepeatTrack && !data?.restrictions?.canToggleRepeatContext);
        }
    }

    let prevHeartData = Spicetify?.Player?.origin?._state?.item?.metadata["collection.in_collection"];

    function updateHeart() {
        const meta = Spicetify?.Player?.origin?._state?.item;
        heart.classList.toggle("unavailable", meta?.metadata["collection.can_add"] !== "true");
        if (prevHeartData !== meta?.metadata["collection.in_collection"]) fadeAnimation(heart);
        prevHeartData = meta?.metadata["collection.in_collection"];
        if (meta?.metadata["collection.in_collection"] === "true" || Spicetify.Player.getHeart()) {
            heart.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["heart-active"]}</svg>`;
            heart.classList.add("button-active");
        } else {
            heart.innerHTML = `<svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons["heart"]}</svg>`;
            heart.classList.remove("button-active");
        }
    }

    let curTimer, ctxTimer, volTimer;

    function hideCursor() {
        if (curTimer) {
            clearTimeout(curTimer);
            curTimer = 0;
        }
        container.style.cursor = "default";
        curTimer = setTimeout(() => (container.style.cursor = "none"), 2000);
    }

    function hideContext() {
        if (ctxTimer) {
            clearTimeout(ctxTimer);
            ctxTimer = 0;
        }
        ctx_container.style.opacity = 1;
        ctxTimer = setTimeout(() => (ctx_container.style.opacity = 0), 3000);
    }

    function hideVolume() {
        if (volTimer) {
            clearTimeout(volTimer);
            volTimer = 0;
        }
        volumeContainer.classList.remove("v-hidden");
        volTimer = setTimeout(() => volumeContainer.classList.add("v-hidden"), 3000);
    }

    let origLoc, progressListener;
    const heartObserver = new MutationObserver(updateHeart);

    function activate() {
        button.classList.add("control-button--active", "control-button--active-dot");
        container.style.setProperty("--fs-transition", `${CONFIG[ACTIVE].backAnimationTime}s`);
        updateInfo();
        Spicetify.Player.addEventListener("songchange", updateInfo);
        container.addEventListener("mousemove", hideCursor);
        hideCursor();
        container.querySelector("#fsd-foreground").oncontextmenu = openConfig;
        container.querySelector("#fsd-foreground").ondblclick = deactivate;
        back.oncontextmenu = openConfig;
        back.ondblclick = deactivate;
        if (CONFIG[ACTIVE].contextDisplay === "m") {
            container.addEventListener("mousemove", hideContext);
            hideContext();
        }
        if (CONFIG[ACTIVE].upnextDisplay) {
            updateUpNextShow();
            Spicetify.Player.origin._events.addListener("queue_update", updateUpNext);
            Spicetify.Player.origin._events.addListener("update", updateUpNextShow);
            window.addEventListener("resize", updateUpNext);
        }
        if (CONFIG[ACTIVE].volumeDisplay !== "n") {
            if (Spicetify.Platform?.PlaybackAPI === undefined) Spicetify.Player.origin._events.addListener("volume", updateVolume);
            else Spicetify.Platform.PlaybackAPI._events.addListener("volume", updateVolume);
            updateVolume();
            if (CONFIG[ACTIVE].volumeDisplay === "m") {
                container.addEventListener("mousemove", hideVolume);
                hideVolume();
            }
        }
        if (CONFIG[ACTIVE].enableFade) {
            cover.classList.add("fsd-background-fade");
            if (CONFIG.tvMode) back.classList.add("fsd-background-fade");
        } else {
            cover.classList.remove("fsd-background-fade");
            if (CONFIG.tvMode) back.classList.remove("fsd-background-fade");
        }
        if (CONFIG[ACTIVE].icons) {
            updatePlayingIcon({ data: { is_paused: !Spicetify.Player.isPlaying() } });
            Spicetify.Player.addEventListener("onplaypause", updatePlayingIcon);
        }
        if (CONFIG[ACTIVE].progressBarDisplay) {
            updateProgress();
            progressListener = setInterval(updateProgress, 500);
        }
        if (CONFIG[ACTIVE].playerControls) {
            updatePlayerControls({ data: { is_paused: !Spicetify.Player.isPlaying() } });
            Spicetify.Player.addEventListener("onplaypause", updatePlayerControls);
        }
        if (CONFIG[ACTIVE].extraControls) {
            updateExtraControls();
            addObserver(heartObserver, ".control-button-heart", { attributes: true, attributeFilter: ["aria-checked"] });
            Spicetify.Player.origin._events.addListener("update", updateExtraControls);
        }
        document.body.classList.add(...classes);
        if (CONFIG[ACTIVE].enableFullscreen) fullScreenOn();
        else fullScreenOff();
        document.querySelector(".Root__top-container").append(style, container);
        if (CONFIG[ACTIVE].lyricsDisplay) {
            window.addEventListener("lyrics-plus-update", handleLyricsUpdate);
            origLoc = Spicetify.Platform.History.location.pathname;
            if (origLoc !== "/lyrics-plus") {
                Spicetify.Platform.History.push("/lyrics-plus");
            }
            window.dispatchEvent(new Event("fad-request"));
        }
        Spicetify.Keyboard.registerShortcut(
            {
                key: Spicetify.Keyboard.KEYS["F11"],
                ctrl: false,
                shift: false,
                alt: false,
            },
            fsToggle
        );
        Spicetify.Keyboard.registerShortcut(
            {
                key: Spicetify.Keyboard.KEYS["ESCAPE"],
                ctrl: false,
                shift: false,
                alt: false,
            },
            deactivate
        );
    }

    function deactivate() {
        button.classList.remove("control-button--active", "control-button--active-dot");
        Spicetify.Player.removeEventListener("songchange", updateInfo);
        container.removeEventListener("mousemove", hideCursor);
        if (CONFIG[ACTIVE].contextDisplay === "m") {
            container.removeEventListener("mousemove", hideContext);
        }
        if (CONFIG[ACTIVE].upnextDisplay) {
            upNextShown = false;
            Spicetify.Player.origin._events.removeListener("queue_update", updateUpNext);
            Spicetify.Player.origin._events.removeListener("update", updateUpNextShow);
            window.removeEventListener("resize", updateUpNext);
        }
        if (CONFIG[ACTIVE].volumeDisplay !== "n") {
            if (Spicetify.Platform?.PlaybackAPI === undefined) Spicetify.Player.origin._events.removeListener("volume", updateVolume);
            else Spicetify.Platform.PlaybackAPI._events.removeListener("volume", updateVolume);
            if (CONFIG[ACTIVE].volumeDisplay === "m") container.removeEventListener("mousemove", hideVolume);
        }
        if (CONFIG[ACTIVE].progressBarDisplay) {
            clearInterval(progressListener);
        }
        if (CONFIG[ACTIVE].icons) {
            Spicetify.Player.removeEventListener("onplaypause", updatePlayingIcon);
        }
        if (CONFIG[ACTIVE].playerControls) {
            Spicetify.Player.removeEventListener("onplaypause", updatePlayerControls);
        }
        if (CONFIG[ACTIVE].extraControls) {
            heartObserver.disconnect();
            Spicetify.Player.origin._events.removeListener("update", updateExtraControls);
        }
        document.body.classList.remove(...classes);
        upNextShown = false;
        if (CONFIG[ACTIVE].enableFullscreen) {
            fullScreenOff();
        }
        let popup = document.querySelector("body > generic-modal");
        if (popup) popup.remove();
        style.remove();
        container.remove();
        if (CONFIG[ACTIVE].lyricsDisplay) {
            window.removeEventListener("lyrics-plus-update", handleLyricsUpdate);
            if (origLoc !== "/lyrics-plus") {
                Spicetify.Platform.History.push(origLoc);
                Spicetify.Platform.History.entries.splice(Spicetify.Platform.History.entries.length - 3, 2);
                Spicetify.Platform.History.index = Spicetify.Platform.History.index > 0 ? Spicetify.Platform.History.index - 2 : -1;
                Spicetify.Platform.History.length = Spicetify.Platform.History.length > 1 ? Spicetify.Platform.History.length - 2 : 0;
            }
            window.dispatchEvent(new Event("fad-request"));
        }
        Spicetify.Keyboard._deregisterShortcut({
            key: Spicetify.Keyboard.KEYS["F11"],
            ctrl: false,
            shift: false,
            alt: false,
        });
        Spicetify.Keyboard._deregisterShortcut({
            key: Spicetify.Keyboard.KEYS["ESCAPE"],
            ctrl: false,
            shift: false,
            alt: false,
        });
    }

    function fsToggle() {
        if (CONFIG[ACTIVE].enableFullscreen) {
            CONFIG[ACTIVE]["enableFullscreen"] = false;
            saveConfig();
            render();
            activate();
        } else {
            CONFIG[ACTIVE]["enableFullscreen"] = true;
            saveConfig();
            render();
            activate();
        }
    }

    function getConfig() {
        try {
            const parsed = JSON.parse(Spicetify.LocalStorage.get("full-screen-config"));
            if (!!parsed && typeof parsed === "object") {
                Object.keys(DEFAULTS).forEach((key) => {
                    if (parsed[key] === undefined) {
                        parsed[key] = DEFAULTS[key];
                    } else {
                        if (typeof DEFAULTS[key] === "object") {
                            Object.keys(DEFAULTS[key])
                                .filter((subkey) => parsed[key][subkey] === undefined)
                                .forEach((subkey) => {
                                    parsed[key][subkey] = DEFAULTS[key][subkey];
                                });
                        }
                    }
                });
                Spicetify.LocalStorage.set("full-screen-config", JSON.stringify(parsed));
                return parsed;
            }
            throw "";
        } catch {
            Spicetify.LocalStorage.set("full-screen-config", JSON.stringify(DEFAULTS));
            return DEFAULTS;
        }
    }

    function saveConfig() {
        Spicetify.LocalStorage.set("full-screen-config", JSON.stringify(CONFIG));
    }

    function saveOption(key, value) {
        CONFIG[ACTIVE][key] = value;
        saveConfig();
        render();
        if (document.body.classList.contains("fsd-activated")) activate();
    }

    function createAdjust(name, key, unit = "", defaultValue, step, min, max, onChange = () => {}) {
        let value = key in CONFIG[ACTIVE] ? CONFIG[ACTIVE][key] : defaultValue;

        function adjustValue(dir) {
            let temp = value + dir * step;
            if (temp < min) {
                temp = min;
            } else if (temp > max) {
                temp = max;
            }
            value = Number(Number(temp).toFixed(step >= 1 ? 0 : 1));
            container.querySelector(".adjust-value").innerText = `${value}${unit}`;
            plus.classList.toggle("disabled", value === max);
            minus.classList.toggle("disabled", value === min);
            onChange(value);
        }
        const container = document.createElement("div");
        container.innerHTML = `
        <div class="setting-row">
             <label class="col description">${name}</label>
             <div class="col action">
                <button class="switch small minus"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 7h12v2H0z"/></button>
                <p class="adjust-value">${value}${unit}</p>
                <button class="switch small plus"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">${Spicetify.SVGIcons.plus2px}</button>
            </div>
        </div>
        `;
        const minus = container.querySelector(".minus");
        const plus = container.querySelector(".plus");
        minus.classList.toggle("disabled", value === min);
        plus.classList.toggle("disabled", value === max);
        minus.onclick = () => adjustValue(-1);
        plus.onclick = () => adjustValue(1);
        return container;
    }

    function createOptions(name, options, defaultValue, callback) {
        const container = document.createElement("div");
        container.innerHTML = `
          <div class="setting-row">
            <label class="col description">${name}</label>
            <div class="col action">
              <select>
               ${Object.keys(options)
                   .map(
                       (item) => `
                  <option value="${item}" dir="auto">${options[item]}</option>`
                   )
                   .join("\n")}
             </select>
            </div>
          </div>`;
        const select = container.querySelector("select");
        select.value = defaultValue;
        select.onchange = (e) => {
            callback(e.target.value);
        };
        return container;
    }

    function createToggle(name, key, callback = () => {}) {
        const container = document.createElement("div");
        container.innerHTML = `
          <div class="setting-row">
             <label class="col description">${name}</label>
             <div class="col action">
                <label class="switch">
                  <input type="checkbox">
                  <span class="slider"></span>
                </label>
             </div>
          </div>`;

        const toggle = container.querySelector("input");
        toggle.checked = CONFIG[ACTIVE][key];
        toggle.onchange = (evt) => {
            CONFIG[ACTIVE][key] = evt.target.checked;
            saveConfig();
            render();
            callback(container, evt.target.checked);
            if (document.body.classList.contains("fsd-activated")) {
                activate();
            }
        };
        return container;
    }

    function headerText(text, subtext = "") {
        const container = document.createElement("div");
        container.classList.add("subhead");
        const listHeader = document.createElement("h2");
        listHeader.innerText = text;
        container.append(listHeader);
        if (subtext) {
            const listSub = document.createElement("i");
            listSub.innerText = "(" + subtext + ")";
            container.append(listSub);
        }
        return container;
    }
    let configContainer;

    function openConfig(evt) {
        evt?.preventDefault();
        configContainer = document.createElement("div");
        configContainer.id = "full-screen-config-container";
        const style = document.createElement("style");
        style.innerHTML = `
           .GenericModal ::-webkit-scrollbar{
              width: 7px;
           }
           .GenericModal ::-webkit-scrollbar-thumb{
              border-radius: 2rem;
           }
           .main-trackCreditsModal-container{
              height: 75vh;
              max-height: 600px;
              width: clamp(500px,50vw,600px);
           }        
           .setting-row::after {
               content: "";
               display: table;
               clear: both;
           }
           .setting-row-but{
               display: flex;
               align-items: center;
               justify-content: center;
           }
           .subhead{
              text-align: center;
              padding: 5px 0;
           }
           .setting-row-but button{
               margin: 5px 10px;
           }
           .setting-row .col {
               display: flex;
               padding: 10px 0;
               align-items: center;
           }
           .setting-row .col.description {
               float: left;
               padding-right: 15px;
           }
           .setting-row .col.action {
               float: right;
               text-align: right;
           }
           .switch {
             position: relative;
             display: inline-block;
             width: 44px;
             height: 20px;
           }
           .switch input {
             opacity: 0;
             width: 0;
             height: 0;
           }
           .slider {
             position: absolute;
             cursor: pointer;
             top: 0;
             left: 0;
             right: 0;
             bottom: 0;
             background-color: rgba(150,150,150,.5);
             transition: all .3s ease-in-out;
             border-radius: 34px;
           }
           .slider:before {
             position: absolute;
             content: "";
             height: 24px;
             width: 24px;
             left: -2px;
             bottom: -2px;
             background-color: #EEE;
             transition: all .3s ease-in-out;
             border-radius: 50%;
           }
           input:checked + .slider {
             background-color: rgba(var(--spice-rgb-button-disabled),.6);
           }
           input:focus + .slider {
             box-shadow: 0 0 1px rgba(var(--spice-rgb-button-disabled),.6);
           }
           input:checked + .slider:before {
             transform: translateX(24px);
             background-color: var(--spice-button);
             filter:  brightness(1.1) saturate(1.2);
           }
           #full-screen-config-container select {
               color: var(--spice-text);
               background: var(--spice-card);
               border: none;
               height: 32px;
           }
           #full-screen-config-container option {
            color: var(--spice-text);
            background: var(--spice-card);
           }
           button.switch {
               align-items: center;
               border: 0px;
               border-radius: 50%;
               background-color: rgba(var(--spice-rgb-shadow), 0.7);
               color: var(--spice-text);
               cursor: pointer;
               margin-inline-start: 12px;
               padding: 8px;
               width: 32px;
               height: 32px;
           }
           button.switch.disabled,
           button.switch[disabled] {
               color: rgba(var(--spice-rgb-text), 0.3);
               pointer-events: none;
           }
           button.switch.small {
               width: 22px;
               height: 22px;
               padding: 3px;
           }
           #full-screen-config-container .adjust-value {
               margin-inline: 12px;
               width: 22px;
               text-align: center;
           }
        `;
        configContainer.append(
            style,
            (() => {
                const container = document.createElement("div");
                container.innerHTML = `
                <div class="setting-row-but">
                  <button class="main-buttons-button main-button-primary" id="mode-switch">${
                      CONFIG.tvMode ? "Switch to Default Mode" : "Switch to TV Mode"
                  }</button>
                  <button class="main-buttons-button main-button-primary" id="mode-exit">Exit</button>
                </div>`;
                container.querySelector("#mode-exit").onclick = deactivate;
                container.querySelector("#mode-switch").onclick = () => {
                    CONFIG.tvMode ? openwithDef() : openwithTV();
                    document.querySelector("body > generic-modal")?.remove();
                };
                return document.body.classList.contains("fsd-activated") ? container : "";
            })(),
            headerText("Lyrics Settings"),
            createToggle("Lyrics", "lyricsDisplay", (row, status) => {
                container.classList.remove("lyrics-unavailable");
                let nextEle = row.nextElementSibling;
                while (!nextEle.classList.contains("subhead")) {
                    nextEle.classList.toggle("hidden", !status);
                    nextEle = nextEle.nextElementSibling;
                }
            }),
            createOptions(
                "Lyrics Alignment",
                {
                    left: "Left",
                    center: "Center",
                    right: "Right",
                },
                CONFIG[ACTIVE].lyricsAlignment,
                (value) => saveOption("lyricsAlignment", value)
            ),
            createAdjust("Lyrics Animation Tempo", "animationTempo", "s", 0.3, 0.1, 0, 1, (state) => {
                CONFIG[ACTIVE]["animationTempo"] = state;
                saveConfig();
                render();
                if (document.body.classList.contains("fsd-activated")) activate();
            }),
            headerText("General"),
            createToggle("Progress Bar", "progressBarDisplay"),
            createToggle("Player Controls", "playerControls"),
            createToggle("Trim Title", "trimTitle"),
            createOptions(
                "Show Album",
                {
                    n: "Never",
                    a: "Show",
                    d: "Show with Release Date",
                },
                CONFIG[ACTIVE].showAlbum,
                (value) => saveOption("showAlbum", value)
            ),
            createToggle("Show All Artists", "showAllArtists"),
            createToggle("Icons", "icons"),
            createToggle("Song Change Animation", "enableFade"),
            document.fullscreenEnabled ? createToggle("Fullscreen", "enableFullscreen") : "",
            headerText("Extra Functionality"),
            ACTIVE !== "tv"
                ? createOptions(
                      "Background Choice",
                      {
                          c: "Colored Background",
                          a: "Blurred Album art",
                      },
                      CONFIG.def.backgroundChoice,
                      (value) => saveOption("backgroundChoice", value)
                  )
                : "",
            createToggle("Extra Controls", "extraControls"),
            createToggle("Upnext Display", "upnextDisplay"),
            createOptions(
                "Context Display",
                {
                    n: "Never",
                    m: "On Mousemove",
                    a: "Always",
                },
                CONFIG[ACTIVE].contextDisplay,
                (value) => saveOption("contextDisplay", value)
            ),
            createOptions(
                "Volume Bar Display",
                {
                    a: "Always",
                    n: "Never",
                    m: "On Mousemove",
                    o: "On Volumechange",
                },
                CONFIG[ACTIVE].volumeDisplay,
                (value) => saveOption("volumeDisplay", value)
            ),
            headerText("Advanced/Appearance", "Only change if you know what you are doing!"),
            ACTIVE !== "tv"
                ? createOptions(
                      "Color choice on colored background",
                      {
                          VIBRANT: "Vibrant",
                          PROMINENT: "Prominent",
                          DESATURATED: "Desaturated (Recommended)",
                          LIGHT_VIBRANT: "Light Vibrant",
                          DARK_VIBRANT: "Dark Vibrant",
                          VIBRANT_NON_ALARMING: "Vibrant Non ALarming",
                      },
                      CONFIG.def.coloredBackChoice,
                      (value) => saveOption("coloredBackChoice", value)
                  )
                : "",
            createToggle("Themed Buttons", "themedButtons"),
            createToggle("Themed Icons", "themedIcons"),
            createOptions(
                "Invert Colors",
                {
                    n: "Never",
                    a: "Always",
                    d: "Automatic(Based on BG)",
                },
                CONFIG[ACTIVE].invertColors,
                (value) => saveOption("invertColors", value)
            ),
            createAdjust("Background Animation Time", "backAnimationTime", "s", 0.8, 0.1, 0, 5, (state) => {
                CONFIG[ACTIVE]["backAnimationTime"] = state;
                saveConfig();
                render();
                if (document.body.classList.contains("fsd-activated")) activate();
            }),
            createOptions(
                "Upnext Scroll Animation",
                {
                    mq: "Marquee/Scrolling",
                    sp: "Spotify/Translating",
                },
                CONFIG[ACTIVE].upNextAnim,
                (value) => saveOption("upNextAnim", value)
            ),
            createAdjust("Upnext Time to Show", "upnextTimeToShow", "s", 30, 1, 5, 60, (state) => {
                CONFIG[ACTIVE]["upnextTimeToShow"] = state;
                saveConfig();
                updateUpNextShow();
                // render()
                // if (document.body.classList.contains('fsd-activated'))
                // activate()
            }),
            createAdjust("Background Blur", "blurSize", "px", 20, 4, 0, 100, (state) => {
                CONFIG[ACTIVE]["blurSize"] = state;
                saveConfig();
                render();
                if (document.body.classList.contains("fsd-activated")) activate();
            }),
            createOptions(
                "Background Brightness",
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
                    1: "Full",
                },
                CONFIG[ACTIVE].backgroundBrightness,
                (value) => saveOption("backgroundBrightness", Number(value))
            ),
            (() => {
                const container = document.createElement("div");
                container.innerHTML = `
                <div class="setting-row-but">
                  <button class="main-buttons-button main-button-secondary" id="reset-switch">Reset Config</button>
                  <button class="main-buttons-button main-button-secondary" id="reload-switch">Reload Client</button>
                </div>`;
                container.querySelector("#reset-switch").onclick = () => {
                    CONFIG[ACTIVE] = DEFAULTS[ACTIVE];
                    saveConfig();
                    render();
                    if (document.body.classList.contains("fsd-activated")) {
                        activate();
                    }
                    configContainer = "";
                    setTimeout(openConfig, 5);
                };
                container.querySelector("#reload-switch").onclick = () => {
                    location.reload();
                };
                return container;
            })()
        );
        Spicetify.PopupModal.display({
            title: ACTIVE === "tv" ? "TV Mode Config" : "Full Screen Config",
            content: configContainer,
        });
    }

    // container.ondblclick = deactivate

    // Add Full Screen Button on bottom bar
    const button = document.createElement("button");
    button.classList.add("button", "fsd-button", "control-button", "InvalidDropTarget");
    button.innerHTML = `<svg role="img" height="20" width="20" viewBox="0 0 20 20" fill="currentColor"><path d="M10.5 3L16.5428 3.00182L16.6281 3.01661L16.691 3.03779L16.767 3.07719L16.8221 3.11759L16.8824 3.17788L16.9112 3.21534L16.9533 3.2886L16.9834 3.37186L16.9979 3.45421L17 3.5V9.5C17 9.77614 16.7761 10 16.5 10C16.2545 10 16.0504 9.82312 16.0081 9.58988L16 9.5V4.706L4.706 16H9.5C9.74546 16 9.94961 16.1769 9.99194 16.4101L10 16.5C10 16.7455 9.82312 16.9496 9.58988 16.9919L9.5 17L3.47964 16.9996L3.4112 16.9921L3.30896 16.9622L3.23299 16.9228L3.17786 16.8824L3.11758 16.8221L3.08884 16.7847L3.04674 16.7114L3.01661 16.6281L3.01109 16.605C3.00383 16.5713 3 16.5361 3 16.5L3.00546 16.5739L3.00182 16.5428L3 10.5C3 10.2239 3.22386 10 3.5 10C3.74546 10 3.94961 10.1769 3.99194 10.4101L4 10.5V15.292L15.292 4H10.5C10.2545 4 10.0504 3.82312 10.0081 3.58988L10 3.5C10 3.22386 10.2239 3 10.5 3Z"></path><path class="" d="M16 3C16.5523 3 17 3.44772 17 4V9.25C17 9.66421 16.6642 10 16.25 10C15.8358 10 15.5 9.66421 15.5 9.25V5.559L5.559 15.5H9.25C9.66421 15.5 10 15.8358 10 16.25C10 16.6642 9.66421 17 9.25 17H4C3.44772 17 3 16.5523 3 16V10.75C3 10.3358 3.33579 10 3.75 10C4.16421 10 4.5 10.3358 4.5 10.75V14.439L14.439 4.5H10.75C10.3358 4.5 10 4.16421 10 3.75C10 3.33579 10.3358 3 10.75 3H16Z"></path></svg>`;
    button.id = "fs-button";
    button.setAttribute("title", "Full Screen");

    button.onclick = openwithDef;

    extraBar.append(button);
    button.oncontextmenu = (evt) => {
        evt.preventDefault();
        ACTIVE = "def";
        openConfig();
    };

    // Add TV Mode Button on top bar
    const button2 = document.createElement("button");
    button2.classList.add("button", "tm-button", "main-topBar-button", "InvalidDropTarget");
    button2.innerHTML = `<svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 13.5A.5.5 0 0 1 3 13h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zM13.991 3l.024.001a1.46 1.46 0 0 1 .538.143.757.757 0 0 1 .302.254c.067.1.145.277.145.602v5.991l-.001.024a1.464 1.464 0 0 1-.143.538.758.758 0 0 1-.254.302c-.1.067-.277.145-.602.145H2.009l-.024-.001a1.464 1.464 0 0 1-.538-.143.758.758 0 0 1-.302-.254C1.078 10.502 1 10.325 1 10V4.009l.001-.024a1.46 1.46 0 0 1 .143-.538.758.758 0 0 1 .254-.302C1.498 3.078 1.675 3 2 3h11.991zM14 2H2C0 2 0 4 0 4v6c0 2 2 2 2 2h12c2 0 2-2 2-2V4c0-2-2-2-2-2z"/></svg>`;
    button2.id = "TV-button";
    button2.setAttribute("title", "TV Mode Display");

    button2.onclick = openwithTV;

    topBar.append(button2);
    button2.oncontextmenu = (evt) => {
        evt.preventDefault();
        ACTIVE = "tv";
        openConfig();
    };

    render();
}

fullScreen();
