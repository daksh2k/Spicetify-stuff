// @ts-check

// NAME: Auto Skip Songs
// AUTHOR: daksh2k
// DESCRIPTION: Auto Skip Certain Songs such as remixes, acoustics etc.., Toggle in Profile menu.

/// <reference path="../globals.d.ts" />

(function autoSkip() {
    const { Player, Menu, Queue } = Spicetify;
    if (!(Player && Menu && Queue)) {
        setTimeout(autoSkip, 1000);
        return;
    }

    // Define the skips in a object and their skip check logic
    const SKIPS = {
        skipAcoustic: {
            menuTitle: "Acoustic Songs",
            check: (meta) => {
                return (
                    ["acoustic", "stripped", "unplugged"].some((value) => meta.name.toLowerCase().includes(value)) ||
                    meta?.features?.acousticness > 0.85
                );
            },
            callback: async (meta) => {
                await addOriginalSongToQueue(`${getTrimmedTitle(meta.name)} artist:${meta.artists[0].name}`);
            },
        },
        skipInstrumental: {
            menuTitle: "Instrumental Songs",
            check: (meta) => {
                return checkByName("instrumental", meta.name) || meta?.features?.instrumentalness > 0.4;
            },
        },
        skipRemix: {
            menuTitle: "Remix Songs",
            check: (meta) => checkByName("remix", meta.name),
            callback: async (meta) => {
                return await addOriginalSongToQueue(`${getTrimmedTitle(meta.name)} artist:${meta.artists[0].name}`);
            },
        },
        skipLive: {
            menuTitle: "Live Songs",
            check: (meta) => {
                return (
                    ["- live", "live version", "(live)"].some((value) => meta.name.toLowerCase().includes(value)) || meta?.features?.liveliness > 0.8
                );
            },
            callback: async (meta) => {
                return await addOriginalSongToQueue(`${getTrimmedTitle(meta.name)} artist:${meta.artists[0].name}`);
            },
        },
        skipRadio: {
            menuTitle: "Radio/Censored songs",
            check: (meta) => checkByName("radio edit", meta.name),
            callback: async (meta) => {
                return await addOriginalSongToQueue(`${getTrimmedTitle(meta.name)} artist:${meta.artists[0].name}`);
            },
        },
        skipExplicit: {
            menuTitle: "Explicit Songs",
            check: (meta) => meta?.explicit === true,
            callback: async (meta) => {
                return await addOriginalSongToQueue(`${getTrimmedTitle(meta.name)} artist:${meta.artists[0].name}`);
            },
        },
        skipChristmas: {
            menuTitle: "Christmas Songs",
            check: (meta) =>
                ["xmas", "christmas", "jingle", "mistletoe", "merry", "santa", "feliz", "navidad"].some((value) =>
                    meta.name.toLowerCase().includes(value)
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

    function getTrimmedTitle(title) {
        const trimmedTitle = title
            .replace(/\(.+?\)/g, "")
            .replace(/\[.+?\]/g, "")
            .replace(/\s\-\s.+?$/, "")
            .trim();
        return trimmedTitle == "" ? title : trimmedTitle;
    }

    function getToken() {
        return Spicetify.Platform.AuthorizationAPI._tokenProvider({
            preferCached: true,
        }).then((res) => res.accessToken);
    }

    /**
     * Get track metadata from Spotify web API
     * @param {string} id
     * @returns
     */
    async function getTrackDetails(id) {
        return fetch(`https://api.spotify.com/v1/tracks/${id}`, {
            headers: {
                Authorization: `Bearer ${await getToken()}`,
            },
        }).then((res) => res.json());
    }
    /**
     * Get audio features of the track from Spotify web API
     * @param {string} query
     * @returns
     */
    async function getTrackFeatures(query) {
        return fetch(`https://api.spotify.com/v1/audio-features/${query}`, {
            headers: {
                Authorization: `Bearer ${await getToken()}`,
            },
        }).then((res) => res.json());
    }

    /**
     * Search spotify and return the results.
     * @param {string} query
     * @param {string} type
     * @returns
     */
    async function searchSpotify(query, type = "track") {
        return fetch(`https://api.spotify.com/v1/search?q=${query}&type=${type}&limit=15`, {
            headers: {
                Authorization: `Bearer ${await getToken()}`,
            },
        }).then((res) => res.json());
    }

    /**
     * Try to find original song and play it.
     * @param {string} searchQuery
     * @returns
     */
    async function addOriginalSongToQueue(searchQuery) {
        const searchSongs = await searchSpotify(searchQuery);
        const allFeatures = await getTrackFeatures(`?ids=${searchSongs.tracks.items.map((track) => track.uri.split(":")[2]).join()}`).catch((err) =>
            console.log(err)
        );

        for (const track of searchSongs.tracks.items) {
            // console.log("Checking", track.name);
            track.features = allFeatures.audio_features.filter((e) => e.uri === track.uri)[0];
            // console.log(track);
            if (getSkipReasons(track).length == 0) {
                console.log("Adding to queue", track.name);
                await Spicetify.CosmosAsync.put("sp://player/v2/main/queue", {
                    queue_revision: Spicetify.Queue?.queueRevision,
                    next_tracks: [
                        {
                            uri: track.uri,
                            provider: "queue",
                            metadata: {
                                is_queued: true,
                            },
                        },
                        ...Spicetify.Queue?.nextTracks.map((track) => ({
                            uri: track.contextTrack.uri,
                            provider: track.provider,
                            metadata: {
                                is_queued: track.provider === "queue",
                            },
                        })),
                    ],
                    prev_tracks: Spicetify.Queue?.prevTracks,
                });
                // await Spicetify.Player.origin.addToQueue([{ uri: track.uri }]);
                return track;
            }
        }
        return null;
    }

    function getSkipReasons(meta) {
        return Object.entries(CONFIG)
            .filter(([key, shouldCheck]) => shouldCheck && SKIPS[key].check(meta))
            .map((reason) => reason[0]);
    }

    /**
     * Get track metadata
     * @param {string} uri
     * @returns Metadata of a track with audio features or null
     */
    async function loadMetadata(uri) {
        const base62Id = uri.split(":")[2];
        const meta = await getTrackDetails(base62Id).catch((err) => console.log(err));
        if (!meta || !meta.name) return null;
        meta.features = await getTrackFeatures(base62Id).catch((err) => console.log(err));
        return meta;
    }

    let nextSongMeta = null;

    // Main function to check skip of current song
    let skippedSong = {};
    async function checkSkip() {
        const meta = Spicetify.Player?.data?.track;
        if (!meta) return;
        const startTime = new Date();

        let apiMeta;
        if (nextSongMeta === null || nextSongMeta.uri !== meta.uri) {
            apiMeta = await loadMetadata(meta.uri);
        } else {
            apiMeta = nextSongMeta;
        }
        if (apiMeta === null) return;
        const skipReasonsKeys = getSkipReasons(apiMeta);
        // console.log(skipReasonsKeys);

        if (skipReasonsKeys.length > 0) {
            const skipReasons = skipReasonsKeys.map((key) => SKIPS[key].menuTitle).join(", ");
            /* Check if the current song was skipped just before
               if it was then dont't skip it.*/
            if (meta?.uri === skippedSong?.uri && meta?.uid === skippedSong?.uid) {
                const message = `${meta?.metadata?.title} was auto skipped due to ${skipReasons} filters.`;
                Spicetify.showNotification(message);
                console.log(message);
                skippedSong = {};
            } else {
                skipReasonsKeys.forEach((key) => STATS[key]++);
                localStorage.setItem("auto-skip:stats", JSON.stringify(STATS));

                Spicetify.Player.toggleMute();

                console.log(`Before callback ${(new Date().getTime() - startTime.getTime()) / 1000} seconds`);
                const keyCallback = skipReasonsKeys.filter((key) => SKIPS[key].callback !== undefined);
                if (keyCallback.length) {
                    nextSongMeta = (await SKIPS[keyCallback[Math.floor(Math.random() * keyCallback.length)]].callback(apiMeta)) ?? nextSongMeta;
                }

                const totalSkips = Object.values(STATS).reduce((a, b) => a + b, 0);
                const message = `${meta?.metadata?.title} skipped!Reasons: ${skipReasons}. Total skips = ${totalSkips}`;
                Spicetify.showNotification(message);
                console.log(message);

                console.log(`After callback ${(new Date().getTime() - startTime.getTime()) / 1000} seconds`);
                Spicetify.Player.toggleMute();
                Spicetify.Player.next();
                skippedSong = meta;
            }
        }
    }

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

    new Menu.SubMenu(
        "Auto Skip",
        Object.entries(SKIPS).map(([key, value]) => createMenu(value.menuTitle, key))
    ).register();

    Spicetify.Player.addEventListener("songchange", checkSkip);

    Spicetify.Player.origin._events.addListener("queue_update", updateNextMeta);

    checkSkip();
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
