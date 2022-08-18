// @ts-check

// NAME: Auto Skip Songs
// AUTHOR: daksh2k
// DESCRIPTION: Auto Skip Certain Songs such as remixes, acoustics etc.., Toggle in Profile menu.

/// <reference path="../globals.d.ts" />

(function autoSkip() {
    const { Player, Menu } = Spicetify;
    if (!(Player && Menu)) {
        setTimeout(autoSkip, 1000);
        return;
    }

    // Define the skips in a object and their skip check logic
    const SKIPS = {
        skipAcoustic: {
            menuTitle: "Acoustic Songs",
            check: (meta) => {
                return checkByName("acoustic", meta.metadata.title) || meta.features.acousticness > 0.85;
            },
        },
        skipInstrumental: {
            menuTitle: "Instrumental Songs",
            check: (meta) => {
                return checkByName("instrumental", meta.metadata.title) || meta.features.instrumentalness > 0.4;
            },
        },
        skipRemix: {
            menuTitle: "Remix Songs",
            check: (meta) => checkByName("remix", meta.metadata.title),
        },
        skipLive: {
            menuTitle: "Live Songs",
            check: (meta) => {
                return (
                    ["- live", "live version", "(live)"].some((value) => meta.metadata.title.toLowerCase().includes(value)) ||
                    meta.features.liveliness > 0.8
                );
            },
        },
        skipExplicit: {
            menuTitle: "Explicit Songs",
            check: (meta) => meta.metadata.is_explicit === "true",
        },
        skipChristmas: {
            menuTitle: "Christmas Songs",
            check: (meta) =>
                ["xmas", "christmas", "jingle", "mistletoe", "merry", "santa", "feliz", "navidad"].some((value) =>
                    meta.metadata.title.toLowerCase().includes(value)
                ),
        },
    };

    // Load the basic config and define some utility functions for easy loading and saving
    const CONFIG = getConfig();
    function getConfig() {
        try {
            const parsed = JSON.parse(localStorage.getItem("auto-skip:skips"));
            if (parsed && typeof parsed === "object") {
                return parsed;
            }
            throw "";
        } catch {
            localStorage.setItem("auto-skip:skips", "{}");
            return {};
        }
    }

    function saveConfig() {
        localStorage.setItem("auto-skip:skips", JSON.stringify(CONFIG));
    }

    // Store the stats in localstorage and load it on start
    if (localStorage.getItem("auto-skip:stats") === null) {
        localStorage.setItem("auto-skip:stats", "{}");
    }
    const STATS = JSON.parse(localStorage.getItem("auto-skip:stats"));
    Object.keys(SKIPS)
        .filter((key) => STATS[key] === undefined)
        .forEach((key) => (STATS[key] = 0));
    localStorage.setItem("auto-skip:stats", JSON.stringify(STATS));

    // Create a menu item to enable/disable
    function createMenu(title, key) {
        return new Menu.Item(title, CONFIG[key], (menuItem) => {
            CONFIG[key] = !CONFIG[key];
            menuItem.isEnabled = CONFIG[key];
            saveConfig();
            checkSkip();
        });
    }

    function checkByName(key, title) {
        return title.toLowerCase().includes(key);
    }

    function getToken() {
        return Spicetify.Platform.AuthorizationAPI._tokenProvider({
            preferCached: true,
        }).then((res) => res.accessToken);
    }

    async function getTrackFeatures(id) {
        return fetch(`https://api.spotify.com/v1/audio-features/${id}`, {
            headers: {
                Authorization: `Bearer ${await getToken()}`,
            },
        }).then((res) => res.json());
    }

    // Main function to check skip of current song
    let skippedSong = {};
    async function checkSkip() {
        const meta = Player?.data?.track;
        if (!meta) return;

        const features = await getTrackFeatures(meta.uri.split(":")[2]).catch((err) => console.log(err));
        if (features) {
            meta.features = features;
        }
        const skipReasonsKeys = Object.entries(CONFIG)
            .filter(([key, shouldCheck]) => shouldCheck && SKIPS[key].check(meta))
            .map((reason) => reason[0]);
        if (skipReasonsKeys.length > 0) {
            const skipReasons = skipReasonsKeys.map((key) => SKIPS[key].menuTitle).join(", ");
            /* Check if the current song was skipped just before
               if it was then dont't skip it.*/
            if (meta?.uri === skippedSong?.uri && meta?.uid === skippedSong?.uid) {
                const message = `${meta.metadata.title} was auto skipped due to ${skipReasons} filters.`;
                Spicetify.showNotification(message);
                console.log(message);
                skippedSong = {};
            } else {
                skipReasonsKeys.forEach((key) => STATS[key]++);
                localStorage.setItem("auto-skip:stats", JSON.stringify(STATS));
                const totalSkips = Object.values(STATS).reduce((a, b) => a + b, 0);
                const message = `${meta.metadata.title} skipped!Reasons: ${skipReasons}. Total skips = ${totalSkips}`;
                Spicetify.showNotification(message);
                console.log(message);
                Player.next();
                skippedSong = meta;
            }
        }
    }

    new Menu.SubMenu(
        "Auto Skip",
        Object.entries(SKIPS).map(([key, value]) => createMenu(value.menuTitle, key))
    ).register();

    Spicetify.Player.addEventListener("songchange", checkSkip);
})();

/*
Filter by language stuff

let id = Spicetify.URI.idToHex(Spicetify.Player.data.track.uri.split(':')[2]);
let url = "https://spclient.wg.spotify.com/metadata/4/track/" + id;

let accessToken = await Spicetify.Platform.AuthorizationAPI._tokenProvider({preferCached: true}).then(res => res.accessToken);
let resp = await fetch(url, {
    headers: {
        "Authorization": "Bearer " + accessToken,
        "Accept": "application/json"
    }
});
let data = await resp.json()
console.log(data)
*/
