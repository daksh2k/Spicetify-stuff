import SKIPS from "./constants/skips.js";
import { getConfig, saveConfig, loadStats } from "./config.js";
import { loadMetadata, getSkipReasons } from "./utils/utils";

async function main() {
    while (!Spicetify?.Player || !Spicetify?.Menu || !Spicetify?.Queue) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const CONFIG = getConfig();

    const STATS = loadStats(SKIPS);

    /**
     * Preload next song metadata.
     * Gets executed on every queue change.
     */
    async function updateNextMeta({ data }) {
        if (!data.current) return;
        if (data.queued.length) {
            if (!nextSongMeta || nextSongMeta?.uri !== data?.queued[0]?.uri) {
                if (!data?.queued[0]?.uri) return;
                nextSongMeta = await loadMetadata(data?.queued[0]?.uri);
            }
        } else {
            if (!nextSongMeta || nextSongMeta?.uri !== data?.nextUp[0]?.uri) {
                if (!data?.nextUp[0]?.uri) return;
                nextSongMeta = await loadMetadata(data?.nextUp[0]?.uri);
            }
        }
    }

    let nextSongMeta = null;
    let skippedSong = {};

    /**
     * Main function to check skip of current song.
     * Gets executed on every song change.
     */
    async function checkSkip() {
        const meta = Spicetify.Player?.data?.track;
        if (!meta) return;

        let apiMeta;
        if (nextSongMeta === null || nextSongMeta.uri !== meta.uri) {
            apiMeta = await loadMetadata(meta.uri);
        } else {
            apiMeta = nextSongMeta;
        }
        if (apiMeta === null) return;
        const skipReasonsKeys = getSkipReasons(apiMeta, meta);

        if (skipReasonsKeys.length > 0) {
            const skipReasons = skipReasonsKeys.map((key) => SKIPS[key].menuTitle).join(", ");
            // Check if the current song was skipped just before
            // if it was then dont't skip it.
            if (meta?.uri === skippedSong?.uri && meta?.uid === skippedSong?.uid) {
                const message = `${meta?.metadata?.title} was auto skipped due to ${skipReasons} filters.`;
                Spicetify.showNotification(message);
                console.log(message);
                skippedSong = {};
            } else {
                skipReasonsKeys.forEach((key) => STATS[key]++);
                localStorage.setItem("auto-skip:stats", JSON.stringify(STATS));

                const keyCallback = skipReasonsKeys.filter(
                    (key) => SKIPS[key].callback !== undefined
                );
                if (keyCallback.length) {
                    document.querySelector(".main-nowPlayingBar-volumeBar > button")?.click();
                    await SKIPS[keyCallback[Math.floor(Math.random() * keyCallback.length)]]
                        .callback(apiMeta)
                        .then((data) => {
                            nextSongMeta = data ?? nextSongMeta;
                        })
                        .catch((err) => console.error(err))
                        .finally(() => {
                            document
                                .querySelector(".main-nowPlayingBar-volumeBar > button")
                                ?.click();
                        });
                }

                const totalSkips = Object.values(STATS).reduce((a, b) => a + b, 0);
                const message = `${meta?.metadata?.title} skipped!Reasons: ${skipReasons}. Total skips = ${totalSkips}`;
                Spicetify.showNotification(message);
                console.log(message);

                Spicetify.Player.next();
                skippedSong = meta;
            }
        }
    }

    Spicetify.Player.addEventListener("songchange", checkSkip);

    Spicetify.Player.origin._events.addListener("queue_update", updateNextMeta);

    checkSkip();

    /**
     * Create a menu item to enable/disable auto skip for each reason.
     * @param {string} title Title of the menu item
     * @param {string} key Unique key of the menu item
     */
    function createMenu(title, key) {
        return new Spicetify.Menu.Item(title, CONFIG[key], (menuItem) => {
            CONFIG[key] = !CONFIG[key];
            menuItem.isEnabled = CONFIG[key];
            saveConfig(CONFIG);
            checkSkip();
        });
    }

    new Spicetify.Menu.SubMenu(
        "Auto Skip",
        Object.entries(SKIPS).map(([key, value]) => createMenu(value.menuTitle, key))
    ).register();
}

export default main;
