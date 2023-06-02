export type Config = {
    tv: Settings;
    def: Settings;
    tvMode: boolean;
    locale: string;
    fsHideOriginal: boolean;
    autoLaunch: "never" | "tvmode" | "default" | "lastused";
    activationTypes: "both" | "btns" | "keys";
    buttonActivation: "both" | "tv" | "def";
    keyActivation: "both" | "tv" | "def";
};

export type Settings = {
    lyricsDisplay: boolean;
    lyricsAlignment: "right" | "left" | "center";
    autoHideLyrics: boolean;
    animationTempo: number;
    progressBarDisplay: boolean;
    playerControls: boolean;
    trimTitle: boolean;
    trimTitleUpNext: boolean;
    showAlbum: "never" | "always" | "date";
    showAllArtists: boolean;
    icons: boolean;
    titleMovingIcon: boolean;
    enableFade: boolean;
    enableFullscreen: boolean;
    backgroundChoice:
        | "static_color"
        | "dynamic_color"
        | "album_art"
        | "artist_art"
        | "animated_album";
    extraControls: boolean;
    upnextDisplay: boolean;
    contextDisplay: "never" | "mousemove" | "always";
    volumeDisplay: "always" | "never" | "smart";
    themedButtons: boolean;
    themedIcons: boolean;
    invertColors: "never" | "always" | "auto";
    backAnimationTime: number;
    animationSpeed: number;
    upNextAnim: "sp" | "mq";
    upnextTimeToShow: number;
    coloredBackChoice: string;
    staticBackChoice: string;
    blurSize: number;
    backgroundBrightness: number;
    showRemainingTime: boolean;
};

export type Cache = {
    uri: string;
    colors: Colors;
};

export type Colors = Record<string, string>;

export type SeekbarProps = {
    isChanging: boolean;
    data: MouseData | null;
};

export type MouseData = {
    begin: number;
    positionCoord: number;
    beginClient: number;
    sliderDimen: number;
};

export type TokenType = {
    accessToken: string;
    accessTokenExpirationTimestampMs: number;
    isAnonymous: boolean;
};

export type LyricsEvent = {
    detail: {
        isLoading: boolean;
        available: boolean;
        synced?: { startTime: Number; text: string }[];
    };
};
