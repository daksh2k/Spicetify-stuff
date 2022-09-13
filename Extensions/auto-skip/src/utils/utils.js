import { WebApi } from "../web-api";
import { getConfig } from "../config";
import SKIPS from "../constants/SKIPS.js";

/**
 * Trims the title of the song to remove the remix, live, etc. from the title
 * @param {string} title
 * @returns
 */
export function getTrimmedTitle(title) {
    const trimmedTitle = title
        .replace(/\(.+?\)/g, "")
        .replace(/\[.+?\]/g, "")
        .replace(/\s\-\s.+?$/, "")
        .trim();
    return trimmedTitle == "" ? title : trimmedTitle;
}

/**
 * Try to find original song and play it.
 * @param {string} searchQuery
 * @returns
 */
export async function addOriginalSongToQueue(searchQuery) {
    const searchSongs = await WebApi.searchSpotify(searchQuery);
    const allFeatures = await WebApi.getTrackFeatures(
        `?ids=${searchSongs.tracks.items
            .map((track) => track.uri.split(":")[2])
            .join()}`
    ).catch((err) => console.error(err));

    for (const track of searchSongs.tracks.items) {
        track.features = allFeatures.audio_features.filter(
            (e) => e.uri === track.uri
        )[0];
        if (getSkipReasons(track).length == 0) {
            console.log("Adding to queue", track);
            await WebApi.addTrackToQueue(track.uri);
            return track;
        }
    }
    return null;
}

/**
 * Get track metadata
 * @param {string} uri
 * @returns Metadata of a track with audio features or null
 */
export async function loadMetadata(uri) {
    const base62Id = uri.split(":")[2];
    const meta = await WebApi.getTrackDetails(base62Id).catch((err) =>
        console.error(err)
    );
    if (!meta || !meta.name) return null;
    meta.features = await WebApi.getTrackFeatures(base62Id).catch((err) =>
        console.error(err)
    );
    return meta;
}

/**
 * Check for valid skip reasons based on current song metadata
 * Only checks for reasons that are enabled in the config
 * @param {object} meta
 * @returns {string[]} List of keys which are valid skip reasons
 */
export function getSkipReasons(meta) {
    return Object.entries(getConfig())
        .filter(([key, shouldCheck]) => shouldCheck && SKIPS[key].check(meta))
        .map((reason) => reason[0]);
}
