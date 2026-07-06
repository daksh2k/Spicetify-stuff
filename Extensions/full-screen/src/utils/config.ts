import { Config, Settings } from "../types/fullscreen";
import defaultsDeep from "lodash.defaultsdeep";
import { DEFAULTS } from "../constants";

let CONFIG: Config | null = null;
let ACTIVE: "tv" | "def" | null = null;

function getConfig(DEFAULTS: Config): Config {
    try {
        const parsed = JSON.parse(localStorage.getItem("full-screen-config") ?? "{}");
        if (Boolean(parsed) && typeof parsed === "object") {
            defaultsDeep(parsed, DEFAULTS);
            const def = parsed.def as Record<string, unknown> | undefined;
            const legacyAlbum = def?.albumArtSizing;
            if (
                def &&
                typeof legacyAlbum === "string" &&
                [
                    "classic",
                    "auto",
                    "scale125",
                    "scale15",
                    "scale175",
                    "scale2",
                    "scale25",
                ].includes(legacyAlbum)
            ) {
                (parsed as unknown as Config).defaultModeAlbumArtSizing =
                    legacyAlbum as Config["defaultModeAlbumArtSizing"];
                delete def.albumArtSizing;
            }
            localStorage.setItem("full-screen-config", JSON.stringify(parsed));
            return parsed;
        }
        throw "";
    } catch {
        localStorage.setItem("full-screen-config", JSON.stringify(DEFAULTS));
        return DEFAULTS;
    }
}

function saveConfig(CONFIG: Config) {
    localStorage.setItem("full-screen-config", JSON.stringify(CONFIG));
}

const ConfigManager = {
    get(key: keyof Settings) {
        if (CONFIG === null) {
            CONFIG = getConfig(DEFAULTS);
        }
        if (ACTIVE === null) {
            ACTIVE = CONFIG.tvMode ? "tv" : "def";
        }
        return CONFIG[ACTIVE][key];
    },
    set(key: keyof Settings, value: Settings[keyof Settings]) {
        if (CONFIG === null) {
            CONFIG = getConfig(DEFAULTS);
        }
        if (ACTIVE === null) {
            ACTIVE = CONFIG.tvMode ? "tv" : "def";
        }
        //@ts-ignore: using bracket notation to access key
        CONFIG[ACTIVE][key] = value;
        saveConfig(CONFIG);
        document.dispatchEvent(new CustomEvent(key, { detail: value }));
    },
    getGlobal(key: keyof Config) {
        if (CONFIG === null) {
            CONFIG = getConfig(DEFAULTS);
        }
        if (ACTIVE === null) {
            ACTIVE = CONFIG.tvMode ? "tv" : "def";
        }
        return CONFIG[key];
    },
    setGlobal(key: keyof Config, value: Config[keyof Config]) {
        if (CONFIG === null) {
            CONFIG = getConfig(DEFAULTS);
        }
        if (ACTIVE === null) {
            ACTIVE = CONFIG.tvMode ? "tv" : "def";
        }
        //@ts-ignore: using bracket notation to access key
        CONFIG[key] = value;
        saveConfig(CONFIG);
        document.dispatchEvent(new CustomEvent(key, { detail: value }));
    },
    getMode() {
        if (CONFIG === null) {
            CONFIG = getConfig(DEFAULTS);
        }
        if (ACTIVE === null) {
            ACTIVE = CONFIG.tvMode ? "tv" : "def";
        }
        return ACTIVE;
    },
    setMode(modeValue: "tv" | "def") {
        ACTIVE = modeValue;
    },
    resetSettings(key: keyof Settings | null = null, isGlobal = false) {
        if (CONFIG === null) {
            CONFIG = getConfig(DEFAULTS);
        }
        if (isGlobal) {
            CONFIG = DEFAULTS;
        } else {
            if (ACTIVE === null) {
                ACTIVE = CONFIG.tvMode ? "tv" : "def";
            }
            if (key === null) {
                CONFIG[ACTIVE] = DEFAULTS[ACTIVE];
            } else {
                //@ts-ignore: using bracket notation to access key
                CONFIG[ACTIVE][key] = DEFAULTS[ACTIVE][key];
            }
        }
        saveConfig(CONFIG);
    },
};

export default ConfigManager;
